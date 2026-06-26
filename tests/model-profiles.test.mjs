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

function writeFakeOpencodeCli(tempRoot, handlers = {}) {
  const binDir = path.join(tempRoot, "fake-bin");
  const scriptPath = path.join(binDir, "opencode");
  fs.mkdirSync(binDir, { recursive: true });

  const modelListings = handlers.modelListings ?? {};
  const failingProviders = handlers.failingProviders ?? {};
  const slowProviders = handlers.slowProviders ?? {};
  fs.writeFileSync(
    scriptPath,
    `#!/bin/sh
if [ "$1" != "models" ]; then
  echo "unexpected args: $*" >&2
  exit 64
fi
provider="$2"
case "$provider" in
${Object.entries(slowProviders)
  .map(
    ([provider, delay]) => `  ${provider})
    sleep ${Number(delay)}
    exit 0
    ;;`,
  )
  .join("\n")}
${Object.entries(modelListings)
  .map(
    ([provider, models]) => `  ${provider})
    cat <<'EOF'
${models.join("\n")}
EOF
    exit 0
    ;;`,
  )
  .join("\n")}
${Object.entries(failingProviders)
  .map(
    ([provider, message]) => `  ${provider})
    echo ${JSON.stringify(message)} >&2
    exit 1
    ;;`,
  )
  .join("\n")}
  *)
    exit 0
    ;;
esac
`,
    { mode: 0o755 },
  );

  return binDir;
}

