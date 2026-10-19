import type { RawProfileDocument } from "../domain/profile-document.js";
import type { ProfileDocumentObservation } from "./profile-document-observation.js";
import type { ProfileObservationPort } from "./profile-observation-port.js";

export interface ProfileStoragePort extends ProfileObservationPort {
  recheck(source: ProfileDocumentObservation): void;
  atomicPersist(document: RawProfileDocument, source: ProfileDocumentObservation): void;
}
