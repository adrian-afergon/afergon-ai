import { AgentTargetPolicy, SUPPORTED_AGENTS } from "./agent-target-policy.js";
import { StoredAssignment } from "./stored-assignment.js";

export type ModelSource = "explicit-model" | "explicit-inherit" | "implicit-inherit" | "runtime-default";
export type EffortSource = "explicit" | "no-override";

export interface AffectedPair {
  readonly agent: string;
  readonly model: string | null;
  readonly effort: string | null;
}

export class ProfileResolution {
  private constructor(
    readonly agent: string,
    readonly configuredModel: string | null,
    readonly modelSource: ModelSource,
    readonly resolvedModel: string | null,
    readonly configuredEffort: string | null,
    readonly effortSource: EffortSource,
  ) {}

  static of(
    agent: string,
    configuredModel: string | null,
    modelSource: ModelSource,
    resolvedModel: string | null,
    configuredEffort: string | null,
    effortSource: EffortSource,
  ): ProfileResolution {
    return new ProfileResolution(agent, configuredModel, modelSource, resolvedModel, configuredEffort, effortSource);
  }
}

export type DesiredStateKind = "active" | "no-active";

export interface DesiredAssignment {
  readonly agent: string;
  readonly value: unknown;
}

export class ProfileDesiredState {
  private constructor(
    readonly kind: DesiredStateKind,
    readonly profileName: string | null,
    readonly assignments: readonly DesiredAssignment[],
    readonly cleanupCoverage: readonly string[],
  ) {}

  static active(
    profileName: string,
    assignments: readonly DesiredAssignment[],
    cleanupCoverage: readonly string[],
  ): ProfileDesiredState {
    return new ProfileDesiredState("active", profileName, assignments, cleanupCoverage);
  }

  static noActive(cleanupCoverage: readonly string[]): ProfileDesiredState {
    return new ProfileDesiredState("no-active", null, [], cleanupCoverage);
  }
}

export class ProfileAssignments {
  private constructor(
    private readonly agents: AgentTargetPolicy,
    private readonly path: string,
    private readonly entries: Record<string, unknown>,
  ) {}

