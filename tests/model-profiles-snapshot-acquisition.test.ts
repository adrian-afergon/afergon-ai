import { afterEach, expect, it, vi } from "vitest";
import { snapshotFixture } from "./model-profiles-snapshot-fixture.js";
import { NodeMigrationSnapshotAdapter } from "../scripts/lib/model-profiles/infrastructure/node-migration-snapshot-adapter.js";
import type { SnapshotPort } from "../scripts/lib/model-profiles/application/snapshot-port.js";
import { NodeProfileStorageAdapter } from "../scripts/lib/model-profiles/infrastructure/node-profile-storage-adapter.js";
import { createDefaultConfig } from "../scripts/lib/model-profiles-config.js";
import { LegacyAtomicProfileSaverAdapter } from "../scripts/lib/model-profiles/infrastructure/legacy-atomic-profile-saver-adapter.js";
import type { AcquireMigrationSnapshotInput } from "../scripts/lib/model-profiles/application/migration-snapshot-contracts.js";

afterEach(() => vi.restoreAllMocks());

it("acquire propagates injected recheck failure before exclusive open", () => {
  const f = snapshotFixture();
  vi.mocked(f.filesystem.mkdirSync).mockImplementation(() => undefined);
  const fault = new Error("injected source conflict");
  const recheck = vi.fn(() => { throw fault; });
  const adapter: SnapshotPort = new NodeMigrationSnapshotAdapter(f.filesystem, f.inspector, { recheck });
  expect(() => adapter.acquire(f.input)).toThrow(fault);
  expect(recheck.mock.calls).toEqual([[f.input.source]]);
  expect(f.filesystem.openSync).not.toHaveBeenCalled();
});

it("acquire detects source appearance during mkdir immediately before open", () => {
  const f = snapshotFixture();
  f.input.source = { sourceIdentity: f.configPath, exists: false };
  f.input.recoveryDocument = f.validator.validate(createDefaultConfig(), f.configPath);
  vi.mocked(f.filesystem.mkdirSync).mockImplementation(() => {
    f.read.mockReturnValue(Buffer.from("{}"));
    return undefined;
  });
  const storage = new NodeProfileStorageAdapter(f.configPath, f.filesystem, f.defaults,
    new LegacyAtomicProfileSaverAdapter(() => { throw new Error("Unexpected save"); }, {}));
  const adapter = new NodeMigrationSnapshotAdapter(f.filesystem, f.inspector, storage);
  expect(() => adapter.acquire(f.input)).toThrow("Profile source changed");
  expect(f.filesystem.mkdirSync).toHaveBeenCalledExactlyOnceWith("/configured/profiles", { recursive: true });
  expect(f.filesystem.openSync).not.toHaveBeenCalled();
});

it("acquire inspects the actual EEXIST race file after earlier missing inspection", () => {
  const f = snapshotFixture();
  expect(f.inspector.inspect(f.input)).toBeUndefined();
  vi.mocked(f.filesystem.mkdirSync).mockImplementation(() => undefined);
  vi.mocked(f.filesystem.openSync).mockImplementation(() => {
    f.read.mockReturnValue(Buffer.from("{"));
    throw Object.assign(new Error("race"), { code: "EEXIST" });
  });
  const adapter = new NodeMigrationSnapshotAdapter(f.filesystem, f.inspector, { recheck: vi.fn() });
  expect(() => adapter.acquire(f.input)).toThrow(SyntaxError);
  expect(f.filesystem.openSync).toHaveBeenCalledExactlyOnceWith(f.snapshotPath, "wx", 0o600);
  expect(f.read.mock.calls).toEqual([[f.snapshotPath], [f.snapshotPath]]);
  expect(f.filesystem.rmSync).not.toHaveBeenCalled();
});

function creationFixture() {
  const f = snapshotFixture();
  vi.mocked(f.filesystem.mkdirSync).mockImplementation(() => undefined);
  vi.mocked(f.filesystem.openSync).mockReturnValue(17);
  vi.mocked(f.filesystem.writeFileSync).mockImplementation(() => undefined);
  const sync = vi.spyOn(f.filesystem, "fsyncSync").mockImplementation(() => undefined);
  const close = vi.spyOn(f.filesystem, "closeSync").mockImplementation(() => undefined);
  const adapter = new NodeMigrationSnapshotAdapter(f.filesystem, f.inspector, { recheck: vi.fn() });
  return { ...f, adapter, sync, close };
}

