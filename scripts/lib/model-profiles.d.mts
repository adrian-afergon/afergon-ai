export interface ModelProfileConfig {
  activeProfile: string | null;
  profiles: Record<string, Record<string, string>>;
}

export interface AfergonModelConfig {
  version: number;
  models: ModelProfileConfig;
}

export interface ResolvedAssignment {
  agent: string;
  configured: string;
  effective: string | null;
  source: string;
}

export interface RefreshResult {
  status: "clean" | "degraded";
  stdout: string;
  stderr: string;
  degraded: boolean;
}

export interface SaveProfileAssignmentsResult {
  configPath: string;
  profileName: string;
  assignments: Record<string, string>;
  refreshResult?: RefreshResult;
}

export interface ValidateModelAvailabilityResult {
  status: "known" | "unknown" | "malformed" | "unverified";
  availableModels?: string[];
  suggestions?: string[];
  provider?: string;
  message?: string;
  warning?: string;
}

export function getOpenCodeBaseDir(env?: NodeJS.ProcessEnv): string;
export function getConfigPath(env?: NodeJS.ProcessEnv): string;
export function getActiveProfile(config: AfergonModelConfig): Record<string, string> | null;

export function loadConfig(env?: NodeJS.ProcessEnv): {
  config: AfergonModelConfig;
  configPath: string;
  exists: boolean;
};

export function resolveAssignments(profile?: Record<string, string>): ResolvedAssignment[];

export const SUPPORTED_AGENTS: readonly string[];

export function saveProfileAssignments(
  profileNameInput: string,
  assignments: Record<string, string>,
  options?: {
    env?: NodeJS.ProcessEnv;
    refreshActiveProfile?: (() => unknown) | undefined;
    validateModelAvailability?: ((modelId: string, env?: NodeJS.ProcessEnv) => ValidateModelAvailabilityResult) | undefined;
  },
): SaveProfileAssignmentsResult | Promise<SaveProfileAssignmentsResult>;