  static create(raw: unknown, path: string, agents: AgentTargetPolicy): ProfileAssignments {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`${path} must be an object.`);
    }
    const entries = raw as Record<string, unknown>;
    for (const [key, value] of Object.entries(entries)) {
      try {
        agents.normalize(key);
      } catch {
        continue;
      }
      StoredAssignment.create(value, `${path}[${JSON.stringify(key)}]`);
    }
    return new ProfileAssignments(agents, path, JSON.parse(JSON.stringify(entries)) as Record<string, unknown>);
  }

  raw(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.entries)) as Record<string, unknown>;
  }

  cleanupCoverageFor(desired: ProfileAssignments): string[] {
    const desiredEntries = desired.raw();
    const coverage: string[] = [];
    for (const [key, value] of Object.entries(this.entries)) {
      let canonical = key;
      try {
        canonical = this.agents.normalize(key);
      } catch {
        // Prior identities stay verbatim in coverage instead of being dropped.
      }
      const desiredKey = Object.keys(desiredEntries).find((candidate) => {
        try {
          return this.agents.normalize(candidate) === canonical;
        } catch {
          return candidate === canonical;
        }
      });
      if (desiredKey === undefined) {
        coverage.push(key);
        continue;
      }
      if (hasEffortOverride(value) && !hasEffortOverride(desiredEntries[desiredKey])) coverage.push(key);
    }
    return coverage;
  }

  affectedPairs(next: ProfileAssignments): AffectedPair[] {
    const pairs: AffectedPair[] = [];
    const seen = new Set<string>();
    for (const agent of SUPPORTED_AGENTS) {
      const before = this.resolve(agent);
      const after = next.resolve(agent);
      if (before.resolvedModel === after.resolvedModel && before.configuredEffort === after.configuredEffort) continue;
      const pair: AffectedPair = { agent, model: after.resolvedModel, effort: after.configuredEffort };
      const identity = JSON.stringify(pair);
      if (seen.has(identity)) continue;
      seen.add(identity);
      pairs.push(pair);
    }
    return pairs;
  }

  affectedPairsForModel(agentName: string, model: string): AffectedPair[] {
    return this.affectedPairs(this.withModel(agentName, model));
  }

  withClearedEffort(agentName: string): ProfileAssignments {
    this.agents.normalize(agentName);
    const key = this.agents.select(this.entries, agentName);
    if (!Object.hasOwn(this.entries, key)) return this;
    const previous = this.entries[key];
    if (typeof previous === "string" || !Object.hasOwn(previous as object, "reasoningEffort")) return this;
    const next = { ...(previous as Record<string, unknown>) };
    delete next.reasoningEffort;
    const entries = { ...this.entries };
    if (Object.keys(next).length === 0) delete entries[key];
    else entries[key] = next;
    return new ProfileAssignments(this.agents, this.path, entries);
  }

  withAssignment(agentName: string, patch: { model?: string; reasoningEffort?: string }): ProfileAssignments {
    return this.edit(agentName, patch);
  }

  withModel(agentName: string, model: string): ProfileAssignments {
    return this.edit(agentName, { model });
  }

  private edit(agentName: string, patch: { model?: string; reasoningEffort?: string }): ProfileAssignments {
    this.agents.normalize(agentName);
    const key = this.agents.select(this.entries, agentName);
    StoredAssignment.create(patch, `${this.path}[${JSON.stringify(key)}]`);
    const previous = Object.hasOwn(this.entries, key) ? this.entries[key] : undefined;
    const next = typeof previous === "string" && !Object.hasOwn(patch, "reasoningEffort")
      ? patch.model!
      : { ...(typeof previous === "string" ? { model: previous } : previous ?? {}), ...patch };
    return new ProfileAssignments(this.agents, this.path, { ...this.entries, [key]: next });
  }

  resolve(agentName: string): ProfileResolution {
    const canonical = this.agents.normalize(agentName);
    const key = this.agents.select(this.entries, agentName);
    const value = this.entries[key];
    const assignment = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
    const ownModel = typeof value === "string"
      ? normalizeModel(value)
      : Object.hasOwn(assignment, "model")
        ? normalizeModel(assignment.model)
        : { inherit: false, model: null };
    const effort = Object.hasOwn(assignment, "reasoningEffort") ? (assignment.reasoningEffort as string) : null;
    const effortSource: EffortSource = effort === null ? "no-override" : "explicit";
    if (ownModel.model !== null) {
      return ProfileResolution.of(canonical, ownModel.model, "explicit-model", ownModel.model, effort, effortSource);
    }
    if (ownModel.inherit) {
      const resolved = canonical === "afergon-ai" ? null : this.resolve("afergon-ai").resolvedModel;
      return ProfileResolution.of(canonical, "inherit", "explicit-inherit", resolved, effort, effortSource);
    }
    if (canonical === "afergon-ai") {
      return ProfileResolution.of(canonical, null, "runtime-default", null, effort, effortSource);
    }
    const main = this.resolve("afergon-ai");
    if (main.resolvedModel !== null) {
      return ProfileResolution.of(canonical, null, "implicit-inherit", main.resolvedModel, effort, effortSource);
    }
    return ProfileResolution.of(canonical, null, "runtime-default", null, effort, effortSource);
  }
}

function normalizeModel(value: unknown): { inherit: boolean; model: string | null } {
  if (typeof value !== "string") return { inherit: false, model: null };
  const trimmed = value.trim();
  if (!trimmed) return { inherit: false, model: null };
  return trimmed.toLowerCase() === "inherit" ? { inherit: true, model: null } : { inherit: false, model: trimmed };
}

function hasEffortOverride(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.hasOwn(value, "reasoningEffort");
}
