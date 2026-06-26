import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

import {
  normalizeAgentName,
  resolveAssignments,
  SUPPORTED_AGENTS,
} from "../scripts/lib/model-profiles.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const cliPath = path.join(repoRoot, "bin/afergon-ai");
const registerScript = path.join(repoRoot, "scripts/register-opencode-agents.sh");
const adapterPath = path.join(repoRoot, "adapters/opencode");

const tempRoots = [];

afterEach(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function makeTempRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-models-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

function runCli(args, env = {}) {
  return spawnSync(cliPath, ["models", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
    },
  });
}

function runModelsScript(args, env = {}) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts/models.mjs"), ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
    },
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function copyManagedAgents(xdgHome) {
  const agentsDir = path.join(xdgHome, "opencode", "agents");
  fs.mkdirSync(agentsDir, { recursive: true });
  for (const agentName of SUPPORTED_AGENTS) {
    fs.copyFileSync(
      path.join(adapterPath, "agents", `${agentName}.md`),
      path.join(agentsDir, `${agentName}.md`),
    );
  }
  return agentsDir;
}

describe("model profile resolution", () => {
  it("uses the orchestrator model for missing subagent assignments", () => {
    const assignments = resolveAssignments({
      "afergon-ai": "openai/gpt-5.5",
    });

    const implement = assignments.find((entry) => entry.agent === "afg-implement");
    expect(implement).toMatchObject({
      configured: "(unset)",
      effective: "openai/gpt-5.5",
      source: "implicit-inherit",
    });
  });

  it("lets explicit subagent models override inheritance", () => {
    const assignments = resolveAssignments({
      "afergon-ai": "openai/gpt-5.5",
      "afg-review": "github-copilot/gpt-5.4",
    });

    const review = assignments.find((entry) => entry.agent === "afg-review");
    expect(review).toMatchObject({
      configured: "github-copilot/gpt-5.4",
      effective: "github-copilot/gpt-5.4",
      source: "explicit",
    });
  });

  it("preserves runtime defaults when orchestrator is unset or inherit", () => {
    const assignments = resolveAssignments({
      "afergon-ai": "inherit",
      "afg-design": "inherit",
    });

    const orchestrator = assignments.find((entry) => entry.agent === "afergon-ai");
    const design = assignments.find((entry) => entry.agent === "afg-design");

    expect(orchestrator).toMatchObject({
      configured: "inherit",
      effective: null,
      source: "runtime-default",
    });
    expect(design).toMatchObject({
      configured: "inherit",
      effective: null,
      source: "runtime-default",
    });
  });
});

describe("agent aliases", () => {
  it("maps orchestrator aliases to the canonical agent name", () => {
    expect(normalizeAgentName("orchestrator")).toBe("afergon-ai");
    expect(normalizeAgentName("main")).toBe("afergon-ai");
  });

  it("maps shorthand stage aliases to afg-* names", () => {
    expect(normalizeAgentName("implement")).toBe("afg-implement");
    expect(normalizeAgentName("review")).toBe("afg-review");
  });
});

