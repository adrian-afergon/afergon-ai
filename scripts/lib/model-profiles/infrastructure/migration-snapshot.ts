import fs from "node:fs";
import path from "node:path";
import { createDefaultConfig } from "../../model-profiles-config.js";
import type { AcquireMigrationSnapshotInput as SnapshotInput, SnapshotReceipt } from "../application/migration-snapshot-contracts.js";
import { AgentTargetPolicy } from "../domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import { LegacyProfileDefaultsAdapter } from "./legacy-profile-defaults-adapter.js";
import { NodeSnapshotInspectionAdapter, SnapshotBytesMismatchError } from "./node-snapshot-inspection-adapter.js";
import { NodeMigrationSnapshotAdapter } from "./node-migration-snapshot-adapter.js";
import { bindProfileRead } from "./profile-read-composition.js";

export interface SourceObservation {
  configPath: string;
  exists: boolean;
  sourceBytes?: Buffer;
}

export interface AcquireMigrationSnapshotInput extends Omit<SnapshotInput, "source"> {
  source: SourceObservation;
}

export type { SnapshotReceipt } from "../application/migration-snapshot-contracts.js";

function bindSource(source: SourceObservation) {
  if (source.exists ? !Buffer.isBuffer(source.sourceBytes) : source.sourceBytes !== undefined) {
    throw new Error("Invalid source observation");
  }
  const boundPath = path.resolve(source.configPath);
  const observation = { sourceIdentity: boundPath, exists: source.exists, sourceBytes: source.sourceBytes };
  const storage = bindProfileRead({ AFERGON_AI_CONFIG_DIR: path.dirname(boundPath) }).createStorage();
  const inspector = new NodeSnapshotInspectionAdapter(boundPath, fs,
    new ProfileDocumentPolicy(new AgentTargetPolicy()), new LegacyProfileDefaultsAdapter(createDefaultConfig));
  return { observation, storage, inspector };
}

export function assertProfileSourceUnchanged(source: SourceObservation): void {
  const bound = bindSource(source);
  bound.storage.recheck(bound.observation);
}

export function acquireMigrationSnapshot(input: AcquireMigrationSnapshotInput): SnapshotReceipt {
  const bound = bindSource(input.source);
  try {
    return new NodeMigrationSnapshotAdapter(fs, bound.inspector, bound.storage).acquire({
      source: bound.observation, recoveryDocument: input.recoveryDocument,
    });
  } catch (error) {
    if (error instanceof SnapshotBytesMismatchError) throw new Error("Migration snapshot bytes do not match", { cause: error });
    throw error;
  }
}
