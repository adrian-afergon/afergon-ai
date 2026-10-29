import { expect, it, vi } from "vitest";
import {
  UNKNOWN_EFFORT_ACK_MARKER,
  UNKNOWN_EFFORT_ACK_VERSION,
  UnknownEffortAcknowledgement,
  UnknownEffortAcknowledgementPolicy,
} from "../scripts/lib/model-profiles/domain/unknown-effort-acknowledgement.js";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { ProfileAssignments } from "../scripts/lib/model-profiles/domain/profile-resolution.js";
import type { RawProfileDocument } from "../scripts/lib/model-profiles/domain/profile-document.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import { RawProfileDocumentCloner } from "../scripts/lib/model-profiles/domain/raw-profile-document-cloner.js";
import { ReadProfileDocumentUseCase } from "../scripts/lib/model-profiles/application/read-profile-document-use-case.js";
import { ProfileLifecycleUseCase } from "../scripts/lib/model-profiles/application/profile-lifecycle-use-case.js";
import type { ValidateAffectedPairs } from "../scripts/lib/model-profiles/application/profile-lifecycle-use-case.js";
import { ValidateProfileCapabilityUseCase } from "../scripts/lib/model-profiles/application/validate-profile-capability-use-case.js";
import type {
  CapabilityContextResolver,
  CapabilityOperationContext,
  EffortCapabilityQuery,
} from "../scripts/lib/model-profiles/application/capability-validation-port.js";
import type { ProfileStoragePort } from "../scripts/lib/model-profiles/application/profile-storage-port.js";
import type { SnapshotPort } from "../scripts/lib/model-profiles/application/snapshot-port.js";
import type { ObservedProfile } from "../scripts/lib/model-profiles/application/profile-document-observation.js";
import { CapabilityVerdict } from "../scripts/lib/model-profiles/domain/capability-verdict.js";
import type { UnknownEffortAcknowledgementData } from "../scripts/lib/model-profiles/domain/unknown-effort-acknowledgement.js";