describe("models CLI behavior", () => {
  it("runs show, create, list, set, switch, and delete against an isolated config dir", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "relative-config");
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: configDir,
    };

    const initialShow = runCli(["show"], env);
    expect(initialShow.status).toBe(0);
    expect(initialShow.stdout).toContain(`Config path: ${path.join(configDir, "config.json")}`);
    expect(initialShow.stdout).toContain("Status: no afergon-ai model config yet");

    const createBudget = runCli(["profile", "create", "budget"], env);
    expect(createBudget.status).toBe(0);
    expect(createBudget.stdout).toContain("Created profile 'budget'.");

    const setMain = runCli(["set", "afergon-ai", "openai/gpt-5.5"], env);
    expect(setMain.status).toBe(0);
    expect(setMain.stdout).toContain("Updated profile 'budget': afergon-ai -> openai/gpt-5.5");

    const createFallback = runCli(["profile", "create", "fallback"], env);
    expect(createFallback.status).toBe(0);
    expect(createFallback.stdout).toContain("Seeded from the current afergon-ai profile assignments.");

    const switchFallback = runCli(["switch", "fallback"], env);
    expect(switchFallback.status).toBe(0);
    expect(switchFallback.stdout).toContain("Switched active profile to 'fallback'.");

    const list = runCli(["list"], env);
    expect(list.status).toBe(0);
    expect(list.stdout).toContain("  budget");
    expect(list.stdout).toContain("* fallback");

    const deleteBudget = runCli(["profile", "delete", "budget"], env);
    expect(deleteBudget.status).toBe(0);
    expect(deleteBudget.stdout).toContain("Deleted profile 'budget'.");

    const savedConfig = readJson(path.join(configDir, "config.json"));
    expect(savedConfig.models.activeProfile).toBe("fallback");
    expect(savedConfig.models.profiles.budget).toBeUndefined();
    expect(savedConfig.models.profiles.fallback["afergon-ai"]).toBe("openai/gpt-5.5");
  });

  it("shows resolved assignments for a named profile without switching the active profile", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };

    expect(runCli(["profile", "create", "budget"], env).status).toBe(0);
    expect(runCli(["set", "afergon-ai", "openai/gpt-5.5"], env).status).toBe(0);
    expect(runCli(["profile", "create", "fallback"], env).status).toBe(0);
    expect(runCli(["switch", "fallback"], env).status).toBe(0);
    expect(runCli(["set", "afergon-ai", "openai/gpt-4.1"], env).status).toBe(0);

    const result = runCli(["show", "budget"], env);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Active profile: fallback");
    expect(result.stdout).toContain("Shown profile: budget");
    expect(result.stdout).toContain("- afergon-ai: configured=openai/gpt-5.5, effective=openai/gpt-5.5, source=explicit");
  });

  it("supports profile show as an ergonomic alias", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };

    expect(runCli(["profile", "create", "budget"], env).status).toBe(0);
    expect(runCli(["set", "afergon-ai", "openai/gpt-5.5"], env).status).toBe(0);

    const result = runCli(["profile", "show", "budget"], env);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Shown profile: budget");
    expect(result.stdout).toContain("- afergon-ai: configured=openai/gpt-5.5, effective=openai/gpt-5.5, source=explicit");
  });

  it("passes an absolute afergon-ai config dir into the OpenCode registrar", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "relative-config");
    const xdgHome = path.join(tempRoot, "xdg");
    fs.mkdirSync(path.join(xdgHome, "opencode"), { recursive: true });
    fs.writeFileSync(path.join(xdgHome, "opencode", "opencode.json"), '{"$schema":"https://opencode.ai/config.json"}\n');
    copyManagedAgents(xdgHome);

    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.relative(repoRoot, xdgHome),
      AFERGON_AI_CONFIG_DIR: path.relative(repoRoot, configDir),
    };

    expect(runCli(["profile", "create", "budget"], env).status).toBe(0);
    const setResult = runCli(["set", "afergon-ai", "openai/gpt-5.5"], env);
    expect(setResult.status).toBe(0);
    expect(setResult.stdout).toContain("OpenCode registrations refreshed on disk.");

    const opencodeConfig = readJson(path.join(xdgHome, "opencode", "opencode.json"));
    expect(opencodeConfig.agent["afergon-ai"].model).toBe("openai/gpt-5.5");
    expect(opencodeConfig.agent["afg-implement"].model).toBe("openai/gpt-5.5");
    expect(fs.existsSync(path.join(configDir, "config.json"))).toBe(true);
  });

  it("fails gracefully for malformed model config", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "config");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), "{not-json", "utf8");

    const result = runCli(["show"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: configDir,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("invalid JSON");
    expect(result.stderr).toContain("Repair the file or move it aside");
  });

  it("does not invoke OpenCode registration when managed agent files are missing", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    fs.mkdirSync(path.join(xdgHome, "opencode", "agents"), { recursive: true });
    fs.writeFileSync(path.join(xdgHome, "opencode", "opencode.json"), '{"$schema":"https://opencode.ai/config.json"}\n');
    fs.copyFileSync(
      path.join(adapterPath, "agents", "afergon-ai.md"),
      path.join(xdgHome, "opencode", "agents", "afergon-ai.md"),
    );

    const result = runCli(["set", "afergon-ai", "openai/gpt-5.5"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: xdgHome,
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("OpenCode install is missing managed agent file(s)");
    const opencodeConfig = readJson(path.join(xdgHome, "opencode", "opencode.json"));
    expect(opencodeConfig.agent).toBeUndefined();
  });

  it("saves afergon-ai config and soft-warns when Bash refresh is unavailable", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const configDir = path.join(tempRoot, "config");
    const emptyPath = path.join(tempRoot, "empty-path");
    fs.mkdirSync(path.join(xdgHome, "opencode"), { recursive: true });
    fs.mkdirSync(emptyPath, { recursive: true });
    fs.writeFileSync(path.join(xdgHome, "opencode", "opencode.json"), '{"$schema":"https://opencode.ai/config.json"}\n');
    copyManagedAgents(xdgHome);

    const result = runModelsScript(["set", "afergon-ai", "openai/gpt-5.5"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: xdgHome,
      AFERGON_AI_CONFIG_DIR: configDir,
      PATH: emptyPath,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Updated profile 'default': afergon-ai -> openai/gpt-5.5");
    expect(result.stderr).toContain("OpenCode refresh uses Bash, but bash is unavailable");
    expect(readJson(path.join(configDir, "config.json")).models.profiles.default["afergon-ai"]).toBe(
      "openai/gpt-5.5",
    );
  });

  it("rejects setting an unsupported agent", () => {
    const tempRoot = makeTempRoot();
    const result = runCli(["set", "unknown-agent", "openai/gpt-5.5"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unsupported agent 'unknown-agent'");
  });

  it("rejects switching to an unknown profile", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };

    expect(runCli(["profile", "create", "budget"], env).status).toBe(0);
    const result = runCli(["switch", "missing"], env);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown profile 'missing'. Available profiles: budget");
  });

  it("rejects showing an unknown profile", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };

    expect(runCli(["profile", "create", "budget"], env).status).toBe(0);
    const result = runCli(["show", "missing"], env);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown profile 'missing'. Available profiles: budget");
  });

  it("rejects duplicate profile creation", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };

    expect(runCli(["profile", "create", "budget"], env).status).toBe(0);
    const result = runCli(["profile", "create", "budget"], env);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Profile 'budget' already exists.");
  });

  it("rejects invalid profile names", () => {
    const tempRoot = makeTempRoot();
    const result = runCli(["profile", "create", "bad name"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Profile name must match");
  });

  it("rejects deleting a missing profile", () => {
    const tempRoot = makeTempRoot();
    const result = runCli(["profile", "delete", "missing"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Profile 'missing' does not exist.");
  });

  it("moves active profile to a remaining profile after deleting the active profile", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };

    expect(runCli(["profile", "create", "budget"], env).status).toBe(0);
    expect(runCli(["profile", "create", "fallback"], env).status).toBe(0);
    expect(runCli(["switch", "fallback"], env).status).toBe(0);
    const result = runCli(["profile", "delete", "fallback"], env);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Deleted profile 'fallback'.");
    const savedConfig = readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(savedConfig.models.activeProfile).toBe("budget");
    expect(savedConfig.models.profiles.fallback).toBeUndefined();
  });
});

