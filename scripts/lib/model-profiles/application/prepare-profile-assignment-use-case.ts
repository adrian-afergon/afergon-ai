import type { PrepareAssignmentInput, PreparedAssignment, ProfileAssignmentPolicy } from "../domain/profile-assignment-policy.js";

export class PrepareProfileAssignmentUseCase {
  constructor(private readonly policy: ProfileAssignmentPolicy) {}

  execute(input: PrepareAssignmentInput): PreparedAssignment {
    return this.policy.prepare(input);
  }
}
