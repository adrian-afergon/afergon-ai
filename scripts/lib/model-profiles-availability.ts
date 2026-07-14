import { spawnSync } from "node:child_process";

import { parseProviderModel, suggestCloseModelIds } from "./model-profiles-core.js";

const DEFAULT_OPENCODE_MODELS_TIMEOUT_MS = 5000;

interface OpenCodeProviderModelsOkResult {
  status: "ok";
  models: string[];
}

interface OpenCodeProviderModelsUnavailableResult {
  status: "unavailable";
  reason: string;
}

interface OpenCodeProviderModelsFailedResult {
  status: "failed";
  reason: string;
}

type OpenCodeProviderModelsResult =
  | OpenCodeProviderModelsOkResult
  | OpenCodeProviderModelsUnavailableResult
  | OpenCodeProviderModelsFailedResult;

export interface ValidateModelAvailabilityResult {
  status: "known" | "unknown" | "malformed" | "unverified";
  availableModels?: string[];
  suggestions?: string[];
  provider?: string;
  message?: string;
  warning?: string;
}

function getOpenCodeModelsTimeoutMs(env: NodeJS.ProcessEnv = process.env): number {
  const rawTimeout = env.AFERGON_AI_MODELS_LIST_TIMEOUT_MS;
  if (!rawTimeout) {
    return DEFAULT_OPENCODE_MODELS_TIMEOUT_MS;
  }

  const timeout = Number.parseInt(rawTimeout, 10);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_OPENCODE_MODELS_TIMEOUT_MS;
}

export function listOpenCodeProviderModels(provider: string, env: NodeJS.ProcessEnv = process.env): OpenCodeProviderModelsResult {
  const timeout = getOpenCodeModelsTimeoutMs(env);
  const result = spawnSync("opencode", ["models", provider], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env,
    timeout,
  });

  if (result.error) {
    const spawnError = result.error as NodeJS.ErrnoException;
    if (spawnError.code === "ETIMEDOUT") {
      return {
        status: "unavailable",
        reason: `opencode models ${provider} timed out after ${timeout}ms`,
      };
    }

    if (spawnError.code === "ENOENT") {
      return {
        status: "unavailable",
        reason: "the 'opencode' CLI is unavailable",
      };
    }

    return {
      status: "failed",
      reason: spawnError.message,
    };
  }

  if (result.status !== 0) {
    return {
      status: "failed",
      reason: result.stderr.trim() || `opencode models ${provider} exited with status ${result.status}`,
    };
  }

  return {
    status: "ok",
    models: result.stdout
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

export function validateModelAvailability(modelId: string, env: NodeJS.ProcessEnv = process.env): ValidateModelAvailabilityResult {
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