describe("OpenCode registrar behavior", () => {
  it("skips opencode.json writes when required managed agent files are missing", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeDir = path.join(xdgHome, "opencode");
    fs.mkdirSync(path.join(opencodeDir, "agents"), { recursive: true });
    fs.writeFileSync(path.join(opencodeDir, "opencode.json"), '{"$schema":"https://opencode.ai/config.json"}\n');

    const result = spawnSync("bash", [registerScript, adapterPath], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
        AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("missing managed agent file(s)");
    expect(readJson(path.join(opencodeDir, "opencode.json")).agent).toBeUndefined();
  });

  it("preserves existing model assignments when afergon-ai model config is malformed", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeDir = path.join(xdgHome, "opencode");
    const configDir = path.join(tempRoot, "config");
    fs.mkdirSync(opencodeDir, { recursive: true });
    fs.mkdirSync(configDir, { recursive: true });
    copyManagedAgents(xdgHome);
    fs.writeFileSync(path.join(configDir, "config.json"), "{not-json", "utf8");
    fs.writeFileSync(
      path.join(opencodeDir, "opencode.json"),
      JSON.stringify(
        {
          $schema: "https://opencode.ai/config.json",
          agent: {
            "afergon-ai": {
              prompt: `{file:${path.join(opencodeDir, "agents", "afergon-ai.md")}}`,
              model: "openai/existing-main",
            },
            "afg-implement": {
              prompt: `{file:${path.join(opencodeDir, "agents", "afg-implement.md")}}`,
              model: "openai/existing-implement",
            },
          },
        },
        null,
        2,
      ),
    );

    const result = spawnSync("bash", [registerScript, adapterPath], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
        AFERGON_AI_CONFIG_DIR: configDir,
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("preserving existing managed model assignments");
    const opencodeConfig = readJson(path.join(opencodeDir, "opencode.json"));
    expect(opencodeConfig.agent["afergon-ai"].model).toBe("openai/existing-main");
    expect(opencodeConfig.agent["afg-implement"].model).toBe("openai/existing-implement");
  });

  it("removes stale model assignments when a valid active profile resolves to runtime defaults", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeDir = path.join(xdgHome, "opencode");
    const configDir = path.join(tempRoot, "config");
    fs.mkdirSync(opencodeDir, { recursive: true });
    fs.mkdirSync(configDir, { recursive: true });
    copyManagedAgents(xdgHome);
    fs.writeFileSync(
      path.join(configDir, "config.json"),
      JSON.stringify(
        {
          version: 1,
          models: {
            activeProfile: "default",
            profiles: {
              default: {
                "afergon-ai": "inherit",
                "afg-implement": "inherit",
              },
            },
          },
        },
        null,
        2,
      ),
    );
    fs.writeFileSync(
      path.join(opencodeDir, "opencode.json"),
      JSON.stringify(
        {
          $schema: "https://opencode.ai/config.json",
          agent: {
            "afergon-ai": {
              prompt: `{file:${path.join(opencodeDir, "agents", "afergon-ai.md")}}`,
              model: "openai/stale-main",
            },
            "afg-implement": {
              prompt: `{file:${path.join(opencodeDir, "agents", "afg-implement.md")}}`,
              model: "openai/stale-implement",
            },
          },
        },
        null,
        2,
      ),
    );

    const result = spawnSync("bash", [registerScript, adapterPath], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
        AFERGON_AI_CONFIG_DIR: configDir,
      },
    });

    expect(result.status).toBe(0);
    const opencodeConfig = readJson(path.join(opencodeDir, "opencode.json"));
    expect(opencodeConfig.agent["afergon-ai"].model).toBeUndefined();
    expect(opencodeConfig.agent["afg-implement"].model).toBeUndefined();
  });
});
