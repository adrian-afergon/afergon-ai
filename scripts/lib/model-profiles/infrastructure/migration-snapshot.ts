import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createDefaultConfig } from "../../model-profiles-config.js";
import { validateProfileDocument } from "./document-validation.js";

export interface SourceObservation {
  configPath: string;
  exists: boolean;
  sourceBytes?: Buffer;
}

export interface AcquireMigrationSnapshotInput {
  source: SourceObservation;
  recoveryDocument: Record<string, unknown>;
}

export interface SnapshotReceipt {
  snapshotPath: string;
  disposition: "created" | "reused";
  complete: true;
}

export function assertProfileSourceUnchanged(observation: SourceObservation): void {
  let actual: Buffer;
  try { actual = fs.readFileSync(observation.configPath); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      if (!observation.exists) return;
      throw new Error("Profile source changed");
    }
    throw error;
  }
  if (!observation.exists || !actual.equals(observation.sourceBytes!)) throw new Error("Profile source changed");
}

export function acquireMigrationSnapshot(input: AcquireMigrationSnapshotInput): SnapshotReceipt {
  if (!input.source.exists && input.source.sourceBytes !== undefined) throw new Error("Invalid source observation");
  validateProfileDocument(input.recoveryDocument, input.source.configPath);
  if (typeof input.recoveryDocument.version === "number" && input.recoveryDocument.version > 2) throw new Error(`Cannot snapshot unsupported profile version ${input.recoveryDocument.version}`);
  const captured = input.source.exists ? validateProfileDocument(JSON.parse(input.source.sourceBytes!.toString("utf8")), input.source.configPath) : createDefaultConfig();
  if (!isDeepStrictEqual(captured, input.recoveryDocument)) throw new Error("Recovery document does not match captured source");
  const snapshotPath = `${input.source.configPath}.pre-v2.bak`;
  const expectedBytes = input.source.exists ? input.source.sourceBytes! : Buffer.from(`${JSON.stringify(input.recoveryDocument, null, 2)}\n`);
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  assertProfileSourceUnchanged(input.source);
  let fd: number;
  try { fd = fs.openSync(snapshotPath, "wx"); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const backupBytes = fs.readFileSync(snapshotPath);
    validateProfileDocument(JSON.parse(backupBytes.toString("utf8")), snapshotPath);
    if (!backupBytes.equals(expectedBytes)) throw new Error("Migration snapshot bytes do not match");
    return { snapshotPath, disposition: "reused", complete: true };
  }
  fs.writeFileSync(fd, expectedBytes);
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  return { snapshotPath, disposition: "created", complete: true };
}
