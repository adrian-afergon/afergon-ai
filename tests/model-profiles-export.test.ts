import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { RawProfileDocumentCloner } from "../scripts/lib/model-profiles/domain/raw-profile-document-cloner.js";
import { ModelOnlyExportPolicy } from "../scripts/lib/model-profiles/domain/model-only-export-policy.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import { NodeExportDestinationAdapter, sameProtectedIdentity } from "../scripts/lib/model-profiles/infrastructure/node-export-destination-adapter.js";
import { ExportModelProfilesUseCase } from "../scripts/lib/model-profiles/application/export-model-profiles-use-case.js";
import { ExportModelProfilesError } from "../scripts/lib/model-profiles/application/export-model-profiles-use-case.js";
import { ReadProfileDocumentUseCase } from "../scripts/lib/model-profiles/application/read-profile-document-use-case.js";
import type { ObservedProfile, ProfileDocumentObservation } from "../scripts/lib/model-profiles/application/profile-document-observation.js";
import type { ProfileStoragePort } from "../scripts/lib/model-profiles/application/profile-storage-port.js";
import type { ProfileExportPort } from "../scripts/lib/model-profiles/application/profile-export-port.js";
import type { RawProfileDocument } from "../scripts/lib/model-profiles/domain/profile-document.js";

const policy = () => new ModelOnlyExportPolicy(new AgentTargetPolicy(), new RawProfileDocumentCloner());

const profilesOf = (result: ReturnType<ReturnType<typeof policy>["export"]>) =>
  ((result.document as { models?: { profiles?: Record<string, Record<string, unknown>> } }).models?.profiles ?? {});

class MemoryExportStorage implements ProfileStoragePort {
  readonly log: string[] = [];
  constructor(readonly observation: ObservedProfile) {}
  observe(): ObservedProfile {
    this.log.push("observe");
    return this.observation;
  }
  recheck(source: ProfileDocumentObservation): void {
    this.log.push("recheck");
  }
  atomicPersist(): void {
    throw new Error("export must not persist");
  }
}

class MemoryExportDestinations implements ProfileExportPort {
  readonly log: string[] = [];
  readonly writes: Array<{ outputPath: string; contents: string | Uint8Array; protectedPaths: readonly string[] }> = [];
  writeExclusive(outputPath: string, contents: string | Uint8Array, protectedPaths: readonly string[]): void {
    this.log.push(`write:${outputPath}`);
    this.writes.push({ outputPath, contents, protectedPaths });
  }
}

function exportMemory(document: RawProfileDocument, exists = true) {
  const bytes = exists ? new TextEncoder().encode(JSON.stringify(document, null, 2) + "\n") : undefined;
  const observation: ObservedProfile = {
    document, originalText: bytes === undefined ? undefined : new TextDecoder().decode(bytes),
    source: { sourceIdentity: "/memory/config.json", exists, sourceBytes: bytes },
  };
  const storage = new MemoryExportStorage(observation);
  const destinations = new MemoryExportDestinations();
  const agents = new AgentTargetPolicy();
  const validator = new ProfileDocumentPolicy(agents);
  const reader = new ReadProfileDocumentUseCase(storage, validator);
  const useCase = new ExportModelProfilesUseCase(
    reader, validator, policy(), destinations, storage, "/memory/config.json.pre-v2.bak",
  );
  return { storage, destinations, useCase, bytes,
    input: { currentBackupPath: "/memory/config.current.bak", destinationPath: "/memory/export.legacy.json" } };
}

const tempRoots: string[] = [];
afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
const tempRoot = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-p2-export-"));
  tempRoots.push(root);
  return root;
};

it("writes string contents exclusively with parent creation and private mode", () => {
  const root = tempRoot();
  const destination = path.join(root, "nested", "dir", "export.json");
  new NodeExportDestinationAdapter(fs).writeExclusive(destination, "{\n  \"exported\": true\n}\n", []);
  expect(fs.readFileSync(destination, "utf8")).toBe("{\n  \"exported\": true\n}\n");
  if (process.platform !== "win32") expect(fs.statSync(destination).mode & 0o777).toBe(0o600);
});

