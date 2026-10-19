import fs from "node:fs";
import ts from "typescript";
import { afterEach, expect, it, vi } from "vitest";
import { AgentTargetPolicy, SUPPORTED_AGENTS as DOMAIN_AGENTS, type SupportedAgent as DomainAgent } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { cloneAssignments, normalizeAgentName, SUPPORTED_AGENTS, type SupportedAgent } from "../scripts/lib/model-profiles-core.js";
import { StoredAssignment } from "../scripts/lib/model-profiles/domain/stored-assignment.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import { NodeProfileStorageAdapter } from "../scripts/lib/model-profiles/infrastructure/node-profile-storage-adapter.js";
import { LegacyProfileDefaultsAdapter } from "../scripts/lib/model-profiles/infrastructure/legacy-profile-defaults-adapter.js";
import os from "node:os";
import path from "node:path";
import { loadProfileDocument } from "../scripts/lib/model-profiles/infrastructure/profile-store.js";
import { invalidReads, readableDocuments } from "./_testModelRawFixtures.js";
import { bindProfileRead } from "../scripts/lib/model-profiles/infrastructure/profile-read-composition.js";
import { getConfigPath } from "../scripts/lib/model-profiles-config.js";
import { spawnSync } from "node:child_process";
import { ProfileAssignmentPolicy, type PrepareAssignmentInput } from "../scripts/lib/model-profiles/domain/profile-assignment-policy.js";
import { RawProfileDocumentCloner } from "../scripts/lib/model-profiles/domain/raw-profile-document-cloner.js";
import { aliasCases, changingPatch, domainProgramPrefix, editCases, invalidPatchFields, missingContainers } from "./_testModelPreparationFixtures.js";
import { registerPreparationContract, type PreparationInvoker } from "./_testModelPreparationContract.js";
import { prepareProfileAssignment, type PrepareAssignmentInput as LegacyPrepareInput, type PreparedAssignment as LegacyPreparedAssignment } from "../scripts/lib/model-profiles/infrastructure/prepare-assignment.js";
import { PrepareProfileAssignmentUseCase } from "../scripts/lib/model-profiles/application/prepare-profile-assignment-use-case.js";

registerPreparationContract("compatibility preparation", (): PreparationInvoker => ({
  validate: vi.spyOn(ProfileDocumentPolicy.prototype, "validate"),
  clone: vi.spyOn(RawProfileDocumentCloner.prototype, "clone"),
  prepare: (document, patch, profileName = "work", agentName = "review"): LegacyPreparedAssignment => prepareProfileAssignment({
    document, patch, profileName, agentName, configPath: "/unused/config.json",
  } as LegacyPrepareInput),
}));

it("compatibility preparation executes the actual application with mapped input", () => {
  const execute = vi.spyOn(PrepareProfileAssignmentUseCase.prototype, "execute");
  const input = { document: {}, configPath: "legacy:composition", profileName: "archive", agentName: "design", patch: { model: "inherit" } };
  const result: LegacyPreparedAssignment = prepareProfileAssignment(input);
  expect(execute.mock.calls).toEqual([[{ document: input.document, sourceIdentity: input.configPath, profileName: input.profileName, agentName: input.agentName, patch: input.patch }]]);
  expect(execute.mock.calls[0][0].document).toBe(input.document);
  expect(execute.mock.calls[0][0].patch).toBe(input.patch);
  expect(result).toBe(execute.mock.results[0].value);
  expect(result).toEqual({ document: { models: { profiles: { archive: { "afg-design": { model: "inherit" } } } } }, changed: true, migrationRequired: true, version: 2, agentKey: "afg-design" });
});

it("compatibility preparation maps the exact configured diagnostic identity", () => {
  const input: LegacyPrepareInput = { document: { models: null }, configPath: "legacy:configured/not-a-resolved-path", profileName: "work", agentName: "review", patch: {} };
  expect(() => prepareProfileAssignment(input)).toThrow("Could not read model profile config at legacy:configured/not-a-resolved-path: models must be an object.");
});
it("compatibility preparation retains a second raw-path diagnostic without resolution", () => {
  const input = { document: { models: { profiles: { inactive: null } } }, configPath: "../unresolved/☕.json", profileName: "work", agentName: "review", patch: {} };
  expect(() => prepareProfileAssignment(input)).toThrow("Could not read model profile config at ../unresolved/☕.json: models.profiles.inactive must be an object.");
});
it("compatibility preparation diagnoses the actual selected alias before cloning", () => {
  const clone = vi.spyOn(RawProfileDocumentCloner.prototype, "clone");
  const input = { document: { models: { profiles: { archive: { " ReVieW ": "old" } } } }, configPath: "legacy:alias", profileName: "archive", agentName: "review", patch: { reasoningEffort: undefined } };
  expect(() => prepareProfileAssignment(input)).toThrow('models.profiles["archive"][" ReVieW "].reasoningEffort');
  expect(clone).not.toHaveBeenCalled();
});

registerPreparationContract("domain preparation", () => {
  const agents = new AgentTargetPolicy();
  const validator = new ProfileDocumentPolicy(agents);
  const cloner = new RawProfileDocumentCloner();
  const policy = new ProfileAssignmentPolicy(validator, agents, cloner);
  return { validate: vi.spyOn(validator, "validate"), clone: vi.spyOn(cloner, "clone"),
    prepare: (document, patch, profileName = "work", agentName = "review") => policy.prepare({
      document, patch, profileName, agentName, sourceIdentity: "/unused/config.json",
    } as PrepareAssignmentInput) };
});

