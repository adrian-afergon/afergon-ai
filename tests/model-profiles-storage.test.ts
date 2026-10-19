import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import { createDefaultConfig, getConfigPath, type saveConfig } from "../scripts/lib/model-profiles-config.js";
import * as legacyConfig from "../scripts/lib/model-profiles-config.js";
import { bindProfileRead } from "../scripts/lib/model-profiles/infrastructure/profile-read-composition.js";
import { ReadProfileDocumentUseCase } from "../scripts/lib/model-profiles/application/read-profile-document-use-case.js";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { NodeProfileStorageAdapter } from "../scripts/lib/model-profiles/infrastructure/node-profile-storage-adapter.js";
import { LegacyProfileDefaultsAdapter } from "../scripts/lib/model-profiles/infrastructure/legacy-profile-defaults-adapter.js";
import { LegacyAtomicProfileSaverAdapter } from "../scripts/lib/model-profiles/infrastructure/legacy-atomic-profile-saver-adapter.js";
import type { ProfileStoragePort } from "../scripts/lib/model-profiles/application/profile-storage-port.js";
import type { ProfileDocumentObservation } from "../scripts/lib/model-profiles/application/profile-document-observation.js";

const roots: string[] = [];
const validator = new ProfileDocumentPolicy(new AgentTargetPolicy());
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-storage-"));
  roots.push(root);
  const configPath = path.join(root, "config.json");
  const boundEnv = { AFERGON_AI_CONFIG_DIR: root };
  const save = vi.fn((_document: Parameters<typeof saveConfig>[0], _env?: NodeJS.ProcessEnv) => configPath);
  const saver = new LegacyAtomicProfileSaverAdapter(save, boundEnv);
  const storage: ProfileStoragePort = new NodeProfileStorageAdapter(configPath, fs, new LegacyProfileDefaultsAdapter(createDefaultConfig), saver);
  const document = validator.validate({ version: 1, models: { profiles: { work: { review: "custom/model" } } } }, configPath);
  return { root, configPath, boundEnv, save, storage, document };
}

it("storage delegates a validated legacy candidate to its captured saver environment", () => {
  const { storage, document, save, boundEnv, configPath } = fixture();
  expect(save).not.toHaveBeenCalled();
  storage.atomicPersist(document, { sourceIdentity: configPath, exists: false });
  expect(save.mock.calls).toEqual([[document, boundEnv]]);
  expect(save.mock.calls[0][0]).toBe(document);
  expect(save.mock.calls[0][1]).toBe(boundEnv);
});

it("storage rejects a mismatched source identity before saver or filesystem access", () => {
  const { storage, document, save, configPath } = fixture();
  const read = vi.spyOn(fs, "readFileSync");
  const source = { sourceIdentity: `${configPath}.other`, exists: false };
  expect(() => storage.atomicPersist(document, source)).toThrow("Profile source changed");
  expect(save).not.toHaveBeenCalled();
  expect(read).not.toHaveBeenCalled();
});

it("storage recheck rejects a newly appeared source and preserves external bytes", () => {
  const { storage, document, save, configPath } = fixture();
  const source = storage.observe().source;
  const external = Buffer.from('{ "external": "café ☕" }\n');
  fs.writeFileSync(configPath, external);
  const read = vi.spyOn(fs, "readFileSync");
  expect(() => storage.recheck(source)).toThrow("Profile source changed");
  expect(read.mock.calls).toEqual([[configPath]]);
  expect(() => storage.atomicPersist(document, source)).toThrow("Profile source changed");
  expect(save).not.toHaveBeenCalled();
  expect(fs.readFileSync(configPath)).toEqual(external);
});

it("storage refuses absent observations carrying bytes before invoking saver", () => {
  const { storage, document, save, configPath } = fixture();
  expect(() => storage.atomicPersist(document, { sourceIdentity: configPath, exists: false, sourceBytes: new Uint8Array() }))
    .toThrow("Absent observation must not carry source bytes");
  expect(save).not.toHaveBeenCalled();
});

