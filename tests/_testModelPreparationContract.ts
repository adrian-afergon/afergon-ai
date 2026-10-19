import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import type { PreparedAssignment } from "../scripts/lib/model-profiles/domain/profile-assignment-policy.js";
import type { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import type { RawProfileDocumentCloner } from "../scripts/lib/model-profiles/domain/raw-profile-document-cloner.js";
import fs from "node:fs";
import os from "node:os";
import childProcess from "node:child_process";
import { aliasCases, changingPatch, editCases, invalidPatchFields, missingContainers } from "./_testModelPreparationFixtures.js";
import { invalidReads } from "./_testModelRawFixtures.js";

export interface PreparationInvoker {
  prepare(document: unknown, patch: unknown, profileName?: string, agentName?: string): PreparedAssignment;
  validate: MockInstance<ProfileDocumentPolicy["validate"]>;
  clone: MockInstance<RawProfileDocumentCloner["clone"]>;
}

export function registerPreparationContract(label: string, createInvoker: () => PreparationInvoker) {
  describe(label, () => {
    let invocation: PreparationInvoker;
    beforeEach(() => { invocation = createInvoker(); });
    afterEach(() => { vi.restoreAllMocks(); });
    const prepare: PreparationInvoker["prepare"] = (...args) => invocation.prepare(...args);

    it.each([{ model: "same" }, { reasoningEffort: "medium" }])("identical captured command %j preserves raw shape and migration flags", patch => {
      const document = { models: { profiles: { work: { review: { ...patch, metadata: [1] } } } } };
      const prepared = prepare(document, patch);
      expect(prepared).toEqual({ document, changed: false, migrationRequired: false, version: 1, agentKey: "review" });
      expect(prepared.document).not.toBe(document);
    });
    it("B2 validates the complete independent candidate after preparation", () => {
      const document = { models: { profiles: { work: { review: "old" } } } };
      const prepared = prepare(document, { model: "new" });
      expect(invocation.validate.mock.calls).toEqual([[document, "/unused/config.json"], [prepared.document, "/unused/config.json"]]);
      expect(invocation.validate.mock.calls[0][0]).toBe(document);
      expect(prepared.document).not.toBe(document);
      expect(invocation.clone.mock.calls).toEqual([[document]]);
    });
    it("B3 characterization isolates foreign metadata and no-op clones both ways", () => {
      const document = { memo: ["root"], models: { metadata: ["models"], profiles: { work: { foreign: { nested: ["opaque"] }, review: {} }, other: { review: "inherit" } } } };
      const prepared = prepare(document, {});
      expect(invocation.validate).toHaveBeenCalledTimes(2);
      expect(prepared.document).toEqual(document);
      (prepared.document as typeof document).models.profiles.work.foreign.nested.push("candidate");
      document.memo.push("source");
      expect(document.models.profiles.work.foreign.nested).toEqual(["opaque"]);
      expect(prepared.document.memo).toEqual(["root"]);
      expect(prepared.changed).toBe(false);
    });
    it("B2 materialization T2 does not migrate a changed v2 assignment", () => {
      const document = { version: 2, models: { profiles: { work: { review: { model: "old" } } } } };
      const prepared = prepare(document, { model: "new" });
      expect([prepared.changed, prepared.migrationRequired, prepared.version, prepared.document.version]).toEqual([true, false, 2, 2]);
    });
    it("B2 materialization T1 leaves absent containers absent for an empty patch", () => {
      const prepared = prepare({}, {}, "new");
      expect(prepared.document).toEqual({});
      expect([prepared.changed, prepared.migrationRequired, prepared.version]).toEqual([false, false, 1]);
    });
    it("B2 materializes a missing profile only for a real patch", () => {
      const prepared = prepare({}, { reasoningEffort: "high" }, "new");
      expect(prepared.document).toEqual({ models: { profiles: { new: { "afg-review": { reasoningEffort: "high" } } } } });
      expect([prepared.changed, prepared.migrationRequired, prepared.version, prepared.agentKey]).toEqual([true, true, 2, "afg-review"]);
    });
    it.each(["constructor", "__proto__"])("materializes safe own profile %s without selecting it", profileName => {
      const document = { models: { activeProfile: null, profiles: {} } };
      const prepared = prepare(document, { model: "inherit" }, profileName);
      const models = prepared.document.models as { activeProfile: null; profiles: Record<string, unknown> };
      expect(Object.hasOwn(models.profiles, profileName)).toBe(true);
      expect(models.profiles[profileName]).toEqual({ "afg-review": { model: "inherit" } });
      expect(Object.getPrototypeOf(models.profiles)).toBe(Object.prototype);
      expect(models.activeProfile).toBeNull();
    });
    it("B1 varies the patch and preserves foreign fields and raw version", () => {
      const document = { version: 1, memo: ["root"], models: { activeProfile: "other", note: ["models"], profiles: { other: {}, work: { review: { model: "before", metadata: { labels: ["keep"] } }, foreign: { model: null } } } } };
      const { patch, reads } = changingPatch(true, { model: "different" });
      const prepared = prepare(document, patch);
      expect(prepared.document).toEqual({ ...document, models: { ...document.models, profiles: { ...document.models.profiles, work: { ...document.models.profiles.work, review: { model: "different", metadata: { labels: ["keep"] } } } } } });
      expect(document.models.profiles.work.review.model).toBe("before");
      expect([prepared.changed, prepared.migrationRequired, prepared.version]).toEqual([true, true, 2]);
      expect(reads).toEqual({ model: 1, reasoningEffort: 0 });
    });
    it.each(editCases)("preserves representation and flags: %s", (_name, stored, patch, expected, changed, migration) => {
      const document = { version: 1, memo: { keep: [1] }, models: { metadata: [2], activeProfile: "other", profiles: { other: {}, work: { review: structuredClone(stored), "afg-design": {}, foreign: { reasoningEffort: null } } } } };
      const prepared = prepare(document, structuredClone(patch));
      expect(prepared.document).toEqual({ ...document, models: { ...document.models, profiles: { ...document.models.profiles, work: { ...document.models.profiles.work, review: expected } } } });
      expect([prepared.changed, prepared.migrationRequired, prepared.version]).toEqual([changed, migration, migration ? 2 : 1]);
      expect(document.models.profiles.work.review).toEqual(stored);
    });
    it("B1 preserves omitted effort in a structured model edit", () => {
      const document = { models: { profiles: { work: { review: { reasoningEffort: "high" } } } } };
      expect(prepare(document, { model: "new" })).toEqual({
        document: { models: { profiles: { work: { review: { reasoningEffort: "high", model: "new" } } } } },
        changed: true, migrationRequired: true, version: 2, agentKey: "review",
      });
    });
    it("B1 T2 adds effort to legacy while retaining its model", () => {
      const document = { models: { profiles: { work: { review: "old" } } } };
      const { patch, reads } = changingPatch(true, { reasoningEffort: "low" });
      expect(prepare(document, patch)).toEqual({
        document: { models: { profiles: { work: { review: { model: "old", reasoningEffort: "low" } } } } },
        changed: true, migrationRequired: true, version: 2, agentKey: "review",
      });
      expect(reads).toEqual({ model: 0, reasoningEffort: 1 });
    });
    it("B1 T1 keeps a model-only legacy edit as a string", () => {
      const document = { models: { profiles: { work: { review: "old" } } } };
      expect(prepare(document, { model: "new" })).toEqual({
        document: { models: { profiles: { work: { review: "new" } } } },
        changed: true, migrationRequired: false, version: 1, agentKey: "review",
      });
    });
    it("identical mixed-v1 preparation stays independent without migration", () => {
      const document = { version: 1, foreign: { values: [1, 2] }, models: { profiles: { work: { review: { model: "old" } } } } };
      const prepared = prepare(document, { model: "old" });
      expect(prepared).toEqual({ document, changed: false, migrationRequired: false, version: 1, agentKey: "review" });
      (prepared.document.foreign as typeof document.foreign).values[0] = 3;
      document.foreign.values[1] = 4;
      expect(prepared.document.foreign).toEqual({ values: [3, 2] });
      expect(document.foreign).toEqual({ values: [1, 4] });
    });
    it("B2 rejects a string masquerading as a patch object", () => {
      const document = { models: { profiles: { work: { review: "old" } } } };
      expect(() => prepare(document, "new")).toThrow("Assignment patch must be an object");
    });
    it("B3 characterization isolates source from nested candidate mutation", () => {
      const document = { models: { profiles: { work: { review: { reasoningEffort: "high", metadata: { labels: ["source"] } } } } } };
      const prepared = prepare(document, { model: "new" });
      const assignment = (prepared.document as typeof document).models.profiles.work.review;
      assignment.metadata.labels.push("candidate");
      assignment.reasoningEffort = "low";
      expect(document.models.profiles.work.review).toEqual({ reasoningEffort: "high", metadata: { labels: ["source"] } });
    });
    it("B3 isolates nested candidate data from later source mutations", () => {
      const document = { models: { profiles: { work: { review: { reasoningEffort: "high", metadata: { labels: ["source"] } } } } } };
      const prepared = prepare(document, { model: "new" });
      document.models.profiles.work.review.metadata.labels.push("changed");
      document.models.profiles.work.review.reasoningEffort = "low";
      expect(prepared.document).toEqual({ models: { profiles: { work: { review: { model: "new", reasoningEffort: "high", metadata: { labels: ["source"] } } } } } });
    });
    it("B2 source T2 ignores inherited and unknown patch fields", () => {
      const document = { models: { profiles: { work: { review: "old" } } } };
      const patch = Object.assign(Object.create({ model: "inherited", reasoningEffort: null }), { metadata: { forbidden: true } });
      const prepared = prepare(document, patch);
      expect(prepared.document).toEqual(document);
      expect([prepared.changed, prepared.migrationRequired, prepared.version]).toEqual([false, false, 1]);
    });
    it("B2 source T1 refuses future version even for an empty patch before clone", () => {
      const document = { version: 3, models: { profiles: { work: { review: "old" } } } };
      expect(() => prepare(document, {})).toThrow("unsupported profile version 3");
      expect(invocation.clone).not.toHaveBeenCalled();
    });
    it("B2 source rejects malformed inactive nontarget before clone", () => {
      const document = { models: { profiles: { work: { review: "old" }, inactive: { "afg-specify": { model: undefined } } } } };
      expect(() => prepare(document, { model: "new" })).toThrow('models.profiles.inactive["afg-specify"].model');
      expect(invocation.clone).not.toHaveBeenCalled();
    });
    it("B2 T2 refuses ambiguous aliases without an exact key", () => {
      const document = { models: { profiles: { work: { review: "old", "afg-review": "other" } } } };
      expect(() => prepare(document, { model: "new" }, "work", "AFG-REVIEW")).toThrow("Ambiguous assignment aliases");
    });
    it("B2 T1 diagnoses the sole alias using the actual stored review key", () => {
      const document = { models: { profiles: { work: { review: "old" } } } };
      expect(() => prepare(document, { reasoningEffort: "inherit" }, "work", "afg-review")).toThrow('models.profiles["work"]["review"].reasoningEffort');
    });
    it("B2 rejects invalid patch at the exact noncanonical stored target", () => {
      const document = { models: { profiles: { work: { review: "old", "afg-review": "other" } } } };
      expect(() => prepare(document, { model: " " })).toThrow('models.profiles["work"]["review"].model');
    });
    it.each(missingContainers)("keeps missing-target empty patch raw: %j", raw => {
      const document = structuredClone(raw);
      const prepared = prepare(document, {}, "missing");
      expect(prepared.document).toEqual(document);
      expect([prepared.changed, prepared.migrationRequired, prepared.version]).toEqual([false, false, 1]);
    });
    it.each(["__proto__", "constructor"])("edits existing own profile %s retaining active selection", profileName => {
      const document = JSON.parse(`{"models":{"activeProfile":"other","profiles":{"other":{},"${profileName}":{"review":{"metadata":[1]}}}}}`);
      const prepared = prepare(document, { model: "new" }, profileName);
      expect(prepared.document).toEqual({ models: { activeProfile: "other", profiles: { other: {}, [profileName]: { review: { metadata: [1], model: "new" } } } } });
      expect(Object.getPrototypeOf((prepared.document.models as typeof document.models).profiles)).toBe(Object.prototype);
    });
    it.each(aliasCases)("selects %s without rewriting unrelated slots", (_name, raw, agentName, key) => {
      const profile = structuredClone(raw);
      const prepared = prepare({ models: { profiles: { work: profile } } }, { model: "new" }, "work", agentName);
      expect(prepared.agentKey).toBe(key);
      expect(prepared.document.models).toEqual({ profiles: { work: { ...profile, [key]: key in profile ? "new" : { model: "new" } } } });
    });
    it("rejects unsupported agents before clone", () => {
      expect(() => prepare({}, {}, "work", "foreign")).toThrow("Unsupported agent 'foreign'");
      expect(invocation.clone).not.toHaveBeenCalled();
    });
    it("performs no filesystem environment-path or host calls", () => {
      const spies = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"),
        vi.spyOn(fs, "openSync"), vi.spyOn(fs, "renameSync"), vi.spyOn(os, "homedir"),
        vi.spyOn(childProcess, "spawnSync"), vi.spyOn(childProcess, "execFileSync")];
      prepare({}, { model: "inherit" });
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    });
    it.each(invalidPatchFields)("rejects own %s before clone", (_name, field, rawValue) => {
      const value = structuredClone(rawValue);
      const document = { models: { profiles: { work: { review: "old" } } } };
      expect(() => prepare(document, { [field]: value })).toThrow(`models.profiles["work"]["review"].${field}`);
      const malformedSource = { models: { profiles: { work: { review: "old" }, other: { review: { [field]: value } } } } };
      expect(() => prepare(malformedSource, {})).toThrow(`models.profiles.other.review.${field}`);
      expect(invocation.clone).not.toHaveBeenCalled();
    });
    it.each(invalidReads)("validates whole raw source: %s", (_name, raw, expectedPath) => {
      expect(() => prepare(structuredClone(raw), {})).toThrow(expectedPath);
      expect(invocation.clone).not.toHaveBeenCalled();
    });
    it.each([null, undefined, [], 4])("rejects non-object patch %j before clone", patch => {
      expect(() => prepare({}, structuredClone(patch))).toThrow("Assignment patch must be an object");
      expect(invocation.clone).not.toHaveBeenCalled();
    });
    it.each([{}, { model: "new" }])("validates nontarget fields in the entire final candidate for %j", patch => {
      invocation.clone.mockImplementationOnce(raw => ({ ...raw, models: { profiles: { work: { review: "old" }, other: { review: { model: null } } } } }));
      expect(() => prepare({}, patch)).toThrow("models.profiles.other.review.model");
      expect(invocation.validate).toHaveBeenCalledTimes(2);
    });
  });
}
