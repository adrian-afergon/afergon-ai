import type { AssignmentPatch } from "../domain/assignment-patch.js";
import type { PreparedAssignment } from "../domain/profile-assignment-policy.js";
import { createProfilePolicies } from "./profile-composition.js";

export type { PreparedAssignment } from "../domain/profile-assignment-policy.js";

export interface PrepareAssignmentInput {
  document: Record<string, unknown>;
  configPath: string;
  profileName: string;
  agentName: string;
  patch: AssignmentPatch;
}

export function prepareProfileAssignment(input: PrepareAssignmentInput): PreparedAssignment {
  return createProfilePolicies().preparer.execute({
    document: input.document,
    sourceIdentity: input.configPath,
    profileName: input.profileName,
    agentName: input.agentName,
    patch: input.patch,
  });
}