function storedAckData(overrides: Partial<UnknownEffortAcknowledgementData> = {}): UnknownEffortAcknowledgementData {
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

function operationContext(overrides: Partial<CapabilityOperationContext> = {}): CapabilityOperationContext {
  return { profileName: "work", acknowledgeUnknownEffort: false, storedAcknowledgements: [], ...overrides };
}

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

it("clearing effort removes valid owned acknowledgement metadata and preserves foreign payloads", () => {
  const agents = new AgentTargetPolicy();
  const owned = ProfileAssignments.create(
    { review: { model: "openai/gpt-5.1", reasoningEffort: "high", unknownEffortAck: resolvedPairAckData() } },
    "models.profiles[work]",
    agents,
  );
  const clearedOwned = owned.withClearedEffort("review");
  const ownedEntry = clearedOwned.raw().review as Record<string, unknown>;
  expect(Object.hasOwn(ownedEntry, "reasoningEffort")).toBe(false);
  expect(Object.hasOwn(ownedEntry, "unknownEffortAck")).toBe(false);
  const foreign = ProfileAssignments.create(
    { review: { model: "openai/gpt-5.1", reasoningEffort: "high", unknownEffortAck: { intruder: true } } },
    "models.profiles[work]",
    agents,
  );
  const clearedForeign = foreign.withClearedEffort("review");
  const foreignEntry = clearedForeign.raw().review as Record<string, unknown>;
  expect(Object.hasOwn(foreignEntry, "reasoningEffort")).toBe(false);
  expect(foreignEntry.unknownEffortAck).toEqual({ intruder: true });
});

class AckMemoryStorage implements ProfileStoragePort {
  readonly log: string[] = [];
  saved?: RawProfileDocument;
  failPersist?: Error;
  observation: ObservedProfile;

  constructor(observation: ObservedProfile) {
    this.observation = observation;
  }

  observe(): ObservedProfile {
    this.log.push("observe");
    return this.observation;
  }

  recheck(): void {
    this.log.push("recheck");
  }

  atomicPersist(document: RawProfileDocument): void {
    this.log.push("persist");
    if (this.failPersist) throw this.failPersist;
    this.saved = document;
    const bytes = new TextEncoder().encode(JSON.stringify(document));
    this.observation = {
      document: JSON.parse(JSON.stringify(document)) as RawProfileDocument,
      source: { sourceIdentity: this.observation.source.sourceIdentity, exists: true, sourceBytes: bytes },
    };
  }
}

class AckMemorySnapshots implements SnapshotPort {
  readonly acquired: unknown[] = [];
  acquire(input: Parameters<SnapshotPort["acquire"]>[0]): ReturnType<SnapshotPort["acquire"]> {
    this.acquired.push(input);
    return { snapshotPath: "memory:backup", disposition: "created", complete: true };
  }
}

function unknownQuery(feedback = "No capability evidence for the requested pair."): EffortCapabilityQuery {
  return { classify: () => CapabilityVerdict.unknown(feedback) };
}

function singleResolver(model: string): CapabilityContextResolver {
  return {
    resolve: (pair) =>
      pair.model === model
        ? { provider: "openai", model: pair.model, transport: "@ai-sdk/openai", evidenceId: "evidence:pin" }
        : null,
  };
}

function ackLifecycle(
  document: RawProfileDocument,
  options: { query?: EffortCapabilityQuery; resolver?: CapabilityContextResolver; validator?: ValidateAffectedPairs } = {},
) {
  const bytes = new TextEncoder().encode(JSON.stringify(document));
  const storage = new AckMemoryStorage({
    document,
    source: { sourceIdentity: "configured:memory", exists: true, sourceBytes: bytes },
  });
  const snapshots = new AckMemorySnapshots();
  const agents = new AgentTargetPolicy();
  const validator = new ProfileDocumentPolicy(agents);
  const reader = new ReadProfileDocumentUseCase(storage, validator);
  const persist = vi.spyOn(storage, "atomicPersist");
  const capabilityValidator = options.validator
    ? options.validator
    : new ValidateProfileCapabilityUseCase(options.query ?? unknownQuery(), options.resolver ?? singleResolver("openai/gpt-5.1"));
  const lifecycle = new ProfileLifecycleUseCase(reader, validator, new RawProfileDocumentCloner(), storage, snapshots, capabilityValidator, agents);
  return { document, storage, snapshots, persist, lifecycle, validator };
}

it("persists an exact-pair acknowledgement with the assignment in one atomic commit", async () => {
  const f = ackLifecycle({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.1" } } },
  });
  const result = await f.lifecycle.saveAssignment({
    profileName: "work",
    agentName: "review",
    patch: { reasoningEffort: "high" },
    acknowledgeUnknownEffort: true,
  });
  expect(f.persist).toHaveBeenCalledOnce();
  const savedReview = (f.storage.saved?.models as { profiles: { work: { review: Record<string, unknown> } } }).profiles.work.review;
  expect(savedReview).toEqual({
    model: "openai/gpt-5.1",
    reasoningEffort: "high",
    unknownEffortAck: {
      ackKind: UNKNOWN_EFFORT_ACK_MARKER,
      ackVersion: UNKNOWN_EFFORT_ACK_VERSION,
      scope: "resolved-pair",
      provider: "openai",
      model: "openai/gpt-5.1",
      transport: "@ai-sdk/openai",
      effort: "high",
    },
  });
  expect(result.refreshIntent).toBe(true);
});

it("rejects unknown pairs without intent before any write and preserves state", async () => {
  const f = ackLifecycle({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.1" } } },
  });
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "high" } }),
  ).rejects.toThrow(/No capability evidence/);
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.storage.saved).toBeUndefined();
});

it("honors stored acknowledgements on switch and preserves host state on rejection", async () => {
  const acked = resolvedPairAckData();
  const f = ackLifecycle({
    version: 2,
    models: {
      activeProfile: "main",
      profiles: {
        main: { review: "openai/gpt-5.5" },
        edge: { review: { model: "openai/gpt-5.1", reasoningEffort: "high", unknownEffortAck: acked } },
        raw: { review: { model: "openai/gpt-5.1", reasoningEffort: "high" } },
      },
    },
  });
  // Switching to the acknowledged profile passes with no new intent.
  const switched = await f.lifecycle.switchProfile({ profileName: "edge" });
  expect(switched.refreshIntent).toBe(true);
  expect(f.persist).toHaveBeenCalledOnce();
  // Switching to the unacknowledged unknown profile rejects and preserves state.
  f.persist.mockClear();
  f.storage.saved = undefined;
  f.storage.log.length = 0;
  await expect(f.lifecycle.switchProfile({ profileName: "raw" })).rejects.toThrow(/No capability evidence/);
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.storage.saved).toBeUndefined();
});

