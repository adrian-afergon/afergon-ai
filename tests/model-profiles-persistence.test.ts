import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadProfileDocument } from "../scripts/lib/model-profiles/infrastructure/profile-store.js";
import { validateProfileDocument } from "../scripts/lib/model-profiles/infrastructure/document-validation.js";
import { prepareProfileAssignment } from "../scripts/lib/model-profiles/infrastructure/prepare-assignment.js";
import * as profileCore from "../scripts/lib/model-profiles-core.js";
import * as documentValidation from "../scripts/lib/model-profiles/infrastructure/document-validation.js";

function prepare(document: Record<string, unknown>, patch: unknown, profileName = "work", agentName = "review") {
  return prepareProfileAssignment({ document, configPath: "/unused/config.json", profileName, agentName, patch: patch as never });
}

describe("pure preparation", () => {
  it("B2 rejects a string masquerading as a patch object", () => {
    const document = { models: { profiles: { work: { review: "old" } } } };
    expect(() => prepare(document, "new")).toThrow("Assignment patch must be an object");
  });
  it("B2 validates the complete independent candidate after preparation", () => {
    const validate = vi.spyOn(documentValidation, "validateProfileDocument");
    const document = { models: { profiles: { work: { review: "old" } } } };
    const prepared = prepare(document, { model: "new" });
    expect(validate.mock.calls.map(([candidate]) => candidate)).toEqual([document, prepared.document]);
    expect(prepared.document).not.toBe(document);
  });
  it("B3 characterization isolates foreign metadata and no-op clones both ways", () => {
    const document = { memo: ["root"], models: { metadata: ["models"], profiles: { work: { foreign: { nested: ["opaque"] }, review: {} }, other: { review: "inherit" } } } };
    const prepared = prepare(document, {});
    expect(prepared.document).toEqual(document);
    (prepared.document as typeof document).models.profiles.work.foreign.nested.push("candidate");
    document.memo.push("source");
    expect(document.models.profiles.work.foreign.nested).toEqual(["opaque"]);
    expect(prepared.document.memo).toEqual(["root"]);
    expect(prepared.changed).toBe(false);
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
  it("B2 source T2 ignores inherited and unknown patch fields", () => {
    const document = { models: { profiles: { work: { review: "old" } } } };
    const patch = Object.assign(Object.create({ model: "inherited", reasoningEffort: null }), { metadata: { forbidden: true } });
    const prepared = prepare(document, patch);
    expect(prepared.document).toEqual(document);
    expect([prepared.changed, prepared.migrationRequired, prepared.version]).toEqual([false, false, 1]);
  });
  it("B2 source T1 refuses future version even for an empty patch before clone", () => {
    const clone = vi.spyOn(profileCore, "cloneAssignments");
    const document = { version: 3, models: { profiles: { work: { review: "old" } } } };
    expect(() => prepare(document, {})).toThrow("unsupported profile version 3");
    expect(clone).not.toHaveBeenCalled();
  });
  it("B2 source rejects malformed inactive nontarget before clone", () => {
    const clone = vi.spyOn(profileCore, "cloneAssignments");
    const document = { models: { profiles: { work: { review: "old" }, inactive: { "afg-specify": { model: undefined } } } } };
    expect(() => prepare(document, { model: "new" })).toThrow('models.profiles.inactive["afg-specify"].model');
    expect(clone).not.toHaveBeenCalled();
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
  it("B1 varies the patch and preserves foreign fields and raw version", () => {
    const document = { version: 1, memo: ["root"], models: { activeProfile: "other", note: ["models"], profiles: { other: {}, work: { review: { model: "before", metadata: { labels: ["keep"] } }, foreign: { model: null } } } } };
    const prepared = prepare(document, { model: "different" });
    expect(prepared.document).toEqual({ ...document, models: { ...document.models, profiles: { ...document.models.profiles, work: { ...document.models.profiles.work, review: { model: "different", metadata: { labels: ["keep"] } } } } } });
    expect(document.models.profiles.work.review.model).toBe("before");
    expect([prepared.changed, prepared.migrationRequired, prepared.version]).toEqual([true, true, 2]);
  });
  it("B1 T2 adds effort to legacy while retaining its model", () => {
    const document = { models: { profiles: { work: { review: "old" } } } };
    expect(prepare(document, { reasoningEffort: "low" })).toEqual({
      document: { models: { profiles: { work: { review: { model: "old", reasoningEffort: "low" } } } } },
      changed: true, migrationRequired: true, version: 2, agentKey: "review",
    });
  });
  it("B1 T1 keeps a model-only legacy edit as a string", () => {
    const document = { models: { profiles: { work: { review: "old" } } } };
    expect(prepare(document, { model: "new" })).toEqual({
      document: { models: { profiles: { work: { review: "new" } } } },
      changed: true, migrationRequired: false, version: 1, agentKey: "review",
    });
  });
  it("B1 preserves omitted effort in a structured model edit", () => {
    const document = { models: { profiles: { work: { review: { reasoningEffort: "high" } } } } };
    expect(prepare(document, { model: "new" })).toEqual({
      document: { models: { profiles: { work: { review: { reasoningEffort: "high", model: "new" } } } } },
      changed: true, migrationRequired: true, version: 2, agentKey: "review",
    });
  });
});

const tempRoots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function createConfig(document?: unknown, contents = JSON.stringify(document)) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-profile-store-"));
  tempRoots.push(root);
  const configPath = path.join(root, "config.json");
  if (contents !== undefined) fs.writeFileSync(configPath, contents);
  return { root, configPath };
}

function loadDocument(document: unknown) {
  const { root } = createConfig(document);
  return loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });
}

function expectInvalidRead(document: unknown, expectedPath: string) {
  expect(() => loadDocument(document)).toThrow(expectedPath);
}

const invalidReads: Array<[string, unknown, string]> = [
  ["non-object root", [], "root value must be an object"],
  ["models container", { version: 1, models: null }, "models must be an object"],
  ["profiles container", { models: { profiles: [] } }, "models.profiles must be an object"],
  ["profile value", { models: { profiles: { work: null } } }, "models.profiles.work must be an object"],
  ["active profile shape", { models: { activeProfile: [], profiles: {} } }, "models.activeProfile must be a string or null"],
  ["dangling active profile", { models: { activeProfile: "missing", profiles: {} } }, "models.activeProfile 'missing' does not exist"],
  ["invalid version", { version: 0, models: { profiles: {} } }, "version must be a positive safe integer"],
  ["unsafe version", { version: Number.MAX_SAFE_INTEGER + 1, models: { profiles: {} } }, "version must be a positive safe integer"],
  ["escaped quote/backslash keys", { models: { profiles: { ['bad.name"\\folder']: { " afg-review ": { model: 1 } } } } }, `models.profiles[${JSON.stringify('bad.name"\\folder')}][${JSON.stringify(" afg-review ")}].model`],
  ["empty model", { models: { profiles: { work: { "afg-review": "" } } } }, 'models.profiles.work["afg-review"]'],
  ["structured model", { models: { profiles: { work: { "afg-review": { model: 42 } } } } }, 'models.profiles.work["afg-review"].model'],
  ["legacy assignment", { models: { profiles: { work: { "afg-review": 42 } } } }, 'models.profiles.work["afg-review"]'],
  ["null assignment", { models: { profiles: { work: { "afg-review": null } } } }, 'models.profiles.work["afg-review"]'],
  ["array assignment", { models: { profiles: { work: { "afg-review": [] } } } }, 'models.profiles.work["afg-review"]'],
];

const readableDocuments: Array<[string, Record<string, unknown>]> = [
  ["structured inheritance", { version: 1, models: { activeProfile: "work", profiles: { work: { "afg-specify": {} } } } }],
  ["future schema", { version: 3, models: { activeProfile: null, profiles: {} }, futureField: true }],
  ["legacy omitted containers", { version: 1, foreign: { retain: true } }],
  ["prototype-like profile and opaque foreign agent", JSON.parse('{"version":9007199254740991,"models":{"activeProfile":"__proto__","profiles":{"__proto__":{"afg-review":"inherit","constructor":{"model":null}}}}}')],
  ["structured model only", { version: 1, models: { profiles: { work: { "afg-review": { model: "openai/gpt-5.5" } } } } }],
];

async function importBuiltReader() {
  const entry = path.resolve(import.meta.dirname, "../dist/scripts/lib/model-profiles/infrastructure/profile-store.js");
  expect(fs.existsSync(entry)).toBe(true);
  return import(pathToFileURL(entry).href);
}

describe("mixed profile storage reads", () => {
  it("captures exact UTF-8 bytes and original formatting", () => {
    const contents = '{\n  "version": 1,\n  "memo": "café ☕",\n  "models": {"profiles": {}}\n}\n';
    const { root } = createConfig({}, contents);
    const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });

    expect(loaded.sourceBytes).toEqual(Buffer.from(contents, "utf8"));
    expect(loaded.originalBytes).toBe(contents);
  });

  it("propagates a permission read fault instead of returning missing-file defaults", () => {
    const { root, configPath } = createConfig({ models: { profiles: {} } });
    const failure = Object.assign(new Error("permission denied"), { code: "EACCES" });
    const readFileSync = fs.readFileSync.bind(fs);
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    vi.spyOn(fs, "readFileSync").mockImplementation((filePath, ...args) => {
      if (filePath === configPath) throw failure;
      return readFileSync(filePath, ...args);
    });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow(failure);
  });

  it("retains mixed raw assignments and does not rewrite or migrate", () => {
    const document = {
      version: 1,
      models: { activeProfile: "work", profiles: { work: {
        "afergon-ai": "openai/gpt-5.5",
        "afg-review": { reasoningEffort: "medium", note: { keep: true } },
        "afg-specify": {},
        "afg-implement": { model: " inherit ", reasoningEffort: " Medium " },
        "foreign-agent": { model: null, reasoningEffort: "inherit" },
      } } },
    };
    const originalBytes = `${JSON.stringify(document, null, 2)}\n`;
    const { root, configPath } = createConfig(document, originalBytes);
    const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });

    expect(loaded).toEqual({ document, configPath, exists: true, originalBytes, sourceBytes: Buffer.from(originalBytes) });
    expect(fs.readFileSync(configPath, "utf8")).toBe(originalBytes);
    expect(fs.existsSync(path.join(root, "config.json.pre-v2.bak"))).toBe(false);
  });

  it.each([null, "", "  ", " InHerit ", 4, []])("rejects invalid effort %j at its source path", (reasoningEffort) => {
    const { root } = createConfig({ models: { profiles: { work: { "afg-review": { reasoningEffort } } } } });
    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow(
      'models.profiles.work["afg-review"].reasoningEffort',
    );
  });

  it.each(readableDocuments)("preserves %s on read", (_name, document) => {
    expect(loadDocument(document).document).toEqual(document);
  });

  it.each(invalidReads)("rejects %s with the original path", (_name, document, expectedPath) => {
    expectInvalidRead(document, expectedPath);
  });

  it("returns absent-source defaults without creating a file", () => {
    const { root } = createConfig();
    const configDir = path.join(root, "not-created");
    const configPath = path.join(configDir, "config.json");
    const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: configDir });

    expect(loaded).toEqual({ document: { version: 1, models: { activeProfile: null, profiles: {} } }, configPath, exists: false });
    expect(fs.existsSync(configDir)).toBe(false);
  });
});

