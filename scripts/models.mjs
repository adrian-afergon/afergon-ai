#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  cloneAssignments,
  ensureActiveProfile,
  getConfigDir,
  getActiveProfile,
  getOpenCodeBaseDir,
  loadConfig,
  normalizeAgentName,
  normalizeProfileName,
  normalizeStoredModel,
  readOpenCodeAgentModels,
  resolveAssignments,
  saveConfig,
  SUPPORTED_AGENTS,
  validateModelAvailability,
} from "./lib/model-profiles.mjs";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OPENCODE_REFRESH_TIMEOUT_MS = 10000;

function getOpenCodeRefreshTimeoutMs(env = process.env) {
  const rawTimeout = env.AFERGON_AI_OPENCODE_REFRESH_TIMEOUT_MS;
  if (!rawTimeout) {
    return DEFAULT_OPENCODE_REFRESH_TIMEOUT_MS;
  }

  const timeout = Number.parseInt(rawTimeout, 10);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_OPENCODE_REFRESH_TIMEOUT_MS;
}

function createRegistrationEnv() {
  return {
    ...process.env,
    AFERGON_AI_CONFIG_DIR: getConfigDir(),
    AFG_OPENCODE_REGISTER_NONINTERACTIVE: "1",
    ...(process.env.XDG_CONFIG_HOME ? { XDG_CONFIG_HOME: path.resolve(process.env.XDG_CONFIG_HOME) } : {}),
  };
}

function printHelp() {
  console.log("afergon-ai models — manage afergon-ai model profiles");
  console.log("");
  console.log("Usage:");
  console.log("  afergon-ai models");
  console.log("  afergon-ai models show");
  console.log("  afergon-ai models show <profile>");
  console.log("  afergon-ai models list");
  console.log("  afergon-ai models switch <profile>");
  console.log("  afergon-ai models set [--allow-unknown] <agent> <model|inherit>");
  console.log("  afergon-ai models profile show <name>");
  console.log("  afergon-ai models profile create <name>");
  console.log("  afergon-ai models profile delete <name>");
  console.log("");
  console.log(`Supported agents: ${SUPPORTED_AGENTS.join(", ")}`);
  console.log("Aliases: orchestrator, main, debate, breakdown, specify, plannify, implement, review, design");
  console.log("");
  console.log("Notes:");
  console.log("  - Missing agent assignments inherit from afergon-ai.");
  console.log("  - 'inherit' means defer to afergon-ai; if that is also unset, runtime defaults are preserved.");
  console.log("  - Concrete model strings should use provider/model format, for example 'openai/gpt-5.5'.");
  console.log("  - Concrete models are validated with 'opencode models <provider>' when available.");
  console.log("  - Use '--allow-unknown' to save an unlisted or custom concrete model after reviewing the warning.");
  console.log("  - Changes update afergon-ai-owned config and refresh compatible host config on disk when supported.");
  console.log("  - Live hot-swap is not guaranteed for already-running sessions.");
}

function formatUnknownModelError(model, provider, suggestions) {
  const lines = [`Requested model '${model}' is not available from provider '${provider}'.`];
  if (suggestions.length > 0) {
    lines.push(`Did you mean: ${suggestions.join(", ")}?`);
  }
  lines.push("If you really need to save it anyway, rerun with '--allow-unknown'.");
  return lines.join(" ");
}

function formatEffective(entry) {
  return entry.effective ?? "(runtime default)";
}

function getProfileOrThrow(config, profileNameInput) {
  const profileName = normalizeProfileName(profileNameInput);
  const profile = config.models.profiles[profileName];
  if (!profile) {
    const available = Object.keys(config.models.profiles).sort();
    const suffix = available.length > 0 ? ` Available profiles: ${available.join(", ")}` : " No profiles exist yet.";
    throw new Error(`Unknown profile '${profileName}'.${suffix}`);
  }

  return { profileName, profile };
}

