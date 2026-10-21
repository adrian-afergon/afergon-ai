import type { AcquireMigrationSnapshotInput as SnapshotInput, SnapshotReceipt } from "../application/migration-snapshot-contracts.js";
import { SnapshotBytesMismatchError } from "./node-snapshot-inspection-adapter.js";
import { createProfileSourceCapabilities } from "./profile-composition.js";

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
  const capabilities = createProfileSourceCapabilities(source.configPath);
  const observation = { sourceIdentity: capabilities.configPath, exists: source.exists, sourceBytes: source.sourceBytes };
  return { observation, ...capabilities };
}

export function assertProfileSourceUnchanged(source: SourceObservation): void {
  const bound = bindSource(source);
  bound.storage.recheck(bound.observation);
}

export function acquireMigrationSnapshot(input: AcquireMigrationSnapshotInput): SnapshotReceipt {
  const bound = bindSource(input.source);
  try {
    return bound.snapshots.acquire({
      source: bound.observation, recoveryDocument: input.recoveryDocument,
    });
  } catch (error) {
    if (error instanceof SnapshotBytesMismatchError) throw new Error("Migration snapshot bytes do not match", { cause: error });
    throw error;
  }
}
