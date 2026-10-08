import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import childProcess from "node:child_process";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadProfileDocument, updateProfileAssignment } from "../scripts/lib/model-profiles/infrastructure/profile-store.js";
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

const invalidFieldValues: Array<[string, unknown]> = [
  ["undefined", undefined], ["null", null], ["array", []], ["number", 7], ["empty", ""], ["whitespace", " \t"],
];
const invalidPatchFields = ["model", "reasoningEffort"].flatMap(field =>
  invalidFieldValues.map(([name, value]) => [`${field} ${name}`, field, value] as const),
).concat(["inherit", " InHerit ", "INHERIT"].map(value => [`reasoningEffort ${value}`, "reasoningEffort", value] as const));

describe("preparation reuse characterizations", () => {
  it.each([{}, { models: {} }, { models: { profiles: {} } }, { version: 1, models: { activeProfile: null, profiles: {} } }])("keeps missing-target empty patch raw: %j", document => {
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
  const editCases: Array<[string, unknown, object, unknown, boolean, boolean]> = [
    ["legacy edit amid structured slots", "old", { model: "new" }, "new", true, false],
    ["identical legacy", "old", { model: "old" }, "old", false, false],
    ["identical mixed-v1 structured", { model: "old" }, { model: "old" }, { model: "old" }, false, false],
    ["structured model without effort", { model: "old" }, { model: "new" }, { model: "new" }, true, true],
    ["effort preserves absent model", {}, { reasoningEffort: " Medium " }, { reasoningEffort: " Medium " }, true, true],
    ["effort preserves present model", { model: " InHerit " }, { reasoningEffort: "low" }, { model: " InHerit ", reasoningEffort: "low" }, true, true],
    ["model preserves absent effort", {}, { model: "inherit" }, { model: "inherit" }, true, true],
    ["both known fields ignore foreign patch", {}, { model: "x", reasoningEffort: "high", foreign: 9 }, { model: "x", reasoningEffort: "high" }, true, true],
  ];
  it.each(editCases)("preserves representation and flags: %s", (_name, stored, patch, expected, changed, migration) => {
    const document = { version: 1, memo: { keep: [1] }, models: { metadata: [2], activeProfile: "other", profiles: { other: {}, work: { review: stored, "afg-design": {}, foreign: { reasoningEffort: null } } } } };
    const prepared = prepare(document, patch);
    expect(prepared.document).toEqual({ ...document, models: { ...document.models, profiles: { ...document.models.profiles, work: { ...document.models.profiles.work, review: expected } } } });
    expect([prepared.changed, prepared.migrationRequired, prepared.version]).toEqual([changed, migration, migration ? 2 : 1]);
    expect(document.models.profiles.work.review).toEqual(stored);
  });
  it.each(["__proto__", "constructor"])("materializes safe own profile %s without selecting it", profileName => {
    const document = { models: { activeProfile: null, profiles: {} } };
    const prepared = prepare(document, { model: "inherit" }, profileName);
    const models = prepared.document.models as { activeProfile: null; profiles: Record<string, unknown> };
    expect(Object.hasOwn(models.profiles, profileName)).toBe(true);
    expect(models.profiles[profileName]).toEqual({ "afg-review": { model: "inherit" } });
    expect(Object.getPrototypeOf(models.profiles)).toBe(Object.prototype);
    expect(models.activeProfile).toBeNull();
  });
  it.each([
    ["exact duplicate", { review: "old", "afg-review": "other" }, "review", "review"],
    ["sole alias", { review: "old" }, "afg-review", "review"],
    ["canonical new", { foreign: { model: null } }, "REVIEW", "afg-review"],
  ] as const)("selects %s without rewriting unrelated slots", (_name, profile, agentName, key) => {
    const prepared = prepare({ models: { profiles: { work: profile } } }, { model: "new" }, "work", agentName);
    expect(prepared.agentKey).toBe(key);
    expect(prepared.document.models).toEqual({ profiles: { work: { ...profile, [key]: key in profile ? "new" : { model: "new" } } } });
  });
  it("rejects unsupported agents before clone", () => {
    const clone = vi.spyOn(profileCore, "cloneAssignments");
    expect(() => prepare({}, {}, "work", "foreign")).toThrow("Unsupported agent 'foreign'");
    expect(clone).not.toHaveBeenCalled();
  });
  it("performs no filesystem environment-path or host calls", () => {
    const spies = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"),
      vi.spyOn(fs, "openSync"), vi.spyOn(fs, "renameSync"), vi.spyOn(os, "homedir"),
      vi.spyOn(childProcess, "spawnSync"), vi.spyOn(childProcess, "execFileSync")];
    prepare({}, { model: "inherit" });
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
  it.each(invalidPatchFields)("rejects own %s before clone", (_name, field, value) => {
    const clone = vi.spyOn(profileCore, "cloneAssignments");
    const document = { models: { profiles: { work: { review: "old" } } } };
    expect(() => prepare(document, { [field]: value })).toThrow(`models.profiles["work"]["review"].${field}`);
    const malformedSource = { models: { profiles: { work: { review: "old" }, other: { review: { [field]: value } } } } };
    expect(() => prepare(malformedSource, {})).toThrow(`models.profiles.other.review.${field}`);
    expect(clone).not.toHaveBeenCalled();
  });
  it.each(invalidReads)("validates whole raw source: %s", (_name, document, expectedPath) => {
    const clone = vi.spyOn(profileCore, "cloneAssignments");
    expect(() => prepare(document as Record<string, unknown>, {})).toThrow(expectedPath);
    expect(clone).not.toHaveBeenCalled();
  });
  it.each([null, undefined, [], 4])("rejects non-object patch %j before clone", patch => {
    const clone = vi.spyOn(profileCore, "cloneAssignments");
    expect(() => prepare({}, patch)).toThrow("Assignment patch must be an object");
    expect(clone).not.toHaveBeenCalled();
  });
});

describe("C snapshot lifecycle", () => {
  it.skipIf(process.platform === "win32").each([
    ["C mode creates a private snapshot from a 0600 source under umask022", false, false],
    ["C mode T1 creates a private absent-source default snapshot", true, false],
    ["C mode T2 preserves a completed existing backup mode0640", false, true],
  ] as const)("%s", (_name, absent, previous) => {
    const fixture = snapshotFixture("{}", absent), mask = process.umask(0o022);
    try {
      if (!absent) fs.chmodSync(fixture.source.configPath, 0o600);
      if (previous) fs.writeFileSync(fixture.backup, fixture.source.sourceBytes!, { mode: 0o640 });
      acquireMigrationSnapshot(fixture.input);
      expect(fs.statSync(fixture.backup).mode & 0o777).toBe(previous ? 0o640 : 0o600);
      if (!absent) expect(fs.statSync(fixture.source.configPath).mode & 0o777).toBe(0o600);
      fixture.unchanged();
    } finally { process.umask(mask); }
  });
  const cleanupFaults: Array<[string, "remove" | "close" | "both"]> = [
    ["C cleanup removal failure reports original and cleanup errors", "remove"],
    ["C cleanup T1 close failure still attempts owned removal", "close"],
    ["C cleanup T2 retains simultaneous close and removal errors", "both"],
  ];
  it.each(cleanupFaults)("%s", (_name, stage) => {
    const fixture = snapshotFixture(), cleanup = new Error(`cleanup ${stage}`);
    const originals = { rmSync: fs.rmSync.bind(fs), closeSync: fs.closeSync.bind(fs) };
    const fault = snapshotFault(fixture.backup, "write");
    const methods = stage === "both" ? ["rmSync", "closeSync"] as const : [stage === "remove" ? "rmSync" : "closeSync"] as const;
    for (const method of methods) vi.spyOn(fs, method).mockImplementation((target, ...args) => {
      if (target === (method === "rmSync" ? fixture.backup : fault.descriptor())) throw cleanup;
      return (originals[method] as (...args: unknown[]) => never)(target, ...args);
    });
    let failure: unknown;
    try { acquireMigrationSnapshot(fixture.input); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(AggregateError);
    expect((failure as AggregateError).errors).toEqual([fault.failure, stage === "both" ? expect.objectContaining({ errors: [cleanup, cleanup] }) : cleanup]);
    fixture.unchanged(stage !== "close", Buffer.from("{"));
    vi.restoreAllMocks(); if (stage !== "remove") fs.closeSync(fault.descriptor()!);
  });
  const backupFaults: Array<[string, SnapshotFaultStage, boolean?]> = [
    ["C3 write failure cleans only its newly created partial", "write"],
    ["C3 T1 fsync failure cleans its incomplete snapshot", "fsync"],
    ["C3 T2 close failure cleans its incomplete snapshot", "close"],
    ["C open fault leaves source and no owned backup", "open"],
    ["C open fault preserves previous valid backup", "open", true],
    ["C existing backup read fault preserves previous valid backup", "read", true],
    ["C source permission fault propagates instead of absence", "sourceRead", true],
  ];
  it.each(backupFaults)("%s", (_name, stage, previous = false) => {
    const fixture = snapshotFixture();
    if (previous) fs.writeFileSync(fixture.backup, fixture.source.sourceBytes!);
    const fault = snapshotFault(fixture.backup, stage);
    expect(() => acquireMigrationSnapshot(fixture.input)).toThrow(fault.failure);
    expect(fault.closeAttempts()).toBeGreaterThanOrEqual(["write", "fsync", "close"].includes(stage) ? 1 : 0);
    vi.restoreAllMocks();
    fixture.unchanged(previous);
    expect(acquireMigrationSnapshot(fixture.input).disposition).toBe(previous ? "reused" : "created");
    fixture.unchanged();
  });
  it.each([
    ["C absent T2 refuses contradictory captured bytes", true, Buffer.from("{}")],
    ["C observation requires captured Buffer before mkdir", false, undefined],
    ["C observation characterization refuses non-Buffer bytes", false, new Uint8Array([123, 125]) as never],
  ] as const)("%s", (_name, absent, sourceBytes) => {
    const fixture = snapshotFixture("{}", absent);
    fixture.source.sourceBytes = sourceBytes;
    const mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => acquireMigrationSnapshot(fixture.input)).toThrow("Invalid source observation");
    expect(mkdir).not.toHaveBeenCalled();
    expect(() => assertProfileSourceUnchanged(fixture.source)).toThrow("Invalid source observation");
  });
  const snapshotRefusals: Array<[string, string | undefined, Record<string, unknown> | undefined, string | typeof SyntaxError, string?, boolean?]> = [
    ["C2 T1 refuses valid but byte-different backup", "{ }", undefined, "Migration snapshot bytes do not match"],
    ["C2 T2 refuses malformed partial backup without deleting it", "{", undefined, SyntaxError],
    ["C2 rejects invalid known backup shape with its path", '{"models":null}', undefined, "models must be an object"],
    ["C recovery rejects malformed known fields before mkdir", undefined, { models: null }, "models must be an object"],
    ["C recovery T1 refuses structurally different recovery", undefined, { memo: "unexpected" }, "Recovery document does not match"],
    ["C recovery T2 refuses matching future schema before mkdir", undefined, { version: 3 }, "unsupported profile version 3", '{"version":3}'],
    ["C absent T1 refuses nondefault recovery before mkdir", undefined, {}, "Recovery document does not match", undefined, true],
    ...invalidReads.map(([name, document, error]) => [`C validation reuse ${name}`, undefined, document as Record<string, unknown>, error] as [string, undefined, Record<string, unknown>, string]),
  ];
  it.each(snapshotRefusals)("%s", (_name, backupBytes, recoveryDocument, error, contents, absent = false) => {
    const fixture = snapshotFixture(contents, absent);
    if (backupBytes !== undefined) fs.writeFileSync(fixture.backup, backupBytes);
    const mkdir = vi.spyOn(fs, "mkdirSync"), open = vi.spyOn(fs, "openSync");
    expect(() => acquireMigrationSnapshot({ ...fixture.input, recoveryDocument: recoveryDocument ?? fixture.input.recoveryDocument })).toThrow(error);
    if (backupBytes === undefined) for (const spy of [mkdir, open]) expect(spy).not.toHaveBeenCalled();
    if (!absent) expect(fs.readFileSync(fixture.source.configPath, "utf8")).toBe(contents ?? "{}");
    else expect(fs.existsSync(path.dirname(fixture.backup))).toBe(false);
    if (backupBytes !== undefined) expect(fs.readFileSync(fixture.backup, "utf8")).toBe(backupBytes);
    else expect(fs.existsSync(fixture.backup)).toBe(false);
    if (backupBytes !== undefined) fixture.unchanged(true, Buffer.from(backupBytes));
  });
  const completedSnapshots: Array<[string, string, Record<string, unknown>?, boolean?, boolean?]> = [
    ["C1 creates an exact durable snapshot without replacing source", "{}"],
    ["C1 retains formatted multibyte source instead of reserialization", '{\n "memo": "café ☕", "version": 1\n}\n', { version: 1, memo: "café ☕" }],
    ["C absent source creates only a recoverable default snapshot", "{}", { models: { profiles: {}, activeProfile: null }, version: 1 }, true],
    ["C2 reuses a completed exact backup without writing or deleting", "{}", undefined, false, true],
  ];
  it.each(completedSnapshots)("%s", (_name, contents, recoveryDocument, absent = false, previous = false) => {
    const fixture = snapshotFixture(contents, absent), defaultBytes = `${JSON.stringify(fixture.input.recoveryDocument, null, 2)}\n`;
    fixture.input.recoveryDocument = recoveryDocument ?? fixture.input.recoveryDocument;
    if (previous) fs.writeFileSync(fixture.backup, fixture.source.sourceBytes!);
    const sync = vi.spyOn(fs, "fsyncSync"), write = vi.spyOn(fs, "writeFileSync"), remove = vi.spyOn(fs, "rmSync");
    expect(acquireMigrationSnapshot(fixture.input)).toEqual({ snapshotPath: fixture.backup, disposition: previous ? "reused" : "created", complete: true });
    expect(JSON.parse(fs.readFileSync(fixture.backup, "utf8"))).toEqual(fixture.input.recoveryDocument);
    expect(sync).toHaveBeenCalledTimes(previous ? 0 : 1);
    if (previous) for (const spy of [write, remove]) expect(spy).not.toHaveBeenCalled();
    if (absent) expect(fs.readFileSync(fixture.backup, "utf8")).toBe(defaultBytes);
    if (absent) expect(acquireMigrationSnapshot(fixture.input).disposition).toBe("reused");
    fixture.unchanged();
  });
  const sourceConflicts: Array<[string, boolean, string | null, boolean?]> = [
    ["C1 T1 refuses changed observed bytes before acquisition", false, "{ }"],
    ["C1 T2 refuses a source appearing after absent observation", true, "{}"],
    ["C source deletion fails closed with conflict diagnostic", false, null],
    ["C timing rechecks changed bytes after preflight before open", false, "{ }", true],
    ["C timing rechecks newly appeared source before open", true, "{}", true],
  ];
  it.each(sourceConflicts)("%s", (_name, absent, current, duringMkdir = false) => {
    const fixture = snapshotFixture("{}", absent);
    fs.mkdirSync(path.dirname(fixture.source.configPath), { recursive: true });
    const change = () => current === null ? fs.unlinkSync(fixture.source.configPath) : fs.writeFileSync(fixture.source.configPath, current);
    const mkdir = fs.mkdirSync.bind(fs);
    if (duringMkdir) vi.spyOn(fs, "mkdirSync").mockImplementation((dir, ...args) => { change(); return mkdir(dir, ...args); });
    else change();
    if (!duringMkdir) expect(() => assertProfileSourceUnchanged(fixture.source)).toThrow("Profile source changed");
    expect(() => acquireMigrationSnapshot(fixture.input)).toThrow("Profile source changed");
    if (current !== null) expect(fs.readFileSync(fixture.source.configPath, "utf8")).toBe(current);
    else expect(fs.existsSync(fixture.source.configPath)).toBe(false);
    expect(fs.existsSync(fixture.backup)).toBe(false);
  });
});

import { acquireMigrationSnapshot, assertProfileSourceUnchanged } from "../scripts/lib/model-profiles/infrastructure/migration-snapshot.js";

function snapshotFixture(contents = "{}", absent = false) {
  const { root } = createConfig();
  const configDir = path.join(root, "isolated");
  if (!absent) { fs.mkdirSync(configDir); fs.writeFileSync(path.join(configDir, "config.json"), contents); }
  const source = loadProfileDocument({ HOME: root, XDG_CONFIG_HOME: root, AFERGON_AI_CONFIG_DIR: configDir });
  const backup = `${source.configPath}.pre-v2.bak`;
  const unchanged = (snapshotExists = true, snapshotBytes = source.sourceBytes ?? Buffer.from(`${JSON.stringify(source.document, null, 2)}\n`)) => {
    expect(fs.existsSync(source.configPath)).toBe(!absent);
    if (!absent) expect(fs.readFileSync(source.configPath)).toEqual(Buffer.from(contents));
    if (snapshotExists) expect(fs.readFileSync(backup)).toEqual(snapshotBytes);
    expect(fs.readdirSync(configDir)).toEqual([...(absent ? [] : ["config.json"]), ...(snapshotExists ? ["config.json.pre-v2.bak"] : [])]);
  };
  return { root, source, backup, input: { source, recoveryDocument: source.document }, unchanged };
}

type SnapshotFaultStage = "write" | "fsync" | "close" | "open" | "read" | "sourceRead";
function snapshotFault(backup: string, stage: SnapshotFaultStage) {
  const failure = new Error(`backup ${stage} fault`), open = fs.openSync.bind(fs), close = fs.closeSync.bind(fs);
  let descriptor: number | undefined, closes = 0;
  vi.spyOn(fs, "openSync").mockImplementation((file, flags, ...args) => {
    if (file === backup && flags === "wx" && stage === "open") throw failure;
    const fd = open(file, flags, ...args);
    if (file === backup && flags === "wx") descriptor = fd;
    return fd;
  });
  vi.spyOn(fs, "closeSync").mockImplementation(fd => {
    if (fd === descriptor && ++closes === 1 && stage === "close") throw failure;
    return close(fd);
  });
  const method = stage === "write" ? "writeFileSync" : stage === "fsync" ? "fsyncSync" : "readFileSync", original = fs[method].bind(fs);
  if (!["open", "close"].includes(stage)) vi.spyOn(fs, method).mockImplementation((target, ...args) => {
    const faultTarget = stage === "read" ? backup : stage === "sourceRead" ? backup.slice(0, -".pre-v2.bak".length) : descriptor;
    if (target === faultTarget) { if (stage === "write") fs.writeSync(descriptor!, "{"); throw failure; }
    return (original as (...args: unknown[]) => never)(target, ...args);
  });
  return { failure, closeAttempts: () => closes, descriptor: () => descriptor };
}

describe("D bounded persistence", () => {
  it.each(invalidPatchFields)("D1 integrated invalid patch %s never writes or calls host", (_name, field, value) => {
    const fixture = snapshotFixture('{"models":{"profiles":{"work":{"review":"old"}}}}');
    const spies = [vi.spyOn(profileConfig, "saveConfig"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(childProcess, "spawnSync"), vi.spyOn(childProcess, "execFileSync")];
    expect(() => updateProfileAssignment("work", "review", { [field]: value }, { env: writerEnv(fixture) })).toThrow();
    for (const spy of spies) expect(spy).not.toHaveBeenCalled(); fixture.unchanged(false);
  });
  it.each(['{', '{"models":{"profiles":{"other":{"review":{"reasoningEffort":null}}}}}'])("D1 corrupt or nontarget invalid source %s never writes", bytes => {
    const fixture = snapshotFixture('{}'); fs.writeFileSync(fixture.source.configPath, bytes);
    const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => updateProfileAssignment("work", "review", { model: "new" }, { env: writerEnv(fixture) })).toThrow();
    for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled(); expect(fs.readFileSync(fixture.source.configPath, "utf8")).toBe(bytes);
    expect(fs.readdirSync(path.dirname(fixture.backup))).toEqual(["config.json"]);
  });
  it("D1 explicit mixed v1 identical effort preserves exact schema and bytes", () => {
    const fixture = snapshotFixture('{ "version":1,"models":{"profiles":{"work":{"review":{"reasoningEffort":"high"},"afg-specify":"inherit"}}}}');
    expect(updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toEqual({ configPath: fixture.source.configPath, version: 1 });
    fixture.unchanged(false);
  });
  it("D2 v2 rechecks after pure final validation before actual saver", () => {
    const fixture = snapshotFixture('{"version":2}'), validate = documentValidation.validateProfileDocument; let calls = 0;
    vi.spyOn(documentValidation, "validateProfileDocument").mockImplementation((document, configPath) => {
      const result = validate(document, configPath); if (++calls === 5) fs.writeFileSync(fixture.source.configPath, '{"external":true}'); return result;
    });
    const save = vi.spyOn(profileConfig, "saveConfig");
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow("Profile source changed");
    expect(save).not.toHaveBeenCalled(); expect(fs.readFileSync(fixture.source.configPath, "utf8")).toBe('{"external":true}'); expect(fs.existsSync(fixture.backup)).toBe(false);
  });
  it("D3 cleanup failure keeps original precommit error without false temp guarantee", () => {
    const fixture = snapshotFixture('{}'), failure = configFault("rename"), remove = fs.rmSync.bind(fs);
    vi.spyOn(fs, "rmSync").mockImplementation((file, options) => { if (String(file).endsWith(".tmp")) throw new Error("cleanup fault"); return remove(file, options); });
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow(failure);
    expect(fs.readFileSync(fixture.source.configPath)).toEqual(fixture.source.sourceBytes); expect(fs.readFileSync(fixture.backup)).toEqual(fixture.source.sourceBytes);
    expect(fs.readdirSync(path.dirname(fixture.backup)).filter(file => file.endsWith(".tmp"))).toHaveLength(1);
  });
  it.each(["work", "__proto__", "constructor"])("D2 round-trips own profile %s with metadata and subsequent v2 representations", profileName => {
    const profile = { " REVIEW ": { model: " old ", note: { labels: ["keep"] } }, "afg-specify": "inherit", "afergon-ai": { model: "same", reasoningEffort: "high" }, foreign: { model: null } };
    const document = { version: 1, memo: ["root"], models: { activeProfile: "other", note: ["models"], profiles: { other: { review: { reasoningEffort: "low" } }, [profileName]: profile } } };
    const fixture = snapshotFixture(JSON.stringify(document)), acquire = vi.spyOn(migrationSnapshot, "acquireMigrationSnapshot");
    updateProfileAssignment(profileName, "afg-review", { model: " new " }, { env: writerEnv(fixture) });
    expect(loadProfileDocument(writerEnv(fixture)).document).toEqual({ ...document, version: 2, models: { ...document.models, profiles: { ...document.models.profiles, [profileName]: { ...profile, " REVIEW ": { ...profile[" REVIEW "], model: " new " } } } } });
    updateProfileAssignment(profileName, "afg-specify", { model: " legacy " }, { env: writerEnv(fixture) });
    updateProfileAssignment(profileName, " REVIEW ", { model: "same", reasoningEffort: " Low " }, { env: writerEnv(fixture) });
    const saved = loadProfileDocument(writerEnv(fixture)).document as typeof document;
    expect(saved.models.profiles[profileName]["afg-specify"]).toBe(" legacy ");
    expect(saved.models.profiles.other).toEqual(document.models.profiles.other);
    expect(saved.models.profiles[profileName][" REVIEW "]).toEqual({ model: "same", reasoningEffort: " Low ", note: { labels: ["keep"] } });
    expect(saved.models.profiles[profileName]["afergon-ai"]).toEqual({ model: "same", reasoningEffort: "high" });
    expect(acquire).toHaveBeenCalledTimes(1); expect(fs.readFileSync(fixture.backup)).toEqual(fixture.source.sourceBytes);
  });
  it("D2 absent source structured model-only write snapshots recoverable defaults", () => {
    const fixture = snapshotFixture('{}', true);
    updateProfileAssignment("new", "review", { model: "inherit" }, { env: writerEnv(fixture) });
    expect(JSON.parse(fs.readFileSync(fixture.backup, "utf8"))).toEqual(profileConfig.createDefaultConfig());
    expect(loadProfileDocument(writerEnv(fixture)).document).toEqual({ version: 2, models: { activeProfile: null, profiles: { new: { "afg-review": { model: "inherit" } } } } });
  });
  it.each(invalidReads)("D1 integrated invalid source %s never saves", (_name, document, diagnostic) => {
    const fixture = snapshotFixture('{}'), bytes = JSON.stringify(document); fs.writeFileSync(fixture.source.configPath, bytes);
    const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => updateProfileAssignment("work", "review", {}, { env: writerEnv(fixture) })).toThrow(diagnostic);
    for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled();
    expect(fs.readFileSync(fixture.source.configPath, "utf8")).toBe(bytes); expect(fs.readdirSync(path.dirname(fixture.backup))).toEqual(["config.json"]);
  });
  it.each(["before backup", "before save"].flatMap(timing => ["change", "delete", "appear"].map(kind => [timing, kind])))("D2 %s detects source %s and prevents saver", (timing, kind) => {
    const fixture = snapshotFixture('{}', kind === "appear"); fs.mkdirSync(path.dirname(fixture.backup), { recursive: true });
    const change = () => kind === "delete" ? fs.unlinkSync(fixture.source.configPath) : fs.writeFileSync(fixture.source.configPath, '{"external":true}');
    const prepare = assignmentPreparation.prepareProfileAssignment, acquire = migrationSnapshot.acquireMigrationSnapshot;
    if (timing === "before backup") vi.spyOn(assignmentPreparation, "prepareProfileAssignment").mockImplementation(input => { const result = prepare(input); change(); return result; });
    else vi.spyOn(migrationSnapshot, "acquireMigrationSnapshot").mockImplementation(input => { const result = acquire(input); change(); return result; });
    const save = vi.spyOn(profileConfig, "saveConfig");
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow("Profile source changed");
    expect(save).not.toHaveBeenCalled();
    if (kind === "delete") expect(fs.existsSync(fixture.source.configPath)).toBe(false);
    else expect(fs.readFileSync(fixture.source.configPath, "utf8")).toBe('{"external":true}');
    expect(fs.existsSync(fixture.backup)).toBe(timing === "before save");
    if (timing === "before save") expect(JSON.parse(fs.readFileSync(fixture.backup, "utf8"))).toEqual(fixture.source.document);
    expect(fs.readdirSync(path.dirname(fixture.backup)).some(file => file.endsWith(".tmp"))).toBe(false);
  });
  it.each(["open", "write", "fsync", "close"] as const)("D3 backup %s failure prevents actual saver", stage => {
    const fixture = snapshotFixture('{}'), fault = snapshotFault(fixture.backup, stage), save = vi.spyOn(profileConfig, "saveConfig");
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow(fault.failure);
    expect(save).not.toHaveBeenCalled(); fixture.unchanged(false);
  });
  it.each(["{", "{ }"])("D2 refuses prior malformed or mismatched snapshot %s without save", bytes => {
    const fixture = snapshotFixture('{}'); fs.writeFileSync(fixture.backup, bytes);
    const save = vi.spyOn(profileConfig, "saveConfig");
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow();
    expect(save).not.toHaveBeenCalled(); fixture.unchanged(true, Buffer.from(bytes));
  });
  it.each(["serialize", "write", "fsync", "close", "rename"] as const)("D3 saver %s failure preserves source and completed snapshot for retry", stage => {
    const fixture = snapshotFixture('{}'), fault = configFault(stage);
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow(fault);
    fixture.unchanged();
    vi.restoreAllMocks();
    expect(updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toEqual({ configPath: fixture.source.configPath, version: 2, snapshotPath: fixture.backup });
    expect(fs.readFileSync(fixture.backup)).toEqual(fixture.source.sourceBytes);
    expect(loadProfileDocument(writerEnv(fixture)).document.version).toBe(2);
  });
  it("D3 T2 future candidate refuses before backup or downgrade", () => {
    const fixture = snapshotFixture('{}'), prepare = assignmentPreparation.prepareProfileAssignment;
    vi.spyOn(assignmentPreparation, "prepareProfileAssignment").mockImplementation(input => {
      const candidate = prepare(input); candidate.document.version = 3; return candidate;
    });
    const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow("unsupported profile version 3");
    for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled();
    fixture.unchanged(false);
  });
  it("D3 T1 invalid candidate prevents backup stage and save", () => {
    const fixture = snapshotFixture('{}'), prepare = assignmentPreparation.prepareProfileAssignment;
    vi.spyOn(assignmentPreparation, "prepareProfileAssignment").mockImplementation(input => ({ ...prepare(input), document: { models: null } }));
    const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow("models must be an object");
    for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled();
    fixture.unchanged(false);
  });
  it("D3 validates versioned candidate before actual save", () => {
    const fixture = snapshotFixture('{}'), versions: unknown[] = [];
    const validate = documentValidation.validateProfileDocument;
    vi.spyOn(documentValidation, "validateProfileDocument").mockImplementation((document, configPath) => {
      versions.push((document as Record<string, unknown>).version); return validate(document, configPath);
    });
    const save = profileConfig.saveConfig;
    vi.spyOn(profileConfig, "saveConfig").mockImplementation((candidate, env) => { expect(versions.at(-1)).toBe(2); return save(candidate, env); });
    updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) });
  });
  it("D2 legacy-only change preserves absent version despite unrelated structured slot", () => {
    const contents = '{"models":{"profiles":{"work":{"review":"old","afg-specify":{"reasoningEffort":"low"}}}}}';
    const fixture = snapshotFixture(contents);
    expect(updateProfileAssignment("work", "review", { model: "new" }, { env: writerEnv(fixture) })).toEqual({ configPath: fixture.source.configPath, version: 1 });
    expect(loadProfileDocument(writerEnv(fixture)).document).toEqual({ models: { profiles: { work: { review: "new", "afg-specify": { reasoningEffort: "low" } } } } });
    expect(fs.existsSync(fixture.backup)).toBe(false);
  });
  it("D2 T2 rejects stale source before invoking snapshot stage", () => {
    const fixture = snapshotFixture('{"models":{"profiles":{"work":{"review":"old"}}}}');
    const prepare = assignmentPreparation.prepareProfileAssignment;
    vi.spyOn(assignmentPreparation, "prepareProfileAssignment").mockImplementation(input => {
      const candidate = prepare(input); fs.unlinkSync(fixture.source.configPath); return candidate;
    });
    const acquire = vi.spyOn(migrationSnapshot, "acquireMigrationSnapshot"), save = vi.spyOn(profileConfig, "saveConfig");
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow("Profile source changed");
    for (const spy of [acquire, save]) expect(spy).not.toHaveBeenCalled();
    expect(fs.readdirSync(path.dirname(fixture.backup))).toEqual([]);
  });
  it("D2 T1 rejects source changed after completed snapshot before save", () => {
    const fixture = snapshotFixture('{"models":{"profiles":{"work":{"review":"old"}}}}');
    const acquire = migrationSnapshot.acquireMigrationSnapshot;
    vi.spyOn(migrationSnapshot, "acquireMigrationSnapshot").mockImplementation(input => {
      const receipt = acquire(input); fs.writeFileSync(fixture.source.configPath, '{"external":true}'); return receipt;
    });
    const save = vi.spyOn(profileConfig, "saveConfig");
    expect(() => updateProfileAssignment("work", "review", { reasoningEffort: "high" }, { env: writerEnv(fixture) })).toThrow("Profile source changed");
    expect(save).not.toHaveBeenCalled();
    expect(fs.readFileSync(fixture.source.configPath, "utf8")).toBe('{"external":true}');
    expect(fs.readFileSync(fixture.backup)).toEqual(fixture.source.sourceBytes);
  });
  it("D2 first structured change snapshots before real v2 save", () => {
    const fixture = snapshotFixture('{\n "models":{"profiles":{"work":{"review":"old"},"other":{"afg-specify":"inherit"}}},"memo":["café"]\n}');
    const originalSave = profileConfig.saveConfig;
    vi.spyOn(profileConfig, "saveConfig").mockImplementation((candidate, env) => {
      fixture.unchanged();
      expect(candidate.version).toBe(2);
      return originalSave(candidate, env);
    });
    expect(updateProfileAssignment("work", "review", { reasoningEffort: " High " }, { env: writerEnv(fixture) })).toEqual({ configPath: fixture.source.configPath, version: 2, snapshotPath: fixture.backup });
    expect(loadProfileDocument(writerEnv(fixture)).document).toEqual({ ...fixture.source.document, version: 2, models: { profiles: { work: { review: { model: "old", reasoningEffort: " High " } }, other: { "afg-specify": "inherit" } } } });
    expect(fs.readdirSync(path.dirname(fixture.backup))).toEqual(["config.json", "config.json.pre-v2.bak"]);
  });
  it("D1 T2 rejects own undefined patch before save or snapshot", () => {
    const fixture = snapshotFixture('{"models":{"profiles":{"work":{"review":"old"}}}}');
    const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => updateProfileAssignment("work", "review", { model: undefined }, { env: writerEnv(fixture) })).toThrow('models.profiles["work"]["review"].model');
    for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled();
    fixture.unchanged(false);
  });
  it("D1 T1 refuses future nominal no-op before write I/O", () => {
    const fixture = snapshotFixture('{"version":3}');
    const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync"), open = vi.spyOn(fs, "openSync");
    expect(() => updateProfileAssignment("work", "review", {}, { env: writerEnv(fixture) })).toThrow("unsupported profile version 3");
    for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled();
    expect(open.mock.calls.every(([, flags]) => flags === "r")).toBe(true);
    fixture.unchanged(false);
  });
  it("D1 no-op preserves exact mixed v1 source and prior snapshot", () => {
    const fixture = snapshotFixture('{\n "models":{"profiles":{"work":{"review":{"model":" old ","reasoningEffort":" High "},"afg-specify":"inherit"}}}\n}');
    fs.writeFileSync(fixture.backup, "prior snapshot");
    const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync");
    expect(updateProfileAssignment("work", "review", { model: " old " }, { env: writerEnv(fixture) })).toEqual({ configPath: fixture.source.configPath, version: 1 });
    fixture.unchanged(true, Buffer.from("prior snapshot"));
    for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled();
  });
});

