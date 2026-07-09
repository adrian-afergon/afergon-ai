import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

export const SUPPORTED_AGENTS = [
  "afergon-ai",
  "afg-debate",
  "afg-breakdown",
  "afg-specify",
  "afg-plannify",
  "afg-implement",
  "afg-review",
  "afg-design",
];

const AGENT_ALIASES = new Map([
  ["afergon-ai", "afergon-ai"],
  ["orchestrator", "afergon-ai"],
  ["main", "afergon-ai"],
  ["afg-debate", "afg-debate"],
  ["debate", "afg-debate"],
  ["afg-breakdown", "afg-breakdown"],
  ["breakdown", "afg-breakdown"],
  ["afg-specify", "afg-specify"],
  ["specify", "afg-specify"],
  ["afg-plannify", "afg-plannify"],
  ["plannify", "afg-plannify"],
  ["afg-implement", "afg-implement"],
  ["implement", "afg-implement"],
  ["afg-review", "afg-review"],
  ["review", "afg-review"],
  ["afg-design", "afg-design"],
  ["design", "afg-design"],
]);

const DEFAULT_OPENCODE_MODELS_TIMEOUT_MS = 5000;
const DEGRADED_REFRESH_GUIDANCE_PATTERNS = [
  /\bwarning\b/u,
  /\brecovery\b/u,
  /\bdegraded\b/u,
  /\bconflict\b/u,
  /\bfailed\b/u,
  /\btimeout\b/u,
  /\btimed out\b/u,
  /\bunavailable\b/u,
  /\bskipped\b/u,
  /\balready exists in opencode\.json\b/u,
  /\bdoes not look managed by afergon-ai\b/u,
  /\bkept existing non-managed\b/u,
  /\bpreserving existing\b/u,
  /\bnot refreshed\b/u,
  /\brun ['`]?afergon-ai update/u,
  /\brun ['`]?afergon-ai init --opencode/u,
  /\bmissing managed agent file/u,
  /\bonly afergon-ai config was updated/u,
];

function getOpenCodeModelsTimeoutMs(env = process.env) {
  const rawTimeout = env.AFERGON_AI_MODELS_LIST_TIMEOUT_MS;
  if (!rawTimeout) {
    return DEFAULT_OPENCODE_MODELS_TIMEOUT_MS;
  }

  const timeout = Number.parseInt(rawTimeout, 10);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_OPENCODE_MODELS_TIMEOUT_MS;
}

export function getConfigDir(env = process.env) {
  if (env.AFERGON_AI_CONFIG_DIR) {
    return path.resolve(env.AFERGON_AI_CONFIG_DIR);
  }

  const xdgConfigHome = env.XDG_CONFIG_HOME;
  const home = env.HOME;
  const fallbackHome = home ? path.resolve(home) : process.cwd();
  const baseDir = xdgConfigHome ? path.resolve(xdgConfigHome) : path.join(fallbackHome, ".config");

  return path.join(baseDir, "afergon-ai");
}

export function getConfigPath(env = process.env) {
  return path.join(getConfigDir(env), "config.json");
}

export function createDefaultConfig() {
  return {
    version: 1,
    models: {
      activeProfile: null,
      profiles: {},
    },
  };
}

function asPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function normalizeStoredModel(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.toLowerCase() === "inherit" ? "inherit" : trimmed;
}

export function parseProviderModel(value) {
  const normalized = normalizeStoredModel(value);
  if (!normalized || normalized === "inherit") {
    return null;
  }

  const separatorIndex = normalized.indexOf("/");
  if (separatorIndex <= 0 || separatorIndex === normalized.length - 1) {
    return null;
  }

  return {
    provider: normalized.slice(0, separatorIndex),
    modelId: normalized,
    shortModelId: normalized.slice(separatorIndex + 1),
  };
}

function levenshteinDistance(left, right) {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1);

  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + substitutionCost,
      );
    }

    for (let column = 0; column <= right.length; column += 1) {
      previous[column] = current[column];
    }
  }

  return previous[right.length];
}