function showCurrentConfig(profileNameInput) {
  const { config, configPath, exists } = loadConfig();
  const activeProfileName = config.models.activeProfile;
  const selected = profileNameInput
    ? getProfileOrThrow(config, profileNameInput)
    : {
        profileName: activeProfileName,
        profile: getActiveProfile(config) ?? {},
      };
  const resolved = resolveAssignments(selected.profile);

  console.log(`Config path: ${configPath}`);
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

function listProfiles() {
  const { config, configPath } = loadConfig();
  const activeProfileName = config.models.activeProfile;
  const profileNames = Object.keys(config.models.profiles).sort();

  console.log(`Config path: ${configPath}`);
  if (profileNames.length === 0) {
    console.log("No model profiles defined.");
    return;
  }

  for (const profileName of profileNames) {
    const marker = profileName === activeProfileName ? "*" : " ";
    console.log(`${marker} ${profileName}`);
  }
}

function reapplySupportedAdapters() {
  const opencodeBaseDir = getOpenCodeBaseDir();
  const opencodeAgentsDir = path.join(opencodeBaseDir, "agents");
  const opencodeConfigPath = path.join(opencodeBaseDir, "opencode.json");
  const requiredAgentFiles = SUPPORTED_AGENTS.map((agentName) => path.join(opencodeAgentsDir, `${agentName}.md`));
  const missingAgentFiles = requiredAgentFiles.filter((agentPath) => !fs.existsSync(agentPath));
  const opencodeInstalled = fs.existsSync(opencodeConfigPath) && missingAgentFiles.length === 0;

  if (!opencodeInstalled) {
    if (fs.existsSync(opencodeConfigPath) && missingAgentFiles.length > 0) {
      console.log(
        `Saved config. OpenCode install is missing managed agent file(s): ${missingAgentFiles.map((agentPath) => path.basename(agentPath)).join(", ")}. Run 'afergon-ai update' or 'afergon-ai init --opencode' to repair; only afergon-ai config was updated.`,
      );
      return;
    }
    console.log("Saved config. No managed OpenCode install detected, so only afergon-ai config was updated.");
    return;
  }

  const registerScript = path.join(PACKAGE_ROOT, "scripts/register-opencode-agents.sh");
  if (process.platform === "win32" && !process.env.AFG_FORCE_OPENCODE_BASH_REFRESH) {
    console.warn(
      "Saved config. OpenCode refresh uses Bash and was skipped on Windows. Run 'afergon-ai update' from a Bash-capable shell to refresh OpenCode registrations.",
    );
    return;
  }
  if (!process.env.AFG_FORCE_OPENCODE_BASH_REFRESH) {
    const bashCheck = spawnSync("bash", ["--version"], { stdio: "ignore", timeout: getOpenCodeRefreshTimeoutMs() });
    if (bashCheck.status !== 0) {
      console.warn(
        "Saved config. OpenCode refresh uses Bash, but bash is unavailable. Run 'afergon-ai update' from a Bash-capable shell to refresh OpenCode registrations.",
      );
      return;
    }
  }
  const adapterPath = path.join(PACKAGE_ROOT, "adapters/opencode");
  const refreshTimeout = getOpenCodeRefreshTimeoutMs();
  const result = spawnSync("bash", [registerScript, adapterPath], {
    cwd: PACKAGE_ROOT,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
    env: createRegistrationEnv(),
    timeout: refreshTimeout,
  });

  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
  if (result.error?.code === "ETIMEDOUT") {
    console.warn(
      `Saved config. OpenCode refresh timed out after ${refreshTimeout}ms. Run 'afergon-ai update' to retry the host registration refresh.`,
    );
    return;
  }
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const errorMessage = result.stderr.trim() || "OpenCode refresh failed.";
    throw new Error(errorMessage);
  }

  console.log("OpenCode registrations refreshed on disk. Start a new compatible run if the current session does not pick this up automatically.");
}

function switchProfile(profileNameInput) {
  const { config } = loadConfig();
  const { profileName } = getProfileOrThrow(config, profileNameInput);

  config.models.activeProfile = profileName;
  const configPath = saveConfig(config);
  console.log(`Switched active profile to '${profileName}'.`);
  console.log(`Config path: ${configPath}`);
  reapplySupportedAdapters();
}

