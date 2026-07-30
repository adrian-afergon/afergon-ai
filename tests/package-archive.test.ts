import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"),
) as {
  description?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  files?: string[];
  pi?: unknown;
};

const tempRoots: string[] = [];

afterEach(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function runPackDryRun(): string[] {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-pack-"));
  tempRoots.push(tempDir);
  const result = spawnSync("pnpm", ["pack", "--dry-run"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: path.join(tempDir, "npm-cache") },
    timeout: 120000,
  });
  expect(result.status, result.stderr).toBe(0);
  const lines = (result.stdout + result.stderr).split(/\r?\n/);
  const start = lines.findIndex((line) => line === "Tarball Contents");
  const end = lines.findIndex((line) => line === "Tarball Details");
  expect(start, "could not find Tarball Contents header").toBeGreaterThan(-1);
  expect(end, "could not find Tarball Details header").toBeGreaterThan(-1);
  return lines.slice(start + 1, end).map((line) => line.trim()).filter(Boolean);
}

const PROHIBITED_ARCHIVE_PREFIXES = ["extensions/", "prompts/", ".pi/", "dist/extensions/", "dist/prompts/"];

function identifyProhibitedArchiveEntries(entries: readonly string[]): string[] {
  return entries.filter((entry) =>
    PROHIBITED_ARCHIVE_PREFIXES.some((prefix) => entry.startsWith(prefix)),
  );
}

function expectNoProhibitedArchiveEntries(entries: readonly string[]): void {
  const prohibited = identifyProhibitedArchiveEntries(entries);
  expect(prohibited, `prohibited archive entries found: ${prohibited.join(", ")}`).toEqual([]);
}

describe("Pi host package distribution removal", () => {
  it("package metadata does not advertise Pi as a host", () => {
    expect(packageJson).not.toHaveProperty("pi");
    expect(packageJson.keywords ?? []).not.toContain("pi-package");
    expect(packageJson.keywords ?? []).not.toContain("pi");
    expect(packageJson.keywords ?? []).not.toContain("pi-coding-agent");
    expect(packageJson.description ?? "").not.toContain("Pi-native");
    expect(packageJson.peerDependencies ?? {}).not.toHaveProperty(
      "@earendil-works/pi-coding-agent",
    );
    expect(packageJson.devDependencies ?? {}).not.toHaveProperty(
      "@earendil-works/pi-coding-agent",
    );
    expect(packageJson.files ?? []).not.toContain("extensions/");
    expect(packageJson.files ?? []).not.toContain("prompts/");
  });

  it("retains the standalone TUI as a direct runtime dependency", () => {
    expect(packageJson.dependencies ?? {}).toHaveProperty(
      "@earendil-works/pi-tui",
    );
    expect(packageJson.peerDependencies ?? {}).not.toHaveProperty(
      "@earendil-works/pi-tui",
    );
  });

  it("does not distribute Pi-only source directories", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "extensions"))).toBe(false);
    expect(fs.existsSync(path.join(REPO_ROOT, "prompts"))).toBe(false);
    expect(fs.existsSync(path.join(REPO_ROOT, ".pi"))).toBe(false);
  });

  it("packed archive contains OpenCode workflow content and excludes Pi-only artifacts", () => {
    const entries = runPackDryRun();
    const entrySet = new Set(entries);

    expect(entries.some((entry) => entry.startsWith("dist/"))).toBe(true);
    expect(entries.some((entry) => entry.startsWith("adapters/"))).toBe(true);
    expect(entries.some((entry) => entry.startsWith("skills/"))).toBe(true);
    expect(entries.some((entry) => entry.startsWith("bin/"))).toBe(true);
    expect(entries.some((entry) => entry.startsWith("scripts/"))).toBe(true);

    expectNoProhibitedArchiveEntries(entries);
    expect(entrySet.has("dist/prompts/afergon-ai.md")).toBe(false);
    expect(entrySet.has("dist/extensions/startup-banner.js")).toBe(false);
  });

  it("rejects and identifies a prohibited archive entry", () => {
    const syntheticEntries = [
      "adapters/opencode/opencode.json",
      "extensions/startup-banner.js",
      "skills/implement/SKILL.md",
      ".pi/APPEND_SYSTEM.md",
    ];

    const prohibited = identifyProhibitedArchiveEntries(syntheticEntries);
    expect(prohibited).toContain("extensions/startup-banner.js");
    expect(prohibited).toContain(".pi/APPEND_SYSTEM.md");

    expect(() => expectNoProhibitedArchiveEntries(syntheticEntries)).toThrow(/extensions\/startup-banner\.js/);
    expect(() => expectNoProhibitedArchiveEntries(syntheticEntries)).toThrow(/\.pi\/APPEND_SYSTEM\.md/);
  });

  it("preserves historical OpenSpec records and model identifiers containing pi or claude", () => {
    const exploration = fs.readFileSync(
      path.join(REPO_ROOT, "openspec", "changes", "issue-15-tui-mvp", "exploration.md"),
      "utf8",
    );
    expect(exploration).toContain("pi-tui");
    expect(exploration).toContain("extensions/startup-banner.ts");

    const proposal = fs.readFileSync(
      path.join(REPO_ROOT, "openspec", "changes", "issue-15-tui-mvp", "proposal.md"),
      "utf8",
    );
    expect(proposal).toContain("@earendil-works/pi-tui");
  });
});