it("refuses an output path that resolves onto a protected path", () => {
  const root = tempRoot();
  const source = path.join(root, "config.json");
  fs.writeFileSync(source, "original");
  const adapter = new NodeExportDestinationAdapter(fs);
  expect(() => adapter.writeExclusive(path.join(root, ".", "config.json"), "x", [source])).toThrow(/protected path/);
  expect(fs.readFileSync(source, "utf8")).toBe("original");
});

it("matches protected identities case-insensitively only when the filesystem is case-insensitive", () => {
  expect(sameProtectedIdentity("/dir/Config.json", "/dir/config.JSON", true)).toBe(true);
  expect(sameProtectedIdentity("/dir/Config.json", "/dir/config.JSON", false)).toBe(false);
  expect(sameProtectedIdentity("/dir/config.json", "/dir/config.json", false)).toBe(true);
  expect(sameProtectedIdentity("/dir/config.json", "/dir/other.json", true)).toBe(false);
});

it("keeps case-variant paths distinct on case-sensitive filesystems", () => {
  const root = tempRoot();
  const source = path.join(root, "config.json");
  fs.writeFileSync(source, "original");
  const caseVariant = path.join(root, "Config.JSON");
  new NodeExportDestinationAdapter(fs).writeExclusive(caseVariant, "x", [source]);
  expect(fs.readFileSync(caseVariant, "utf8")).toBe("x");
  expect(fs.readFileSync(source, "utf8")).toBe("original");
});

it("removes an owned partial on write failure and preserves the original cause", () => {
  const root = tempRoot();
  const destination = path.join(root, "export.json");
  const fault = new Error("emitted write failure");
  const faultyFs = { ...fs, writeFileSync() { throw fault; } };
  expect(() => new NodeExportDestinationAdapter(faultyFs).writeExclusive(destination, "x", [])).toThrow(fault);
  expect(fs.existsSync(destination)).toBe(false);
});

it("combines original and close causes when cleanup close fails", () => {
  const root = tempRoot();
  const destination = path.join(root, "export.json");
  const fault = new Error("emitted write failure");
  const closeFault = new Error("emitted close failure");
  const faultyFs = { ...fs, writeFileSync() { throw fault; }, closeSync() { throw closeFault; } };
  try {
    new NodeExportDestinationAdapter(faultyFs).writeExclusive(destination, "x", []);
    expect.unreachable();
  } catch (error) {
    expect(error).toBeInstanceOf(AggregateError);
    expect([...(error as AggregateError).errors]).toEqual([fault, closeFault]);
  }
  expect(fs.existsSync(destination)).toBe(false);
});

it("combines original and removal causes when cleanup removal fails", () => {
  const root = tempRoot();
  const destination = path.join(root, "export.json");
  const fault = new Error("emitted write failure");
  const removeFault = new Error("emitted removal failure");
  const faultyFs = { ...fs, writeFileSync() { throw fault; }, rmSync() { throw removeFault; } };
  try {
    new NodeExportDestinationAdapter(faultyFs).writeExclusive(destination, "x", []);
    expect.unreachable();
  } catch (error) {
    expect(error).toBeInstanceOf(AggregateError);
    expect([...(error as AggregateError).errors]).toEqual([fault, removeFault]);
  }
});

it("removes an owned partial on fsync failure and preserves the original cause", () => {
  const root = tempRoot();
  const destination = path.join(root, "export.json");
  const fault = new Error("emitted fsync failure");
  const faultyFs = { ...fs, fsyncSync() { throw fault; } };
  expect(() => new NodeExportDestinationAdapter(faultyFs).writeExclusive(destination, "x", [])).toThrow(fault);
  expect(fs.existsSync(destination)).toBe(false);
});

it("propagates a non-EEXIST open failure without creating the destination", () => {
  const root = tempRoot();
  const destination = path.join(root, "export.json");
  const refusal = Object.assign(new Error("emitted open refusal"), { code: "EACCES" });
  const faultyFs = { ...fs, openSync() { throw refusal; } };
  expect(() => new NodeExportDestinationAdapter(faultyFs).writeExclusive(destination, "x", [])).toThrow(refusal);
  expect(fs.existsSync(destination)).toBe(false);
});

