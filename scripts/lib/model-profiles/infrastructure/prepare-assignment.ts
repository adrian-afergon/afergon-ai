import { PrepareProfileAssignmentUseCase } from "../application/prepare-profile-assignment-use-case.js";
import { AgentTargetPolicy } from "../domain/agent-target-policy.js";
import type { AssignmentPatch } from "../domain/assignment-patch.js";
import { ProfileAssignmentPolicy, type PreparedAssignment } from "../domain/profile-assignment-policy.js";
import { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import { RawProfileDocumentCloner } from "../domain/raw-profile-document-cloner.js";

export type { PreparedAssignment } from "../domain/profile-assignment-policy.js";

export interface PrepareAssignmentInput {
  document: Record<string, unknown>;
  configPath: string;
  profileName: string;
  agentName: string;
  patch: AssignmentPatch;
}

export function prepareProfileAssignment(input: PrepareAssignmentInput): PreparedAssignment {
  const agents = new AgentTargetPolicy();
  const validator = new ProfileDocumentPolicy(agents);
  const cloner = new RawProfileDocumentCloner();
  const policy = new ProfileAssignmentPolicy(validator, agents, cloner);
  return new PrepareProfileAssignmentUseCase(policy).execute({
    document: input.document,
    sourceIdentity: input.configPath,
    profileName: input.profileName,
    agentName: input.agentName,
    patch: input.patch,
  });
}
