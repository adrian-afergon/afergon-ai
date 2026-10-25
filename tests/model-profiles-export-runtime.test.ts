import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { expect, it } from "vitest";

it("export application contract has one semantic method and an inward resolved graph", () => {
  const entry = path.resolve("scripts/lib/model-profiles/application/export-model-profiles-use-case.ts");
  const options = { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext };
  const program = ts.createProgram([entry], options);
  const portFile = path.resolve("scripts/lib/model-profiles/application/profile-export-port.ts");
  const port = program.getSourceFile(portFile)!;
  const contract = port.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === "ProfileExportPort") as ts.InterfaceDeclaration;
  expect(contract.members.map(member => member.name?.getText(port))).toEqual(["writeExclusive"]);
  const files = program.getSourceFiles().filter(file => file.fileName.includes("/scripts/lib/model-profiles/"));
  expect(files.some(file => file.fileName.endsWith("export-model-profiles-use-case.ts"))).toBe(true);
  expect(files.some(file => file.fileName.endsWith("domain/model-only-export-policy.ts"))).toBe(true);
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

it("emitted export writes exact raw backup and model-only output, refuses collisions and faults honestly", () => {
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from "node:assert/strict";
    import fs from "node:fs";
    import os from "node:os";
    import path from "node:path";
    const originals = new Map();
    let loaderRead;
    for (const method of ["readFileSync", "openSync", "mkdirSync", "writeFileSync", "rmSync", "fsyncSync", "closeSync", "statSync", "readdirSync"]) {
      originals.set(method, fs[method]);
      fs[method] = (...args) => {
        const file = String(args[0]);
        if (method === "readFileSync" && file.includes("/dist/")) {
          loaderRead = file;
          try { return originals.get(method)(...args); } finally { loaderRead = undefined; }
        }
        if (method === "openSync" && loaderRead === file && args[1] === "r") return originals.get(method)(...args);
        if (method === "closeSync" && loaderRead) return originals.get(method)(...args);
        if (method === "statSync" && (file.includes("/dist/") || !path.isAbsolute(file))) return originals.get(method)(...args);
        if (method === "readdirSync" && file.includes("/node_modules/")) return originals.get(method)(...args);
        throw new Error("Unexpected import I/O " + method + " " + file);
      };
    }
    let composition;
    try {
      const application = await import("./dist/scripts/lib/model-profiles/application/profile-export-port.js");
      assert.deepEqual(Object.keys(application), []);
      composition = await import("./dist/scripts/lib/model-profiles/infrastructure/profile-composition.js");
      const inaccessible = new Proxy({}, { get() { throw new Error("Constructor I/O"); } });
      await import("./dist/scripts/lib/model-profiles/application/export-model-profiles-use-case.js");
      await import("./dist/scripts/lib/model-profiles/domain/model-only-export-policy.js");
      await import("./dist/scripts/lib/model-profiles/infrastructure/node-export-destination-adapter.js");
    } finally {
      for (const [method, original] of originals) fs[method] = original;
    }
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-p2-emitted-"));
    try {
      const configDir = path.join(root, "cfg");
      fs.mkdirSync(configDir, { recursive: true });
      const source = path.join(configDir, "config.json");
      const extended = { version: 2, memo: "café ☕", models: { activeProfile: "work", profiles: {
        work: { "afg-review": { model: "openai/gpt-5.5", reasoningEffort: "high" }, "afg-implement": "inherit", "foreign-agent": { model: "kept", effort: "low" } },
        archive: { "afg-design": { reasoningEffort: "low" } },
      } } };
      const sourceBytes = Buffer.from(JSON.stringify(extended, null, 2) + "\\n");
      fs.writeFileSync(source, sourceBytes);
      const snapshotPath = source + ".pre-v2.bak";
      fs.writeFileSync(snapshotPath, Buffer.from('{"version":1,"older":true}\\n'));
      const env = { AFERGON_AI_CONFIG_DIR: configDir };
      const capabilities = composition.createProfileCapabilities(env);
      assert.equal(typeof capabilities.exportProfiles.execute, "function");
      for (const key of Object.keys(capabilities)) {
        assert.match(key, /^(configPath|reader|preparer|validator|storage|inspector|snapshots|update|exportProfiles)$/);
      }
      const backupPath = path.join(root, "current-full.bak");
      const exportPath = path.join(root, "export.legacy.json");
      const receipt = capabilities.exportProfiles.execute({ currentBackupPath: backupPath, destinationPath: exportPath });
      assert.deepEqual(receipt, { sourcePath: source, currentBackupPath: backupPath, destinationPath: exportPath, warnings: [
        'models.profiles.work["afg-review"]: reasoningEffort omitted from the legacy model-only export; recover it from the current backup at ' + backupPath,
        'models.profiles.archive["afg-design"]: reasoningEffort omitted from the legacy model-only export; recover it from the current backup at ' + backupPath,
      ] });
      assert.deepEqual(fs.readFileSync(backupPath), sourceBytes);
      const exported = JSON.parse(fs.readFileSync(exportPath, "utf8"));
      assert.deepEqual(exported.models.profiles.work, { "afg-review": "openai/gpt-5.5", "afg-implement": "inherit", "foreign-agent": { model: "kept", effort: "low" } });
      assert.equal(Object.hasOwn(exported.models.profiles.archive, "afg-design"), false);
      assert.equal(exported.version, 2);
      assert.deepEqual(fs.readFileSync(source), sourceBytes);
      assert.equal(fs.statSync(backupPath).mode & 0o777, 0o600);
      assert.equal(fs.statSync(exportPath).mode & 0o777, 0o600);
      assert.equal(fs.readFileSync(snapshotPath, "utf8"), '{"version":1,"older":true}\\n');
      const { ExportModelProfilesError } = await import("./dist/scripts/lib/model-profiles/application/export-model-profiles-use-case.js");
      const existingBackup = (() => { try { capabilities.exportProfiles.execute({ currentBackupPath: backupPath, destinationPath: path.join(root, "other.json") }); } catch (error) { return error; } })();
      assert.equal(existingBackup.code, "EEXIST");
      assert.deepEqual(fs.readFileSync(backupPath), sourceBytes);
      const existingExport = (() => { try { capabilities.exportProfiles.execute({ currentBackupPath: path.join(root, "b2.bak"), destinationPath: exportPath }); } catch (error) { return error; } })();
      assert.ok(existingExport instanceof ExportModelProfilesError);
      assert.equal(existingExport.currentBackupPath, path.join(root, "b2.bak"));
      assert.equal(existingExport.cause.code, "EEXIST");
      assert.deepEqual(fs.readFileSync(path.join(root, "b2.bak")), sourceBytes);
      assert.deepEqual(fs.readFileSync(backupPath), sourceBytes);
      assert.throws(() => capabilities.exportProfiles.execute({ currentBackupPath: source, destinationPath: path.join(root, "x.json") }), /distinct/);
      assert.throws(() => capabilities.exportProfiles.execute({ currentBackupPath: path.join(root, "b3.bak"), destinationPath: snapshotPath }), /distinct/);
      const absentDir = path.join(root, "absent");
      const absentCapabilities = composition.createProfileCapabilities({ AFERGON_AI_CONFIG_DIR: absentDir });
      assert.throws(() => absentCapabilities.exportProfiles.execute({ currentBackupPath: path.join(absentDir, "b.bak"), destinationPath: path.join(absentDir, "e.json") }), /no profile config exists/);
      assert.equal(fs.existsSync(absentDir), false);
      const futureDir = path.join(root, "future");
      fs.mkdirSync(futureDir, { recursive: true });
      fs.writeFileSync(path.join(futureDir, "config.json"), '{"version":99}\\n');
      const futureCapabilities = composition.createProfileCapabilities({ AFERGON_AI_CONFIG_DIR: futureDir });
      assert.throws(() => futureCapabilities.exportProfiles.execute({ currentBackupPath: path.join(root, "f.bak"), destinationPath: path.join(root, "f.json") }), /Cannot export unsupported profile version 99/);
      assert.equal(fs.existsSync(path.join(root, "f.bak")), false);
      const fault = new Error("emitted export failure");
      const originalWrite = fs.writeFileSync;
      const originalOpen = fs.openSync;
      let faultFd = null;
      fs.openSync = (...args) => { const fd = originalOpen(...args); if (String(args[0]) === path.join(root, "fault.json")) faultFd = fd; return fd; };
      fs.writeFileSync = (...args) => { if (args[0] === faultFd) throw fault; return originalWrite(...args); };
      try {
        const { ExportModelProfilesError } = await import("./dist/scripts/lib/model-profiles/application/export-model-profiles-use-case.js");
        assert.throws(() => capabilities.exportProfiles.execute({ currentBackupPath: path.join(root, "survivor.bak"), destinationPath: path.join(root, "fault.json") }),
          error => error instanceof ExportModelProfilesError && error.currentBackupPath === path.join(root, "survivor.bak") && error.cause === fault);
        assert.equal(fs.readFileSync(path.join(root, "survivor.bak")).length, sourceBytes.length);
        assert.equal(fs.existsSync(path.join(root, "fault.json")), false);
      } finally { fs.writeFileSync = originalWrite; fs.openSync = originalOpen; }
      console.log("emitted export: exact raw backup, model-only output, warnings, collisions, refusals, surviving backup; no import/constructor I/O");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  `], { encoding: "utf8", cwd: process.cwd() });
  expect(child.status, child.stderr).toBe(0);
  expect(child.stdout).toContain("emitted export: exact raw backup");
});
