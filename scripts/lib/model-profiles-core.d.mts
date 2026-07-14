export declare const SUPPORTED_AGENTS: readonly [
  "afergon-ai",
  "afg-debate",
  "afg-breakdown",
  "afg-specify",
  "afg-plannify",
  "afg-implement",
  "afg-review",
  "afg-design",
];

export type SupportedAgent = (typeof SUPPORTED_AGENTS)[number];

export interface ParsedProviderModel {
  readonly provider: string;
  readonly modelId: string;
  readonly shortModelId: string;
}

export interface ResolvedAssignment {
  readonly agent: SupportedAgent;
  readonly configured: string;
  readonly effective: string | null;
  readonly source: "explicit" | "runtime-default" | "inherit" | "implicit-inherit";
}

export interface RefreshResult {
  readonly status: "clean" | "degraded";
  readonly stdout: string;
  readonly stderr: string;
  readonly degraded: boolean;
}

export declare function normalizeStoredModel(value: unknown): string | undefined;
export declare function parseProviderModel(value: unknown): ParsedProviderModel | null;
export declare function suggestCloseModelIds(requestedModelId: unknown, availableModelIds: readonly string[], limit?: number): string[];
export declare function normalizeAgentName(input: unknown): SupportedAgent;
export declare function normalizeProfileName(input: unknown): string;
export declare function resolveAssignments(profile?: Record<string, unknown>): ResolvedAssignment[];
export declare function cloneAssignments<T extends Record<string, unknown>>(assignments?: T): T;
export declare function hasDegradedRefreshGuidance(input?: { stdout?: unknown; stderr?: unknown }): boolean;
export declare function normalizeRefreshResult(result?: {
  readonly status?: string;
  readonly stdout?: unknown;
  readonly stderr?: unknown;
  readonly degraded?: unknown;
} | null): RefreshResult | undefined;
