import type fs from "node:fs";
import type { ObservedProfile, ProfileDocumentObservation } from "../application/profile-document-observation.js";
import type { ProfileStoragePort } from "../application/profile-storage-port.js";
import type { RawProfileDocument } from "../domain/profile-document.js";
import type { LegacyProfileDefaultsAdapter } from "./legacy-profile-defaults-adapter.js";
import type { LegacyAtomicProfileSaverAdapter } from "./legacy-atomic-profile-saver-adapter.js";

export class NodeProfileStorageAdapter implements ProfileStoragePort {
  constructor(
    private readonly boundPath: string,
    private readonly filesystem: typeof fs,
    private readonly defaults: LegacyProfileDefaultsAdapter,
    private readonly saver: LegacyAtomicProfileSaverAdapter,
  ) {}

  recheck(source: ProfileDocumentObservation): void {
    if (source.sourceIdentity !== this.boundPath) throw new Error("Profile source changed");
    if (typeof source.exists !== "boolean") throw new Error("Observation exists must be a boolean");
    if (source.exists && !(source.sourceBytes instanceof Uint8Array && ArrayBuffer.isView(source.sourceBytes))) {
      throw new Error("Present observation requires Uint8Array source bytes");
    }
    if (!source.exists && source.sourceBytes !== undefined) throw new Error("Absent observation must not carry source bytes");
    let bytes: Buffer;
    try {
      bytes = this.filesystem.readFileSync(this.boundPath);
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
      if (source.exists) throw new Error("Profile source changed");
      return;
    }
    if (!source.exists || !bytes.equals(Buffer.from(source.sourceBytes!))) {
      throw new Error("Profile source changed");
    }
  }

  atomicPersist(document: RawProfileDocument, source: ProfileDocumentObservation): void {
    // The caller owns validation/migration policy. This precheck is not CAS:
    // an external writer can still change the file before the saver's rename.
    this.recheck(source);
    this.saver.persist(document);
  }

  observe(): ObservedProfile {
    let bytes: Buffer | undefined;
    try {
      bytes = this.filesystem.readFileSync(this.boundPath);
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
    }
    if (bytes === undefined) return { document: this.defaults.create(), source: { sourceIdentity: this.boundPath, exists: false } };
    const originalText = bytes.toString("utf8");
    return { document: JSON.parse(originalText), originalText,
      source: { sourceIdentity: this.boundPath, exists: true, sourceBytes: new Uint8Array(bytes) } };
  }
}
