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
  it("does not advertise the retired host in the shipped launcher", () => {
    expect(fs.readFileSync(path.join(repoRoot, "bin", "afergon-ai"), "utf8")).not.toContain("--claude");
  });

  it("exits non-zero and prints a retirement message", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const result = runBash("init-project.sh", tempRoot, { HOME: home }, ["--claude"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--claude is retired");
    expect(result.stderr).toContain("--opencode");
    expect(fs.existsSync(path.join(tempRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".claude"))).toBe(false);
    expect(fs.existsSync(home)).toBe(false);
  });

  it("does not create Claude artifacts with --claude", () => {
    const tempRoot = makeTempRoot();
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home") }, ["--claude"]);

    expect(result.status).not.toBe(0);
    expect(fs.existsSync(path.join(tempRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".claude"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(false);
  });

  it("keeps --opencode behavior intact", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--opencode"], "4");

    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(path.join(tempRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(true);
  });

  it("preserves user-owned Claude files with --opencode", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const claudeFile = path.join(tempRoot, "CLAUDE.md");
    const claudeSkill = path.join(tempRoot, ".claude", "skills", "custom", "SKILL.md");
    fs.mkdirSync(path.dirname(claudeSkill), { recursive: true });
    fs.writeFileSync(claudeFile, "user-owned Claude instructions\n");
    fs.writeFileSync(claudeSkill, "user-owned Claude skill\n");

    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--opencode"], "4");

    expect(result.status, result.stderr).toBe(0);
    expect(fs.readFileSync(claudeFile, "utf8")).toBe("user-owned Claude instructions\n");
    expect(fs.readFileSync(claudeSkill, "utf8")).toBe("user-owned Claude skill\n");
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(true);
  });

  it("rejects --claude even when combined with --opencode", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--opencode", "--claude"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--claude is retired");
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(false);
  });

  it("rejects --claude in any position", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: home, XDG_CONFIG_HOME: xdgHome }, ["--opencode", "--claude"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--claude is retired");
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(false);
    expect(fs.existsSync(home)).toBe(false);
    expect(fs.existsSync(xdgHome)).toBe(false);
  });

  it("packs OpenCode adapter surfaces without a Claude adapter", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as { files: string[] };

    expect(packageJson.files).toContain("adapters/");
    expect(fs.existsSync(path.join(repoRoot, "adapters", "opencode", "opencode.json"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, "adapters", "opencode", "agents", "afergon-ai.md"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, "adapters", "claude"))).toBe(false);
  });
});

describe("PowerShell init --claude rejection", () => {
  it.runIf(process.platform === "win32")("exits non-zero and prints a retirement message", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: home }, ["--claude"]);

    expect(result.status).not.toBe(0);
    const output = result.stderr + result.stdout;
    expect(output).toContain("--claude is retired");
    expect(output).toContain("--opencode");
    expect(fs.existsSync(path.join(tempRoot, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, ".claude"))).toBe(false);
    expect(fs.existsSync(home)).toBe(false);
  });

});
