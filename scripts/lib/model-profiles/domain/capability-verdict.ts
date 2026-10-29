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

export class CapabilityVerdict {
  private constructor(
    readonly kind: CapabilityOutcomeKind,
    readonly provenance: CapabilityProvenance | null,
    readonly feedback: string,
  ) {
    Object.freeze(provenance ?? {});
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