export function suggestCloseModelIds(requestedModelId, availableModelIds, limit = 3) {
  const requested = parseProviderModel(requestedModelId);
  if (!requested) {
    return [];
  }

  const requestedShortModelId = requested.shortModelId.toLowerCase();

  const ranked = availableModelIds
    .map((candidate) => {
      const parsedCandidate = parseProviderModel(candidate);
      const candidateShortModelId = parsedCandidate?.shortModelId ?? candidate;
      const candidateShortModelIdLower = candidateShortModelId.toLowerCase();
      const shortDistance = levenshteinDistance(requestedShortModelId, candidateShortModelIdLower);
      const fullDistance = levenshteinDistance(requested.modelId.toLowerCase(), candidate.toLowerCase());
      const includesBonus =
        candidateShortModelIdLower.includes(requestedShortModelId) ||
        requestedShortModelId.includes(candidateShortModelIdLower)
          ? -2
          : 0;

      return {
        candidate,
        score: Math.min(shortDistance, fullDistance) + includesBonus,
      };
    })
    .sort((left, right) => left.score - right.score || left.candidate.localeCompare(right.candidate));

  return ranked.slice(0, limit).map(({ candidate }) => candidate);
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

export function normalizeAgentName(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error(`Unsupported agent ''. Supported agents: ${SUPPORTED_AGENTS.join(", ")}`);
  }

  const normalized = AGENT_ALIASES.get(input.trim().toLowerCase());
  if (!normalized) {
    throw new Error(
      `Unsupported agent '${input}'. Supported agents: ${SUPPORTED_AGENTS.join(", ")}`,
    );
  }

  return normalized;
}

export function normalizeProfileName(input) {
  if (typeof input !== "string") {
    throw new Error("Profile name is required.");
  }

  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Profile name is required.");
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(trimmed)) {
    throw new Error(
      "Profile name must match ^[a-z0-9][a-z0-9._-]*$ and contain only letters, numbers, dot, underscore, or hyphen.",
    );
  }

  return trimmed;
}

