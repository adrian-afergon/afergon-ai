import fs from "node:fs";
import { vi } from "vitest";
import { createDefaultConfig } from "../scripts/lib/model-profiles-config.js";
import { AgentTargetPolicy } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";
import { LegacyProfileDefaultsAdapter } from "../scripts/lib/model-profiles/infrastructure/legacy-profile-defaults-adapter.js";
import { NodeSnapshotInspectionAdapter } from "../scripts/lib/model-profiles/infrastructure/node-snapshot-inspection-adapter.js";
import type { AcquireMigrationSnapshotInput } from "../scripts/lib/model-profiles/application/migration-snapshot-contracts.js";

export function snapshotFixture() {
  const configPath = "/configured/profiles/config.json";
  const snapshotPath = `${configPath}.pre-v2.bak`;
  const raw = { version: 1, memo: "café ☕", models: { profiles: { work: { review: "custom/model" } } } };
  const bytes = Buffer.from(`${JSON.stringify(raw, null, 3)}\n`);
  const filesystem = { ...fs };
  const read = vi.spyOn(filesystem, "readFileSync").mockImplementation(() => {
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  });
  const writes = ["mkdirSync", "openSync", "writeFileSync", "writeSync", "rmSync", "unlinkSync", "chmodSync", "renameSync"] as const;
  const writeSpies = writes.map((method) => vi.spyOn(filesystem, method).mockImplementation(() => {
    throw new Error(`Unexpected ${method}`);
  }));
  const validator = new ProfileDocumentPolicy(new AgentTargetPolicy());
  const defaults = new LegacyProfileDefaultsAdapter(createDefaultConfig);
  const inspector = new NodeSnapshotInspectionAdapter(configPath, filesystem, validator, defaults);
  const input: AcquireMigrationSnapshotInput = {
    source: { sourceIdentity: configPath, exists: true, sourceBytes: new Uint8Array(bytes) },
    recoveryDocument: raw,
  };
  return { inspector, input, raw, bytes, read, writeSpies, validator, defaults, configPath, snapshotPath };
}
