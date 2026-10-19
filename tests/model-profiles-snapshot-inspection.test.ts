import { afterEach, expect, it, vi } from "vitest";
import { snapshotFixture } from "./model-profiles-snapshot-fixture.js";
import { createDefaultConfig } from "../scripts/lib/model-profiles-config.js";
import { invalidReads } from "./_testModelRawFixtures.js";
import { spawnSync } from "node:child_process";

afterEach(() => vi.restoreAllMocks());

it("inspection refuses structurally mismatched recovery before filesystem access", () => {
  const f = snapshotFixture();
  f.input.recoveryDocument = { ...f.raw, memo: "different" };
  expect(() => f.inspector.inspect(f.input)).toThrow("Recovery document does not match captured source");
  expect(f.read).not.toHaveBeenCalled();
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("inspection refuses structurally equal backup with different bytes", () => {
  const f = snapshotFixture();
  const backup = Buffer.from(JSON.stringify(f.raw));
  f.read.mockReturnValue(backup);
  expect(() => f.inspector.inspect(f.input)).toThrow("Existing migration snapshot does not match captured source");
  expect(f.read.mock.calls).toEqual([[f.snapshotPath]]);
  expect(backup.toString()).toBe(JSON.stringify(f.raw));
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("inspection reuses canonical absent defaults with reordered recovery", () => {
  const f = snapshotFixture();
  f.input.source = { sourceIdentity: f.configPath, exists: false };
  f.input.recoveryDocument = { models: { profiles: {}, activeProfile: null }, version: 1 };
  const canonical = Buffer.from(`${JSON.stringify(createDefaultConfig(), null, 2)}\n`);
  f.read.mockReturnValue(canonical);
  expect(f.inspector.inspect(f.input)).toEqual({ snapshotPath: f.snapshotPath, disposition: "reused", complete: true });
  expect(f.read.mock.calls).toEqual([[f.snapshotPath]]);
  expect(canonical.toString()).toBe(`${JSON.stringify(createDefaultConfig(), null, 2)}\n`);
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("inspection refuses future recovery through domain policy before backup reads", () => {
  const f = snapshotFixture();
  f.input.recoveryDocument.version = 3;
  f.input.source.sourceBytes = new Uint8Array(Buffer.from(JSON.stringify(f.input.recoveryDocument)));
  expect(() => f.inspector.inspect(f.input)).toThrow("Cannot snapshot unsupported profile version 3");
  expect(f.read).not.toHaveBeenCalled();
});

it("inspection validates malformed inactive recovery before reading backup", () => {
  const f = snapshotFixture();
  f.input.recoveryDocument = { models: { profiles: { inactive: { "afg-review": { reasoningEffort: null } } } } };
  f.input.source.sourceBytes = new Uint8Array(Buffer.from(JSON.stringify(f.input.recoveryDocument)));
  expect(() => f.inspector.inspect(f.input)).toThrow("models.profiles.inactive[\"afg-review\"].reasoningEffort");
  expect(f.read).not.toHaveBeenCalled();
});

it("inspection returns no receipt for a missing backup", () => {
  const f = snapshotFixture();
  expect(f.inspector.inspect(f.input)).toBeUndefined();
  expect(f.read.mock.calls).toEqual([[f.snapshotPath]]);
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("inspection propagates the original backup permission fault", () => {
  const f = snapshotFixture();
  const fault = Object.assign(new Error("permission denied"), { code: "EACCES" });
  f.read.mockImplementation(() => { throw fault; });
  expect(() => f.inspector.inspect(f.input)).toThrow(fault);
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("inspection parses malformed backup before comparing bytes", () => {
  const f = snapshotFixture();
  f.read.mockReturnValue(Buffer.from("{broken"));
  expect(() => f.inspector.inspect(f.input)).toThrow(SyntaxError);
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("inspection validates backup known fields at the sibling diagnostic path", () => {
  const f = snapshotFixture();
  f.read.mockReturnValue(Buffer.from('{"models":null}'));
  expect(() => f.inspector.inspect(f.input)).toThrow(`${f.snapshotPath}: models must be an object`);
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("inspection rejects caller identity as path authority before any read", () => {
  const f = snapshotFixture();
  f.input.source.sourceIdentity = "/caller/elsewhere/config.json";
  expect(() => f.inspector.inspect(f.input)).toThrow("Profile source changed");
  expect(f.read).not.toHaveBeenCalled();
});

it("inspection requires a boolean existence observation", () => {
  const f = snapshotFixture();
  Object.assign(f.input.source, { exists: 1 });
  expect(() => f.inspector.inspect(f.input)).toThrow("Observation exists must be a boolean");
  expect(f.read).not.toHaveBeenCalled();
});

it("inspection requires genuine captured Uint8Array bytes", () => {
  const f = snapshotFixture();
  Object.assign(f.input.source, { sourceBytes: f.bytes.toString("utf8") });
  expect(() => f.inspector.inspect(f.input)).toThrow("Present observation requires Uint8Array source bytes");
  expect(f.read).not.toHaveBeenCalled();
});

it("inspection refuses absent observations carrying bytes", () => {
  const f = snapshotFixture();
  f.input.source.exists = false;
  f.input.recoveryDocument = f.validator.validate(createDefaultConfig(), f.configPath);
  expect(() => f.inspector.inspect(f.input)).toThrow("Absent observation must not carry source bytes");
  expect(f.read).not.toHaveBeenCalled();
});

it("inspection validates captured source before structural matching", () => {
  const f = snapshotFixture();
  f.input.source.sourceBytes = new Uint8Array(Buffer.from('{"models":null}'));
  expect(() => f.inspector.inspect(f.input)).toThrow(`${f.configPath}: models must be an object`);
  expect(f.read).not.toHaveBeenCalled();
});

it.each(invalidReads)("inspection rejects full invalid recovery: %s", (_name, raw, diagnostic) => {
  const f = snapshotFixture();
  Object.assign(f.input, { recoveryDocument: raw });
  expect(() => f.inspector.inspect(f.input)).toThrow(diagnostic);
  expect(f.read).not.toHaveBeenCalled();
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it("inspection reuses offset Uint8Array multibyte bytes and rereads every backup", () => {
  const f = snapshotFixture();
  const padded = Buffer.concat([Buffer.from("prefix"), f.bytes, Buffer.from("suffix")]);
  f.input.source.sourceBytes = new Uint8Array(padded.buffer, padded.byteOffset + 6, f.bytes.length);
  f.input.recoveryDocument = { models: f.raw.models, memo: f.raw.memo, version: 1 };
  const before = structuredClone(f.input.recoveryDocument);
  f.read.mockReturnValueOnce(Buffer.from(f.bytes)).mockReturnValueOnce(Buffer.from(JSON.stringify(f.raw)));
  expect(f.inspector.inspect(f.input)).toEqual({ snapshotPath: f.snapshotPath, disposition: "reused", complete: true });
  expect(() => f.inspector.inspect(f.input)).toThrow("Existing migration snapshot does not match captured source");
  expect(f.read.mock.calls).toEqual([[f.snapshotPath], [f.snapshotPath]]);
  expect(f.input.recoveryDocument).toEqual(before);
  expect(Buffer.from(f.input.source.sourceBytes)).toEqual(f.bytes);
  for (const write of f.writeSpies) expect(write).not.toHaveBeenCalled();
});

it.each([
  ["numeric existence", { exists: 0 }, "Observation exists must be a boolean"],
  ["absent bytes", { exists: false, sourceBytes: new Uint8Array() }, "Absent observation must not carry source bytes"],
  ["missing bytes", { sourceBytes: undefined }, "Present observation requires Uint8Array source bytes"],
  ["array bytes", { sourceBytes: [123, 125] }, "Present observation requires Uint8Array source bytes"],
  ["spoofed bytes", { sourceBytes: Object.create(Uint8Array.prototype) }, "Present observation requires Uint8Array source bytes"],
])("inspection characterizes observation boundary: %s", (_name, override, diagnostic) => {
  const f = snapshotFixture();
  Object.assign(f.input.source, override);
  expect(() => f.inspector.inspect(f.input)).toThrow(diagnostic as string);
  expect(f.read).not.toHaveBeenCalled();
});

it.each([new Error("read failure"), Object.assign(new Error("I/O failure"), { code: "EIO" }), null])(
  "inspection preserves exact thrown read value: %s", (fault) => {
    const f = snapshotFixture();
    f.read.mockImplementation(() => { throw fault; });
    let caught: unknown;
    try { f.inspector.inspect(f.input); } catch (error) { caught = error; }
    expect(caught).toBe(fault);
  },
);

it("emitted inspector imports and constructs without I/O and returns all inspection outcomes", () => {
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from "node:assert/strict";
    import fs from "node:fs";
    import { ProfileDocumentPolicy } from "./dist/scripts/lib/model-profiles/domain/profile-document-policy.js";
    import { AgentTargetPolicy } from "./dist/scripts/lib/model-profiles/domain/agent-target-policy.js";
    const originals = new Map();
    let loaderRead;
    const operations = ["readFileSync", "mkdirSync", "openSync", "writeFileSync", "writeSync", "rmSync", "unlinkSync", "chmodSync", "renameSync"];
    for (const method of operations) {
      originals.set(method, fs[method]);
      fs[method] = (...args) => {
        if (method === "readFileSync" && String(args[0]).includes("/dist/")) {
          loaderRead = String(args[0]);
          try { return originals.get(method)(...args); } finally { loaderRead = undefined; }
        }
        if (method === "openSync" && loaderRead === String(args[0]) && args[1] === "r") return originals.get(method)(...args);
        throw new Error("Unexpected global fs " + method);
      };
    }
    try {
      const { NodeSnapshotInspectionAdapter } = await import("./dist/scripts/lib/model-profiles/infrastructure/node-snapshot-inspection-adapter.js");
      let reads = 0;
      let defaults = 0;
      const bytes = Buffer.from('{ "memo": "café ☕" }\\n');
      const fault = Object.assign(new Error("denied"), { code: "EACCES" });
      const filesystem = { readFileSync(file) {
        assert.equal(file, "/bound/config.json.pre-v2.bak");
        reads++;
        if (reads === 2) throw Object.assign(new Error("missing"), { code: "ENOENT" });
        if (reads === 3) throw fault;
        return bytes;
      } };
      const inspector = new NodeSnapshotInspectionAdapter("/bound/config.json", filesystem,
        new ProfileDocumentPolicy(new AgentTargetPolicy()), { create() { defaults++; return {}; } });
      assert.equal(reads, 0);
      assert.equal(defaults, 0);
      const input = { source: { sourceIdentity: "/bound/config.json", exists: true, sourceBytes: new Uint8Array(bytes) },
        recoveryDocument: { memo: "café ☕" } };
      assert.deepEqual(inspector.inspect(input), { snapshotPath: "/bound/config.json.pre-v2.bak", disposition: "reused", complete: true });
      assert.equal(inspector.inspect(input), undefined);
      assert.throws(() => inspector.inspect(input), error => error === fault);
      assert.equal(reads, 3);
      console.log("emitted inspector: reused, missing, original fault; no ambient I/O");
    } finally {
      for (const [method, original] of originals) fs[method] = original;
    }
  `], { encoding: "utf8", cwd: process.cwd() });
  expect(child.status, child.stderr).toBe(0);
  expect(child.stdout.trim()).toBe("emitted inspector: reused, missing, original fault; no ambient I/O");
});