export function loadConfig(env = process.env) {
  const configPath = getConfigPath(env);
  if (!fs.existsSync(configPath)) {
    return { config: createDefaultConfig(), configPath, exists: false };
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Could not read afergon-ai model config at ${configPath}: invalid JSON. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
      );
    }
    throw error;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: root value must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
    );
  }
  const config = createDefaultConfig();
  if (Object.hasOwn(raw, "models") && !isPlainObject(raw.models)) {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: models must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
    );
  }

  const models = asPlainObject(raw.models);
  if (Object.hasOwn(models, "activeProfile") && models.activeProfile !== null && typeof models.activeProfile !== "string") {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: models.activeProfile must be a string or null. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
    );
  }
  if (Object.hasOwn(models, "profiles") && !isPlainObject(models.profiles)) {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: models.profiles must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
    );
  }

  const profiles = asPlainObject(models.profiles);

  config.version = typeof raw.version === "number" ? raw.version : 1;
  config.models.activeProfile = typeof models.activeProfile === "string" ? models.activeProfile : null;

  for (const [profileName, assignments] of Object.entries(profiles)) {
    if (!isPlainObject(assignments)) {
      throw new Error(
        `Could not read afergon-ai model config at ${configPath}: profile '${profileName}' must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
      );
    }
    const normalizedAssignments = {};
    for (const [agentName, value] of Object.entries(asPlainObject(assignments))) {
      try {
        const canonicalAgent = normalizeAgentName(agentName);
        const normalizedModel = normalizeStoredModel(value);
        if (normalizedModel) {
          normalizedAssignments[canonicalAgent] = normalizedModel;
        }
      } catch {
        // Ignore unsupported agents so future/foreign config does not break the CLI.
      }
    }
    config.models.profiles[profileName] = normalizedAssignments;
  }

  if (config.models.activeProfile && !config.models.profiles[config.models.activeProfile]) {
    config.models.activeProfile = null;
  }

  return { config, configPath, exists: true };
}

export function saveConfig(config, env = process.env) {
  const configPath = getConfigPath(env);
  const configDir = path.dirname(configPath);
  const tempPath = path.join(configDir, `.config.json.${process.pid}.${Date.now()}.tmp`);
  let fd;

  fs.mkdirSync(configDir, { recursive: true });

  try {
    fd = fs.openSync(tempPath, "wx");
    fs.writeFileSync(fd, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;

    fs.renameSync(tempPath, configPath);

    try {
      const dirFd = fs.openSync(configDir, "r");
      try {
        fs.fsyncSync(dirFd);
      } finally {
        fs.closeSync(dirFd);
      }
    } catch {
      // Directory fsync is not supported on every platform/filesystem.
    }
  } catch (error) {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // Ignore close errors while preserving the original write failure.
      }
    }
    try {
      fs.rmSync(tempPath, { force: true });
    } catch {
      // Ignore cleanup errors while preserving the original write failure.
    }
    throw error;
  }

  return configPath;
}

export function getActiveProfile(config) {
  const activeProfileName = config.models.activeProfile;
  if (!activeProfileName) {
    return null;
  }

  return config.models.profiles[activeProfileName] ?? null;
}

export function ensureActiveProfile(config) {
  if (config.models.activeProfile && config.models.profiles[config.models.activeProfile]) {
    return config.models.activeProfile;
  }

  const defaultProfileName = "default";
  config.models.profiles[defaultProfileName] ??= {};
  config.models.activeProfile = defaultProfileName;
  return defaultProfileName;
}

export function resolveAssignments(profile = {}) {
  const normalizedProfile = asPlainObject(profile);
  const mainConfigured = normalizeStoredModel(normalizedProfile["afergon-ai"]);
  const orchestratorModel = mainConfigured && mainConfigured !== "inherit" ? mainConfigured : null;

  return SUPPORTED_AGENTS.map((agentName) => {
    const configured = normalizeStoredModel(normalizedProfile[agentName]);
    if (agentName === "afergon-ai") {
      return {
        agent: agentName,
        configured: configured ?? "(unset)",
        effective: orchestratorModel,
        source: orchestratorModel ? "explicit" : "runtime-default",
      };
    }

    if (configured && configured !== "inherit") {
      return {
        agent: agentName,
        configured,
        effective: configured,
        source: "explicit",
      };
    }

    if (orchestratorModel) {
      return {
        agent: agentName,
        configured: configured ?? "(unset)",
        effective: orchestratorModel,
        source: configured === "inherit" ? "inherit" : "implicit-inherit",
      };
    }

    return {
      agent: agentName,
      configured: configured ?? "(unset)",
      effective: null,
      source: "runtime-default",
    };
  });
}

export function getOpenCodeBaseDir(env = process.env) {
  const xdgConfigHome = env.XDG_CONFIG_HOME;
  const home = env.HOME;
  const fallbackHome = home ? path.resolve(home) : process.cwd();
  const baseDir = xdgConfigHome ? path.resolve(xdgConfigHome) : path.join(fallbackHome, ".config");

  return path.join(baseDir, "opencode");
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

export function cloneAssignments(assignments = {}) {
  return JSON.parse(JSON.stringify(asPlainObject(assignments)));
}

export function hasDegradedRefreshGuidance({ stdout = "", stderr = "" } = {}) {
  const combinedOutput = [stdout, stderr]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n")
    .toLowerCase();

  if (!combinedOutput) {
    return false;
  }

  return DEGRADED_REFRESH_GUIDANCE_PATTERNS.some((pattern) => pattern.test(combinedOutput));
}

export function normalizeRefreshResult(result) {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const stdout = typeof result.stdout === "string" ? result.stdout.trim() : "";
  const stderr = typeof result.stderr === "string" ? result.stderr.trim() : "";
  const status = result.status === "degraded" || result.degraded || hasDegradedRefreshGuidance({ stdout, stderr })
    ? "degraded"
    : "clean";

  return {
    status,
    stdout,
    stderr,
    degraded: status === "degraded",
  };
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
