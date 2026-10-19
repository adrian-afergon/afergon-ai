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
  expect(Buffer.byteLength(external)).toBe(source.sourceBytes!.byteLength);
  expect(JSON.parse(external)).toEqual(JSON.parse(Buffer.from(source.sourceBytes!).toString("utf8")));
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

it.each([
  { kind: "undefined", exists: undefined }, { kind: "null", exists: null },
  { kind: "number", exists: 1 }, { kind: "string", exists: "true" },
  { kind: "object", exists: {} }, { kind: "array", exists: [] },
])("storage characterizes non-boolean existence $kind", ({ exists }) => {
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

it.each([
  { kind: "empty Uint8Array", sourceBytes: new Uint8Array() },
  { kind: "short Uint8Array", sourceBytes: new Uint8Array([1]) },
  { kind: "Uint8ClampedArray", sourceBytes: new Uint8ClampedArray([1]) },
  { kind: "DataView", sourceBytes: new DataView(new ArrayBuffer(1)) },
])("storage characterizes captured byte-view kind $kind", ({ sourceBytes }) => {
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

function realFixture(present: boolean) {
  const setup = fixture();
  const original = '{\n  "version": 1, "memo": "original café ☕", "models": {"profiles": {"work": {"review": "old/model"}}}\n}\n';
  validator.validate(JSON.parse(original), setup.configPath);
  if (present) fs.writeFileSync(setup.configPath, original);
  const storage = bindProfileRead(setup.boundEnv).createStorage();
  return { ...setup, storage, original, source: storage.observe().source };
}

function saverFault(setup: ReturnType<typeof realFixture>, stage: string, cleanupFailure = false, cleanupCloseFailure = false) {
  const { root, configPath, document } = setup;
  const failure = new Error(`injected ${stage}`);
  const cleanupError = new Error("injected cleanup failure");
  const events: string[] = [];
  const descriptors = new Map<number, "temp" | "dir">();
  const original = {
    mkdir: fs.mkdirSync.bind(fs), open: fs.openSync.bind(fs), write: fs.writeFileSync.bind(fs),
    fsync: fs.fsyncSync.bind(fs), close: fs.closeSync.bind(fs), rename: fs.renameSync.bind(fs),
    remove: fs.rmSync.bind(fs), stringify: JSON.stringify.bind(JSON),
  };
  const isTemp = (file: unknown) => typeof file === "string" && path.dirname(file) === root && /^\.config\.json\..+\.tmp$/.test(path.basename(file));
  vi.spyOn(fs, "mkdirSync").mockImplementation((folder, options) => {
    if (folder === root && stage === "mkdir") throw failure;
    return original.mkdir(folder, options);
  });
  vi.spyOn(fs, "openSync").mockImplementation((file, flags, mode) => {
    const kind = isTemp(file) && flags === "wx" ? "temp" : file === root && flags === "r" ? "dir" : undefined;
    if (kind) events.push(`${kind}-open`);
    if (kind === "temp" && stage === "open") throw failure;
    let descriptor: number;
    try { descriptor = original.open(file, flags, mode); }
    catch (error) {
      if (kind === "dir") events.push("dir-open-unsupported");
      throw error;
    }
    if (kind) descriptors.set(descriptor, kind);
    return descriptor;
  });
  vi.spyOn(JSON, "stringify").mockImplementation((value, replacer, space) => {
    if (value === document) {
      events.push("serialize");
      if (stage === "serialize") throw failure;
    }
    return original.stringify(value, replacer, space);
  });
  vi.spyOn(fs, "writeFileSync").mockImplementation((file, data, options) => {
    if (typeof file === "number" && descriptors.get(file) === "temp") {
      events.push("temp-write");
      if (stage === "write") throw failure;
    }
    return original.write(file, data, options);
  });
  vi.spyOn(fs, "fsyncSync").mockImplementation((descriptor) => {
    const kind = descriptors.get(descriptor);
    if (kind) events.push(`${kind}-fsync`);
    if ((kind === "temp" && stage === "fsync") || (kind === "dir" && stage === "dir-fsync")) throw failure;
    return original.fsync(descriptor);
  });
  let closeFailed = false;
  vi.spyOn(fs, "closeSync").mockImplementation((descriptor) => {
    const kind = descriptors.get(descriptor);
    if (kind) events.push(`${kind}-close`);
    if (kind === "temp" && ((!closeFailed && stage === "close") || cleanupCloseFailure)) {
      closeFailed = true;
      throw cleanupCloseFailure ? cleanupError : failure;
    }
    original.close(descriptor);
    descriptors.delete(descriptor);
  });
  vi.spyOn(fs, "renameSync").mockImplementation((from, to) => {
    if (isTemp(from) && to === configPath) {
      events.push("rename");
      if (stage === "rename") throw failure;
    }
    return original.rename(from, to);
  });
  vi.spyOn(fs, "rmSync").mockImplementation((file, options) => {
    if (isTemp(file)) {
      events.push("temp-remove");
      if (cleanupFailure) throw cleanupError;
    }
    return original.remove(file, options);
  });
  return { failure, cleanupError, events, restore() {
    vi.restoreAllMocks();
    // Release test-owned descriptors even when the injected cleanup close fails.
    for (const descriptor of descriptors.keys()) original.close(descriptor);
    descriptors.clear();
  } };
}

const precommitStages = ["mkdir", "open", "serialize", "write", "fsync", "close", "rename"];
const precommitCases = [false, true].flatMap((present) => precommitStages.map((stage) => ({ present, stage })));
it.each(precommitCases)("real saver preserves captured existence $present through $stage fault and retry", ({ present, stage }) => {
  const setup = realFixture(present);
  const fault = saverFault(setup, stage);
  let caught: unknown;
  try { setup.storage.atomicPersist(setup.document, setup.source); }
  catch (error) { caught = error; }
  finally { fault.restore(); }
  expect(caught, stage).toBe(fault.failure);
  expect(fs.existsSync(setup.configPath), stage).toBe(present);
  if (present) expect(fs.readFileSync(setup.configPath, "utf8"), stage).toBe(setup.original);
  expect(fs.readdirSync(setup.root), stage).toEqual(present ? ["config.json"] : []);
  if (stage === "close") expect(fault.events.filter((event) => event === "temp-close")).toHaveLength(2);
  setup.storage.atomicPersist(setup.document, setup.source);
  expect(setup.storage.observe().document, stage).toEqual(setup.document);
  expect(fs.readFileSync(setup.configPath, "utf8"), stage).toBe(`${JSON.stringify(setup.document, null, 2)}\n`);
  expect(fs.readdirSync(setup.root), stage).toEqual(["config.json"]);
});

it.each(["rename", "write"])("real saver retains the original %s error when cleanup also fails", (stage) => {
  const setup = realFixture(true);
  const fault = saverFault(setup, stage, true, stage === "write");
  let caught: unknown;
  try { setup.storage.atomicPersist(setup.document, setup.source); }
  catch (error) { caught = error; }
  finally { fault.restore(); }
  expect(caught).toBe(fault.failure);
  expect(caught).not.toBe(fault.cleanupError);
  expect(fs.readFileSync(setup.configPath, "utf8")).toBe(setup.original);
  expect(fault.events).toContain("temp-remove");
  const retained = fs.readdirSync(setup.root).filter((file) => file.endsWith(".tmp"));
  expect(retained).toHaveLength(1);
  // No false automatic-retry/clean-directory promise after cleanup failure.
});

it("real saver commits at rename and suppresses only the later directory fsync fault", () => {
  const setup = realFixture(true);
  const fault = saverFault(setup, "dir-fsync");
  let caught: unknown;
  try { setup.storage.atomicPersist(setup.document, setup.source); }
  catch (error) { caught = error; }
  finally { fault.restore(); }
  expect(caught).toBeUndefined();
  const committed = ["temp-open", "serialize", "temp-write", "temp-fsync", "temp-close", "rename"];
  if (fault.events.includes("dir-fsync")) {
    expect(fault.events).toEqual([...committed, "dir-open", "dir-fsync", "dir-close"]);
  } else {
    // Some native filesystems reject opening directories before fsync is possible.
    expect(fault.events).toEqual([...committed, "dir-open", "dir-open-unsupported"]);
  }
  expect(setup.storage.observe().document).toEqual(setup.document);
  expect(fs.readdirSync(setup.root)).toEqual(["config.json"]);
});

it("real storage reads once before invoking its injected saver", () => {
  const { storage, document, configPath, save } = fixture();
  fs.writeFileSync(configPath, "{}");
  const source = storage.observe().source;
  const read = vi.spyOn(fs, "readFileSync");
  save.mockImplementation(() => {
    expect(read.mock.calls).toEqual([[configPath]]);
    return configPath;
  });
  storage.atomicPersist(document, source);
  expect(save).toHaveBeenCalledTimes(1);
  expect(read.mock.invocationCallOrder[0]).toBeLessThan(save.mock.invocationCallOrder[0]);
});

it("emitted application imports perform no config filesystem or host I/O", () => {
  const { root } = fixture();
  const dist = fileURLToPath(new URL("../dist/", import.meta.url));
  const application = new URL("../dist/scripts/lib/model-profiles/application/", import.meta.url).href;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import fs from 'node:fs'; import childProcess from 'node:child_process'; import { fileURLToPath } from 'node:url';
    const originalRead = fs.readFileSync.bind(fs); const originalOpen = fs.openSync.bind(fs); const forbidden = [];
    fs.readFileSync = (file, ...args) => {
      const name = file instanceof URL ? fileURLToPath(file) : String(file);
      if (!name.startsWith(${JSON.stringify(dist)})) { forbidden.push(name); throw new Error('Unexpected config read: ' + name); }
      return originalRead(file, ...args);
    };
    fs.openSync = (file, flags, ...args) => {
      const name = file instanceof URL ? fileURLToPath(file) : String(file);
      if (flags === 'r' && name.startsWith(${JSON.stringify(dist)})) return originalOpen(file, flags, ...args);
      forbidden.push('openSync:' + name); throw new Error('Unexpected openSync');
    };
    for (const method of ['writeFileSync', 'mkdirSync', 'renameSync', 'rmSync']) {
      fs[method] = () => { forbidden.push(method); throw new Error('Unexpected ' + method); };
    }
    for (const method of ['spawnSync', 'execSync', 'execFileSync']) {
      childProcess[method] = () => { forbidden.push(method); throw new Error('Unexpected host call'); };
    }
    process.cwd = () => { forbidden.push('cwd'); throw new Error('Unexpected cwd'); };
    for (const entry of ['profile-storage-port', 'read-profile-document-use-case', 'prepare-profile-assignment-use-case']) {
      await import(${JSON.stringify(application)} + entry + '.js');
    }
    console.log(JSON.stringify(forbidden));`],
  { cwd: root, encoding: "utf8", env: { ...process.env, HOME: root, XDG_CONFIG_HOME: root, XDG_STATE_HOME: root, AFERGON_AI_CONFIG_DIR: root } });
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual([]);
  expect(fs.readdirSync(root)).toEqual([]);
});

it("keeps the storage primitive outside the live model-profile facade", async () => {
  const live = await import("../scripts/lib/model-profiles.js");
  for (const name of ["NodeProfileStorageAdapter", "LegacyAtomicProfileSaverAdapter", "atomicPersist", "updateProfileAssignment"]) {
    expect(Object.hasOwn(live, name)).toBe(false);
  }
});
