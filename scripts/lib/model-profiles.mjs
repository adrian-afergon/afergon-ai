import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  SUPPORTED_AGENTS,
  cloneAssignments,
  hasDegradedRefreshGuidance,
  normalizeAgentName,
  normalizeProfileName,
  normalizeRefreshResult,
  normalizeStoredModel,
  parseProviderModel,
  resolveAssignments,
  suggestCloseModelIds,
} from "./model-profiles-core.mjs";
import {
  createDefaultConfig,
  ensureActiveProfile,
  getActiveProfile,
  getConfigDir,
  getConfigPath,
  getOpenCodeBaseDir,
  loadConfig,
  saveConfig,
} from "./model-profiles-config.mjs";

const DEFAULT_OPENCODE_MODELS_TIMEOUT_MS = 5000;

export {
  SUPPORTED_AGENTS,
  cloneAssignments,
  createDefaultConfig,
  ensureActiveProfile,
  getActiveProfile,
  getConfigDir,
  getConfigPath,
  getOpenCodeBaseDir,
  hasDegradedRefreshGuidance,
  loadConfig,
  normalizeAgentName,
  normalizeProfileName,
  normalizeRefreshResult,
  normalizeStoredModel,
  parseProviderModel,
  resolveAssignments,
  saveConfig,
  suggestCloseModelIds,
};

function asPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getOpenCodeModelsTimeoutMs(env = process.env) {
  const rawTimeout = env.AFERGON_AI_MODELS_LIST_TIMEOUT_MS;
  if (!rawTimeout) {
    return DEFAULT_OPENCODE_MODELS_TIMEOUT_MS;
  }

  const timeout = Number.parseInt(rawTimeout, 10);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_OPENCODE_MODELS_TIMEOUT_MS;
}

export function listOpenCodeProviderModels(provider, env = process.env) {
  const timeout = getOpenCodeModelsTimeoutMs(env);
  const result = spawnSync("opencode", ["models", provider], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env,
    timeout,
  });

  if (result.error) {
    if (result.error.code === "ETIMEDOUT") {
      return {
        status: "unavailable",
        reason: `opencode models ${provider} timed out after ${timeout}ms`,
      };
    }

    if (result.error.code === "ENOENT") {
      return {
        status: "unavailable",
        reason: "the 'opencode' CLI is unavailable",
      };
    }

    return {
      status: "failed",
      reason: result.error.message,
    };
  }

  if (result.status !== 0) {
    return {
      status: "failed",
      reason: result.stderr.trim() || `opencode models ${provider} exited with status ${result.status}`,
    };
  }

  const models = result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    status: "ok",
    models,
  };
}

export function validateModelAvailability(modelId, env = process.env) {
  const parsed = parseProviderModel(modelId);
  if (!parsed) {
    return {
      status: "malformed",
      message: `Model '${modelId}' does not use the expected provider/model format. Use a value like 'openai/gpt-5.5' or rerun with '--allow-unknown' if you intentionally need a custom string.`,
    };
  }

  const availableModels = listOpenCodeProviderModels(parsed.provider, env);
  if (availableModels.status === "unavailable") {
    return {
      status: "unverified",
      warning: `Model '${parsed.modelId}' could not be verified because ${availableModels.reason}. Saving anyway.`,
    };
  }

  if (availableModels.status === "failed") {
    return {
      status: "unverified",
      warning: `Model '${parsed.modelId}' could not be verified because provider '${parsed.provider}' could not be listed: ${availableModels.reason}. Saving anyway.`,
    };
  }

  if (availableModels.models.includes(parsed.modelId)) {
    return {
      status: "known",
      availableModels: availableModels.models,
    };
  }

  return {
    status: "unknown",
    availableModels: availableModels.models,
    suggestions: suggestCloseModelIds(parsed.modelId, availableModels.models),
    provider: parsed.provider,
  };
}

export function readOpenCodeAgentModels(env = process.env) {
  const opencodeConfigPath = path.join(getOpenCodeBaseDir(env), "opencode.json");
  if (!fs.existsSync(opencodeConfigPath)) {
    return {};
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(opencodeConfigPath, "utf8"));
  } catch (error) {
    console.warn(
      `Warning: could not read OpenCode config at ${opencodeConfigPath} (${error.message}); creating profile without host assignment seed.`,
    );
    return {};
  }
  if (!isPlainObject(raw)) {
    console.warn(
      `Warning: OpenCode config at ${opencodeConfigPath} is not an object; creating profile without host assignment seed.`,
    );
    return {};
  }
  const agents = asPlainObject(raw.agent);
  const snapshot = {};

  for (const agentName of SUPPORTED_AGENTS) {
    const model = normalizeStoredModel(asPlainObject(agents[agentName]).model);
    if (model && model !== "inherit") {
      snapshot[agentName] = model;
    }
  }

  return snapshot;
}

export function saveProfileAssignments(
  profileNameInput,
  assignments,
  { env = process.env, refreshActiveProfile, validateModelAvailability: validateAvailability = validateModelAvailability } = {},
) {
  const profileName = normalizeProfileName(profileNameInput);
  const { config } = loadConfig(env);
  const profile = config.models.profiles[profileName];

  if (!profile) {
    throw new Error(`Unknown profile '${profileName}'.`);
  }

  const nextAssignments = cloneAssignments(profile);
  for (const [agentInput, modelInput] of Object.entries(asPlainObject(assignments))) {
    const agentName = normalizeAgentName(agentInput);
    const normalizedModel = normalizeStoredModel(modelInput);
    if (!normalizedModel) {
      throw new Error(`Model is required for ${agentName}.`);
    }

    if (normalizedModel !== "inherit") {
      const validation = validateAvailability(normalizedModel, env);
      if (validation.status === "malformed") {
        throw new Error(validation.message);
      }
      if (validation.status === "unknown") {
        throw new Error(
          `Requested model '${normalizedModel}' is not available from provider '${validation.provider}'.`,
        );
      }
    }

    nextAssignments[agentName] = normalizedModel;
  }

  config.models.profiles[profileName] = nextAssignments;
  const configPath = saveConfig(config, env);

  const finalizeSave = (refreshResult) => ({
    configPath,
    profileName,
    assignments: nextAssignments,
    refreshResult: normalizeRefreshResult(refreshResult),
  });

  if (config.models.activeProfile === profileName) {
    const refreshResult = refreshActiveProfile?.();
    if (refreshResult && typeof refreshResult.then === "function") {
      return refreshResult.then((resolvedRefreshResult) => finalizeSave(resolvedRefreshResult));
    }

    return finalizeSave(refreshResult);
  }

  return finalizeSave();
}
