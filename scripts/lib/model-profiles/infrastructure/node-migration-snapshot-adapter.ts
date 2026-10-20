import type fs from "node:fs";
import path from "node:path";
import type { SnapshotPort } from "../application/snapshot-port.js";
import type { AcquireMigrationSnapshotInput, SnapshotReceipt } from "../application/migration-snapshot-contracts.js";
import type { ProfileStoragePort } from "../application/profile-storage-port.js";
import type { NodeSnapshotInspectionAdapter } from "./node-snapshot-inspection-adapter.js";

interface OwnedPartialSnapshot {
  fd: number;
  snapshotPath: string;
}

export class NodeMigrationSnapshotAdapter implements SnapshotPort {
  constructor(
    private readonly filesystem: typeof fs,
    private readonly inspector: NodeSnapshotInspectionAdapter,
    private readonly storage: Pick<ProfileStoragePort, "recheck">,
  ) {}

  acquire(input: AcquireMigrationSnapshotInput): SnapshotReceipt {
    const expected = this.inspector.prepareExpected(input);
    this.filesystem.mkdirSync(path.dirname(expected.snapshotPath), { recursive: true });
    this.storage.recheck(input.source);
    let fd: number;
    try {
      fd = this.filesystem.openSync(expected.snapshotPath, "wx", 0o600);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
        const receipt = this.inspector.inspect(input);
        if (receipt) return receipt;
      }
      throw error;
    }
    const partial: OwnedPartialSnapshot = { fd, snapshotPath: expected.snapshotPath };
    try {
      this.filesystem.writeFileSync(fd, expected.bytes);
      this.filesystem.fsyncSync(fd);
      this.filesystem.closeSync(fd);
    } catch (error) {
      try {
        this.cleanupOwnedPartial(partial);
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "Migration snapshot failed; cleanup incomplete");
      }
      throw error;
    }
    return { snapshotPath: expected.snapshotPath, disposition: "created", complete: true };
  }

  private cleanupOwnedPartial(handle: OwnedPartialSnapshot): void {
    const errors: unknown[] = [];
    try { this.filesystem.closeSync(handle.fd); } catch (error) { errors.push(error); }
    try { this.filesystem.rmSync(handle.snapshotPath); } catch (error) { errors.push(error); }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, "Snapshot close and removal failed");
  }
}
