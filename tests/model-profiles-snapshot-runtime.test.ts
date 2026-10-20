import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { expect, it } from "vitest";

it("snapshot application contract has one semantic method and an inward resolved graph", () => {
  const entry = path.resolve("scripts/lib/model-profiles/application/snapshot-port.ts");
  const options = { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext };
  const program = ts.createProgram([entry], options);
  const port = program.getSourceFile(entry)!;
  const contract = port.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === "SnapshotPort") as ts.InterfaceDeclaration;
  expect(contract.members.map(member => member.name?.getText(port))).toEqual(["acquire"]);
  const files = program.getSourceFiles().filter(file => file.fileName.includes("/scripts/lib/model-profiles/"));
  expect(files.some(file => file.fileName.endsWith("migration-snapshot-contracts.ts"))).toBe(true);
  expect(files.some(file => file.fileName.endsWith("domain/profile-document.ts"))).toBe(true);
  for (const file of files) {
    expect(file.fileName).toMatch(/\/(application|domain)\//);
    expect(file.text).not.toMatch(/\b(?:process|Buffer|NodeJS)\b/);
    for (const node of file.statements) {
      if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) || !node.moduleSpecifier) continue;
      const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
      expect(specifier).not.toMatch(/^(?:node:|fs$|path$|os$|child_process$)/);
      const resolved = ts.resolveModuleName(specifier, file.fileName, options, ts.sys).resolvedModule;
      expect(resolved?.resolvedFileName).toMatch(/\/model-profiles\/(application|domain)\//);
      if (file.fileName.includes("/domain/")) expect(resolved?.resolvedFileName).toContain("/domain/");
    }
  }
});