function makeUnavailableOpencodeEnv(tempRoot, env = {}) {
  const fakeBin = path.join(tempRoot, "unavailable-opencode-bin");
  fs.mkdirSync(fakeBin, { recursive: true });
  fs.writeFileSync(
    path.join(fakeBin, "opencode"),
    `#!/bin/sh
echo "opencode unavailable in test" >&2
exit 127
`,
    { mode: 0o755 },
  );
  return {
    ...env,
    PATH: `${fakeBin}:${process.env.PATH}`,
  };
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
    const cliEnv = makeUnavailableOpencodeEnv(tempRoot, env);

    const initialShow = runCli(["show"], cliEnv);
    expect(initialShow.status).toBe(0);
    expect(initialShow.stdout).toContain(`Config path: ${path.join(configDir, "config.json")}`);
    expect(initialShow.stdout).toContain("Status: no afergon-ai model config yet");

    const createBudget = runCli(["profile", "create", "budget"], cliEnv);
    expect(createBudget.status).toBe(0);
    expect(createBudget.stdout).toContain("Created profile 'budget'.");

    const setMain = runCli(["set", "afergon-ai", "openai/gpt-5.5"], cliEnv);
    expect(setMain.status).toBe(0);
    expect(setMain.stdout).toContain("Updated profile 'budget': afergon-ai -> openai/gpt-5.5");

    const createFallback = runCli(["profile", "create", "fallback"], cliEnv);
    expect(createFallback.status).toBe(0);
    expect(createFallback.stdout).toContain("Seeded from the current afergon-ai profile assignments.");

    const switchFallback = runCli(["switch", "fallback"], cliEnv);
    expect(switchFallback.status).toBe(0);
    expect(switchFallback.stdout).toContain("Switched active profile to 'fallback'.");

    const list = runCli(["list"], cliEnv);
    expect(list.status).toBe(0);
    expect(list.stdout).toContain("  budget");
    expect(list.stdout).toContain("* fallback");

    const deleteBudget = runCli(["profile", "delete", "budget"], cliEnv);
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
    const cliEnv = makeUnavailableOpencodeEnv(tempRoot, env);

    expect(runCli(["profile", "create", "budget"], cliEnv).status).toBe(0);
    expect(runCli(["set", "afergon-ai", "openai/gpt-5.5"], cliEnv).status).toBe(0);
    expect(runCli(["profile", "create", "fallback"], cliEnv).status).toBe(0);
    expect(runCli(["switch", "fallback"], cliEnv).status).toBe(0);
    expect(runCli(["set", "afergon-ai", "openai/gpt-5.4"], cliEnv).status).toBe(0);

    const result = runCli(["show", "budget"], cliEnv);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Active profile: fallback");
    expect(result.stdout).toContain("Shown profile: budget");
    expect(result.stdout).toContain("- afergon-ai: configured=openai/gpt-5.5, effective=openai/gpt-5.5, source=explicit");
  });

  it("accepts a known concrete model when OpenCode reports it as available", () => {
    const tempRoot = makeTempRoot();
    const fakeBin = writeFakeOpencodeCli(tempRoot, {
      modelListings: {
        openai: ["openai/gpt-5.4", "openai/gpt-5.5"],
      },
    });

    const result = runModelsScript(["set", "afergon-ai", "openai/gpt-5.5"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
      PATH: `${fakeBin}:${process.env.PATH}`,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Updated profile 'default': afergon-ai -> openai/gpt-5.5");
  });

  it("rejects an unknown concrete model with suggestions by default", () => {
    const tempRoot = makeTempRoot();
    const fakeBin = writeFakeOpencodeCli(tempRoot, {
      modelListings: {
        openai: ["openai/gpt-5.4", "openai/gpt-5.4-fast", "openai/gpt-5.5"],
      },
    });

    const result = runModelsScript(["set", "afergon-ai", "openai/gpt-5.6"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
      PATH: `${fakeBin}:${process.env.PATH}`,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Requested model 'openai/gpt-5.6' is not available from provider 'openai'.");
    expect(result.stderr).toContain("Did you mean:");
    expect(result.stderr).toContain("openai/gpt-5.4");
    expect(result.stderr).toContain("openai/gpt-5.5");
    expect(result.stderr).toContain("openai/gpt-5.4-fast");
    expect(result.stderr).toContain("--allow-unknown");
  });

  it("allows an unknown concrete model with an explicit escape hatch", () => {
    const tempRoot = makeTempRoot();
    const fakeBin = writeFakeOpencodeCli(tempRoot, {
      modelListings: {
        openai: ["openai/gpt-5.4", "openai/gpt-5.5"],
      },
    });

    const result = runModelsScript(["set", "--allow-unknown", "afergon-ai", "openai/gpt-5.6"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
      PATH: `${fakeBin}:${process.env.PATH}`,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("Warning: Requested model 'openai/gpt-5.6' is not available from provider 'openai'.");
    expect(readJson(path.join(tempRoot, "config", "config.json")).models.profiles.default["afergon-ai"]).toBe(
      "openai/gpt-5.6",
    );
  });

  it("rejects a concrete model without provider/model format by default", () => {
    const tempRoot = makeTempRoot();

    const result = runModelsScript(["set", "afergon-ai", "gpt-5.5"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Model 'gpt-5.5' does not use the expected provider/model format.");
    expect(result.stderr).toContain("Use a value like 'openai/gpt-5.5'");
    expect(result.stderr).toContain("--allow-unknown");
    expect(fs.existsSync(path.join(tempRoot, "config", "config.json"))).toBe(false);
  });

  it("allows a custom concrete model without provider/model format with an explicit escape hatch", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "config");

    const result = runModelsScript(["set", "--allow-unknown", "afergon-ai", "openai-gpt-5.5"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: configDir,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("Warning: Model 'openai-gpt-5.5' does not use the expected provider/model format.");
    expect(readJson(path.join(configDir, "config.json")).models.profiles.default["afergon-ai"]).toBe(
      "openai-gpt-5.5",
    );
  });

  it("bypasses availability validation for inherit", () => {
    const tempRoot = makeTempRoot();
    const emptyPath = path.join(tempRoot, "empty-path");
    fs.mkdirSync(emptyPath, { recursive: true });

    const result = runModelsScript(["set", "afergon-ai", "inherit"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
      PATH: emptyPath,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("could not be verified");
    expect(readJson(path.join(tempRoot, "config", "config.json")).models.profiles.default["afergon-ai"]).toBe(
      "inherit",
    );
  });

  it("supports profile show as an ergonomic alias", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };
    const cliEnv = makeUnavailableOpencodeEnv(tempRoot, env);

    expect(runCli(["profile", "create", "budget"], cliEnv).status).toBe(0);
    expect(runCli(["set", "afergon-ai", "openai/gpt-5.5"], cliEnv).status).toBe(0);

    const result = runCli(["profile", "show", "budget"], cliEnv);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Shown profile: budget");
    expect(result.stdout).toContain("- afergon-ai: configured=openai/gpt-5.5, effective=openai/gpt-5.5, source=explicit");
  });

  it("passes an absolute afergon-ai config dir into the OpenCode registrar", () => {
    const tempRoot = makeTempRoot();
    const fakeBin = writeFakeOpencodeCli(tempRoot, {
      modelListings: {
        openai: ["openai/gpt-5.5"],
      },
    });
    const configDir = path.join(tempRoot, "relative-config");
    const xdgHome = path.join(tempRoot, "xdg");
    fs.mkdirSync(path.join(xdgHome, "opencode"), { recursive: true });
    fs.writeFileSync(path.join(xdgHome, "opencode", "opencode.json"), '{"$schema":"https://opencode.ai/config.json"}\n');
    copyManagedAgents(xdgHome);

    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.relative(repoRoot, xdgHome),
      AFERGON_AI_CONFIG_DIR: path.relative(repoRoot, configDir),
      PATH: `${fakeBin}:${process.env.PATH}`,
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
      ...makeUnavailableOpencodeEnv(tempRoot),
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

  it("saves and warns when opencode is unavailable so availability cannot be verified", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "config");
    const emptyPath = path.join(tempRoot, "empty-path");
    fs.mkdirSync(emptyPath, { recursive: true });

    const result = runModelsScript(["set", "afergon-ai", "local/custom-model"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: configDir,
      PATH: emptyPath,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("could not be verified because the 'opencode' CLI is unavailable");
    expect(readJson(path.join(configDir, "config.json")).models.profiles.default["afergon-ai"]).toBe(
      "local/custom-model",
    );
  });

  it("saves and warns when opencode model listing times out", () => {
    const tempRoot = makeTempRoot();
    const fakeBin = writeFakeOpencodeCli(tempRoot, {
      slowProviders: {
        local: 2,
      },
    });

    const result = runModelsScript(["set", "afergon-ai", "local/custom-model"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
      PATH: `${fakeBin}:${process.env.PATH}`,
      AFERGON_AI_MODELS_LIST_TIMEOUT_MS: "1",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("could not be verified because opencode models local timed out after 1ms");
    expect(readJson(path.join(tempRoot, "config", "config.json")).models.profiles.default["afergon-ai"]).toBe(
      "local/custom-model",
    );
  });

  it("saves and warns when provider model listing fails", () => {
    const tempRoot = makeTempRoot();
    const fakeBin = writeFakeOpencodeCli(tempRoot, {
      failingProviders: {
        local: "provider credentials are not configured",
      },
    });

    const result = runModelsScript(["set", "afergon-ai", "local/custom-model"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
      PATH: `${fakeBin}:${process.env.PATH}`,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("provider 'local' could not be listed: provider credentials are not configured");
    expect(readJson(path.join(tempRoot, "config", "config.json")).models.profiles.default["afergon-ai"]).toBe(
      "local/custom-model",
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
