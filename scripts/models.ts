#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  cloneAssignments,
  ensureActiveProfile,
  getActiveProfile,
  getModelProfileToolLabel,
  getOpenCodeBaseDir,
  getToolProfileStore,
  loadConfig,
  normalizeAgentName,
  normalizeModelProfileTool,
  normalizeProfileName,
  normalizeStoredModel,
  readOpenCodeAgentModels,
  resolveAssignments,
  saveConfig,
  SUPPORTED_AGENTS,
  validateModelForTool,
} from "./lib/model-profiles.js";
import {
  createRefreshResult,
  createRegistrationEnv,
  formatEffective,
  formatUnknownModelError,
  getOpenCodeRefreshTimeoutMs,
  getProfileOrThrow,
  isDirectExecution,
  parseModelsToolArguments,
  parseSetCommandArguments,
  printHelp,
} from "./lib/models-cli-core.js";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function reportAdapterRefreshResult(
  result: ReturnType<typeof createRefreshResult>,
  { log = console.log, warn = console.warn }: { log?: (message: string) => void; warn?: (message: string) => void } = {},
) {
  if (!result) {
    return result;
  }

  if (result.stdout) {
    log(result.stdout);
  }
  if (result.stderr) {
    warn(result.stderr);
  }

  return result;
}


function showCurrentConfig(tool, profileNameInput?: string) {
  const { config, configPath, exists } = loadConfig();
  const store = getToolProfileStore(config, tool);
  const activeProfileName = store.activeProfile;
  const selected = profileNameInput
    ? getProfileOrThrow(store, profileNameInput)
    : {
        profileName: activeProfileName,
        profile: getActiveProfile(config, tool) ?? {},
      };
  const resolved = resolveAssignments(selected.profile);

  console.log(`Config path: ${configPath}`);
  console.log(`Tool: ${getModelProfileToolLabel(tool)}`);
  console.log(`Active profile: ${activeProfileName ?? "(none)"}`);
  if (profileNameInput) {
    console.log(`Shown profile: ${selected.profileName}`);
  }
  if (!exists) {
    console.log("Status: no afergon-ai model config yet; runtime defaults remain untouched.");
  }
  console.log("");
  console.log("Resolved assignments:");
  for (const entry of resolved) {
    console.log(
      `- ${entry.agent}: configured=${entry.configured}, effective=${formatEffective(entry)}, source=${entry.source}`,
    );
  }
}

function listProfiles(tool) {
  const { config, configPath } = loadConfig();
  const store = getToolProfileStore(config, tool);
  const activeProfileName = store.activeProfile;
  const profileNames = Object.keys(store.profiles).sort();

  console.log(`Config path: ${configPath}`);
  console.log(`Tool: ${getModelProfileToolLabel(tool)}`);
  if (profileNames.length === 0) {
    console.log("No model profiles defined.");
    return;
  }

  for (const profileName of profileNames) {
    const marker = profileName === activeProfileName ? "*" : " ";
    console.log(`${marker} ${profileName}`);
  }
}

