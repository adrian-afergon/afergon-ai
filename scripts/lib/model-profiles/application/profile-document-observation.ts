import type { RawProfileDocument } from "../domain/profile-document.js";

export interface ProfileDocumentObservation {
  sourceIdentity: string;
  exists: boolean;
  sourceBytes?: Uint8Array;
}

export interface ObservedProfile {
  document: unknown;
  source: ProfileDocumentObservation;
  originalText?: string;
}

export interface LoadedProfile extends Omit<ObservedProfile, "document"> {
  document: RawProfileDocument;
}