function forgedReceiptValidator(
  mutate: (pairs: readonly { agent: string; model: string | null; effort: string | null }[]) => import("../scripts/lib/model-profiles/application/capability-validation-port.js").CapabilityValidationReceipt,
): ValidateAffectedPairs {
  return {
    async validateAffectedPairs(pairs) {
      return mutate(pairs.map((pair) => ({ ...pair })));
    },
  };
}

it("rejects forged receipts without partial acknowledgement application", async () => {
  const document = {
    version: 2,
    models: {
      activeProfile: "work",
      profiles: { work: { "afg-review": "openai/gpt-5.1", "afg-design": "openai/gpt-5.1" } },
    },
  };
  // Forged identity: the receipt claims a different model than the candidate's actual post-resolution pair.
  const f = ackLifecycle(document, {
    validator: forgedReceiptValidator((pairs) => ({
      profileName: "work",
      outcomes: pairs.map((pair) => ({
        agent: pair.agent,
        model: "openai/gpt-4",
        effort: pair.effort,
        outcome: "acknowledged-unknown",
        feedback: "forged",
        provenance: null,
        acknowledgement: {
          ackKind: UNKNOWN_EFFORT_ACK_MARKER,
          ackVersion: UNKNOWN_EFFORT_ACK_VERSION,
          scope: "resolved-pair",
          provider: "openai",
          model: "openai/gpt-4",
          transport: "@ai-sdk/openai",
          effort: pair.effort as string,
        },
      })),
    })),
  });
  await expect(
    f.lifecycle.saveAssignments({
      profileName: "work",
      acknowledgeUnknownEffort: true,
      assignments: [
        { agentName: "afg-review", patch: { reasoningEffort: "high" } },
        { agentName: "afg-design", patch: { reasoningEffort: "high" } },
      ],
    }),
  ).rejects.toThrow(/does not match the candidate's actual post-resolution pair/);
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.storage.saved).toBeUndefined();
});

function receiptValidator(receipt: import("../scripts/lib/model-profiles/application/capability-validation-port.js").CapabilityValidationReceipt): ValidateAffectedPairs {
  return {
    async validateAffectedPairs() {
      return receipt;
    },
  };
}

function acknowledgedOutcome(agent: string, effort: string): import("../scripts/lib/model-profiles/application/capability-validation-port.js").CapabilityPairOutcome {
  return {
    agent,
    model: "openai/gpt-5.1",
    effort,
    outcome: "acknowledged-unknown",
    feedback: "unknown",
    provenance: null,
    acknowledgement: {
      ackKind: UNKNOWN_EFFORT_ACK_MARKER,
      ackVersion: UNKNOWN_EFFORT_ACK_VERSION,
      scope: "resolved-pair",
      provider: "openai",
      model: "openai/gpt-5.1",
      transport: "@ai-sdk/openai",
      effort,
    },
  };
}

it("rejects incomplete and duplicate receipts atomically", async () => {
  const document = {
    version: 2,
    models: { activeProfile: "work", profiles: { work: { "afg-review": "openai/gpt-5.1", "afg-design": "openai/gpt-5.1" } } },
  };
  const bulk = {
    profileName: "work",
    acknowledgeUnknownEffort: true,
    assignments: [
      { agentName: "afg-review", patch: { reasoningEffort: "high" } },
      { agentName: "afg-design", patch: { reasoningEffort: "high" } },
    ],
  };
  // Missing outcome for the second requested agent.
  const incomplete = ackLifecycle(document, {
    validator: receiptValidator({ profileName: "work", outcomes: [acknowledgedOutcome("afg-review", "high")] }),
  });
  await expect(incomplete.lifecycle.saveAssignments(bulk)).rejects.toThrow(/count does not match/);
  expect(incomplete.persist).not.toHaveBeenCalled();
  // Duplicate outcome for the same agent.
  const duplicate = ackLifecycle(document, {
    validator: receiptValidator({
      profileName: "work",
      outcomes: [acknowledgedOutcome("afg-review", "high"), acknowledgedOutcome("afg-review", "high")],
    }),
  });
  await expect(duplicate.lifecycle.saveAssignments(bulk)).rejects.toThrow(/duplicate outcome/);
  expect(duplicate.persist).not.toHaveBeenCalled();
  // Unrequested agent in the receipt.
  const unrequested = ackLifecycle(document, {
    validator: receiptValidator({
      profileName: "work",
      outcomes: [acknowledgedOutcome("afg-review", "high"), acknowledgedOutcome("afg-implement", "high")],
    }),
  });
  await expect(unrequested.lifecycle.saveAssignments(bulk)).rejects.toThrow(/unrequested agent/);
  expect(unrequested.persist).not.toHaveBeenCalled();
});