const tempRoots: string[] = [];
it("generic clone defaults to an empty object", () => {
  expect(cloneAssignments()).toEqual({});
});
it.each([null, [], "not an object"])("generic clone retains fallback for %j", (raw) => {
  expect(cloneAssignments(raw as unknown as Record<string, unknown>)).toEqual({});
});
it("generic clone preserves JSON conversion semantics", () => {
  const raw = { missing: undefined, values: [undefined, NaN], date: new Date("2020-01-01Z") };
  expect(cloneAssignments(raw)).toEqual({ values: [null, null], date: "2020-01-01T00:00:00.000Z" });
});
it("generic clone keeps nested metadata independent both ways", () => {
  const raw = { review: { note: { values: [1, 2] } } };
  const copy: typeof raw = cloneAssignments(raw);
  copy.review.note.values[0] = 3;
  raw.review.note.values[1] = 4;
  expect(copy.review.note.values).toEqual([3, 2]);
  expect(raw.review.note.values).toEqual([1, 4]);
});
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
function expectExactFailure(action: () => unknown, failure: Error) {
  try { action(); throw new Error("Expected failure"); }
  catch (error) { expect(error).toBe(failure); }
}

it("captures exact UTF-8 bytes and original formatting", () => {
  const contents = '{\n  "version": 1,\n  "memo": "café ☕",\n  "models": {"profiles": {}}\n}\n';
  const { root, configPath } = createConfig({}, contents);
  const read = vi.spyOn(fs, "readFileSync");
  const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });
  expect(loaded.sourceBytes).toEqual(Buffer.from(contents, "utf8"));
  expect(loaded.originalBytes).toBe(contents);
  expect(read.mock.calls).toEqual([[configPath]]);
  fs.writeFileSync(configPath, "{}");
  expect(loaded.sourceBytes).toEqual(Buffer.from(contents));
  expect(loaded.document).toEqual(JSON.parse(contents));
});
it("returns absent-source defaults without creating a file", () => {
  const { root } = createConfig();
  const configDir = path.join(root, "not-created");
  const configPath = path.join(configDir, "config.json");
  const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: configDir });
  expect(loaded).toEqual({ document: { version: 1, models: { activeProfile: null, profiles: {} } }, configPath, exists: false });
  expect(fs.existsSync(configDir)).toBe(false);
});
it("propagates a permission read fault instead of returning missing-file defaults", () => {
  const { root, configPath } = createConfig({ models: { profiles: {} } });
  const failure = Object.assign(new Error("permission denied"), { code: "EACCES" });
  const readFileSync = fs.readFileSync.bind(fs);
  vi.spyOn(fs, "existsSync").mockReturnValue(false);
  const read = vi.spyOn(fs, "readFileSync").mockImplementation((filePath, ...args) => {
    if (filePath === configPath) throw failure;
    return readFileSync(filePath, ...args);
  });
  expectExactFailure(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root }), failure);
  expect(read.mock.calls).toEqual([[configPath]]);
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
  expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow('models.profiles.work["afg-review"].reasoningEffort');
});
it.each(readableDocuments)("preserves %s on read", (_name, document) => {
  expect(loadDocument(document).document).toEqual(document);
});
it.each(invalidReads)("rejects %s with the original path", (_name, document, expectedPath) => {
  expect(() => loadDocument(document)).toThrow(expectedPath);
});
it.each([
  { AFERGON_AI_CONFIG_DIR: "relative-config", XDG_CONFIG_HOME: "relative-xdg", HOME: "relative-home" },
  { XDG_CONFIG_HOME: "relative-xdg", HOME: "relative-home" }, { HOME: "relative-home" }, {},
])("binding privately pins initial config precedence %j", (env: NodeJS.ProcessEnv) => {
  const original = { ...env };
  const identity = path.resolve(getConfigPath(env));
  const composition = bindProfileRead(env);
  expect(env).toEqual(original);
  env.AFERGON_AI_CONFIG_DIR = "later-config";
  env.XDG_CONFIG_HOME = "later-xdg";
  const read = vi.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from("{}"));
  expect(composition.createReader().execute().source.sourceIdentity).toBe(identity);
  expect(path.isAbsolute(identity)).toBe(true);
  expect(path.basename(identity)).toBe("config.json");
  expect(read.mock.calls).toEqual([[identity]]);
});

