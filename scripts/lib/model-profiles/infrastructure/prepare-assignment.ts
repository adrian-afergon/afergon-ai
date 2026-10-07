import type { AssignmentPatch } from "../domain/assignment-patch.js";
import { StoredAssignment } from "../domain/stored-assignment.js";
import { cloneAssignments, normalizeAgentName } from "../../model-profiles-core.js";
import { validateProfileDocument } from "./document-validation.js";

export interface PrepareAssignmentInput {
  document: Record<string, unknown>;
  configPath: string;
  profileName: string;
  agentName: string;
  patch: AssignmentPatch;
}

export interface PreparedAssignment {
  document: Record<string, unknown>;
  changed: boolean;
  migrationRequired: boolean;
  version: number;
  agentKey?: string;
}

export function prepareProfileAssignment(input: PrepareAssignmentInput): PreparedAssignment {
  validateProfileDocument(input.document, input.configPath);
  const sourceVersion = typeof input.document.version === "number" ? input.document.version : 1;
  if (sourceVersion > 2) throw new Error(`Cannot prepare assignment for unsupported profile version ${sourceVersion}.`);
  if (!input.patch || typeof input.patch !== "object" || Array.isArray(input.patch)) throw new Error("Assignment patch must be an object.");
  const models = (input.document.models ?? {}) as { profiles?: Record<string, Record<string, unknown>> };
  const profiles = models.profiles ?? {};
  const profile = Object.hasOwn(profiles, input.profileName) ? profiles[input.profileName] : {};
  const canonical = normalizeAgentName(input.agentName);
  const equivalents = Object.keys(profile).filter(key => {
    try { return normalizeAgentName(key) === canonical; } catch { return false; }
  });
  if (!Object.hasOwn(profile, input.agentName) && equivalents.length > 1) throw new Error("Ambiguous assignment aliases");
  const agentKey = Object.hasOwn(profile, input.agentName) ? input.agentName : equivalents[0] ?? canonical;
  StoredAssignment.create(input.patch, `models.profiles[${JSON.stringify(input.profileName)}][${JSON.stringify(agentKey)}]`);
  const patch = {
    ...(Object.hasOwn(input.patch, "model") ? { model: input.patch.model } : {}),
    ...(Object.hasOwn(input.patch, "reasoningEffort") ? { reasoningEffort: input.patch.reasoningEffort } : {}),
  };
  const stored = profile[agentKey];
  const legacy = typeof stored === "string" && !Object.hasOwn(patch, "reasoningEffort");
  const assignment = legacy ? patch.model ?? stored : { ...(typeof stored === "string" ? { model: stored } : stored as object), ...patch };
  const changed = Object.keys(patch).length > 0 && JSON.stringify(assignment) !== JSON.stringify(stored);
  const migrationRequired = changed && !legacy && sourceVersion === 1;
  const targetedDocument = changed ? {
    ...input.document,
    models: {
      ...models,
      profiles: { ...profiles, [input.profileName]: { ...profile, [agentKey]: assignment } },
    },
  } : input.document;
  const document = cloneAssignments(targetedDocument);
  validateProfileDocument(document, input.configPath);
  return {
    document,
    changed, migrationRequired, version: migrationRequired ? 2 : sourceVersion, agentKey,
  };
}
