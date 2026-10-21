import type { RawProfileDocument } from "../domain/profile-document.js";
import { createProfilePolicies } from "./profile-composition.js";

export function validateProfileDocument(raw: unknown, configPath: string): RawProfileDocument {
  return createProfilePolicies().validator.validate(raw, configPath);
}
