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
import { readOpenCodeAgentModels } from "./model-profiles-host-seeding.mjs";
import { listOpenCodeProviderModels, validateModelAvailability } from "./model-profiles-availability.mjs";

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
  readOpenCodeAgentModels,
  listOpenCodeProviderModels,
  resolveAssignments,
  saveConfig,
  suggestCloseModelIds,
  validateModelAvailability,
};

function asPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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