function builtRead(script: string, programPrefix?: string) {
  const { root } = createConfig();
  const entry = "./dist/scripts/lib/model-profiles/infrastructure/profile-store.js";
  expect(fs.existsSync(new URL(`../${entry}`, import.meta.url))).toBe(true);
  return spawnSync(process.execPath, ["--input-type=module", "-e", `${programPrefix ?? `import * as built from '${entry}';`} ${script}`],
    { encoding: "utf8", env: { ...process.env, HOME: root, XDG_CONFIG_HOME: root, XDG_STATE_HOME: root, AFERGON_AI_CONFIG_DIR: root } });
}
it("emits a directly importable reader module", () => {
  const result = builtRead("if (typeof built.loadProfileDocument !== 'function') throw new Error('Reader missing');");
  expect(result.status, result.stderr).toBe(0);
});
it("emitted context executes the real domain policy and cloner", () => {
  const input = { document: { models: { profiles: { work: { " ReVieW ": "old" } } }, foreign: { keep: [1] } }, sourceIdentity: "emitted:source", profileName: "work", agentName: "review", patch: { reasoningEffort: "high" } };
  const result = builtRead(`const input = ${JSON.stringify(input)}; console.log(JSON.stringify({ direct: cloner.clone(input.document), context: policy.prepareContext(input) }));`, domainProgramPrefix);
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({ direct: input.document, context: { document: input.document, knownPatch: input.patch, selectedKey: " ReVieW ", effectiveVersion: 1, sourceIdentity: input.sourceIdentity, profileName: input.profileName } });
});
it("emitted preparation executes the complete domain policy", () => {
  const input = { document: { version: 1, foreign: [1], models: { profiles: { work: { " ReVieW ": { model: "old", reasoningEffort: "high", note: [2] } } } } }, sourceIdentity: "emitted:prepare", profileName: "work", agentName: "review", patch: { model: "new" } };
  const result = builtRead(`console.log(JSON.stringify(policy.prepare(${JSON.stringify(input)})));`, domainProgramPrefix);
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({ document: { version: 1, foreign: [1], models: { profiles: { work: { " ReVieW ": { model: "new", reasoningEffort: "high", note: [2] } } } } }, changed: true, migrationRequired: true, version: 2, agentKey: " ReVieW " });
});
it("emitted application and original wrapper execute complete preparation and mapped diagnostics", () => {
  const input: LegacyPrepareInput = { document: { version: 1, foreign: [1], models: { profiles: { work: { " ReVieW ": { model: "old", reasoningEffort: "high", note: [2] } } } } }, configPath: "emitted:legacy/☕.json", profileName: "work", agentName: "review", patch: { model: "new" } };
  const prefix = `${domainProgramPrefix}
    import { PrepareProfileAssignmentUseCase } from './dist/scripts/lib/model-profiles/application/prepare-profile-assignment-use-case.js';
    import { prepareProfileAssignment } from './dist/scripts/lib/model-profiles/infrastructure/prepare-assignment.js';`;
  const result = builtRead(`
    const input = ${JSON.stringify(input)};
    const { configPath, ...command } = input;
    const application = new PrepareProfileAssignmentUseCase(policy).execute({ ...command, sourceIdentity: configPath });
    const compatibility = prepareProfileAssignment(input);
    let diagnostic;
    try { prepareProfileAssignment({ ...input, document: { models: null } }); }
    catch (error) { diagnostic = error.message; }
    console.log(JSON.stringify({ application, compatibility, diagnostic }));`, prefix);
  expect(result.status, result.stderr).toBe(0);
  const expected: LegacyPreparedAssignment = { document: { version: 1, foreign: [1], models: { profiles: { work: { " ReVieW ": { model: "new", reasoningEffort: "high", note: [2] } } } } }, changed: true, migrationRequired: true, version: 2, agentKey: " ReVieW " };
  expect(JSON.parse(result.stdout)).toEqual({ application: expected, compatibility: expected, diagnostic: "Could not read model profile config at emitted:legacy/☕.json: models must be an object." });
});

it("keeps a built missing-file read side-effect free", () => {
  const result = builtRead("import fs from 'node:fs'; const loaded = built.loadProfileDocument(); if (loaded.exists || fs.existsSync(loaded.configPath)) throw new Error('Unexpected source');");
  expect(result.status, result.stderr).toBe(0);
});
it("does not export the standalone reader through the live facade", async () => {
  const live = await import("../scripts/lib/model-profiles.js");
  expect(Object.hasOwn(live, "loadProfileDocument")).toBe(false);
  expect(Object.hasOwn(live, "prepareProfileAssignment")).toBe(false);
});

it("Node observation captures formatted multibyte data in one read", () => {
  const text = '{\n "memo": "café ☕", "version": 3\n}\n';
  const capture = Buffer.from(text);
  const read = vi.spyOn(fs, "readFileSync").mockReturnValue(capture);
  const factory = vi.fn(() => ({}));
  try {
    const adapter = new NodeProfileStorageAdapter("/bound/config.json", fs, new LegacyProfileDefaultsAdapter(factory));
    expect(read).not.toHaveBeenCalled();
    expect(factory).not.toHaveBeenCalled();
    const packet = adapter.observe();
    expect(packet).toEqual({ document: JSON.parse(text), originalText: text,
      source: { sourceIdentity: "/bound/config.json", exists: true, sourceBytes: new Uint8Array(capture) } });
    expect(read.mock.calls).toEqual([["/bound/config.json"]]);
    expect(factory).not.toHaveBeenCalled();
    capture.fill(0);
    expect(packet.source.sourceBytes).toEqual(new Uint8Array(Buffer.from(text)));
    expect(packet.originalText).toBe(text);
    expect(packet.document).toEqual(JSON.parse(text));
    packet.source.sourceBytes![0] = 8;
    expect(capture[0]).toBe(0);
  } finally { read.mockRestore(); }
});
it.each(["read", "parse", "defaults"])("Node propagates the exact %s fault without fallback", (stage) => {
  const failure = Object.assign(stage === "parse" ? new SyntaxError("invalid JSON") : new Error(stage), { code: stage === "read" ? "EACCES" : "ENOENT" });
  const factory = vi.fn(() => { throw failure; });
  const read = vi.spyOn(fs, "readFileSync").mockImplementation(() => {
    if (stage === "parse") return Buffer.from("{");
    throw stage === "read" ? failure : Object.assign(new Error("absent"), { code: "ENOENT" });
  });
  if (stage === "parse") {
    expect(() => JSON.parse("{")).toThrow(SyntaxError);
    vi.spyOn(JSON, "parse").mockImplementation(() => { throw failure; });
  }
  expectExactFailure(() => new NodeProfileStorageAdapter("/bound/config.json", fs, new LegacyProfileDefaultsAdapter(factory)).observe(), failure);
  expect(read).toHaveBeenCalledTimes(1);
  expect(factory).toHaveBeenCalledTimes(stage === "defaults" ? 1 : 0);
});
it("Node absence delegates defaults once without capturing bytes", () => {
  const failure = Object.assign(new Error("missing"), { code: "ENOENT" });
  const read = vi.spyOn(fs, "readFileSync").mockImplementation(() => { throw failure; });
  const document = { version: 1, models: { activeProfile: null, profiles: {} } };
  const factory = vi.fn(() => document);
  try {
    expect(new NodeProfileStorageAdapter("/absent/config.json", fs, new LegacyProfileDefaultsAdapter(factory)).observe())
      .toEqual({ document, source: { sourceIdentity: "/absent/config.json", exists: false } });
    expect(read.mock.calls).toEqual([["/absent/config.json"]]);
    expect(factory).toHaveBeenCalledTimes(1);
  } finally { read.mockRestore(); }
});

