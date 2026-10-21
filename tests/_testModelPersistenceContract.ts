import fs from "node:fs";
import path from "node:path";
import childProcess from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import * as profileConfig from "../scripts/lib/model-profiles-config.js";
import { loadProfileDocument, updateProfileAssignment } from "../scripts/lib/model-profiles/infrastructure/profile-store.js";
import { PrepareProfileAssignmentUseCase } from "../scripts/lib/model-profiles/application/prepare-profile-assignment-use-case.js";
import { NodeMigrationSnapshotAdapter } from "../scripts/lib/model-profiles/infrastructure/node-migration-snapshot-adapter.js";
import type { AssignmentPatch } from "../scripts/lib/model-profiles/domain/assignment-patch.js";
import { realSnapshotFixture, snapshotFault } from "./_testModelSnapshotContract.js";
import { invalidReads } from "./_testModelRawFixtures.js";
import { invalidPatchFields } from "./_testModelPreparationFixtures.js";

type Fixture = ReturnType<typeof realSnapshotFixture>;
function writerEnv(f: Fixture) {
  return { HOME: f.root, XDG_CONFIG_HOME: f.root, AFERGON_AI_CONFIG_DIR: path.dirname(f.source.configPath) };
}
function update(f: Fixture, patch: AssignmentPatch, profileName = "work", agentName = "review") {
  return updateProfileAssignment(profileName, agentName, patch, { env: writerEnv(f) });
}

// Real descriptor-aware saver faults. Serialization is injected only while the
// valid candidate is inside the actual saver, never during domain validation.
function configFault(stage: "serialize" | "write" | "fsync" | "close" | "rename") {
  const failure = new Error(`config ${stage} fault`);
  const open = fs.openSync.bind(fs), close = fs.closeSync.bind(fs);
  let descriptor: number | undefined, failed = false, saving = false;
  vi.spyOn(fs, "openSync").mockImplementation((file, flags, ...args) => {
    const fd = open(file, flags, ...args);
    if (typeof file === "string" && file.endsWith(".tmp") && flags === "wx") descriptor = fd;
    return fd;
  });
  vi.spyOn(fs, "closeSync").mockImplementation(fd => {
    if (fd === descriptor && stage === "close" && !failed) { failed = true; throw failure; }
    const result = close(fd);
    if (fd === descriptor) descriptor = undefined;
    return result;
  });
  const method = stage === "write" ? "writeFileSync" : stage === "rename" ? "renameSync" : "fsyncSync";
  const original = fs[method].bind(fs);
  if (!["serialize", "close"].includes(stage)) vi.spyOn(fs, method).mockImplementation((target, ...args) => {
    if (stage === "rename" ? typeof target === "string" && target.endsWith(".tmp") : target === descriptor) throw failure;
    return (original as (...args: unknown[]) => never)(target, ...args);
  });
  if (stage === "serialize") {
    const stringify = JSON.stringify, save = profileConfig.saveConfig;
    vi.spyOn(JSON, "stringify").mockImplementation((...args) => {
      if (saving) throw failure;
      return stringify(...args);
    });
    vi.spyOn(profileConfig, "saveConfig").mockImplementation((candidate, env) => {
      saving = true;
      try { return save(candidate, env); } finally { saving = false; }
    });
  }
  return failure;
}

