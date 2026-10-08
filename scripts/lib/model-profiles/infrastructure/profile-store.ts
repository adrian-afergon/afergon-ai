import fs from "node:fs";

import { createDefaultConfig, getConfigPath, saveConfig } from "../../model-profiles-config.js";
import { validateProfileDocument } from "./document-validation.js";
import type { AssignmentPatch } from "../domain/assignment-patch.js";
import { prepareProfileAssignment } from "./prepare-assignment.js";
import { acquireMigrationSnapshot, assertProfileSourceUnchanged } from "./migration-snapshot.js";

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

export function updateProfileAssignment(
  profileName: string, agentName: string, patch: AssignmentPatch,
  options: { env?: NodeJS.ProcessEnv } = {},
): { configPath: string; version: number; snapshotPath?: string } {
  const source = loadProfileDocument(options.env);
  const prepared = prepareProfileAssignment({ ...source, profileName, agentName, patch });
  validateProfileDocument(prepared.document, source.configPath);
  if (typeof prepared.document.version === "number" && prepared.document.version > 2) {
    throw new Error(`Cannot update unsupported profile version ${prepared.document.version}`);
  }
  if (!prepared.changed) return { configPath: source.configPath, version: prepared.version };
  assertProfileSourceUnchanged(source);
  let snapshotPath: string | undefined;
  if (prepared.migrationRequired) {
    snapshotPath = acquireMigrationSnapshot({ source, recoveryDocument: source.document }).snapshotPath;
    prepared.document.version = 2;
  }
  validateProfileDocument(prepared.document, source.configPath);
  assertProfileSourceUnchanged(source);
  saveConfig(prepared.document, options.env);
  return { configPath: source.configPath, version: prepared.version, ...(snapshotPath ? { snapshotPath } : {}) };
}
