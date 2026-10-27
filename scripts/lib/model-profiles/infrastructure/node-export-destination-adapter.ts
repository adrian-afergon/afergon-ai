import type fs from "node:fs";
import path from "node:path";
import type { ProfileExportPort } from "../application/profile-export-port.js";

export function sameProtectedIdentity(resolved: string, candidate: string, caseInsensitive: boolean): boolean {
  return caseInsensitive
    ? resolved.toLowerCase() === candidate.toLowerCase()
    : resolved === candidate;
}

export class NodeExportDestinationAdapter implements ProfileExportPort {
  constructor(private readonly filesystem: typeof fs) {}

  writeExclusive(outputPath: string, contents: string | Uint8Array, protectedPaths: readonly string[]): void {
    const resolvedOutput = path.resolve(outputPath);
    // Case-insensitive filesystems identify case-variant paths as the same file,
    // so protection must compare filesystem identities, not raw strings.
    const caseInsensitive = process.platform === "win32";
    for (const protectedPath of protectedPaths) {
      if (sameProtectedIdentity(path.resolve(protectedPath), resolvedOutput, caseInsensitive)) {
        throw new Error(`Refusing to write ${resolvedOutput}: it is a protected path.`);
      }
    }
    this.filesystem.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
    const fd = this.filesystem.openSync(resolvedOutput, "wx", 0o600);
    try {
      this.filesystem.writeFileSync(fd, contents);
      this.filesystem.fsyncSync(fd);
      this.filesystem.closeSync(fd);
    } catch (error) {
      const cleanupErrors: unknown[] = [];
      try {
        this.filesystem.closeSync(fd);
      } catch (closeError) {
        cleanupErrors.push(closeError);
      }
      try {
        this.filesystem.rmSync(resolvedOutput);
      } catch (removeError) {
        cleanupErrors.push(removeError);
      }
      if (cleanupErrors.length > 0) {
        throw new AggregateError([error, ...cleanupErrors], "Export write failed; cleanup incomplete");
      }
      throw error;
    }
  }
}