it("emitted complete acquire imports quietly and creates reuses and refuses safely on real files", () => {
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from "node:assert/strict";
    import fs from "node:fs";
    import os from "node:os";
    import path from "node:path";
    import { AgentTargetPolicy } from "./dist/scripts/lib/model-profiles/domain/agent-target-policy.js";
    import { ProfileDocumentPolicy } from "./dist/scripts/lib/model-profiles/domain/profile-document-policy.js";
    import { NodeSnapshotInspectionAdapter } from "./dist/scripts/lib/model-profiles/infrastructure/node-snapshot-inspection-adapter.js";
    import { NodeProfileStorageAdapter } from "./dist/scripts/lib/model-profiles/infrastructure/node-profile-storage-adapter.js";
    import { LegacyProfileDefaultsAdapter } from "./dist/scripts/lib/model-profiles/infrastructure/legacy-profile-defaults-adapter.js";
    import { LegacyAtomicProfileSaverAdapter } from "./dist/scripts/lib/model-profiles/infrastructure/legacy-atomic-profile-saver-adapter.js";
    import { createDefaultConfig } from "./dist/scripts/lib/model-profiles-config.js";
    const originals = new Map();
    let loaderRead;
    for (const method of ["readFileSync", "openSync", "mkdirSync", "writeFileSync", "writeSync", "rmSync", "unlinkSync", "chmodSync", "renameSync", "fsyncSync", "closeSync"]) {
      originals.set(method, fs[method]);
      fs[method] = (...args) => {
        if (method === "readFileSync" && String(args[0]).includes("/dist/")) {
          loaderRead = String(args[0]);
          try { return originals.get(method)(...args); } finally { loaderRead = undefined; }
        }
        if (method === "openSync" && loaderRead === String(args[0]) && args[1] === "r") return originals.get(method)(...args);
        if (method === "closeSync" && loaderRead) return originals.get(method)(...args);
        throw new Error("Unexpected import I/O " + method);
      };
    }
    let NodeMigrationSnapshotAdapter;
    try {
      const application = await import("./dist/scripts/lib/model-profiles/application/snapshot-port.js");
      assert.deepEqual(Object.keys(application), []);
      ({ NodeMigrationSnapshotAdapter } = await import("./dist/scripts/lib/model-profiles/infrastructure/node-migration-snapshot-adapter.js"));
      const inaccessible = new Proxy({}, { get() { throw new Error("Constructor I/O"); } });
      new NodeMigrationSnapshotAdapter(inaccessible, inaccessible, inaccessible);
    } finally {
      for (const [method, original] of originals) fs[method] = original;
    }
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-s11-emitted-"));
    const defaults = new LegacyProfileDefaultsAdapter(createDefaultConfig);
    const validator = new ProfileDocumentPolicy(new AgentTargetPolicy());
    const saver = new LegacyAtomicProfileSaverAdapter(() => assert.fail("Unexpected config save"), {});
    function bound(configPath, filesystem = fs) {
      const inspector = new NodeSnapshotInspectionAdapter(configPath, filesystem, validator, defaults);
      const storage = new NodeProfileStorageAdapter(configPath, filesystem, defaults, saver);
      return new NodeMigrationSnapshotAdapter(filesystem, inspector, storage);
    }
    try {
      const configPath = path.join(root, "config.json");
      const bytes = Buffer.from('{\\n "memo": "café ☕", "version": 1\\n}\\n');
      fs.writeFileSync(configPath, bytes);
      const padded = Buffer.concat([Buffer.from("before"), bytes, Buffer.from("after")]);
      const input = { source: { sourceIdentity: configPath, exists: true,
        sourceBytes: new Uint8Array(padded.buffer, padded.byteOffset + 6, bytes.length) }, recoveryDocument: JSON.parse(bytes.toString()) };
      const adapter = bound(configPath);
      const snapshotPath = configPath + ".pre-v2.bak";
      assert.deepEqual(adapter.acquire(input), { snapshotPath, disposition: "created", complete: true });
      assert.deepEqual(fs.readFileSync(snapshotPath), bytes);
      assert.deepEqual(fs.readFileSync(configPath), bytes);
      if (process.platform !== "win32") assert.equal(fs.statSync(snapshotPath).mode & 0o777, 0o600);
      assert.deepEqual(adapter.acquire(input), { snapshotPath, disposition: "reused", complete: true });
      fs.writeFileSync(configPath, "{}");
      assert.throws(() => adapter.acquire(input), /Profile source changed/);
      assert.deepEqual(fs.readFileSync(snapshotPath), bytes);
      fs.writeFileSync(configPath, bytes);
      fs.writeFileSync(snapshotPath, "{");
      assert.throws(() => adapter.acquire(input), SyntaxError);
      assert.equal(fs.readFileSync(snapshotPath, "utf8"), "{");
      const absentPath = path.join(root, "absent", "config.json");
      const absent = { source: { sourceIdentity: absentPath, exists: false },
        recoveryDocument: { models: { profiles: {}, activeProfile: null }, version: 1 } };
      const absentAdapter = bound(absentPath);
      assert.equal(absentAdapter.acquire(absent).disposition, "created");
      assert.equal(absentAdapter.acquire(absent).disposition, "reused");
      assert.equal(fs.existsSync(absentPath), false);
      assert.equal(fs.readFileSync(absentPath + ".pre-v2.bak", "utf8"), JSON.stringify(createDefaultConfig(), null, 2) + "\\n");
      const failedPath = path.join(root, "fault", "config.json");
      const fault = new Error("emitted write failure");
      const faultyFs = { ...fs, writeFileSync() { throw fault; } };
      assert.throws(() => bound(failedPath, faultyFs).acquire({ ...absent, source: { sourceIdentity: failedPath, exists: false } }), error => error === fault);
      assert.deepEqual(fs.readdirSync(path.dirname(failedPath)), []);
      assert.deepEqual(fs.readFileSync(configPath), bytes);
      console.log("emitted acquire: exact create/reuse, defaults, private0600, source conflict, malformed prior, owned failure; no import/constructor I/O");
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  `], { encoding: "utf8", cwd: process.cwd() });
  expect(child.status, child.stderr).toBe(0);
  expect(child.stdout).toContain("emitted acquire: exact create/reuse");
});
