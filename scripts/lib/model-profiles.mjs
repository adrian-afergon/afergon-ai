import fs from "node:fs";
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
  const config = createDefaultConfig();
  const models = asPlainObject(raw.models);
  const profiles = asPlainObject(models.profiles);

  config.version = typeof raw.version === "number" ? raw.version : 1;
  config.models.activeProfile = typeof models.activeProfile === "string" ? models.activeProfile : null;

  for (const [profileName, assignments] of Object.entries(profiles)) {
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
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
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

  const raw = JSON.parse(fs.readFileSync(opencodeConfigPath, "utf8"));
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
