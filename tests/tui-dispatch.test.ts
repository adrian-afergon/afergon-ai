import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import type { DispatchRequest } from "../scripts/lib/cli-dispatch-core.js";

import {
  buildExecution,
  formatHelp,
  resolveDispatchPlan,
} from "../scripts/cli-dispatch.js";
import * as dispatchCoreRuntime from "../scripts/lib/cli-dispatch-core.mjs";
import * as dispatchCoreTypeScript from "../scripts/lib/cli-dispatch-core.js";

const repoRoot = path.resolve(import.meta.dirname, "..");
const dispatcherPath = path.join(repoRoot, "dist", "scripts", "cli-dispatch.js");
const packageMetadata = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));

function executeDispatcher(argv: readonly string[]) {
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
  const dispatchCases: Array<{ name: string; input: DispatchRequest }> = [
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
      args: [path.join(repoRoot, "scripts/models.js"), "show", "budget"],
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

  it("routes Windows doctor through its native PowerShell verifier without requiring bash", () => {
    expect(
      buildExecution(
        { kind: "command", command: "doctor", forwardedArgs: ["--opencode"] },
        { packageRoot: repoRoot, cwd: "C:\\work\\demo", platform: "win32" },
      ),
    ).toEqual({
      command: "powershell.exe",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.join(repoRoot, "scripts/verify-install.ps1"),
        "--opencode",
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
  it("keeps the POSIX launcher delegated to the built shared dispatcher", () => {
    const launcher = fs.readFileSync(path.join(repoRoot, "bin/afergon-ai"), "utf8");

    expect(launcher).toContain('RUNTIME_ENTRYPOINT="$PACKAGE_ROOT/dist/scripts/cli-dispatch.js"');
    expect(launcher).toContain('exec node "$RUNTIME_ENTRYPOINT" "$@"');
  });

  it("keeps the Windows launcher delegated to dist with safe %* forwarding", () => {
    const launcher = fs.readFileSync(path.join(repoRoot, "bin/afergon-ai.cmd"), "utf8");

    expect(launcher).toContain('dist\\scripts\\cli-dispatch.js');
    expect(launcher).toContain("setlocal DisableDelayedExpansion");
    expect(launcher).toContain('node "%RUNTIME_ENTRYPOINT%" %*');
    expect(launcher).not.toMatch(/%2|%3|%4|%5/);
  });

  it("fails before Node starts when the package has not been built", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-ai-unbuilt-"));
    const fixtureBin = path.join(fixtureRoot, "bin");
    fs.mkdirSync(fixtureBin);
    fs.copyFileSync(path.join(repoRoot, "bin/afergon-ai"), path.join(fixtureBin, "afergon-ai"));

    try {
      const result = spawnSync("bash", [path.join(fixtureBin, "afergon-ai"), "--help"], {
        cwd: fixtureRoot,
        encoding: "utf8",
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("afergon-ai has not been built yet.");
      expect(result.stderr).toContain("pnpm build");
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it.runIf(process.platform === "win32")("executes the Windows launcher against a built runtime", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-ai-built-windows-"));
    const fixtureBin = path.join(fixtureRoot, "bin");
    fs.mkdirSync(fixtureBin);
    fs.copyFileSync(path.join(repoRoot, "bin", "afergon-ai.cmd"), path.join(fixtureBin, "afergon-ai.cmd"));
    fs.cpSync(path.join(repoRoot, "dist"), path.join(fixtureRoot, "dist"), { recursive: true });

    try {
      const result = spawnSync("cmd.exe", ["/d", "/s", "/c", `"${path.join(fixtureBin, "afergon-ai.cmd")}" --help`], {
        cwd: fixtureRoot,
        encoding: "utf8",
        env: { ...process.env, AFERGON_AI_FORCE_TTY: "0", CI: "true" },
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toBe(formatHelp());
      expect(result.stderr).toBe("");
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it.runIf(process.platform === "win32")("forwards exclamation marks to the built dispatcher unchanged", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-ai-windows-argv-"));
    const fixtureBin = path.join(fixtureRoot, "bin");
    const fixtureDistScripts = path.join(fixtureRoot, "dist", "scripts");
    const capturePath = path.join(fixtureRoot, "argv.json");
    const probePath = path.join(fixtureRoot, "capture-argv.mjs");
    const mockNodePath = path.join(fixtureRoot, "node.cmd");
    fs.mkdirSync(fixtureBin, { recursive: true });
    fs.mkdirSync(fixtureDistScripts, { recursive: true });
    fs.copyFileSync(path.join(repoRoot, "bin", "afergon-ai.cmd"), path.join(fixtureBin, "afergon-ai.cmd"));
    fs.writeFileSync(path.join(fixtureDistScripts, "cli-dispatch.js"), "");
    fs.writeFileSync(probePath, 'import { writeFileSync } from "node:fs";\nwriteFileSync(process.env.ARG_CAPTURE, JSON.stringify(process.argv.slice(3)));\n');
    fs.writeFileSync(
      mockNodePath,
      `@echo off\r\nsetlocal DisableDelayedExpansion\r\n"${process.execPath}" "${probePath}" %*\r\nexit /b %ERRORLEVEL%\r\n`,
    );

    try {
      const result = spawnSync(
        "cmd.exe",
        ["/d", "/s", "/c", `"${path.join(fixtureBin, "afergon-ai.cmd")}" models "value!bang!" "with spaces"`],
        {
          cwd: fixtureRoot,
          encoding: "utf8",
          env: { ...process.env, ARG_CAPTURE: capturePath, PATH: `${fixtureRoot};${process.env.PATH}` },
        },
      );

      expect(result.status).toBe(0);
      expect(JSON.parse(fs.readFileSync(capturePath, "utf8"))).toEqual(["models", "value!bang!", "with spaces"]);
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it.runIf(process.platform === "win32")("fails the Windows launcher before Node starts when the package is unbuilt", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-ai-unbuilt-windows-"));
    const fixtureBin = path.join(fixtureRoot, "bin");
    fs.mkdirSync(fixtureBin);
    fs.copyFileSync(path.join(repoRoot, "bin", "afergon-ai.cmd"), path.join(fixtureBin, "afergon-ai.cmd"));

    try {
      const result = spawnSync("cmd.exe", ["/d", "/s", "/c", `"${path.join(fixtureBin, "afergon-ai.cmd")}" --help`], {
        cwd: fixtureRoot,
        encoding: "utf8",
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("afergon-ai has not been built yet.");
      expect(result.stderr).toContain("pnpm build");
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});

describe("package build lifecycle", () => {
  it("builds the ignored dist runtime before package creation and documents consumer installation accurately", () => {
    expect(packageMetadata.scripts.prepack).toBe("pnpm run build");

    const readme = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
    expect(readme).toContain("The published package already includes the generated `dist/` runtime.");
    expect(readme).not.toContain("From the afergon-ai package root, run:\n\n```bash\npnpm build\nafergon-ai --help");
  });

  it("packs a clean checkout with standalone dispatcher runtime and declarations", () => {
    const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-ai-pack-"));
    const archiveDirectory = path.join(fixtureRoot, "archives");
    const extractionDirectory = path.join(fixtureRoot, "extracted");
    const distDirectory = path.join(repoRoot, "dist");
    fs.mkdirSync(archiveDirectory);
    fs.mkdirSync(extractionDirectory);

    try {
      fs.rmSync(distDirectory, { recursive: true, force: true });

      const packResult = spawnSync(pnpmCommand, ["pack", "--pack-destination", archiveDirectory], {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: 120000,
      });
      expect(packResult.status).toBe(0);

      const archives = fs.readdirSync(archiveDirectory).filter((entry) => entry.endsWith(".tgz"));
      expect(archives).toHaveLength(1);
      const archivePath = path.join(archiveDirectory, archives[0]);
      const archiveContents = spawnSync("tar", ["-tzf", archivePath], { encoding: "utf8", timeout: 120000 });
      expect(archiveContents.status).toBe(0);
      expect(archiveContents.stdout).toContain("package/dist/scripts/cli-dispatch.js");
      expect(archiveContents.stdout).toContain("package/dist/scripts/models.js");
      expect(archiveContents.stdout).toContain("package/dist/scripts/lib/cli-dispatch-core.js");
      expect(archiveContents.stdout).toContain("package/dist/scripts/tui.js");
      expect(archiveContents.stdout).not.toContain("package/dist/scripts/tui.mjs");

      const extractionResult = spawnSync("tar", ["-xzf", archivePath, "-C", extractionDirectory], {
        encoding: "utf8",
        timeout: 120000,
      });
      expect(extractionResult.status).toBe(0);

      const extractedPackageRoot = path.join(extractionDirectory, "package");
      fs.rmSync(path.join(extractedPackageRoot, "scripts", "lib"), { recursive: true, force: true });
      expect(fs.existsSync(path.join(extractedPackageRoot, "scripts", "lib"))).toBe(false);
      const extractedDispatcherPath = path.join(extractedPackageRoot, "dist", "scripts", "cli-dispatch.js");
      expect(fs.readFileSync(extractedDispatcherPath, "utf8")).toContain("main();");

      const helpResult = spawnSync(process.execPath, [extractedDispatcherPath, "--help"], {
        cwd: extractionDirectory,
        encoding: "utf8",
        env: { ...process.env, AFERGON_AI_FORCE_TTY: "0", CI: "true" },
      });
      expect(helpResult.status).toBe(0);
      expect(helpResult.stderr).toBe("");
      expect(helpResult.stdout).toBe(formatHelp());

      const externalConsumerDirectory = path.join(fixtureRoot, "consumer");
      const externalConsumerPath = path.join(externalConsumerDirectory, "consumer.mts");
      const installedPackageRoot = path.join(externalConsumerDirectory, "node_modules", "afergon-ai");
      fs.mkdirSync(externalConsumerDirectory, { recursive: true });
      fs.cpSync(extractedPackageRoot, installedPackageRoot, { recursive: true });
      fs.writeFileSync(
        externalConsumerPath,
        [
          'import { buildExecution, formatHelp, resolveDispatchPlan } from "afergon-ai/dist/scripts/cli-dispatch.js";',
          'import type { DispatchPlan } from "afergon-ai/dist/scripts/lib/cli-dispatch-core.js";',
          'const plan: DispatchPlan = resolveDispatchPlan({ argv: ["models"], isInteractiveTTY: false, isCI: true });',
          'const help: string = formatHelp();',
          'const execution = plan.kind === "command" || plan.kind === "tui" ? buildExecution(plan) : undefined;',
          "void help;",
          "void execution;",
          "",
        ].join("\n"),
      );
      const externalConsumerTypecheck = spawnSync(
        pnpmCommand,
        [
          "exec",
          "tsc",
          "--noEmit",
          "--strict",
          "--target",
          "ES2022",
          "--module",
          "NodeNext",
          "--moduleResolution",
          "NodeNext",
          externalConsumerPath,
        ],
        { cwd: repoRoot, encoding: "utf8", timeout: 120000 },
      );
      expect(externalConsumerTypecheck.status).toBe(0);
      expect(externalConsumerTypecheck.stderr).toBe("");
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  }, 120000);
});
