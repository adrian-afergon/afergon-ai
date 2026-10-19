import type { saveConfig } from "../../model-profiles-config.js";
import type { RawProfileDocument } from "../domain/profile-document.js";

export class LegacyAtomicProfileSaverAdapter {
  constructor(private readonly saveFunction: typeof saveConfig, private readonly boundEnv: NodeJS.ProcessEnv) {}

  persist(document: RawProfileDocument): void {
    this.saveFunction(document, this.boundEnv);
  }
}
