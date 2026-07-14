import {
  cloneAssignments,
  normalizeAgentName,
  normalizeProfileName,
  normalizeRefreshResult,
  normalizeStoredModel,
  type RefreshResult,
  type SupportedAgent,
} from "./model-profiles-core.mjs";
import { loadConfig, saveConfig, type AfergonModelConfig } from "./model-profiles-config.mjs";
import {
  validateModelAvailability as defaultValidateModelAvailability,
  type ValidateModelAvailabilityResult,
} from "./model-profiles-availability.mjs";

export interface SaveProfileAssignmentsResult {
  configPath: string;
  profileName: string;
  assignments: Partial<Record<SupportedAgent, string>>;
  refreshResult?: RefreshResult;
}

export interface SaveProfileAssignmentsOptions {
  env?: NodeJS.ProcessEnv;
  refreshActiveProfile?: (() => unknown) | undefined;
  validateModelAvailability?: ((modelId: string, env?: NodeJS.ProcessEnv) => ValidateModelAvailabilityResult) | undefined;
}

interface RefreshResultInput {
  status?: string;
  stdout?: unknown;
  stderr?: unknown;
  degraded?: unknown;
}

function asPlainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return Boolean(
    value &&
      (typeof value === "object" || typeof value === "function") &&
      typeof (value as PromiseLike<unknown> & { then?: unknown }).then === "function",
  );
}

function toRefreshResultInput(value: unknown): RefreshResultInput | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return typeof value === "object" ? (value as RefreshResultInput) : undefined;
}

function getProfileOrThrow(config: AfergonModelConfig, profileName: string): Partial<Record<SupportedAgent, string>> {
  const profile = config.models.profiles[profileName];
  if (!profile) {
    throw new Error(`Unknown profile '${profileName}'.`);
  }

  return profile;
}

export function saveProfileAssignments(
  profileNameInput: string,
  assignments: Record<string, string>,
  { env = process.env, refreshActiveProfile, validateModelAvailability = defaultValidateModelAvailability }: SaveProfileAssignmentsOptions = {},
): SaveProfileAssignmentsResult | Promise<SaveProfileAssignmentsResult> {
  const profileName = normalizeProfileName(profileNameInput);
  const { config } = loadConfig(env);
  const profile = getProfileOrThrow(config, profileName);
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

  const finalizeSave = (refreshResult?: unknown): SaveProfileAssignmentsResult => ({
    configPath,
    profileName,
    assignments: nextAssignments,
    refreshResult: normalizeRefreshResult(toRefreshResultInput(refreshResult)),
  });

  if (config.models.activeProfile !== profileName) {
    return finalizeSave();
  }

  const refreshResult = refreshActiveProfile?.();
  if (isPromiseLike(refreshResult)) {
    return refreshResult.then((resolvedRefreshResult) => finalizeSave(resolvedRefreshResult)) as Promise<SaveProfileAssignmentsResult>;
  }

  return finalizeSave(refreshResult);
}
