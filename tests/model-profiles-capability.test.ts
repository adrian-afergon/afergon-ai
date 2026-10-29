import { expect, it } from "vitest";
import { CapabilityVerdict, type CapabilityProvenance } from "../scripts/lib/model-profiles/domain/capability-verdict.js";

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
