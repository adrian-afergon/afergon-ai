import { expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import { RawProfileDocumentCloner } from "../scripts/lib/model-profiles/domain/raw-profile-document-cloner.js";
import type { RawProfileDocument } from "../scripts/lib/model-profiles/domain/profile-document.js";
import { ReadProfileDocumentUseCase } from "../scripts/lib/model-profiles/application/read-profile-document-use-case.js";
import type { ObservedProfile, ProfileDocumentObservation } from "../scripts/lib/model-profiles/application/profile-document-observation.js";
import type { ProfileStoragePort } from "../scripts/lib/model-profiles/application/profile-storage-port.js";
import type { SnapshotPort } from "../scripts/lib/model-profiles/application/snapshot-port.js";
import type { AcquireMigrationSnapshotInput, SnapshotReceipt } from "../scripts/lib/model-profiles/application/migration-snapshot-contracts.js";
import type { AffectedPair } from "../scripts/lib/model-profiles/domain/profile-resolution.js";
import { ProfileLifecycleUseCase } from "../scripts/lib/model-profiles/application/profile-lifecycle-use-case.js";

class LifecycleMemoryStorage implements ProfileStoragePort {
  readonly log: string[] = [];
  currentBytes?: Uint8Array;
  saved?: RawProfileDocument;
  failPersist?: Error;
  observation: ObservedProfile;

  constructor(observation: ObservedProfile) {
    this.observation = observation;
    this.currentBytes = observation.source.sourceBytes;
  }

  observe(): ObservedProfile {
    this.log.push("observe");
    return this.observation;
  }

  recheck(source: ProfileDocumentObservation): void {
    this.log.push("recheck");
    if (
      source.exists !== (this.currentBytes !== undefined) ||
      String(source.sourceBytes) !== String(this.currentBytes)
    ) {
      throw new Error("Profile source changed");
    }
  }

  atomicPersist(document: RawProfileDocument, _source: ProfileDocumentObservation): void {
    this.log.push("persist");
    if (this.failPersist) throw this.failPersist;
    this.saved = document;
    this.currentBytes = new TextEncoder().encode(JSON.stringify(document));
    this.observation = {
      document: JSON.parse(JSON.stringify(document)) as RawProfileDocument,
      source: { sourceIdentity: this.observation.source.sourceIdentity, exists: true, sourceBytes: this.currentBytes },
    };
  }
}

class LifecycleMemorySnapshots implements SnapshotPort {
  input?: AcquireMigrationSnapshotInput;

  acquire(input: AcquireMigrationSnapshotInput): SnapshotReceipt {
    this.input = input;
    return { snapshotPath: "memory:backup", disposition: "created", complete: true };
  }
}

class PairsValidator {
  readonly calls: AffectedPair[][] = [];
  constructor(
    private readonly rejection?: Error,
    private readonly defer = false,
  ) {}

  async validateAffectedPairs(pairs: readonly AffectedPair[]): Promise<void> {
    this.calls.push(pairs.map((pair) => ({ ...pair })));
    if (this.defer) await new Promise((resolve) => setTimeout(resolve, 0));
    if (this.rejection) throw this.rejection;
  }
}

function lifecycleMemory(document: RawProfileDocument, pairsOverride?: PairsValidator) {
  const bytes = new TextEncoder().encode(JSON.stringify(document));
  const storage = new LifecycleMemoryStorage({
    document,
    source: { sourceIdentity: "configured:memory", exists: true, sourceBytes: bytes },
  });
  const snapshots = new LifecycleMemorySnapshots();
  const agents = new AgentTargetPolicy();
  const validator = new ProfileDocumentPolicy(agents);
  const reader = new ReadProfileDocumentUseCase(storage, validator);
  const read = vi.spyOn(reader, "execute");
  const persist = vi.spyOn(storage, "atomicPersist");
  const pairs = pairsOverride ?? new PairsValidator();
  const lifecycle = new ProfileLifecycleUseCase(
    reader,
    validator,
    new RawProfileDocumentCloner(),
    storage,
    snapshots,
    pairs,
  );
  return { document, bytes, storage, snapshots, pairs, read, persist, validator, lifecycle };
}

it("saving an assignment to the active profile commits one atomic change with refresh intent", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" }, other: {} } },
  });
  const result = await f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } });
  expect(f.storage.log).toEqual(["observe", "recheck", "recheck", "persist"]);
  expect(f.storage.saved?.models).toEqual({
    activeProfile: "work",
    profiles: { work: { review: { model: "openai/gpt-5.5", reasoningEffort: "low" } }, other: {} },
  });
  expect(result.refreshIntent).toBe(true);
  expect(result.desiredState.kind).toBe("active");
  expect(result.desiredState.profileName).toBe("work");
  expect(result.version).toBe(2);
  expect(result.configPath).toBe("configured:memory");
});

