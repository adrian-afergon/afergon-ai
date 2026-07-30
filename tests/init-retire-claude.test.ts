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

  it("preserves user-owned Claude files with the remaining init flags", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const claudeFile = path.join(tempRoot, "CLAUDE.md");
    const claudeSkill = path.join(tempRoot, ".claude", "skills", "custom", "SKILL.md");
    fs.mkdirSync(path.dirname(claudeSkill), { recursive: true });
    fs.writeFileSync(claudeFile, "user-owned Claude instructions\n");
    fs.writeFileSync(claudeSkill, "user-owned Claude skill\n");

    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--pi", "--opencode"], "4");

    expect(result.status, result.stderr).toBe(0);
    expect(fs.readFileSync(claudeFile, "utf8")).toBe("user-owned Claude instructions\n");
    expect(fs.readFileSync(claudeSkill, "utf8")).toBe("user-owned Claude skill\n");
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

  it("updates Pi and OpenCode without touching user-owned Claude files", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeAgents = path.join(xdgHome, "opencode", "agents");
    const claudeFile = path.join(tempRoot, "CLAUDE.md");
    const claudeSkill = path.join(tempRoot, ".claude", "skills", "custom", "SKILL.md");
    fs.mkdirSync(path.join(tempRoot, ".pi"), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"), "stale Pi prompt\n");
    fs.mkdirSync(path.dirname(claudeSkill), { recursive: true });
    fs.writeFileSync(claudeFile, "user-owned Claude instructions\n");
    fs.writeFileSync(claudeSkill, "user-owned Claude skill\n");
    fs.mkdirSync(opencodeAgents, { recursive: true });
    fs.mkdirSync(path.join(xdgHome, "opencode", "commands"), { recursive: true });
    fs.writeFileSync(path.join(opencodeAgents, "afergon-ai.md"), "stale OpenCode agent\n");

    const result = runBash("update.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, [], "y");

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("Pi: updated .pi/APPEND_SYSTEM.md");
    expect(result.stdout).toContain("OpenCode: updated");
    expect(fs.readFileSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"), "utf8")).not.toBe("stale Pi prompt\n");
    expect(fs.readFileSync(path.join(opencodeAgents, "afergon-ai.md"), "utf8")).toBe(
      fs.readFileSync(path.join(repoRoot, "adapters", "opencode", "agents", "afergon-ai.md"), "utf8"),
    );
    expect(fs.existsSync(path.join(opencodeAgents, "afg-review.md"))).toBe(true);
    expect(fs.readFileSync(claudeFile, "utf8")).toBe("user-owned Claude instructions\n");
    expect(fs.readFileSync(claudeSkill, "utf8")).toBe("user-owned Claude skill\n");
  });

  it("packs Pi and OpenCode adapter surfaces without a Claude adapter", () => {
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
    const claudeFile = path.join(tempRoot, "CLAUDE.md");
    const claudeSkill = path.join(tempRoot, ".claude", "skills", "custom", "SKILL.md");
    fs.mkdirSync(path.dirname(claudeSkill), { recursive: true });
    fs.writeFileSync(claudeFile, "user-owned Claude instructions\n");
    fs.writeFileSync(claudeSkill, "user-owned Claude skill\n");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--all"], "4");

    expect(result.status, result.stderr).toBe(0);
    expect(fs.readFileSync(claudeFile, "utf8")).toBe("user-owned Claude instructions\n");
    expect(fs.readFileSync(claudeSkill, "utf8")).toBe("user-owned Claude skill\n");
    expect(fs.existsSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(true);
  });

  it.runIf(process.platform === "win32")("updates Pi and OpenCode without touching user-owned Claude files", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeAgents = path.join(xdgHome, "opencode", "agents");
    const claudeFile = path.join(tempRoot, "CLAUDE.md");
    const claudeSkill = path.join(tempRoot, ".claude", "skills", "custom", "SKILL.md");
    fs.mkdirSync(path.join(tempRoot, ".pi"), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"), "stale Pi prompt\n");
    fs.mkdirSync(path.dirname(claudeSkill), { recursive: true });
    fs.writeFileSync(claudeFile, "user-owned Claude instructions\n");
    fs.writeFileSync(claudeSkill, "user-owned Claude skill\n");
    fs.mkdirSync(opencodeAgents, { recursive: true });
    fs.mkdirSync(path.join(xdgHome, "opencode", "commands"), { recursive: true });
    fs.writeFileSync(path.join(opencodeAgents, "afergon-ai.md"), "stale OpenCode agent\n");

    const result = runPowerShell("update.ps1", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("OK  Pi: updated");
    expect(result.stdout).toContain("OK  OpenCode: updated");
    expect(fs.readFileSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"), "utf8")).not.toBe("stale Pi prompt\n");
    expect(fs.readFileSync(path.join(opencodeAgents, "afergon-ai.md"), "utf8")).toBe(
      fs.readFileSync(path.join(repoRoot, "adapters", "opencode", "agents", "afergon-ai.md"), "utf8"),
    );
    expect(fs.readFileSync(claudeFile, "utf8")).toBe("user-owned Claude instructions\n");
    expect(fs.readFileSync(claudeSkill, "utf8")).toBe("user-owned Claude skill\n");
  });
});
