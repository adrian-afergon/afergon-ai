import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");
const tempRoots: string[] = [];

afterEach(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function makeTempRoot(): string {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-init-retire-claude-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

function runBash(scriptName: string, cwd: string, env: NodeJS.ProcessEnv, args: string[] = [], readHostResponse?: string) {
  const scriptPath = path.join(repoRoot, "scripts", scriptName);
  return spawnSync("bash", [scriptPath, ...args], {
    cwd,
    encoding: "utf8",
    input: readHostResponse === undefined ? undefined : `${readHostResponse}\n`,
    env: { ...process.env, ...env },
    timeout: 15000,
  });
}

function runPowerShell(scriptName: string, cwd: string, env: NodeJS.ProcessEnv, args: string[] = [], readHostResponse?: string) {
  const scriptPath = path.join(repoRoot, "scripts", scriptName).replace(/'/g, "''");
  const scriptArgs = args.map((arg) => `'${arg.replace(/'/g, "''")}'`).join(" ");
  const command = readHostResponse === undefined
    ? ["-File", scriptPath, ...args]
    : ["-Command", `function global:Read-Host { param([string]$Prompt) return '${readHostResponse.replace(/'/g, "''")}' }; & '${scriptPath}' ${scriptArgs}`];

  return spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", ...command],
    { cwd, encoding: "utf8", env: { ...process.env, ...env }, timeout: 15000 },
  );
}

describe("POSIX init --claude rejection", () => {
  it("exits non-zero and prints a retirement message", () => {
    const tempRoot = makeTempRoot();
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home") }, ["--claude"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--claude is retired");
    expect(result.stderr).toContain("--pi");
    expect(result.stderr).toContain("--opencode");
    expect(result.stderr).toContain("--all");
    expect(fs.existsSync(path.join(tempRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".claude"))).toBe(false);
  });

  it("does not create Claude artifacts with --all", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--all"], "4");

    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(path.join(tempRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".claude"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(true);
  });

  it("keeps --pi and --opencode behavior intact", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--pi", "--opencode"], "4");

    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(path.join(tempRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(true);
  });

  it("rejects --claude even when combined with remaining host flags", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--pi", "--claude"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--claude is retired");
    expect(fs.existsSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(false);
  });

  it("rejects --claude in any position", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--opencode", "--claude"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--claude is retired");
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(false);
  });
});

describe("PowerShell init --claude rejection", () => {
  it.runIf(process.platform === "win32")("exits non-zero and prints a retirement message", () => {
    const tempRoot = makeTempRoot();
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: path.join(tempRoot, "home") }, ["--claude"]);

    expect(result.status).not.toBe(0);
    const output = result.stderr + result.stdout;
    expect(output).toContain("--claude is retired");
    expect(output).toContain("--pi");
    expect(output).toContain("--opencode");
    expect(output).toContain("--all");
    expect(fs.existsSync(path.join(tempRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".claude"))).toBe(false);
  });

  it.runIf(process.platform === "win32")("does not create Claude artifacts with --all", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--all"], "4");

    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(path.join(tempRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".claude"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(true);
  });
});
