import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { captureIndexManifest, resolveCommonDir } from "../scripts/lib/review-receipt/manifest.js";
import { sanitizeGitEnvironment } from "../scripts/lib/review-receipt/git.js";

const roots: string[] = [];
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const write = (root: string, file: string, value: string) => writeFileSync(path.join(root, file), value);

function repo() {
  const root = mkdtempSync(path.join(os.tmpdir(), "afergon-receipt-"));
  roots.push(root);
  git(root, "init", "-q");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "Test");
  write(root, "removed.txt", "old\n"); write(root, "changed.txt", "before\n");
  git(root, "add", "."); git(root, "commit", "-qm", "base");
  return root;
}

afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }))); 

describe("staged review receipt manifest", () => {
  it("binds HEAD and sorted staged add, modify, delete, mode, and symlink entries", () => {
    const root = repo();
    write(root, "changed.txt", "staged\n"); write(root, "added.txt", "new\n");
    write(root, "executable.sh", "#!/bin/sh\n"); chmodSync(path.join(root, "executable.sh"), 0o755);
    symlinkSync("changed.txt", path.join(root, "link"));
    git(root, "rm", "-q", "removed.txt"); git(root, "add", ".");
    const manifest = captureIndexManifest(root);
    expect(manifest.headOid).toBe(git(root, "rev-parse", "HEAD"));
    expect(manifest.entries.map((entry) => [entry.path, entry.change, entry.oldMode, entry.newMode])).toEqual([
      ["added.txt", "A", "000000", "100644"], ["changed.txt", "M", "100644", "100644"],
      ["executable.sh", "A", "000000", "100755"], ["link", "A", "000000", "120000"],
      ["removed.txt", "D", "100644", "000000"],
    ]);
    expect(manifest.entries.find((entry) => entry.path === "link")?.blobOid).toMatch(/^[0-9a-f]{40}$/);
    expect(manifest.candidateDigest).not.toBe(manifest.scopeDigest);
  });

  it("uses the index, not divergent worktree content, and changes bindings when HEAD changes", () => {
    const root = repo(); write(root, "changed.txt", "indexed\n"); git(root, "add", "changed.txt");
    const indexed = captureIndexManifest(root); write(root, "changed.txt", "worktree only\n");
    expect(captureIndexManifest(root).candidateDigest).toBe(indexed.candidateDigest);
    git(root, "commit", "-qm", "advance"); write(root, "changed.txt", "next\n"); git(root, "add", "changed.txt");
    expect(captureIndexManifest(root).candidateDigest).not.toBe(indexed.candidateDigest);
  });

  it("binds executable mode and symlink target in candidate digests without changing their path scope", () => {
    const executable = repo();
    write(executable, "tool", "#!/bin/sh\n"); git(executable, "add", "tool");
    const nonExecutableManifest = captureIndexManifest(executable);
    chmodSync(path.join(executable, "tool"), 0o755); git(executable, "add", "tool");
    const executableManifest = captureIndexManifest(executable);
    expect(executableManifest.candidateDigest).not.toBe(nonExecutableManifest.candidateDigest);
    expect(executableManifest.scopeDigest).toBe(nonExecutableManifest.scopeDigest);

    const links = repo();
    symlinkSync("changed.txt", path.join(links, "link")); git(links, "add", "link");
    const firstTarget = captureIndexManifest(links);
    rmSync(path.join(links, "link")); symlinkSync("removed.txt", path.join(links, "link")); git(links, "add", "link");
    const changedTarget = captureIndexManifest(links);
    expect(changedTarget.candidateDigest).not.toBe(firstTarget.candidateDigest);
    expect(changedTarget.scopeDigest).toBe(firstTarget.scopeDigest);
  });

  it("preserves deleted symlinks as symlink scope and fails closed for unresolved common directories", () => {
    const root = repo();
    symlinkSync("changed.txt", path.join(root, "gone-link")); git(root, "add", "gone-link"); git(root, "commit", "-qm", "add link");
    git(root, "rm", "-q", "gone-link");
    const manifest = captureIndexManifest(root);
    expect(manifest.entries).toContainEqual({ path: "gone-link", change: "D", oldMode: "120000", newMode: "000000" });
    const regular = repo();
    write(regular, "gone-link", "regular\n"); git(regular, "add", "gone-link"); git(regular, "commit", "-qm", "add regular");
    git(regular, "rm", "-q", "gone-link");
    expect(manifest.scopeDigest).not.toBe(captureIndexManifest(regular).scopeDigest);
    expect(() => resolveCommonDir(root, ".git", () => { throw new Error("filesystem failure"); })).toThrow("git-unavailable");
  });

  it("orders manifest paths bytewise without consulting the process locale", () => {
    const root = repo();
    write(root, "Z.txt", "upper\n"); write(root, "a.txt", "lower\n"); write(root, "ä.txt", "umlaut\n");
    git(root, "add", "Z.txt", "a.txt", "ä.txt");
    const localeCompare = String.prototype.localeCompare;
    String.prototype.localeCompare = () => { throw new Error("locale comparison must not determine manifest order"); };
    try {
      expect(captureIndexManifest(root).entries.map((entry) => entry.path)).toEqual(["Z.txt", "a.txt", "ä.txt"]);
    } finally {
      String.prototype.localeCompare = localeCompare;
    }
  });

  it("fails closed for empty, unborn, and unmerged indexes", () => {
    const root = repo(); expect(() => captureIndexManifest(root)).toThrow("empty-index-delta");
    const unborn = mkdtempSync(path.join(os.tmpdir(), "afergon-unborn-")); roots.push(unborn); git(unborn, "init", "-q");
    write(unborn, "new.txt", "new\n"); git(unborn, "add", "new.txt"); expect(() => captureIndexManifest(unborn)).toThrow("unborn-head");
    const base = git(root, "branch", "--show-current");
    write(root, "changed.txt", "ours\n"); git(root, "checkout", "-qb", "other"); git(root, "add", "."); git(root, "commit", "-qm", "other"); git(root, "checkout", "-q", base);
    write(root, "changed.txt", "theirs\n"); git(root, "add", "."); git(root, "commit", "-qm", "master");
    expect(() => git(root, "merge", "other", "--no-edit")).toThrow(); expect(() => captureIndexManifest(root)).toThrow("unmerged-index");
  });

  it("uses a real common directory in linked worktrees and ignores hostile Git selection/config overrides", () => {
    const root = repo(); const linked = path.join(path.dirname(root), `${path.basename(root)}-linked`);
    git(root, "worktree", "add", "-qb", "linked", linked); roots.push(linked);
    write(linked, "linked.txt", "staged\n"); git(linked, "add", "linked.txt");
    const clean = captureIndexManifest(linked);
    const hostile = captureIndexManifest(linked, {
      GIT_DIR: "/nope", GIT_WORK_TREE: "/nope", GIT_INDEX_FILE: "/nope", GIT_COMMON_DIR: "/nope",
      GIT_OBJECT_DIRECTORY: "/nope", GIT_ALTERNATE_OBJECT_DIRECTORIES: "/nope", GIT_CEILING_DIRECTORIES: "/",
      GIT_DISCOVERY_ACROSS_FILESYSTEM: "1", GIT_IMPLICIT_WORK_TREE: "0", GIT_CONFIG_PARAMETERS: "core.bare=true",
      GIT_CONFIG_GLOBAL: "/nope", GIT_CONFIG_SYSTEM: "/nope", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "core.bare", GIT_CONFIG_VALUE_0: "true",
      GIT_NAMESPACE: "hostile", GIT_SHALLOW_FILE: "/nope", GIT_GRAFT_FILE: "/nope",
      GIT_REPLACE_REF_BASE: "refs/replace/hostile/", GIT_NO_REPLACE_OBJECTS: "1",
    });
    expect(hostile).toMatchObject({ commonDir: clean.commonDir, candidateDigest: clean.candidateDigest, scopeDigest: clean.scopeDigest });
    expect(sanitizeGitEnvironment({ SSH_AUTH_SOCK: "credential", GIT_CONFIG_KEY_0: "x", GIT_CONFIG_VALUE_0: "y" })).toMatchObject({ SSH_AUTH_SOCK: "credential" });
    expect(sanitizeGitEnvironment({ GIT_CONFIG_KEY_0: "x", GIT_CONFIG_VALUE_0: "y" }).GIT_CONFIG_KEY_0).toBeUndefined();
    expect(sanitizeGitEnvironment({ GIT_NAMESPACE: "hostile", GIT_SHALLOW_FILE: "/nope", GIT_GRAFT_FILE: "/nope", GIT_REPLACE_REF_BASE: "refs/replace/", GIT_NO_REPLACE_OBJECTS: "1" })).not.toMatchObject({ GIT_NAMESPACE: "hostile", GIT_SHALLOW_FILE: "/nope", GIT_GRAFT_FILE: "/nope", GIT_REPLACE_REF_BASE: "refs/replace/", GIT_NO_REPLACE_OBJECTS: "1" });
  });

  it("uses the trusted Git executable even when PATH supplies a forged candidate", () => {
    const root = repo(); write(root, "changed.txt", "staged\n"); git(root, "add", "changed.txt");
    const clean = captureIndexManifest(root);
    const fakeBin = mkdtempSync(path.join(os.tmpdir(), "afergon-fake-git-")); roots.push(fakeBin);
    const fakeGit = path.join(fakeBin, "git");
    writeFileSync(fakeGit, "#!/bin/sh\nprintf 'true\\n'\n"); chmodSync(fakeGit, 0o755);
    expect(captureIndexManifest(root, { PATH: fakeBin })).toMatchObject({
      commonDir: clean.commonDir, candidateDigest: clean.candidateDigest, scopeDigest: clean.scopeDigest,
    });
  });

  it("preserves distinct non-UTF-8 pathname bytes through manifest hashing", () => {
    const root = repo();
    const first = Buffer.from([0x80, 0x2e, 0x74, 0x78, 0x74]);
    const second = Buffer.from([0x81, 0x2e, 0x74, 0x78, 0x74]);
    const oid = execFileSync("/usr/bin/git", ["hash-object", "-w", "--stdin"], { cwd: root, input: "contents\n", encoding: "utf8" }).trim();
    execFileSync("/usr/bin/git", ["update-index", "-z", "--add", "--index-info"], {
      cwd: root,
      input: Buffer.concat([
        Buffer.from(`100644 ${oid}\t`), first, Buffer.from("\0"),
        Buffer.from(`100644 ${oid}\t`), second, Buffer.from("\0"),
      ]),
    });
    expect(captureIndexManifest(root).entries.map((entry) => entry.rawPath)).toEqual([first, second]);
  });

  it("rejects intent-to-add entries even when an ordinary staged delta exists", () => {
    const root = repo(); write(root, "changed.txt", "staged\n"); write(root, "intent.txt", "intent\n");
    git(root, "add", "changed.txt"); git(root, "add", "--intent-to-add", "intent.txt");
    expect(() => captureIndexManifest(root)).toThrow("intent-to-add");
  });
});