import * as profileConfig from "../scripts/lib/model-profiles-config.js";
import * as migrationSnapshot from "../scripts/lib/model-profiles/infrastructure/migration-snapshot.js";
import * as assignmentPreparation from "../scripts/lib/model-profiles/infrastructure/prepare-assignment.js";
function writerEnv(fixture: ReturnType<typeof snapshotFixture>) {
  return { HOME: fixture.root, XDG_CONFIG_HOME: fixture.root, AFERGON_AI_CONFIG_DIR: path.dirname(fixture.source.configPath) };
}

function configFault(stage: "serialize" | "write" | "fsync" | "close" | "rename") {
  const failure = new Error(`config ${stage} fault`), open = fs.openSync.bind(fs), close = fs.closeSync.bind(fs);
  let descriptor: number | undefined, failed = false, saving = false;
  vi.spyOn(fs, "openSync").mockImplementation((file, flags, ...args) => {
    const fd = open(file, flags, ...args);
    if (typeof file === "string" && file.endsWith(".tmp") && flags === "wx") descriptor = fd;
    return fd;
  });
  vi.spyOn(fs, "closeSync").mockImplementation(fd => {
    if (fd === descriptor && stage === "close" && !failed) { failed = true; throw failure; }
    const result = close(fd); if (fd === descriptor) descriptor = undefined; return result;
  });
  const method = stage === "write" ? "writeFileSync" : stage === "rename" ? "renameSync" : "fsyncSync", original = fs[method].bind(fs);
  if (!["serialize", "close"].includes(stage)) vi.spyOn(fs, method).mockImplementation((target, ...args) => {
    if (stage === "rename" ? typeof target === "string" && target.endsWith(".tmp") : target === descriptor) throw failure;
    return (original as (...args: unknown[]) => never)(target, ...args);
  });
  if (stage === "serialize") {
    const stringify = JSON.stringify, save = profileConfig.saveConfig;
    vi.spyOn(JSON, "stringify").mockImplementation((...args) => { if (saving) throw failure; return stringify(...args); });
    vi.spyOn(profileConfig, "saveConfig").mockImplementation((candidate, env) => {
      saving = true; try { return save(candidate, env); } finally { saving = false; }
    });
  }
  return failure;
}
