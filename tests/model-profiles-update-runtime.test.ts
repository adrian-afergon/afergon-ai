import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

it.each(["legacy", "migration"])("S12 emitted Update executes isolated real %s ordering", mode => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-s12-emitted-"));
  const vertical = new URL("../dist/scripts/lib/model-profiles/", import.meta.url).href;
  const config = new URL("../dist/scripts/lib/model-profiles-config.js", import.meta.url).href;
  try {
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
      import assert from "node:assert/strict";
      import fs from "node:fs";
      import os from "node:os";
      import path from "node:path";
      import childProcess from "node:child_process";
      import { fileURLToPath } from "node:url";
      const vertical = ${JSON.stringify(vertical)};
      const root = ${JSON.stringify(root)};
      const mode = ${JSON.stringify(mode)};
      const originals = [];
      function guard(moduleRead) {
        for (const [object, methods] of [[fs, ["readFileSync", "writeFileSync", "mkdirSync", "openSync", "renameSync"]],
          [os, ["homedir"]], [childProcess, ["spawnSync", "execFileSync"]]]) {
          for (const method of methods) {
            const original = object[method];
            originals.push([object, method, original]);
            object[method] = (...args) => {
              // Node26's ESM loader reads the requested module through fs.
              // Permit that exact loader artifact, never config/default paths.
              const file = args[0] instanceof URL ? fileURLToPath(args[0]) : String(args[0]);
              if (file === moduleRead && (method === "readFileSync" || (method === "openSync" && args[1] === "r"))) return original(...args);
              throw new Error("Unexpected ambient " + method);
            };
          }
        }
      }
      function restore() { for (const [object, method, original] of originals.splice(0)) object[method] = original; }
      guard(fileURLToPath(vertical + "application/update-profile-assignment-use-case.js"));
      let Update;
      try { Update = (await import(vertical + "application/update-profile-assignment-use-case.js")).UpdateProfileAssignmentUseCase; }
      finally { restore(); }
      const { AgentTargetPolicy } = await import(vertical + "domain/agent-target-policy.js");
      const { ProfileDocumentPolicy } = await import(vertical + "domain/profile-document-policy.js");
      const { ProfileAssignmentPolicy } = await import(vertical + "domain/profile-assignment-policy.js");
      const { RawProfileDocumentCloner } = await import(vertical + "domain/raw-profile-document-cloner.js");
      const { ReadProfileDocumentUseCase } = await import(vertical + "application/read-profile-document-use-case.js");
      const { PrepareProfileAssignmentUseCase } = await import(vertical + "application/prepare-profile-assignment-use-case.js");
      const { NodeProfileStorageAdapter } = await import(vertical + "infrastructure/node-profile-storage-adapter.js");
      const { LegacyAtomicProfileSaverAdapter } = await import(vertical + "infrastructure/legacy-atomic-profile-saver-adapter.js");
      const { LegacyProfileDefaultsAdapter } = await import(vertical + "infrastructure/legacy-profile-defaults-adapter.js");
      const { NodeSnapshotInspectionAdapter } = await import(vertical + "infrastructure/node-snapshot-inspection-adapter.js");
      const { NodeMigrationSnapshotAdapter } = await import(vertical + "infrastructure/node-migration-snapshot-adapter.js");
      const { createDefaultConfig, saveConfig } = await import(${JSON.stringify(config)});
      const configPath = path.join(root, "config.json"), backup = configPath + ".pre-v2.bak";
      const document = { ...(mode === "migration" ? { version: 1 } : {}), memo: ["café ☕"],
        models: { profiles: { work: { review: "old", "afg-specify": { reasoningEffort: "low" } }, other: {} } } };
      const bytes = Buffer.from(JSON.stringify(document, null, 3) + String.fromCharCode(10));
      fs.writeFileSync(configPath, bytes, { mode: 0o600 });
      const env = { HOME: root, XDG_CONFIG_HOME: root, XDG_STATE_HOME: root, AFERGON_AI_CONFIG_DIR: root };
      const events = [];
      let agents, validator, storage, snapshots, reader, preparer, useCase;
      const environment = Object.getOwnPropertyDescriptor(process, "env");
      guard();
      try {
        Object.defineProperty(process, "env", { configurable: true, get() { throw new Error("Ambient constructor environment"); } });
        agents = new AgentTargetPolicy();
        validator = new ProfileDocumentPolicy(agents);
        const defaults = new LegacyProfileDefaultsAdapter(createDefaultConfig);
        const saver = new LegacyAtomicProfileSaverAdapter((candidate, bound) => {
          events.push("save:" + (candidate.version ?? "absent"));
          if (mode === "migration") assert.deepEqual(fs.readFileSync(backup), bytes);
          else assert.equal(fs.existsSync(backup), false);
          saveConfig(candidate, bound);
        }, env);
        storage = new NodeProfileStorageAdapter(configPath, fs, defaults, saver);
        snapshots = new NodeMigrationSnapshotAdapter(fs, new NodeSnapshotInspectionAdapter(configPath, fs, validator, defaults), storage);
        reader = new ReadProfileDocumentUseCase(storage, validator);
        preparer = new PrepareProfileAssignmentUseCase(new ProfileAssignmentPolicy(validator, agents, new RawProfileDocumentCloner()));
        useCase = new Update(reader, preparer, validator, storage, snapshots);
      } finally { Object.defineProperty(process, "env", environment); restore(); }
      let loaded, candidate;
      const read = reader.execute.bind(reader), prepare = preparer.execute.bind(preparer);
      reader.execute = () => loaded = read();
      preparer.execute = input => { const prepared = prepare(input); candidate = prepared.document; return prepared; };
      for (const [object, method, label] of [[storage, "observe", "observe"], [storage, "recheck", "recheck"], [storage, "atomicPersist", "persist"]]) {
        const original = object[method].bind(object);
        object[method] = (...args) => { events.push(label); if (method !== "observe") assert.equal(args.at(-1), loaded.source); return original(...args); };
      }
      const validate = validator.validate.bind(validator);
      validator.validate = (raw, identity) => { events.push("validate:" + (raw.version ?? "absent")); return validate(raw, identity); };
      const acquire = snapshots.acquire.bind(snapshots);
      snapshots.acquire = input => {
        events.push("snapshot");
        assert.equal(input.recoveryDocument, loaded.document);
        assert.equal(input.source, loaded.source);
        assert.equal(candidate.version, 1);
        const receipt = acquire(input);
        assert.equal(candidate.version, 1);
        assert.equal(receipt.complete, true);
        return receipt;
      };
      const patch = mode === "migration" ? { reasoningEffort: " High " } : { model: "new" };
      const result = useCase.execute({ profileName: "work", agentName: "review", patch });
      assert.deepEqual(result, { configPath, version: mode === "migration" ? 2 : 1, ...(mode === "migration" ? { snapshotPath: backup } : {}) });
      const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
      assert.deepEqual(saved.memo, document.memo);
      assert.deepEqual(saved.models.profiles.other, {});
      assert.deepEqual(saved.models.profiles.work["afg-specify"], document.models.profiles.work["afg-specify"]);
      assert.deepEqual(saved.models.profiles.work.review, mode === "migration" ? { model: "old", reasoningEffort: " High " } : "new");
      const version = mode === "migration" ? "2" : "absent";
      assert.deepEqual(events.slice(-5), ["validate:" + version, "recheck", "persist", "recheck", "save:" + version]);
      assert.equal(events.filter(event => event === "snapshot").length, mode === "migration" ? 1 : 0);
      if (mode === "migration") {
        assert.ok(events.indexOf("recheck") < events.indexOf("snapshot"));
        assert.deepEqual(fs.readFileSync(backup), bytes);
        if (process.platform !== "win32") assert.equal(fs.statSync(backup).mode & 0o777, 0o600);
      } else assert.equal(Object.hasOwn(saved, "version"), false);
      console.log("emitted " + mode + ": exact order, preserved metadata, cold constructors, original recovery, real saver");
    `], { encoding: "utf8", env: { ...process.env, HOME: root, XDG_CONFIG_HOME: root, XDG_STATE_HOME: root, AFERGON_AI_CONFIG_DIR: root } });
    expect(child.status, child.stderr).toBe(0);
    expect(child.stdout).toContain(`emitted ${mode}: exact order`);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