const policy = new AgentTargetPolicy();
const documents = new ProfileDocumentPolicy(policy);
const cloner = new RawProfileDocumentCloner();
const assignments = new ProfileAssignmentPolicy(documents, policy, cloner);
it("preparation construction is cold and invokes its own context once", () => {
  const spies = [vi.spyOn(documents, "validate"), vi.spyOn(documents, "requireSupportedVersion"), vi.spyOn(policy, "select"), vi.spyOn(cloner, "clone")];
  const instance = new ProfileAssignmentPolicy(documents, policy, cloner);
  for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  const input = { document: {}, sourceIdentity: "cold:prepare", profileName: "work", agentName: "review", patch: {} };
  const context = vi.spyOn(instance, "prepareContext");
  expect(instance.prepare(input)).toEqual({ document: {}, changed: false, migrationRequired: false, version: 1, agentKey: "afg-review" });
  expect(context.mock.calls).toEqual([[input]]);
});
it("context returns an independent whole raw draft", () => {
  const document = { foreign: { values: [1, 2] } };
  const input = { document, sourceIdentity: "context:source", profileName: "work", agentName: "afg-review", patch: {} };
  const context = assignments.prepareContext(input);
  expect(context).toEqual({ document, knownPatch: {}, selectedKey: "afg-review", effectiveVersion: 1, sourceIdentity: "context:source", profileName: "work" });
  (context.document.foreign as typeof document.foreign).values[0] = 3;
  document.foreign.values[1] = 4;
  expect(context.document.foreign).toEqual({ values: [3, 2] });
  expect(document.foreign).toEqual({ values: [1, 4] });
});
it("context treats inherited constructor profile as absent", () => {
  const select = vi.spyOn(policy, "select");
  const document = { models: { profiles: {} } };
  const context = assignments.prepareContext({ document, sourceIdentity: "context:own", profileName: "constructor", agentName: "review", patch: {} });
  expect(select).toHaveBeenCalledWith({}, "review");
  expect(context.document).toEqual(document);
  expect(context.selectedKey).toBe("afg-review");
});
it("context retains the actual stored alias and supplied identity", () => {
  const document = { version: 2, models: { profiles: { archive: { " ReVieW ": "inherit" } } } };
  const context = assignments.prepareContext({ document, sourceIdentity: "context:second", profileName: "archive", agentName: "afg-review", patch: {} });
  expect(context).toEqual({ document, knownPatch: {}, selectedKey: " ReVieW ", effectiveVersion: 2, sourceIdentity: "context:second", profileName: "archive" });
  expect(context.document).not.toBe(document);
});
it("context captures changing recognized getters once", () => {
  const { patch, reads } = changingPatch();
  const context = assignments.prepareContext({ document: {}, sourceIdentity: "context:getter", profileName: "work", agentName: "review", patch });
  expect(context.knownPatch).toEqual({ model: "custom/first", reasoningEffort: "high" });
  expect(reads).toEqual({ model: 1, reasoningEffort: 1 });
});
it("context refuses own undefined effort at actual stored path before clone", () => {
  const clone = vi.spyOn(cloner, "clone");
  const document = { models: { profiles: { work: { " ReVieW ": "inherit" } } } };
  expect(() => assignments.prepareContext({ document, sourceIdentity: "context:invalid", profileName: "work", agentName: "review", patch: { reasoningEffort: undefined } }))
    .toThrow('models.profiles["work"][" ReVieW "].reasoningEffort');
  expect(clone).not.toHaveBeenCalled();
});
it("context rejects malformed source with supplied identity before clone", () => {
  const clone = vi.spyOn(cloner, "clone");
  expect(() => assignments.prepareContext({ document: { models: null }, sourceIdentity: "context:corrupt", profileName: "work", agentName: "review", patch: {} }))
    .toThrow("Could not read model profile config at context:corrupt: models must be an object.");
  expect(clone).not.toHaveBeenCalled();
});
it("context refuses future version even for an empty patch", () => {
  const clone = vi.spyOn(cloner, "clone");
  expect(() => assignments.prepareContext({ document: { version: 3 }, sourceIdentity: "context:future", profileName: "work", agentName: "review", patch: {} }))
    .toThrow(new Error("Cannot prepare assignment for unsupported profile version 3."));
  expect(clone).not.toHaveBeenCalled();
});
it.each([["string", "bad"], ["null", null], ["array", []], ["undefined", undefined], ["number", 7]])("context rejects patch shape %s before clone", (_name, patch) => {
  const clone = vi.spyOn(cloner, "clone");
  expect(() => assignments.prepareContext({ document: {}, sourceIdentity: "context:shape", profileName: "work", agentName: "review", patch } as PrepareAssignmentInput))
    .toThrow("Assignment patch must be an object.");
  expect(clone).not.toHaveBeenCalled();
});
it.each(invalidReads)("context rejects whole raw source %s before clone", (_name, document, expectedPath) => {
  const clone = vi.spyOn(cloner, "clone");
  expect(() => assignments.prepareContext({ document, sourceIdentity: "context:matrix", profileName: "work", agentName: "review", patch: {} } as PrepareAssignmentInput)).toThrow(expectedPath);
  expect(clone).not.toHaveBeenCalled();
});
it.each(invalidPatchFields)("context rejects captured %s before clone", (_name, field, value) => {
  const clone = vi.spyOn(cloner, "clone");
  const document = { models: { profiles: { work: { " ReVieW ": "old" } } } };
  expect(() => assignments.prepareContext({ document, sourceIdentity: "context:fields", profileName: "work", agentName: "review", patch: { [field]: value } }))
    .toThrow(`models.profiles["work"][" ReVieW "].${field}`);
  expect(() => assignments.prepareContext({ document: { models: { profiles: { other: { review: { [field]: value } } } } }, sourceIdentity: "context:nontarget", profileName: "work", agentName: "review", patch: {} }))
    .toThrow(`models.profiles.other.review.${field}`);
  expect(clone).not.toHaveBeenCalled();
});
it.each(editCases)("context retains raw input projection: %s", (_name, stored, patch) => {
  const document = { version: 1, models: { profiles: { work: { review: structuredClone(stored) } } } };
  const command = structuredClone(patch);
  const context = assignments.prepareContext({ document, sourceIdentity: "context:edit", profileName: "work", agentName: "review", patch: command });
  expect(context.document).toEqual(document);
  expect(context.knownPatch).toEqual(Object.fromEntries(Object.entries(command).filter(([key]) => key === "model" || key === "reasoningEffort")));
  expect(context.selectedKey).toBe("review");
});
it.each(missingContainers)("context leaves missing containers absent: %j", (raw) => {
  const document = structuredClone(raw);
  const context = assignments.prepareContext({ document, sourceIdentity: "context:missing", profileName: "__proto__", agentName: "review", patch: {} });
  expect(context.document).toEqual(document);
  expect(context.selectedKey).toBe("afg-review");
});
it.each(aliasCases)("context selects input projection: %s", (_name, profile, agentName, selectedKey) => {
  const document = { models: { profiles: { work: structuredClone(profile) } } };
  const context = assignments.prepareContext({ document, sourceIdentity: "context:alias", profileName: "work", agentName, patch: {} });
  expect(context).toEqual({ document, knownPatch: {}, selectedKey, effectiveVersion: 1, sourceIdentity: "context:alias", profileName: "work" });
});
it.each(["__proto__", "constructor"])("context keeps own prototype-like profile %s", (profileName) => {
  const document = { models: { profiles: { [profileName]: { " ReVieW ": "old" } } } };
  expect(assignments.prepareContext({ document, sourceIdentity: "context:own", profileName, agentName: "review", patch: {} }).selectedKey).toBe(" ReVieW ");
  const select = vi.spyOn(policy, "select");
  assignments.prepareContext({ document: { models: { profiles: {} } }, sourceIdentity: "context:absent", profileName, agentName: "review", patch: {} });
  expect(Object.getPrototypeOf(select.mock.calls[0][0])).toBe(Object.prototype);
});
it.each(["foreign", " REVIEW "])("context refuses target %s before capture or clone", (agentName) => {
  const clone = vi.spyOn(cloner, "clone");
  const { patch, reads } = changingPatch();
  const document = { models: { profiles: { work: { review: "old", "afg-review": "other" } } } };
  expect(() => assignments.prepareContext({ document, sourceIdentity: "context:target", profileName: "work", agentName, patch }))
    .toThrow(agentName === "foreign" ? "Unsupported agent 'foreign'" : "Ambiguous assignment aliases");
  expect(reads).toEqual({ model: 0, reasoningEffort: 0 });
  expect(clone).not.toHaveBeenCalled();
});
it("context ignores inherited recognized and own unknown getter traps", () => {
  const { patch, reads } = changingPatch(false);
  const context = assignments.prepareContext({ document: {}, sourceIdentity: "context:traps", profileName: "work", agentName: "review", patch });
  expect(context.knownPatch).toEqual({});
  expect(Object.getPrototypeOf(context.knownPatch)).toBe(Object.prototype);
  expect(reads).toEqual({ model: 0, reasoningEffort: 0 });
});
it("context command and supplied patch remain independent both ways", () => {
  const patch = { model: "old", reasoningEffort: "high" };
  const context = assignments.prepareContext({ document: {}, sourceIdentity: "context:copy", profileName: "work", agentName: "review", patch });
  patch.model = "later";
  context.knownPatch.reasoningEffort = "low";
  expect(context.knownPatch).toEqual({ model: "old", reasoningEffort: "low" });
  expect(patch).toEqual({ model: "later", reasoningEffort: "high" });
});
it("context accepts frozen source command and input without mutation", () => {
  const document = Object.freeze({ foreign: Object.freeze({ keep: true }) });
  const input = Object.freeze({ document, sourceIdentity: "context:frozen", profileName: "work", agentName: "review", patch: Object.freeze({ model: "new" }) });
  const context = assignments.prepareContext(input);
  (context.document.foreign as { keep: boolean }).keep = false;
  expect(document.foreign.keep).toBe(true);
  expect(context.knownPatch).toEqual(input.patch);
});
it("context construction is inert and execution uses inward collaborators once", () => {
  const validate = vi.spyOn(documents, "validate");
  const supported = vi.spyOn(documents, "requireSupportedVersion");
  const select = vi.spyOn(policy, "select");
  const clone = vi.spyOn(cloner, "clone");
  const ambient = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(process, "cwd")];
  const json = [vi.spyOn(JSON, "parse"), vi.spyOn(JSON, "stringify")];
  const instance = new ProfileAssignmentPolicy(documents, policy, cloner);
  new RawProfileDocumentCloner();
  for (const spy of [validate, supported, select, clone, ...ambient, ...json]) expect(spy).not.toHaveBeenCalled();
  const input = { document: {}, sourceIdentity: "context:order", profileName: "work", agentName: "review", patch: {} };
  expect(instance.prepareContext(input).document).toEqual({});
  expect(validate.mock.calls).toEqual([[input.document, input.sourceIdentity]]);
  expect(supported.mock.calls).toEqual([[input.document, "prepare"]]);
  expect(clone.mock.calls).toEqual([[input.document]]);
  expect(validate.mock.invocationCallOrder[0]).toBeLessThan(select.mock.invocationCallOrder[0]);
  expect(select.mock.invocationCallOrder[0]).toBeLessThan(clone.mock.invocationCallOrder[0]);
  for (const spy of ambient) expect(spy).not.toHaveBeenCalled();
});
it("refuses future preparation with its original diagnostic", () => {
  expect(() => documents.requireSupportedVersion({ version: 3 }, "prepare"))
    .toThrow(new Error("Cannot prepare assignment for unsupported profile version 3."));
});
it("refuses future update with operation-specific punctuation", () => {
  expect(() => documents.requireSupportedVersion({ version: 3 }, "update"))
    .toThrow(new Error("Cannot update unsupported profile version 3"));
});
it("supported version two permits preparation", () => {
  expect(() => documents.requireSupportedVersion({ version: 2 }, "prepare")).not.toThrow();
});
it("omitted legacy version permits update without injecting version one", () => {
  expect(() => documents.requireSupportedVersion(Object.freeze({}), "update")).not.toThrow();
});
it("refuses future snapshot using the actual version and original text", () => {
  expect(() => documents.requireSupportedVersion({ version: 4 }, "snapshot"))
    .toThrow(new Error("Cannot snapshot unsupported profile version 4"));
});
it("refuses a mismatched recovery document before acquisition", () => {
  expect(() => documents.requireRecoveryMatch(false)).toThrow(new Error("Recovery document does not match captured source"));
});
it("permits a matching recovery document", () => {
  expect(() => documents.requireRecoveryMatch(true)).not.toThrow();
});
it.each([{}, { version: 1 }, { version: 2 }, { version: 3 }, { version: Number.MAX_SAFE_INTEGER }])("version eligibility matrix %j", (raw) => {
  for (const operation of ["prepare", "update", "snapshot"] as const) {
    const run = () => documents.requireSupportedVersion(raw, operation);
    if ("version" in raw && raw.version! > 2) expect(run).toThrow(new Error(operation === "prepare"
      ? `Cannot prepare assignment for unsupported profile version ${raw.version}.` : `Cannot ${operation} unsupported profile version ${raw.version}`));
    else expect(run).not.toThrow();
  }
});
const invalidDocuments: Array<[string, unknown, string]> = [
  ["root", [], "root value must be an object."],
  ["models", { models: null }, "models must be an object."],
  ["profiles", { models: { profiles: [] } }, "models.profiles must be an object."],
  ["profile", { models: { profiles: { ['bad.name"\\folder']: null } } }, `models.profiles[${JSON.stringify('bad.name"\\folder')}] must be an object.`],
  ["version type", { version: "1" }, "version must be a positive safe integer."],
  ["unsafe version", { version: Number.MAX_SAFE_INTEGER + 1 }, "version must be a positive safe integer."],
  ["nonpositive version", { version: 0 }, "version must be a positive safe integer."],
  ["active shape", { models: { activeProfile: [] } }, "models.activeProfile must be a string or null."],
  ["active reference", { models: { activeProfile: "constructor", profiles: {} } }, "models.activeProfile 'constructor' does not exist."],
];
it.each(invalidDocuments)("domain rejects malformed %s", (_name, raw, error) => {
  expect(() => documents.validate(raw, "source")).toThrow(new Error(`Could not read model profile config at source: ${error}`));
});
it("omitted containers remain absent without legacy default injection", () => {
  const raw = Object.freeze({ foreign: { retained: true } });
  expect(documents.validate(raw, "source")).toBe(raw);
});