it("preserves the original and both cleanup causes when close and removal both fail", () => {
  const root = tempRoot();
  const destination = path.join(root, "export.json");
  const fault = new Error("emitted write failure");
  const closeFault = new Error("emitted close failure");
  const removeFault = new Error("emitted removal failure");
  const faultyFs = { ...fs, writeFileSync() { throw fault; }, closeSync() { throw closeFault; }, rmSync() { throw removeFault; } };
  try {
    new NodeExportDestinationAdapter(faultyFs).writeExclusive(destination, "x", []);
    expect.unreachable();
  } catch (error) {
    expect(error).toBeInstanceOf(AggregateError);
    expect([...(error as AggregateError).errors]).toEqual([fault, closeFault, removeFault]);
  }
});

it("rejects an existing destination even when byte-identical and leaves it untouched", () => {
  const root = tempRoot();
  const destination = path.join(root, "export.json");
  fs.writeFileSync(destination, "existing-bytes");
  expect(() => new NodeExportDestinationAdapter(fs).writeExclusive(destination, "existing-bytes", [])).toThrow();
  expect(fs.readFileSync(destination, "utf8")).toBe("existing-bytes");
});

it("writes exact raw bytes including offset views", () => {
  const root = tempRoot();
  const destination = path.join(root, "backup.bin");
  const bytes = Buffer.from('{\n  "memo": "café ☕"\n}\n');
  const padded = Buffer.concat([Buffer.from("before"), bytes, Buffer.from("after")]);
  const view = new Uint8Array(padded.buffer, padded.byteOffset + 6, bytes.length);
  new NodeExportDestinationAdapter(fs).writeExclusive(destination, view, []);
  expect(fs.readFileSync(destination)).toEqual(bytes);
});

it("exports managed string assignments exactly with an independent document", () => {
  const document = { version: 2, models: { profiles: { work: { "afg-review": "openai/gpt-5.5" } } } };
  const result = policy().export(document);
  expect(result.document).toEqual(document);
  expect(result.document).not.toBe(document);
  expect(result.losses).toEqual([]);
});

it("exports a structured managed assignment as its exact model string", () => {
  const document = { version: 2, models: { profiles: { work: { "afg-review": { model: "openai/gpt-5.5" } } } } };
  const result = policy().export(document);
  expect(profilesOf(result).work["afg-review"]).toBe("openai/gpt-5.5");
  expect(result.losses).toEqual([]);
});

it("records effort metadata omitted by a structured managed assignment", () => {
  const document = { version: 2, models: { profiles: { work: { "afg-review": { model: "openai/gpt-5.5", reasoningEffort: "high" } } } } };
  const result = policy().export(document);
  expect(profilesOf(result).work["afg-review"]).toBe("openai/gpt-5.5");
  expect(result.losses).toEqual([{ profileName: "work", agentKey: "afg-review", omittedKeys: ["reasoningEffort"] }]);
});

it("removes a managed assignment without a model so legacy inheritance applies", () => {
  const document = { version: 2, models: { profiles: { work: { "afg-review": { reasoningEffort: "high" } } } } };
  const result = policy().export(document);
  expect(Object.hasOwn(profilesOf(result).work, "afg-review")).toBe(false);
  expect(result.losses).toEqual([{ profileName: "work", agentKey: "afg-review", omittedKeys: ["reasoningEffort"] }]);
});

it("preserves an explicit inherit model as the exact legacy string", () => {
  const document = { version: 2, models: { profiles: { work: { "afg-review": { model: "inherit" } } } } };
  const result = policy().export(document);
  expect(profilesOf(result).work["afg-review"]).toBe("inherit");
  expect(result.losses).toEqual([]);
});

it("preserves foreign agent state verbatim without validation or loss records", () => {
  const foreign = { model: "opaque/model", effort: "high", nested: { deep: [1, 2] } };
  const document = { version: 2, models: { profiles: { work: { "afg-review": "openai/gpt-5.5", "unknown-agent": foreign } } } };
  const result = policy().export(document);
  expect(profilesOf(result).work["unknown-agent"]).toEqual(foreign);
  expect(result.losses).toEqual([]);
});