it("keeps trusted P3 void validators free of acknowledgement effects", async () => {
  const f = ackLifecycle({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.1" } } },
  }, { validator: { validateAffectedPairs: async () => {} } });
  // Acknowledgement intent with a void validator: no receipt, no ack metadata.
  const result = await f.lifecycle.saveAssignment({
    profileName: "work",
    agentName: "review",
    patch: { reasoningEffort: "high" },
    acknowledgeUnknownEffort: true,
  });
  expect(f.persist).toHaveBeenCalledOnce();
  const savedReview = (f.storage.saved?.models as { profiles: { work: { review: Record<string, unknown> } } }).profiles.work.review;
  expect(savedReview).toEqual({ model: "openai/gpt-5.1", reasoningEffort: "high" });
  expect(Object.hasOwn(savedReview, "unknownEffortAck")).toBe(false);
  expect(result.refreshIntent).toBe(true);
  // Ack-only intent with a void validator: nothing to write.
  f.persist.mockClear();
  const noop = await f.lifecycle.saveAssignment({
    profileName: "work",
    agentName: "review",
    patch: { reasoningEffort: "high" },
    acknowledgeUnknownEffort: true,
  });
  expect(f.persist).not.toHaveBeenCalled();
  expect(noop.refreshIntent).toBe(false);
});

it("writes acknowledgement-only intent through fresh validation and stays idempotent afterwards", async () => {
  const document = {
    version: 1,
    models: { activeProfile: "work", profiles: { work: { review: { model: "openai/gpt-5.1", reasoningEffort: "high" } } } },
  };
  const f = ackLifecycle(document);
  // Ack-only save on an unchanged assignment: fresh validation runs, exact metadata is written.
  const first = await f.lifecycle.saveAssignment({
    profileName: "work",
    agentName: "review",
    patch: { reasoningEffort: "high" },
    acknowledgeUnknownEffort: true,
  });
  expect(f.persist).toHaveBeenCalledOnce();
  expect(first.version).toBe(2);
  expect(first.snapshotPath).toBe("memory:backup");
  // The ORIGINAL v1 document was snapshotted, not the candidate.
  const acquired = f.snapshots.acquired[0] as { recoveryDocument: { version: number } };
  expect(acquired.recoveryDocument.version).toBe(1);
  const savedReview = (f.storage.saved?.models as { profiles: { work: { review: Record<string, unknown> } } }).profiles.work.review;
  expect(savedReview.unknownEffortAck).toBeDefined();
  // Identical acknowledgement after fresh validation: no write, no refresh.
  f.persist.mockClear();
  f.snapshots.acquired.length = 0;
  const second = await f.lifecycle.saveAssignment({
    profileName: "work",
    agentName: "review",
    patch: { reasoningEffort: "high" },
    acknowledgeUnknownEffort: true,
  });
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.snapshots.acquired).toHaveLength(0);
  expect(second.refreshIntent).toBe(false);
  expect(second.version).toBe(2);
});

it("keeps ordinary unchanged patches as P3 no-ops without validation writes", async () => {
  let validationCalls = 0;
  const f = ackLifecycle({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: { model: "openai/gpt-5.1", reasoningEffort: "high" } } } },
  }, {
    validator: {
      async validateAffectedPairs() {
        validationCalls += 1;
        return undefined;
      },
    },
  });
  const result = await f.lifecycle.saveAssignment({
    profileName: "work",
    agentName: "review",
    patch: { reasoningEffort: "high" },
  });
  expect(validationCalls).toBe(0);
  expect(f.persist).not.toHaveBeenCalled();
  expect(result.refreshIntent).toBe(false);
  expect(result.desiredState.cleanupCoverage).toEqual([]);
});

