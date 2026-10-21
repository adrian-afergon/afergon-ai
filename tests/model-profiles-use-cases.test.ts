import fs from "node:fs";
import os from "node:os";
import childProcess from "node:child_process";
import { afterEach, expect, it, vi } from "vitest";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import type { ObservedProfile } from "../scripts/lib/model-profiles/application/profile-document-observation.js";
import { ReadProfileDocumentUseCase } from "../scripts/lib/model-profiles/application/read-profile-document-use-case.js";
import { PrepareProfileAssignmentUseCase } from "../scripts/lib/model-profiles/application/prepare-profile-assignment-use-case.js";
import { ProfileAssignmentPolicy, type PreparedAssignment } from "../scripts/lib/model-profiles/domain/profile-assignment-policy.js";
import { RawProfileDocumentCloner } from "../scripts/lib/model-profiles/domain/raw-profile-document-cloner.js";
import { MemorySnapshots, updateMemory } from "./model-profiles-update-memory.js";
import { UpdateProfileAssignmentUseCase } from "../scripts/lib/model-profiles/application/update-profile-assignment-use-case.js";

afterEach(() => vi.restoreAllMocks());

it("preparer delegates exact input and result without constructor activity", () => {
  const agents = new AgentTargetPolicy();
  const documents = new ProfileDocumentPolicy(agents);
  const cloner = new RawProfileDocumentCloner();
  const policy = new ProfileAssignmentPolicy(documents, agents, cloner);
  const result: PreparedAssignment = { document: {}, changed: false, migrationRequired: false, version: 1 };
  const prepare = vi.spyOn(policy, "prepare").mockReturnValue(result);
  const validate = vi.spyOn(documents, "validate");
  const clone = vi.spyOn(cloner, "clone");
  try {
    const useCase = new PrepareProfileAssignmentUseCase(policy);
    expect(prepare).not.toHaveBeenCalled();
    const input = { document: {}, sourceIdentity: "memory:prepare", profileName: "work", agentName: "review", patch: {} };
    expect(useCase.execute(input)).toBe(result);
    expect(prepare.mock.calls).toEqual([[input]]);
    expect(prepare.mock.calls[0][0]).toBe(input);
    expect(validate).not.toHaveBeenCalled();
    expect(clone).not.toHaveBeenCalled();
  } finally { prepare.mockRestore(); validate.mockRestore(); clone.mockRestore(); }
});

const validator = new ProfileDocumentPolicy(new AgentTargetPolicy());
it("S12 migration snapshots original source before candidate promotion", () => {
  const f = updateMemory();
  f.acquire.mockImplementation(input => {
    const loaded = f.read.mock.results[0].value;
    const candidate = f.prepare.mock.results[0].value.document;
    expect(input).toEqual({ source: loaded.source, recoveryDocument: f.document });
    expect(input.source).toBe(loaded.source);
    expect(input.recoveryDocument).toBe(f.document);
    expect(candidate).not.toBe(input.recoveryDocument);
    expect(candidate.version).toBe(1);
    return { snapshotPath: "memory:backup", disposition: "created", complete: true };
  });
  expect(f.useCase.execute(f.input)).toEqual({ configPath: "configured:memory", version: 2, snapshotPath: "memory:backup" });
  expect(f.acquire).toHaveBeenCalledOnce();
  expect(f.persist).toHaveBeenCalledOnce();
  expect(f.persist.mock.calls[0][0].version).toBe(2);
  expect(f.persist.mock.calls[0][1]).toBe(f.read.mock.results[0].value.source);
  expect(f.document.version).toBe(1);
});

