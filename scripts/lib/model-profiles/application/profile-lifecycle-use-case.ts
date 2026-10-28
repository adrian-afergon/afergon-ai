import type { AssignmentPatch } from "../domain/assignment-patch.js";
import type { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import type { RawProfileDocument } from "../domain/profile-document.js";
import type { RawProfileDocumentCloner } from "../domain/raw-profile-document-cloner.js";
import { AgentTargetPolicy } from "../domain/agent-target-policy.js";
import { ProfileAssignments, ProfileDesiredState } from "../domain/profile-resolution.js";
import type { AffectedPair } from "../domain/profile-resolution.js";
import type { ReadProfileDocumentUseCase } from "./read-profile-document-use-case.js";
import type { ProfileStoragePort } from "./profile-storage-port.js";
import type { SnapshotPort } from "./snapshot-port.js";

export interface ValidateAffectedPairs {
  validateAffectedPairs(pairs: readonly AffectedPair[]): Promise<void>;
}

export interface LifecycleAssignmentInput {
  profileName: string;
  agentName: string;
  patch: AssignmentPatch;
}

/** Per-item shape for bulk saves: one outer profile target, items carry only agent and patch. */
export interface LifecycleAssignmentItem {
  agentName: string;
  patch: AssignmentPatch;
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
    return this.commit((candidate) => {
      const edit = this.prepareEdit(candidate, input.profileName, (assignments) =>
        assignments.withAssignment(input.agentName, input.patch));
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
          editedIsActive ? edit.previous.cleanupCoverageFor(edit.next) : [],
        ),
        refreshIntent: editedIsActive,
      };
    });
  }

  /**
   * Shared lifecycle commit sequence: retain the original source and document,
   * gate the version, build an independent candidate, mutate and collect, await
   * the required affected-pair validation, validate and recheck, snapshot the
   * original source before any version-2 promotion, validate and recheck again,
   * then persist the candidate with exactly one atomic write.
   */
  private async commit(mutate: (candidate: RawProfileDocument) => CommitMutation): Promise<LifecycleResult> {
    const loaded = this.reader.execute();
    if (!loaded.source.exists) {
      throw new Error(`Model profile config does not exist at ${loaded.source.sourceIdentity}.`);
    }
    this.validator.requireSupportedVersion(loaded.document, "prepare");
    const candidate = this.cloner.clone(loaded.document);
    const mutation = mutate(candidate);
    if (!mutation.changed) {
      return {
        desiredState: mutation.desiredState,
        refreshIntent: false,
        configPath: loaded.source.sourceIdentity,
        version: mutation.version,
      };
    }
    await this.validateAffectedPairs.validateAffectedPairs(mutation.pairs);
    this.validator.validate(candidate, loaded.source.sourceIdentity);
    let snapshotPath: string | undefined;
    this.storage.recheck(loaded.source);
    if (mutation.migrationRequired) {
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
        desiredState: this.desiredStateFor(edit.models, editedIsActive ? edit.previous.cleanupCoverageFor(edit.next) : []),
        refreshIntent: editedIsActive,
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
        pairs: edit.changed ? edit.previous.affectedPairs(edit.next) : [],
        migrationRequired,
        desiredState: this.desiredStateFor(
          edit.models,
          edit.activeName === input.profileName ? edit.previous.cleanupCoverageFor(edit.next) : [],
        ),
        refreshIntent: edit.activeName === input.profileName,
      };
    });
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
        migrationRequired:
          version === 1 &&
          Object.values(source.raw()).some((value) => typeof value === "object" && value !== null),
        desiredState: this.desiredStateFor(models, []),
        refreshIntent: false,
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
          changed && previousActive ? previousActive.cleanupCoverageFor(target) : [],
        ),
        refreshIntent: changed,
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
      };
    });
  }
}