it("storage accepts unchanged captured non-Buffer bytes in one bound read", () => {
  const { storage, configPath } = fixture();
  const original = '{\n "memo": "café ☕", "version": 1\n}\n';
  fs.writeFileSync(configPath, original);
  const source = storage.observe().source;
  expect(source.sourceBytes?.constructor).toBe(Uint8Array);
  const read = vi.spyOn(fs, "readFileSync");
  expect(() => storage.recheck(source)).not.toThrow();
  expect(read.mock.calls).toEqual([[configPath]]);
  expect(fs.readFileSync(configPath, "utf8")).toBe(original);
});

it("storage rejects same-length byte changes even when parsed JSON is equal", () => {
  const { storage, document, save, configPath } = fixture();
  fs.writeFileSync(configPath, '{"version":1, "memo":"☕"}\n');
  const source = storage.observe().source;
  const external = '{ "version":1,"memo":"☕"}\n';
  fs.writeFileSync(configPath, external);
  expect(() => storage.atomicPersist(document, source)).toThrow("Profile source changed");
  expect(save).not.toHaveBeenCalled();
  expect(fs.readFileSync(configPath, "utf8")).toBe(external);
});

it("storage rejects deleted captured source without recreating it", () => {
  const { storage, document, save, configPath } = fixture();
  fs.writeFileSync(configPath, "{}\n");
  const source = storage.observe().source;
  fs.unlinkSync(configPath);
  expect(() => storage.atomicPersist(document, source)).toThrow("Profile source changed");
  expect(save).not.toHaveBeenCalled();
  expect(fs.existsSync(configPath)).toBe(false);
});

it("storage rejects present observation without bytes before any read", () => {
  const { storage, configPath } = fixture();
  const read = vi.spyOn(fs, "readFileSync");
  expect(() => storage.recheck({ sourceIdentity: configPath, exists: true }))
    .toThrow("Present observation requires Uint8Array source bytes");
  expect(read).not.toHaveBeenCalled();
});

it("storage rejects arrays masquerading as captured bytes before any read", () => {
  const { storage, configPath } = fixture();
  const read = vi.spyOn(fs, "readFileSync");
  const source = { sourceIdentity: configPath, exists: true, sourceBytes: [] } as unknown as ProfileDocumentObservation;
  expect(() => storage.recheck(source)).toThrow("Present observation requires Uint8Array source bytes");
  expect(read).not.toHaveBeenCalled();
});

it("storage rejects prototype-only Uint8Array impostors before any read", () => {
  const { storage, configPath } = fixture();
  const read = vi.spyOn(fs, "readFileSync");
  const source = { sourceIdentity: configPath, exists: true, sourceBytes: Object.create(Uint8Array.prototype) };
  expect(() => storage.recheck(source)).toThrow("Present observation requires Uint8Array source bytes");
  expect(read).not.toHaveBeenCalled();
});

it("storage rejects non-boolean existence before reading or saving", () => {
  const { storage, document, save, configPath } = fixture();
  const read = vi.spyOn(fs, "readFileSync");
  const source = { sourceIdentity: configPath, exists: 0 } as unknown as ProfileDocumentObservation;
  expect(() => storage.atomicPersist(document, source)).toThrow("Observation exists must be a boolean");
  expect(read).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
});

it.each([undefined, null, 1, "true", {}, []])("storage characterizes non-boolean existence %j", (exists) => {
  const { storage, configPath } = fixture();
  const read = vi.spyOn(fs, "readFileSync");
  expect(() => storage.recheck({ sourceIdentity: configPath, exists } as ProfileDocumentObservation))
    .toThrow("Observation exists must be a boolean");
  expect(read).not.toHaveBeenCalled();
});

it.each([false, true])("storage preserves original read faults for captured existence %s", (exists) => {
  const { storage, document, save, configPath } = fixture();
  const original = Buffer.from("{}\n");
  if (exists) fs.writeFileSync(configPath, original);
  const source = storage.observe().source;
  const readFile = fs.readFileSync.bind(fs);
  for (const code of ["EACCES", "EIO"]) {
    const failure = Object.assign(new Error(code), { code });
    const read = vi.spyOn(fs, "readFileSync").mockImplementation((file, ...args) => {
      if (file === configPath) throw failure;
      return readFile(file, ...args);
    });
    expect(() => storage.recheck(source)).toThrow(failure);
    let caught: unknown;
    try { storage.atomicPersist(document, source); } catch (error) { caught = error; }
    expect(caught).toBe(failure);
    expect(read.mock.calls).toEqual([[configPath], [configPath]]);
    expect(save).not.toHaveBeenCalled();
    read.mockRestore();
    expect(fs.existsSync(configPath)).toBe(exists);
    if (exists) expect(fs.readFileSync(configPath)).toEqual(original);
  }
});

