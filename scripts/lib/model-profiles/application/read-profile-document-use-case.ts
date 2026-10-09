import type { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import type { LoadedProfile } from "./profile-document-observation.js";
import type { ProfileObservationPort } from "./profile-observation-port.js";

export class ReadProfileDocumentUseCase {
  constructor(private readonly storage: ProfileObservationPort, private readonly validator: ProfileDocumentPolicy) {}

  execute(): LoadedProfile {
    const observed = this.storage.observe();
    const document = this.validator.validate(observed.document, observed.source.sourceIdentity);
    return { ...observed, document };
  }
}
