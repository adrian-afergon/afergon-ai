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

export type SupportedAgent = (typeof SUPPORTED_AGENTS)[number];

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

export class AgentTargetPolicy {
  normalize(input: unknown): SupportedAgent {
    if (typeof input !== "string" || !input.trim()) {
      throw new Error(`Unsupported agent ''. Supported agents: ${SUPPORTED_AGENTS.join(", ")}`);
    }

    const normalized = AGENT_ALIASES.get(input.trim().toLowerCase());
    if (!normalized) {
      throw new Error(`Unsupported agent '${input}'. Supported agents: ${SUPPORTED_AGENTS.join(", ")}`);
    }

    return normalized;
  }

  select(profile: Record<string, unknown>, requested: string): string {
    const canonical = this.normalize(requested);
    if (Object.hasOwn(profile, requested)) {
      return requested;
    }
    const keys = Object.keys(profile).filter((key) => AGENT_ALIASES.get(key.trim().toLowerCase()) === canonical);
    if (keys.length === 0) {
      return canonical;
    }
    if (keys.length === 1) {
      return keys[0];
    }
    throw new Error("Ambiguous assignment aliases");
  }
}