it("bound storage composes the actual saver with its private absolute environment", () => {
  const { boundEnv: env, document, configPath } = fixture();
  const save = vi.spyOn(legacyConfig, "saveConfig");
  const composition = bindProfileRead(env);
  env.AFERGON_AI_CONFIG_DIR = `${env.AFERGON_AI_CONFIG_DIR}/later`;
  const storage = composition.createStorage();
  const observed = storage.observe();
  storage.atomicPersist(document, observed.source);
  expect(observed.source).toEqual({ sourceIdentity: configPath, exists: false });
  expect(save.mock.calls[0][0]).toBe(document);
  const capturedEnv = save.mock.calls[0][1]!;
  expect(capturedEnv).not.toBe(env);
  expect(getConfigPath(capturedEnv)).toBe(configPath);
  expect(capturedEnv.AFERGON_AI_CONFIG_DIR).toBe(path.dirname(configPath));
  expect(storage.observe().document).toEqual(document);
  expect(fs.existsSync(getConfigPath(env))).toBe(false);
});

it("storage constructors only assign explicit collaborators", () => {
  const { boundEnv, configPath, save } = fixture();
  const createDefaults = vi.fn(createDefaultConfig);
  const ambient = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(process, "cwd")];
  const saver = new LegacyAtomicProfileSaverAdapter(save, boundEnv);
  const defaults = new LegacyProfileDefaultsAdapter(createDefaults);
  new NodeProfileStorageAdapter(configPath, fs, defaults, saver);
  for (const spy of [...ambient, save, createDefaults]) expect(spy).not.toHaveBeenCalled();
});

it("application accepts a complete memory storage capability without ambient I/O", () => {
  const source: ProfileDocumentObservation = { sourceIdentity: "memory:legacy", exists: true, sourceBytes: new Uint8Array([123, 125]) };
  const document = validator.validate({ version: 1 }, source.sourceIdentity);
  const storage: ProfileStoragePort = {
    observe: vi.fn(() => ({ document, source })),
    recheck: vi.fn(),
    atomicPersist: vi.fn(),
  };
  const ambient = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(process, "cwd")];
  const reader = new ReadProfileDocumentUseCase(storage, validator);
  const loaded = reader.execute();
  storage.recheck(loaded.source);
  storage.atomicPersist(document, loaded.source);
  expect(loaded.document).toBe(document);
  expect(loaded.source.sourceBytes).toEqual(source.sourceBytes);
  expect(loaded.source.sourceBytes).not.toBe(source.sourceBytes);
  expect(storage.recheck).toHaveBeenCalledWith(loaded.source);
  expect(storage.atomicPersist).toHaveBeenCalledWith(document, loaded.source);
  for (const spy of ambient) expect(spy).not.toHaveBeenCalled();
});

it.each([new Uint8Array(), new Uint8Array([1]), new Uint8ClampedArray([1]), new DataView(new ArrayBuffer(1))])
  ("storage characterizes captured byte-view kind %j", (sourceBytes) => {
    const { storage, configPath } = fixture();
    fs.writeFileSync(configPath, "{}");
    const source = { sourceIdentity: configPath, exists: true, sourceBytes } as ProfileDocumentObservation;
    expect(() => storage.recheck(source)).toThrow(sourceBytes instanceof Uint8Array
      ? "Profile source changed" : "Present observation requires Uint8Array source bytes");
    expect(fs.readFileSync(configPath, "utf8")).toBe("{}");
  });

it("storage respects a non-Buffer captured subarray offset and length", () => {
  const { storage, document, configPath, save } = fixture();
  fs.writeFileSync(configPath, "{}");
  const backing = new Uint8Array([0, 123, 125, 0]);
  const source = { sourceIdentity: configPath, exists: true, sourceBytes: backing.subarray(1, 3) };
  storage.atomicPersist(document, source);
  expect(save).toHaveBeenCalledTimes(1);
  expect(fs.readFileSync(configPath, "utf8")).toBe("{}");
});

