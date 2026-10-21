import type { ReadProfileDocumentUseCase } from "../application/read-profile-document-use-case.js";
import type { NodeProfileStorageAdapter } from "./node-profile-storage-adapter.js";
import { createProfileCapabilities } from "./profile-composition.js";

export class ProfileReadComposition {
  constructor(private readonly capabilities: ReturnType<typeof createProfileCapabilities>) {}

  createStorage(): NodeProfileStorageAdapter {
    return this.capabilities.storage;
  }

  createReader(): ReadProfileDocumentUseCase {
    return this.capabilities.reader;
  }
}

export function bindProfileRead(initialEnv?: NodeJS.ProcessEnv): ProfileReadComposition {
  return new ProfileReadComposition(createProfileCapabilities(initialEnv));
}