it("preparer varies supplied input without caching or rewriting results", () => {
  const policy = new ProfileAssignmentPolicy(validator, new AgentTargetPolicy(), new RawProfileDocumentCloner());
  const prepare = vi.spyOn(policy, "prepare");
  try {
    const useCase = new PrepareProfileAssignmentUseCase(policy);
    const first = { document: {}, sourceIdentity: "memory:first", profileName: "work", agentName: "review", patch: {} };
    const second = { document: {}, sourceIdentity: "memory:second", profileName: "archive", agentName: "implement", patch: { model: "different" } };
    expect(useCase.execute(first)).toEqual({ document: {}, changed: false, migrationRequired: false, version: 1, agentKey: "afg-review" });
    const result = useCase.execute(second);
    expect(result).toEqual({ document: { models: { profiles: { archive: { "afg-implement": { model: "different" } } } } }, changed: true, migrationRequired: true, version: 2, agentKey: "afg-implement" });
    expect(result).toBe(prepare.mock.results[1].value);
    expect(prepare.mock.calls[0][0]).toBe(first);
    expect(prepare.mock.calls[1][0]).toBe(second);
  } finally { prepare.mockRestore(); }
});
it("S12 T1 snapshot failure prevents promotion and persistence", () => {
  const f = updateMemory();
  const failure = new Error("snapshot refused");
  f.acquire.mockImplementation(() => { throw failure; });
  try {
    expect(() => f.useCase.execute(f.input)).toThrow(failure);
    expect(f.persist).not.toHaveBeenCalled();
    expect(f.prepare.mock.results[0].value.document.version).toBe(1);
    expect(f.storage.currentBytes).toBe(f.bytes);
  } finally { vi.restoreAllMocks(); }
});
it("S12 T2 second recheck protects external bytes after completed backup", () => {
  const f = updateMemory();
  const external = new Uint8Array([9, 8]);
  f.acquire.mockImplementation(input => {
    const receipt = MemorySnapshots.prototype.acquire.call(f.snapshots, input);
    f.storage.currentBytes = external;
    return receipt;
  });
  try {
    expect(() => f.useCase.execute(f.input)).toThrow("Profile source changed");
    expect(f.recheck).toHaveBeenCalledTimes(2);
    expect(f.persist).not.toHaveBeenCalled();
    expect(f.storage.currentBytes).toBe(external);
    expect(f.snapshots.backup).toEqual(f.bytes);
  } finally { vi.restoreAllMocks(); }
});
it("S12 refuses incomplete receipt before promotion", () => {
  const f = updateMemory();
  f.acquire.mockReturnValue({ snapshotPath: "incomplete", complete: false } as never);
  expect(() => f.useCase.execute(f.input)).toThrow("Migration snapshot is incomplete");
  expect(f.prepare.mock.results[0].value.document.version).toBe(1);
  expect(f.persist).not.toHaveBeenCalled();
});
it("S12 future source no-op uses preparation eligibility before preparation", () => {
  const f = updateMemory({ version: 3 });
  expect(() => f.useCase.execute({ ...f.input, patch: {} })).toThrow(new Error("Cannot prepare assignment for unsupported profile version 3."));
  expect(f.prepare).not.toHaveBeenCalled();
  expect(f.recheck).not.toHaveBeenCalled();
  expect(f.acquire).not.toHaveBeenCalled();
  expect(f.persist).not.toHaveBeenCalled();
});
it("S12 rejects whole invalid prepared candidate before recheck", () => {
  const f = updateMemory();
  f.prepare.mockReturnValue({ document: { models: null }, changed: true, migrationRequired: true, version: 2 });
  expect(() => f.useCase.execute(f.input)).toThrow("models must be an object");
  expect(f.recheck).not.toHaveBeenCalled();
  expect(f.acquire).not.toHaveBeenCalled();
  expect(f.persist).not.toHaveBeenCalled();
});
it("S12 refuses future prepared no-op before recheck or downgrade", () => {
  const f = updateMemory();
  f.prepare.mockReturnValue({ document: { version: 3 }, changed: false, migrationRequired: false, version: 3 });
  expect(() => f.useCase.execute(f.input)).toThrow("Cannot update unsupported profile version 3");
  expect(f.recheck).not.toHaveBeenCalled();
  expect(f.acquire).not.toHaveBeenCalled();
  expect(f.persist).not.toHaveBeenCalled();
});
it("S12 no-op returns effective version without write-side calls", () => {
  const f = updateMemory();
  f.snapshots.backup = new Uint8Array([77]);
  expect(f.useCase.execute({ ...f.input, patch: {} })).toEqual({ configPath: "configured:memory", version: 1 });
  expect(f.recheck).not.toHaveBeenCalled();
  expect(f.acquire).not.toHaveBeenCalled();
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.storage.currentBytes).toBe(f.bytes);
  expect(f.snapshots.backup).toEqual(new Uint8Array([77]));
});
it("S12 no-op keeps existing version two", () => {
  const f = updateMemory({ version: 2 });
  expect(f.useCase.execute({ ...f.input, patch: {} })).toEqual({ configPath: "configured:memory", version: 2 });
  expect(f.recheck).not.toHaveBeenCalled();
});
it("S12 legacy edit preserves absent raw version and prior backup", () => {
  const f = updateMemory({ models: { profiles: { work: { review: "old", "afg-specify": { reasoningEffort: "low" } } } } });
  f.snapshots.backup = new Uint8Array([77]);
  expect(f.useCase.execute({ ...f.input, patch: { model: "new" } })).toEqual({ configPath: "configured:memory", version: 1 });
  expect(f.acquire).not.toHaveBeenCalled();
  expect(f.storage.saved).not.toHaveProperty("version");
  expect(f.storage.saved?.models).toEqual({ profiles: { work: { review: "new", "afg-specify": { reasoningEffort: "low" } } } });
  expect(f.snapshots.backup).toEqual(new Uint8Array([77]));
});
it("S12 final whole validation immediately precedes last recheck and persist", () => {
  const f = updateMemory();
  const validate = f.validator.validate.bind(f.validator);
  vi.spyOn(f.validator, "validate").mockImplementation((raw, identity) => {
    const document = validate(raw, identity);
    f.storage.log.push(`validate:${document.version ?? 1}`);
    return document;
  });
  f.useCase.execute(f.input);
  expect(f.storage.log.slice(-3)).toEqual(["validate:2", "recheck", "persist"]);
  expect(f.recheck.mock.calls.every(([source]) => source === f.read.mock.results[0].value.source)).toBe(true);
});
it.each(["read", "first recheck", "persist"])("S12 propagates exact %s failure without later capabilities", stage => {
  const f = updateMemory();
  const failure = new Error(stage);
  if (stage === "read") vi.spyOn(f.storage, "observe").mockImplementation(() => { throw failure; });
  if (stage === "first recheck") f.recheck.mockImplementation(() => { throw failure; });
  if (stage === "persist") f.persist.mockImplementation(() => { throw failure; });
  let caught: unknown;
  try { f.useCase.execute(f.input); } catch (error) { caught = error; }
  expect(caught).toBe(failure);
  expect(f.storage.currentBytes).toBe(f.bytes);
  if (stage !== "persist") {
    expect(f.acquire).not.toHaveBeenCalled();
    expect(f.persist).not.toHaveBeenCalled();
  } else expect(f.snapshots.backup).toEqual(f.bytes);
});

