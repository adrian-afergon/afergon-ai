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

export class ProfileAssignmentPolicy {
  constructor(
    private readonly validator: ProfileDocumentPolicy,
    private readonly agents: AgentTargetPolicy,
    private readonly cloner: RawProfileDocumentCloner,
  ) {}

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