describe("pure document validation", () => {
  it("rejects own undefined recognized fields before cloning", () => {
    const ownUndefined = { models: { profiles: { work: { "afg-review": { reasoningEffort: undefined } } } } };
    expect(() => validateProfileDocument(ownUndefined, "/tmp/config.json")).toThrow(
      'models.profiles.work["afg-review"].reasoningEffort',
    );
  });

  it("validates malformed recognized assignments in inactive profiles", () => {
    const inactiveInvalid = { models: { activeProfile: "active", profiles: { active: {}, archived: { "afg-review": { model: " " } } } } };
    expect(() => validateProfileDocument(inactiveInvalid, "/tmp/config.json")).toThrow(
      'models.profiles.archived["afg-review"].model',
    );
  });

  it("returns the original object and leaves opaque foreign fields untouched", () => {
    const document = { version: 3, models: { profiles: { work: { foreign: { reasoningEffort: null }, "afg-review": "inherit" } } } };
    expect(validateProfileDocument(document, "/tmp/config.json")).toBe(document);
  });
});

describe("compiled inactive boundary", () => {
  it("emits a directly importable reader module", async () => {
    const built = await importBuiltReader();
    expect(typeof built.loadProfileDocument).toBe("function");
  });

  it("keeps a built missing-file read side-effect free", async () => {
    const built = await importBuiltReader();
    const { root, configPath } = createConfig();

    expect(built.loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root }).exists).toBe(false);
    expect(fs.existsSync(configPath)).toBe(false);
  });

  it("does not export the standalone reader through the live facade", async () => {
    const live = await import("../scripts/lib/model-profiles.js");
    expect(Object.hasOwn(live, "loadProfileDocument")).toBe(false);
  });
});
