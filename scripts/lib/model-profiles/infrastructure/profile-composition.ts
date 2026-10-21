import fs from "node:fs";
import path from "node:path";
import { createDefaultConfig, getConfigPath, saveConfig } from "../../model-profiles-config.js";
import { AgentTargetPolicy } from "../domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import { ProfileAssignmentPolicy } from "../domain/profile-assignment-policy.js";
import { RawProfileDocumentCloner } from "../domain/raw-profile-document-cloner.js";
import { ReadProfileDocumentUseCase } from "../application/read-profile-document-use-case.js";
import { PrepareProfileAssignmentUseCase } from "../application/prepare-profile-assignment-use-case.js";
import { UpdateProfileAssignmentUseCase } from "../application/update-profile-assignment-use-case.js";
import { LegacyProfileDefaultsAdapter } from "./legacy-profile-defaults-adapter.js";
import { LegacyAtomicProfileSaverAdapter } from "./legacy-atomic-profile-saver-adapter.js";
import { NodeProfileStorageAdapter } from "./node-profile-storage-adapter.js";
import { NodeSnapshotInspectionAdapter } from "./node-snapshot-inspection-adapter.js";
import { NodeMigrationSnapshotAdapter } from "./node-migration-snapshot-adapter.js";

// Pure policy composition remains usable by validation/preparation edges without
// selecting an environment, path, defaults or filesystem capability.
export function createProfilePolicies() {
  const agents = new AgentTargetPolicy();
  const validator = new ProfileDocumentPolicy(agents);
  const preparer = new PrepareProfileAssignmentUseCase(new ProfileAssignmentPolicy(validator, agents, new RawProfileDocumentCloner()));
  return { validator, preparer };
}

export function createProfileCapabilities(initialEnv: NodeJS.ProcessEnv = process.env) {
  const configPath = path.resolve(getConfigPath(initialEnv));
  const boundEnv = { ...initialEnv, AFERGON_AI_CONFIG_DIR: path.dirname(configPath) };
  if (path.basename(configPath) !== "config.json" || getConfigPath(boundEnv) !== configPath) {
    throw new Error("Invalid profile config binding");
  }
  const { validator, preparer } = createProfilePolicies();
  const defaults = new LegacyProfileDefaultsAdapter(createDefaultConfig);
  const storage = new NodeProfileStorageAdapter(configPath, fs, defaults, new LegacyAtomicProfileSaverAdapter(saveConfig, boundEnv));
  const reader = new ReadProfileDocumentUseCase(storage, validator);
  const inspector = new NodeSnapshotInspectionAdapter(configPath, fs, validator, defaults);
  const snapshots = new NodeMigrationSnapshotAdapter(fs, inspector, storage);
  const update = new UpdateProfileAssignmentUseCase(reader, preparer, validator, storage, snapshots);
  return { configPath, reader, preparer, validator, storage, inspector, snapshots, update };
}

export function createProfileSourceCapabilities(sourcePath: string) {
  const configPath = path.resolve(sourcePath);
  // The legacy snapshot edge was fail-closed for custom basenames: its storage
  // capability was bound to config.json. Preserve that boundary explicitly.
  if (path.basename(configPath) !== "config.json") throw new Error("Profile source changed");
  return createProfileCapabilities({ AFERGON_AI_CONFIG_DIR: path.dirname(configPath) });
}
