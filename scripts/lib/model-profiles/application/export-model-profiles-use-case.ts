import type { ModelOnlyExportPolicy } from "../domain/model-only-export-policy.js";
import type { ProfileDocumentPolicy } from "../domain/profile-document-policy.js";
import type { ProfileExportPort } from "./profile-export-port.js";
import type { ReadProfileDocumentUseCase } from "./read-profile-document-use-case.js";
import type { ProfileStoragePort } from "./profile-storage-port.js";

export interface ExportModelProfilesInput {
  currentBackupPath: string;
  destinationPath: string;
}

export interface ExportModelProfilesReceipt {
  sourcePath: string;
  currentBackupPath: string;
  destinationPath: string;
  warnings: string[];
}

export class ExportModelProfilesError extends Error {
  constructor(message: string, readonly currentBackupPath: string | undefined, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ExportModelProfilesError";
  }
}

function lossPath(profileName: string, agentKey: string): string {
  const segment = (key: string) => /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
  return `models.profiles${segment(profileName)}${segment(agentKey)}`;
}

export class ExportModelProfilesUseCase {
  constructor(
    private readonly reader: ReadProfileDocumentUseCase,
    private readonly validator: ProfileDocumentPolicy,
    private readonly exportPolicy: ModelOnlyExportPolicy,
    private readonly destinations: ProfileExportPort,
    private readonly recheck: Pick<ProfileStoragePort, "recheck">,
    private readonly snapshotPath: string | undefined,
  ) {}

  private refuseCollisions(sourceIdentity: string, input: ExportModelProfilesInput): void {
    const paths = [sourceIdentity, input.currentBackupPath, input.destinationPath,
      ...(this.snapshotPath ? [this.snapshotPath] : [])];
    for (let i = 0; i < paths.length; i += 1) {
      for (let j = i + 1; j < paths.length; j += 1) {
        if (paths[i] === paths[j]) {
          throw new Error(`Export output paths must be distinct; '${paths[i]}' collides with another required path.`);
        }
      }
    }
  }

  execute(input: ExportModelProfilesInput): ExportModelProfilesReceipt {
    const loaded = this.reader.execute();
    if (!loaded.source.exists) {
      throw new Error(`Cannot export model profiles: no profile config exists at ${loaded.source.sourceIdentity}.`);
    }
    this.refuseCollisions(loaded.source.sourceIdentity, input);
    this.validator.requireSupportedVersion(loaded.document, "export");
    const { document: modelOnly, losses } = this.exportPolicy.export(loaded.document);
    const serialized = `${JSON.stringify(modelOnly, null, 2)}\n`;
    this.recheck.recheck(loaded.source);
    this.destinations.writeExclusive(input.currentBackupPath, loaded.source.sourceBytes!,
      [loaded.source.sourceIdentity, input.destinationPath, ...(this.snapshotPath ? [this.snapshotPath] : [])]);
    try {
      this.destinations.writeExclusive(input.destinationPath, serialized,
        [loaded.source.sourceIdentity, input.currentBackupPath, ...(this.snapshotPath ? [this.snapshotPath] : [])]);
    } catch (error) {
      throw new ExportModelProfilesError(
        `Model-only export failed; the complete current backup survives at ${input.currentBackupPath}.`,
        input.currentBackupPath, { cause: error },
      );
    }
    return {
      sourcePath: loaded.source.sourceIdentity,
      currentBackupPath: input.currentBackupPath,
      destinationPath: input.destinationPath,
      warnings: losses.map((loss) =>
        `${lossPath(loss.profileName, loss.agentKey)}: ${loss.omittedKeys.join(", ")} omitted from the legacy model-only export; recover it from the current backup at ${input.currentBackupPath}`),
    };
  }
}
