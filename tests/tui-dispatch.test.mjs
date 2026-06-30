import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildExecution,
  formatHelp,
  resolveDispatchPlan,
} from "../scripts/cli-dispatch.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");

describe("resolveDispatchPlan", () => {
  it("routes interactive no-argument launches to the TUI", () => {
    expect(resolveDispatchPlan({ argv: [], isInteractiveTTY: true, isCI: false })).toMatchObject({
      kind: "tui",
      forwardedArgs: [],
    });
  });

  it("routes interactive explicit tui launches to the TUI", () => {
    expect(resolveDispatchPlan({ argv: ["tui"], isInteractiveTTY: true, isCI: false })).toMatchObject({
      kind: "tui",
      forwardedArgs: [],
    });
  });

  it("prints help and exits zero for non-interactive no-argument launches", () => {
    expect(resolveDispatchPlan({ argv: [], isInteractiveTTY: false, isCI: false })).toMatchObject({
      kind: "help",
      exitCode: 0,
    });
  });

  it("fails fast for non-interactive explicit tui launches", () => {
    expect(resolveDispatchPlan({ argv: ["tui"], isInteractiveTTY: false, isCI: false })).toMatchObject({
      kind: "error",
      exitCode: 1,
      message: expect.stringContaining("interactive terminal"),
    });
  });

  it("prints help instead of opening the TUI when CI is true even with a TTY", () => {
    expect(resolveDispatchPlan({ argv: [], isInteractiveTTY: true, isCI: true })).toMatchObject({
      kind: "help",
      exitCode: 0,
    });
  });

  it("fails fast for explicit tui launches when CI is true even with a TTY", () => {
    expect(resolveDispatchPlan({ argv: ["tui"], isInteractiveTTY: true, isCI: true })).toMatchObject({
      kind: "error",
      exitCode: 1,
      message: expect.stringContaining("interactive terminal"),
    });
  });

  it("keeps explicit scriptable commands outside the TUI path", () => {
    const plan = resolveDispatchPlan({ argv: ["doctor", "--opencode"], isInteractiveTTY: false, isCI: true });

    expect(plan).toMatchObject({
      kind: "command",
      command: "doctor",
      forwardedArgs: ["--opencode"],
    });
  });

  it("treats explicit help flags as help instead of TUI", () => {
    expect(resolveDispatchPlan({ argv: ["--help"], isInteractiveTTY: true, isCI: false })).toMatchObject({
      kind: "help",
      exitCode: 0,
    });
  });
});

describe("dispatcher execution metadata", () => {
  it("builds argv-array execution metadata for explicit commands", () => {
    expect(
      buildExecution(
        { kind: "command", command: "models", forwardedArgs: ["show", "budget"] },
        { packageRoot: repoRoot, cwd: "/tmp/caller-project", platform: "linux" },
      ),
    ).toEqual({
      command: process.execPath,
      args: [path.join(repoRoot, "scripts/models.mjs"), "show", "budget"],
      cwd: "/tmp/caller-project",
    });
  });

  it("preserves the caller cwd for explicit init commands", () => {
    expect(
      buildExecution(
        { kind: "command", command: "init", forwardedArgs: ["--claude"] },
        { packageRoot: repoRoot, cwd: "/tmp/caller-project", platform: "linux" },
      ),
    ).toEqual({
      command: "bash",
      args: [path.join(repoRoot, "scripts/init-project.sh"), "--claude"],
      cwd: "/tmp/caller-project",
    });
  });

  it("routes Windows init through PowerShell without flattening argv", () => {
    expect(
      buildExecution(
        { kind: "command", command: "init", forwardedArgs: ["--opencode", "profile with spaces"] },
        { packageRoot: repoRoot, cwd: "C:\\work\\demo", platform: "win32" },
      ),
    ).toEqual({
      command: "powershell.exe",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.join(repoRoot, "scripts/init-project.ps1"),
        "--opencode",
        "profile with spaces",
      ],
      cwd: "C:\\work\\demo",
    });
  });

  it("routes Windows update through PowerShell without requiring bash", () => {
    expect(
      buildExecution(
        { kind: "command", command: "update", forwardedArgs: ["--dry-run"] },
        { packageRoot: repoRoot, cwd: "C:\\work\\demo", platform: "win32" },
      ),
    ).toEqual({
      command: "powershell.exe",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.join(repoRoot, "scripts/update.ps1"),
        "--dry-run",
      ],
      cwd: "C:\\work\\demo",
    });
  });

  it("formats help with the explicit tui entrypoint documented", () => {
    expect(formatHelp()).toContain("afergon-ai tui");
  });
});

describe("launcher parity boundaries", () => {
  it("keeps the POSIX launcher delegated to the shared dispatcher", () => {
    const launcher = fs.readFileSync(path.join(repoRoot, "bin/afergon-ai"), "utf8");

    expect(launcher).toContain('exec node "$PACKAGE_ROOT/scripts/cli-dispatch.mjs" "$@"');
  });

  it("keeps the Windows launcher delegated with %* instead of fixed positional forwarding", () => {
    const launcher = fs.readFileSync(path.join(repoRoot, "bin/afergon-ai.cmd"), "utf8");

    expect(launcher).toContain('scripts\\cli-dispatch.mjs" %*');
    expect(launcher).not.toMatch(/%2|%3|%4|%5/);
  });
});
