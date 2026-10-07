import fs from "node:fs";

import { createDefaultConfig, getConfigPath } from "../../model-profiles-config.js";
import { validateProfileDocument } from "./document-validation.js";

export interface LoadedProfileDocument {
  document: Record<string, unknown>;
  configPath: string;
  exists: boolean;
  originalBytes?: string;
  sourceBytes?: Buffer;
}

export function loadProfileDocument(env: NodeJS.ProcessEnv = process.env): LoadedProfileDocument {
  const configPath = getConfigPath(env);
  let sourceBytes: Buffer;
  try {
    sourceBytes = fs.readFileSync(configPath);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { document: createDefaultConfig() as unknown as Record<string, unknown>, configPath, exists: false };
    }
    throw error;
  }

  const originalBytes = sourceBytes.toString("utf8");
  const document = validateProfileDocument(JSON.parse(originalBytes) as unknown, configPath);
  return { document, configPath, exists: true, originalBytes, sourceBytes };
}
