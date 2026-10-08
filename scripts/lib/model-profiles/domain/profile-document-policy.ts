import { AgentTargetPolicy } from "./agent-target-policy.js";
import type { RawProfileDocument } from "./profile-document.js";
import { StoredAssignment } from "./stored-assignment.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function childPath(base: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`;
}

export class ProfileDocumentPolicy {
  constructor(private readonly agents: AgentTargetPolicy) {}

  validate(raw: unknown, sourceIdentity: string): RawProfileDocument {
    if (!isObject(raw)) {
      throw new Error(`Could not read model profile config at ${sourceIdentity}: root value must be an object.`);
    }
    const document = raw;
    if (
      Object.hasOwn(document, "version") &&
      (typeof document.version !== "number" || !Number.isSafeInteger(document.version) || document.version < 1)
    ) {
      throw new Error(`Could not read model profile config at ${sourceIdentity}: version must be a positive safe integer.`);
    }
    if (Object.hasOwn(document, "models") && !isObject(document.models)) {
      throw new Error(`Could not read model profile config at ${sourceIdentity}: models must be an object.`);
    }
    const models = isObject(document.models) ? document.models : {};
    if (Object.hasOwn(models, "activeProfile") && models.activeProfile !== null && typeof models.activeProfile !== "string") {
      throw new Error(`Could not read model profile config at ${sourceIdentity}: models.activeProfile must be a string or null.`);
    }
    if (Object.hasOwn(models, "profiles") && !isObject(models.profiles)) {
      throw new Error(`Could not read model profile config at ${sourceIdentity}: models.profiles must be an object.`);
    }
    const profiles = isObject(models.profiles) ? models.profiles : {};
    if (typeof models.activeProfile === "string" && !Object.hasOwn(profiles, models.activeProfile)) {
      throw new Error(`Could not read model profile config at ${sourceIdentity}: models.activeProfile '${models.activeProfile}' does not exist.`);
    }
    for (const [profileName, assignments] of Object.entries(profiles)) {
      if (!isObject(assignments)) {
        throw new Error(`Could not read model profile config at ${sourceIdentity}: ${childPath("models.profiles", profileName)} must be an object.`);
      }
      for (const [agentName, value] of Object.entries(assignments)) {
        try {
          this.agents.normalize(agentName);
        } catch {
          continue;
        }
        StoredAssignment.create(value, childPath(childPath("models.profiles", profileName), agentName));
      }
    }
    return document;
  }

}
