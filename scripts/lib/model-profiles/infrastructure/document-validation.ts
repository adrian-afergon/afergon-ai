import { StoredAssignment } from "../domain/stored-assignment.js";
import { normalizeAgentName } from "../../model-profiles-core.js";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function childPath(base: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`;
}

export function validateProfileDocument(document: unknown, configPath: string): Record<string, unknown> {
  if (!isPlainObject(document)) {
    throw new Error(`Could not read model profile config at ${configPath}: root value must be an object.`);
  }
  if (
    Object.hasOwn(document, "version") &&
    (typeof document.version !== "number" || !Number.isSafeInteger(document.version) || document.version < 1)
  ) {
    throw new Error(`Could not read model profile config at ${configPath}: version must be a positive safe integer.`);
  }
  if (Object.hasOwn(document, "models") && !isPlainObject(document.models)) {
    throw new Error(`Could not read model profile config at ${configPath}: models must be an object.`);
  }

  const models = isPlainObject(document.models) ? document.models : {};
  if (
    Object.hasOwn(models, "activeProfile") &&
    models.activeProfile !== null &&
    typeof models.activeProfile !== "string"
  ) {
    throw new Error(`Could not read model profile config at ${configPath}: models.activeProfile must be a string or null.`);
  }
  if (Object.hasOwn(models, "profiles") && !isPlainObject(models.profiles)) {
    throw new Error(`Could not read model profile config at ${configPath}: models.profiles must be an object.`);
  }

  const profiles = isPlainObject(models.profiles) ? models.profiles : {};
  if (typeof models.activeProfile === "string" && !Object.hasOwn(profiles, models.activeProfile)) {
    throw new Error(`Could not read model profile config at ${configPath}: models.activeProfile '${models.activeProfile}' does not exist.`);
  }
  for (const [profileName, assignments] of Object.entries(profiles)) {
    const profilePath = childPath("models.profiles", profileName);
    if (!isPlainObject(assignments)) {
      throw new Error(`Could not read model profile config at ${configPath}: ${profilePath} must be an object.`);
    }
    for (const [agentName, value] of Object.entries(assignments)) {
      try {
        normalizeAgentName(agentName);
      } catch {
        continue;
      }
      StoredAssignment.create(value, childPath(profilePath, agentName));
    }
  }
  return document;
}