it.each(["inherit", " custom/model ", {}, { model: " inherit " }, { reasoningEffort: " Unknown " }, { note: { keep: true } }])
  ("retained factory preserves valid raw %j", (raw) => {
    expect(StoredAssignment.create(raw, "slot").raw).toBe(raw);
  });
it.each([undefined, null, [], 4, "", " \t"])("retained factory rejects invalid assignment %j", (raw) => {
  expect(() => StoredAssignment.create(raw, "slot")).toThrow("slot must be");
});
it.each([undefined, null, [], 4, "", " \t"])("retained factory rejects own invalid fields %j", (value) => {
  expect(() => StoredAssignment.create({ model: value }, "slot")).toThrow("slot.model must be a nonempty model string.");
  expect(() => StoredAssignment.create({ reasoningEffort: value }, "slot")).toThrow("slot.reasoningEffort must be a nonempty explicit effort string.");
});
it.each(["inherit", " InHerit ", "\tINHERIT\n"])("retained factory rejects effort inheritance %j", (reasoningEffort) => {
  expect(() => StoredAssignment.create({ reasoningEffort }, "slot")).toThrow("slot.reasoningEffort must be a nonempty explicit effort string.");
});

it("validates malformed recognized assignments in inactive profiles", () => {
  const raw = { models: { activeProfile: "active", profiles: { active: {}, archived: { "afg-review": { model: " " } } } } };
  expect(() => documents.validate(raw, "source")).toThrow('models.profiles.archived["afg-review"].model must be a nonempty model string.');
});
it("escaped stored profile and alias spelling retain the original error path", () => {
  const name = 'bad.name"\\folder';
  const raw = { models: { profiles: { [name]: { " ReVieW ": { model: 1 } } } } };
  expect(() => documents.validate(raw, "source")).toThrow(`models.profiles[${JSON.stringify(name)}][" ReVieW "].model must be a nonempty model string.`);
});
it("returns the original object and leaves opaque foreign fields untouched", () => {
  const raw = { version: 3, foreign: { keep: true }, models: { profiles: { work: { foreign: { reasoningEffort: null }, "afg-review": "inherit" } } } };
  expect(documents.validate(raw, "source")).toBe(raw);
});
it("rejects own undefined recognized fields before cloning", () => {
  expect(() => documents.validate({ models: { profiles: { work: { "afg-review": { reasoningEffort: undefined } } } } }, "source"))
    .toThrow('models.profiles.work["afg-review"].reasoningEffort');
});
it.each([undefined, null, [], 4, "", " \t"])("domain preserves container diagnostics for %j", (value) => {
  for (const [raw, field] of [[value, "root value"], [{ models: value }, "models"],
    [{ models: { profiles: value } }, "models.profiles"], [{ models: { profiles: { work: value } } }, "models.profiles.work"]]) {
    expect(() => documents.validate(raw, "identity")).toThrow(`Could not read model profile config at identity: ${field} must be an object.`);
  }
});
it.each([undefined, null, -1, 1.5, NaN, Infinity, "2"])("domain rejects unsafe version value %j", (version) => {
  expect(() => documents.validate({ version }, "source")).toThrow("version must be a positive safe integer.");
});
it.each([undefined, [], 4, false, {}])("domain rejects active selection value %j", (activeProfile) => {
  expect(() => documents.validate({ models: { activeProfile } }, "source")).toThrow("models.activeProfile must be a string or null.");
});
it.each([undefined, null, [], 4, "", " \t", " InHerit "])("domain validates all nontarget recognized fields %j", (value) => {
  const slot = (assignment: unknown) => ({ models: { profiles: { work: { main: "inherit", " ReVieW ": assignment } } } });
  if (value !== " InHerit ") {
    expect(() => documents.validate(slot(value), "source")).toThrow('models.profiles.work[" ReVieW "]');
    expect(() => documents.validate(slot({ model: value }), "source")).toThrow('models.profiles.work[" ReVieW "].model');
  }
  expect(() => documents.validate(slot({ reasoningEffort: value }), "source")).toThrow('models.profiles.work[" ReVieW "].reasoningEffort');
});
it.each([{}, { models: {} }, { models: { activeProfile: null } }, { models: { profiles: {} } },
  JSON.parse('{"version":9007199254740991,"models":{"activeProfile":"__proto__","profiles":{"__proto__":{"afg-review":"inherit","constructor":{"model":null}}}}}'),
  { version: 2, foreign: [], models: { memo: { keep: true }, profiles: { constructor: { main: {}, review: { model: " inherit ", reasoningEffort: " Custom ", note: [] } } } } }])
  ("domain preserves optional and foreign raw shape %j", (raw) => {
    const before = Object.getOwnPropertyDescriptors(raw);
    expect(documents.validate(raw, "source")).toBe(raw);
    expect(Object.getOwnPropertyDescriptors(raw)).toEqual(before);
  });

