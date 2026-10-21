import type { AssignmentPatch } from "../domain/assignment-patch.js";
import type { UpdateResult } from "../application/update-profile-assignment-use-case.js";
import { createProfileCapabilities } from "./profile-composition.js";

export interface LoadedProfileDocument {
  document: Record<string, unknown>;
  configPath: string;
  exists: boolean;
  originalBytes?: string;
  sourceBytes?: Buffer;
}

export function updateProfileAssignment(
  profileName: string, agentName: string, patch: AssignmentPatch, options?: { env?: NodeJS.ProcessEnv },
): UpdateResult {
  return createProfileCapabilities(options?.env).update.execute({ profileName, agentName, patch });
}

export function loadProfileDocument(env?: NodeJS.ProcessEnv): LoadedProfileDocument {
  const loaded = createProfileCapabilities(env).reader.execute();
  return { document: loaded.document, configPath: loaded.source.sourceIdentity, exists: loaded.source.exists,
    ...(loaded.source.exists ? { sourceBytes: Buffer.from(loaded.source.sourceBytes!), originalBytes: loaded.originalText } : {}) };
}