it("acquire writes the complete prepared bytes to its exclusive descriptor", () => {
  const f = creationFixture();
  expect(f.adapter.acquire(f.input)).toEqual({ snapshotPath: f.snapshotPath, disposition: "created", complete: true });
  expect(f.filesystem.writeFileSync).toHaveBeenCalledExactlyOnceWith(17, f.bytes);
});

it("acquire fsyncs written bytes before returning a completed receipt", () => {
  const f = creationFixture();
  f.adapter.acquire(f.input);
  expect(f.sync).toHaveBeenCalledExactlyOnceWith(17);
  expect(vi.mocked(f.filesystem.writeFileSync).mock.invocationCallOrder[0]).toBeLessThan(f.sync.mock.invocationCallOrder[0]);
});

it("acquire closes the synced descriptor before completing creation", () => {
  const f = creationFixture();
  f.adapter.acquire(f.input);
  expect(f.close).toHaveBeenCalledExactlyOnceWith(17);
  expect(f.sync.mock.invocationCallOrder[0]).toBeLessThan(f.close.mock.invocationCallOrder[0]);
});

it.each([
  ["wrong identity", { sourceIdentity: "/caller/other.json" }, "Profile source changed"],
  ["nonboolean existence", { exists: 1 }, "Observation exists must be a boolean"],
  ["missing present bytes", { sourceBytes: undefined }, "Present observation requires Uint8Array source bytes"],
  ["array bytes", { sourceBytes: [123, 125] }, "Present observation requires Uint8Array source bytes"],
  ["prototype-only bytes", { sourceBytes: Object.create(Uint8Array.prototype) }, "Present observation requires Uint8Array source bytes"],
  ["absent empty bytes", { exists: false, sourceBytes: new Uint8Array() }, "Absent observation must not carry source bytes"],
  ["empty captured JSON", { sourceBytes: new Uint8Array() }, SyntaxError],
] as const)("acquire preflights %s before mkdir or recheck", (_name, override, diagnostic) => {
  const f = snapshotFixture();
  Object.assign(f.input.source, override);
  const recheck = vi.fn();
  const adapter = new NodeMigrationSnapshotAdapter(f.filesystem, f.inspector, { recheck });
  expect(() => adapter.acquire(f.input)).toThrow(diagnostic);
  expect(recheck).not.toHaveBeenCalled();
  expect(f.read).not.toHaveBeenCalled();
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("acquire preserves offset genuine Uint8Array and prepared bytes through creation", () => {
  const f = creationFixture();
  const padded = Buffer.concat([Buffer.from("prefix"), f.bytes, Buffer.from("suffix")]);
  f.input.source.sourceBytes = new Uint8Array(padded.buffer, padded.byteOffset + 6, f.bytes.length);
  const before = f.input.source.sourceBytes.slice();
  f.adapter.acquire(f.input);
  expect(f.filesystem.writeFileSync).toHaveBeenCalledExactlyOnceWith(17, f.bytes);
  expect(f.input.source.sourceBytes).toEqual(before);
  expect(f.close).toHaveBeenCalledExactlyOnceWith(17);
});

it.each([
  ["exact valid", undefined, undefined],
  ["different valid bytes", "reformatted", "Existing migration snapshot does not match captured source"],
  ["invalid known fields", '{"models":null}', "models must be an object"],
] as const)("acquire inspects %s competing bytes without taking ownership", (_name, competing, diagnostic) => {
  const f = creationFixture();
  const recheck = vi.fn();
  const adapter = new NodeMigrationSnapshotAdapter(f.filesystem, f.inspector, { recheck });
  expect(f.inspector.inspect(f.input)).toBeUndefined();
  vi.mocked(f.filesystem.openSync).mockImplementation(() => {
    expect(recheck).toHaveBeenCalledExactlyOnceWith(f.input.source);
    f.read.mockReturnValue(competing === undefined ? f.bytes : Buffer.from(competing === "reformatted" ? JSON.stringify(f.raw) : competing));
    throw Object.assign(new Error("competing file"), { code: "EEXIST" });
  });
  if (diagnostic) expect(() => adapter.acquire(f.input)).toThrow(diagnostic);
  else expect(adapter.acquire(f.input)).toEqual({ snapshotPath: f.snapshotPath, disposition: "reused", complete: true });
  expect(f.read.mock.calls).toEqual([[f.snapshotPath], [f.snapshotPath]]);
  expect(f.filesystem.writeFileSync).not.toHaveBeenCalled();
  expect(f.filesystem.rmSync).not.toHaveBeenCalled();
  expect(f.close).not.toHaveBeenCalled();
});

it("acquire retains original EEXIST when the competing backup disappears", () => {
  const f = creationFixture();
  const fault = Object.assign(new Error("competing file disappeared"), { code: "EEXIST" });
  vi.mocked(f.filesystem.openSync).mockImplementation(() => { throw fault; });
  expect(() => f.adapter.acquire(f.input)).toThrow(fault);
  expect(f.filesystem.rmSync).not.toHaveBeenCalled();
  expect(f.close).not.toHaveBeenCalled();
});

it("acquire cannot reuse a completed backup to bypass actual source recheck", () => {
  const f = creationFixture();
  f.read.mockImplementation(file => file === f.configPath ? Buffer.from("{ }") : f.bytes);
  expect(f.inspector.inspect(f.input)?.disposition).toBe("reused");
  const storage = new NodeProfileStorageAdapter(f.configPath, f.filesystem, f.defaults,
    new LegacyAtomicProfileSaverAdapter(() => { throw new Error("Unexpected save"); }, {}));
  const adapter: SnapshotPort = new NodeMigrationSnapshotAdapter(f.filesystem, f.inspector, storage);
  expect(() => adapter.acquire(f.input)).toThrow("Profile source changed");
  expect(f.filesystem.openSync).not.toHaveBeenCalled();
  expect(f.filesystem.rmSync).not.toHaveBeenCalled();
});

it("acquire constructors only store injected capabilities without accessing them", () => {
  const f = snapshotFixture();
  const rejectAccess = { get() { throw new Error("Constructor accessed a capability"); } };
  const adapter: SnapshotPort = new NodeMigrationSnapshotAdapter(
    new Proxy(f.filesystem, rejectAccess), new Proxy(f.inspector, rejectAccess), new Proxy({ recheck: vi.fn() }, rejectAccess),
  );
  expect(typeof adapter.acquire).toBe("function");
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("acquire uses original source rather than patched migration candidate", () => {
  const f = snapshotFixture();
  const input: AcquireMigrationSnapshotInput = {
    source: f.input.source,
    recoveryDocument: { ...f.raw, models: { profiles: { work: { review: { model: "custom/model", reasoningEffort: "high" } } } } },
  };
  const adapter = new NodeMigrationSnapshotAdapter(f.filesystem, f.inspector, { recheck: vi.fn() });
  expect(() => adapter.acquire(input)).toThrow("Recovery document does not match captured source");
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("legacy acquire preserves a read error whose text resembles a snapshot mismatch", async () => {
  const fs = (await import("node:fs")).default;
  const { realSnapshotFixture } = await import("./_testModelSnapshotContract.js");
  const { acquireMigrationSnapshot } = await import("../scripts/lib/model-profiles/infrastructure/migration-snapshot.js");
  const f = realSnapshotFixture();
  const original = fs.readFileSync.bind(fs);
  const fault = new Error("Existing migration snapshot does not match captured source");
  try {
    fs.writeFileSync(f.backup, f.source.sourceBytes!);
    vi.spyOn(fs, "readFileSync").mockImplementation((file, ...args) => {
      if (file === f.backup) throw fault;
      return original(file, ...args);
    });
    let caught: unknown;
    try { acquireMigrationSnapshot(f.input); } catch (error) { caught = error; }
    expect(caught).toBe(fault);
  } finally {
    vi.restoreAllMocks();
    fs.rmSync(f.root, { recursive: true, force: true });
  }
});
