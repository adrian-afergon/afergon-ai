import type fs from "node:fs";
import { isDeepStrictEqual } from "node:util";
import type { AcquireMigrationSnapshotInput, SnapshotReceipt } from "../application/migration-snapshot-contracts.js";
import type { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import type { LegacyProfileDefaultsAdapter } from "./legacy-profile-defaults-adapter.js";

export class NodeSnapshotInspectionAdapter {
  constructor(
    private readonly boundPath: string,
    private readonly filesystem: typeof fs,
    private readonly validator: ProfileDocumentPolicy,
    private readonly defaults: LegacyProfileDefaultsAdapter,
  ) {}

  inspect(input: AcquireMigrationSnapshotInput): SnapshotReceipt | undefined {
    if (input.source.sourceIdentity !== this.boundPath) throw new Error("Profile source changed");
    if (typeof input.source.exists !== "boolean") throw new Error("Observation exists must be a boolean");
    if (input.source.exists && !(input.source.sourceBytes instanceof Uint8Array && ArrayBuffer.isView(input.source.sourceBytes))) {
      throw new Error("Present observation requires Uint8Array source bytes");
    }
    if (!input.source.exists && input.source.sourceBytes !== undefined) throw new Error("Absent observation must not carry source bytes");
    this.validator.validate(input.recoveryDocument, this.boundPath);
    this.validator.requireSupportedVersion(input.recoveryDocument, "snapshot");
    const captured = input.source.exists
      ? JSON.parse(Buffer.from(input.source.sourceBytes!).toString("utf8"))
      : this.defaults.create();
    this.validator.validate(captured, this.boundPath);
    this.validator.requireRecoveryMatch(isDeepStrictEqual(input.recoveryDocument, captured));
    const expected = input.source.exists
      ? Buffer.from(input.source.sourceBytes!)
      : Buffer.from(`${JSON.stringify(captured, null, 2)}\n`);
    const snapshotPath = `${this.boundPath}.pre-v2.bak`;
    let existing: Buffer;
    try {
      existing = this.filesystem.readFileSync(snapshotPath);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return undefined;
      throw error;
    }
    this.validator.validate(JSON.parse(existing.toString("utf8")), snapshotPath);
    if (!existing.equals(expected)) throw new Error("Existing migration snapshot does not match captured source");
    return { snapshotPath, disposition: "reused", complete: true };
  }
}
