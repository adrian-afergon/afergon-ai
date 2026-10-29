import { expect, it } from "vitest";
import { CapabilityVerdict, type CapabilityProvenance } from "../scripts/lib/model-profiles/domain/capability-verdict.js";
import { ValidateProfileCapabilityUseCase } from "../scripts/lib/model-profiles/application/validate-profile-capability-use-case.js";
import type {
  CapabilityContextResolver,
  CapabilityOperationContext,
  EffortCapabilityQuery,
} from "../scripts/lib/model-profiles/application/capability-validation-port.js";
import type { AffectedPair } from "../scripts/lib/model-profiles/domain/profile-resolution.js";
import type { UnknownEffortAcknowledgementData } from "../scripts/lib/model-profiles/domain/unknown-effort-acknowledgement.js";

export function storedAck(overrides: Partial<UnknownEffortAcknowledgementData> = {}): UnknownEffortAcknowledgementData {
  return {
    ackKind: "afergon-ai.unknown-effort-acknowledgement",
    ackVersion: 1,
    scope: "resolved-pair",
    provider: "openai",
    model: "openai/gpt-5.1",
    transport: "@ai-sdk/openai",
    effort: "high",
    ...overrides,
  };
}

export const pinnedProvenance: CapabilityProvenance = {
  provider: "openai",
  model: "openai/gpt-5.1",
  transport: "@ai-sdk/openai",
  evidenceId: "opencode-1.18.34:e9f8a210b9e2b1e13d375b84906069886eb3b767:test-catalog:/openai/models/gpt-5.1",
  claimKind: "source-declared-test-catalog",
  pin: { version: "1.18.34", commit: "e9f8a210b9e2b1e13d375b84906069886eb3b767" },
};

it("reports a supported verdict with its scoped provenance", () => {
  const verdict = CapabilityVerdict.supported(pinnedProvenance);
  expect(verdict.kind).toBe("supported");
  expect(verdict.provenance).toEqual(pinnedProvenance);
  expect(verdict.feedback).toContain("openai/gpt-5.1");
});

it("refuses a supported verdict without complete provenance", () => {
  expect(() => CapabilityVerdict.supported(undefined as unknown as CapabilityProvenance)).toThrow(/provenance/);
  expect(() =>
    CapabilityVerdict.supported({ ...pinnedProvenance, evidenceId: "" }),
  ).toThrow(/provenance/);
});

it("reports a known-unsupported verdict with model-specific feedback and no provenance", () => {
  const verdict = CapabilityVerdict.knownUnsupported(
    "openai/gpt-5.1 rejects reasoning effort none on transport @ai-sdk/openai.",
  );
  expect(verdict.kind).toBe("known-unsupported");
  expect(verdict.provenance).toBeNull();
  expect(verdict.feedback).toContain("openai/gpt-5.1");
  expect(() => CapabilityVerdict.knownUnsupported("   ")).toThrow(/feedback/);
});

it("reports an unknown verdict with feedback and no provenance", () => {
  const verdict = CapabilityVerdict.unknown("No capability evidence for openai/gpt-5.1-mini; resemblance is not evidence.");
  expect(verdict.kind).toBe("unknown");
  expect(verdict.provenance).toBeNull();
  expect(verdict.feedback).toContain("openai/gpt-5.1-mini");
  expect(() => CapabilityVerdict.unknown("")).toThrow(/feedback/);
});

it("keeps verdicts immutable", () => {
  const verdict = CapabilityVerdict.supported(pinnedProvenance);
  expect(Object.isFrozen(verdict)).toBe(true);
  expect(Object.isFrozen(verdict.provenance)).toBe(true);
});

export function stubQuery(
  classify: (context: { model: string }, effort: string) => CapabilityVerdict,
): EffortCapabilityQuery {
  return { classify: (context, effort) => classify(context, effort) };
}

export function mapResolver(
  entries: Record<string, { provider: string; transport: string; evidenceId: string } | null>,
): CapabilityContextResolver {
  return {
    resolve(pair: AffectedPair): { provider: string; model: string; transport: string; evidenceId: string } | null {
      if (pair.model === null) return null;
      const entry = entries[pair.model];
      if (!entry) return null;
      return { provider: entry.provider, model: pair.model, transport: entry.transport, evidenceId: entry.evidenceId };
    },
  };
}

export function operationContext(overrides: Partial<CapabilityOperationContext> = {}): CapabilityOperationContext {
  return { profileName: "work", acknowledgeUnknownEffort: false, storedAcknowledgements: [], ...overrides };
}

