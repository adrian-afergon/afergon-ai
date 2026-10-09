import { bindProfileRead } from "./profile-read-composition.js";

export interface LoadedProfileDocument {
  document: Record<string, unknown>;
  configPath: string;
  exists: boolean;
  originalBytes?: string;
  sourceBytes?: Buffer;
}

export function loadProfileDocument(env?: NodeJS.ProcessEnv): LoadedProfileDocument {
  const loaded = bindProfileRead(env).createReader().execute();
  return { document: loaded.document, configPath: loaded.source.sourceIdentity, exists: loaded.source.exists,
    ...(loaded.source.exists ? { sourceBytes: Buffer.from(loaded.source.sourceBytes!), originalBytes: loaded.originalText } : {}) };
}
