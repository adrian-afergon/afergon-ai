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
import { ProfileLifecycleUseCase } from "../application/profile-lifecycle-use-case.js";
import type { ValidateAffectedPairs } from "../application/profile-lifecycle-use-case.js";
import { ValidateProfileCapabilityUseCase } from "../application/validate-profile-capability-use-case.js";
import type { CapabilityContextResolver } from "../application/capability-validation-port.js";
import { OpencodeCapabilityAdapter } from "./opencode-capability-adapter.js";
import { OPENCODE_PIN_CATALOG_EVIDENCE } from "./opencode-capability-evidence.js";
import { OpencodeCompatibilityReport } from "./opencode-compatibility-report.js";

export { OpencodeCapabilityAdapter, OPENCODE_PIN_CATALOG_EVIDENCE, OpencodeCompatibilityReport };
import { ExportModelProfilesUseCase } from "../application/export-model-profiles-use-case.js";
import { ModelOnlyExportPolicy } from "../domain/model-only-export-policy.js";
import { LegacyProfileDefaultsAdapter } from "./legacy-profile-defaults-adapter.js";
import { LegacyAtomicProfileSaverAdapter } from "./legacy-atomic-profile-saver-adapter.js";
import { NodeProfileStorageAdapter } from "./node-profile-storage-adapter.js";
import { NodeSnapshotInspectionAdapter } from "./node-snapshot-inspection-adapter.js";
import { NodeMigrationSnapshotAdapter } from "./node-migration-snapshot-adapter.js";
import { NodeExportDestinationAdapter } from "./node-export-destination-adapter.js";

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
  const exportProfiles = new ExportModelProfilesUseCase(
    reader, validator, new ModelOnlyExportPolicy(new AgentTargetPolicy(), new RawProfileDocumentCloner()),
    new NodeExportDestinationAdapter(fs), storage, `${configPath}.pre-v2.bak`,
  );
  return { configPath, reader, preparer, validator, storage, inspector, snapshots, update, exportProfiles };
}

export function createProfileSourceCapabilities(sourcePath: string) {
  const configPath = path.resolve(sourcePath);
  // The legacy snapshot edge was fail-closed for custom basenames: its storage
  // capability was bound to config.json. Preserve that boundary explicitly.
  if (path.basename(configPath) !== "config.json") throw new Error("Profile source changed");
  return createProfileCapabilities({ AFERGON_AI_CONFIG_DIR: path.dirname(configPath) });
}

// Additive P3 composition: the inactive resolution/lifecycle capability. It
// reuses the original capability wiring, requires the downstream affected-pair
// validator, performs no lifecycle mutation at import or construction, and
// leaves the original capability keyset and live routing untouched.
export function createProfileLifecycleCapabilities(
  initialEnv: NodeJS.ProcessEnv = process.env,
  validateAffectedPairs: ValidateAffectedPairs,
) {
  const capabilities = createProfileCapabilities(initialEnv);
  const lifecycle = new ProfileLifecycleUseCase(
    capabilities.reader,
    capabilities.validator,
    new RawProfileDocumentCloner(),
    capabilities.storage,
    capabilities.snapshots,
    validateAffectedPairs,
    new AgentTargetPolicy(),
  );
  return { ...capabilities, lifecycle };
}

// Additive P4 composition: the inactive capability-validation lifecycle. It
// injects exactly ONE strict validator (the shared capability use case backed
// by the real evidence adapter and the caller-supplied per-pair resolver) into
// the P3 lifecycle factory. No default/no-op acceptance exists; real routes and
// context are supplied by callers, never inferred. Nothing is activated in live
// CLI/TUI/install/update routes.
export function createProfileCapabilityLifecycleCapabilities(
  initialEnv: NodeJS.ProcessEnv = process.env,
  resolver: CapabilityContextResolver,
) {
  const query = new OpencodeCapabilityAdapter();
  const capabilityValidator = new ValidateProfileCapabilityUseCase(query, resolver);
  const capabilities = createProfileLifecycleCapabilities(initialEnv, capabilityValidator);
  return {
    ...capabilities,
    capabilityValidator,
    capabilityQuery: query,
    capabilityReport: new OpencodeCompatibilityReport(),
    capabilityEvidence: OPENCODE_PIN_CATALOG_EVIDENCE,
  };
}
