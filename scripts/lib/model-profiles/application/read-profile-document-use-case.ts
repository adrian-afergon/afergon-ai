import type { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import type { LoadedProfile } from "./profile-document-observation.js";
import type { ProfileObservationPort } from "./profile-observation-port.js";

export class ReadProfileDocumentUseCase {
  constructor(private readonly storage: ProfileObservationPort, private readonly validator: ProfileDocumentPolicy) {}

  execute(): LoadedProfile {
    const observed = this.storage.observe();
    const document = this.validator.validate(observed.document, observed.source.sourceIdentity);
    if (observed.source.exists && !(observed.source.sourceBytes instanceof Uint8Array && ArrayBuffer.isView(observed.source.sourceBytes))) {
      throw new Error("Present observation requires Uint8Array source bytes");
    }
    if (!observed.source.exists && observed.source.sourceBytes !== undefined) {
      throw new Error("Absent observation must not carry source bytes");
    }
    const source = { ...observed.source };
    if (source.sourceBytes !== undefined) source.sourceBytes = new Uint8Array(source.sourceBytes);
    return { ...observed, document, source };
  }
}
