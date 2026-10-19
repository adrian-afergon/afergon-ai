import type { AgentTargetPolicy } from "./agent-target-policy.js";
import type { AssignmentPatch } from "./assignment-patch.js";
import type { ProfileDocumentPolicy } from "./profile-document-policy.js";
import type { RawProfileDocument } from "./profile-document.js";
import type { RawProfileDocumentCloner } from "./raw-profile-document-cloner.js";
import { StoredAssignment } from "./stored-assignment.js";

export interface PrepareAssignmentInput {
  document: RawProfileDocument;
  sourceIdentity: string;
  profileName: string;
  agentName: string;
  patch: AssignmentPatch;
}

export interface ValidatedAssignmentContext {
  document: RawProfileDocument;
  knownPatch: AssignmentPatch;
  selectedKey: string;
  effectiveVersion: number;
  sourceIdentity: string;
  profileName: string;
}

export interface PreparedAssignment {
  document: RawProfileDocument;
  changed: boolean;
  migrationRequired: boolean;
  version: number;
  agentKey?: string;
}

export class ProfileAssignmentPolicy {
  constructor(
    private readonly validator: ProfileDocumentPolicy,
    private readonly agents: AgentTargetPolicy,
    private readonly cloner: RawProfileDocumentCloner,
  ) {}

  prepare(input: PrepareAssignmentInput): PreparedAssignment {
    const context = this.prepareContext(input);
    if (Object.keys(context.knownPatch).length === 0) {
      this.validator.validate(context.document, context.sourceIdentity);
      return { document: context.document, changed: false, migrationRequired: false,
        version: context.effectiveVersion, agentKey: context.selectedKey };
    }
    const models = (context.document.models ??= {}) as { profiles?: Record<string, Record<string, unknown>> };
    const profiles = (models.profiles ??= {});
    if (!Object.hasOwn(profiles, context.profileName)) {
      Object.defineProperty(profiles, context.profileName, { value: {}, enumerable: true, writable: true, configurable: true });
    }
    const profile = profiles[context.profileName];
    const previous = profile[context.selectedKey];
    const next = typeof previous === "string" && !Object.hasOwn(context.knownPatch, "reasoningEffort")
      ? context.knownPatch.model
      : {
        ...(typeof previous === "string" ? { model: previous } : previous as Record<string, unknown>),
        ...context.knownPatch,
      };
    const changed = JSON.stringify(previous) !== JSON.stringify(next);
    if (changed) profile[context.selectedKey] = next;
    const migrationRequired = changed && typeof next !== "string" && context.effectiveVersion === 1;
    this.validator.validate(context.document, context.sourceIdentity);
    return {
      document: context.document, changed, migrationRequired,
      version: migrationRequired ? 2 : context.effectiveVersion, agentKey: context.selectedKey,
    };
  }

  prepareContext(input: PrepareAssignmentInput): ValidatedAssignmentContext {
    this.validator.validate(input.document, input.sourceIdentity);
    this.validator.requireSupportedVersion(input.document, "prepare");
    if (!input.patch || typeof input.patch !== "object" || Array.isArray(input.patch)) {
      throw new Error("Assignment patch must be an object.");
    }
    const profiles = (input.document.models as { profiles?: Record<string, Record<string, unknown>> } | undefined)?.profiles;
    const profile = profiles && Object.hasOwn(profiles, input.profileName) ? profiles[input.profileName] : {};
    const selectedKey = this.agents.select(profile, input.agentName);
    const knownPatch: AssignmentPatch = {};
    if (Object.hasOwn(input.patch, "model")) knownPatch.model = input.patch.model;
    if (Object.hasOwn(input.patch, "reasoningEffort")) knownPatch.reasoningEffort = input.patch.reasoningEffort;
    StoredAssignment.create(knownPatch, `models.profiles[${JSON.stringify(input.profileName)}][${JSON.stringify(selectedKey)}]`);
    return {
      document: this.cloner.clone(input.document), knownPatch, selectedKey,
      effectiveVersion: (input.document.version as number | undefined) ?? 1,
      sourceIdentity: input.sourceIdentity, profileName: input.profileName,
    };
  }
}
