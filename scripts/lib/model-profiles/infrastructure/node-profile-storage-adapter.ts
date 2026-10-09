import type fs from "node:fs";
import type { ObservedProfile } from "../application/profile-document-observation.js";
import type { ProfileObservationPort } from "../application/profile-observation-port.js";
import type { LegacyProfileDefaultsAdapter } from "./legacy-profile-defaults-adapter.js";

export class NodeProfileStorageAdapter implements ProfileObservationPort {
  constructor(private readonly boundPath: string, private readonly filesystem: typeof fs, private readonly defaults: LegacyProfileDefaultsAdapter) {}

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
