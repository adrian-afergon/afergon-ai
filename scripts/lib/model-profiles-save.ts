import {
  cloneAssignments,
  normalizeAgentName,
  normalizeProfileName,
  normalizeRefreshResult,
  normalizeStoredModel,
  type RefreshResult,
  type SupportedAgent,
  type SupportedModelTool,
} from "./model-profiles-core.js";
import { getToolProfileStore, loadConfig, saveConfig, type AfergonModelConfig } from "./model-profiles-config.js";
import {
  validateModelAvailability as defaultValidateModelAvailability,
  validateModelForTool,
  type ValidateModelAvailabilityResult,
} from "./model-profiles-availability.js";

export interface SaveProfileAssignmentsResult {
  configPath: string;
  tool: SupportedModelTool;
  profileName: string;
  assignments: Partial<Record<SupportedAgent, string>>;
  refreshResult?: RefreshResult;
}

export interface SaveProfileAssignmentsOptions {
  env?: NodeJS.ProcessEnv;
  tool?: SupportedModelTool;
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

function getProfileOrThrow(
  config: AfergonModelConfig,
  tool: SupportedModelTool,
  profileName: string,
): Partial<Record<SupportedAgent, string>> {
  const profile = getToolProfileStore(config, tool).profiles[profileName];
  if (!profile) {
    throw new Error(`Unknown profile '${profileName}'.`);
  }

  return profile;
}

export function saveProfileAssignments(
  profileNameInput: string,
  assignments: Record<string, string>,
  {
    env = process.env,
    tool = "opencode",
    refreshActiveProfile,
    validateModelAvailability = defaultValidateModelAvailability,
  }: SaveProfileAssignmentsOptions = {},
): SaveProfileAssignmentsResult | Promise<SaveProfileAssignmentsResult> {
  const profileName = normalizeProfileName(profileNameInput);
  const { config } = loadConfig(env);
  const store = getToolProfileStore(config, tool);
  const profile = getProfileOrThrow(config, tool, profileName);
  const nextAssignments = cloneAssignments(profile);

  for (const [agentInput, modelInput] of Object.entries(asPlainObject(assignments))) {
    const agentName = normalizeAgentName(agentInput);
    const normalizedModel = normalizeStoredModel(modelInput);
    if (!normalizedModel) {
      throw new Error(`Model is required for ${agentName}.`);
    }

    if (normalizedModel !== "inherit") {
      const validation = tool === "opencode"
        ? validateModelAvailability(normalizedModel, env)
        : validateModelForTool(tool, normalizedModel, env);
      if (validation.status === "malformed") {
        throw new Error(validation.message);
      }
      if (validation.status === "unknown") {
        throw new Error(`Requested model '${normalizedModel}' is not available from provider '${validation.provider}'.`);
      }
    }

    nextAssignments[agentName] = normalizedModel;
  }

  store.profiles[profileName] = nextAssignments;
  const configPath = saveConfig(config, env);

  const finalizeSave = (refreshResult?: unknown): SaveProfileAssignmentsResult => ({
    configPath,
    tool,
    profileName,
    assignments: nextAssignments,
    refreshResult: normalizeRefreshResult(toRefreshResultInput(refreshResult)),
  });

  if (store.activeProfile !== profileName) {
    return finalizeSave();
  }

  const refreshResult = refreshActiveProfile?.();
  if (isPromiseLike(refreshResult)) {
    return refreshResult.then((resolvedRefreshResult) => finalizeSave(resolvedRefreshResult)) as Promise<SaveProfileAssignmentsResult>;
  }

  return finalizeSave(refreshResult);
}