it("returns one complete receipt for a supported pair", async () => {
  const useCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => CapabilityVerdict.supported(pinnedProvenance)),
    mapResolver({ "openai/gpt-5.1": { provider: "openai", transport: "@ai-sdk/openai", evidenceId: pinnedProvenance.evidenceId } }),
  );
  const receipt = await useCase.validateAffectedPairs(
    [{ agent: "review", model: "openai/gpt-5.1", effort: "high" }],
    operationContext(),
  );
  expect(receipt).not.toBeNull();
  expect(receipt?.profileName).toBe("work");
  expect(receipt?.outcomes).toHaveLength(1);
  const outcome = receipt?.outcomes[0];
  expect(outcome?.outcome).toBe("supported");
  expect(outcome?.provenance).toEqual(pinnedProvenance);
  expect(outcome?.agent).toBe("review");
  expect(outcome?.model).toBe("openai/gpt-5.1");
  expect(outcome?.effort).toBe("high");
});

it("reports explicit no-override outcomes without consulting capability evidence", async () => {
  let consulted = 0;
  const useCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => {
      consulted += 1;
      return CapabilityVerdict.supported(pinnedProvenance);
    }),
    mapResolver({}),
  );
  const receipt = await useCase.validateAffectedPairs(
    [{ agent: "review", model: "openai/gpt-5.1", effort: null }],
    operationContext(),
  );
  expect(consulted).toBe(0);
  expect(receipt?.outcomes[0]?.outcome).toBe("no-override");
  expect(receipt?.outcomes[0]?.provenance).toBeNull();
  expect(receipt?.outcomes[0]?.acknowledgement).toBeNull();
});

it("keeps runtime-default pairs unknown and acknowledges only the exact null state", async () => {
  const useCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => CapabilityVerdict.supported(pinnedProvenance)),
    mapResolver({}),
  );
  const pair = { agent: "review", model: null, effort: "high" };
  // No compatible concrete runtime model: unknown, and unknown without acknowledgement rejects.
  await expect(useCase.validateAffectedPairs([pair], operationContext())).rejects.toThrow(/unknown/i);
  const acknowledged = await useCase.validateAffectedPairs(
    [pair],
    operationContext({ acknowledgeUnknownEffort: true }),
  );
  expect(acknowledged?.outcomes[0]?.outcome).toBe("acknowledged-unknown");
  expect(acknowledged?.outcomes[0]?.acknowledgement).toEqual({
    ackKind: "afergon-ai.unknown-effort-acknowledgement",
    ackVersion: 1,
    scope: "runtime-default",
    provider: null,
    model: null,
    transport: null,
    effort: "high",
  });
});

it("accepts unknown pairs through exact stored acknowledgements without new intent", async () => {
  const useCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => CapabilityVerdict.unknown("No capability evidence for the requested pair.")),
    mapResolver({
      "openai/gpt-5.1": { provider: "openai", transport: "@ai-sdk/openai", evidenceId: pinnedProvenance.evidenceId },
      "openai/gpt-5.1-mini": { provider: "openai", transport: "@ai-sdk/openai", evidenceId: pinnedProvenance.evidenceId },
    }),
  );
  const stored = [storedAck()];
  const accepted = await useCase.validateAffectedPairs(
    [{ agent: "review", model: "openai/gpt-5.1", effort: "high" }],
    operationContext({ storedAcknowledgements: stored }),
  );
  expect(accepted?.outcomes[0]?.outcome).toBe("acknowledged-unknown");
  expect(accepted?.outcomes[0]?.acknowledgement).toEqual(stored[0]);
  // Changed model invalidates the acknowledgement (G5).
  await expect(
    useCase.validateAffectedPairs(
      [{ agent: "review", model: "openai/gpt-5.1-mini", effort: "high" }],
      operationContext({ storedAcknowledgements: stored }),
    ),
  ).rejects.toThrow(/No capability evidence/);
  // Changed effort invalidates the acknowledgement (G6).
  await expect(
    useCase.validateAffectedPairs(
      [{ agent: "review", model: "openai/gpt-5.1", effort: "low" }],
      operationContext({ storedAcknowledgements: stored }),
    ),
  ).rejects.toThrow(/No capability evidence/);
  // Malformed stored payloads are inert, never authorizing.
  await expect(
    useCase.validateAffectedPairs(
      [{ agent: "review", model: "openai/gpt-5.1", effort: "high" }],
      operationContext({ storedAcknowledgements: [{ intruder: true } as unknown as (typeof stored)[number]] }),
    ),
  ).rejects.toThrow(/No capability evidence/);
});

