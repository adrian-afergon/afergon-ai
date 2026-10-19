import fs from "node:fs";
import path from "node:path";
import { createDefaultConfig, getConfigPath, saveConfig } from "../../model-profiles-config.js";
import { AgentTargetPolicy } from "../domain/agent-target-policy.js";
import { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import { ReadProfileDocumentUseCase } from "../application/read-profile-document-use-case.js";
import { LegacyProfileDefaultsAdapter } from "./legacy-profile-defaults-adapter.js";
import { NodeProfileStorageAdapter } from "./node-profile-storage-adapter.js";
import { LegacyAtomicProfileSaverAdapter } from "./legacy-atomic-profile-saver-adapter.js";

export class ProfileReadComposition {
  constructor(private readonly boundEnv: NodeJS.ProcessEnv) {}

  createStorage(): NodeProfileStorageAdapter {
    return new NodeProfileStorageAdapter(
      getConfigPath(this.boundEnv), fs, new LegacyProfileDefaultsAdapter(createDefaultConfig),
      new LegacyAtomicProfileSaverAdapter(saveConfig, this.boundEnv),
    );
  }

  createReader(): ReadProfileDocumentUseCase {
    return new ReadProfileDocumentUseCase(
      this.createStorage(),
      new ProfileDocumentPolicy(new AgentTargetPolicy()),
    );
  }
}

export function bindProfileRead(initialEnv: NodeJS.ProcessEnv = process.env): ProfileReadComposition {
  const configPath = path.resolve(getConfigPath(initialEnv));
  return new ProfileReadComposition({ ...initialEnv, AFERGON_AI_CONFIG_DIR: path.dirname(configPath) });
}
