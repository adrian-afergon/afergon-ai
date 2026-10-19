import type { RawProfileDocument } from "../domain/profile-document.js";
import type { ProfileDocumentObservation } from "./profile-document-observation.js";

export interface AcquireMigrationSnapshotInput {
  source: ProfileDocumentObservation;
  recoveryDocument: RawProfileDocument;
}

export interface SnapshotReceipt {
  snapshotPath: string;
  disposition: "created" | "reused";
  complete: true;
}