it("records non-effort metadata omitted by a structured managed assignment", () => {
  const document = { version: 2, models: { profiles: { work: { "afg-review": { model: "openai/gpt-5.5", custom: 1 } } } } };
  const result = policy().export(document);
  expect(profilesOf(result).work["afg-review"]).toBe("openai/gpt-5.5");
  expect(result.losses).toEqual([{ profileName: "work", agentKey: "afg-review", omittedKeys: ["custom"] }]);
});

it("preserves prototype-like agent keys as inert own properties", () => {
  const document = JSON.parse('{"version":2,"models":{"profiles":{"work":{"__proto__":{"model":"x"},"afg-review":"openai/gpt-5.5"}}}}');
  const result = policy().export(document);
  const work = (result.document as { models: { profiles: { work: Record<string, unknown> } } }).models.profiles.work;
  expect(Object.hasOwn(work, "__proto__")).toBe(true);
  expect(work["afg-review"]).toBe("openai/gpt-5.5");
  expect(Object.getPrototypeOf({})).toEqual(Object.prototype);
});

it("exports an independent document that later input mutation cannot change", () => {
  const document = { version: 2, memo: { nested: ["café"] }, models: { profiles: { work: { "afg-review": { model: "openai/gpt-5.5", reasoningEffort: "high" } } } } };
  const result = policy().export(document);
  const exported = result.document as typeof document;
  document.memo.nested.push("mutated");
  document.models.profiles.work["afg-review"].model = "changed";
  expect(exported.memo.nested).toEqual(["café"]);
  expect(exported.models.profiles.work["afg-review"]).toBe("openai/gpt-5.5");
});

it("transforms only managed members across mixed profiles and tolerates absent containers", () => {
  const document = { version: 2, models: { profiles: {
    work: { "afg-review": { model: "openai/gpt-5.5", reasoningEffort: "high" }, "afg-implement": "inherit" },
    archive: { "afg-design": { reasoningEffort: "low" }, "foreign": { model: "kept" } },
  } } };
  const result = policy().export(document);
  const exported = result.document as typeof document;
  expect(exported.models.profiles.work).toEqual({ "afg-review": "openai/gpt-5.5", "afg-implement": "inherit" });
  expect(Object.hasOwn(exported.models.profiles.archive, "afg-design")).toBe(false);
  expect(exported.models.profiles.archive["foreign"]).toEqual({ model: "kept" });
  expect(result.losses).toEqual([
    { profileName: "work", agentKey: "afg-review", omittedKeys: ["reasoningEffort"] },
    { profileName: "archive", agentKey: "afg-design", omittedKeys: ["reasoningEffort"] },
  ]);
  expect(policy().export({ version: 2 })).toEqual({ document: { version: 2 }, losses: [] });
});

it("refuses a managed assignment whose model is not a valid legacy string", () => {
  const document = { version: 2, models: { profiles: { work: { "afg-review": { model: 42 } } } } };
  expect(() => policy().export(document)).toThrow("models.profiles.work[\"afg-review\"].model must be a nonempty model string.");
});

it("writes the raw current backup and model-only export from one observation, then reports success", () => {
  const f = exportMemory({ version: 2, memo: "café ☕", models: { profiles: { work: { "afg-review": { model: "openai/gpt-5.5", reasoningEffort: "high" } } } } });
  const receipt = f.useCase.execute(f.input);
  expect(receipt).toEqual({
    sourcePath: "/memory/config.json",
    currentBackupPath: "/memory/config.current.bak",
    destinationPath: "/memory/export.legacy.json",
    warnings: ["models.profiles.work[\"afg-review\"]: reasoningEffort omitted from the legacy model-only export; recover it from the current backup at /memory/config.current.bak"],
  });
  expect(f.destinations.log).toEqual(["write:/memory/config.current.bak", "write:/memory/export.legacy.json"]);
  expect(f.destinations.writes[0].contents).toEqual(f.bytes);
  expect(f.destinations.writes[1].contents).toBe(JSON.stringify({ version: 2, memo: "café ☕", models: { profiles: { work: { "afg-review": "openai/gpt-5.5" } } } }, null, 2) + "\n");
  expect(f.destinations.writes[0].protectedPaths).toEqual(["/memory/config.json", "/memory/export.legacy.json", "/memory/config.json.pre-v2.bak"]);
  expect(f.destinations.writes[1].protectedPaths).toEqual(["/memory/config.json", "/memory/config.current.bak", "/memory/config.json.pre-v2.bak"]);
  expect(f.storage.log).toEqual(["observe", "recheck"]);
});

