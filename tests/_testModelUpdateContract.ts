import fs from "node:fs";
import path from "node:path";
import { expect, it, vi } from "vitest";
import * as profileConfig from "../scripts/lib/model-profiles-config.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import { PrepareProfileAssignmentUseCase } from "../scripts/lib/model-profiles/application/prepare-profile-assignment-use-case.js";
import type { UpdateAssignmentInput } from "../scripts/lib/model-profiles/application/update-profile-assignment-use-case.js";
import { NodeProfileStorageAdapter } from "../scripts/lib/model-profiles/infrastructure/node-profile-storage-adapter.js";
import { NodeMigrationSnapshotAdapter } from "../scripts/lib/model-profiles/infrastructure/node-migration-snapshot-adapter.js";
import { updateProfileAssignment } from "../scripts/lib/model-profiles/infrastructure/profile-store.js";
import { realSnapshotFixture } from "./_testModelSnapshotContract.js";

// The original S12 disk/order assertions now enter through the original API.
// Restored prototype spies reach its real semantic collaborators, without hooks.
function realUpdate(contents: string) {
  const fixture = realSnapshotFixture(contents);
  const env = { HOME: fixture.root, XDG_CONFIG_HOME: fixture.root, AFERGON_AI_CONFIG_DIR: path.dirname(fixture.source.configPath) };
  const save = vi.spyOn(profileConfig, "saveConfig");
  const validator = ProfileDocumentPolicy.prototype;
  const storage = NodeProfileStorageAdapter.prototype;
  const snapshots = NodeMigrationSnapshotAdapter.prototype;
  const preparer = PrepareProfileAssignmentUseCase.prototype;
  const useCase = { execute: (command: UpdateAssignmentInput) => updateProfileAssignment(command.profileName, command.agentName, command.patch, { env }) };
  const input = { profileName: "work", agentName: "review", patch: { reasoningEffort: "high" } };
  return { ...fixture, env, validator, storage, snapshots, preparer, useCase, input, save };
}

