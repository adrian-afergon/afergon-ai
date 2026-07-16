import fs from "node:fs";
import path from "node:path";

import {
  SUPPORTED_MODEL_TOOLS,
  normalizeAgentName,
  normalizeStoredModel,
  type SupportedAgent,
  type SupportedModelTool,
} from "./model-profiles-core.js";

export interface ModelProfileStore {
  activeProfile: string | null;
  profiles: Record<string, Partial<Record<SupportedAgent, string>>>;
}

export interface AfergonModelConfig {
  version: number;
  models: {
    tools: Record<SupportedModelTool, ModelProfileStore>;
  };
}

function asPlainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function getConfigDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.AFERGON_AI_CONFIG_DIR) {
    return path.resolve(env.AFERGON_AI_CONFIG_DIR);
  }

  const xdgConfigHome = env.XDG_CONFIG_HOME;
  const home = env.HOME;
  const fallbackHome = home ? path.resolve(home) : process.cwd();
  const baseDir = xdgConfigHome ? path.resolve(xdgConfigHome) : path.join(fallbackHome, ".config");

  return path.join(baseDir, "afergon-ai");
}

export function getConfigPath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(getConfigDir(env), "config.json");
}

export function createDefaultConfig(): AfergonModelConfig {
  return {
    version: 2,
    models: {
      tools: createToolStores(),
    },
  };
}

function createProfileMap(): Record<string, Partial<Record<SupportedAgent, string>>> {
  return Object.create(null) as Record<string, Partial<Record<SupportedAgent, string>>>;
}

function createToolStore(): ModelProfileStore {
  return {
    activeProfile: null,
    profiles: createProfileMap(),
  };
}

function createToolStores(): Record<SupportedModelTool, ModelProfileStore> {
  return {
    pi: createToolStore(),
    claude: createToolStore(),
    opencode: createToolStore(),
  };
}

function normalizeProfileStore(
  rawStore: unknown,
  configPath: string,
  pathLabel: string,
): ModelProfileStore {
  if (!isPlainObject(rawStore)) {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: ${pathLabel} must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
    );
  }

  if (Object.hasOwn(rawStore, "activeProfile") && rawStore.activeProfile !== null && typeof rawStore.activeProfile !== "string") {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: ${pathLabel}.activeProfile must be a string or null. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
    );
  }
  if (Object.hasOwn(rawStore, "profiles") && !isPlainObject(rawStore.profiles)) {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: ${pathLabel}.profiles must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
    );
  }

  const normalizedStore = createToolStore();
  normalizedStore.activeProfile = typeof rawStore.activeProfile === "string" ? rawStore.activeProfile : null;
  for (const [profileName, assignments] of Object.entries(asPlainObject(rawStore.profiles))) {
    if (!isPlainObject(assignments)) {
      throw new Error(
        `Could not read afergon-ai model config at ${configPath}: profile '${profileName}' in ${pathLabel} must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
      );
    }
    const normalizedAssignments: Partial<Record<SupportedAgent, string>> = {};
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
    normalizedStore.profiles[profileName] = normalizedAssignments;
  }

  if (normalizedStore.activeProfile && !Object.hasOwn(normalizedStore.profiles, normalizedStore.activeProfile)) {
    normalizedStore.activeProfile = null;
  }

  return normalizedStore;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): {
  config: AfergonModelConfig;
  configPath: string;
  exists: boolean;
} {
  const configPath = getConfigPath(env);
  if (!fs.existsSync(configPath)) {
    return { config: createDefaultConfig(), configPath, exists: false };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, "utf8")) as unknown;
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
  const root = raw as Record<string, unknown>;
  const config = createDefaultConfig();
  if (Object.hasOwn(root, "models") && !isPlainObject(root.models)) {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: models must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
    );
  }

  const models = asPlainObject(root.models);
  const version = root.version === undefined ? 1 : root.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1 || version > 2) {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: unsupported config version '${String(version)}'. Upgrade afergon-ai or restore a supported config version.`,
    );
  }

  if (version === 1) {
    // Version 1 was implemented only by the OpenCode adapter, so it has one unambiguous destination.
    config.models.tools.opencode = normalizeProfileStore(models, configPath, "models");
    return { config, configPath, exists: true };
  }

  if (Object.hasOwn(models, "tools") && !isPlainObject(models.tools)) {
    throw new Error(
      `Could not read afergon-ai model config at ${configPath}: models.tools must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
    );
  }
  const tools = asPlainObject(models.tools);
  for (const tool of SUPPORTED_MODEL_TOOLS) {
    if (Object.hasOwn(tools, tool)) {
      config.models.tools[tool] = normalizeProfileStore(tools[tool], configPath, `models.tools.${tool}`);
    }
  }

  return { config, configPath, exists: true };
}

export function saveConfig(config: AfergonModelConfig, env: NodeJS.ProcessEnv = process.env): string {
  const configPath = getConfigPath(env);
  const configDir = path.dirname(configPath);
  const tempPath = path.join(configDir, `.config.json.${process.pid}.${Date.now()}.tmp`);
  let fd: number | undefined;

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

export function getToolProfileStore(config: AfergonModelConfig, tool: SupportedModelTool): ModelProfileStore {
  const models = config.models as unknown as Record<string, unknown>;
  const tools = models.tools;
  if (isPlainObject(tools) && isPlainObject(tools[tool])) {
    return tools[tool] as unknown as ModelProfileStore;
  }

  // Public helpers still accept in-memory v1 objects so external callers can migrate data through the next save.
  if (tool === "opencode" && isPlainObject(models) && isPlainObject(models.profiles)) {
    return models as unknown as ModelProfileStore;
  }

  throw new Error(`Model-profile store '${tool}' is unavailable.`);
}

export function getActiveProfile(
  config: AfergonModelConfig,
  tool: SupportedModelTool = "opencode",
): Partial<Record<SupportedAgent, string>> | null {
  const store = getToolProfileStore(config, tool);
  const activeProfileName = store.activeProfile;
  if (!activeProfileName) {
    return null;
  }

  return store.profiles[activeProfileName] ?? null;
}

export function ensureActiveProfile(config: AfergonModelConfig, tool: SupportedModelTool = "opencode"): string {
  const store = getToolProfileStore(config, tool);
  if (store.activeProfile && Object.hasOwn(store.profiles, store.activeProfile)) {
    return store.activeProfile;
  }

  const defaultProfileName = "default";
  store.profiles[defaultProfileName] ??= {};
  store.activeProfile = defaultProfileName;
  return defaultProfileName;
}

export function getOpenCodeBaseDir(env: NodeJS.ProcessEnv = process.env): string {
  const xdgConfigHome = env.XDG_CONFIG_HOME;
  const home = env.HOME;
  const fallbackHome = home ? path.resolve(home) : process.cwd();
  const baseDir = xdgConfigHome ? path.resolve(xdgConfigHome) : path.join(fallbackHome, ".config");

  return path.join(baseDir, "opencode");
}
