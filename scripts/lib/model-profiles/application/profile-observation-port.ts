import type { ObservedProfile } from "./profile-document-observation.js";

export interface ProfileObservationPort {
  observe(): ObservedProfile;
}
