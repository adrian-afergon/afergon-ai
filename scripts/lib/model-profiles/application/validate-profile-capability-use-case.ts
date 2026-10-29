import type {
  CapabilityContextResolver,
  CapabilityOperationContext,
  CapabilityPairOutcome,
  CapabilityValidationReceipt,
  EffortCapabilityQuery,
} from "./capability-validation-port.js";
import type { AffectedPair } from "../domain/profile-resolution.js";
import { CapabilityVerdict } from "../domain/capability-verdict.js";
import { UnknownEffortAcknowledgement, UnknownEffortAcknowledgementPolicy, UNKNOWN_EFFORT_ACK_MARKER, UNKNOWN_EFFORT_ACK_VERSION } from "../domain/unknown-effort-acknowledgement.js";

/**
 * Shared strict capability validator: one awaited pass over the requested
 * pairs, returning one complete plain-data receipt. Unknown pairs are accepted
 * only through exact stored acknowledgements or an explicit per-operation
 * acknowledgement intent; malformed and known-unsupported pairs always reject.
 */
export class ValidateProfileCapabilityUseCase {
  private readonly policy = new UnknownEffortAcknowledgementPolicy();

  constructor(
    private readonly query: EffortCapabilityQuery,
    private readonly resolver: CapabilityContextResolver,
  ) {}

  async validateAffectedPairs(
    pairs: readonly AffectedPair[],
    context?: CapabilityOperationContext,
  ): Promise<void | CapabilityValidationReceipt> {
    const snapshot = pairs.map((pair) => ({ ...pair }));
    const outcomes = snapshot.map((pair) => this.classifyPair(pair, context));
    return Object.freeze({ profileName: context?.profileName ?? "", outcomes: Object.freeze(outcomes) });
  }

  private classifyPair(pair: AffectedPair, context?: CapabilityOperationContext): CapabilityPairOutcome {
    if (pair.effort === null || pair.effort === undefined) {
      return Object.freeze({
        agent: pair.agent, model: pair.model, effort: null,
        outcome: "no-override", feedback: null, provenance: null, acknowledgement: null,
      });
    }
    if (typeof pair.effort !== "string" || !pair.effort.trim() || pair.effort.trim().toLowerCase() === "inherit") {
      throw new Error(`${pair.agent}.reasoningEffort must be a nonempty explicit effort string.`);
    }
    const operation = context ?? emptyContext();
    const resolvedContext = pair.model === null ? null : this.resolver.resolve(pair, operation);
    const contextMissing = resolvedContext === null || resolvedContext.model !== pair.model;
    const verdict = !contextMissing
      ? this.query.classify(resolvedContext, pair.effort)
      : CapabilityVerdict.unknown(
          `Capability context for ${pair.agent} is missing or mismatched for ${pair.model ?? "runtime-default"}; validation stays unknown.`,
        );
    if (verdict.kind === "supported") {
      return Object.freeze({
        agent: pair.agent, model: pair.model, effort: pair.effort,
        outcome: "supported", feedback: verdict.feedback, provenance: verdict.provenance, acknowledgement: null,
      });
    }
    if (verdict.kind === "known-unsupported") {
      throw new Error(verdict.feedback);
    }
    const stored = operation.storedAcknowledgements.flatMap((data) => {
      try {
        return [UnknownEffortAcknowledgement.create(data, `${operation.profileName}.${pair.agent}.unknownEffortAck`)];
      } catch {
        return [];
      }
    });
    if (this.policy.authorizes(stored, pair, "unknown")) {
      const match = stored.find((ack) => ack.matches(pair))!;
      return Object.freeze({
        agent: pair.agent, model: pair.model, effort: pair.effort,
        outcome: "acknowledged-unknown", feedback: verdict.feedback, provenance: null,
        acknowledgement: match.toData(),
      });
    }
    if (operation.acknowledgeUnknownEffort) {
      // The acknowledgement binds the exact resolved pair (model + effort).
      // Provider/transport provenance is recorded when the context exists and
      // stays null when it was absent; runtime-default pairs bind the exact
      // null model state.
      const acknowledgement = UnknownEffortAcknowledgement.create(
        {
          ackKind: UNKNOWN_EFFORT_ACK_MARKER,
          ackVersion: UNKNOWN_EFFORT_ACK_VERSION,
          scope: pair.model === null ? "runtime-default" : "resolved-pair",
          provider: resolvedContext?.provider ?? null,
          model: pair.model,
          transport: resolvedContext?.transport ?? null,
          effort: pair.effort,
        },
        `${operation.profileName}.${pair.agent}.unknownEffortAck`,
      ).toData();
      return Object.freeze({
        agent: pair.agent, model: pair.model, effort: pair.effort,
        outcome: "acknowledged-unknown", feedback: verdict.feedback, provenance: null, acknowledgement,
      });
    }
    throw new Error(verdict.feedback);
  }
}

function emptyContext(): CapabilityOperationContext {
  return { profileName: "", acknowledgeUnknownEffort: false, storedAcknowledgements: [] };
}