const builtComposition = new URL("../dist/scripts/lib/model-profiles/infrastructure/profile-read-composition.js", import.meta.url).href;
const builtValidator = new URL("../dist/scripts/lib/model-profiles/domain/profile-document-policy.js", import.meta.url).href;
const builtAgents = new URL("../dist/scripts/lib/model-profiles/domain/agent-target-policy.js", import.meta.url).href;
const builtLegacy = new URL("../dist/scripts/lib/model-profiles-config.js", import.meta.url).href;
const storageProgram = `import fs from 'node:fs'; import path from 'node:path';
  import { bindProfileRead } from ${JSON.stringify(builtComposition)};
  import { ProfileDocumentPolicy } from ${JSON.stringify(builtValidator)};
  import { AgentTargetPolicy } from ${JSON.stringify(builtAgents)};
  import { getConfigPath } from ${JSON.stringify(builtLegacy)};`;

it.each([
  ["AFERGON override", { AFERGON_AI_CONFIG_DIR: "relative-config", XDG_CONFIG_HOME: "relative-xdg", HOME: "relative-home" }],
  ["XDG", { XDG_CONFIG_HOME: "relative-xdg", HOME: "relative-home" }],
  ["HOME", { HOME: "relative-home" }],
  ["cwd fallback", {}],
])("emitted storage pins %s across child cwd and caller environment mutation", (_name, initialEnv) => {
  const { root } = fixture();
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `${storageProgram}
    const env = ${JSON.stringify(initialEnv)};
    const expected = path.resolve(getConfigPath(env));
    const composition = bindProfileRead(env);
    const storage = composition.createStorage();
    const before = storage.observe();
    const policy = new ProfileDocumentPolicy(new AgentTargetPolicy());
    const candidate = policy.validate({ version: 1, memo: 'café ☕', models: { profiles: { work: { review: 'custom/model' } } } }, expected);
    const later = path.resolve('later'); fs.mkdirSync(later); process.chdir(later);
    env.AFERGON_AI_CONFIG_DIR = 'retarget'; env.XDG_CONFIG_HOME = 'new-xdg'; env.HOME = 'new-home';
    storage.recheck(before.source); storage.atomicPersist(candidate, before.source);
    const after = storage.observe(); storage.recheck(after.source);
    const reader = composition.createReader().execute();
    console.log(JSON.stringify({ expected, before, after, reader, text: fs.readFileSync(expected, 'utf8'),
      laterFiles: fs.readdirSync(later), wrongPathExists: fs.existsSync(getConfigPath(env)) }));`],
  { cwd: root, encoding: "utf8", env: { ...process.env, HOME: root, XDG_CONFIG_HOME: root, XDG_STATE_HOME: root, AFERGON_AI_CONFIG_DIR: root } });
  expect(result.status, result.stderr).toBe(0);
  const output = JSON.parse(result.stdout);
  const expected = path.resolve(root, ...(_name === "AFERGON override" ? ["relative-config"]
    : _name === "XDG" ? ["relative-xdg", "afergon-ai"]
      : _name === "HOME" ? ["relative-home", ".config", "afergon-ai"] : [".config", "afergon-ai"]), "config.json");
  expect(output.expected).toBe(expected);
  expect(path.basename(expected)).toBe("config.json");
  expect(output.before.source).toEqual({ sourceIdentity: expected, exists: false });
  expect(output.after.source.sourceIdentity).toBe(expected);
  expect(output.after.source.exists).toBe(true);
  expect(Object.values(output.after.source.sourceBytes)).toEqual([...Buffer.from(output.text)]);
  expect(output.reader.document).toEqual(output.after.document);
  expect(output.after.document).toEqual(JSON.parse(output.text));
  expect(output.after.document.models.profiles.work.review).toBe("custom/model");
  expect(output.after.document.memo).toBe("café ☕");
  expect(output.laterFiles).toEqual([]);
  expect(output.wrongPathExists).toBe(false);
});