export function reapplySupportedAdapters(env: NodeJS.ProcessEnv = process.env) {
  const opencodeBaseDir = getOpenCodeBaseDir(env);
  if (!opencodeBaseDir) {
    return createRefreshResult({
      status: "degraded",
      stdout: "Saved config. OpenCode user config directory could not be resolved, so host projection was skipped.",
    });
  }
  const opencodeAgentsDir = path.join(opencodeBaseDir, "agents");
  const opencodeConfigPath = path.join(opencodeBaseDir, "opencode.json");
  const requiredAgentFiles = SUPPORTED_AGENTS.map((agentName) => path.join(opencodeAgentsDir, `${agentName}.md`));
  const missingAgentFiles = requiredAgentFiles.filter((agentPath) => !fs.existsSync(agentPath));
  const opencodeInstalled = fs.existsSync(opencodeConfigPath) && missingAgentFiles.length === 0;

  if (!opencodeInstalled) {
    if (fs.existsSync(opencodeConfigPath) && missingAgentFiles.length > 0) {
      return createRefreshResult({
        status: "degraded",
        stdout: `Saved config. OpenCode install is missing managed agent file(s): ${missingAgentFiles.map((agentPath) => path.basename(agentPath)).join(", ")}. Run 'afergon-ai update' or 'afergon-ai init --opencode' to repair; only afergon-ai config was updated.`,
      });
    }

    return createRefreshResult({
      status: "degraded",
      stdout: "Saved config. No managed OpenCode install detected, so only afergon-ai config was updated.",
    });
  }

  const registerScript = path.join(PACKAGE_ROOT, "scripts/register-opencode-agents.sh");
  if (process.platform === "win32" && !env.AFG_FORCE_OPENCODE_BASH_REFRESH) {
    return createRefreshResult({
      status: "degraded",
      stderr:
        "Saved config. OpenCode refresh uses Bash and was skipped on Windows. Run 'afergon-ai update' from a Bash-capable shell to refresh OpenCode registrations.",
    });
  }
  if (!env.AFG_FORCE_OPENCODE_BASH_REFRESH) {
    const bashCheck = spawnSync("bash", ["--version"], { stdio: "ignore", timeout: getOpenCodeRefreshTimeoutMs(env), env });
    if (bashCheck.status !== 0) {
      return createRefreshResult({
        status: "degraded",
        stderr:
          "Saved config. OpenCode refresh uses Bash, but bash is unavailable. Run 'afergon-ai update' from a Bash-capable shell to refresh OpenCode registrations.",
      });
    }
  }
  const adapterPath = path.join(PACKAGE_ROOT, "adapters/opencode");
  const refreshTimeout = getOpenCodeRefreshTimeoutMs(env);
  const result = spawnSync("bash", [registerScript, adapterPath], {
    cwd: PACKAGE_ROOT,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
    env: createRegistrationEnv(env),
    timeout: refreshTimeout,
  });

  if ((result.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT") {
    return createRefreshResult({
      status: "degraded",
      stdout: result.stdout.trim(),
      stderr: `Saved config. OpenCode refresh timed out after ${refreshTimeout}ms. Run 'afergon-ai update' to retry the host registration refresh.`,
    });
  }
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const errorMessage = result.stderr.trim() || "OpenCode refresh failed.";
    throw new Error(errorMessage);
  }

  return createRefreshResult({
    status: "clean",
    stdout: [
      result.stdout.trim(),
      "OpenCode registrations refreshed on disk. Start a new compatible run if the current session does not pick this up automatically.",
    ]
      .filter(Boolean)
      .join("\n"),
    stderr: result.stderr.trim(),
  });
}

export function reapplyModelTool(toolInput, env: NodeJS.ProcessEnv = process.env) {
  const tool = normalizeModelProfileTool(toolInput);
  if (tool === "opencode") {
    return reapplySupportedAdapters(env);
  }

  return createRefreshResult({
    status: "clean",
    stdout: `Saved ${getModelProfileToolLabel(tool)} profile. Host projection is not available yet.`,
  });
}

function switchProfile(tool, profileNameInput: string) {
  const { config } = loadConfig();
  const store = getToolProfileStore(config, tool);
  const { profileName } = getProfileOrThrow(store, profileNameInput);

  store.activeProfile = profileName;
  const configPath = saveConfig(config);
  console.log(`Switched active profile to '${profileName}'.`);
  console.log(`Config path: ${configPath}`);
  reportAdapterRefreshResult(reapplyModelTool(tool));
}

function setAgentModel(tool, agentInput: string, modelInput: string, options: { allowUnknown?: boolean } = {}) {
  const agentName = normalizeAgentName(agentInput);
  const normalizedModel = normalizeStoredModel(modelInput);
  if (!normalizedModel) {
    throw new Error("Model is required. Use a concrete model string or 'inherit'.");
  }

  if (normalizedModel !== "inherit") {
    const validation = validateModelForTool(tool, normalizedModel);
    if (validation.status === "malformed") {
      if (!options.allowUnknown) {
        throw new Error(validation.message);
      }
      console.warn(`Warning: ${validation.message}`);
    }

    if (validation.status === "unknown") {
      const errorMessage = formatUnknownModelError(normalizedModel, validation.provider!, validation.suggestions ?? []);
      if (!options.allowUnknown) {
        throw new Error(errorMessage);
      }
      console.warn(`Warning: ${errorMessage}`);
    }

    if (validation.status === "unverified") {
      console.warn(`Warning: ${validation.warning}`);
    }
  }

  const { config } = loadConfig();
  const store = getToolProfileStore(config, tool);
  const activeProfileName = ensureActiveProfile(config, tool);
  store.profiles[activeProfileName][agentName] = normalizedModel;
  const configPath = saveConfig(config);

  console.log(`Updated profile '${activeProfileName}': ${agentName} -> ${normalizedModel}`);
  console.log(`Config path: ${configPath}`);
  reportAdapterRefreshResult(reapplyModelTool(tool));
}

