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
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-init-retire-pi-"));
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

function assertNoProjectArtifacts(tempRoot: string): void {
  expect(fs.existsSync(path.join(tempRoot, ".pi"))).toBe(false);
  expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(false);
  expect(fs.existsSync(path.join(tempRoot, "openspec"))).toBe(false);
}

function assertNoSideEffects(tempRoot: string, env: { HOME?: string; XDG_CONFIG_HOME?: string }): void {
  assertNoProjectArtifacts(tempRoot);

  if (env.HOME) {
    expect(fs.existsSync(env.HOME)).toBe(false);
  }

  if (env.XDG_CONFIG_HOME) {
    expect(fs.existsSync(env.XDG_CONFIG_HOME)).toBe(false);
  }
}

function assertOpenCodeArtifacts(tempRoot: string, xdgHome: string): void {
  expect(fs.existsSync(path.join(tempRoot, "opencode.json"))).toBe(true);
  expect(fs.existsSync(path.join(xdgHome, "opencode", "agents", "afergon-ai.md"))).toBe(true);
  expect(fs.existsSync(path.join(xdgHome, "opencode", "commands", "afg-debate.md"))).toBe(true);
}

describe("POSIX init Pi retirement", () => {
  it("rejects --pi with a retirement error and creates no files", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const result = runBash("init-project.sh", tempRoot, { HOME: home }, ["--pi"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--pi is retired");
    expect(result.stderr).toContain("--opencode");
    assertNoSideEffects(tempRoot, { HOME: home });
  });

  it("rejects --all with a retirement error and creates no files", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const result = runBash("init-project.sh", tempRoot, { HOME: home }, ["--all"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--all is retired");
    expect(result.stderr).toContain("--opencode");
    assertNoSideEffects(tempRoot, { HOME: home });
  });

  it("rejects --claude with an updated retirement error", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const result = runBash("init-project.sh", tempRoot, { HOME: home }, ["--claude"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--claude is retired");
    expect(result.stderr).toContain("--opencode");
    assertNoSideEffects(tempRoot, { HOME: home });
  });

  it("rejects --opencode --pi before side effects", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: home, XDG_CONFIG_HOME: xdgHome }, ["--opencode", "--pi"], "4");

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--pi is retired");
    assertNoSideEffects(tempRoot, { HOME: home, XDG_CONFIG_HOME: xdgHome });
  });

  it("configures OpenCode with no flags", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, [], "4");

    expect(result.status, result.stderr).toBe(0);
    assertOpenCodeArtifacts(tempRoot, xdgHome);
    expect(result.stdout).not.toContain("Which AI tools");
  });

  it("configures OpenCode with --opencode", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runBash("init-project.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--opencode"], "4");

    expect(result.status, result.stderr).toBe(0);
    assertOpenCodeArtifacts(tempRoot, xdgHome);
  });

  it("rejects combined retired flags in any position before side effects", () => {
    const cases = [
      { args: ["--pi", "--opencode"], expected: "--pi is retired" },
      { args: ["--opencode", "--all"], expected: "--all is retired" },
      { args: ["--pi", "--all", "--claude"], expected: "--pi is retired" },
    ];

    for (const { args, expected } of cases) {
      const tempRoot = makeTempRoot();
      const home = path.join(tempRoot, "home");
      const xdgHome = path.join(tempRoot, "xdg");
      const result = runBash(
        "init-project.sh",
        tempRoot,
        { HOME: home, XDG_CONFIG_HOME: xdgHome },
        args,
        "4",
      );

      expect(result.status, result.stderr).not.toBe(0);
      expect(result.stderr).toContain(expected);
      assertNoSideEffects(tempRoot, { HOME: home, XDG_CONFIG_HOME: xdgHome });
    }
  });

  it("preserves a user-owned .pi directory when no managed OpenCode install exists", () => {
    const tempRoot = makeTempRoot();
    const piFile = path.join(tempRoot, ".pi", "APPEND_SYSTEM.md");
    fs.mkdirSync(path.dirname(piFile), { recursive: true });
    fs.writeFileSync(piFile, "user-owned Pi instructions\n");

    const result = runBash("update.sh", tempRoot, { HOME: path.join(tempRoot, "home") }, []);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("OpenCode: not installed");
    expect(fs.readFileSync(piFile, "utf8")).toBe("user-owned Pi instructions\n");
  });

  it("update refreshes OpenCode and preserves user-owned non-OpenCode files", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeAgents = path.join(xdgHome, "opencode", "agents");
    const piFile = path.join(tempRoot, ".pi", "APPEND_SYSTEM.md");
    const claudeFile = path.join(tempRoot, "CLAUDE.md");
    const claudeSkill = path.join(tempRoot, ".claude", "skills", "custom", "SKILL.md");

    fs.mkdirSync(path.dirname(piFile), { recursive: true });
    fs.writeFileSync(piFile, "user-owned Pi instructions\n");
    fs.mkdirSync(path.dirname(claudeSkill), { recursive: true });
    fs.writeFileSync(claudeFile, "user-owned Claude instructions\n");
    fs.writeFileSync(claudeSkill, "user-owned Claude skill\n");
    fs.mkdirSync(opencodeAgents, { recursive: true });
    fs.mkdirSync(path.join(xdgHome, "opencode", "commands"), { recursive: true });
    fs.writeFileSync(path.join(opencodeAgents, "afergon-ai.md"), "stale OpenCode agent\n");

    const result = runBash("update.sh", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, [], "y");

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("OpenCode: updated");
    expect(fs.readFileSync(piFile, "utf8")).toBe("user-owned Pi instructions\n");
    expect(fs.readFileSync(claudeFile, "utf8")).toBe("user-owned Claude instructions\n");
    expect(fs.readFileSync(claudeSkill, "utf8")).toBe("user-owned Claude skill\n");
    expect(fs.readFileSync(path.join(opencodeAgents, "afergon-ai.md"), "utf8")).toBe(
      fs.readFileSync(path.join(repoRoot, "adapters", "opencode", "agents", "afergon-ai.md"), "utf8"),
    );
    expect(fs.existsSync(path.join(opencodeAgents, "afg-review.md"))).toBe(true);
  });
});