it("revalidates inheriting children on parent change and refuses stale acknowledgements", async () => {
  // Child inherits the canonical afergon-ai model and carries an explicit effort
  // with a stored acknowledgement bound to the OLD resolved model.
  const document = {
    version: 2,
    models: {
      activeProfile: "work",
      profiles: {
        work: {
          "afergon-ai": "openai/gpt-5.1",
          "afg-design": { reasoningEffort: "high", unknownEffortAck: resolvedPairAckData({ model: "openai/gpt-5.1", effort: "high" }) },
        },
      },
    },
  };
  // Parent model change resolves the child to a different model: the child's new
  // pair is validated before the parent change is committed (G12).
  const f = ackLifecycle(document, {
    resolver: {
      resolve: (pair) =>
        pair.model
          ? { provider: "openai", model: pair.model, transport: "@ai-sdk/openai", evidenceId: "evidence:pin" }
          : null,
    },
  });
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "afergon-ai", patch: { model: "openai/gpt-5.9" } }),
  ).rejects.toThrow(/No capability evidence/);
  expect(f.persist).not.toHaveBeenCalled();
  // With explicit intent the operation acknowledges the child's NEW exact pair
  // (the old stored acknowledgement alone never authorized it).
  const f2 = ackLifecycle(document);
  await f2.lifecycle.saveAssignment({
    profileName: "work",
    agentName: "afergon-ai",
    patch: { model: "openai/gpt-5.9" },
    acknowledgeUnknownEffort: true,
  });
  expect(f2.persist).toHaveBeenCalledOnce();
  const child = (f2.storage.saved?.models as { profiles: { work: { "afg-design": Record<string, unknown> } } }).profiles.work["afg-design"];
  expect((child.unknownEffortAck as { model: string; effort: string }).model).toBe("openai/gpt-5.9");
  expect((child.unknownEffortAck as { model: string; effort: string }).effort).toBe("high");
});

it("rejects misplaced per-item acknowledgement flags instead of silently broadening permission", async () => {
  const document = {
    version: 2,
    models: { activeProfile: "work", profiles: { work: { "afg-review": "openai/gpt-5.1", "afg-design": "openai/gpt-5.1" } } },
  };
  const f = ackLifecycle(document);
  // Legacy per-item JS input: the flag belongs on the OPERATION, never on an item.
  await expect(
    f.lifecycle.saveAssignments({
      profileName: "work",
      assignments: [
        { agentName: "afg-review", patch: { reasoningEffort: "high" }, acknowledgeUnknownEffort: true },
        { agentName: "afg-design", patch: { reasoningEffort: "high" } },
      ] as never,
    }),
  ).rejects.toThrow(/acknowledgeUnknownEffort/);
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.storage.saved).toBeUndefined();
  expect(f.snapshots.acquired).toHaveLength(0);
});

it("acknowledges the operation-wide affected set exactly under a top-level bulk intent", async () => {
  const document = {
    version: 2,
    models: { activeProfile: "work", profiles: { work: { "afg-review": "openai/gpt-5.1", "afg-design": "openai/gpt-5.1" } } },
  };
  const f = ackLifecycle(document);
  const result = await f.lifecycle.saveAssignments({
    profileName: "work",
    acknowledgeUnknownEffort: true,
    assignments: [
      { agentName: "afg-review", patch: { reasoningEffort: "high" } },
      { agentName: "afg-design", patch: { reasoningEffort: "high" } },
    ],
  });
  expect(f.persist).toHaveBeenCalledOnce();
  expect(result.refreshIntent).toBe(true);
  const saved = f.storage.saved?.models as { profiles: { work: Record<string, Record<string, unknown>> } };
  for (const agent of ["afg-review", "afg-design"]) {
    const ack = saved.profiles.work[agent].unknownEffortAck as { model: string; effort: string; scope: string };
    expect(ack.scope).toBe("resolved-pair");
    expect(ack.model).toBe("openai/gpt-5.1");
    expect(ack.effort).toBe("high");
  }
});