export function registerPersistenceContract() {
  describe("original D remaining55 real integrations", () => {
    it.each(invalidPatchFields)("D1 integrated invalid patch %s never writes or calls host", (_name, field, value) => {
      const f = realSnapshotFixture('{"models":{"profiles":{"work":{"review":"old"}}}}');
      const spies = [vi.spyOn(profileConfig, "saveConfig"), vi.spyOn(fs, "mkdirSync"),
        vi.spyOn(childProcess, "spawnSync"), vi.spyOn(childProcess, "execFileSync")];
      expect(() => update(f, { [field]: value })).toThrow();
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
      f.unchanged(false);
    });

    it.each(['{', '{"models":{"profiles":{"other":{"review":{"reasoningEffort":null}}}}}'])("D1 corrupt or nontarget invalid source %s never writes", bytes => {
      const f = realSnapshotFixture("{}");
      fs.writeFileSync(f.source.configPath, bytes);
      const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync");
      expect(() => update(f, { model: "new" })).toThrow();
      for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled();
      expect(fs.readFileSync(f.source.configPath, "utf8")).toBe(bytes);
      expect(fs.readdirSync(path.dirname(f.backup))).toEqual(["config.json"]);
    });

    it("D3 cleanup failure keeps original precommit error without false temp guarantee", () => {
      const f = realSnapshotFixture("{}");
      const failure = configFault("rename"), remove = fs.rmSync.bind(fs);
      vi.spyOn(fs, "rmSync").mockImplementation((file, options) => {
        if (String(file).endsWith(".tmp")) throw new Error("cleanup fault");
        return remove(file, options);
      });
      let caught: unknown;
      try { update(f, { reasoningEffort: "high" }); } catch (error) { caught = error; }
      expect(caught).toBe(failure);
      expect(fs.readFileSync(f.source.configPath)).toEqual(f.source.sourceBytes);
      expect(fs.readFileSync(f.backup)).toEqual(f.source.sourceBytes);
      expect(fs.readdirSync(path.dirname(f.backup)).filter(file => file.endsWith(".tmp"))).toHaveLength(1);
    });

    it.each(["work", "__proto__", "constructor"])("D2 round-trips own profile %s with metadata and subsequent v2 representations", profileName => {
      const profile = { " REVIEW ": { model: " old ", note: { labels: ["keep"] } }, "afg-specify": "inherit",
        "afergon-ai": { model: "same", reasoningEffort: "high" }, foreign: { model: null } };
      const document = { version: 1, memo: ["root"], models: { activeProfile: "other", note: ["models"],
        profiles: { other: { review: { reasoningEffort: "low" } }, [profileName]: profile } } };
      const f = realSnapshotFixture(JSON.stringify(document));
      const acquire = vi.spyOn(NodeMigrationSnapshotAdapter.prototype, "acquire");
      update(f, { model: " new " }, profileName, "afg-review");
      expect(loadProfileDocument(writerEnv(f)).document).toEqual({ ...document, version: 2,
        models: { ...document.models, profiles: { ...document.models.profiles,
          [profileName]: { ...profile, " REVIEW ": { ...profile[" REVIEW "], model: " new " } } } } });
      update(f, { model: " legacy " }, profileName, "afg-specify");
      update(f, { model: "same", reasoningEffort: " Low " }, profileName, " REVIEW ");
      const saved = loadProfileDocument(writerEnv(f)).document as typeof document;
      expect(saved.models.profiles[profileName]["afg-specify"]).toBe(" legacy ");
      expect(saved.models.profiles.other).toEqual(document.models.profiles.other);
      expect(saved.models.profiles[profileName][" REVIEW "]).toEqual({ model: "same", reasoningEffort: " Low ", note: { labels: ["keep"] } });
      expect(saved.models.profiles[profileName]["afergon-ai"]).toEqual({ model: "same", reasoningEffort: "high" });
      expect(acquire).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync(f.backup)).toEqual(f.source.sourceBytes);
      expect(Object.getPrototypeOf(saved.models.profiles)).toBe(Object.prototype);
    });

    it("D2 absent source structured model-only write snapshots recoverable defaults", () => {
      const f = realSnapshotFixture("{}", true);
      update(f, { model: "inherit" }, "new");
      expect(JSON.parse(fs.readFileSync(f.backup, "utf8"))).toEqual(profileConfig.createDefaultConfig());
      expect(loadProfileDocument(writerEnv(f)).document).toEqual({ version: 2,
        models: { activeProfile: null, profiles: { new: { "afg-review": { model: "inherit" } } } } });
    });

    it.each(invalidReads)("D1 integrated invalid source %s never saves", (_name, document, diagnostic) => {
      const f = realSnapshotFixture("{}"), bytes = JSON.stringify(document);
      fs.writeFileSync(f.source.configPath, bytes);
      const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync");
      expect(() => update(f, {})).toThrow(diagnostic);
      for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled();
      expect(fs.readFileSync(f.source.configPath, "utf8")).toBe(bytes);
      expect(fs.readdirSync(path.dirname(f.backup))).toEqual(["config.json"]);
    });

    it.each(["before backup", "before save"].flatMap(timing => ["change", "delete", "appear"].map(kind => [timing, kind])))("D2 %s detects source %s and prevents saver", (timing, kind) => {
      const f = realSnapshotFixture("{}", kind === "appear");
      fs.mkdirSync(path.dirname(f.backup), { recursive: true });
      const change = () => kind === "delete" ? fs.unlinkSync(f.source.configPath) : fs.writeFileSync(f.source.configPath, '{"external":true}');
      if (timing === "before backup") {
        const prepare = PrepareProfileAssignmentUseCase.prototype.execute;
        vi.spyOn(PrepareProfileAssignmentUseCase.prototype, "execute").mockImplementation(function (this: PrepareProfileAssignmentUseCase, input) {
          const result = prepare.call(this, input);
          change();
          return result;
        });
      } else {
        const acquire = NodeMigrationSnapshotAdapter.prototype.acquire;
        vi.spyOn(NodeMigrationSnapshotAdapter.prototype, "acquire").mockImplementation(function (this: NodeMigrationSnapshotAdapter, input) {
          const result = acquire.call(this, input);
          change();
          return result;
        });
      }
      const save = vi.spyOn(profileConfig, "saveConfig");
      expect(() => update(f, { reasoningEffort: "high" })).toThrow("Profile source changed");
      expect(save).not.toHaveBeenCalled();
      if (kind === "delete") expect(fs.existsSync(f.source.configPath)).toBe(false);
      else expect(fs.readFileSync(f.source.configPath, "utf8")).toBe('{"external":true}');
      expect(fs.existsSync(f.backup)).toBe(timing === "before save");
      if (timing === "before save") expect(JSON.parse(fs.readFileSync(f.backup, "utf8"))).toEqual(f.source.document);
      expect(fs.readdirSync(path.dirname(f.backup)).some(file => file.endsWith(".tmp"))).toBe(false);
    });

    it.each(["open", "write", "fsync", "close"] as const)("D3 backup %s failure prevents actual saver", stage => {
      const f = realSnapshotFixture("{}");
      const fault = snapshotFault(f.backup, stage), save = vi.spyOn(profileConfig, "saveConfig");
      let caught: unknown;
      try { update(f, { reasoningEffort: "high" }); } catch (error) { caught = error; }
      expect(caught).toBe(fault.failure);
      expect(save).not.toHaveBeenCalled();
      f.unchanged(false);
    });

    it.each(["{", "{ }"])("D2 refuses prior malformed or mismatched snapshot %s without save", bytes => {
      const f = realSnapshotFixture("{}");
      fs.writeFileSync(f.backup, bytes);
      const save = vi.spyOn(profileConfig, "saveConfig");
      expect(() => update(f, { reasoningEffort: "high" })).toThrow();
      expect(save).not.toHaveBeenCalled();
      f.unchanged(true, Buffer.from(bytes));
    });

    it.each(["serialize", "write", "fsync", "close", "rename"] as const)("D3 saver %s failure preserves source and completed snapshot for retry", stage => {
      const f = realSnapshotFixture("{}"), fault = configFault(stage);
      let caught: unknown;
      try { update(f, { reasoningEffort: "high" }); } catch (error) { caught = error; }
      expect(caught).toBe(fault);
      f.unchanged();
      vi.restoreAllMocks();
      expect(update(f, { reasoningEffort: "high" })).toEqual({ configPath: f.source.configPath, version: 2, snapshotPath: f.backup });
      expect(fs.readFileSync(f.backup)).toEqual(f.source.sourceBytes);
      expect(loadProfileDocument(writerEnv(f)).document.version).toBe(2);
    });

    it("D2 legacy-only change preserves absent version despite unrelated structured slot", () => {
      const f = realSnapshotFixture('{"models":{"profiles":{"work":{"review":"old","afg-specify":{"reasoningEffort":"low"}}}}}');
      expect(update(f, { model: "new" })).toEqual({ configPath: f.source.configPath, version: 1 });
      expect(loadProfileDocument(writerEnv(f)).document).toEqual({ models: { profiles: { work: { review: "new", "afg-specify": { reasoningEffort: "low" } } } } });
      expect(fs.existsSync(f.backup)).toBe(false);
    });

    it("D1 T2 rejects own undefined patch before save or snapshot", () => {
      const f = realSnapshotFixture('{"models":{"profiles":{"work":{"review":"old"}}}}');
      const save = vi.spyOn(profileConfig, "saveConfig"), mkdir = vi.spyOn(fs, "mkdirSync");
      expect(() => update(f, { model: undefined })).toThrow('models.profiles["work"]["review"].model');
      for (const spy of [save, mkdir]) expect(spy).not.toHaveBeenCalled();
      f.unchanged(false);
    });
  });
}