it("refuses an absent source with a diagnostic and creates no outputs", () => {
  const f = exportMemory({ version: 1 }, false);
  expect(() => f.useCase.execute(f.input)).toThrow("no profile config exists at /memory/config.json");
  expect(f.destinations.log).toEqual([]);
  expect(f.storage.log).toEqual(["observe"]);
});

it("refuses an unsupported future source without creating outputs", () => {
  const f = exportMemory({ version: 3, models: { profiles: {} } });
  expect(() => f.useCase.execute(f.input)).toThrow("Cannot export unsupported profile version 3");
  expect(f.destinations.log).toEqual([]);
});

it("propagates a corrupt-source read failure without creating outputs", () => {
  const observation: ObservedProfile = { document: {}, source: { sourceIdentity: "/memory/config.json", exists: true } };
  const storage = new MemoryExportStorage(observation);
  storage.observe = () => { storage.log.push("observe"); throw new SyntaxError("Unexpected token in JSON"); };
  const agents = new AgentTargetPolicy();
  const useCase = new ExportModelProfilesUseCase(
    new ReadProfileDocumentUseCase(storage, new ProfileDocumentPolicy(agents)),
    new ProfileDocumentPolicy(agents), policy(), new MemoryExportDestinations(), storage, undefined,
  );
  expect(() => useCase.execute({ currentBackupPath: "/memory/bak", destinationPath: "/memory/exp" })).toThrow(SyntaxError);
  expect(storage.log).toEqual(["observe"]);
});

it("refuses an unreadable source without substituting defaults or creating outputs", () => {
  const observation: ObservedProfile = { document: {}, source: { sourceIdentity: "/memory/config.json", exists: true } };
  const storage = new MemoryExportStorage(observation);
  const refusal = Object.assign(new Error("emitted read refusal"), { code: "EACCES" });
  storage.observe = () => { storage.log.push("observe"); throw refusal; };
  const destinations = new MemoryExportDestinations();
  const agents = new AgentTargetPolicy();
  const useCase = new ExportModelProfilesUseCase(
    new ReadProfileDocumentUseCase(storage, new ProfileDocumentPolicy(agents)),
    new ProfileDocumentPolicy(agents), policy(), destinations, storage, undefined,
  );
  expect(() => useCase.execute({ currentBackupPath: "/memory/bak", destinationPath: "/memory/exp" })).toThrow(refusal);
  expect(destinations.log).toEqual([]);
  expect(storage.log).toEqual(["observe"]);
});

it("refuses on a source recheck conflict after transformation and writes nothing", () => {
  const f = exportMemory({ version: 2, models: { profiles: { work: { "afg-review": "openai/gpt-5.5" } } } });
  f.storage.recheck = () => { throw new Error("Profile source changed"); };
  expect(() => f.useCase.execute(f.input)).toThrow("Profile source changed");
  expect(f.destinations.log).toEqual([]);
});

it("propagates a backup write failure without attempting the export", () => {
  const f = exportMemory({ version: 2, models: { profiles: { work: { "afg-review": "openai/gpt-5.5" } } } });
  const fault = new Error("backup refused");
  f.destinations.writeExclusive = (outputPath) => { throw outputPath === f.input.currentBackupPath ? fault : new Error("unexpected export write"); };
  expect(() => f.useCase.execute(f.input)).toThrow(fault);
  expect(f.storage.log).toEqual(["observe", "recheck"]);
});