it("rejects unknown bulk pairs before any snapshot commit when the operation flag is absent or false", async () => {
  const document = {
    version: 1,
    models: { activeProfile: "work", profiles: { work: { "afg-review": "openai/gpt-5.1", "afg-design": "openai/gpt-5.1" } } },
  };
  for (const acknowledgeUnknownEffort of [undefined, false]) {
    const f = ackLifecycle(document);
    await expect(
      f.lifecycle.saveAssignments({
        profileName: "work",
        ...(acknowledgeUnknownEffort === undefined ? {} : { acknowledgeUnknownEffort }),
        assignments: [
          { agentName: "afg-review", patch: { reasoningEffort: "high" } },
          { agentName: "afg-design", patch: { reasoningEffort: "high" } },
        ],
      }),
    ).rejects.toThrow(/No capability evidence/);
    // Rejection happens before ANY snapshot commit: no ORIGINAL snapshot, no write.
    expect(f.snapshots.acquired).toHaveLength(0);
    expect(f.persist).not.toHaveBeenCalled();
    expect(f.storage.saved).toBeUndefined();
  }
});

it("rejects a receipt naming a different profile atomically without metadata, snapshot, or write", () => {
  const document = {
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.1" } } },
  };
  const f = ackLifecycle(document, {
    validator: receiptValidator({ profileName: "other", outcomes: [acknowledgedOutcome("afg-review", "high")] }),
  });
  return expect(
    f.lifecycle.saveAssignment({
      profileName: "work",
      agentName: "review",
      patch: { reasoningEffort: "high" },
      acknowledgeUnknownEffort: true,
    }),
  ).rejects.toThrow(/targets profile 'other'/).then(() => {
    expect(f.persist).not.toHaveBeenCalled();
    expect(f.storage.saved).toBeUndefined();
    expect(f.snapshots.acquired).toHaveLength(0);
  });
});

it("runs fresh validation for acknowledgement intent on a supported unchanged pair and writes nothing", async () => {
  const supported = ackLifecycle({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: { model: "openai/gpt-5.1", reasoningEffort: "high" } } } },
  }, {
    query: { classify: () => CapabilityVerdict.supported({
      provider: "openai",
      model: "openai/gpt-5.1",
      transport: "@ai-sdk/openai",
      evidenceId: "evidence:pin",
      claimKind: "source-declared-test-catalog",
      pin: { version: "1.18.34", commit: "e9f8a210b9e2b1e13d375b84906069886eb3b767" },
    }) },
  });
  const result = await supported.lifecycle.saveAssignment({
    profileName: "work",
    agentName: "review",
    patch: { reasoningEffort: "high" },
    acknowledgeUnknownEffort: true,
  });
  // Fresh validation ran (the supported verdict came from the query), but a
  // supported pair produces no acknowledgement metadata, no write, no refresh.
  expect(supported.persist).not.toHaveBeenCalled();
  expect(supported.storage.saved).toBeUndefined();
  expect(result.refreshIntent).toBe(false);
  const observed = supported.storage.observation.document as { models: { profiles: { work: { review: Record<string, unknown> } } } };
  expect(Object.hasOwn(observed.models.profiles.work.review, "unknownEffortAck")).toBe(false);
});

it("refuses acknowledgement writes over foreign payloads and preserves bytes", async () => {
  const document = {
    version: 2,
    models: {
      activeProfile: "work",
      profiles: { work: { review: { model: "openai/gpt-5.1", reasoningEffort: "high", unknownEffortAck: { intruder: true } } } },
    },
  };
  const f = ackLifecycle(document);
  await expect(
    f.lifecycle.saveAssignment({
      profileName: "work",
      agentName: "review",
      patch: { reasoningEffort: "high" },
      acknowledgeUnknownEffort: true,
    }),
  ).rejects.toThrow(/refusing to overwrite/);
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.storage.saved).toBeUndefined();
});

it("never treats a separate model-ID allowance as effort authorization", async () => {
  const document = {
    version: 2,
    models: {
      activeProfile: "work",
      profiles: { work: { review: { model: "openai/gpt-5.1", reasoningEffort: "high", allowUnknownModel: true } } },
    },
  };
  const f = ackLifecycle(document);
  // A changed effort with only a model-ID allowance (no acknowledgement, no intent) rejects.
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow(/No capability evidence/);
  expect(f.persist).not.toHaveBeenCalled();
  // The foreign allowance field survives the failed operation untouched.
  expect(f.storage.saved).toBeUndefined();
});

