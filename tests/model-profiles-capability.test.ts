import { expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CapabilityVerdict, type CapabilityProvenance } from "../scripts/lib/model-profiles/domain/capability-verdict.js";
import { ValidateProfileCapabilityUseCase } from "../scripts/lib/model-profiles/application/validate-profile-capability-use-case.js";
import { OpencodeCapabilityAdapter } from "../scripts/lib/model-profiles/infrastructure/opencode-capability-adapter.js";
import { OPENCODE_PIN_CATALOG_EVIDENCE } from "../scripts/lib/model-profiles/infrastructure/opencode-capability-evidence.js";
import { OpencodeCompatibilityReport } from "../scripts/lib/model-profiles/infrastructure/opencode-compatibility-report.js";
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

it("never freezes or adopts the caller's provenance object", () => {
  const callerProvenance: CapabilityProvenance = {
    ...pinnedProvenance,
    pin: { ...pinnedProvenance.pin },
  };
  const verdict = CapabilityVerdict.supported(callerProvenance);
  // The caller's object stays unfrozen and mutable: freezing it was an input side effect.
  expect(Object.isFrozen(callerProvenance)).toBe(false);
  expect(Object.isFrozen(callerProvenance.pin)).toBe(false);
  // The verdict carries an independent immutable copy.
  expect(Object.isFrozen(verdict.provenance)).toBe(true);
  expect(verdict.provenance).toEqual(pinnedProvenance);
  // Mutating the caller afterwards cannot change the verdict.
  const mutableCaller = callerProvenance as {
    provider: string; model: string; transport: string; evidenceId: string; claimKind: string;
    pin: { version: string; commit: string };
  };
  mutableCaller.evidenceId = "tampered";
  mutableCaller.pin.commit = "tampered";
  expect(verdict.provenance?.evidenceId).toBe(pinnedProvenance.evidenceId);
  expect(verdict.provenance?.pin.commit).toBe(pinnedProvenance.pin.commit);
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

it("replays stored runtime-default acknowledgements only against the exact null model state", async () => {
  const useCase = new ValidateProfileCapabilityUseCase(
    stubQuery(() => CapabilityVerdict.unknown("No capability evidence for the requested pair.")),
    mapResolver({}),
  );
  const stored = [storedAck({ scope: "runtime-default", provider: null, model: null, transport: null, effort: "low" })];
  // Exact null state + effort: accepted as acknowledged-unknown.
  const accepted = await useCase.validateAffectedPairs(
    [{ agent: "review", model: null, effort: "low" }],
    operationContext({ storedAcknowledgements: stored }),
  );
  expect(accepted?.outcomes[0]?.outcome).toBe("acknowledged-unknown");
  expect(accepted?.outcomes[0]?.acknowledgement?.scope).toBe("runtime-default");
  // The same stored acknowledgement never authorizes a later concrete model.
  await expect(
    useCase.validateAffectedPairs(
      [{ agent: "review", model: "openai/gpt-5.1", effort: "low" }],
      operationContext({ storedAcknowledgements: stored }),
    ),
  ).rejects.toThrow(/validation stays unknown/);
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

it("classifies the pinned catalog pair as supported with scoped provenance", () => {
  const adapter = new OpencodeCapabilityAdapter();
  const verdict = adapter.classify(
    { provider: "openai", model: "openai/gpt-5.1", transport: "@ai-sdk/openai", evidenceId: "opencode-1.18.34" },
    "high",
  );
  expect(verdict.kind).toBe("supported");
  expect(verdict.provenance?.pin).toEqual({ version: "1.18.34", commit: "e9f8a210b9e2b1e13d375b84906069886eb3b767" });
  expect(verdict.provenance?.claimKind).toBe("source-declared-test-catalog");
  expect(verdict.provenance?.model).toBe("openai/gpt-5.1");
});

it("never infers capability from transport variance, resemblance, or menu absence", () => {
  const adapter = new OpencodeCapabilityAdapter();
  // A different transport is a different tuple: unknown, never assumed equal.
  expect(adapter.classify({ provider: "openai", model: "openai/gpt-5.1", transport: "@ai-sdk/azure", evidenceId: "x" }, "high").kind).toBe("unknown");
  // A different provider is a different tuple.
  expect(adapter.classify({ provider: "azure", model: "openai/gpt-5.1", transport: "@ai-sdk/openai", evidenceId: "x" }, "high").kind).toBe("unknown");
  // Name resemblance does not establish support (G9).
  expect(adapter.classify({ provider: "openai", model: "openai/gpt-5.1-preview", transport: "@ai-sdk/openai", evidenceId: "x" }, "high").kind).toBe("unknown");
  // Out-of-menu effort values stay unknown: menu absence is not negative evidence.
  const outOfMenu = adapter.classify({ provider: "openai", model: "openai/gpt-5.1", transport: "@ai-sdk/openai", evidenceId: "x" }, "extreme");
  expect(outOfMenu.kind).toBe("unknown");
  expect(outOfMenu.feedback).toContain("not negative evidence");
});

it("classifies explicit unit-negative records as known-unsupported without forging upstream claims", () => {
  // Clearly labeled synthetic unit negative: mechanism test only, never an
  // actual upstream negative claim.
  const unitNegative = [{
    ...OPENCODE_PIN_CATALOG_EVIDENCE[0],
    model: "unit-negative-model",
    resolvedModelIdentity: "openai/unit-negative-model",
    capability: "unsupported" as const,
    claimKind: "unit-test-negative",
  }];
  const adapter = new OpencodeCapabilityAdapter(unitNegative);
  const verdict = adapter.classify({ provider: "openai", model: "openai/unit-negative-model", transport: "@ai-sdk/openai", evidenceId: "x" }, "low");
  expect(verdict.kind).toBe("known-unsupported");
  expect(verdict.feedback).toContain("unit-test-negative");
  // Out-of-menu on a negative record still stays unknown (no invented negatives).
  expect(adapter.classify({ provider: "openai", model: "openai/unit-negative-model", transport: "@ai-sdk/openai", evidenceId: "x" }, "extreme").kind).toBe("unknown");
});

it("reports the pinned source evidence without execution claims", () => {
  const report = new OpencodeCompatibilityReport();
  const evidence = report.sourceEvidence() as {
    pin: { version: string; commit: string };
    claimKind: string;
    inspected: readonly string[];
    claims: { executedSchemaAcceptance: boolean; providerRequestAcceptance: boolean; otherVersionCompatibility: boolean };
  };
  expect(evidence.pin).toEqual({ version: "1.18.34", commit: "e9f8a210b9e2b1e13d375b84906069886eb3b767" });
  expect(evidence.claimKind).toBe("source-evidence");
  expect(evidence.inspected.some((entry) => entry.includes("models-api.json"))).toBe(true);
  expect(evidence.claims.executedSchemaAcceptance).toBe(false);
  expect(evidence.claims.providerRequestAcceptance).toBe(false);
  expect(evidence.claims.otherVersionCompatibility).toBe(false);
});

it("identifies untested OpenCode versions as unverified instead of inferring from the pin", () => {
  const report = new OpencodeCompatibilityReport();
  const tested = report.compatibilityStatus("1.18.34") as { version: string; status: string };
  expect(tested.status).toBe("source-inspected");
  const untested = report.compatibilityStatus("1.19.0") as { version: string; status: string };
  expect(untested.status).toBe("unverified");
  expect(untested.status).not.toContain("compatible");
});

it("keeps the production evidence seed in exact agreement with the immutable DATA fixture", () => {
  const fixture = JSON.parse(
    fs.readFileSync(path.resolve("tests/fixtures/opencode-pin-catalog/gpt-5.1.json"), "utf8"),
  ) as {
    provenance: { pin: { version: string; commit: string; sourceRoot: string }; blobs: Record<string, string> };
    catalog: { openai: { models: { "gpt-5.1": { reasoning: boolean; reasoning_options: string[]; transport: string; model_override: null } }; npm: string } };
  };
  const record = OPENCODE_PIN_CATALOG_EVIDENCE[0];
  expect(record.pin).toEqual({ version: fixture.provenance.pin.version, commit: fixture.provenance.pin.commit });
  expect(record.sourceRoot).toBe(fixture.provenance.pin.sourceRoot);
  expect(record.blobs).toEqual(fixture.provenance.blobs);
  const model = fixture.catalog.openai.models["gpt-5.1"];
  expect(record.model).toBe("gpt-5.1");
  expect(record.reasoning).toBe(model.reasoning);
  expect(record.effortOptions).toEqual(model.reasoning_options);
  expect(record.transport).toBe(model.transport);
  expect(record.modelOverride).toEqual(model.model_override);
  expect(record.npmPointer).toBe("/openai/npm");
  expect(fixture.catalog.openai.npm).toBe("@ai-sdk/openai");
  // The production seed is nonempty: the real positive record exists.
  expect(OPENCODE_PIN_CATALOG_EVIDENCE.length).toBeGreaterThan(0);
});

it("emitted capability surface cold-imports without IO and executes the strict validator", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-p4-emitted-"));
  const vertical = new URL("../dist/scripts/lib/model-profiles/", import.meta.url).href;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from "node:assert/strict";
    import fs from "node:fs";
    const vertical = ${JSON.stringify(vertical)};
    const root = ${JSON.stringify(root)};
    const originals = [];
    const moduleReads = [
      vertical + "infrastructure/opencode-capability-evidence.js",
      vertical + "infrastructure/opencode-capability-adapter.js",
      vertical + "infrastructure/opencode-compatibility-report.js",
      vertical + "application/validate-profile-capability-use-case.js",
      vertical + "application/capability-validation-port.js",
      vertical + "domain/capability-verdict.js",
      vertical + "domain/profile-resolution.js",
      vertical + "domain/agent-target-policy.js",
      vertical + "domain/stored-assignment.js",
      vertical + "domain/unknown-effort-acknowledgement.js",
    ];
    function guard() {
      for (const [object, method] of [[fs, "readFileSync"], [fs, "writeFileSync"], [fs, "renameSync"], [fs, "mkdirSync"]]) {
        const original = object[method];
        originals.push([object, method, original]);
        object[method] = (...args) => {
          const file = String(args[0]);
          if (method === "readFileSync" && moduleReads.some((module) => file.startsWith(module))) return original(...args);
          throw new Error("Unexpected ambient " + method);
        };
      }
    }
    function restore() { for (const [object, method, original] of originals.splice(0)) object[method] = original; }
    let evidence, adapter, report, useCaseModule;
    guard();
    try {
      evidence = await import(vertical + "infrastructure/opencode-capability-evidence.js");
      adapter = await import(vertical + "infrastructure/opencode-capability-adapter.js");
      report = await import(vertical + "infrastructure/opencode-compatibility-report.js");
      useCaseModule = await import(vertical + "application/validate-profile-capability-use-case.js");
    } finally { restore(); }
    assert.equal(evidence.OPENCODE_PIN_CATALOG_EVIDENCE.length, 1);
    assert.equal(evidence.OPENCODE_PIN_CATALOG_EVIDENCE[0].resolvedModelIdentity, "openai/gpt-5.1");
    const query = new adapter.OpencodeCapabilityAdapter();
    const verdict = query.classify({ provider: "openai", model: "openai/gpt-5.1", transport: "@ai-sdk/openai", evidenceId: "x" }, "high");
    assert.equal(verdict.kind, "supported");
    assert.equal(report.OpencodeCompatibilityReport.prototype.compatibilityStatus.call(new report.OpencodeCompatibilityReport(), "9.9.9").status, "unverified");
    const resolver = { resolve: (pair) => pair.model === "openai/gpt-5.1" ? { provider: "openai", model: pair.model, transport: "@ai-sdk/openai", evidenceId: "e" } : null };
    const useCase = new useCaseModule.ValidateProfileCapabilityUseCase(query, resolver);
    const receipt = await useCase.validateAffectedPairs(
      [{ agent: "afg-review", model: "openai/gpt-5.1", effort: "high" }],
      { profileName: "work", acknowledgeUnknownEffort: false, storedAcknowledgements: [] },
    );
    assert.equal(receipt.outcomes[0].outcome, "supported");
    await assert.rejects(
      useCase.validateAffectedPairs(
        [{ agent: "afg-review", model: "openai/gpt-5.1", effort: "extreme" }],
        { profileName: "work", acknowledgeUnknownEffort: false, storedAcknowledgements: [] },
      ),
    );
  `], { encoding: "utf8" });
  try {
    // Non-zero status is the genuine child-failure gate; stderr must not carry
    // real error output, but incidental Node diagnostics (e.g. warnings) on an
    // otherwise successful run do not fail this check.
    expect(child.status).toBe(0);
    expect(child.stderr).not.toMatch(/AssertionError|Error:|Cannot find module/);
  } catch (error) {
    throw new Error(`emitted capability child failed: ${child.stderr || error}`);
  }
});
