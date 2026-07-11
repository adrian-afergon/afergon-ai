import { cloneAssignments, normalizeAgentName, normalizeProfileName, normalizeRefreshResult, normalizeStoredModel } from "./model-profiles-core.mjs";
import { loadConfig, saveConfig } from "./model-profiles-config.mjs";
import { validateModelAvailability as defaultValidateModelAvailability } from "./model-profiles-availability.mjs";

function asPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function saveProfileAssignments(
  profileNameInput,
  assignments,
  { env = process.env, refreshActiveProfile, validateModelAvailability = defaultValidateModelAvailability } = {},
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
      const validation = validateModelAvailability(normalizedModel, env);
      if (validation.status === "malformed") {
        throw new Error(validation.message);
      }
      if (validation.status === "unknown") {
        throw new Error(`Requested model '${normalizedModel}' is not available from provider '${validation.provider}'.`);
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
