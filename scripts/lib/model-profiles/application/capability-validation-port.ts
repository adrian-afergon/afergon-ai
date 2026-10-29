import type { CapabilityProvenance, CapabilityVerdict } from "../domain/capability-verdict.js";
import type { AffectedPair } from "../domain/profile-resolution.js";
import type { UnknownEffortAcknowledgementData } from "../domain/unknown-effort-acknowledgement.js";

/** Per-pair explicit capability context. Never inferred from names or availability. */
export interface EffortCapabilityContext {
  readonly provider: string;
  readonly model: string;
  readonly transport: string;
  readonly evidenceId: string;
}

/** Immutable per-request validation context supplied by the lifecycle caller. */
export interface CapabilityOperationContext {
  readonly profileName: string;
  readonly acknowledgeUnknownEffort: boolean;
  readonly storedAcknowledgements: readonly UnknownEffortAcknowledgementData[];
}

export type CapabilityPairOutcomeKind =
  | "supported"
  | "known-unsupported"
  | "unknown"
  | "acknowledged-unknown"
  | "no-override";

export interface CapabilityPairOutcome {
  readonly agent: string;
  readonly model: string | null;
  readonly effort: string | null;
  readonly outcome: CapabilityPairOutcomeKind;
  readonly feedback: string | null;
  readonly provenance: CapabilityProvenance | null;
  readonly acknowledgement: UnknownEffortAcknowledgementData | null;
}

export interface CapabilityValidationReceipt {
  readonly profileName: string;
  readonly outcomes: readonly CapabilityPairOutcome[];
}

export interface CapabilityContextResolver {
  resolve(pair: AffectedPair, operationContext: CapabilityOperationContext): EffortCapabilityContext | null;
}

export interface EffortCapabilityQuery {
  classify(context: EffortCapabilityContext, effort: string): CapabilityVerdict;
}
