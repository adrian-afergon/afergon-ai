import { vi } from "vitest";
import type { RawProfileDocument } from "../scripts/lib/model-profiles/domain/profile-document.js";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import { ProfileAssignmentPolicy } from "../scripts/lib/model-profiles/domain/profile-assignment-policy.js";
import { RawProfileDocumentCloner } from "../scripts/lib/model-profiles/domain/raw-profile-document-cloner.js";
import { ReadProfileDocumentUseCase } from "../scripts/lib/model-profiles/application/read-profile-document-use-case.js";
import { PrepareProfileAssignmentUseCase } from "../scripts/lib/model-profiles/application/prepare-profile-assignment-use-case.js";
import { UpdateProfileAssignmentUseCase } from "../scripts/lib/model-profiles/application/update-profile-assignment-use-case.js";
import type { ObservedProfile, ProfileDocumentObservation } from "../scripts/lib/model-profiles/application/profile-document-observation.js";
import type { ProfileStoragePort } from "../scripts/lib/model-profiles/application/profile-storage-port.js";
import type { SnapshotPort } from "../scripts/lib/model-profiles/application/snapshot-port.js";
import type { AcquireMigrationSnapshotInput, SnapshotReceipt } from "../scripts/lib/model-profiles/application/migration-snapshot-contracts.js";

export class MemoryProfileStorage implements ProfileStoragePort {
  readonly log: string[] = [];
  currentBytes?: Uint8Array;
  saved?: RawProfileDocument;

  constructor(readonly observation: ObservedProfile) {
    this.currentBytes = observation.source.sourceBytes;
  }

  observe(): ObservedProfile {
    this.log.push("observe");
    return this.observation;
  }

  recheck(source: ProfileDocumentObservation): void {
    this.log.push("recheck");
    if (source.exists !== (this.currentBytes !== undefined) ||
      String(source.sourceBytes) !== String(this.currentBytes)) throw new Error("Profile source changed");
  }

  atomicPersist(document: RawProfileDocument, source: ProfileDocumentObservation): void {
    this.log.push("persist");
    this.saved = document;
  }
}

export class MemorySnapshots implements SnapshotPort {
  input?: AcquireMigrationSnapshotInput;
  backup?: Uint8Array;

  constructor(private readonly storage: MemoryProfileStorage) {}

  acquire(input: AcquireMigrationSnapshotInput): SnapshotReceipt {
    this.storage.log.push("snapshot");
    this.input = input;
    this.backup = input.source.sourceBytes;
    return { snapshotPath: "memory:backup", disposition: "created", complete: true };
  }
}

export function updateMemory(document: RawProfileDocument = {
  version: 1, memo: ["café"], models: { profiles: { work: { review: "old" } } },
}, exists = true) {
  const bytes = exists ? new TextEncoder().encode(JSON.stringify(document)) : undefined;
  const storage = new MemoryProfileStorage({ document, source: { sourceIdentity: "configured:memory", exists, sourceBytes: bytes } });
  const snapshots = new MemorySnapshots(storage);
  const agents = new AgentTargetPolicy();
  const validator = new ProfileDocumentPolicy(agents);
  const reader = new ReadProfileDocumentUseCase(storage, validator);
  const preparer = new PrepareProfileAssignmentUseCase(new ProfileAssignmentPolicy(validator, agents, new RawProfileDocumentCloner()));
  const read = vi.spyOn(reader, "execute");
  const prepare = vi.spyOn(preparer, "execute");
  const acquire = vi.spyOn(snapshots, "acquire");
  const recheck = vi.spyOn(storage, "recheck");
  const persist = vi.spyOn(storage, "atomicPersist");
  const useCase = new UpdateProfileAssignmentUseCase(reader, preparer, validator, storage, snapshots);
  const input = { profileName: "work", agentName: "review", patch: { reasoningEffort: "high" } };
  return { document, bytes, storage, snapshots, validator, reader, preparer, read, prepare, acquire, recheck, persist, useCase, input };
}