it.each(["source", "patch", "final candidate"])("S12 validates %s before later capabilities", stage => {
  const f = updateMemory(stage === "source" ? { models: null } : undefined);
  const validate = f.validator.validate.bind(f.validator);
  if (stage === "final candidate") vi.spyOn(f.validator, "validate").mockImplementation((raw, identity) => {
    if ((raw as { version?: number }).version === 2) throw new Error("final candidate refused");
    return validate(raw, identity);
  });
  const patch = stage === "patch" ? { reasoningEffort: "inherit" } : f.input.patch;
  expect(() => f.useCase.execute({ ...f.input, patch })).toThrow();
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.recheck).toHaveBeenCalledTimes(stage === "final candidate" ? 1 : 0);
  expect(f.acquire).toHaveBeenCalledTimes(stage === "final candidate" ? 1 : 0);
});

it("S12 v2 change never snapshots and absent capture remains absent", () => {
  const f = updateMemory({ version: 2, models: { profiles: {} } }, false);
  expect(f.useCase.execute(f.input)).toEqual({ configPath: "configured:memory", version: 2 });
  expect(f.acquire).not.toHaveBeenCalled();
  expect(f.storage.saved?.version).toBe(2);
  expect(f.persist.mock.calls[0][1]).toBe(f.read.mock.results[0].value.source);
  expect(f.persist.mock.calls[0][1].sourceBytes).toBeUndefined();
});