it("domain constructor is ambient-free and uses its concrete classification collaborator", () => {
  const normalize = vi.spyOn(policy, "normalize");
  const spies = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(process, "cwd")];
  try {
    const instance = new ProfileDocumentPolicy(policy);
    expect(normalize).not.toHaveBeenCalled();
    const raw = { models: { profiles: { work: { " ReVieW ": {}, foreign: null } } } };
    expect(instance.validate(raw, "diagnostic-only")).toBe(raw);
    instance.requireSupportedVersion(raw, "snapshot");
    instance.requireRecoveryMatch(true);
    expect(normalize.mock.calls).toEqual([[" ReVieW "], ["foreign"]]);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  } finally { normalize.mockRestore(); for (const spy of spies) spy.mockRestore(); }
});
it("resolved application and document domain graph obey inward boundaries", () => {
  const pending = [import.meta.resolve("../scripts/lib/model-profiles/application/read-profile-document-use-case.ts"),
    import.meta.resolve("../scripts/lib/model-profiles/application/prepare-profile-assignment-use-case.ts"),
    import.meta.resolve("../scripts/lib/model-profiles/domain/profile-assignment-policy.ts"),
    import.meta.resolve("../scripts/lib/model-profiles/domain/raw-profile-document-cloner.ts")];
  const visited = new Set<string>();
  while (pending.length) {
    const url = pending.pop()!;
    if (visited.has(url)) continue;
    visited.add(url);
    const source = fs.readFileSync(new URL(url), "utf8");
    expect(source).not.toMatch(/\b(process|globalThis|Buffer|ProcessEnv|require)\b/);
    const ast = ts.createSourceFile(url, source, ts.ScriptTarget.Latest);
    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node) && !(ts.isExportDeclaration(node) && node.moduleSpecifier)) continue;
      const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
      if (url.includes("/domain/")) expect(specifier).toMatch(/^\.\/[\w-]+\.js$/);
      else expect(specifier).toMatch(/^(\.\/|\.\.\/domain\/)[\w-]+\.js$/);
      const dependency = new URL(specifier.replace(/\.js$/, ".ts"), url).href;
      expect(dependency).toMatch(/\/model-profiles\/(domain|application)\/[\w-]+\.ts$/);
      pending.push(dependency);
    }
    if (url.endsWith("/stored-assignment.ts")) {
      const declaration = ast.statements.find(ts.isClassDeclaration)!;
      const constructor = declaration.members.find(ts.isConstructorDeclaration)!;
      expect(constructor.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword)).toBe(true);
      expect(constructor.body?.statements.length).toBe(0);
    }
  }
  const vertical = "../scripts/lib/model-profiles/";
  expect([...visited].sort()).toEqual([
    "application/prepare-profile-assignment-use-case.ts",
    "application/read-profile-document-use-case.ts", "application/profile-observation-port.ts", "application/profile-document-observation.ts",
    "domain/profile-document-policy.ts", "domain/profile-document.ts", "domain/agent-target-policy.ts", "domain/stored-assignment.ts",
    "domain/profile-assignment-policy.ts", "domain/assignment-patch.ts", "domain/raw-profile-document-cloner.ts",
  ].map((path) => import.meta.resolve(vertical + path)).sort());
});

