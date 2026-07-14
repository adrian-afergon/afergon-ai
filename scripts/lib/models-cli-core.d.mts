export declare function isDirectExecution(argv?: readonly string[], moduleUrl?: string): boolean;
export declare function getOpenCodeRefreshTimeoutMs(env?: NodeJS.ProcessEnv): number;
export declare function createRegistrationEnv(env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export declare function createRefreshResult(result?: {
  readonly status?: string;
  readonly stdout?: unknown;
  readonly stderr?: unknown;
  readonly degraded?: unknown;
} | null): import("./model-profiles-core.mjs").RefreshResult | undefined;
export declare function formatUnknownModelError(model: string, provider: string, suggestions: readonly string[]): string;
export declare function formatEffective(entry: { effective?: string | null }): string;
export declare function getProfileOrThrow(
  config: { models: { profiles: Record<string, Record<string, unknown>> } },
  profileNameInput: unknown,
): { profileName: string; profile: Record<string, unknown> };
export declare function parseSetCommandArguments(args: readonly string[]): { allowUnknown: boolean; agent: string; model: string };
export declare function printHelp(log?: (line: string) => void): void;
