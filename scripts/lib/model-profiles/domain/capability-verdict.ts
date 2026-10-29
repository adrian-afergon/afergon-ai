export type CapabilityOutcomeKind = "supported" | "known-unsupported" | "unknown";

export interface CapabilityProvenance {
  readonly provider: string;
  readonly model: string;
  readonly transport: string;
  readonly evidenceId: string;
  readonly claimKind: string;
  readonly pin: { readonly version: string; readonly commit: string };
}

function requireFeedback(feedback: string, kind: string): string {
  if (typeof feedback !== "string" || !feedback.trim()) {
    throw new Error(`${kind} verdicts require model-specific feedback.`);
  }
  return feedback;
}

/** Copies the known provenance layout (flat identity fields plus the nested pin) into a frozen independent value. */
function freezeProvenanceCopy(provenance: CapabilityProvenance): CapabilityProvenance {
  return Object.freeze({
    provider: provenance.provider,
    model: provenance.model,
    transport: provenance.transport,
    evidenceId: provenance.evidenceId,
    claimKind: provenance.claimKind,
    pin: Object.freeze({ version: provenance.pin.version, commit: provenance.pin.commit }),
  });
}

export class CapabilityVerdict {
  readonly provenance: CapabilityProvenance | null;

  private constructor(
    readonly kind: CapabilityOutcomeKind,
    provenance: CapabilityProvenance | null,
    readonly feedback: string,
  ) {
    // Store an independent frozen deep copy of the caller's provenance:
    // adopting or freezing the caller's object would be an input side effect.
    this.provenance = provenance === null ? null : freezeProvenanceCopy(provenance);
    Object.freeze(this);
  }

  static supported(provenance: CapabilityProvenance): CapabilityVerdict {
    if (
      !provenance ||
      typeof provenance.provider !== "string" || !provenance.provider ||
      typeof provenance.model !== "string" || !provenance.model ||
      typeof provenance.transport !== "string" || !provenance.transport ||
      typeof provenance.evidenceId !== "string" || !provenance.evidenceId ||
      typeof provenance.claimKind !== "string" || !provenance.claimKind ||
      !provenance.pin || typeof provenance.pin.version !== "string" || !provenance.pin.version ||
      typeof provenance.pin.commit !== "string" || !provenance.pin.commit
    ) {
      throw new Error("Supported verdicts require complete scoped provenance.");
    }
    return new CapabilityVerdict("supported", provenance, `Reasoning effort supported for ${provenance.model}.`);
  }

  static knownUnsupported(feedback: string): CapabilityVerdict {
    return new CapabilityVerdict("known-unsupported", null, requireFeedback(feedback, "Known-unsupported"));
  }

  static unknown(feedback: string): CapabilityVerdict {
    return new CapabilityVerdict("unknown", null, requireFeedback(feedback, "Unknown"));
  }
}