function setAgentModel(agentInput, modelInput, options = {}) {
  const agentName = normalizeAgentName(agentInput);
  const normalizedModel = normalizeStoredModel(modelInput);
  if (!normalizedModel) {
    throw new Error("Model is required. Use a concrete model string or 'inherit'.");
  }

  if (normalizedModel !== "inherit") {
    const validation = validateModelAvailability(normalizedModel);
    if (validation.status === "malformed") {
      if (!options.allowUnknown) {
        throw new Error(validation.message);
      }
      console.warn(`Warning: ${validation.message}`);
    }

    if (validation.status === "unknown") {
      const errorMessage = formatUnknownModelError(normalizedModel, validation.provider, validation.suggestions ?? []);
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
  const activeProfileName = ensureActiveProfile(config);
  config.models.profiles[activeProfileName][agentName] = normalizedModel;
  const configPath = saveConfig(config);

  console.log(`Updated profile '${activeProfileName}': ${agentName} -> ${normalizedModel}`);
  console.log(`Config path: ${configPath}`);
  reapplySupportedAdapters();
}

function parseSetCommandArguments(args) {
  let allowUnknown = false;
  const positional = [];

  for (const arg of args) {
    if (arg === "--allow-unknown") {
      allowUnknown = true;
      continue;
    }
    positional.push(arg);
  }

  if (positional.length !== 2) {
    throw new Error("Usage: afergon-ai models set [--allow-unknown] <agent> <model|inherit>");
  }

  return {
    allowUnknown,
    agent: positional[0],
    model: positional[1],
  };
}

function createProfile(profileNameInput) {
  const profileName = normalizeProfileName(profileNameInput);
  const { config } = loadConfig();

  if (config.models.profiles[profileName]) {
    throw new Error(`Profile '${profileName}' already exists.`);
  }

  const activeProfile = getActiveProfile(config);
  const snapshot = activeProfile ? cloneAssignments(activeProfile) : readOpenCodeAgentModels();

  config.models.profiles[profileName] = snapshot;
  if (!config.models.activeProfile) {
    config.models.activeProfile = profileName;
  }

  const configPath = saveConfig(config);
  console.log(`Created profile '${profileName}'.`);
  console.log(`Config path: ${configPath}`);
  console.log(
    activeProfile
      ? "Seeded from the current afergon-ai profile assignments."
      : "Seeded from current managed host assignments when available.",
  );

  if (config.models.activeProfile === profileName) {
    reapplySupportedAdapters();
  }
}

function deleteProfile(profileNameInput) {
  const profileName = normalizeProfileName(profileNameInput);
  const { config } = loadConfig();

  if (!config.models.profiles[profileName]) {
    throw new Error(`Profile '${profileName}' does not exist.`);
  }

  delete config.models.profiles[profileName];
  if (config.models.activeProfile === profileName) {
    const remaining = Object.keys(config.models.profiles).sort();
    config.models.activeProfile = remaining[0] ?? null;
  }

  const configPath = saveConfig(config);
  console.log(`Deleted profile '${profileName}'.`);
  console.log(`Config path: ${configPath}`);
  reapplySupportedAdapters();
}

function main(argv) {
  const [command, ...rest] = argv;
  switch (command ?? "show") {
    case "show":
      if (rest.length > 1) {
        throw new Error("Usage: afergon-ai models show [profile]");
      }
      showCurrentConfig(rest[0]);
      return;
    case "list":
      listProfiles();
      return;
    case "switch":
      if (rest.length !== 1) {
        throw new Error("Usage: afergon-ai models switch <profile>");
      }
      switchProfile(rest[0]);
      return;
    case "set":
      {
        const parsed = parseSetCommandArguments(rest);
        setAgentModel(parsed.agent, parsed.model, { allowUnknown: parsed.allowUnknown });
      }
      return;
    case "profile":
      if (rest[0] === "show" && rest.length === 2) {
        showCurrentConfig(rest[1]);
        return;
      }
      if (rest[0] === "create" && rest.length === 2) {
        createProfile(rest[1]);
        return;
      }
      if (rest[0] === "delete" && rest.length === 2) {
        deleteProfile(rest[1]);
        return;
      }
      throw new Error("Usage: afergon-ai models profile <show|create|delete> <name>");
    case "--help":
    case "-h":
      printHelp();
      return;
    default:
      throw new Error(`Unknown models subcommand '${command}'.`);
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("Run 'afergon-ai models --help' for usage.");
  process.exitCode = 1;
}