describe("PowerShell init Pi retirement", () => {
  it.runIf(process.platform === "win32")("rejects --pi with a retirement error and creates no files", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: home }, ["--pi"]);

    expect(result.status).not.toBe(0);
    const output = result.stderr + result.stdout;
    expect(output).toContain("--pi is retired");
    expect(output).toContain("--opencode");
    assertNoSideEffects(tempRoot, { HOME: home });
  });

  it.runIf(process.platform === "win32")("rejects --all with a retirement error and creates no files", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: home }, ["--all"]);

    expect(result.status).not.toBe(0);
    const output = result.stderr + result.stdout;
    expect(output).toContain("--all is retired");
    expect(output).toContain("--opencode");
    assertNoSideEffects(tempRoot, { HOME: home });
  });

  it.runIf(process.platform === "win32")("rejects --claude with an updated retirement error", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: home }, ["--claude"]);

    expect(result.status).not.toBe(0);
    const output = result.stderr + result.stdout;
    expect(output).toContain("--claude is retired");
    expect(output).toContain("--opencode");
    assertNoSideEffects(tempRoot, { HOME: home });
  });

  it.runIf(process.platform === "win32")("rejects --opencode --pi before side effects", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: home, XDG_CONFIG_HOME: xdgHome }, ["--opencode", "--pi"], "4");

    expect(result.status).not.toBe(0);
    const output = result.stderr + result.stdout;
    expect(output).toContain("--pi is retired");
    assertNoSideEffects(tempRoot, { HOME: home, XDG_CONFIG_HOME: xdgHome });
  });

  it.runIf(process.platform === "win32")("rejects combined retired flags in any position before side effects", () => {
    const cases = [
      { args: ["--pi", "--opencode"], expected: "--pi is retired" },
      { args: ["--opencode", "--all"], expected: "--all is retired" },
      { args: ["--pi", "--all", "--claude"], expected: "--pi is retired" },
    ];

    for (const { args, expected } of cases) {
      const tempRoot = makeTempRoot();
      const home = path.join(tempRoot, "home");
      const xdgHome = path.join(tempRoot, "xdg");
      const result = runPowerShell(
        "init-project.ps1",
        tempRoot,
        { HOME: home, XDG_CONFIG_HOME: xdgHome },
        args,
        "4",
      );

      expect(result.status, result.stderr + result.stdout).not.toBe(0);
      const output = result.stderr + result.stdout;
      expect(output).toContain(expected);
      assertNoSideEffects(tempRoot, { HOME: home, XDG_CONFIG_HOME: xdgHome });
    }
  });

  it.runIf(process.platform === "win32")("configures OpenCode with no flags", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, [], "4");

    expect(result.status, result.stderr).toBe(0);
    assertOpenCodeArtifacts(tempRoot, xdgHome);
  });

  it.runIf(process.platform === "win32")("configures OpenCode with --opencode", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const result = runPowerShell("init-project.ps1", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome }, ["--opencode"], "4");

    expect(result.status, result.stderr).toBe(0);
    assertOpenCodeArtifacts(tempRoot, xdgHome);
  });

  it.runIf(process.platform === "win32")("update refreshes OpenCode and preserves user-owned non-OpenCode files", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeAgents = path.join(xdgHome, "opencode", "agents");
    const piFile = path.join(tempRoot, ".pi", "APPEND_SYSTEM.md");
    const claudeFile = path.join(tempRoot, "CLAUDE.md");
    const claudeSkill = path.join(tempRoot, ".claude", "skills", "custom", "SKILL.md");

    fs.mkdirSync(path.dirname(piFile), { recursive: true });
    fs.writeFileSync(piFile, "user-owned Pi instructions\n");
    fs.mkdirSync(path.dirname(claudeSkill), { recursive: true });
    fs.writeFileSync(claudeFile, "user-owned Claude instructions\n");
    fs.writeFileSync(claudeSkill, "user-owned Claude skill\n");
    fs.mkdirSync(opencodeAgents, { recursive: true });
    fs.mkdirSync(path.join(xdgHome, "opencode", "commands"), { recursive: true });
    fs.writeFileSync(path.join(opencodeAgents, "afergon-ai.md"), "stale OpenCode agent\n");

    const result = runPowerShell("update.ps1", tempRoot, { HOME: path.join(tempRoot, "home"), XDG_CONFIG_HOME: xdgHome });

    expect(result.status, result.stderr).toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain("OpenCode: updated");
    expect(fs.readFileSync(piFile, "utf8")).toBe("user-owned Pi instructions\n");
    expect(fs.readFileSync(claudeFile, "utf8")).toBe("user-owned Claude instructions\n");
    expect(fs.readFileSync(claudeSkill, "utf8")).toBe("user-owned Claude skill\n");
    expect(fs.readFileSync(path.join(opencodeAgents, "afergon-ai.md"), "utf8")).toBe(
      fs.readFileSync(path.join(repoRoot, "adapters", "opencode", "agents", "afergon-ai.md"), "utf8"),
    );
  });
});