export function registerUpdateOrderContract() {
  it("D1 explicit mixed v1 identical effort preserves exact schema and bytes", () => {
    const f = realUpdate('{ "version":1,"models":{"profiles":{"work":{"review":{"reasoningEffort":"high"},"afg-specify":"inherit"}}}}');
    expect(f.useCase.execute(f.input)).toEqual({ configPath: f.source.configPath, version: 1 });
    f.unchanged(false);
    expect(f.save).not.toHaveBeenCalled();
  });

  it("D2 v2 rechecks after pure final validation before actual saver", () => {
    const f = realUpdate('{"version":2}');
    let preflightCompleted = false;
    const recheck = f.storage.recheck;
    vi.spyOn(f.storage, "recheck").mockImplementation(function (this: NodeProfileStorageAdapter, source) {
      recheck.call(this, source);
      preflightCompleted = true;
    });
    const validate = f.validator.validate;
    vi.spyOn(f.validator, "validate").mockImplementation(function (this: ProfileDocumentPolicy, raw, identity) {
      const result = validate.call(this, raw, identity);
      if (preflightCompleted) fs.writeFileSync(f.source.configPath, '{"external":true}');
      return result;
    });
    expect(() => f.useCase.execute(f.input)).toThrow("Profile source changed");
    expect(f.save).not.toHaveBeenCalled();
    expect(fs.readFileSync(f.source.configPath, "utf8")).toBe('{"external":true}');
    expect(fs.existsSync(f.backup)).toBe(false);
  });

  it("D3 T2 future candidate refuses before backup or downgrade", () => {
    const f = realUpdate('{}');
    const prepare = f.preparer.execute;
    vi.spyOn(f.preparer, "execute").mockImplementation(function (this: PrepareProfileAssignmentUseCase, input) {
      const candidate = prepare.call(this, input);
      candidate.document.version = 3;
      return candidate;
    });
    const mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => f.useCase.execute(f.input)).toThrow("unsupported profile version 3");
    for (const spy of [f.save, mkdir]) expect(spy).not.toHaveBeenCalled();
    f.unchanged(false);
  });

  it("D3 T3 future candidate keeps the exact update diagnostic", () => {
    const f = realUpdate('{}');
    const prepare = f.preparer.execute;
    vi.spyOn(f.preparer, "execute").mockImplementation(function (this: PrepareProfileAssignmentUseCase, input) {
      const candidate = prepare.call(this, input);
      candidate.document.version = 3;
      return candidate;
    });
    expect(() => f.useCase.execute(f.input)).toThrow(new Error("Cannot update unsupported profile version 3"));
    f.unchanged(false);
  });

  it("D3 T1 invalid candidate prevents backup stage and save", () => {
    const f = realUpdate('{}');
    const prepare = f.preparer.execute;
    vi.spyOn(f.preparer, "execute").mockImplementation(function (this: PrepareProfileAssignmentUseCase, input) { return { ...prepare.call(this, input), document: { models: null } }; });
    const mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => f.useCase.execute(f.input)).toThrow("models must be an object");
    for (const spy of [f.save, mkdir]) expect(spy).not.toHaveBeenCalled();
    f.unchanged(false);
  });

  it("D3 validates versioned candidate before actual save", () => {
    const f = realUpdate('{}');
    const versions: unknown[] = [];
    const validate = f.validator.validate;
    vi.spyOn(f.validator, "validate").mockImplementation(function (this: ProfileDocumentPolicy, raw, identity) {
      versions.push((raw as Record<string, unknown>).version);
      return validate.call(this, raw, identity);
    });
    f.save.mockImplementation((candidate, env) => {
      expect(versions.at(-1)).toBe(2);
      // Call the original implementation, not the already-spied export.
      return originalSave(candidate, env);
    });
    f.useCase.execute(f.input);
    expect(f.save).toHaveBeenCalledOnce();
    expect(JSON.parse(fs.readFileSync(f.source.configPath, "utf8")).version).toBe(2);
  });

  it("D2 T2 rejects stale source before invoking snapshot stage", () => {
    const f = realUpdate('{"models":{"profiles":{"work":{"review":"old"}}}}');
    const prepare = f.preparer.execute;
    vi.spyOn(f.preparer, "execute").mockImplementation(function (this: PrepareProfileAssignmentUseCase, input) {
      const candidate = prepare.call(this, input);
      fs.unlinkSync(f.source.configPath);
      return candidate;
    });
    const acquire = vi.spyOn(f.snapshots, "acquire");
    expect(() => f.useCase.execute(f.input)).toThrow("Profile source changed");
    for (const spy of [acquire, f.save]) expect(spy).not.toHaveBeenCalled();
    expect(fs.readdirSync(path.dirname(f.backup))).toEqual([]);
  });

  it("D2 T1 rejects source changed after completed snapshot before save", () => {
    const f = realUpdate('{"models":{"profiles":{"work":{"review":"old"}}}}');
    const acquire = f.snapshots.acquire;
    vi.spyOn(f.snapshots, "acquire").mockImplementation(function (this: NodeMigrationSnapshotAdapter, input) {
      const receipt = acquire.call(this, input);
      fs.writeFileSync(f.source.configPath, '{"external":true}');
      return receipt;
    });
    expect(() => f.useCase.execute(f.input)).toThrow("Profile source changed");
    expect(f.save).not.toHaveBeenCalled();
    expect(fs.readFileSync(f.source.configPath, "utf8")).toBe('{"external":true}');
    expect(fs.readFileSync(f.backup)).toEqual(f.source.sourceBytes);
  });

  it("D2 first structured change snapshots before real v2 save", () => {
    const f = realUpdate('{\n "models":{"profiles":{"work":{"review":"old"},"other":{"afg-specify":"inherit"}}},"memo":["café"]\n}');
    f.save.mockImplementation((candidate, env) => {
      f.unchanged();
      expect(candidate.version).toBe(2);
      return originalSave(candidate, env);
    });
    expect(f.useCase.execute({ ...f.input, patch: { reasoningEffort: " High " } })).toEqual({ configPath: f.source.configPath, version: 2, snapshotPath: f.backup });
    expect(JSON.parse(fs.readFileSync(f.source.configPath, "utf8"))).toEqual({ ...f.source.document, version: 2,
      models: { profiles: { work: { review: { model: "old", reasoningEffort: " High " } }, other: { "afg-specify": "inherit" } } } });
    expect(fs.readdirSync(path.dirname(f.backup))).toEqual(["config.json", "config.json.pre-v2.bak"]);
  });

  it("D1 T1 refuses future nominal no-op before write I/O", () => {
    const f = realUpdate('{"version":3}');
    const mkdir = vi.spyOn(fs, "mkdirSync"), open = vi.spyOn(fs, "openSync");
    expect(() => f.useCase.execute({ ...f.input, patch: {} })).toThrow("unsupported profile version 3");
    for (const spy of [f.save, mkdir]) expect(spy).not.toHaveBeenCalled();
    expect(open.mock.calls.every(([, flags]) => flags === "r")).toBe(true);
    f.unchanged(false);
  });

  it("D1 T2 future source keeps the exact historical preparation diagnostic", () => {
    const f = realUpdate('{"version":3}');
    const mkdir = vi.spyOn(fs, "mkdirSync");
    expect(() => f.useCase.execute({ ...f.input, patch: {} })).toThrow(new Error("Cannot prepare assignment for unsupported profile version 3."));
    for (const spy of [f.save, mkdir]) expect(spy).not.toHaveBeenCalled();
    f.unchanged(false);
  });

  it("D1 T3 future source interpolates the actual unsupported version", () => {
    const f = realUpdate('{"version":7}');
    expect(() => f.useCase.execute({ ...f.input, patch: {} })).toThrow(new Error("Cannot prepare assignment for unsupported profile version 7."));
    f.unchanged(false);
  });

  it("D1 T4 future source refusal precedes every write attempt for real patches", () => {
    const f = realUpdate('{"version":3}');
    const mkdir = vi.spyOn(fs, "mkdirSync"), open = vi.spyOn(fs, "openSync");
    expect(() => f.useCase.execute(f.input)).toThrow(new Error("Cannot prepare assignment for unsupported profile version 3."));
    for (const spy of [f.save, mkdir]) expect(spy).not.toHaveBeenCalled();
    expect(open.mock.calls.every(([, flags]) => flags === "r")).toBe(true);
    f.unchanged(false);
  });

  it("D1 no-op preserves exact mixed v1 source and prior snapshot", () => {
    const f = realUpdate('{\n "models":{"profiles":{"work":{"review":{"model":" old ","reasoningEffort":" High "},"afg-specify":"inherit"}}}\n}');
    fs.writeFileSync(f.backup, "prior snapshot");
    const mkdir = vi.spyOn(fs, "mkdirSync");
    expect(f.useCase.execute({ ...f.input, patch: { model: " old " } })).toEqual({ configPath: f.source.configPath, version: 1 });
    f.unchanged(true, Buffer.from("prior snapshot"));
    for (const spy of [f.save, mkdir]) expect(spy).not.toHaveBeenCalled();
  });
}

const originalSave = profileConfig.saveConfig;