it("rejected affected-pair validation identifies pairs and leaves everything unchanged", async () => {
  const f = lifecycleMemory(
    { version: 2, models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" } } } },
    new PairsValidator(new Error("unsupported pair")),
  );
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("unsupported pair");
  expect(f.pairs.calls).toEqual([[{ agent: "afg-review", model: "openai/gpt-5.5", effort: "low" }]]);
  expect(f.storage.log).toEqual(["observe"]);
  expect(f.storage.saved).toBeUndefined();
  expect(f.storage.currentBytes).toBe(f.bytes);
  expect((f.document.models as { profiles: Record<string, Record<string, unknown>> }).profiles.work.review).toBe("openai/gpt-5.5");
});

it("structured writes to a version 1 document snapshot the original source before promotion", async () => {
  const f = lifecycleMemory({
    version: 1,
    memo: ["café"],
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" } } },
  });
  const result = await f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } });
  expect(f.snapshots.input?.source).toBe(f.read.mock.results[0].value.source);
  expect(f.snapshots.input?.recoveryDocument).toBe(f.document);
  expect(f.snapshots.input?.recoveryDocument.version).toBe(1);
  expect(f.persist).toHaveBeenCalledOnce();
  expect(f.storage.saved?.version).toBe(2);
  expect(result.version).toBe(2);
  expect(result.snapshotPath).toBe("memory:backup");
  expect(f.document.version).toBe(1);
});

it("external source changes abort the commit before persistence", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" } } },
  });
  f.storage.currentBytes = new Uint8Array([9, 9]);
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("Profile source changed");
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.storage.saved).toBeUndefined();
});

it("external changes before migration abort without acquiring a snapshot", async () => {
  const f = lifecycleMemory({
    version: 1,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" } } },
  });
  f.storage.currentBytes = new Uint8Array([9, 9]);
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("Profile source changed");
  expect(f.snapshots.input).toBeUndefined();
  expect(f.persist).not.toHaveBeenCalled();
});

it("candidate validation failures abort before recheck and persistence", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" } } },
  });
  const realValidate = f.validator.validate.bind(f.validator);
  let calls = 0;
  vi.spyOn(f.validator, "validate").mockImplementation((document, source) => {
    calls += 1;
    if (calls === 2) throw new Error("candidate invalid");
    return realValidate(document, source);
  });
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("candidate invalid");
  expect(calls).toBe(2);
  expect(f.storage.log).toEqual(["observe"]);
  expect(f.persist).not.toHaveBeenCalled();
});

it("final validation after version promotion aborts before persistence", async () => {
  const f = lifecycleMemory({
    version: 1,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" } } },
  });
  const realValidate = f.validator.validate.bind(f.validator);
  let calls = 0;
  vi.spyOn(f.validator, "validate").mockImplementation((document, source) => {
    calls += 1;
    if (calls === 3) throw new Error("promoted candidate invalid");
    return realValidate(document, source);
  });
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("promoted candidate invalid");
  expect(calls).toBe(3);
  expect(f.snapshots.input?.recoveryDocument.version).toBe(1);
  expect(f.persist).not.toHaveBeenCalled();
});

it("deferred async rejections are awaited before any write happens", async () => {
  const f = lifecycleMemory(
    { version: 2, models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" } } } },
    new PairsValidator(new Error("deferred rejection"), true),
  );
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("deferred rejection");
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.storage.saved).toBeUndefined();
});

