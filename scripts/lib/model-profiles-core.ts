export const SUPPORTED_AGENTS = [
  "afergon-ai",
  "afg-debate",
  "afg-breakdown",
  "afg-specify",
  "afg-plannify",
  "afg-implement",
  "afg-review",
  "afg-design",
] as const;

export const SUPPORTED_MODEL_TOOLS = ["pi", "claude", "opencode"] as const;

export const MODEL_PROFILE_TOOL_LABELS: Readonly<Record<SupportedModelTool, string>> = Object.freeze({
  pi: "Pi",
  claude: "Claude Code",
  opencode: "OpenCode",
});

const AGENT_ALIASES = new Map<string, SupportedAgent>([
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

export type SupportedAgent = (typeof SUPPORTED_AGENTS)[number];
export type SupportedModelTool = (typeof SUPPORTED_MODEL_TOOLS)[number];

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

interface RefreshResultInput {
  readonly status?: string;
  readonly stdout?: unknown;
  readonly stderr?: unknown;
  readonly degraded?: unknown;
}

function asPlainObject<T>(value: T): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function normalizeStoredModel(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.toLowerCase() === "inherit" ? "inherit" : trimmed;
}

export function parseProviderModel(value: unknown): ParsedProviderModel | null {
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

function levenshteinDistance(left: string, right: string): number {
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
  const current = new Array<number>(right.length + 1);

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
      previous[column] = current[column] ?? 0;
    }
  }

  return previous[right.length] ?? 0;
}

export function suggestCloseModelIds(requestedModelId: unknown, availableModelIds: readonly string[], limit = 3): string[] {
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

export function normalizeAgentName(input: unknown): SupportedAgent {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error(`Unsupported agent ''. Supported agents: ${SUPPORTED_AGENTS.join(", ")}`);
  }

  const normalized = AGENT_ALIASES.get(input.trim().toLowerCase());
  if (!normalized) {
    throw new Error(`Unsupported agent '${input}'. Supported agents: ${SUPPORTED_AGENTS.join(", ")}`);
  }

  return normalized;
}

export function normalizeModelProfileTool(input: unknown): SupportedModelTool {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error(`Unsupported model-profile tool ''. Supported tools: ${SUPPORTED_MODEL_TOOLS.join(", ")}`);
  }

  const normalized = input.trim().toLowerCase();
  if (!SUPPORTED_MODEL_TOOLS.includes(normalized as SupportedModelTool)) {
    throw new Error(`Unsupported model-profile tool '${input}'. Supported tools: ${SUPPORTED_MODEL_TOOLS.join(", ")}`);
  }

  return normalized as SupportedModelTool;
}

export function getModelProfileToolLabel(tool: SupportedModelTool): string {
  return MODEL_PROFILE_TOOL_LABELS[tool];
}

export function normalizeProfileName(input: unknown): string {
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

export function resolveAssignments(profile: Record<string, unknown> = {}): ResolvedAssignment[] {
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

export function cloneAssignments<T extends Record<string, unknown>>(assignments: T = {} as T): T {
  return JSON.parse(JSON.stringify(asPlainObject(assignments))) as T;
}

export function hasDegradedRefreshGuidance({ stdout = "", stderr = "" }: { stdout?: unknown; stderr?: unknown } = {}): boolean {
  const combinedOutput = [stdout, stderr]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join("\n")
    .toLowerCase();

  if (!combinedOutput) {
    return false;
  }

  return DEGRADED_REFRESH_GUIDANCE_PATTERNS.some((pattern) => pattern.test(combinedOutput));
}

export function normalizeRefreshResult(result?: RefreshResultInput | null): RefreshResult | undefined {
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