function createProfile(tool, profileNameInput: string) {
  const profileName = normalizeProfileName(profileNameInput);
  const { config } = loadConfig();
  const store = getToolProfileStore(config, tool);

  if (Object.hasOwn(store.profiles, profileName)) {
    throw new Error(`Profile '${profileName}' already exists.`);
  }

  const activeProfile = getActiveProfile(config, tool);
  const snapshot = activeProfile
    ? cloneAssignments(activeProfile)
    : (tool === "opencode" ? readOpenCodeAgentModels() : {});

  store.profiles[profileName] = snapshot;
  if (!store.activeProfile) {
    store.activeProfile = profileName;
  }

  const configPath = saveConfig(config);
  console.log(`Created profile '${profileName}'.`);
  console.log(`Config path: ${configPath}`);
  console.log(
    activeProfile
      ? "Seeded from the current afergon-ai profile assignments."
      : tool === "opencode"
        ? "Seeded from current managed host assignments when available."
        : "Started with no assignments.",
  );

  if (store.activeProfile === profileName) {
    reportAdapterRefreshResult(reapplyModelTool(tool));
  }
}

function deleteProfile(tool, profileNameInput: string) {
  const profileName = normalizeProfileName(profileNameInput);
  const { config } = loadConfig();
  const store = getToolProfileStore(config, tool);

  if (!Object.hasOwn(store.profiles, profileName)) {
    throw new Error(`Profile '${profileName}' does not exist.`);
  }

  const wasActive = store.activeProfile === profileName;
  delete store.profiles[profileName];
  if (wasActive) {
    const remaining = Object.keys(store.profiles).sort();
    store.activeProfile = remaining[0] ?? null;
  }

  const configPath = saveConfig(config);
  console.log(`Deleted profile '${profileName}'.`);
  console.log(`Config path: ${configPath}`);
  if (wasActive) {
    reportAdapterRefreshResult(reapplyModelTool(tool));
  }
}

function main(argv: readonly string[]) {
  const { tool, args } = parseModelsToolArguments(argv);
  const [command, ...rest] = args;
  switch (command ?? "show") {
    case "show":
      if (rest.length > 1) {
        throw new Error("Usage: afergon-ai models [--tool <pi|claude|opencode>] show [profile]");
      }
      showCurrentConfig(tool, rest[0]);
      return;
    case "list":
      listProfiles(tool);
      return;
    case "switch":
      if (rest.length !== 1) {
        throw new Error("Usage: afergon-ai models [--tool <pi|claude|opencode>] switch <profile>");
      }
      switchProfile(tool, rest[0]);
      return;
    case "set":
      {
        const parsed = parseSetCommandArguments(rest);
        setAgentModel(tool, parsed.agent, parsed.model, { allowUnknown: parsed.allowUnknown });
      }
      return;
    case "profile":
      if (rest[0] === "show" && rest.length === 2) {
        showCurrentConfig(tool, rest[1]);
        return;
      }
      if (rest[0] === "create" && rest.length === 2) {
        createProfile(tool, rest[1]);
        return;
      }
      if (rest[0] === "delete" && rest.length === 2) {
        deleteProfile(tool, rest[1]);
        return;
      }
      throw new Error("Usage: afergon-ai models [--tool <pi|claude|opencode>] profile <show|create|delete> <name>");
    case "--help":
    case "-h":
      printHelp();
      return;
    default:
      throw new Error(`Unknown models subcommand '${command}'.`);
  }
}

if (isDirectExecution(process.argv, import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("Run 'afergon-ai models --help' for usage.");
    process.exitCode = 1;
  }
}