it("identifies the surviving complete backup when the export write fails afterwards", () => {
  const f = exportMemory({ version: 2, models: { profiles: { work: { "afg-review": "openai/gpt-5.5" } } } });
  const fault = new Error("export destination refused");
  f.destinations.writeExclusive = (outputPath, contents, protectedPaths) => {
    if (outputPath === f.input.currentBackupPath) f.destinations.writes.push({ outputPath, contents, protectedPaths });
    else throw fault;
  };
  try {
    f.useCase.execute(f.input);
    expect.unreachable();
  } catch (error) {
    expect(error).toBeInstanceOf(ExportModelProfilesError);
    expect((error as ExportModelProfilesError).currentBackupPath).toBe("/memory/config.current.bak");
    expect((error as ExportModelProfilesError).cause).toBe(fault);
    expect((error as Error).message).toContain("/memory/config.current.bak");
  }
  expect(f.destinations.writes).toHaveLength(1);
});

it("refuses caller-supplied output paths that collide before any write", () => {
  const f = exportMemory({ version: 2, models: { profiles: {} } });
  expect(() => f.useCase.execute({ ...f.input, destinationPath: f.input.currentBackupPath })).toThrow(/collide|distinct/);
  expect(() => f.useCase.execute({ ...f.input, destinationPath: "/memory/config.json" })).toThrow(/collide|distinct/);
  expect(() => f.useCase.execute({ ...f.input, currentBackupPath: "/memory/config.json" })).toThrow(/collide|distinct/);
  expect(f.destinations.log).toEqual([]);
});

it("protects only existing paths when the pre-migration snapshot is absent", () => {
  const f = exportMemory({ version: 2, models: { profiles: {} } });
  const useCase = new ExportModelProfilesUseCase(
    new ReadProfileDocumentUseCase(f.storage, new ProfileDocumentPolicy(new AgentTargetPolicy())),
    new ProfileDocumentPolicy(new AgentTargetPolicy()), policy(), f.destinations, f.storage, undefined,
  );
  useCase.execute(f.input);
  expect(f.destinations.writes[0].protectedPaths).toEqual(["/memory/config.json", "/memory/export.legacy.json"]);
});

it("composes an export capability bound to the captured config path and snapshot convention", async () => {
  const root = tempRoot();
  const { createProfileCapabilities } = await import("../scripts/lib/model-profiles/infrastructure/profile-composition.js");
  const capabilities = createProfileCapabilities({ AFERGON_AI_CONFIG_DIR: root });
  expect(capabilities.exportProfiles).toBeInstanceOf(ExportModelProfilesUseCase);
  const source = path.join(root, "config.json");
  fs.writeFileSync(source, JSON.stringify({ version: 2, memo: "café ☕", models: { profiles: { work: { "afg-review": { model: "openai/gpt-5.5", reasoningEffort: "high" } } } } }, null, 2) + "\n");
  const receipt = capabilities.exportProfiles.execute({
    currentBackupPath: path.join(root, "current.bak"),
    destinationPath: path.join(root, "export.legacy.json"),
  });
  expect(receipt.sourcePath).toBe(source);
  expect(JSON.parse(fs.readFileSync(path.join(root, "export.legacy.json"), "utf8"))).toEqual({
    version: 2, memo: "café ☕", models: { profiles: { work: { "afg-review": "openai/gpt-5.5" } } },
  });
  expect(fs.readFileSync(path.join(root, "current.bak"))).toEqual(fs.readFileSync(source));
  expect(fs.readFileSync(source, "utf8")).toContain("reasoningEffort");
  expect(receipt.warnings).toHaveLength(1);
});

