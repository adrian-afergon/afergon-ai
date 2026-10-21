import type { AssignmentPatch } from "../domain/assignment-patch.js";
import type { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import type { ReadProfileDocumentUseCase } from "./read-profile-document-use-case.js";
import type { PrepareProfileAssignmentUseCase } from "./prepare-profile-assignment-use-case.js";
import type { ProfileStoragePort } from "./profile-storage-port.js";
import type { SnapshotPort } from "./snapshot-port.js";
import type { SnapshotReceipt } from "./migration-snapshot-contracts.js";

export interface UpdateAssignmentInput {
  profileName: string;
  agentName: string;
  patch: AssignmentPatch;
}

export interface UpdateResult {
  configPath: string;
  version: number;
  snapshotPath?: string;
}

export class UpdateProfileAssignmentUseCase {
  constructor(
    private readonly reader: ReadProfileDocumentUseCase,
    private readonly preparer: PrepareProfileAssignmentUseCase,
    private readonly validator: ProfileDocumentPolicy,
    private readonly storage: ProfileStoragePort,
    private readonly snapshots: SnapshotPort,
  ) {}

  execute(input: UpdateAssignmentInput): UpdateResult {
    const loaded = this.reader.execute();
    this.validator.requireSupportedVersion(loaded.document, "prepare");
    const prepared = this.preparer.execute({ ...input, document: loaded.document, sourceIdentity: loaded.source.sourceIdentity });
    this.validator.validate(prepared.document, loaded.source.sourceIdentity);
    this.validator.requireSupportedVersion(prepared.document, "update");
    if (!prepared.changed) return { configPath: loaded.source.sourceIdentity, version: prepared.version };
    this.storage.recheck(loaded.source);
    let receipt: SnapshotReceipt | undefined;
    if (prepared.migrationRequired) {
      receipt = this.snapshots.acquire({ source: loaded.source, recoveryDocument: loaded.document });
      if (receipt.complete !== true) throw new Error("Migration snapshot is incomplete");
      prepared.document.version = 2;
    }
    this.validator.validate(prepared.document, loaded.source.sourceIdentity);
    this.storage.recheck(loaded.source);
    this.storage.atomicPersist(prepared.document, loaded.source);
    return { configPath: loaded.source.sourceIdentity, version: prepared.version,
      ...(receipt ? { snapshotPath: receipt.snapshotPath } : {}) };
  }
}
