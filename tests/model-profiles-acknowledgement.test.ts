import { expect, it } from "vitest";
import {
  UNKNOWN_EFFORT_ACK_MARKER,
  UNKNOWN_EFFORT_ACK_VERSION,
  UnknownEffortAcknowledgement,
  UnknownEffortAcknowledgementPolicy,
} from "../scripts/lib/model-profiles/domain/unknown-effort-acknowledgement.js";

export function resolvedPairAckData(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    ackKind: UNKNOWN_EFFORT_ACK_MARKER,
    ackVersion: UNKNOWN_EFFORT_ACK_VERSION,
    scope: "resolved-pair",
    provider: "openai",
    model: "openai/gpt-5.1",
    transport: "@ai-sdk/openai",
    effort: "high",
    ...overrides,
  };
}

it("binds an acknowledgement to the exact resolved pair", () => {
  const ack = UnknownEffortAcknowledgement.create(
    resolvedPairAckData(),
    "models.profiles[work].review.unknownEffortAck",
  );
  expect(ack.matches({ model: "openai/gpt-5.1", effort: "high" })).toBe(true);
});

it("refuses malformed acknowledgement payloads", () => {
  const path = "models.profiles[work].review.unknownEffortAck";
  expect(() => UnknownEffortAcknowledgement.create(null, path)).toThrow(/unknownEffortAck/);
  expect(() => UnknownEffortAcknowledgement.create("nope", path)).toThrow(/unknownEffortAck/);
  expect(() => UnknownEffortAcknowledgement.create(resolvedPairAckData({ ackKind: "other" }), path)).toThrow(/unknownEffortAck/);
  expect(() => UnknownEffortAcknowledgement.create(resolvedPairAckData({ ackVersion: 2 }), path)).toThrow(/unknownEffortAck/);
  expect(() => UnknownEffortAcknowledgement.create(resolvedPairAckData({ scope: "global" }), path)).toThrow(/unknownEffortAck/);
  expect(() => UnknownEffortAcknowledgement.create(resolvedPairAckData({ effort: "  " }), path)).toThrow(/unknownEffortAck/);
  expect(() => UnknownEffortAcknowledgement.create(resolvedPairAckData({ model: null }), path)).toThrow(/unknownEffortAck/);
  expect(() =>
    UnknownEffortAcknowledgement.create(
      resolvedPairAckData({ scope: "runtime-default", model: "openai/gpt-5.1", provider: null, transport: null }),
      path,
    ),
  ).toThrow(/unknownEffortAck/);
});

// Characterization (passes by construction of exact equality): scope-exactness.
it("matches runtime-default acknowledgements only against the exact null model state", () => {
  const ack = UnknownEffortAcknowledgement.create(
    { ackKind: UNKNOWN_EFFORT_ACK_MARKER, ackVersion: UNKNOWN_EFFORT_ACK_VERSION, scope: "runtime-default", provider: null, model: null, transport: null, effort: "low" },
    "models.profiles[work].review.unknownEffortAck",
  );
  expect(ack.matches({ model: null, effort: "low" })).toBe(true);
  expect(ack.matches({ model: "openai/gpt-5.1", effort: "low" })).toBe(false);
  expect(ack.matches({ model: null, effort: "high" })).toBe(false);
  expect(ack.matches({ model: null, effort: null })).toBe(false);
});

it("classifies own acknowledgement payloads as absent, owned, or foreign", () => {
  const path = "models.profiles[work].review.unknownEffortAck";
  const valid = resolvedPairAckData();
  expect(UnknownEffortAcknowledgement.readOwn({}, path).kind).toBe("absent");
  const ownedEntry = { unknownEffortAck: valid };
  expect(UnknownEffortAcknowledgement.readOwn(ownedEntry, path).kind).toBe("owned");
  expect(UnknownEffortAcknowledgement.readOwn({ unknownEffortAck: "garbage" }, path).kind).toBe("foreign");
  expect(UnknownEffortAcknowledgement.readOwn({ unknownEffortAck: { ackKind: "nope" } }, path).kind).toBe("foreign");
  // Prototype-carried payloads are not own metadata: they read as absent.
  const protoCarrier = Object.create({ unknownEffortAck: valid }) as Record<string, unknown>;
  expect(UnknownEffortAcknowledgement.readOwn(protoCarrier, path).kind).toBe("absent");
});

it("applies acknowledgements with collision refusal and idempotent owned replacement", () => {
  const path = "models.profiles[work].review.unknownEffortAck";
  const ack = UnknownEffortAcknowledgement.create(resolvedPairAckData(), path);
  const fresh: Record<string, unknown> = { model: "openai/gpt-5.1", reasoningEffort: "high" };
  expect(ack.applyTo(fresh, path)).toBe(true);
  expect(Object.hasOwn(fresh, "unknownEffortAck")).toBe(true);
  expect(fresh.unknownEffortAck).toEqual(resolvedPairAckData());
  expect(ack.applyTo(fresh, path)).toBe(false);
  const staleAck = UnknownEffortAcknowledgement.create(resolvedPairAckData({ effort: "low" }), path);
  expect(staleAck.applyTo(fresh, path)).toBe(true);
  expect((fresh.unknownEffortAck as { effort: string }).effort).toBe("low");
  const foreign = { unknownEffortAck: { intruder: true } };
  expect(() => ack.applyTo(foreign, path)).toThrow(/refusing to overwrite/);
  expect(foreign.unknownEffortAck).toEqual({ intruder: true });
});

it("clears only valid owned acknowledgement metadata and preserves foreign payloads", () => {
  const path = "models.profiles[work].review.unknownEffortAck";
  const ack = UnknownEffortAcknowledgement.create(resolvedPairAckData(), path);
  const owned: Record<string, unknown> = { reasoningEffort: "high", unknownEffortAck: resolvedPairAckData() };
  expect(ack.removeFrom(owned)).toBe(true);
  expect(Object.hasOwn(owned, "unknownEffortAck")).toBe(false);
  expect(owned.reasoningEffort).toBe("high");
  expect(ack.removeFrom({})).toBe(false);
  const foreign: Record<string, unknown> = { unknownEffortAck: { intruder: true } };
  expect(ack.removeFrom(foreign)).toBe(false);
  expect(foreign.unknownEffortAck).toEqual({ intruder: true });
});

it("authorizes unknown pairs only through exact stored acknowledgements", () => {
  const path = "models.profiles[work].review.unknownEffortAck";
  const ack = UnknownEffortAcknowledgement.create(resolvedPairAckData(), path);
  const policy = new UnknownEffortAcknowledgementPolicy();
  const pair = { model: "openai/gpt-5.1", effort: "high" };
  expect(policy.authorizes([ack], pair, "unknown")).toBe(true);
  // A matching acknowledgement never bypasses negative or positive evidence.
  expect(policy.authorizes([ack], pair, "known-unsupported")).toBe(false);
  expect(policy.authorizes([ack], pair, "supported")).toBe(false);
  // Stale or absent metadata authorizes nothing.
  expect(policy.authorizes([], pair, "unknown")).toBe(false);
  expect(policy.authorizes([ack], { model: "openai/gpt-5.1", effort: "low" }, "unknown")).toBe(false);
  expect(policy.authorizes([ack], { model: null, effort: "high" }, "unknown")).toBe(false);
});
