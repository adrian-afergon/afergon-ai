import type { AssignmentPatch } from "../domain/assignment-patch.js";
import type { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import type { RawProfileDocument } from "../domain/profile-document.js";
import type { RawProfileDocumentCloner } from "../domain/raw-profile-document-cloner.js";
import { AgentTargetPolicy } from "../domain/agent-target-policy.js";
import { ProfileAssignments, ProfileDesiredState } from "../domain/profile-resolution.js";
import type { AffectedPair } from "../domain/profile-resolution.js";
import { UNKNOWN_EFFORT_ACK_KEY, UnknownEffortAcknowledgement } from "../domain/unknown-effort-acknowledgement.js";
import type { CapabilityOperationContext, CapabilityValidationReceipt } from "./capability-validation-port.js";
import type { ReadProfileDocumentUseCase } from "./read-profile-document-use-case.js";
import type { ProfileStoragePort } from "./profile-storage-port.js";
import type { SnapshotPort } from "./snapshot-port.js";

/**
 * P4 additive evolution of the P3 required port: the same readonly pairs
 * argument, plus an optional immutable per-request context. Implementations
 * return void (trusted P3 callbacks: no acknowledgement effects) or one
 * complete plain-data receipt.
 */
export interface ValidateAffectedPairs {
  validateAffectedPairs(
    pairs: readonly AffectedPair[],
    context?: CapabilityOperationContext,
  ): Promise<void | CapabilityValidationReceipt>;
}

export interface LifecycleAssignmentInput {
  profileName: string;
  agentName: string;
  patch: AssignmentPatch;
  /** Explicit per-operation acknowledgement intent for currently unknown pairs. */
  acknowledgeUnknownEffort?: boolean;
}

/** Per-item shape for bulk saves: one outer profile target, items carry only agent and patch. */
export interface LifecycleAssignmentItem {
  agentName: string;
  patch: AssignmentPatch;
  acknowledgeUnknownEffort?: boolean;
}

export interface LifecycleProfileInput {
  profileName: string;
}

export interface LifecycleCloneInput {
  sourceProfileName: string;
  targetProfileName: string;
}

export interface LifecycleResult {
  desiredState: ProfileDesiredState;
  refreshIntent: boolean;
  configPath: string;
  version: number;
  snapshotPath?: string;
}

interface CommitMutation {
  changed: boolean;
  version: number;
  pairs: readonly AffectedPair[];
  migrationRequired: boolean;
  desiredState: ProfileDesiredState;
  refreshIntent: boolean;
  /** Owning profile of the requested pairs; used for receipt verification. */
  profileName: string;
  /** Targeted agents when an explicit acknowledgement-only intent is present. */
  ackAgentNames?: readonly string[];
}

interface PreparedEdit {
  models: { activeProfile?: string | null; profiles?: Record<string, Record<string, unknown>> };
  previous: ProfileAssignments;
  next: ProfileAssignments;
  changed: boolean;
  version: number;
  activeName: string;
}

export class ProfileLifecycleUseCase {
  constructor(
    private readonly reader: ReadProfileDocumentUseCase,
    private readonly validator: ProfileDocumentPolicy,
    private readonly cloner: RawProfileDocumentCloner,
    private readonly storage: ProfileStoragePort,
    private readonly snapshots: SnapshotPort,
    private readonly validateAffectedPairs: ValidateAffectedPairs,
    private readonly agents: AgentTargetPolicy,
  ) {}

  async saveAssignment(input: LifecycleAssignmentInput): Promise<LifecycleResult> {
    const acknowledgeUnknownEffort = input.acknowledgeUnknownEffort === true;
    return this.commit((candidate) => {
      const edit = this.prepareEdit(candidate, input.profileName, (assignments) =>
        assignments.withAssignment(input.agentName, input.patch));
      const writtenKey = this.agents.select(edit.previous.raw(), input.agentName);
      const written = edit.next.raw()[writtenKey];
      const editedIsActive = edit.activeName === input.profileName;
      return {
        changed: edit.changed,
        version: edit.version,
        pairs: edit.changed
          ? edit.previous.affectedPairs(edit.next)
          : acknowledgeUnknownEffort
            ? this.resolvedPairsFor(edit.next, [input.agentName])
            : [],
        migrationRequired: edit.changed && edit.version === 1 && typeof written === "object" && written !== null,
        desiredState: this.desiredStateFor(
          edit.models,
          // Coverage requests host action: only a changed active-profile edit
          // carries it; no-ops keep [] with refreshIntent false.
          edit.changed && editedIsActive ? edit.previous.cleanupCoverageFor(edit.next) : [],
        ),
        refreshIntent: editedIsActive,
        profileName: input.profileName,
        ackAgentNames: acknowledgeUnknownEffort ? [input.agentName] : [],
      };
    }, acknowledgeUnknownEffort);
  }

  /**
   * Shared lifecycle commit sequence: retain the original source and document,
   * gate the version, build an independent candidate, mutate and collect, await
   * the required affected-pair validation, verify and apply the whole receipt,
   * validate and recheck, snapshot the original source before any version-2
   * promotion, validate and recheck again, then persist the candidate with
   * exactly one atomic write.
   */
  private async commit(
    mutate: (candidate: RawProfileDocument) => CommitMutation,
    acknowledgeUnknownEffort = false,
  ): Promise<LifecycleResult> {
    const loaded = this.reader.execute();
    if (!loaded.source.exists) {
      throw new Error(`Model profile config does not exist at ${loaded.source.sourceIdentity}.`);
    }
    this.validator.requireSupportedVersion(loaded.document, "prepare");
    const candidate = this.cloner.clone(loaded.document);
    const mutation = mutate(candidate);
    if (!mutation.changed && !acknowledgeUnknownEffort) {
      return {
        desiredState: mutation.desiredState,
        refreshIntent: false,
        configPath: loaded.source.sourceIdentity,
        version: mutation.version,
      };
    }
    // P4: capture the independent per-request context BEFORE the await. The
    // validator receives plain frozen data only — never mutable candidate
    // references.
    const operationContext = this.captureOperationContext(candidate, mutation, acknowledgeUnknownEffort);
    const receipt = await this.validateAffectedPairs.validateAffectedPairs(mutation.pairs, operationContext);
    const acknowledgements = receipt ? this.verifyReceipt(mutation, receipt, candidate) : [];
    const acknowledgementWritten = this.applyAcknowledgements(candidate, mutation, acknowledgements);
    if (!mutation.changed && !acknowledgementWritten) {
      // Identical acknowledgement after fresh validation: no write, no refresh.
      return {
        desiredState: mutation.desiredState,
        refreshIntent: false,
        configPath: loaded.source.sourceIdentity,
        version: mutation.version,
      };
    }
    this.validator.validate(candidate, loaded.source.sourceIdentity);
    let snapshotPath: string | undefined;
    this.storage.recheck(loaded.source);
    const migrationRequired = mutation.version === 1 && (mutation.migrationRequired || acknowledgementWritten);
    if (migrationRequired) {
      const receipt = this.snapshots.acquire({ source: loaded.source, recoveryDocument: loaded.document });
      if (receipt.complete !== true) throw new Error("Migration snapshot is incomplete");
      candidate.version = 2;
      snapshotPath = receipt.snapshotPath;
    }
    this.validator.validate(candidate, loaded.source.sourceIdentity);
    this.storage.recheck(loaded.source);
    this.storage.atomicPersist(candidate, loaded.source);
    return {
      desiredState: mutation.desiredState,
      refreshIntent: mutation.refreshIntent,
      configPath: loaded.source.sourceIdentity,
      version: (candidate.version as number | undefined) ?? 1,
      ...(snapshotPath ? { snapshotPath } : {}),
    };
  }

  /** Reads stored owned acknowledgements for the requested agents off the candidate (own-key guarded). */
  private captureOperationContext(
    candidate: RawProfileDocument,
    mutation: CommitMutation,
    acknowledgeUnknownEffort: boolean,
  ): CapabilityOperationContext {
    const storedAcknowledgements: ReturnType<UnknownEffortAcknowledgement["toData"]>[] = [];
    const profiles = (candidate.models as { profiles?: Record<string, unknown> } | undefined)?.profiles;
    const profile = mutation.profileName && profiles && Object.hasOwn(profiles, mutation.profileName)
      ? profiles[mutation.profileName]
      : undefined;
    if (profile && typeof profile === "object" && !Array.isArray(profile)) {
      const entries = profile as Record<string, unknown>;
      const seen = new Set<string>();
      for (const pair of mutation.pairs) {
        if (seen.has(pair.agent)) continue;
        seen.add(pair.agent);
        let key: string;
        try {
          key = this.agents.select(entries, pair.agent);
        } catch {
          continue;
        }
        if (!Object.hasOwn(entries, key)) continue;
        const entry = entries[key];
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
        const read = UnknownEffortAcknowledgement.readOwn(
          entry as Record<string, unknown>,
          `${mutation.profileName}.${pair.agent}.${UNKNOWN_EFFORT_ACK_KEY}`,
        );
        if (read.kind === "owned") storedAcknowledgements.push(read.ack.toData());
      }
    }
    return Object.freeze({
      profileName: mutation.profileName,
      acknowledgeUnknownEffort,
      storedAcknowledgements: Object.freeze(storedAcknowledgements),
    });
  }

  /** Actual post-resolution pairs read back off the candidate, keyed by canonical agent. */
  private actualPostPairs(candidate: RawProfileDocument, mutation: CommitMutation): Map<string, AffectedPair> {
    const pairs = new Map<string, AffectedPair>();
    const profiles = (candidate.models as { profiles?: Record<string, unknown> } | undefined)?.profiles;
    const profile = mutation.profileName && profiles && Object.hasOwn(profiles, mutation.profileName)
      ? profiles[mutation.profileName]
      : undefined;
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) return pairs;
    const assignments = ProfileAssignments.create(
      profile,
      `models.profiles[${JSON.stringify(mutation.profileName)}]`,
      this.agents,
    );
    for (const pair of mutation.pairs) {
      const resolution = assignments.resolve(pair.agent);
      pairs.set(pair.agent, { agent: pair.agent, model: resolution.resolvedModel, effort: resolution.configuredEffort });
    }
    return pairs;
  }

  /**
   * Verifies the WHOLE receipt against the requested set and the candidate's
   * actual post-resolution state before any metadata application. One forged,
   * duplicate, unrequested, or missing entry rejects the batch without partial
   * mutation.
   */
  private verifyReceipt(
    mutation: CommitMutation,
    receipt: CapabilityValidationReceipt,
    candidate: RawProfileDocument,
  ): readonly { agent: string; ack: UnknownEffortAcknowledgement }[] {
    if (receipt.profileName !== mutation.profileName) {
      throw new Error(`Capability receipt targets profile '${receipt.profileName}' instead of '${mutation.profileName}'.`);
    }
    const outcomes = receipt.outcomes;
    if (!Array.isArray(outcomes) || outcomes.length !== mutation.pairs.length) {
      throw new Error("Capability receipt outcome count does not match the requested affected set.");
    }
    const actualPairs = this.actualPostPairs(candidate, mutation);
    const seenAgents = new Set<string>();
    const acknowledgements: { agent: string; ack: UnknownEffortAcknowledgement }[] = [];
    for (const outcome of outcomes) {
      if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) {
        throw new Error("Capability receipt carries a malformed outcome entry.");
      }
      if (seenAgents.has(outcome.agent)) {
        throw new Error(`Capability receipt carries a duplicate outcome for agent '${outcome.agent}'.`);
      }
      seenAgents.add(outcome.agent);
      const requested = mutation.pairs.find((pair) => pair.agent === outcome.agent);
      if (!requested) {
        throw new Error(`Capability receipt carries unrequested agent '${outcome.agent}'.`);
      }
      const actual = actualPairs.get(outcome.agent);
      if (!actual || actual.model !== outcome.model || actual.effort !== outcome.effort) {
        throw new Error(`Capability receipt identity for agent '${outcome.agent}' does not match the candidate's actual post-resolution pair.`);
      }
      if (outcome.outcome === "supported") {
        if (!outcome.provenance) throw new Error(`Capability receipt outcome for agent '${outcome.agent}' lacks supported provenance.`);
        continue;
      }
      if (outcome.outcome === "no-override") {
        if (outcome.effort !== null) throw new Error(`Capability receipt no-override outcome for agent '${outcome.agent}' carries an effort.`);
        continue;
      }
      if (outcome.outcome === "acknowledged-unknown") {
        if (!outcome.acknowledgement) {
          throw new Error(`Capability receipt acknowledged-unknown outcome for agent '${outcome.agent}' lacks exact acknowledgement metadata.`);
        }
        const ack = UnknownEffortAcknowledgement.create(
          outcome.acknowledgement,
          `${mutation.profileName}.${outcome.agent}.${UNKNOWN_EFFORT_ACK_KEY}`,
        );
        if (!ack.matches({ model: outcome.model, effort: outcome.effort })) {
          throw new Error(`Capability receipt acknowledgement for agent '${outcome.agent}' does not bind the exact resolved pair.`);
        }
        acknowledgements.push({ agent: outcome.agent, ack });
        continue;
      }
      throw new Error(`Capability receipt carries unresolved outcome '${String(outcome.outcome)}' for agent '${outcome.agent}'.`);
    }
    for (const pair of mutation.pairs) {
      if (!seenAgents.has(pair.agent)) {
        throw new Error(`Capability receipt is missing an outcome for agent '${pair.agent}'.`);
      }
    }
    return acknowledgements;
  }

  /** Applies verified acknowledgements to the candidate with collision refusal. Returns whether any byte changed. */
  private applyAcknowledgements(
    candidate: RawProfileDocument,
    mutation: CommitMutation,
    acknowledgements: readonly { agent: string; ack: UnknownEffortAcknowledgement }[],
  ): boolean {
    if (acknowledgements.length === 0) return false;
    const profiles = (candidate.models as { profiles?: Record<string, unknown> } | undefined)?.profiles;
    if (!profiles || !Object.hasOwn(profiles, mutation.profileName)) {
      throw new Error(`Profile '${mutation.profileName}' disappeared before acknowledgement application.`);
    }
    const entries = profiles[mutation.profileName] as Record<string, unknown>;
    let applied = false;
    for (const { agent, ack } of acknowledgements) {
      const key = this.agents.select(entries, agent);
      if (!Object.hasOwn(entries, key)) {
        throw new Error(`Agent '${agent}' has no own assignment to acknowledge.`);
      }
      const entry = entries[key];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error(`Agent '${agent}' assignment cannot carry acknowledgement metadata.`);
      }
      const written = ack.applyTo(
        entry as Record<string, unknown>,
        `models.profiles[${JSON.stringify(mutation.profileName)}][${JSON.stringify(key)}].${UNKNOWN_EFFORT_ACK_KEY}`,
      );
      applied = applied || written;
    }
    return applied;
  }

  async clearEffort(input: LifecycleProfileInput & { agentName: string }): Promise<LifecycleResult> {
    return this.commit((candidate) => {
      const edit = this.prepareEdit(candidate, input.profileName, (assignments) =>
        assignments.withClearedEffort(input.agentName));
      const writtenKey = this.agents.select(edit.previous.raw(), input.agentName);
      const written = edit.next.raw()[writtenKey];
      const editedIsActive = edit.activeName === input.profileName;
      return {
        changed: edit.changed,
        version: edit.version,
        pairs: edit.changed ? edit.previous.affectedPairs(edit.next) : [],
        migrationRequired: edit.changed && edit.version === 1 && typeof written === "object" && written !== null,
        desiredState: this.desiredStateFor(
          edit.models,
          edit.changed && editedIsActive ? edit.previous.cleanupCoverageFor(edit.next) : [],
        ),
        refreshIntent: editedIsActive,
        profileName: input.profileName,
      };
    });
  }

  private prepareEdit(
    candidate: RawProfileDocument,
    profileName: string,
    edit: (assignments: ProfileAssignments) => ProfileAssignments,
  ): PreparedEdit {
    const models = (candidate.models ??= {}) as { activeProfile?: string | null; profiles?: Record<string, Record<string, unknown>> };
    const profiles = (models.profiles ??= {});
    if (!Object.hasOwn(profiles, profileName)) {
      throw new Error(`Profile '${profileName}' does not exist.`);
    }
    const profilePath = `models.profiles[${JSON.stringify(profileName)}]`;
    const previous = ProfileAssignments.create(profiles[profileName], profilePath, this.agents);
    const next = edit(previous);
    const changed = JSON.stringify(previous.raw()) !== JSON.stringify(next.raw());
    if (changed) profiles[profileName] = next.raw();
    return {
      models,
      previous,
      next,
      changed,
      version: (candidate.version as number | undefined) ?? 1,
      activeName: models.activeProfile as string,
    };
  }

  private activeEntries(models: { activeProfile?: string | null; profiles?: Record<string, Record<string, unknown>> }): { agent: string; value: unknown }[] {
    const profile = models.profiles?.[models.activeProfile as string] ?? {};
    return Object.entries(profile)
      .filter(([key]) => {
        try {
          this.agents.normalize(key);
          return true;
        } catch {
          // Foreign opaque keys stay in the raw document and cleanup coverage,
          // never in the supported desired assignments.
          return false;
        }
      })
      .map(([agent, value]) => ({ agent, value }));
  }

  private desiredStateFor(
    models: { activeProfile?: string | null; profiles?: Record<string, Record<string, unknown>> },
    cleanupCoverage: readonly string[],
  ): ProfileDesiredState {
    const activeName = models.activeProfile;
    if (typeof activeName !== "string") return ProfileDesiredState.noActive(cleanupCoverage);
    return ProfileDesiredState.active(activeName, this.activeEntries(models), cleanupCoverage);
  }

  async saveAssignments(input: LifecycleProfileInput & { assignments: LifecycleAssignmentItem[] }): Promise<LifecycleResult> {
    for (const item of input.assignments) {
      const raw = item as unknown as Record<string, unknown>;
      if (Object.hasOwn(raw, "profileName") && raw.profileName !== input.profileName) {
        throw new Error(`Bulk assignment item targets profile '${String(raw.profileName)}' but the operation targets '${input.profileName}'.`);
      }
    }
    const acknowledgeUnknownEffort = input.assignments.some((item) => item.acknowledgeUnknownEffort === true);
    const intentAgents = input.assignments
      .filter((item) => item.acknowledgeUnknownEffort === true)
      .map((item) => item.agentName);
    return this.commit((candidate) => {
      const edit = this.prepareEdit(candidate, input.profileName, (assignments) =>
        input.assignments.reduce((current, item) => current.withAssignment(item.agentName, item.patch), assignments));
      const before = edit.previous.raw();
      const after = edit.next.raw();
      const migrationRequired = edit.changed && edit.version === 1 && Object.keys(after).some((key) =>
        JSON.stringify(before[key]) !== JSON.stringify(after[key]) && typeof after[key] === "object" && after[key] !== null);
      return {
        changed: edit.changed,
        version: edit.version,
        pairs: edit.changed
          ? edit.previous.affectedPairs(edit.next)
          : acknowledgeUnknownEffort
            ? this.resolvedPairsFor(edit.next, intentAgents)
            : [],
        migrationRequired,
        desiredState: this.desiredStateFor(
          edit.models,
          edit.changed && edit.activeName === input.profileName
            ? edit.previous.cleanupCoverageFor(edit.next)
            : [],
        ),
        refreshIntent: edit.activeName === input.profileName,
        profileName: input.profileName,
        ackAgentNames: acknowledgeUnknownEffort ? intentAgents : [],
      };
    }, acknowledgeUnknownEffort);
  }

  async cloneProfile(input: LifecycleCloneInput): Promise<LifecycleResult> {
    return this.commit((candidate) => {
      const models = (candidate.models ??= {}) as { activeProfile?: string | null; profiles?: Record<string, Record<string, unknown>> };
      const profiles = (models.profiles ??= {});
      if (!Object.hasOwn(profiles, input.sourceProfileName)) {
        throw new Error(`Profile '${input.sourceProfileName}' does not exist.`);
      }
      if (Object.hasOwn(profiles, input.targetProfileName)) {
        throw new Error(`Profile '${input.targetProfileName}' already exists.`);
      }
      const sourcePath = `models.profiles[${JSON.stringify(input.sourceProfileName)}]`;
      const source = ProfileAssignments.create(profiles[input.sourceProfileName], sourcePath, this.agents);
      // Prototype-safe own-property write (mirrors the P1 prepare pattern):
      // plain assignment would mutate Object.prototype for "__proto__".
      Object.defineProperty(profiles, input.targetProfileName, {
        value: source.raw(),
        enumerable: true,
        writable: true,
        configurable: true,
      });
      const version = (candidate.version as number | undefined) ?? 1;
      return {
        changed: true,
        version,
        pairs: this.resolvedPairsOf(source),
        // Migration protects recognized supported structured assignments only;
        // foreign opaque object metadata is preserved verbatim without
        // triggering a version upgrade.
        migrationRequired:
          version === 1 &&
          Object.entries(source.raw()).some(([key, value]) => {
            try {
              this.agents.normalize(key);
            } catch {
              return false;
            }
            return typeof value === "object" && value !== null;
          }),
        desiredState: this.desiredStateFor(models, []),
        refreshIntent: false,
        profileName: input.sourceProfileName,
      };
    });
  }

  private resolvedPairsOf(assignments: ProfileAssignments): readonly AffectedPair[] {
    return this.emptyAssignments().affectedPairs(assignments);
  }

  private emptyAssignments(): ProfileAssignments {
    return ProfileAssignments.create({}, "models.profiles[resolved]", this.agents);
  }

  async switchProfile(input: LifecycleProfileInput): Promise<LifecycleResult> {
    return this.commit((candidate) => {
      const models = (candidate.models ??= {}) as { activeProfile?: string | null; profiles?: Record<string, Record<string, unknown>> };
      const profiles = (models.profiles ??= {});
      if (!Object.hasOwn(profiles, input.profileName)) {
        throw new Error(`Profile '${input.profileName}' does not exist.`);
      }
      const previousActiveName = models.activeProfile;
      const changed = previousActiveName !== input.profileName;
      if (changed) models.activeProfile = input.profileName;
      const version = (candidate.version as number | undefined) ?? 1;
      const targetPath = `models.profiles[${JSON.stringify(input.profileName)}]`;
      const target = ProfileAssignments.create(profiles[input.profileName], targetPath, this.agents);
      const previousActive =
        typeof previousActiveName === "string" && previousActiveName !== input.profileName && Object.hasOwn(profiles, previousActiveName)
          ? ProfileAssignments.create(
              profiles[previousActiveName],
              `models.profiles[${JSON.stringify(previousActiveName)}]`,
              this.agents,
            )
          : undefined;
      return {
        changed,
        version,
        pairs: changed ? this.resolvedPairsOf(target) : [],
        migrationRequired: false,
        desiredState: this.desiredStateFor(
          models,
          // A null or absent active profile has no previous assignments; the
          // empty fallback still yields complete cleanup for absent target
          // agents whenever the selection changes.
          changed ? (previousActive ?? this.emptyAssignments()).cleanupCoverageFor(target) : [],
        ),
        refreshIntent: changed,
        profileName: input.profileName,
      };
    });
  }

  async deleteProfile(input: LifecycleProfileInput): Promise<LifecycleResult> {
    return this.commit((candidate) => {
      const models = (candidate.models ??= {}) as { activeProfile?: string | null; profiles?: Record<string, Record<string, unknown>> };
      const profiles = (models.profiles ??= {});
      if (!Object.hasOwn(profiles, input.profileName)) {
        throw new Error(`Profile '${input.profileName}' does not exist.`);
      }
      const deletedPath = `models.profiles[${JSON.stringify(input.profileName)}]`;
      const deleted = ProfileAssignments.create(profiles[input.profileName], deletedPath, this.agents);
      delete profiles[input.profileName];
      const version = (candidate.version as number | undefined) ?? 1;
      const wasActive = models.activeProfile === input.profileName;
      let selectedName = models.activeProfile as string | null;
      if (wasActive) {
        // Existing selection policy: the lexicographically first remaining
        // profile becomes active, or none when the deleted profile was final.
        const remaining = Object.keys(profiles).sort();
        selectedName = remaining[0] ?? null;
        models.activeProfile = selectedName;
      }
      const selected =
        typeof selectedName === "string" && Object.hasOwn(profiles, selectedName)
          ? ProfileAssignments.create(
              profiles[selectedName],
              `models.profiles[${JSON.stringify(selectedName)}]`,
              this.agents,
            )
          : undefined;
      const desiredState = selected
        ? this.desiredStateFor(models, wasActive ? deleted.cleanupCoverageFor(selected) : [])
        : ProfileDesiredState.noActive(wasActive ? deleted.cleanupCoverageFor(this.emptyAssignments()) : []);
      return {
        changed: true,
        version,
        pairs: selected && wasActive ? this.resolvedPairsOf(selected) : [],
        migrationRequired: false,
        desiredState,
        refreshIntent: wasActive,
        profileName: selectedName ?? input.profileName,
      };
    });
  }

  /** Current resolved pairs for the targeted agents (acknowledgement-only scope). */
  private resolvedPairsFor(assignments: ProfileAssignments, agentNames: readonly string[]): AffectedPair[] {
    const pairs: AffectedPair[] = [];
    const seen = new Set<string>();
    for (const name of agentNames) {
      const canonical = this.agents.normalize(name);
      if (seen.has(canonical)) continue;
      seen.add(canonical);
      const resolution = assignments.resolve(canonical);
      pairs.push({ agent: canonical, model: resolution.resolvedModel, effort: resolution.configuredEffort });
    }
    return pairs;
  }
}
