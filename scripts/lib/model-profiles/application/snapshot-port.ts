import type { AcquireMigrationSnapshotInput, SnapshotReceipt } from "./migration-snapshot-contracts.js";

export interface SnapshotPort {
  acquire(input: AcquireMigrationSnapshotInput): SnapshotReceipt;
}