it("clones acknowledgement metadata but replay still requires the exact resolved pair", async () => {
  const document = {
    version: 2,
    models: {
      activeProfile: "work",
      profiles: { work: { review: { model: "openai/gpt-5.1", reasoningEffort: "high", unknownEffortAck: resolvedPairAckData() } } },
    },
  };
  const f = ackLifecycle(document);
  const clone = await f.lifecycle.cloneProfile({ sourceProfileName: "work", targetProfileName: "copy" });
  expect(clone.refreshIntent).toBe(false);
  const copied = (f.storage.saved?.models as { profiles: { copy: { review: Record<string, unknown> } } }).profiles.copy.review;
  expect(copied.unknownEffortAck).toEqual(resolvedPairAckData());
  // The cloned profile replays against the same exact pair through the shared validator.
  const f2 = ackLifecycle(document);
  await expect(
    f2.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow(/No capability evidence/);
});

it("preserves original bytes when the atomic save fails after acknowledgement application", async () => {
  const document = {
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.1" } } },
  };
  const f = ackLifecycle(document);
  f.storage.failPersist = new Error("disk full");
  await expect(
    f.lifecycle.saveAssignment({
      profileName: "work",
      agentName: "review",
      patch: { reasoningEffort: "high" },
      acknowledgeUnknownEffort: true,
    }),
  ).rejects.toThrow(/disk full/);
  // The in-memory observation was never mutated by the failed commit.
  const observed = f.storage.observation.document as { models: { profiles: { work: { review: unknown } } } };
  expect(observed.models.profiles.work.review).toBe("openai/gpt-5.1");
});

it("rejects known-unsupported pairs through the lifecycle even with matching acknowledgement and intent", async () => {
  const document = {
    version: 2,
    models: {
      activeProfile: "work",
      profiles: { work: { review: { model: "openai/gpt-5.1", reasoningEffort: "none", unknownEffortAck: resolvedPairAckData({ effort: "none" }) } } },
    },
  };
  const f = ackLifecycle(document, {
    query: { classify: () => CapabilityVerdict.knownUnsupported("openai/gpt-5.1 documents effort none as unsupported on @ai-sdk/openai.") },
  });
  await expect(
    f.lifecycle.saveAssignment({
      profileName: "work",
      agentName: "review",
      patch: { reasoningEffort: "none" },
      acknowledgeUnknownEffort: true,
    }),
  ).rejects.toThrow(/documents effort none as unsupported/);
  expect(f.persist).not.toHaveBeenCalled();
});

it("gives projection validation the same verdicts as save validation through the shared use case", async () => {
  // G13: the projection consumer calls the same pure use case with the same
  // pair and context shape; acceptance and rejection must match save/switch.
  const query = unknownQuery();
  const resolver = singleResolver("openai/gpt-5.1");
  const useCase = new ValidateProfileCapabilityUseCase(query, resolver);
  const pair = { agent: "afg-review", model: "openai/gpt-5.1", effort: "high" };
  // Pure projection call: unknown without acknowledgement rejects.
  await expect(useCase.validateAffectedPairs([pair], operationContext())).rejects.toThrow(/No capability evidence/);
  // The same pair through a lifecycle save rejects identically.
  const f = ackLifecycle({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.1" } } },
  });
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "high" } }),
  ).rejects.toThrow(/No capability evidence/);
  // With an exact acknowledgement both surfaces accept identically.
  const stored = [storedAckData()];
  const acceptedProjection = await useCase.validateAffectedPairs([pair], operationContext({ storedAcknowledgements: stored }));
  expect(acceptedProjection?.outcomes[0]?.outcome).toBe("acknowledged-unknown");
  const f2 = ackLifecycle({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: { model: "openai/gpt-5.1", reasoningEffort: "high", unknownEffortAck: resolvedPairAckData() } } } },
  });
  const acceptedSave = await f2.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "high" } });
  expect(acceptedSave.refreshIntent).toBe(false);
});