it("rejects known-unsupported pairs even with matching acknowledgement and intent", async () => {
  const useCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => CapabilityVerdict.knownUnsupported("openai/gpt-5.1 documents effort none as unsupported on @ai-sdk/openai.")),
    mapResolver({ "openai/gpt-5.1": { provider: "openai", transport: "@ai-sdk/openai", evidenceId: pinnedProvenance.evidenceId } }),
  );
  const pair = { agent: "review", model: "openai/gpt-5.1", effort: "none" };
  const stored = [storedAck({ effort: "none" })];
  await expect(useCase.validateAffectedPairs([pair], operationContext({ storedAcknowledgements: stored }))).rejects.toThrow(
    /documents effort none as unsupported/,
  );
  await expect(
    useCase.validateAffectedPairs([pair], operationContext({ storedAcknowledgements: stored, acknowledgeUnknownEffort: true })),
  ).rejects.toThrow(/documents effort none as unsupported/);
});

it("rejects malformed effort values before any acknowledgement can apply", async () => {
  const useCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => CapabilityVerdict.supported(pinnedProvenance)),
    mapResolver({ "openai/gpt-5.1": { provider: "openai", transport: "@ai-sdk/openai", evidenceId: pinnedProvenance.evidenceId } }),
  );
  const stored = [storedAck()];
  await expect(
    useCase.validateAffectedPairs([{ agent: "review", model: "openai/gpt-5.1", effort: "" }], operationContext({ storedAcknowledgements: stored, acknowledgeUnknownEffort: true })),
  ).rejects.toThrow(/reasoningEffort/);
  await expect(
    useCase.validateAffectedPairs([{ agent: "review", model: "openai/gpt-5.1", effort: "   " }], operationContext({ acknowledgeUnknownEffort: true })),
  ).rejects.toThrow(/reasoningEffort/);
});

it("treats missing or mismatched context identity as unknown, never supported", async () => {
  const useCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => CapabilityVerdict.supported(pinnedProvenance)),
    mapResolver({ "openai/gpt-5.1": { provider: "openai", transport: "@ai-sdk/openai", evidenceId: pinnedProvenance.evidenceId } }),
  );
  // Missing context: the resolver has no entry for the model.
  await expect(
    useCase.validateAffectedPairs([{ agent: "review", model: "openai/gpt-4", effort: "high" }], operationContext()),
  ).rejects.toThrow(/context/i);
  // Mismatched context identity: the resolver describes a different model than the candidate pair.
  const mismatched: CapabilityContextResolver = {
    resolve: () => ({ provider: "openai", model: "openai/gpt-4", transport: "@ai-sdk/openai", evidenceId: pinnedProvenance.evidenceId }),
  };
  const mismatchUseCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => CapabilityVerdict.supported(pinnedProvenance)),
    mismatched,
  );
  await expect(
    mismatchUseCase.validateAffectedPairs([{ agent: "review", model: "openai/gpt-5.1", effort: "high" }], operationContext()),
  ).rejects.toThrow(/missing or mismatched/);
});

it("validates against the captured request and returns immutable receipts", async () => {
  const useCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => CapabilityVerdict.supported(pinnedProvenance)),
    mapResolver({ "openai/gpt-5.1": { provider: "openai", transport: "@ai-sdk/openai", evidenceId: pinnedProvenance.evidenceId } }),
  );
  const pairs: AffectedPair[] = [{ agent: "review", model: "openai/gpt-5.1", effort: "high" }];
  const pending = useCase.validateAffectedPairs(pairs, operationContext());
  // Pending caller mutation must not leak into the already-captured request.
  (pairs[0] as { effort: string }).effort = "low";
  pairs.push({ agent: "afg-review", model: "openai/gpt-5.1", effort: "low" });
  const receipt = await pending;
  expect(receipt?.outcomes).toHaveLength(1);
  expect(receipt?.outcomes[0]?.effort).toBe("high");
  expect(Object.isFrozen(receipt)).toBe(true);
  expect(Object.isFrozen(receipt?.outcomes)).toBe(true);
  expect(Object.isFrozen(receipt?.outcomes[0])).toBe(true);
});
