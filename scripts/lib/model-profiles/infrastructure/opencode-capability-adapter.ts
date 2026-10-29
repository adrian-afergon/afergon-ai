import { CapabilityVerdict } from "../domain/capability-verdict.js";
import type { EffortCapabilityContext } from "../application/capability-validation-port.js";
import { OPENCODE_PIN_CATALOG_EVIDENCE, type OpencodeCapabilityEvidenceRecord } from "./opencode-capability-evidence.js";

/**
 * Exact-tuple evidence classifier. Support requires an explicit record for the
 * exact provider + resolved model identity + transport tuple with the effort in
 * the record's declared options. Model availability, name resemblance, missing
 * variants and out-of-menu values never establish support or incompatibility:
 * they stay unknown. Known-unsupported requires an explicit applicable negative
 * record (production carries none; tests inject clearly labeled unit negatives).
 */
export class OpencodeCapabilityAdapter {
  constructor(private readonly records: readonly OpencodeCapabilityEvidenceRecord[] = OPENCODE_PIN_CATALOG_EVIDENCE) {}

  classify(context: EffortCapabilityContext, effort: string): CapabilityVerdict {
    const record = this.records.find(
      (candidate) =>
        candidate.provider === context.provider &&
        candidate.resolvedModelIdentity === context.model &&
        candidate.transport === context.transport,
    );
    if (!record) {
      return CapabilityVerdict.unknown(
        `No versioned capability evidence for ${context.provider}/${context.model} on ${context.transport}; resemblance and availability are not evidence.`,
      );
    }
    if (!record.effortOptions.includes(effort)) {
      return CapabilityVerdict.unknown(
        `Effort '${effort}' is not in the declared options for ${context.model} at ${record.pin.version}; menu absence is not negative evidence.`,
      );
    }
    if (record.capability === "unsupported") {
      return CapabilityVerdict.knownUnsupported(
        `${context.model} records effort '${effort}' as unsupported on ${context.transport} per ${record.claimKind} evidence at ${record.pin.version}.`,
      );
    }
    return CapabilityVerdict.supported({
      provider: context.provider,
      model: context.model,
      transport: context.transport,
      evidenceId: `${record.pin.version}:${record.pin.commit}:${record.claimKind}:${record.catalogPointer}`,
      claimKind: record.claimKind,
      pin: record.pin,
    });
  }
}