it("failed atomic saves preserve prior bytes and retain the completed snapshot", async () => {
  const f = lifecycleMemory({
    version: 1,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" } } },
  });
  f.storage.failPersist = new Error("disk full");
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("disk full");
  expect(f.snapshots.input?.recoveryDocument).toBe(f.document);
  expect(f.storage.saved).toBeUndefined();
  expect(f.storage.currentBytes).toBe(f.bytes);
});

it("missing sources are refused instead of being treated as intentional reset", async () => {
  const bytes = new TextEncoder().encode(JSON.stringify({ version: 2 }));
  const storage = new LifecycleMemoryStorage({
    document: { version: 2 },
    source: { sourceIdentity: "configured:memory", exists: false, sourceBytes: undefined },
  });
  storage.currentBytes = bytes;
  const agents = new AgentTargetPolicy();
  const validator = new ProfileDocumentPolicy(agents);
  const lifecycle = new ProfileLifecycleUseCase(
    new ReadProfileDocumentUseCase(storage, validator),
    validator,
    new RawProfileDocumentCloner(),
    storage,
    new LifecycleMemorySnapshots(),
    new PairsValidator(),
  );
  await expect(
    lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("does not exist");
  expect(storage.log).toEqual(["observe"]);
});

it("editing an inactive profile persists without refresh intent", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "main", profiles: { main: { review: "openai/gpt-5.5" }, other: { debate: "x/model" } } },
  });
  const result = await f.lifecycle.saveAssignment({ profileName: "other", agentName: "debate", patch: { reasoningEffort: "low" } });
  expect(f.persist).toHaveBeenCalledOnce();
  expect(result.refreshIntent).toBe(false);
  expect(result.desiredState.kind).toBe("active");
  expect(result.desiredState.profileName).toBe("main");
  expect(result.desiredState.assignments).toEqual([{ agent: "review", value: "openai/gpt-5.5" }]);
});

it("no-op assignments return the current desired state without writing", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: { model: "openai/gpt-5.5", reasoningEffort: "low" } } } },
  });
  const result = await f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } });
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.pairs.calls).toEqual([]);
  expect(result.refreshIntent).toBe(false);
  expect(result.version).toBe(2);
});

it("dangling active references surface as errors instead of empty desired state", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "ghost", profiles: { work: { review: "openai/gpt-5.5" } } },
  });
  await expect(
    f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("does not exist");
  expect(f.persist).not.toHaveBeenCalled();
});

it("unreadable sources surface the observation error without writes", async () => {
  const storage = new LifecycleMemoryStorage({
    document: {},
    source: { sourceIdentity: "configured:memory", exists: true, sourceBytes: new Uint8Array([1]) },
  });
  const agents = new AgentTargetPolicy();
  const validator = new ProfileDocumentPolicy(agents);
  vi.spyOn(storage, "observe").mockImplementation(() => {
    storage.log.push("observe");
    throw new Error("EACCES: permission denied");
  });
  const lifecycle = new ProfileLifecycleUseCase(
    new ReadProfileDocumentUseCase(storage, validator),
    validator,
    new RawProfileDocumentCloner(),
    storage,
    new LifecycleMemorySnapshots(),
    new PairsValidator(),
  );
  await expect(
    lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } }),
  ).rejects.toThrow("EACCES");
  expect(storage.log).toEqual(["observe"]);
});

it("clearing effort on the active profile commits with stale-effort cleanup coverage", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: { model: "openai/gpt-5.5", reasoningEffort: "low" } } } },
  });
  const result = await f.lifecycle.clearEffort({ profileName: "work", agentName: "review" });
  expect(f.persist).toHaveBeenCalledOnce();
  expect(f.storage.saved?.models).toEqual({
    activeProfile: "work",
    profiles: { work: { review: { model: "openai/gpt-5.5" } } },
  });
  expect(result.refreshIntent).toBe(true);
  expect(result.desiredState.cleanupCoverage).toEqual(["review"]);
  expect(f.pairs.calls).toEqual([[{ agent: "afg-review", model: "openai/gpt-5.5", effort: null }]]);
});