it("exact supplied key wins among equivalent aliases", () => {
  expect(policy.select({ review: "a", "afg-review": "b" }, "review")).toBe("review");
});

it("ambiguous aliases without exact key are refused", () => {
  expect(() => policy.select({ review: "a", "afg-review": "b" }, " REVIEW "))
    .toThrow("Ambiguous assignment aliases");
});

it("sole padded case-varied alias retains actual spelling", () => {
  expect(policy.select({ " ReVieW ": "a" }, "afg-review")).toBe(" ReVieW ");
});

it("missing supported target uses canonical new key", () => {
  expect(policy.select({}, " DESIGN ")).toBe("afg-design");
});

it("different missing target uses its own canonical key", () => {
  expect(policy.select({}, "main")).toBe("afergon-ai");
});

it("unsupported requested own slot is refused before selection", () => {
  expect(() => policy.select({ stranger: "opaque" }, "stranger"))
    .toThrow(new Error(`Unsupported agent 'stranger'. Supported agents: ${canonical.join(", ")}`));
});

it("another exact supplied key wins among equivalent aliases", () => {
  expect(policy.select({ design: "a", "afg-design": "b" }, "afg-design")).toBe("afg-design");
});

it("inherited aliases cannot become targets and foreign slots stay opaque", () => {
  const profile = Object.assign(Object.create({ " ReVieW ": "inherited" }), { stranger: "opaque" });
  expect(policy.select(profile, "review")).toBe("afg-review");
});

