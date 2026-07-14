import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import {
  buildExecution,
  formatHelp,
  resolveDispatchPlan,
} from "../scripts/cli-dispatch.mjs";
import * as dispatchCoreRuntime from "../scripts/lib/cli-dispatch-core.mjs";
import * as dispatchCoreTypeScript from "../scripts/lib/cli-dispatch-core.ts";

const repoRoot = path.resolve(import.meta.dirname, "..");
const dispatcherPath = path.join(repoRoot, "scripts", "cli-dispatch.mjs");

function executeDispatcher(argv) {
  return spawnSync(process.execPath, [dispatcherPath, ...argv], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      AFERGON_AI_FORCE_TTY: "0",
      CI: "true",
      PATH: "",
    },
  });
}

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

describe("dispatch core TypeScript/runtime parity", () => {
  const dispatchCases = [
    { name: "interactive empty argv", input: { argv: [], isInteractiveTTY: true, isCI: false } },
    { name: "non-interactive empty argv", input: { argv: [], isInteractiveTTY: false, isCI: false } },
    { name: "CI empty argv", input: { argv: [], isInteractiveTTY: true, isCI: true } },
    { name: "long help flag", input: { argv: ["--help"], isInteractiveTTY: true, isCI: false } },
    { name: "short help flag", input: { argv: ["-h"], isInteractiveTTY: false, isCI: true } },
    { name: "interactive TUI with forwarding", input: { argv: ["TuI", "--debug"], isInteractiveTTY: true, isCI: false } },
    { name: "non-interactive TUI", input: { argv: ["tui"], isInteractiveTTY: false, isCI: false } },
    { name: "CI TUI", input: { argv: ["tui"], isInteractiveTTY: true, isCI: true } },
    { name: "init command", input: { argv: ["INIT", "--all"], isInteractiveTTY: false, isCI: true } },
    { name: "doctor command", input: { argv: ["doctor", "--opencode"], isInteractiveTTY: false, isCI: true } },
    { name: "update command", input: { argv: ["update", "--dry-run"], isInteractiveTTY: false, isCI: true } },
    { name: "models command", input: { argv: ["models", "show", "budget"], isInteractiveTTY: false, isCI: true } },
    { name: "unknown command", input: { argv: ["Unknown", "--value"], isInteractiveTTY: false, isCI: true } },
  ];

  it("exports only the public pure dispatch helpers from both implementations", () => {
    expect(Object.keys(dispatchCoreRuntime).sort()).toEqual(["formatHelp", "resolveDispatchPlan"]);
    expect(Object.keys(dispatchCoreTypeScript).sort()).toEqual(["formatHelp", "resolveDispatchPlan"]);
  });

  it.each(dispatchCases)("keeps $name dispatch plans in parity", ({ input }) => {
    expect(dispatchCoreTypeScript.resolveDispatchPlan(input)).toEqual(dispatchCoreRuntime.resolveDispatchPlan(input));
  });

  it("keeps help output in parity including its final newline", () => {
    expect(dispatchCoreTypeScript.formatHelp()).toBe(dispatchCoreRuntime.formatHelp());
    expect(dispatchCoreRuntime.formatHelp()).toMatch(/\n$/);
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

describe("dispatcher CLI wrapper", () => {
  it("writes help to stdout and does not require a runnable runtime command", () => {
    const result = executeDispatcher(["--help"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toBe(formatHelp());
    expect(result.stderr).toBe("");
  });

  it("writes unknown-command errors to stderr and does not spawn a runtime command", () => {
    const result = executeDispatcher(["not-a-command"]);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("Unknown command: not-a-command\nRun 'afergon-ai --help' for usage.\n");
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
