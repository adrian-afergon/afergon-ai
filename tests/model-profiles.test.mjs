import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasDegradedRefreshGuidance,
  normalizeAgentName,
  normalizeRefreshResult,
  resolveAssignments,
  saveProfileAssignments,
  saveConfig,
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
    timeout: 10000,
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
    timeout: 10000,
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

function writeHangingBash(tempRoot) {
  const binDir = path.join(tempRoot, "hanging-bash-bin");
  const scriptPath = path.join(binDir, "bash");
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(
    scriptPath,
    `#!/bin/sh
case "$1" in
  --version)
    echo "GNU bash test"
    exit 0
    ;;
  *)
    sleep 2
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
  it("exports only the intended public model profile config helpers", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.ts");
    const modelProfilesConfigRuntime = await import("../scripts/lib/model-profiles-config.mjs");
    const expectedExports = [
      "createDefaultConfig",
      "ensureActiveProfile",
      "getActiveProfile",
      "getConfigDir",
      "getConfigPath",
      "getOpenCodeBaseDir",
      "loadConfig",
      "saveConfig",
    ];

    expect(Object.keys(modelProfilesConfigTypeScript).sort()).toEqual(expectedExports);
    expect(Object.keys(modelProfilesConfigRuntime).sort()).toEqual(expectedExports);
  });

  it("keeps the extracted TypeScript model profile config mirror in parity with the runtime .mjs module for env path helpers", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.ts");
    const modelProfilesConfigRuntime = await import("../scripts/lib/model-profiles-config.mjs");

    const explicitConfigEnv = {
      AFERGON_AI_CONFIG_DIR: "./custom-config",
      HOME: "/users/example",
      XDG_CONFIG_HOME: "/users/example/.xdg",
    };
    expect(modelProfilesConfigTypeScript.getConfigDir(explicitConfigEnv)).toBe(
      modelProfilesConfigRuntime.getConfigDir(explicitConfigEnv),
    );
    expect(modelProfilesConfigTypeScript.getConfigPath(explicitConfigEnv)).toBe(
      modelProfilesConfigRuntime.getConfigPath(explicitConfigEnv),
    );

    const xdgEnv = {
      HOME: "/users/example",
      XDG_CONFIG_HOME: "/users/example/.xdg",
    };
    expect(modelProfilesConfigTypeScript.getConfigDir(xdgEnv)).toBe(modelProfilesConfigRuntime.getConfigDir(xdgEnv));
    expect(modelProfilesConfigTypeScript.getOpenCodeBaseDir(xdgEnv)).toBe(
      modelProfilesConfigRuntime.getOpenCodeBaseDir(xdgEnv),
    );

    const cwdEnv = {};
    expect(modelProfilesConfigTypeScript.getConfigDir(cwdEnv)).toBe(modelProfilesConfigRuntime.getConfigDir(cwdEnv));
    expect(modelProfilesConfigTypeScript.getOpenCodeBaseDir(cwdEnv)).toBe(
      modelProfilesConfigRuntime.getOpenCodeBaseDir(cwdEnv),
    );
  });

  it("keeps the extracted TypeScript model profile config mirror in parity with the runtime .mjs module for default profile helpers", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.ts");
    const modelProfilesConfigRuntime = await import("../scripts/lib/model-profiles-config.mjs");

    const typeScriptDefaultConfig = modelProfilesConfigTypeScript.createDefaultConfig();
    const runtimeDefaultConfig = modelProfilesConfigRuntime.createDefaultConfig();
    expect(typeScriptDefaultConfig).toEqual(runtimeDefaultConfig);
    expect(modelProfilesConfigTypeScript.getActiveProfile(typeScriptDefaultConfig)).toBe(
      modelProfilesConfigRuntime.getActiveProfile(runtimeDefaultConfig),
    );

    const typeScriptMissingProfileConfig = modelProfilesConfigTypeScript.createDefaultConfig();
    const runtimeMissingProfileConfig = modelProfilesConfigRuntime.createDefaultConfig();
    expect(modelProfilesConfigTypeScript.ensureActiveProfile(typeScriptMissingProfileConfig)).toBe(
      modelProfilesConfigRuntime.ensureActiveProfile(runtimeMissingProfileConfig),
    );
    expect(typeScriptMissingProfileConfig).toEqual(runtimeMissingProfileConfig);

    const typeScriptExistingProfileConfig = {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    };
    const runtimeExistingProfileConfig = structuredClone(typeScriptExistingProfileConfig);
    expect(modelProfilesConfigTypeScript.ensureActiveProfile(typeScriptExistingProfileConfig)).toBe(
      modelProfilesConfigRuntime.ensureActiveProfile(runtimeExistingProfileConfig),
    );
    expect(modelProfilesConfigTypeScript.getActiveProfile(typeScriptExistingProfileConfig)).toEqual(
      modelProfilesConfigRuntime.getActiveProfile(runtimeExistingProfileConfig),
    );
  });

  it("keeps the extracted TypeScript model profile config mirror in parity with the runtime .mjs module for persistence helpers", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.ts");
    const modelProfilesConfigRuntime = await import("../scripts/lib/model-profiles-config.mjs");
    const tempRoot = makeTempRoot();
    const typeScriptEnv = {
      HOME: path.join(tempRoot, "home-ts"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg-ts"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config-ts"),
    };
    const runtimeEnv = {
      HOME: path.join(tempRoot, "home-mjs"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg-mjs"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config-mjs"),
    };

    expect(modelProfilesConfigTypeScript.loadConfig(typeScriptEnv)).toEqual({
      config: modelProfilesConfigTypeScript.createDefaultConfig(),
      configPath: path.join(typeScriptEnv.AFERGON_AI_CONFIG_DIR, "config.json"),
      exists: false,
    });
    expect(modelProfilesConfigRuntime.loadConfig(runtimeEnv)).toEqual({
      config: modelProfilesConfigRuntime.createDefaultConfig(),
      configPath: path.join(runtimeEnv.AFERGON_AI_CONFIG_DIR, "config.json"),
      exists: false,
    });

    const savedTypeScriptPath = modelProfilesConfigTypeScript.saveConfig(
      {
        version: 7,
        models: {
          activeProfile: "budget",
          profiles: {
            budget: {
              main: "openai/gpt-5.5",
              "afg-review": "inherit",
              ignored: "local/skip",
            },
          },
        },
      },
      typeScriptEnv,
    );
    const savedRuntimePath = modelProfilesConfigRuntime.saveConfig(
      {
        version: 7,
        models: {
          activeProfile: "budget",
          profiles: {
            budget: {
              main: "openai/gpt-5.5",
              "afg-review": "inherit",
              ignored: "local/skip",
            },
          },
        },
      },
      runtimeEnv,
    );

    expect(savedTypeScriptPath).toBe(path.join(typeScriptEnv.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(savedRuntimePath).toBe(path.join(runtimeEnv.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(fs.readdirSync(typeScriptEnv.AFERGON_AI_CONFIG_DIR).some((entry) => entry.endsWith(".tmp"))).toBe(false);
    expect(fs.readdirSync(runtimeEnv.AFERGON_AI_CONFIG_DIR).some((entry) => entry.endsWith(".tmp"))).toBe(false);

    const typeScriptLoaded = modelProfilesConfigTypeScript.loadConfig(typeScriptEnv);
    const runtimeLoaded = modelProfilesConfigRuntime.loadConfig(runtimeEnv);
    expect(typeScriptLoaded.config).toEqual(runtimeLoaded.config);
    expect(typeScriptLoaded.exists).toBe(runtimeLoaded.exists);
    expect(typeScriptLoaded).toEqual({
      config: {
        version: 7,
        models: {
          activeProfile: "budget",
          profiles: {
            budget: {
              "afergon-ai": "openai/gpt-5.5",
              "afg-review": "inherit",
            },
          },
        },
      },
      configPath: path.join(typeScriptEnv.AFERGON_AI_CONFIG_DIR, "config.json"),
      exists: true,
    });
  });

  it("keeps the extracted TypeScript model profile config mirror in parity with the runtime .mjs module for invalid config errors", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.ts");
    const modelProfilesConfigRuntime = await import("../scripts/lib/model-profiles-config.mjs");
    const tempRoot = makeTempRoot();
    const typeScriptConfigDir = path.join(tempRoot, "bad-config-ts");
    const runtimeConfigDir = path.join(tempRoot, "bad-config-mjs");
    fs.mkdirSync(typeScriptConfigDir, { recursive: true });
    fs.mkdirSync(runtimeConfigDir, { recursive: true });
    fs.writeFileSync(path.join(typeScriptConfigDir, "config.json"), JSON.stringify({ models: { activeProfile: [] } }), "utf8");
    fs.writeFileSync(path.join(runtimeConfigDir, "config.json"), JSON.stringify({ models: { activeProfile: [] } }), "utf8");

    expect(() => modelProfilesConfigTypeScript.loadConfig({ AFERGON_AI_CONFIG_DIR: typeScriptConfigDir })).toThrow(
      "models.activeProfile must be a string or null",
    );
    expect(() => modelProfilesConfigRuntime.loadConfig({ AFERGON_AI_CONFIG_DIR: runtimeConfigDir })).toThrow(
      "models.activeProfile must be a string or null",
    );
  });

  it("exports only the intended public model profile core helpers", async () => {
    const modelProfilesCoreTypeScript = await import("../scripts/lib/model-profiles-core.ts");
    const modelProfilesCoreRuntime = await import("../scripts/lib/model-profiles-core.mjs");
    const expectedExports = [
      "SUPPORTED_AGENTS",
      "cloneAssignments",
      "hasDegradedRefreshGuidance",
      "normalizeAgentName",
      "normalizeProfileName",
      "normalizeRefreshResult",
      "normalizeStoredModel",
      "parseProviderModel",
      "resolveAssignments",
      "suggestCloseModelIds",
    ];

    expect(Object.keys(modelProfilesCoreTypeScript).sort()).toEqual(expectedExports);
    expect(Object.keys(modelProfilesCoreRuntime).sort()).toEqual(expectedExports);
  });

  it("keeps the extracted TypeScript model-profiles core mirror in parity with the runtime .mjs module for normalization helpers", async () => {
    const modelProfilesCoreTypeScript = await import("../scripts/lib/model-profiles-core.ts");
    const modelProfilesCoreRuntime = await import("../scripts/lib/model-profiles-core.mjs");

    expect(modelProfilesCoreTypeScript.SUPPORTED_AGENTS).toEqual(modelProfilesCoreRuntime.SUPPORTED_AGENTS);
    expect(modelProfilesCoreTypeScript.normalizeStoredModel("  openai/gpt-5.5  ")).toBe(
      modelProfilesCoreRuntime.normalizeStoredModel("  openai/gpt-5.5  "),
    );
    expect(modelProfilesCoreTypeScript.normalizeStoredModel(" inherit ")).toBe(
      modelProfilesCoreRuntime.normalizeStoredModel(" inherit "),
    );
    expect(modelProfilesCoreTypeScript.normalizeStoredModel("   ")).toBe(
      modelProfilesCoreRuntime.normalizeStoredModel("   "),
    );
    expect(modelProfilesCoreTypeScript.parseProviderModel("openai/gpt-5.5")).toEqual(
      modelProfilesCoreRuntime.parseProviderModel("openai/gpt-5.5"),
    );
    expect(modelProfilesCoreTypeScript.parseProviderModel("gpt-5.5")).toEqual(
      modelProfilesCoreRuntime.parseProviderModel("gpt-5.5"),
    );
    expect(
      modelProfilesCoreTypeScript.suggestCloseModelIds("openai/gpt-5.6", [
        "openai/gpt-5.4",
        "openai/gpt-5.4-fast",
        "openai/gpt-5.5",
      ]),
    ).toEqual(
      modelProfilesCoreRuntime.suggestCloseModelIds("openai/gpt-5.6", [
        "openai/gpt-5.4",
        "openai/gpt-5.4-fast",
        "openai/gpt-5.5",
      ]),
    );
    expect(modelProfilesCoreTypeScript.normalizeAgentName("review")).toBe(
      modelProfilesCoreRuntime.normalizeAgentName("review"),
    );
    expect(modelProfilesCoreTypeScript.normalizeProfileName(" budget.main ")).toBe(
      modelProfilesCoreRuntime.normalizeProfileName(" budget.main "),
    );
    expect(modelProfilesCoreTypeScript.hasDegradedRefreshGuidance({ stderr: "warning: recovery skipped" })).toBe(
      modelProfilesCoreRuntime.hasDegradedRefreshGuidance({ stderr: "warning: recovery skipped" }),
    );
  });

  it("keeps the extracted TypeScript model-profiles core mirror in parity with the runtime .mjs module for assignment and refresh helpers", async () => {
    const modelProfilesCoreTypeScript = await import("../scripts/lib/model-profiles-core.ts");
    const modelProfilesCoreRuntime = await import("../scripts/lib/model-profiles-core.mjs");
    const profile = {
      "afergon-ai": "openai/gpt-5.5",
      "afg-review": "inherit",
      "afg-design": "openai/gpt-4.1",
      extra: "ignored",
    };

    expect(modelProfilesCoreTypeScript.resolveAssignments(profile)).toEqual(
      modelProfilesCoreRuntime.resolveAssignments(profile),
    );
    expect(modelProfilesCoreTypeScript.cloneAssignments(profile)).toEqual(modelProfilesCoreRuntime.cloneAssignments(profile));
    expect(modelProfilesCoreTypeScript.cloneAssignments(null)).toEqual(modelProfilesCoreRuntime.cloneAssignments(null));
    expect(
      modelProfilesCoreTypeScript.hasDegradedRefreshGuidance({
        stdout: "OpenCode: warning: missing managed agent file(s): afergon-ai.md",
      }),
    ).toBe(
      modelProfilesCoreRuntime.hasDegradedRefreshGuidance({
        stdout: "OpenCode: warning: missing managed agent file(s): afergon-ai.md",
      }),
    );
    expect(
      modelProfilesCoreTypeScript.normalizeRefreshResult({
        status: "clean",
        stdout: "  Saved config. OpenCode refresh timed out after 500ms.  ",
        stderr: "  Run 'afergon-ai update' to retry.  ",
      }),
    ).toEqual(
      modelProfilesCoreRuntime.normalizeRefreshResult({
        status: "clean",
        stdout: "  Saved config. OpenCode refresh timed out after 500ms.  ",
        stderr: "  Run 'afergon-ai update' to retry.  ",
      }),
    );
    expect(modelProfilesCoreTypeScript.normalizeRefreshResult(null)).toBe(
      modelProfilesCoreRuntime.normalizeRefreshResult(null),
    );
  });

  it("exports only the intended public model profile availability helpers", async () => {
    const modelProfilesAvailabilityTypeScript = await import("../scripts/lib/model-profiles-availability.ts");
    const modelProfilesAvailabilityRuntime = await import("../scripts/lib/model-profiles-availability.mjs");
    const expectedExports = [
      "listOpenCodeProviderModels",
      "validateModelAvailability",
    ];

    expect(Object.keys(modelProfilesAvailabilityTypeScript).sort()).toEqual(expectedExports);
    expect(Object.keys(modelProfilesAvailabilityRuntime).sort()).toEqual(expectedExports);
  });

  it("keeps the extracted TypeScript model-profiles availability mirror in parity with the runtime .mjs module for provider listing edge cases", async () => {
    const modelProfilesAvailabilityTypeScript = await import("../scripts/lib/model-profiles-availability.ts");
    const modelProfilesAvailabilityRuntime = await import("../scripts/lib/model-profiles-availability.mjs");
    const tempRoot = makeTempRoot();
    const fakeBin = writeFakeOpencodeCli(tempRoot, {
      modelListings: {
        openai: ["openai/gpt-5.4", "  ", "openai/gpt-5.5"],
      },
      failingProviders: {
        local: "provider credentials are not configured",
      },
      slowProviders: {
        anthropic: 2,
      },
    });
    const baseEnv = {
      PATH: `${fakeBin}:${process.env.PATH}`,
    };

    expect(modelProfilesAvailabilityTypeScript.listOpenCodeProviderModels("openai", baseEnv)).toEqual(
      modelProfilesAvailabilityRuntime.listOpenCodeProviderModels("openai", baseEnv),
    );
    expect(modelProfilesAvailabilityTypeScript.listOpenCodeProviderModels("local", baseEnv)).toEqual(
      modelProfilesAvailabilityRuntime.listOpenCodeProviderModels("local", baseEnv),
    );
    expect(
      modelProfilesAvailabilityTypeScript.listOpenCodeProviderModels("anthropic", {
        ...baseEnv,
        AFERGON_AI_MODELS_LIST_TIMEOUT_MS: "1",
      }),
    ).toEqual(
      modelProfilesAvailabilityRuntime.listOpenCodeProviderModels("anthropic", {
        ...baseEnv,
        AFERGON_AI_MODELS_LIST_TIMEOUT_MS: "1",
      }),
    );
    expect(modelProfilesAvailabilityTypeScript.listOpenCodeProviderModels("openai", { PATH: "" })).toEqual(
      modelProfilesAvailabilityRuntime.listOpenCodeProviderModels("openai", { PATH: "" }),
    );
  });

  it("keeps the extracted TypeScript model-profiles availability mirror in parity with the runtime .mjs module for model validation outcomes", async () => {
    const modelProfilesAvailabilityTypeScript = await import("../scripts/lib/model-profiles-availability.ts");
    const modelProfilesAvailabilityRuntime = await import("../scripts/lib/model-profiles-availability.mjs");
    const tempRoot = makeTempRoot();
    const fakeBin = writeFakeOpencodeCli(tempRoot, {
      modelListings: {
        openai: ["openai/gpt-5.4", "openai/gpt-5.4-fast", "openai/gpt-5.5"],
      },
      failingProviders: {
        local: "provider credentials are not configured",
      },
      slowProviders: {
        anthropic: 2,
      },
    });
    const baseEnv = {
      PATH: `${fakeBin}:${process.env.PATH}`,
    };

    expect(modelProfilesAvailabilityTypeScript.validateModelAvailability("openai/gpt-5.5", baseEnv)).toEqual(
      modelProfilesAvailabilityRuntime.validateModelAvailability("openai/gpt-5.5", baseEnv),
    );
    expect(modelProfilesAvailabilityTypeScript.validateModelAvailability("openai/gpt-5.6", baseEnv)).toEqual(
      modelProfilesAvailabilityRuntime.validateModelAvailability("openai/gpt-5.6", baseEnv),
    );
    expect(modelProfilesAvailabilityTypeScript.validateModelAvailability("gpt-5.5", baseEnv)).toEqual(
      modelProfilesAvailabilityRuntime.validateModelAvailability("gpt-5.5", baseEnv),
    );
    expect(modelProfilesAvailabilityTypeScript.validateModelAvailability("local/custom-model", baseEnv)).toEqual(
      modelProfilesAvailabilityRuntime.validateModelAvailability("local/custom-model", baseEnv),
    );
    expect(
      modelProfilesAvailabilityTypeScript.validateModelAvailability("anthropic/claude-opus", {
        ...baseEnv,
        AFERGON_AI_MODELS_LIST_TIMEOUT_MS: "1",
      }),
    ).toEqual(
      modelProfilesAvailabilityRuntime.validateModelAvailability("anthropic/claude-opus", {
        ...baseEnv,
        AFERGON_AI_MODELS_LIST_TIMEOUT_MS: "1",
      }),
    );
    expect(modelProfilesAvailabilityTypeScript.validateModelAvailability("openai/gpt-5.5", { PATH: "" })).toEqual(
      modelProfilesAvailabilityRuntime.validateModelAvailability("openai/gpt-5.5", { PATH: "" }),
    );
  });

  it("treats registrar warning guidance as degraded refresh output", () => {
    expect(
      hasDegradedRefreshGuidance({
        stdout: "OpenCode: warning: missing managed agent file(s): afergon-ai.md\nRun 'afergon-ai update' to repair.",
      }),
    ).toBe(true);
    expect(
      hasDegradedRefreshGuidance({
        stdout: "OpenCode registrations refreshed on disk. Start a new compatible run if the current session does not pick this up automatically.",
      }),
    ).toBe(false);
    expect(
      hasDegradedRefreshGuidance({
        stdout: "Conflict: agent 'afergon-ai' already exists in opencode.json and does not look managed by afergon-ai.\n  OpenCode: kept existing non-managed agent definition(s): afergon-ai",
      }),
    ).toBe(true);
  });

  it("normalizes refresh output into a shared trimmed clean/degraded shape", () => {
    expect(normalizeRefreshResult()).toBeUndefined();
    expect(
      normalizeRefreshResult({
        status: "clean",
        stdout: "  Saved config. OpenCode refresh timed out after 500ms.  ",
        stderr: "  Run 'afergon-ai update' to retry.  ",
      }),
    ).toEqual({
      status: "degraded",
      stdout: "Saved config. OpenCode refresh timed out after 500ms.",
      stderr: "Run 'afergon-ai update' to retry.",
      degraded: true,
    });
    expect(
      normalizeRefreshResult({
        status: "clean",
        stdout: "  OpenCode registrations refreshed on disk.  ",
        stderr: "   ",
      }),
    ).toEqual({
      status: "clean",
      stdout: "OpenCode registrations refreshed on disk.",
      stderr: "",
      degraded: false,
    });
  });

  it("keeps the supported agent list unique so config projections do not duplicate entries", () => {
    expect(new Set(SUPPORTED_AGENTS).size).toBe(SUPPORTED_AGENTS.length);
  });

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
  it("writes afergon-ai config atomically without leaving a temp file", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "config");
    const config = {
      version: 1,
      models: {
        activeProfile: "default",
        profiles: {
          default: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    };

    const configPath = saveConfig(config, { AFERGON_AI_CONFIG_DIR: configDir });

    expect(configPath).toBe(path.join(configDir, "config.json"));
    expect(readJson(configPath)).toEqual(config);
    expect(fs.readdirSync(configDir).some((entry) => entry.endsWith(".tmp"))).toBe(false);
  });

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

  it("imports scripts/models.mjs without running the CLI entrypoint", () => {
    const result = spawnSync(process.execPath, ["-e", "await import('./scripts/models.mjs')"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
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

  it("fails gracefully when model config root is not an object", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "config");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), "[]\n", "utf8");

    const result = runCli(["show"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: configDir,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("root value must be an object");
    expect(result.stderr).toContain("Repair the file or move it aside");
  });

  it("fails gracefully when model config schema is invalid", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "config");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), JSON.stringify({ models: { profiles: [] } }), "utf8");

    const result = runCli(["show"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: configDir,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("models.profiles must be an object");
    expect(result.stderr).toContain("Repair the file or move it aside");
  });

  it("creates a first profile when host OpenCode config is malformed", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "config");
    const xdgHome = path.join(tempRoot, "xdg");
    fs.mkdirSync(path.join(xdgHome, "opencode"), { recursive: true });
    fs.writeFileSync(path.join(xdgHome, "opencode", "opencode.json"), "{not-json", "utf8");

    const result = runCli(["profile", "create", "budget"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: xdgHome,
      AFERGON_AI_CONFIG_DIR: configDir,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("could not read OpenCode config");
    expect(result.stdout).toContain("Created profile 'budget'.");
    expect(readJson(path.join(configDir, "config.json")).models.profiles.budget).toEqual({});
  });

  it("creates a first profile when host OpenCode config root is not an object", () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "config");
    const xdgHome = path.join(tempRoot, "xdg");
    fs.mkdirSync(path.join(xdgHome, "opencode"), { recursive: true });
    fs.writeFileSync(path.join(xdgHome, "opencode", "opencode.json"), "null\n", "utf8");

    const result = runCli(["profile", "create", "budget"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: xdgHome,
      AFERGON_AI_CONFIG_DIR: configDir,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("is not an object");
    expect(result.stdout).toContain("Created profile 'budget'.");
    expect(readJson(path.join(configDir, "config.json")).models.profiles.budget).toEqual({});
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

  it("saves afergon-ai config and soft-warns when OpenCode refresh times out", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const configDir = path.join(tempRoot, "config");
    const fakeBashBin = writeHangingBash(tempRoot);
    const fakeOpencodeBin = writeFakeOpencodeCli(tempRoot, {
      modelListings: {
        openai: ["openai/gpt-5.5"],
      },
    });
    fs.mkdirSync(path.join(xdgHome, "opencode"), { recursive: true });
    fs.writeFileSync(path.join(xdgHome, "opencode", "opencode.json"), '{"$schema":"https://opencode.ai/config.json"}\n');
    copyManagedAgents(xdgHome);

    const result = runModelsScript(["set", "afergon-ai", "openai/gpt-5.5"], {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: xdgHome,
      AFERGON_AI_CONFIG_DIR: configDir,
      PATH: `${fakeBashBin}:${fakeOpencodeBin}:${process.env.PATH}`,
      AFG_FORCE_OPENCODE_BASH_REFRESH: "1",
      AFERGON_AI_OPENCODE_REFRESH_TIMEOUT_MS: "500",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Updated profile 'default': afergon-ai -> openai/gpt-5.5");
    expect(result.stderr).toContain("OpenCode refresh timed out after 500ms");
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

describe("saveProfileAssignments", () => {
  it("saves staged assignments to the targeted inactive profile with injected model validation and without mutating the active profile", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };
    const refreshActiveProfile = vi.fn();
    const validateAvailability = vi.fn(() => ({
      status: "known",
      availableModels: ["openai/gpt-5.4-mini"],
    }));

    saveConfig(
      {
        version: 1,
        models: {
          activeProfile: "budget",
          profiles: {
            budget: {
              "afergon-ai": "openai/gpt-5.5",
            },
            fallback: {
              "afergon-ai": "openai/gpt-5.4",
            },
          },
        },
      },
      env,
    );

    saveProfileAssignments(
      "fallback",
      {
        "afg-review": "openai/gpt-5.4-mini",
      },
      { env, refreshActiveProfile, validateModelAvailability: validateAvailability },
    );

    const savedConfig = readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(savedConfig.models.activeProfile).toBe("budget");
    expect(savedConfig.models.profiles.budget).toEqual({
      "afergon-ai": "openai/gpt-5.5",
    });
    expect(savedConfig.models.profiles.fallback).toEqual({
      "afergon-ai": "openai/gpt-5.4",
      "afg-review": "openai/gpt-5.4-mini",
    });
    expect(validateAvailability).toHaveBeenCalledWith("openai/gpt-5.4-mini", env);
    expect(refreshActiveProfile).not.toHaveBeenCalled();
  });

  it("returns degraded refresh guidance only when saving the active profile", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };
    const refreshActiveProfile = vi.fn(() => ({
      status: "degraded",
      stdout: "Saved config. OpenCode refresh timed out after 500ms.",
      stderr: "Run 'afergon-ai update' to retry the host registration refresh.",
    }));
    const validateAvailability = vi.fn(() => ({
      status: "known",
      availableModels: ["openai/gpt-5.5"],
    }));

    saveConfig(
      {
        version: 1,
        models: {
          activeProfile: "budget",
          profiles: {
            budget: {
              "afergon-ai": "openai/gpt-5.5",
            },
          },
        },
      },
      env,
    );

    const result = saveProfileAssignments(
      "budget",
      {
        "afg-review": "inherit",
      },
      { env, refreshActiveProfile, validateModelAvailability: validateAvailability },
    );

    const savedConfig = readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(savedConfig.models.profiles.budget).toEqual({
      "afergon-ai": "openai/gpt-5.5",
      "afg-review": "inherit",
    });
    expect(refreshActiveProfile).toHaveBeenCalledTimes(1);
    expect(validateAvailability).not.toHaveBeenCalled();
    expect(result.refreshResult).toEqual({
      status: "degraded",
      stdout: "Saved config. OpenCode refresh timed out after 500ms.",
      stderr: "Run 'afergon-ai update' to retry the host registration refresh.",
      degraded: true,
    });
  });

  it("normalizes successful registrar warnings into degraded refresh guidance for active-profile saves", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };
    const refreshActiveProfile = vi.fn(() => ({
      status: "clean",
      stdout: "OpenCode: warning: missing managed agent file(s): afergon-ai.md\nRun 'afergon-ai update' or 'afergon-ai init --opencode' to repair.",
      stderr: "",
    }));

    saveConfig(
      {
        version: 1,
        models: {
          activeProfile: "budget",
          profiles: {
            budget: {
              "afergon-ai": "openai/gpt-5.5",
            },
          },
        },
      },
      env,
    );

    const result = saveProfileAssignments(
      "budget",
      {
        "afg-review": "inherit",
      },
      { env, refreshActiveProfile },
    );

    expect(refreshActiveProfile).toHaveBeenCalledTimes(1);
    expect(result.refreshResult).toEqual({
      status: "degraded",
      stdout: "OpenCode: warning: missing managed agent file(s): afergon-ai.md\nRun 'afergon-ai update' or 'afergon-ai init --opencode' to repair.",
      stderr: "",
      degraded: true,
    });
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
      timeout: 10000,
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
      timeout: 10000,
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

  it("preserves existing model assignments when afergon-ai model config root is not an object", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeDir = path.join(xdgHome, "opencode");
    const configDir = path.join(tempRoot, "config");
    fs.mkdirSync(opencodeDir, { recursive: true });
    fs.mkdirSync(configDir, { recursive: true });
    copyManagedAgents(xdgHome);
    fs.writeFileSync(path.join(configDir, "config.json"), "[]\n", "utf8");
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
          },
        },
        null,
        2,
      ),
    );

    const result = spawnSync("bash", [registerScript, adapterPath], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
        AFERGON_AI_CONFIG_DIR: configDir,
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("afergon-ai model config root is not an object");
    const opencodeConfig = readJson(path.join(opencodeDir, "opencode.json"));
    expect(opencodeConfig.agent["afergon-ai"].model).toBe("openai/existing-main");
  });

  it("preserves existing model assignments when afergon-ai model config schema is invalid", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeDir = path.join(xdgHome, "opencode");
    const configDir = path.join(tempRoot, "config");
    fs.mkdirSync(opencodeDir, { recursive: true });
    fs.mkdirSync(configDir, { recursive: true });
    copyManagedAgents(xdgHome);
    fs.writeFileSync(path.join(configDir, "config.json"), JSON.stringify({ models: { profiles: [] } }), "utf8");
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
          },
        },
        null,
        2,
      ),
    );

    const result = spawnSync("bash", [registerScript, adapterPath], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
        AFERGON_AI_CONFIG_DIR: configDir,
      },
    });

    expect(result.status).toBe(0);
    const opencodeConfig = readJson(path.join(opencodeDir, "opencode.json"));
    expect(opencodeConfig.agent["afergon-ai"].model).toBe("openai/existing-main");
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
      timeout: 10000,
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

  it("skips conflicting agent definitions in non-interactive registrar mode", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeDir = path.join(xdgHome, "opencode");
    fs.mkdirSync(opencodeDir, { recursive: true });
    copyManagedAgents(xdgHome);
    fs.writeFileSync(
      path.join(opencodeDir, "opencode.json"),
      JSON.stringify({ agent: { "afergon-ai": { description: "user owned", mode: "primary", prompt: "custom" } } }, null, 2),
    );

    const result = spawnSync("bash", [registerScript, adapterPath], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
        AFG_OPENCODE_REGISTER_NONINTERACTIVE: "1",
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Conflict: agent 'afergon-ai'");
    expect(result.stdout).toContain("kept existing non-managed agent definition(s): afergon-ai");
    expect(readJson(path.join(opencodeDir, "opencode.json")).agent["afergon-ai"].prompt).toBe("custom");
  });

  it("recreates malformed opencode.json with an atomic registrar write", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeDir = path.join(xdgHome, "opencode");
    fs.mkdirSync(opencodeDir, { recursive: true });
    copyManagedAgents(xdgHome);
    fs.writeFileSync(path.join(opencodeDir, "opencode.json"), "{not-json", "utf8");

    const result = spawnSync("bash", [registerScript, adapterPath], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
        AFG_OPENCODE_REGISTER_NONINTERACTIVE: "1",
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("could not read opencode.json");
    const opencodeConfig = readJson(path.join(opencodeDir, "opencode.json"));
    expect(opencodeConfig.$schema).toBe("https://opencode.ai/config.json");
    expect(opencodeConfig.agent["afergon-ai"].description).toContain("afergon-ai");
    expect(fs.readdirSync(opencodeDir).some((entry) => entry.startsWith("opencode.json.corrupt-"))).toBe(true);
    expect(fs.readdirSync(opencodeDir).some((entry) => entry.endsWith(".tmp"))).toBe(false);
  });

  it("backs up and recreates opencode.json when the root schema is not an object", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeDir = path.join(xdgHome, "opencode");
    fs.mkdirSync(opencodeDir, { recursive: true });
    copyManagedAgents(xdgHome);
    fs.writeFileSync(path.join(opencodeDir, "opencode.json"), "[]\n", "utf8");

    const result = spawnSync("bash", [registerScript, adapterPath], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
        AFG_OPENCODE_REGISTER_NONINTERACTIVE: "1",
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("opencode.json root is not an object");
    const opencodeConfig = readJson(path.join(opencodeDir, "opencode.json"));
    expect(opencodeConfig.$schema).toBe("https://opencode.ai/config.json");
    expect(opencodeConfig.agent["afergon-ai"].description).toContain("afergon-ai");
    expect(fs.readdirSync(opencodeDir).some((entry) => entry.startsWith("opencode.json.invalid-root-"))).toBe(true);
  });

  it("backs up and replaces invalid per-agent OpenCode entries", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const opencodeDir = path.join(xdgHome, "opencode");
    fs.mkdirSync(opencodeDir, { recursive: true });
    copyManagedAgents(xdgHome);
    fs.writeFileSync(
      path.join(opencodeDir, "opencode.json"),
      JSON.stringify({ $schema: "https://opencode.ai/config.json", agent: { "afergon-ai": "bad" } }, null, 2),
    );

    const result = spawnSync("bash", [registerScript, adapterPath], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
        AFG_OPENCODE_REGISTER_NONINTERACTIVE: "1",
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("agent 'afergon-ai' entry is not an object");
    const opencodeConfig = readJson(path.join(opencodeDir, "opencode.json"));
    expect(opencodeConfig.agent["afergon-ai"].description).toContain("afergon-ai");
    expect(fs.readdirSync(opencodeDir).some((entry) => entry.startsWith("opencode.json.invalid-agent-entry-"))).toBe(true);
  });
});