it("nonenumerable exact own key wins over sole equivalent alias", () => {
  const profile = Object.defineProperty({ "afg-review": "a" }, "review", { value: "b" });
  expect(policy.select(profile, "review")).toBe("review");
});

const canonical: SupportedAgent[] = [
  "afergon-ai", "afg-debate", "afg-breakdown", "afg-specify",
  "afg-plannify", "afg-implement", "afg-review", "afg-design",
];
const aliases = ["orchestrator", "main", "debate", "breakdown", "specify", "plannify", "implement", "review", "design"];
it("preserves supported export order", () => {
  expect(SUPPORTED_AGENTS).toEqual(canonical);
  expect(SUPPORTED_AGENTS).toBe(DOMAIN_AGENTS);
  const typed: DomainAgent[] = canonical;
  expect(typed).toEqual(canonical);
});
it.each([...canonical, ...aliases])("normalizes supported vocabulary %s", (alias) => {
  const expected = canonical.find((name) => name === alias || name === `afg-${alias}`) ?? "afergon-ai";
  for (const input of [alias, ` ${alias.toUpperCase()} `, `\t${alias}\n`]) {
    expect(normalizeAgentName(input)).toBe(expected);
    expect(policy.normalize(input)).toBe(expected);
    expect(policy.select({}, input)).toBe(expected);
  }
});
it.each([undefined, null, 0, false, {}, [], "", " \t", "unknown", " REVIEWER ", "__proto__", "constructor"])
  ("preserves unsupported diagnostic for %j", (input) => {
    const shown = typeof input === "string" && input.trim() ? input : "";
    const message = `Unsupported agent '${shown}'. Supported agents: ${canonical.join(", ")}`;
    expect(() => normalizeAgentName(input)).toThrow(new Error(message));
    expect(() => policy.normalize(input)).toThrow(new Error(message));
    if (typeof input === "string") expect(() => policy.select({}, input)).toThrow(new Error(message));
  });

it("selection preserves frozen source own prototype-like fields without reading values", () => {
  const profile = Object.freeze({ ["__proto__"]: "opaque", constructor: "opaque", " ReVieW ": "a",
    get stranger(): never { throw new Error("Opaque value must not be read"); } });
  const before = Object.getOwnPropertyDescriptors(profile);
  const prototype = Object.getPrototypeOf(profile);
  expect(policy.select(profile, "afg-review")).toBe(" ReVieW ");
  expect(Object.getOwnPropertyDescriptors(profile)).toEqual(before);
  expect(Object.getPrototypeOf(profile)).toBe(prototype);
  expect(Object.hasOwn(profile, "__proto__")).toBe(true);
  expect(policy.select(Object.create({ review: "inherited" }), "review")).toBe("afg-review");
});

it("resolved domain is self-contained and construction performs no ambient I/O", () => {
  const resolved = import.meta.resolve("../scripts/lib/model-profiles/domain/agent-target-policy.ts");
  const source = fs.readFileSync(new URL(resolved), "utf8");
  const ast = ts.createSourceFile(resolved, source, ts.ScriptTarget.Latest);
  expect(ast.statements.filter((node) => ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier))).toEqual([]);
  expect(source).not.toMatch(/\b(process|globalThis|Buffer|require|import)\b/);
  const spies = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(process, "cwd")];
  try {
    expect(new AgentTargetPolicy().select({}, "main")).toBe("afergon-ai");
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  } finally { for (const spy of spies) spy.mockRestore(); }
});
