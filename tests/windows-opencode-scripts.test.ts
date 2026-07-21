import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");
const adapterPath = path.join(repoRoot, "adapters", "opencode");
const tempRoots: string[] = [];

afterEach(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function makeTempRoot(): string {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-windows-opencode-"));
  tempRoots.push(tempRoot);
  return tempRoot;
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

function runWindowsLauncher(args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  return spawnSync("cmd.exe", ["/d", "/c", path.join(repoRoot, "bin", "afergon-ai.cmd"), ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 15000,
  });
}

function copyCurrentManagedFiles(xdgHome: string): void {
  for (const directory of ["agents", "commands"]) {
    const sourceDir = path.join(adapterPath, directory);
    const destinationDir = path.join(xdgHome, "opencode", directory);
    fs.mkdirSync(destinationDir, { recursive: true });
    for (const file of fs.readdirSync(sourceDir)) {
      fs.copyFileSync(path.join(sourceDir, file), path.join(destinationDir, file));
    }
  }
}

describe("Windows OpenCode scripts", () => {
  it.runIf(process.platform === "win32")("initializes current managed agents under XDG_CONFIG_HOME", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--opencode"], "4");

    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(path.join(xdgHome, "opencode", "agents", "afergon-ai.md"))).toBe(true);
    expect(fs.existsSync(path.join(xdgHome, "opencode", "commands", "afg-review.md"))).toBe(true);
  });

  it.runIf(process.platform === "win32")("updates current managed agents instead of requiring the legacy orchestrator marker", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    copyCurrentManagedFiles(xdgHome);
    const agentPath = path.join(xdgHome, "opencode", "agents", "afergon-ai.md");
    fs.writeFileSync(agentPath, "outdated agent");

    const result = runWindowsLauncher(["update"], tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("OK  OpenCode: updated");
    expect(result.stdout).not.toContain("agents are not installed");
    expect(fs.readFileSync(agentPath, "utf8")).toBe(fs.readFileSync(path.join(adapterPath, "agents", "afergon-ai.md"), "utf8"));
  });

  it.runIf(process.platform === "win32")("verifies the current managed agent and command names", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const fixtureBin = path.join(tempRoot, "bin");
    fs.mkdirSync(path.join(tempRoot, "scripts"), { recursive: true });
    fs.mkdirSync(fixtureBin, { recursive: true });
    fs.writeFileSync(path.join(fixtureBin, "afergon-ai.cmd"), "@echo off\r\nexit /b 0\r\n");
    fs.copyFileSync(path.join(repoRoot, "scripts", "init-project.ps1"), path.join(tempRoot, "scripts", "init-project.ps1"));
    fs.copyFileSync(path.join(repoRoot, "scripts", "update.ps1"), path.join(tempRoot, "scripts", "update.ps1"));
    copyCurrentManagedFiles(xdgHome);

    const result = runPowerShell("verify-install.ps1", tempRoot, {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: xdgHome,
      PATH: `${fixtureBin};${process.env.PATH ?? ""}`,
    }, ["--opencode"]);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("OpenCode: agentes y comandos esperados presentes y legibles.");
  });
});
