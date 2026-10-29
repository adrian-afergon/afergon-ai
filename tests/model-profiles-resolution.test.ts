import { expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { ProfileAssignments, ProfileDesiredState } from "../scripts/lib/model-profiles/domain/profile-resolution.js";

const agents = new AgentTargetPolicy();

it("agents sharing a model resolve their own effort and source independently", () => {
  const assignments = ProfileAssignments.create(
    {
      review: { model: "openai/gpt-5.5", reasoningEffort: "low" },
      implement: { model: "openai/gpt-5.5", reasoningEffort: "high" },
    },
    "models.profiles[work]",
    agents,
  );
  const review = assignments.resolve("review");
  const implement = assignments.resolve("implement");
  expect(review.configuredEffort).toBe("low");
  expect(review.resolvedEffort).toBe("low");
  expect(review.effortSource).toBe("explicit");
  expect(review.resolvedModel).toBe("openai/gpt-5.5");
  expect(review.modelSource).toBe("explicit-model");
  expect(implement.configuredEffort).toBe("high");
  expect(implement.resolvedEffort).toBe("high");
  expect(implement.effortSource).toBe("explicit");
  expect(implement.resolvedModel).toBe("openai/gpt-5.5");
  expect(implement.modelSource).toBe("explicit-model");
});

it("inherited child model resolves through the main agent while effort stays local", () => {
  const assignments = ProfileAssignments.create(
    {
      "afergon-ai": { model: "openai/gpt-5.5" },
      review: { reasoningEffort: "low" },
    },
    "models.profiles[work]",
    agents,
  );
  const main = assignments.resolve("afergon-ai");
  const review = assignments.resolve("review");
  expect(main.modelSource).toBe("explicit-model");
  expect(main.resolvedModel).toBe("openai/gpt-5.5");
  expect(review.modelSource).toBe("implicit-inherit");
  expect(review.resolvedModel).toBe("openai/gpt-5.5");
  expect(review.configuredEffort).toBe("low");
  expect(review.effortSource).toBe("explicit");
});

it("legacy string assignments resolve as explicit model without effort override", () => {
  const assignments = ProfileAssignments.create(
    {
      "afergon-ai": "openai/gpt-5.5",
      review: "openai/gpt-5.5",
    },
    "models.profiles[work]",
    agents,
  );
  const main = assignments.resolve("afergon-ai");
  const review = assignments.resolve("review");
  expect(main.modelSource).toBe("explicit-model");
  expect(main.resolvedModel).toBe("openai/gpt-5.5");
  expect(main.configuredEffort).toBeNull();
  expect(main.effortSource).toBe("no-override");
  expect(review.modelSource).toBe("explicit-model");
  expect(review.resolvedModel).toBe("openai/gpt-5.5");
  expect(review.effortSource).toBe("no-override");
});

it("explicit inherit markers resolve through the main agent without parent effort", () => {
  const assignments = ProfileAssignments.create(
    {
      "afergon-ai": { model: "openai/gpt-5.5", reasoningEffort: "high" },
      review: "inherit",
      implement: { model: "inherit", reasoningEffort: "low" },
      specify: {},
    },
    "models.profiles[work]",
    agents,
  );
  const main = assignments.resolve("afergon-ai");
  const review = assignments.resolve("review");
  const implement = assignments.resolve("implement");
  const specify = assignments.resolve("specify");
  expect(main.modelSource).toBe("explicit-model");
  expect(main.configuredEffort).toBe("high");
  expect(review.modelSource).toBe("explicit-inherit");
  expect(review.configuredModel).toBe("inherit");
  expect(review.resolvedModel).toBe("openai/gpt-5.5");
  expect(review.configuredEffort).toBeNull();
  expect(review.effortSource).toBe("no-override");
  expect(implement.modelSource).toBe("explicit-inherit");
  expect(implement.resolvedModel).toBe("openai/gpt-5.5");
  expect(implement.configuredEffort).toBe("low");
  expect(specify.modelSource).toBe("implicit-inherit");
  expect(specify.resolvedModel).toBe("openai/gpt-5.5");
  expect(specify.configuredEffort).toBeNull();
});

it("inherit above the main agent resolves to runtime default without a model", () => {
  const assignments = ProfileAssignments.create(
    {
      "afergon-ai": "inherit",
      review: "inherit",
      implement: {},
    },
    "models.profiles[work]",
    agents,
  );
  const main = assignments.resolve("afergon-ai");
  const review = assignments.resolve("review");
  const implement = assignments.resolve("implement");
  expect(main.modelSource).toBe("explicit-inherit");
  expect(main.resolvedModel).toBeNull();
  expect(review.modelSource).toBe("explicit-inherit");
  expect(review.resolvedModel).toBeNull();
  expect(implement.modelSource).toBe("runtime-default");
  expect(implement.resolvedModel).toBeNull();
});

it("model-only edits replace the model and preserve effort and metadata", () => {
  const assignments = ProfileAssignments.create(
    {
      review: { model: "openai/gpt-5.5", reasoningEffort: "low", note: "keep" },
      implement: "legacy/model",
    },
    "models.profiles[work]",
    agents,
  );
  const next = assignments.withModel("review", "anthropic/claude-opus");
  const review = next.resolve("review");
  expect(review.resolvedModel).toBe("anthropic/claude-opus");
  expect(review.modelSource).toBe("explicit-model");
  expect(review.configuredEffort).toBe("low");
  expect(next.raw().review).toEqual({ model: "anthropic/claude-opus", reasoningEffort: "low", note: "keep" });
  const legacy = next.withModel("implement", "anthropic/claude-opus");
  expect(legacy.raw().implement).toBe("anthropic/claude-opus");
  expect(legacy.resolve("implement").resolvedModel).toBe("anthropic/claude-opus");
  expect(legacy.resolve("implement").effortSource).toBe("no-override");
});

it("model-only edits leave the source assignments untouched", () => {
  const assignments = ProfileAssignments.create(
    { review: { model: "openai/gpt-5.5", reasoningEffort: "low" } },
    "models.profiles[work]",
    agents,
  );
  const before = assignments.raw();
  assignments.withModel("review", "anthropic/claude-opus");
  expect(assignments.raw()).toEqual(before);
  expect(assignments.resolve("review").resolvedModel).toBe("openai/gpt-5.5");
});

it("model-only edits reject empty models without touching state", () => {
  const assignments = ProfileAssignments.create(
    { review: { model: "openai/gpt-5.5", reasoningEffort: "low" } },
    "models.profiles[work]",
    agents,
  );
  expect(() => assignments.withModel("review", " ")).toThrow("must be a nonempty model string");
  expect(assignments.resolve("review").resolvedModel).toBe("openai/gpt-5.5");
});

it("combined model and effort edits apply as one assignment operation", () => {
  const assignments = ProfileAssignments.create(
    { review: "legacy/model", implement: { model: "openai/gpt-5.5", reasoningEffort: "low", note: "keep" } },
    "models.profiles[work]",
    agents,
  );
  const fromLegacy = assignments.withAssignment("review", { model: "anthropic/claude-opus", reasoningEffort: "high" });
  expect(fromLegacy.raw().review).toEqual({ model: "anthropic/claude-opus", reasoningEffort: "high" });
  expect(fromLegacy.resolve("review").configuredEffort).toBe("high");
  const fromStructured = fromLegacy.withAssignment("implement", { model: "openai/gpt-5.4", reasoningEffort: "medium" });
  expect(fromStructured.raw().implement).toEqual({ model: "openai/gpt-5.4", reasoningEffort: "medium", note: "keep" });
});

it("combined edits reject null empty and inherit effort aliases without touching state", () => {
  const assignments = ProfileAssignments.create(
    { review: { model: "openai/gpt-5.5", reasoningEffort: "low" } },
    "models.profiles[work]",
    agents,
  );
  expect(() => assignments.withAssignment("review", { reasoningEffort: "inherit" })).toThrow(
    "reasoningEffort must be a nonempty explicit effort string",
  );
  expect(() => assignments.withAssignment("review", { reasoningEffort: "" })).toThrow(
    "reasoningEffort must be a nonempty explicit effort string",
  );
  expect(() => assignments.withAssignment("review", { model: "openai/gpt-5.5", reasoningEffort: undefined as unknown as string })).toThrow(
    "reasoningEffort must be a nonempty explicit effort string",
  );
  expect(assignments.raw().review).toEqual({ model: "openai/gpt-5.5", reasoningEffort: "low" });
});

it("clearing effort preserves the model assignment and removes only the effort override", () => {
  const assignments = ProfileAssignments.create(
    {
      review: { model: "openai/gpt-5.5", reasoningEffort: "low", note: "keep" },
      implement: { reasoningEffort: "high" },
      specify: "legacy/model",
      debate: { model: "openai/gpt-5.5" },
    },
    "models.profiles[work]",
    agents,
  );
  const cleared = assignments.withClearedEffort("review").withClearedEffort("implement");
  expect(cleared.raw().review).toEqual({ model: "openai/gpt-5.5", note: "keep" });
  expect(cleared.resolve("review").configuredEffort).toBeNull();
  expect(cleared.resolve("review").resolvedModel).toBe("openai/gpt-5.5");
  expect(cleared.raw().implement).toBeUndefined();
  expect(cleared.resolve("implement").effortSource).toBe("no-override");
  expect(cleared.raw().specify).toBe("legacy/model");
  expect(cleared.raw().debate).toEqual({ model: "openai/gpt-5.5" });
});

it("parent model edits collect the edited agent and changed inheriting children", () => {
  const assignments = ProfileAssignments.create(
    {
      "afergon-ai": { model: "openai/gpt-5.5", reasoningEffort: "high" },
      review: {},
      implement: { model: "openai/gpt-5.5", reasoningEffort: "low" },
      specify: { model: "other/model" },
    },
    "models.profiles[work]",
    agents,
  );
  const pairs = assignments.affectedPairsForModel("afergon-ai", "anthropic/claude-opus");
  expect(pairs).toEqual([
    { agent: "afergon-ai", model: "anthropic/claude-opus", effort: "high" },
    { agent: "afg-debate", model: "anthropic/claude-opus", effort: null },
    { agent: "afg-breakdown", model: "anthropic/claude-opus", effort: null },
    { agent: "afg-plannify", model: "anthropic/claude-opus", effort: null },
    { agent: "afg-review", model: "anthropic/claude-opus", effort: null },
    { agent: "afg-design", model: "anthropic/claude-opus", effort: null },
  ]);
});

it("model edits to inherit retain nullable runtime-default models in affected pairs", () => {
  const assignments = ProfileAssignments.create(
    {
      "afergon-ai": { model: "openai/gpt-5.5", reasoningEffort: "high" },
      review: { reasoningEffort: "low" },
    },
    "models.profiles[work]",
    agents,
  );
  const pairs = assignments.affectedPairsForModel("afergon-ai", "inherit");
  expect(pairs).toEqual([
    { agent: "afergon-ai", model: null, effort: "high" },
    { agent: "afg-debate", model: null, effort: null },
    { agent: "afg-breakdown", model: null, effort: null },
    { agent: "afg-specify", model: null, effort: null },
    { agent: "afg-plannify", model: null, effort: null },
    { agent: "afg-implement", model: null, effort: null },
    { agent: "afg-review", model: null, effort: "low" },
    { agent: "afg-design", model: null, effort: null },
  ]);
});

it("effort-only edits affect only the edited agent pair", () => {
  const assignments = ProfileAssignments.create(
    {
      "afergon-ai": { model: "openai/gpt-5.5" },
      review: { reasoningEffort: "low" },
    },
    "models.profiles[work]",
    agents,
  );
  const pairs = assignments.affectedPairs(assignments.withAssignment("review", { reasoningEffort: "high" }));
  expect(pairs).toEqual([{ agent: "afg-review", model: "openai/gpt-5.5", effort: "high" }]);
});

it("child model edits never propagate to siblings or the main agent", () => {
  const assignments = ProfileAssignments.create(
    {
      "afergon-ai": { model: "openai/gpt-5.5" },
      review: { model: "openai/gpt-5.5", reasoningEffort: "low" },
    },
    "models.profiles[work]",
    agents,
  );
  const pairs = assignments.affectedPairsForModel("review", "anthropic/claude-opus");
  expect(pairs).toEqual([{ agent: "afg-review", model: "anthropic/claude-opus", effort: "low" }]);
});

it("cleanup coverage satisfies alias keys and keeps desired effort overrides covering previous ones", () => {
  const previous = ProfileAssignments.create(
    { review: { model: "openai/gpt-5.5", reasoningEffort: "high" }, debate: "legacy/model" },
    "models.profiles[work]",
    agents,
  );
  const desired = ProfileAssignments.create(
    { "afg-review": { model: "openai/gpt-5.5", reasoningEffort: "high" }, debate: "legacy/model" },
    "models.profiles[next]",
    agents,
  );
  const coverage = previous.cleanupCoverageFor(desired);
  expect(coverage).toEqual([
    "afergon-ai",
    "afg-breakdown",
    "afg-specify",
    "afg-plannify",
    "afg-implement",
    "afg-design",
  ]);
});

it("model-only edits on inherited models preserve explicit effort and its provenance", () => {
  const assignments = ProfileAssignments.create(
    {
      "afergon-ai": { model: "openai/gpt-5.5" },
      review: { reasoningEffort: "low" },
      implement: "inherit",
    },
    "models.profiles[work]",
    agents,
  );
  const next = assignments.withModel("review", "anthropic/claude-opus");
  expect(next.raw().review).toEqual({ reasoningEffort: "low", model: "anthropic/claude-opus" });
  const review = next.resolve("review");
  expect(review.modelSource).toBe("explicit-model");
  expect(review.resolvedModel).toBe("anthropic/claude-opus");
  expect(review.configuredEffort).toBe("low");
  expect(review.effortSource).toBe("explicit");
  const legacyInherit = next.withModel("implement", "anthropic/claude-opus");
  expect(legacyInherit.raw().implement).toBe("anthropic/claude-opus");
  expect(legacyInherit.resolve("implement").modelSource).toBe("explicit-model");
});

it("null effort aliases are rejected with the exact field path", () => {
  const assignments = ProfileAssignments.create({ review: "openai/gpt-5.5" }, "models.profiles[work]", agents);
  expect(() => assignments.withAssignment("review", { reasoningEffort: null as unknown as string })).toThrow(
    "models.profiles[work][\"review\"].reasoningEffort must be a nonempty explicit effort string",
  );
  expect(assignments.raw().review).toBe("openai/gpt-5.5");
});

it("desired states distinguish active selections from intentional no-active emptiness", () => {
  const assignments = ProfileAssignments.create({ review: { model: "openai/gpt-5.5" } }, "models.profiles[work]", agents);
  const active = ProfileDesiredState.active("work", [{ agent: "review", value: { model: "openai/gpt-5.5" } }], []);
  const empty = ProfileDesiredState.noActive(["review"]);
  expect(active.kind).toBe("active");
  expect(active.profileName).toBe("work");
  expect(active.assignments).toEqual([{ agent: "review", value: { model: "openai/gpt-5.5" } }]);
  expect(empty.kind).toBe("no-active");
  expect(empty.profileName).toBeNull();
  expect(empty.assignments).toEqual([]);
  expect(empty.cleanupCoverage).toEqual(["review"]);
  expect(assignments.resolve("review").resolvedModel).toBe("openai/gpt-5.5");
});

it("malformed recognized assignments are refused with a field path while foreign keys stay verbatim", () => {  expect(() =>
    ProfileAssignments.create({ review: { reasoningEffort: "inherit" } }, "models.profiles[work]", agents),
  ).toThrow("models.profiles[work][\"review\"].reasoningEffort must be a nonempty explicit effort string");
  expect(() => ProfileAssignments.create({ review: 42 }, "models.profiles[work]", agents)).toThrow(
    "models.profiles[work][\"review\"] must be a model string or assignment object",
  );
  const foreign = ProfileAssignments.create(
    { "legacy-agent": { anything: "goes", reasoningEffort: "" }, review: { model: "openai/gpt-5.5" } },
    "models.profiles[work]",
    agents,
  );
  expect(foreign.raw()["legacy-agent"]).toEqual({ anything: "goes", reasoningEffort: "" });
  expect(foreign.resolve("review").resolvedModel).toBe("openai/gpt-5.5");
});

it("emitted resolution domain cold-imports without IO and resolves identically to source", () => {
  const vertical = new URL("../dist/scripts/lib/model-profiles/", import.meta.url).href;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from "node:assert/strict";
    import fs from "node:fs";
    const vertical = ${JSON.stringify(vertical)};
    const originals = [];
    const moduleReads = [
      vertical + "domain/profile-resolution.js",
      vertical + "domain/agent-target-policy.js",
      vertical + "domain/stored-assignment.js",
      vertical + "domain/unknown-effort-acknowledgement.js",
    ];
    function guard() {
      for (const [object, method] of [[fs, "readFileSync"], [fs, "writeFileSync"], [fs, "statSync"]]) {
        const original = object[method];
        originals.push([object, method, original]);
        object[method] = (...args) => {
          const file = String(args[0]);
          if (method === "readFileSync" && moduleReads.includes(file)) return original(...args);
          throw new Error("Unexpected ambient " + method);
        };
      }
    }
    function restore() { for (const [object, method, original] of originals.splice(0)) object[method] = original; }
    let module;
    guard();
    try {
      module = await import(vertical + "domain/profile-resolution.js");
    } finally { restore(); }
    assert.equal(typeof module.ProfileAssignments.create, "function");
    assert.equal(typeof module.ProfileDesiredState.noActive, "function");
    const { AgentTargetPolicy } = await import(vertical + "domain/agent-target-policy.js");
    const assignments = module.ProfileAssignments.create(
      { "afergon-ai": { model: "openai/gpt-5.5", reasoningEffort: "high" }, review: { reasoningEffort: "low" } },
      "models.profiles[work]",
      new AgentTargetPolicy(),
    );
    const review = assignments.resolve("review");
    assert.equal(review.modelSource, "implicit-inherit");
    assert.equal(review.resolvedModel, "openai/gpt-5.5");
    assert.equal(review.configuredEffort, "low");
    assert.equal(review.resolvedEffort, "low");
    assert.equal(review.effortSource, "explicit");
    const main = assignments.resolve("afergon-ai");
    assert.equal(main.configuredEffort, "high");
    assert.equal(main.resolvedEffort, "high");
    const pairs = assignments.affectedPairsForModel("afergon-ai", "anthropic/claude-opus");
    assert.equal(pairs.length, 8);
    assert.deepEqual(pairs[0], { agent: "afergon-ai", model: "anthropic/claude-opus", effort: "high" });
    assert.deepEqual(pairs[1], { agent: "afg-debate", model: "anthropic/claude-opus", effort: null });
    assert.deepEqual(pairs[6], { agent: "afg-review", model: "anthropic/claude-opus", effort: "low" });
  `], { encoding: "utf8" });
  try {
    expect(child.status).toBe(0);
    expect(child.stderr).toBe("");
  } catch (error) {
    throw new Error(`emitted resolution child failed: ${child.stderr || error}`);
  }
});

it("empty assignment patches preserve legacy strings without data loss", () => {
  const assignments = ProfileAssignments.create(
    { review: "openai/gpt-5.5", implement: { model: "other/model", reasoningEffort: "low" } },
    "models.profiles[work]",
    agents,
  );
  const next = assignments.withAssignment("review", {});
  expect(next.raw().review).toBe("openai/gpt-5.5");
  expect(next.resolve("review").resolvedModel).toBe("openai/gpt-5.5");
  const structured = assignments.withAssignment("implement", {});
  expect(structured.raw().implement).toEqual({ model: "other/model", reasoningEffort: "low" });
});

it("empty patches on absent agents create nothing and unknown-only patches edit nothing", () => {
  const assignments = ProfileAssignments.create({ review: "openai/gpt-5.5" }, "models.profiles[work]", agents);
  const untouched = assignments.withAssignment("debate", {});
  expect(untouched.raw()).toEqual({ review: "openai/gpt-5.5" });
  expect(untouched).toBe(assignments);
  const unknownOnly = assignments.withAssignment("review", { foreign: "x" } as unknown as { model?: string });
  expect(unknownOnly.raw().review).toBe("openai/gpt-5.5");
  expect(() => assignments.withAssignment("review", { model: undefined } as unknown as { model?: string })).toThrow(
    "models.profiles[work][\"review\"].model must be a nonempty model string",
  );
});

it("same-value model patches are no-ops that preserve legacy and structured bytes", () => {
  const assignments = ProfileAssignments.create(
    { review: "openai/gpt-5.5", implement: { model: "other/model", reasoningEffort: "low" } },
    "models.profiles[work]",
    agents,
  );
  const legacySame = assignments.withModel("review", "openai/gpt-5.5");
  expect(legacySame.raw().review).toBe("openai/gpt-5.5");
  const structuredSame = assignments.withAssignment("implement", { model: "other/model" });
  expect(structuredSame.raw().implement).toEqual({ model: "other/model", reasoningEffort: "low" });
});

it("cleanup coverage spans every supported agent plus prior verbatim identities", () => {
  const empty = ProfileAssignments.create({}, "models.profiles[empty]", agents);
  expect(empty.cleanupCoverageFor(ProfileAssignments.create({}, "models.profiles[next]", agents))).toEqual([
    "afergon-ai",
    "afg-debate",
    "afg-breakdown",
    "afg-specify",
    "afg-plannify",
    "afg-implement",
    "afg-review",
    "afg-design",
  ]);
  const previous = ProfileAssignments.create(
    {
      review: { model: "openai/gpt-5.5", reasoningEffort: "high" },
      debate: "legacy/model",
      "legacy-agent": { reasoningEffort: "low" },
    },
    "models.profiles[work]",
    agents,
  );
  const desired = ProfileAssignments.create({ review: { model: "openai/gpt-5.5" } }, "models.profiles[next]", agents);
  expect(previous.cleanupCoverageFor(desired)).toEqual([
    "afergon-ai",
    "afg-debate",
    "afg-breakdown",
    "afg-specify",
    "afg-plannify",
    "afg-implement",
    "afg-review",
    "afg-design",
    "legacy-agent",
  ]);
  const satisfied = ProfileAssignments.create(
    { review: { model: "openai/gpt-5.5", reasoningEffort: "high" }, debate: "legacy/model" },
    "models.profiles[work]",
    agents,
  );
  expect(satisfied.cleanupCoverageFor(satisfied)).toEqual([
    "afergon-ai",
    "afg-breakdown",
    "afg-specify",
    "afg-plannify",
    "afg-implement",
    "afg-design",
  ]);
});

it("cleanup coverage never adopts destination-only foreign identities", () => {
  const previous = ProfileAssignments.create({}, "models.profiles[empty]", agents);
  const desired = ProfileAssignments.create(
    { review: { model: "openai/gpt-5.5" }, "new-foreign": { metadata: "x" } },
    "models.profiles[next]",
    agents,
  );
  expect(previous.cleanupCoverageFor(desired)).toEqual([
    "afergon-ai",
    "afg-debate",
    "afg-breakdown",
    "afg-specify",
    "afg-plannify",
    "afg-implement",
    "afg-design",
  ]);
  const withPrior = ProfileAssignments.create({ "old-foreign": "x/model" }, "models.profiles[work]", agents);
  expect(withPrior.cleanupCoverageFor(desired)).toEqual([
    "afergon-ai",
    "afg-debate",
    "afg-breakdown",
    "afg-specify",
    "afg-plannify",
    "afg-implement",
    "afg-design",
    "old-foreign",
  ]);
});