it("clearing effort on an inactive profile persists without refresh intent or coverage", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "main", profiles: { main: {}, other: { review: { model: "openai/gpt-5.5", reasoningEffort: "low" } } } },
  });
  const result = await f.lifecycle.clearEffort({ profileName: "other", agentName: "review" });
  expect(f.persist).toHaveBeenCalledOnce();
  expect(result.refreshIntent).toBe(false);
  expect(result.desiredState.cleanupCoverage).toEqual([]);
  expect(result.desiredState.profileName).toBe("main");
});

it("bulk saves apply every assignment in one atomic commit", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5", debate: "other/model" } } },
  });
  const result = await f.lifecycle.saveAssignments({
    profileName: "work",
    assignments: [
      { profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } },
      { profileName: "work", agentName: "debate", patch: { model: "anthropic/claude-opus", reasoningEffort: "high" } },
    ],
  });
  expect(f.persist).toHaveBeenCalledOnce();
  expect(f.storage.saved?.models).toEqual({
    activeProfile: "work",
    profiles: {
      work: {
        review: { model: "openai/gpt-5.5", reasoningEffort: "low" },
        debate: { model: "anthropic/claude-opus", reasoningEffort: "high" },
      },
    },
  });
  expect(result.refreshIntent).toBe(true);
  expect(f.pairs.calls.length).toBe(1);
  expect(f.pairs.calls[0]).toEqual([
    { agent: "afg-debate", model: "anthropic/claude-opus", effort: "high" },
    { agent: "afg-review", model: "openai/gpt-5.5", effort: "low" },
  ]);
});

it("cloning preserves assignment metadata and later clone edits never change the source", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: {
      activeProfile: "work",
      profiles: { work: { review: "legacy/model", "afg-specify": { model: "openai/gpt-5.5", reasoningEffort: "low", note: "keep" } } },
    },
  });
  const result = await f.lifecycle.cloneProfile({ sourceProfileName: "work", targetProfileName: "copy" });
  expect(f.persist).toHaveBeenCalledOnce();
  expect((f.storage.saved?.models as { profiles: Record<string, Record<string, unknown>> }).profiles).toEqual({
    work: { review: "legacy/model", "afg-specify": { model: "openai/gpt-5.5", reasoningEffort: "low", note: "keep" } },
    copy: { review: "legacy/model", "afg-specify": { model: "openai/gpt-5.5", reasoningEffort: "low", note: "keep" } },
  });
  expect(result.refreshIntent).toBe(false);
  expect(result.desiredState.profileName).toBe("work");
  expect(f.pairs.calls[0]).toEqual([
    { agent: "afg-specify", model: "openai/gpt-5.5", effort: "low" },
    { agent: "afg-review", model: "legacy/model", effort: null },
  ]);
});

it("later edits to a clone never change the source profile", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "legacy/model" } } },
  });
  await f.lifecycle.cloneProfile({ sourceProfileName: "work", targetProfileName: "copy" });
  await f.lifecycle.saveAssignment({ profileName: "copy", agentName: "review", patch: { reasoningEffort: "high" } });
  const profiles = f.storage.saved?.models as { profiles: Record<string, Record<string, unknown>> };
  expect(profiles.profiles.work).toEqual({ review: "legacy/model" });
  expect(profiles.profiles.copy).toEqual({ review: { model: "legacy/model", reasoningEffort: "high" } });
});

it("switching to an empty profile requests complete cleanup for every previously assigned agent", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: {
      activeProfile: "work",
      profiles: {
        work: { review: { model: "openai/gpt-5.5", reasoningEffort: "high" }, "legacy-agent": { reasoningEffort: "low" } },
        empty: {},
      },
    },
  });
  const result = await f.lifecycle.switchProfile({ profileName: "empty" });
  expect(f.persist).toHaveBeenCalledOnce();
  expect((f.storage.saved?.models as { activeProfile: string }).activeProfile).toBe("empty");
  expect(result.refreshIntent).toBe(true);
  expect(result.desiredState.kind).toBe("active");
  expect(result.desiredState.profileName).toBe("empty");
  expect(result.desiredState.assignments).toEqual([]);
  expect(result.desiredState.cleanupCoverage).toEqual(["review", "legacy-agent"]);
  expect(f.pairs.calls).toEqual([[]]);
});