it("S12 constructors are cold and real memory execution has no ambient authority", () => {
  const f = updateMemory();
  expect(f.storage.log).toEqual([]);
  expect(f.read).not.toHaveBeenCalled();
  expect(f.prepare).not.toHaveBeenCalled();
  const spies = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"),
    vi.spyOn(fs, "openSync"), vi.spyOn(fs, "renameSync"), vi.spyOn(os, "homedir"),
    vi.spyOn(childProcess, "spawnSync"), vi.spyOn(childProcess, "execFileSync")];
  const env = Object.getOwnPropertyDescriptor(process, "env")!;
  let result: unknown;
  try {
    Object.defineProperty(process, "env", { configurable: true, get() { throw new Error("Ambient environment access"); } });
    const useCase = new UpdateProfileAssignmentUseCase(f.reader, f.preparer, f.validator, f.storage, f.snapshots);
    result = useCase.execute(f.input);
  } finally { Object.defineProperty(process, "env", env); }
  expect(result).toEqual({ configPath: "configured:memory", version: 2, snapshotPath: "memory:backup" });
  for (const spy of spies) expect(spy).not.toHaveBeenCalled();
});
it("preparer propagates the exact policy failure without retry", () => {
  const policy = new ProfileAssignmentPolicy(validator, new AgentTargetPolicy(), new RawProfileDocumentCloner());
  const failure = new Error("policy refused");
  const prepare = vi.spyOn(policy, "prepare").mockImplementation(() => { throw failure; });
  try {
    const useCase = new PrepareProfileAssignmentUseCase(policy);
    const input = { document: {}, sourceIdentity: "memory:failure", profileName: "work", agentName: "review", patch: {} };
    let caught: unknown;
    try { useCase.execute(input); } catch (error) { caught = error; }
    expect(caught).toBe(failure);
    expect(prepare.mock.calls).toEqual([[input]]);
  } finally { prepare.mockRestore(); }
});
it.each(["Uint8Array", "Buffer"])("reader keeps %s capture independent in both directions without ambient I/O", (kind) => {
  const bytes = kind === "Buffer" ? Buffer.from([7, 8]) : new Uint8Array([7, 8]);
  const observed = { document: {}, source: { sourceIdentity: "configured:token", exists: true, sourceBytes: bytes }, originalText: "unchanged" };
  const spies = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(process, "cwd")];
  const { reader, observe, validate } = memory(observed);
  try {
    expect(observe).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
    const loaded = reader.execute(); expect(loaded).not.toBe(observed); expect(loaded.source).not.toBe(observed.source);
    expect(loaded.source.sourceBytes).not.toBe(bytes); expect(loaded.source.sourceBytes?.constructor).toBe(Uint8Array);
    loaded.source.sourceBytes![0] = 1; expect(bytes[0]).toBe(7);
    bytes[1] = 2; expect(loaded.source.sourceBytes![1]).toBe(8);
    observed.source.sourceIdentity = "producer:new"; observed.source.exists = false; observed.source.sourceBytes = new Uint8Array();
    expect(loaded.source.sourceIdentity).toBe("configured:token"); expect(loaded.source.exists).toBe(true);
    loaded.source.sourceIdentity = "consumer:new"; expect(observed.source.sourceIdentity).toBe("producer:new");
    expect(loaded.originalText).toBe("unchanged"); expect(observe).toHaveBeenCalledTimes(1);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  } finally { validate.mockRestore(); for (const spy of spies) spy.mockRestore(); }
});
it("reader detaches captured bytes from producer mutation", () => {
  const observed = { document: {}, source: { sourceIdentity: "memory:bytes", exists: true, sourceBytes: new Uint8Array([1, 2]) } };
  const { reader, validate } = memory(observed);
  try {
    const loaded = reader.execute(); observed.source.sourceBytes[0] = 9;
    expect(loaded.source.sourceBytes).toEqual(new Uint8Array([1, 2]));
  } finally { validate.mockRestore(); }
});
it("reader refuses prototype-only byte impostor with consistency diagnostic", () => {
  const { reader, validate } = memory({ document: {}, source: { sourceIdentity: "memory:impostor", exists: true, sourceBytes: Object.create(Uint8Array.prototype) } });
  try { expect(() => reader.execute()).toThrow("Present observation requires Uint8Array source bytes"); }
  finally { validate.mockRestore(); }
});
it("reader refuses array masquerading as captured Uint8Array", () => {
  const sourceBytes = [1, 2] as unknown as Uint8Array;
  const { reader, validate } = memory({ document: {}, source: { sourceIdentity: "memory:fake", exists: true, sourceBytes } });
  try { expect(() => reader.execute()).toThrow("Present observation requires Uint8Array source bytes"); }
  finally { validate.mockRestore(); }
});
it("reader retains absent capture without manufacturing byte payload", () => {
  const observed = { document: {}, source: { sourceIdentity: "memory:absent", exists: false } };
  const { reader, validate } = memory(observed);
  try {
    const loaded = reader.execute(); expect(loaded.document).toBe(observed.document);
    expect(loaded.source.sourceBytes).toBeUndefined(); expect(loaded.originalText).toBeUndefined();
    expect(loaded.source).not.toBe(observed.source);
  } finally { validate.mockRestore(); }
});
it("reader rejects absent observation carrying bytes", () => {
  const { reader, validate } = memory({ document: {}, source: { sourceIdentity: "memory:contradiction", exists: false, sourceBytes: new Uint8Array() } });
  try { expect(() => reader.execute()).toThrow("Absent observation must not carry source bytes"); }
  finally { validate.mockRestore(); }
});
function memory(observed: ObservedProfile) {
  const observe = vi.fn(() => observed);
  const validate = vi.spyOn(validator, "validate");
  return { observe, validate, reader: new ReadProfileDocumentUseCase({ observe }, validator) };
}
it("reader rejects present observation without captured bytes", () => {
  const { reader, validate } = memory({ document: {}, source: { sourceIdentity: "memory:missing-bytes", exists: true } });
  try { expect(() => reader.execute()).toThrow("Present observation requires Uint8Array source bytes"); }
  finally { validate.mockRestore(); }
});
it("reader rejects malformed observed models with supplied identity", () => {
  const observed = { document: { models: null }, source: { sourceIdentity: "memory:invalid", exists: true, sourceBytes: new Uint8Array() } };
  const { reader, observe, validate } = memory(observed);
  try {
    expect(observe).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
    expect(() => reader.execute()).toThrow("Could not read model profile config at memory:invalid: models must be an object.");
    expect(observe).toHaveBeenCalledTimes(1); expect(validate.mock.calls).toEqual([[observed.document, "memory:invalid"]]);
  } finally { validate.mockRestore(); }
});
it("reader propagates exact port error without validation retry or fallback", () => {
  const error = new Error("producer refused");
  const observe = vi.fn(() => { throw error; });
  const validate = vi.spyOn(validator, "validate");
  try {
    const reader = new ReadProfileDocumentUseCase({ observe }, validator);
    let caught: unknown; try { reader.execute(); } catch (failure) { caught = failure; }
    expect(caught).toBe(error); expect(observe).toHaveBeenCalledTimes(1); expect(validate).not.toHaveBeenCalled();
  } finally { validate.mockRestore(); }
});
it("reader preserves second identity future raw document and original text", () => {
  const observed = { document: { version: 3, foreign: { keep: true }, models: { profiles: { work: { review: { reasoningEffort: " Custom ", note: [] } } } } },
    source: { sourceIdentity: "configured:second", exists: true, sourceBytes: new Uint8Array([32, 10]) }, originalText: " \n" };
  const { reader, observe, validate } = memory(observed);
  try {
    const loaded = reader.execute();
    expect(loaded.document).toBe(observed.document); expect(loaded.originalText).toBe(observed.originalText);
    expect(loaded.source).toEqual(observed.source); expect(observe).toHaveBeenCalledTimes(1);
    expect(validate.mock.calls).toEqual([[observed.document, "configured:second"]]); expect(validate.mock.calls[0][0]).toBe(observed.document);
  } finally { validate.mockRestore(); }
});