it("refuses a real unreadable source without defaults or outputs", async () => {
  const root = tempRoot();
  const configDir = path.join(root, "cfg");
  fs.mkdirSync(configDir, { recursive: true });
  const source = path.join(configDir, "config.json");
  fs.writeFileSync(source, '{"version":2,"models":{"profiles":{}}}\n');
  const { createProfileCapabilities } = await import("../scripts/lib/model-profiles/infrastructure/profile-composition.js");
  const capabilities = createProfileCapabilities({ AFERGON_AI_CONFIG_DIR: configDir });
  const originalRead = fs.readFileSync;
  const refusal = Object.assign(new Error("emitted read refusal"), { code: "EACCES" });
  fs.readFileSync = ((...args: Parameters<typeof originalRead>) => {
    if (String(args[0]) === source) throw refusal;
    return originalRead(...args);
  }) as typeof fs.readFileSync;
  try {
    expect(() => capabilities.exportProfiles.execute({
      currentBackupPath: path.join(root, "current.bak"),
      destinationPath: path.join(root, "export.legacy.json"),
    })).toThrow(refusal);
  } finally {
    fs.readFileSync = originalRead;
  }
  expect(fs.existsSync(path.join(root, "current.bak"))).toBe(false);
  expect(fs.existsSync(path.join(root, "export.legacy.json"))).toBe(false);
  expect(fs.readFileSync(source, "utf8")).toBe('{"version":2,"models":{"profiles":{}}}\n');
});

it("refuses a real malformed source without defaults or outputs", async () => {
  const root = tempRoot();
  const configDir = path.join(root, "cfg");
  fs.mkdirSync(configDir, { recursive: true });
  const source = path.join(configDir, "config.json");
  const malformed = '{"version":2,"models":{';
  fs.writeFileSync(source, malformed);
  const { createProfileCapabilities } = await import("../scripts/lib/model-profiles/infrastructure/profile-composition.js");
  const capabilities = createProfileCapabilities({ AFERGON_AI_CONFIG_DIR: configDir });
  expect(() => capabilities.exportProfiles.execute({
    currentBackupPath: path.join(root, "current.bak"),
    destinationPath: path.join(root, "export.legacy.json"),
  })).toThrow(SyntaxError);
  expect(fs.existsSync(path.join(root, "current.bak"))).toBe(false);
  expect(fs.existsSync(path.join(root, "export.legacy.json"))).toBe(false);
  expect(fs.readFileSync(source, "utf8")).toBe(malformed);
});

it("preserves the real source and snapshot with no export when the current-backup write fails", async () => {
  const root = tempRoot();
  const configDir = path.join(root, "cfg");
  fs.mkdirSync(configDir, { recursive: true });
  const source = path.join(configDir, "config.json");
  const sourceBytes = Buffer.from(JSON.stringify({ version: 2, models: { profiles: { work: { "afg-review": "openai/gpt-5.5" } } } }, null, 2) + "\n");
  fs.writeFileSync(source, sourceBytes);
  const snapshotPath = `${source}.pre-v2.bak`;
  fs.writeFileSync(snapshotPath, '{"version":1,"older":true}\n');
  const { createProfileCapabilities } = await import("../scripts/lib/model-profiles/infrastructure/profile-composition.js");
  const capabilities = createProfileCapabilities({ AFERGON_AI_CONFIG_DIR: configDir });
  const backupPath = path.join(root, "current.bak");
  const exportPath = path.join(root, "export.legacy.json");
  const fault = new Error("emitted backup write failure");
  const originalWrite = fs.writeFileSync;
  const originalOpen = fs.openSync;
  let faultFd: number | undefined;
  fs.openSync = ((...args: Parameters<typeof originalOpen>) => {
    const fd = originalOpen(...args);
    if (String(args[0]) === backupPath) faultFd = fd;
    return fd;
  }) as typeof fs.openSync;
  fs.writeFileSync = ((...args: Parameters<typeof originalWrite>) => {
    if (args[0] === faultFd) throw fault;
    return originalWrite(...args);
  }) as typeof fs.writeFileSync;
  try {
    expect(() => capabilities.exportProfiles.execute({ currentBackupPath: backupPath, destinationPath: exportPath })).toThrow(fault);
  } finally {
    fs.writeFileSync = originalWrite;
    fs.openSync = originalOpen;
  }
  expect(fs.existsSync(backupPath)).toBe(false);
  expect(fs.existsSync(exportPath)).toBe(false);
  expect(fs.readFileSync(source)).toEqual(sourceBytes);
  expect(fs.readFileSync(snapshotPath, "utf8")).toBe('{"version":1,"older":true}\n');
});
