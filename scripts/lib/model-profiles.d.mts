export interface ModelProfileConfig {
  activeProfile: string | null;
  profiles: Record<string, Record<string, string>>;
}

export interface AfergonModelConfig {
  version: number;
  models: ModelProfileConfig;
}

export function getOpenCodeBaseDir(env?: NodeJS.ProcessEnv): string;

export function loadConfig(env?: NodeJS.ProcessEnv): {
  config: AfergonModelConfig;
  configPath: string;
  exists: boolean;
};