it("switching to a profile with assignments covers only the stale overrides", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: {
      activeProfile: "work",
      profiles: {
        work: { review: { model: "openai/gpt-5.5", reasoningEffort: "high" }, debate: "other/model" },
        next: { review: { model: "openai/gpt-5.5" } },
      },
    },
  });
  const result = await f.lifecycle.switchProfile({ profileName: "next" });
  expect(result.desiredState.cleanupCoverage).toEqual(["review", "debate"]);
  expect(result.desiredState.assignments).toEqual([{ agent: "review", value: { model: "openai/gpt-5.5" } }]);
  expect(f.pairs.calls[0]).toEqual([{ agent: "afg-review", model: "openai/gpt-5.5", effort: null }]);
});

it("switching to a missing profile is refused without writes", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: {} } },
  });
  await expect(f.lifecycle.switchProfile({ profileName: "ghost" })).rejects.toThrow("Profile 'ghost' does not exist");
  expect(f.persist).not.toHaveBeenCalled();
});

it("switching to the already active profile is a no-op without writes", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "legacy/model" } } },
  });
  const result = await f.lifecycle.switchProfile({ profileName: "work" });
  expect(f.persist).not.toHaveBeenCalled();
  expect(f.pairs.calls).toEqual([]);
  expect(result.refreshIntent).toBe(false);
  expect(result.desiredState.profileName).toBe("work");
});

it("deleting an inactive profile keeps the active selection without refresh intent", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "main", profiles: { main: { review: "legacy/model" }, other: { debate: "x/model" } } },
  });
  const result = await f.lifecycle.deleteProfile({ profileName: "other" });
  expect(f.persist).toHaveBeenCalledOnce();
  expect(f.storage.saved?.models).toEqual({
    activeProfile: "main",
    profiles: { main: { review: "legacy/model" } },
  });
  expect(result.refreshIntent).toBe(false);
  expect(result.desiredState.kind).toBe("active");
  expect(result.desiredState.profileName).toBe("main");
  expect(result.desiredState.cleanupCoverage).toEqual([]);
  expect(f.pairs.calls).toEqual([[]]);
});

it("deleting the active profile selects the lexicographically first remaining profile", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: {
      activeProfile: "zeta",
      profiles: {
        zeta: { review: { model: "openai/gpt-5.5", reasoningEffort: "high" } },
        alpha: { review: { model: "openai/gpt-5.5" } },
        mid: {},
      },
    },
  });
  const result = await f.lifecycle.deleteProfile({ profileName: "zeta" });
  expect((f.storage.saved?.models as { activeProfile: string }).activeProfile).toBe("alpha");
  expect(result.refreshIntent).toBe(true);
  expect(result.desiredState.profileName).toBe("alpha");
  expect(result.desiredState.cleanupCoverage).toEqual(["review"]);
  expect(f.pairs.calls[0]).toEqual([{ agent: "afg-review", model: "openai/gpt-5.5", effort: null }]);
});

it("deleting the final profile resolves explicit no-active cleanup intent", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "only", profiles: { only: { review: { model: "openai/gpt-5.5", reasoningEffort: "high" } } } },
  });
  const result = await f.lifecycle.deleteProfile({ profileName: "only" });
  expect(f.storage.saved?.models).toEqual({ activeProfile: null, profiles: {} });
  expect(result.refreshIntent).toBe(true);
  expect(result.desiredState.kind).toBe("no-active");
  expect(result.desiredState.profileName).toBeNull();
  expect(result.desiredState.assignments).toEqual([]);
  expect(result.desiredState.cleanupCoverage).toEqual(["review"]);
  expect(f.pairs.calls).toEqual([[]]);
});

