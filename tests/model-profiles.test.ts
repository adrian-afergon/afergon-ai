// This contract suite compares TypeScript sources with the emitted JavaScript runtime.
// @ts-nocheck
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasDegradedRefreshGuidance,
  normalizeAgentName,
  normalizeRefreshResult,
  resolveAssignments,
  saveProfileAssignments,
  saveConfig,
  SUPPORTED_AGENTS,
} from "../dist/scripts/lib/model-profiles.js";

const repoRoot = path.resolve(import.meta.dirname, "..");
const cliPath = path.join(repoRoot, "bin/afergon-ai");
const windowsModelsPath = path.join(repoRoot, "dist", "scripts", "models.js");
const registerScript = path.join(repoRoot, "scripts/register-opencode-agents.sh");
const adapterPath = path.join(repoRoot, "adapters/opencode");

const APPROVED_AGENT_PERMISSIONS = {
  "afergon-ai": {
    bash: "allow",
    edit: "allow",
    glob: "allow",
    grep: "allow",
    read: "allow",
    webfetch: "deny",
    write: "allow",
  },
  "afg-debate": {
    bash: "deny",
    edit: "deny",
    glob: "deny",
    grep: "deny",
    read: "allow",
    webfetch: "deny",
    write: {
      "*": "deny",
      "openspec/debate/debate-summary*.md": "allow",
    },
  },
};

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
  return spawnSync(process.platform === "win32" ? process.execPath : cliPath, process.platform === "win32" ? [windowsModelsPath, ...args] : ["models", ...args], {
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
  return spawnSync(process.execPath, [path.join(repoRoot, "dist", "scripts", "models.js"), ...args], {
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
  const config = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (config?.version === 2 && config.models?.tools?.opencode) {
    // Existing OpenCode-focused assertions can read the migrated store while dedicated tests assert raw v2 persistence.
    Object.defineProperties(config.models, {
      activeProfile: { configurable: true, get: () => config.models.tools.opencode.activeProfile },
      profiles: { configurable: true, get: () => config.models.tools.opencode.profiles },
    });
  }
  return config;
}

function getToolStore(config, tool = "opencode") {
  return config.models.tools?.[tool] ?? config.models;
}

function captureWarnings(run) {
  const warnings = [];
  const warnSpy = vi.spyOn(console, "warn").mockImplementation((message) => {
    warnings.push(String(message));
  });

  try {
    return {
      result: run(),
      warnings,
    };
  } finally {
    warnSpy.mockRestore();
  }
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

function runRegistrar(tempRoot, xdgHome, env = {}) {
  return spawnSync("bash", [registerScript, adapterPath], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 10000,
    env: {
      ...process.env,
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: xdgHome,
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
      AFG_OPENCODE_REGISTER_NONINTERACTIVE: "1",
      ...env,
    },
  });
}

function runIsolatedRegistrar() {
  const tempRoot = makeTempRoot();
  const xdgHome = path.join(tempRoot, "xdg");
  const opencodeDir = path.join(xdgHome, "opencode");
  fs.mkdirSync(opencodeDir, { recursive: true });
  copyManagedAgents(xdgHome);
  fs.writeFileSync(path.join(opencodeDir, "opencode.json"), '{"$schema":"https://opencode.ai/config.json"}\n');

  const result = runRegistrar(tempRoot, xdgHome);

  return {
    config: readJson(path.join(opencodeDir, "opencode.json")),
    result,
  };
}

function readFrontmatterPermissions(agentName) {
  const agentPath = path.join(adapterPath, "agents", `${agentName}.md`);
  const lines = fs.readFileSync(agentPath, "utf8").split(/\r?\n/);
  const frontmatterEnd = lines.indexOf("---", 1);
  const permissionStart = lines.slice(1, frontmatterEnd).indexOf("permission:") + 1;
  if (frontmatterEnd < 0 || permissionStart === 0) {
    throw new Error(`${agentName} frontmatter permission block is missing`);
  }

  const permission = {};
  for (let index = permissionStart + 1; index < frontmatterEnd;) {
    const line = lines[index];
    const scalar = line.match(/^  ([a-z][a-z0-9_]*): (allow|deny)$/);
    const nestedWrite = line === "  write:";
    if (!scalar && !nestedWrite) {
      throw new Error(`${agentName} frontmatter permission has unsupported shape: ${line}`);
    }

    const key = nestedWrite ? "write" : scalar[1];
    if (Object.hasOwn(permission, key)) {
      throw new Error(`${agentName} frontmatter permission has duplicate key: ${key}`);
    }
    if (!nestedWrite) {
      permission[key] = scalar[2];
      index += 1;
      continue;
    }

    const write = {};
    index += 1;
    while (index < frontmatterEnd && lines[index].startsWith("    ")) {
      const nested = lines[index].match(/^    ("[^"]+"|[^:]+): (allow|deny)$/);
      if (!nested) {
        throw new Error(`${agentName} frontmatter write permission has unsupported shape: ${lines[index]}`);
      }
      const writeKey = nested[1].replace(/^"|"$/g, "");
      if (Object.hasOwn(write, writeKey)) {
        throw new Error(`${agentName} frontmatter write permission has duplicate key: ${writeKey}`);
      }
      write[writeKey] = nested[2];
      index += 1;
    }
    permission.write = write;
  }

  return permission;
}

function wildcardPatternToRegExp(pattern) {
  const escapedPattern = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedPattern.replaceAll("*", ".*").replaceAll("?", ".")}$`);
}

function evaluateWritePermission(rules, targetPath) {
  if (rules === null || typeof rules !== "object" || Array.isArray(rules)) {
    throw new TypeError("write permission rules must be a plain object");
  }
  const normalizedTarget = targetPath.replaceAll("\\", "/");
  let permission = "ask";
  for (const [pattern, effect] of Object.entries(rules)) {
    if (!new Set(["allow", "deny", "ask"]).has(effect)) {
      throw new TypeError(`write permission rule "${pattern}" has unsupported effect: ${String(effect)}`);
    }
    if (wildcardPatternToRegExp(pattern).test(normalizedTarget)) {
      permission = effect;
    }
  }
  return permission;
}

function writeFakeOpencodeCli(tempRoot, handlers = {}) {
  const binDir = path.join(tempRoot, "fake-bin");
  const scriptPath = path.join(binDir, process.platform === "win32" ? "opencode.cjs" : "opencode");
  fs.mkdirSync(binDir, { recursive: true });

  const modelListings = handlers.modelListings ?? {};
  const failingProviders = handlers.failingProviders ?? {};
  const slowProviders = handlers.slowProviders ?? {};
  const script = process.platform === "win32"
    ? `const provider = process.argv[3];
const listings = ${JSON.stringify(modelListings)};
const failures = ${JSON.stringify(failingProviders)};
const delays = ${JSON.stringify(slowProviders)};
if (process.argv[2] !== "models") process.exit(64);
if (delays[provider]) setTimeout(() => process.exit(0), Number(delays[provider]) * 1000);
else if (failures[provider]) { console.error(failures[provider]); process.exit(1); }
else { process.stdout.write((listings[provider] ?? []).join("\\n") + (listings[provider] ? "\\n" : "")); process.exit(0); }
`
    : `#!/bin/sh
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
`;
  fs.writeFileSync(scriptPath, script, { mode: 0o755 });
  if (process.platform === "win32") {
    fs.writeFileSync(path.join(binDir, "opencode.cmd"), `@echo off\r\n"${process.execPath}" "%~dp0opencode.cjs" %*\r\nexit /b %ERRORLEVEL%\r\n`);
  }

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
    path.join(fakeBin, process.platform === "win32" ? "opencode.cmd" : "opencode"),
    process.platform === "win32" ? `@echo off\r\necho opencode unavailable in test 1>&2\r\nexit /b 127\r\n` : `#!/bin/sh
echo "opencode unavailable in test" >&2
exit 127
`,
    { mode: 0o755 },
  );
  return {
    ...env,
    PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
  };
}

describe("model profile resolution", () => {
  it("exports only the intended public model profile facade helpers", async () => {
    const modelProfilesTypeScript = await import("../scripts/lib/model-profiles.js");
    const modelProfilesRuntime = await import("../dist/scripts/lib/model-profiles.js");
    const expectedExports = [
      "SUPPORTED_AGENTS",
      "SUPPORTED_MODEL_TOOLS",
      "cloneAssignments",
      "createDefaultConfig",
      "ensureActiveProfile",
      "getActiveProfile",
      "getConfigDir",
      "getConfigPath",
      "getInstalledModelProfileTools",
      "getModelProfileProjectionDetail",
      "getModelProfileToolLabel",
      "getOpenCodeBaseDir",
      "getToolProfileStore",
      "hasDegradedRefreshGuidance",
      "isModelProfileToolInstalled",
      "listOpenCodeProviderModels",
      "loadConfig",
      "normalizeAgentName",
      "normalizeModelProfileTool",
      "normalizeProfileName",
      "normalizeRefreshResult",
      "normalizeStoredModel",
      "parseProviderModel",
      "readOpenCodeAgentModels",
      "resolveAssignments",
      "saveConfig",
      "saveProfileAssignments",
      "suggestCloseModelIds",
      "validateModelAvailability",
      "validateModelForTool",
    ];

    expect(Object.keys(modelProfilesTypeScript).sort()).toEqual(expectedExports);
    expect(Object.keys(modelProfilesRuntime).sort()).toEqual(expectedExports);
  });

  it("keeps the TypeScript model profile facade export surface aligned with the emitted runtime facade", async () => {
    const modelProfilesTypeScript = await import("../scripts/lib/model-profiles.js");
    const modelProfilesRuntime = await import("../dist/scripts/lib/model-profiles.js");

    expect(Object.keys(modelProfilesTypeScript).sort()).toEqual(Object.keys(modelProfilesRuntime).sort());
    expect(modelProfilesTypeScript.SUPPORTED_AGENTS).toEqual(modelProfilesRuntime.SUPPORTED_AGENTS);
  });

  it("exports only the intended public model profile config helpers", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.js");
    const modelProfilesConfigRuntime = await import("../dist/scripts/lib/model-profiles-config.js");
    const expectedExports = [
      "createDefaultConfig",
      "ensureActiveProfile",
      "getActiveProfile",
      "getConfigDir",
      "getConfigPath",
      "getOpenCodeBaseDir",
      "getToolProfileStore",
      "loadConfig",
      "saveConfig",
    ];

    expect(Object.keys(modelProfilesConfigTypeScript).sort()).toEqual(expectedExports);
    expect(Object.keys(modelProfilesConfigRuntime).sort()).toEqual(expectedExports);
  });

  it("keeps extracted TypeScript model profile config behavior aligned with emitted JavaScript for env path helpers", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.js");
    const modelProfilesConfigRuntime = await import("../dist/scripts/lib/model-profiles-config.js");

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

  it("keeps extracted TypeScript model profile config behavior aligned with emitted JavaScript for default profile helpers", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.js");
    const modelProfilesConfigRuntime = await import("../dist/scripts/lib/model-profiles-config.js");

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

  it("keeps extracted TypeScript model profile config behavior aligned with emitted JavaScript for persistence helpers", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.js");
    const modelProfilesConfigRuntime = await import("../dist/scripts/lib/model-profiles-config.js");
    const tempRoot = makeTempRoot();
    const typeScriptEnv = {
      HOME: path.join(tempRoot, "home-ts"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg-ts"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config-ts"),
    };
    const runtimeEnv = {
      HOME: path.join(tempRoot, "home-runtime"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg-runtime"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config-runtime"),
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
        version: 1,
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
        version: 1,
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
          version: 2,
          models: {
            tools: {
              pi: { activeProfile: null, profiles: {} },
              claude: { activeProfile: null, profiles: {} },
              opencode: {
                activeProfile: "budget",
                profiles: {
                  budget: {
                    "afergon-ai": "openai/gpt-5.5",
                    "afg-review": "inherit",
                  },
                },
              },
            },
          },
        },
      configPath: path.join(typeScriptEnv.AFERGON_AI_CONFIG_DIR, "config.json"),
      exists: true,
    });
  });

  it("keeps extracted TypeScript model profile config behavior aligned with emitted JavaScript for invalid config errors", async () => {
    const modelProfilesConfigTypeScript = await import("../scripts/lib/model-profiles-config.js");
    const modelProfilesConfigRuntime = await import("../dist/scripts/lib/model-profiles-config.js");
    const tempRoot = makeTempRoot();
    const typeScriptConfigDir = path.join(tempRoot, "bad-config-ts");
    const runtimeConfigDir = path.join(tempRoot, "bad-config-runtime");
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
    const modelProfilesCoreTypeScript = await import("../scripts/lib/model-profiles-core.js");
    const modelProfilesCoreRuntime = await import("../dist/scripts/lib/model-profiles-core.js");
    const expectedExports = [
      "MODEL_PROFILE_TOOL_LABELS",
      "SUPPORTED_AGENTS",
      "SUPPORTED_MODEL_TOOLS",
      "cloneAssignments",
      "getModelProfileToolLabel",
      "hasDegradedRefreshGuidance",
      "normalizeAgentName",
      "normalizeModelProfileTool",
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

  it("keeps extracted TypeScript model-profiles core behavior aligned with emitted JavaScript for normalization helpers", async () => {
    const modelProfilesCoreTypeScript = await import("../scripts/lib/model-profiles-core.js");
    const modelProfilesCoreRuntime = await import("../dist/scripts/lib/model-profiles-core.js");

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

  it("keeps extracted TypeScript model-profiles core behavior aligned with emitted JavaScript for assignment and refresh helpers", async () => {
    const modelProfilesCoreTypeScript = await import("../scripts/lib/model-profiles-core.js");
    const modelProfilesCoreRuntime = await import("../dist/scripts/lib/model-profiles-core.js");
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
    const modelProfilesAvailabilityTypeScript = await import("../scripts/lib/model-profiles-availability.js");
    const modelProfilesAvailabilityRuntime = await import("../dist/scripts/lib/model-profiles-availability.js");
    const expectedExports = [
      "listOpenCodeProviderModels",
      "validateModelAvailability",
      "validateModelForTool",
    ];

    expect(Object.keys(modelProfilesAvailabilityTypeScript).sort()).toEqual(expectedExports);
    expect(Object.keys(modelProfilesAvailabilityRuntime).sort()).toEqual(expectedExports);
  });

  it("exports only the intended public model profile host seeding helpers", async () => {
    const modelProfilesHostSeedingTypeScript = await import("../scripts/lib/model-profiles-host-seeding.js");
    const modelProfilesHostSeedingRuntime = await import("../dist/scripts/lib/model-profiles-host-seeding.js");
    const expectedExports = ["readOpenCodeAgentModels"];

    expect(Object.keys(modelProfilesHostSeedingTypeScript).sort()).toEqual(expectedExports);
    expect(Object.keys(modelProfilesHostSeedingRuntime).sort()).toEqual(expectedExports);
  });

  it("keeps extracted TypeScript model-profiles host seeding behavior aligned with emitted JavaScript for missing and empty host config cases", async () => {
    const modelProfilesHostSeedingTypeScript = await import("../scripts/lib/model-profiles-host-seeding.js");
    const modelProfilesHostSeedingRuntime = await import("../dist/scripts/lib/model-profiles-host-seeding.js");
    const tempRoot = makeTempRoot();
    const missingConfigEnv = {
      HOME: path.join(tempRoot, "missing-home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "missing-xdg"),
    };

    expect(modelProfilesHostSeedingTypeScript.readOpenCodeAgentModels(missingConfigEnv)).toEqual(
      modelProfilesHostSeedingRuntime.readOpenCodeAgentModels(missingConfigEnv),
    );

    const emptyConfigDir = path.join(tempRoot, "empty-xdg", "opencode");
    fs.mkdirSync(emptyConfigDir, { recursive: true });
    fs.writeFileSync(path.join(emptyConfigDir, "opencode.json"), JSON.stringify({}), "utf8");
    const emptyConfigEnv = {
      HOME: path.join(tempRoot, "empty-home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "empty-xdg"),
    };

    expect(modelProfilesHostSeedingTypeScript.readOpenCodeAgentModels(emptyConfigEnv)).toEqual(
      modelProfilesHostSeedingRuntime.readOpenCodeAgentModels(emptyConfigEnv),
    );
  });

  it("keeps extracted TypeScript model-profiles host seeding behavior aligned with emitted JavaScript for seeded snapshots", async () => {
    const modelProfilesHostSeedingTypeScript = await import("../scripts/lib/model-profiles-host-seeding.js");
    const modelProfilesHostSeedingRuntime = await import("../dist/scripts/lib/model-profiles-host-seeding.js");
    const tempRoot = makeTempRoot();
    const opencodeDir = path.join(tempRoot, "xdg", "opencode");
    fs.mkdirSync(opencodeDir, { recursive: true });
    fs.writeFileSync(
      path.join(opencodeDir, "opencode.json"),
      JSON.stringify(
        {
          agent: {
            "afergon-ai": { model: "  openai/gpt-5.5  " },
            "afg-review": { model: "inherit" },
            "afg-design": { model: "openai/gpt-4.1" },
            outsider: { model: "openai/ignored" },
            "afg-breakdown": { model: "   " },
          },
        },
        null,
        2,
      ),
      "utf8",
    );
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
    };

    expect(modelProfilesHostSeedingTypeScript.readOpenCodeAgentModels(env)).toEqual(
      modelProfilesHostSeedingRuntime.readOpenCodeAgentModels(env),
    );
    expect(modelProfilesHostSeedingRuntime.readOpenCodeAgentModels(env)).toEqual({
      "afergon-ai": "openai/gpt-5.5",
      "afg-design": "openai/gpt-4.1",
    });
  });

  it("keeps emitted NodeNext host-seeding JavaScript warning behavior aligned with the TypeScript source", async () => {
    const modelProfilesHostSeedingTypeScript = await import(
      pathToFileURL(path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-host-seeding.js")).href,
    );
    const modelProfilesHostSeedingRuntime = await import("../scripts/lib/model-profiles-host-seeding.js");
    const tempRoot = makeTempRoot();
    const invalidConfigDir = path.join(tempRoot, "invalid-xdg", "opencode");
    const arrayConfigDir = path.join(tempRoot, "array-xdg", "opencode");
    fs.mkdirSync(invalidConfigDir, { recursive: true });
    fs.mkdirSync(arrayConfigDir, { recursive: true });
    fs.writeFileSync(path.join(invalidConfigDir, "opencode.json"), "{not-json", "utf8");
    fs.writeFileSync(path.join(arrayConfigDir, "opencode.json"), JSON.stringify([]), "utf8");

    const invalidConfigEnv = {
      HOME: path.join(tempRoot, "invalid-home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "invalid-xdg"),
    };
    const arrayConfigEnv = {
      HOME: path.join(tempRoot, "array-home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "array-xdg"),
    };

    const typeScriptInvalid = captureWarnings(() => modelProfilesHostSeedingTypeScript.readOpenCodeAgentModels(invalidConfigEnv));
    const runtimeInvalid = captureWarnings(() => modelProfilesHostSeedingRuntime.readOpenCodeAgentModels(invalidConfigEnv));
    expect(typeScriptInvalid).toEqual(runtimeInvalid);

    const typeScriptArray = captureWarnings(() => modelProfilesHostSeedingTypeScript.readOpenCodeAgentModels(arrayConfigEnv));
    const runtimeArray = captureWarnings(() => modelProfilesHostSeedingRuntime.readOpenCodeAgentModels(arrayConfigEnv));
    expect(typeScriptArray).toEqual(runtimeArray);
  });

  it("keeps extracted TypeScript model-profiles availability behavior aligned with emitted JavaScript for provider listing edge cases", async () => {
    const modelProfilesAvailabilityTypeScript = await import("../scripts/lib/model-profiles-availability.js");
    const modelProfilesAvailabilityRuntime = await import("../dist/scripts/lib/model-profiles-availability.js");
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
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
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

  it("keeps extracted TypeScript model-profiles availability behavior aligned with emitted JavaScript for model validation outcomes", async () => {
    const modelProfilesAvailabilityTypeScript = await import("../scripts/lib/model-profiles-availability.js");
    const modelProfilesAvailabilityRuntime = await import("../dist/scripts/lib/model-profiles-availability.js");
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
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
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
  it("exports only the intended public models CLI core helpers", async () => {
    const typeScriptCore = await import("../scripts/lib/models-cli-core.js");
    const runtimeCore = await import("../dist/scripts/lib/models-cli-core.js");
    const expectedExports = [
      "createRefreshResult",
      "createRegistrationEnv",
      "formatEffective",
      "formatUnknownModelError",
      "getOpenCodeRefreshTimeoutMs",
      "getProfileOrThrow",
      "isDirectExecution",
      "parseModelsToolArguments",
      "parseSetCommandArguments",
      "printHelp",
    ];

    expect(Object.keys(typeScriptCore).sort()).toEqual(expectedExports);
    expect(Object.keys(runtimeCore).sort()).toEqual(expectedExports);
  });

  it("keeps the TypeScript models CLI core mirror in parity with the runtime module", async () => {
    const typeScriptCore = await import("../scripts/lib/models-cli-core.js");
    const runtimeCore = await import("../dist/scripts/lib/models-cli-core.js");
    const moduleUrl = new URL("../scripts/models.js", import.meta.url);
    const config = {
      models: {
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: {},
        },
      },
    };
    const validEnv = {
      AFERGON_AI_OPENCODE_REFRESH_TIMEOUT_MS: "250",
      AFERGON_AI_CONFIG_DIR: "./config",
      XDG_CONFIG_HOME: "./xdg",
    };
    const invalidEnv = { AFERGON_AI_OPENCODE_REFRESH_TIMEOUT_MS: "0" };
    const capturedTypeScriptHelp = [];
    const capturedRuntimeHelp = [];

    expect(typeScriptCore.isDirectExecution([process.execPath, fileURLToPath(moduleUrl)], moduleUrl.href)).toBe(true);
    expect(runtimeCore.isDirectExecution([process.execPath, fileURLToPath(moduleUrl)], moduleUrl.href)).toBe(true);
    expect(typeScriptCore.isDirectExecution([process.execPath, "other.js"], moduleUrl.href)).toBe(false);
    expect(runtimeCore.isDirectExecution([process.execPath, "other.js"], moduleUrl.href)).toBe(false);
    expect(typeScriptCore.getOpenCodeRefreshTimeoutMs(validEnv)).toBe(runtimeCore.getOpenCodeRefreshTimeoutMs(validEnv));
    expect(typeScriptCore.getOpenCodeRefreshTimeoutMs(invalidEnv)).toBe(runtimeCore.getOpenCodeRefreshTimeoutMs(invalidEnv));
    expect(typeScriptCore.createRegistrationEnv(validEnv)).toEqual(runtimeCore.createRegistrationEnv(validEnv));
    expect(typeScriptCore.createRefreshResult({ status: "clean", stdout: " warning " })).toEqual(
      runtimeCore.createRefreshResult({ status: "clean", stdout: " warning " }),
    );
    expect(typeScriptCore.formatUnknownModelError("openai/gpt-5.6", "openai", ["openai/gpt-5.5"])).toBe(
      runtimeCore.formatUnknownModelError("openai/gpt-5.6", "openai", ["openai/gpt-5.5"]),
    );
    expect(typeScriptCore.formatUnknownModelError("local/custom", "local", [])).toBe(
      runtimeCore.formatUnknownModelError("local/custom", "local", []),
    );
    expect(typeScriptCore.formatEffective({ effective: null })).toBe(runtimeCore.formatEffective({ effective: null }));
    expect(typeScriptCore.formatEffective({ effective: "openai/gpt-5.5" })).toBe(
      runtimeCore.formatEffective({ effective: "openai/gpt-5.5" }),
    );
    expect(typeScriptCore.getProfileOrThrow(config, "budget")).toEqual(runtimeCore.getProfileOrThrow(config, "budget"));
    expect(() => typeScriptCore.getProfileOrThrow(config, "missing")).toThrow("Unknown profile 'missing'.");
    expect(() => runtimeCore.getProfileOrThrow(config, "missing")).toThrow("Unknown profile 'missing'.");
    expect(typeScriptCore.parseSetCommandArguments(["--allow-unknown", "review", "openai/gpt-5.5"])).toEqual(
      runtimeCore.parseSetCommandArguments(["--allow-unknown", "review", "openai/gpt-5.5"]),
    );
    expect(() => typeScriptCore.parseSetCommandArguments(["review"])).toThrow("Usage: afergon-ai models set");
    expect(() => runtimeCore.parseSetCommandArguments(["review"])).toThrow("Usage: afergon-ai models set");

    typeScriptCore.printHelp((line) => capturedTypeScriptHelp.push(line));
    runtimeCore.printHelp((line) => capturedRuntimeHelp.push(line));
    expect(capturedTypeScriptHelp).toEqual(capturedRuntimeHelp);
  });

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

  it("migrates legacy profiles only to OpenCode and keeps tool profiles isolated", async () => {
    const tempRoot = makeTempRoot();
    const configDir = path.join(tempRoot, "config");
    const env = makeUnavailableOpencodeEnv(tempRoot, {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: configDir,
    });
    const legacyConfig = {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
        },
      },
    };
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), `${JSON.stringify(legacyConfig)}\n`);

    const { loadConfig } = await import("../dist/scripts/lib/model-profiles.js");
    const loaded = loadConfig(env);
    expect(loaded.config.version).toBe(2);
    expect(loaded.config.models.tools.opencode.activeProfile).toBe("budget");
    expect(loaded.config.models.tools.pi.profiles).toEqual({});
    expect(loaded.config.models.tools.claude.profiles).toEqual({});
    expect(JSON.parse(fs.readFileSync(path.join(configDir, "config.json"), "utf8"))).toEqual(legacyConfig);

    expect(runCli(["--tool", "pi", "profile", "create", "budget"], env).status).toBe(0);
    expect(runCli(["set", "--tool", "pi", "afg-review", "custom-pi-model"], env).status).toBe(0);
    expect(runCli(["--tool", "claude", "profile", "create", "budget"], env).status).toBe(0);

    const saved = JSON.parse(fs.readFileSync(path.join(configDir, "config.json"), "utf8"));
    expect(saved.version).toBe(2);
    expect(saved.models.tools.opencode.profiles.budget).toEqual({ "afergon-ai": "openai/gpt-5.5" });
    expect(saved.models.tools.pi.profiles.budget).toEqual({ "afg-review": "custom-pi-model" });
    expect(saved.models.tools.claude.profiles.budget).toEqual({});
    expect(saved.models.tools.opencode.activeProfile).toBe("budget");
    expect(saved.models.tools.pi.activeProfile).toBe("budget");
    expect(saved.models.tools.claude.activeProfile).toBe("budget");
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
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
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
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
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
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
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

  it("imports emitted scripts/models.js without running the CLI entrypoint", () => {
    const result = spawnSync(process.execPath, ["-e", "await import('./dist/scripts/models.js')"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
  });

  it("preserves the models wrapper export contract and callable adapter helpers", async () => {
    const modelsWrapper = await import("../scripts/models.js");
    const refreshResult = {
      status: "degraded",
      stdout: "Saved config.",
      stderr: "Refresh skipped.",
    };
    const logged = [];
    const warned = [];
    const tempRoot = makeTempRoot();

    expect(Object.keys(modelsWrapper).sort()).toEqual(["reapplyModelTool", "reapplySupportedAdapters", "reportAdapterRefreshResult"]);
    expect(modelsWrapper.reportAdapterRefreshResult()).toBeUndefined();
    expect(modelsWrapper.reportAdapterRefreshResult(refreshResult, {
      log: (message) => logged.push(message),
      warn: (message) => warned.push(message),
    })).toBe(refreshResult);
    expect(logged).toEqual(["Saved config."]);
    expect(warned).toEqual(["Refresh skipped."]);
    expect(modelsWrapper.reapplySupportedAdapters({
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
    })).toEqual({
      status: "degraded",
      stdout: "Saved config. No managed OpenCode install detected, so only afergon-ai config was updated.",
      stderr: "",
      degraded: true,
    });
    expect(modelsWrapper.reapplyModelTool("pi")).toEqual({
      status: "clean",
      stdout: "Saved Pi profile. Host projection is not available yet.",
      stderr: "",
      degraded: false,
    });
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
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
    };

    expect(runCli(["profile", "create", "budget"], env).status).toBe(0);
    const setResult = runCli(["set", "afergon-ai", "openai/gpt-5.5"], env);
    expect(setResult.status).toBe(0);
    if (process.platform !== "win32") expect(setResult.stdout).toContain("OpenCode registrations refreshed on disk.");

    const opencodeConfig = readJson(path.join(xdgHome, "opencode", "opencode.json"));
    if (process.platform === "win32") {
      expect(opencodeConfig.agent).toBeUndefined();
    } else {
      expect(opencodeConfig.agent["afergon-ai"].model).toBe("openai/gpt-5.5");
      expect(opencodeConfig.agent["afg-implement"].model).toBe("openai/gpt-5.5");
    }
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
    if (process.platform !== "win32") {
      expect(result.stderr).toContain("OpenCode refresh uses Bash, but bash is unavailable");
    }
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
      PATH: `${fakeBashBin}${path.delimiter}${fakeOpencodeBin}${path.delimiter}${process.env.PATH}`,
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
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
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
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
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
  function createSaveAssignmentsEnv(tempRoot) {
    return {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
      AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
    };
  }

  function seedSaveAssignmentsConfig(env, config = undefined) {
    saveConfig(
      config ?? {
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
  }

  function expectSaveResultParity(typeScriptResult, runtimeResult) {
    expect(typeScriptResult.profileName).toBe(runtimeResult.profileName);
    expect(typeScriptResult.assignments).toEqual(runtimeResult.assignments);
    expect(typeScriptResult.refreshResult).toEqual(runtimeResult.refreshResult);
  }

  it("exports only the intended public model profile save orchestration helpers", async () => {
    const modelProfilesSaveTypeScript = await import("../scripts/lib/model-profiles-save.js");
    const modelProfilesSaveRuntime = await import("../dist/scripts/lib/model-profiles-save.js");
    const expectedExports = ["saveProfileAssignments"];

    expect(Object.keys(modelProfilesSaveTypeScript).sort()).toEqual(expectedExports);
    expect(Object.keys(modelProfilesSaveRuntime).sort()).toEqual(expectedExports);
  });

  it("keeps extracted TypeScript model-profiles save behavior aligned with emitted JavaScript for inactive-profile saves", async () => {
    const modelProfilesSaveTypeScript = await import("../scripts/lib/model-profiles-save.js");
    const modelProfilesSaveRuntime = await import("../dist/scripts/lib/model-profiles-save.js");
    const tempRoot = makeTempRoot();
    const typeScriptEnv = createSaveAssignmentsEnv(path.join(tempRoot, "ts"));
    const runtimeEnv = createSaveAssignmentsEnv(path.join(tempRoot, "mjs"));
    const validateTypeScript = vi.fn(() => ({
      status: "known",
      availableModels: ["openai/gpt-5.4-mini"],
    }));
    const validateRuntime = vi.fn(() => ({
      status: "known",
      availableModels: ["openai/gpt-5.4-mini"],
    }));
    const refreshTypeScript = vi.fn();
    const refreshRuntime = vi.fn();
    seedSaveAssignmentsConfig(typeScriptEnv);
    seedSaveAssignmentsConfig(runtimeEnv);

    const typeScriptResult = modelProfilesSaveTypeScript.saveProfileAssignments(
      "fallback",
      {
        "afg-review": "openai/gpt-5.4-mini",
      },
      {
        env: typeScriptEnv,
        refreshActiveProfile: refreshTypeScript,
        validateModelAvailability: validateTypeScript,
      },
    );
    const runtimeResult = modelProfilesSaveRuntime.saveProfileAssignments(
      "fallback",
      {
        "afg-review": "openai/gpt-5.4-mini",
      },
      {
        env: runtimeEnv,
        refreshActiveProfile: refreshRuntime,
        validateModelAvailability: validateRuntime,
      },
    );

    expectSaveResultParity(typeScriptResult, runtimeResult);
    expect(typeScriptResult.configPath).toBe(path.join(typeScriptEnv.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(runtimeResult.configPath).toBe(path.join(runtimeEnv.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(readJson(path.join(typeScriptEnv.AFERGON_AI_CONFIG_DIR, "config.json"))).toEqual(
      readJson(path.join(runtimeEnv.AFERGON_AI_CONFIG_DIR, "config.json")),
    );
    expect(validateTypeScript).toHaveBeenCalledWith("openai/gpt-5.4-mini", typeScriptEnv);
    expect(validateRuntime).toHaveBeenCalledWith("openai/gpt-5.4-mini", runtimeEnv);
    expect(refreshTypeScript).not.toHaveBeenCalled();
    expect(refreshRuntime).not.toHaveBeenCalled();
  });

  it("keeps extracted TypeScript model-profiles save behavior aligned with emitted JavaScript for validation, missing-profile, and rejected-refresh failures", async () => {
    const modelProfilesSaveTypeScript = await import("../scripts/lib/model-profiles-save.js");
    const modelProfilesSaveRuntime = await import("../dist/scripts/lib/model-profiles-save.js");

    const validationTempRoot = makeTempRoot();
    const validationTypeScriptEnv = createSaveAssignmentsEnv(path.join(validationTempRoot, "ts"));
    const validationRuntimeEnv = createSaveAssignmentsEnv(path.join(validationTempRoot, "mjs"));
    seedSaveAssignmentsConfig(validationTypeScriptEnv);
    seedSaveAssignmentsConfig(validationRuntimeEnv);

    expect(() =>
      modelProfilesSaveTypeScript.saveProfileAssignments(
        "fallback",
        { "afg-review": "bad-model" },
        {
          env: validationTypeScriptEnv,
          validateModelAvailability: () => ({
            status: "malformed",
            message: "Model 'bad-model' does not use the expected provider/model format.",
          }),
        },
      ),
    ).toThrow("Model 'bad-model' does not use the expected provider/model format.");
    expect(() =>
      modelProfilesSaveRuntime.saveProfileAssignments(
        "fallback",
        { "afg-review": "bad-model" },
        {
          env: validationRuntimeEnv,
          validateModelAvailability: () => ({
            status: "malformed",
            message: "Model 'bad-model' does not use the expected provider/model format.",
          }),
        },
      ),
    ).toThrow("Model 'bad-model' does not use the expected provider/model format.");

    const missingProfileTempRoot = makeTempRoot();
    const missingProfileTypeScriptEnv = createSaveAssignmentsEnv(path.join(missingProfileTempRoot, "ts"));
    const missingProfileRuntimeEnv = createSaveAssignmentsEnv(path.join(missingProfileTempRoot, "mjs"));
    seedSaveAssignmentsConfig(missingProfileTypeScriptEnv);
    seedSaveAssignmentsConfig(missingProfileRuntimeEnv);

    expect(() => modelProfilesSaveTypeScript.saveProfileAssignments("missing", {}, { env: missingProfileTypeScriptEnv })).toThrow(
      "Unknown profile 'missing'.",
    );
    expect(() => modelProfilesSaveRuntime.saveProfileAssignments("missing", {}, { env: missingProfileRuntimeEnv })).toThrow(
      "Unknown profile 'missing'.",
    );

    const rejectedRefresh = new Error("Refresh failed.");
    const rejectedPromiseTypeScript = modelProfilesSaveTypeScript.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: missingProfileTypeScriptEnv,
        refreshActiveProfile: () => Promise.reject(rejectedRefresh),
      },
    );
    const rejectedPromiseRuntime = modelProfilesSaveRuntime.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: missingProfileRuntimeEnv,
        refreshActiveProfile: () => Promise.reject(rejectedRefresh),
      },
    );

    await expect(rejectedPromiseTypeScript).rejects.toThrow("Refresh failed.");
    await expect(rejectedPromiseRuntime).rejects.toThrow("Refresh failed.");
  });

  it("keeps extracted TypeScript model-profiles save behavior aligned with emitted JavaScript for sync and async active-profile refresh results", async () => {
    const modelProfilesSaveTypeScript = await import("../scripts/lib/model-profiles-save.js");
    const modelProfilesSaveRuntime = await import("../dist/scripts/lib/model-profiles-save.js");

    const syncTempRoot = makeTempRoot();
    const syncTypeScriptEnv = createSaveAssignmentsEnv(path.join(syncTempRoot, "ts"));
    const syncRuntimeEnv = createSaveAssignmentsEnv(path.join(syncTempRoot, "mjs"));
    seedSaveAssignmentsConfig(syncTypeScriptEnv, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    });
    seedSaveAssignmentsConfig(syncRuntimeEnv, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    });

    const syncTypeScriptResult = modelProfilesSaveTypeScript.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: syncTypeScriptEnv,
        refreshActiveProfile: () => ({
          status: "degraded",
          stdout: "Saved config. OpenCode refresh timed out after 500ms.",
          stderr: "Run 'afergon-ai update' to retry the host registration refresh.",
        }),
      },
    );
    const syncRuntimeResult = modelProfilesSaveRuntime.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: syncRuntimeEnv,
        refreshActiveProfile: () => ({
          status: "degraded",
          stdout: "Saved config. OpenCode refresh timed out after 500ms.",
          stderr: "Run 'afergon-ai update' to retry the host registration refresh.",
        }),
      },
    );

    expectSaveResultParity(syncTypeScriptResult, syncRuntimeResult);
    expect(syncTypeScriptResult.refreshResult).toEqual({
      status: "degraded",
      stdout: "Saved config. OpenCode refresh timed out after 500ms.",
      stderr: "Run 'afergon-ai update' to retry the host registration refresh.",
      degraded: true,
    });

    const asyncTempRoot = makeTempRoot();
    const asyncTypeScriptEnv = createSaveAssignmentsEnv(path.join(asyncTempRoot, "ts"));
    const asyncRuntimeEnv = createSaveAssignmentsEnv(path.join(asyncTempRoot, "mjs"));
    seedSaveAssignmentsConfig(asyncTypeScriptEnv, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    });
    seedSaveAssignmentsConfig(asyncRuntimeEnv, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    });

    const asyncTypeScriptResult = await modelProfilesSaveTypeScript.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: asyncTypeScriptEnv,
        refreshActiveProfile: () =>
          Promise.resolve({
            status: "clean",
            stdout: "OpenCode registrations refreshed on disk.",
            stderr: "",
          }),
      },
    );
    const asyncRuntimeResult = await modelProfilesSaveRuntime.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: asyncRuntimeEnv,
        refreshActiveProfile: () =>
          Promise.resolve({
            status: "clean",
            stdout: "OpenCode registrations refreshed on disk.",
            stderr: "",
          }),
      },
    );

    expectSaveResultParity(asyncTypeScriptResult, asyncRuntimeResult);
  });

  it("keeps extracted TypeScript model-profiles save behavior aligned with emitted JavaScript for function-shaped thenable immediate return values", async () => {
    const modelProfilesSaveTypeScript = await import("../scripts/lib/model-profiles-save.js");
    const modelProfilesSaveRuntime = await import("../dist/scripts/lib/model-profiles-save.js");

    const thenableTempRoot = makeTempRoot();
    const thenableTypeScriptEnv = createSaveAssignmentsEnv(path.join(thenableTempRoot, "ts"));
    const thenableRuntimeEnv = createSaveAssignmentsEnv(path.join(thenableTempRoot, "mjs"));
    seedSaveAssignmentsConfig(thenableTypeScriptEnv, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    });
    seedSaveAssignmentsConfig(thenableRuntimeEnv, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    });

    const sentinelResult = { type: "custom-then-return" };

    const createFunctionThenable = () => {
      const thenable = () => undefined;
      thenable.then = (resolve) => {
        resolve({
          status: "clean",
          stdout: "OpenCode registrations refreshed from a function-shaped thenable.",
          stderr: "",
        });
        return sentinelResult;
      };
      return thenable;
    };

    const typeScriptResult = modelProfilesSaveTypeScript.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: thenableTypeScriptEnv,
        refreshActiveProfile: createFunctionThenable,
      },
    );
    const runtimeResult = modelProfilesSaveRuntime.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: thenableRuntimeEnv,
        refreshActiveProfile: createFunctionThenable,
      },
    );

    expect(typeScriptResult).toBe(sentinelResult);
    expect(runtimeResult).toBe(sentinelResult);
  });

  it("keeps extracted TypeScript model-profiles save behavior aligned with emitted JavaScript for degraded guidance normalization", async () => {
    const modelProfilesSaveTypeScript = await import("../scripts/lib/model-profiles-save.js");
    const modelProfilesSaveRuntime = await import("../dist/scripts/lib/model-profiles-save.js");
    const tempRoot = makeTempRoot();
    const typeScriptEnv = createSaveAssignmentsEnv(path.join(tempRoot, "ts"));
    const runtimeEnv = createSaveAssignmentsEnv(path.join(tempRoot, "mjs"));
    seedSaveAssignmentsConfig(typeScriptEnv, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    });
    seedSaveAssignmentsConfig(runtimeEnv, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
          },
        },
      },
    });

    const typeScriptResult = modelProfilesSaveTypeScript.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: typeScriptEnv,
        refreshActiveProfile: () => ({
          status: "clean",
          stdout: "OpenCode: warning: missing managed agent file(s): afergon-ai.md\nRun 'afergon-ai update' or 'afergon-ai init --opencode' to repair.",
          stderr: "",
        }),
      },
    );
    const runtimeResult = modelProfilesSaveRuntime.saveProfileAssignments(
      "budget",
      { "afg-review": "inherit" },
      {
        env: runtimeEnv,
        refreshActiveProfile: () => ({
          status: "clean",
          stdout: "OpenCode: warning: missing managed agent file(s): afergon-ai.md\nRun 'afergon-ai update' or 'afergon-ai init --opencode' to repair.",
          stderr: "",
        }),
      },
    );

    expectSaveResultParity(typeScriptResult, runtimeResult);
    expect(typeScriptResult.refreshResult).toEqual({
      status: "degraded",
      stdout: "OpenCode: warning: missing managed agent file(s): afergon-ai.md\nRun 'afergon-ai update' or 'afergon-ai init --opencode' to repair.",
      stderr: "",
      degraded: true,
    });
  });

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

describe.skipIf(process.platform === "win32")("OpenCode registrar behavior", () => {
  it("persists the approved complete afergon-ai permission policy", () => {
    const { config, result } = runIsolatedRegistrar();

    expect(result.status).toBe(0);
    expect(config.agent["afergon-ai"].permission, "afergon-ai persisted permission").toEqual(
      APPROVED_AGENT_PERMISSIONS["afergon-ai"],
    );
  });

  it("persists the approved complete afg-debate permission policy", () => {
    const { config, result } = runIsolatedRegistrar();

    expect(result.status).toBe(0);
    expect(config.agent["afg-debate"].permission, "afg-debate persisted permission").toEqual(
      APPROVED_AGENT_PERMISSIONS["afg-debate"],
    );
  });

  it("keeps named agent frontmatter and persisted permissions aligned with the approved policies", () => {
    const { config, result } = runIsolatedRegistrar();

    expect(result.status).toBe(0);
    for (const agentName of ["afg-debate", "afergon-ai"]) {
      expect(readFrontmatterPermissions(agentName), `${agentName} frontmatter permission`).toEqual(
        APPROVED_AGENT_PERMISSIONS[agentName],
      );
      expect(config.agent[agentName].permission, `${agentName} persisted permission`).toEqual(
        readFrontmatterPermissions(agentName),
      );
    }
  });

  it("allows the persisted bounded debate-summary write target", () => {
    const { config, result } = runIsolatedRegistrar();

    expect(result.status).toBe(0);
    expect(
      evaluateWritePermission(
        config.agent["afg-debate"].permission.write,
        "openspec/debate/debate-summary-agent-permissions.md",
      ),
      "afg-debate persisted write permission for bounded debate summary",
    ).toBe("allow");
  });

  it("denies a nonmatching write target through the persisted debate policy", () => {
    const { config, result } = runIsolatedRegistrar();

    expect(result.status).toBe(0);
    expect(
      evaluateWritePermission(
        config.agent["afg-debate"].permission.write,
        "openspec/debate/notes.md",
      ),
      "afg-debate persisted write permission for nonmatching path",
    ).toBe("deny");
  });

  it("normalizes Windows separators before evaluating persisted write rules", () => {
    const { config, result } = runIsolatedRegistrar();

    expect(result.status).toBe(0);
    expect(
      evaluateWritePermission(
        config.agent["afg-debate"].permission.write,
        "openspec\\debate\\debate-summary-agent-permissions.md",
      ),
      "afg-debate normalized persisted write path",
    ).toBe("allow");
  });

  it("falls back to ask when no bounded write rule matches", () => {
    expect(
      evaluateWritePermission({ "openspec/debate/*": "deny" }, "docs/notes.md"),
      "unmatched write permission fallback",
    ).toBe("ask");
  });

  it("anchors wildcards and applies the last matching write rule", () => {
    expect(evaluateWritePermission({ "*": "deny", "draft?.md": "allow" }, "draft1.md")).toBe("allow");
    expect(evaluateWritePermission({ "notes.md": "allow" }, "prefix-notes.md")).toBe("ask");
    expect(
      evaluateWritePermission({ "*": "deny", "*.md": "allow", "notes.md": "deny" }, "notes.md"),
    ).toBe("deny");
  });

  it("rejects unsupported write-rule shapes and effects", () => {
    expect(() => evaluateWritePermission(["deny"], "notes.md")).toThrow(
      "write permission rules must be a plain object",
    );
    expect(() => evaluateWritePermission({ "*": "sometimes" }, "notes.md")).toThrow(
      'write permission rule "*" has unsupported effect: sometimes',
    );
  });

  it.each(["afg-debate.md", "afergon-ai.md"])(
    "skips opencode.json writes when required managed agent file %s is missing",
    (missingAgentFile) => {
      const tempRoot = makeTempRoot();
      const xdgHome = path.join(tempRoot, "xdg");
      const opencodeDir = path.join(xdgHome, "opencode");
      const agentsDir = copyManagedAgents(xdgHome);
      fs.rmSync(path.join(agentsDir, missingAgentFile));
      const existingConfig = Buffer.from(
        '{\n  "$schema": "https://opencode.ai/config.json",\n  "agent": {\n    "sentinel": { "prompt": "keep exactly — café" }\n  }\n}\n',
        "utf8",
      );
      const opencodeConfigPath = path.join(opencodeDir, "opencode.json");
      fs.writeFileSync(opencodeConfigPath, existingConfig);

      const result = runRegistrar(tempRoot, xdgHome);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`missing managed agent file(s): ${missingAgentFile}`);
      expect(fs.readFileSync(opencodeConfigPath)).toEqual(existingConfig);
    },
  );

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
