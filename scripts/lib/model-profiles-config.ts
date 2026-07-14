import fs from "node:fs";
import path from "node:path";

import { normalizeAgentName, normalizeStoredModel, type SupportedAgent } from "./model-profiles-core.js";

export interface ModelProfileConfig {
  activeProfile: string | null;
  profiles: Record<string, Partial<Record<SupportedAgent, string>>>;
}

export interface AfergonModelConfig {
  version: number;
  models: ModelProfileConfig;
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
    version: 1,
    models: {
      activeProfile: null,
      profiles: {},
    },
  };
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

  config.version = typeof root.version === "number" ? root.version : 1;
  config.models.activeProfile = typeof models.activeProfile === "string" ? models.activeProfile : null;

  for (const [profileName, assignments] of Object.entries(profiles)) {
    if (!isPlainObject(assignments)) {
      throw new Error(
        `Could not read afergon-ai model config at ${configPath}: profile '${profileName}' must be an object. Repair the file or move it aside to let afergon-ai recreate a clean config.`,
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
    config.models.profiles[profileName] = normalizedAssignments;
  }

  if (config.models.activeProfile && !config.models.profiles[config.models.activeProfile]) {
    config.models.activeProfile = null;
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

export function getActiveProfile(config: AfergonModelConfig): Partial<Record<SupportedAgent, string>> | null {
  const activeProfileName = config.models.activeProfile;
  if (!activeProfileName) {
    return null;
  }

  return config.models.profiles[activeProfileName] ?? null;
}

export function ensureActiveProfile(config: AfergonModelConfig): string {
  if (config.models.activeProfile && config.models.profiles[config.models.activeProfile]) {
    return config.models.activeProfile;
  }

  const defaultProfileName = "default";
  config.models.profiles[defaultProfileName] ??= {};
  config.models.activeProfile = defaultProfileName;
  return defaultProfileName;
}

export function getOpenCodeBaseDir(env: NodeJS.ProcessEnv = process.env): string {
  const xdgConfigHome = env.XDG_CONFIG_HOME;
  const home = env.HOME;
  const fallbackHome = home ? path.resolve(home) : process.cwd();
  const baseDir = xdgConfigHome ? path.resolve(xdgConfigHome) : path.join(fallbackHome, ".config");

  return path.join(baseDir, "opencode");
}