it("deleting a missing profile is refused without writes", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: {} } },
  });
  await expect(f.lifecycle.deleteProfile({ profileName: "ghost" })).rejects.toThrow("Profile 'ghost' does not exist");
  expect(f.persist).not.toHaveBeenCalled();
});

it("editing a profile in a valid null-active document reports intentional no-active state", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: null, profiles: { work: { review: "legacy/model" } } },
  });
  const result = await f.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } });
  expect(f.persist).toHaveBeenCalledOnce();
  expect(result.refreshIntent).toBe(false);
  expect(result.desiredState.kind).toBe("no-active");
  expect(result.desiredState.profileName).toBeNull();
  expect(result.desiredState.assignments).toEqual([]);
});

it("emitted lifecycle cold-imports without IO and executes real saves and refusals", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-p3-emitted-"));
  const vertical = new URL("../dist/scripts/lib/model-profiles/", import.meta.url).href;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from "node:assert/strict";
    import fs from "node:fs";
    const vertical = ${JSON.stringify(vertical)};
    const root = ${JSON.stringify(root)};
    const originals = [];
    const moduleReads = [
      vertical + "application/profile-lifecycle-use-case.js",
      vertical + "domain/profile-resolution.js",
      vertical + "domain/agent-target-policy.js",
      vertical + "domain/stored-assignment.js",
    ];
    function guard() {
      for (const [object, method] of [[fs, "readFileSync"], [fs, "writeFileSync"], [fs, "renameSync"], [fs, "mkdirSync"]]) {
        const original = object[method];
        originals.push([object, method, original]);
        object[method] = (...args) => {
          const file = String(args[0]);
          if (method === "readFileSync" && moduleReads.includes(file)) return original(...args);
          throw new Error("Unexpected ambient " + method);
        };
      }
    }
    function restore() { for (const [object, method, original] of originals.splice(0)) object[method] = original; }
    let lifecycleModule;
    guard();
    try {
      lifecycleModule = await import(vertical + "application/profile-lifecycle-use-case.js");
    } finally { restore(); }
    assert.equal(typeof lifecycleModule.ProfileLifecycleUseCase, "function");
    const { createProfileLifecycleCapabilities } = await import(vertical + "infrastructure/profile-composition.js");
    const configPath = root + "/config.json";
    const document = { version: 2, models: { activeProfile: "work", profiles: { work: { review: "openai/gpt-5.5" } } } };
    fs.writeFileSync(configPath, JSON.stringify(document), { mode: 0o600 });
    let validationCalls = 0;
    const capabilities = createProfileLifecycleCapabilities({ AFERGON_AI_CONFIG_DIR: root }, {
      validateAffectedPairs: async () => {
        validationCalls += 1;
        if (validationCalls === 2) throw new Error("unsupported pair");
      },
    });
    const result = await capabilities.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "low" } });
    assert.equal(result.refreshIntent, true);
    assert.equal(result.desiredState.kind, "active");
    const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
    assert.deepEqual(saved.models.profiles.work.review, { model: "openai/gpt-5.5", reasoningEffort: "low" });
    const before = fs.readFileSync(configPath);
    await assert.rejects(
      capabilities.lifecycle.saveAssignment({ profileName: "work", agentName: "review", patch: { reasoningEffort: "high" } }),
      /unsupported pair/,
    );
    assert.deepEqual(fs.readFileSync(configPath), before);
  `], { encoding: "utf8" });
  try {
    expect(child.status).toBe(0);
    expect(child.stderr).toBe("");
  } catch (error) {
    throw new Error(`emitted lifecycle child failed: ${child.stderr || error}`);
  }
});

it("cloning onto an existing profile is refused without writes", async () => {
  const f = lifecycleMemory({
    version: 2,
    models: { activeProfile: "work", profiles: { work: { review: "legacy/model" }, copy: {} } },
  });
  await expect(f.lifecycle.cloneProfile({ sourceProfileName: "work", targetProfileName: "copy" })).rejects.toThrow(
    "Profile 'copy' already exists",
  );
  expect(f.persist).not.toHaveBeenCalled();
});
