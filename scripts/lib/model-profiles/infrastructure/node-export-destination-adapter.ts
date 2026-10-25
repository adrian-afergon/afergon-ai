import type fs from "node:fs";
import path from "node:path";
import type { ProfileExportPort } from "../application/profile-export-port.js";

export class NodeExportDestinationAdapter implements ProfileExportPort {
  constructor(private readonly filesystem: typeof fs) {}

  writeExclusive(outputPath: string, contents: string | Uint8Array, protectedPaths: readonly string[]): void {
    const resolvedOutput = path.resolve(outputPath);
    for (const protectedPath of protectedPaths) {
      if (path.resolve(protectedPath) === resolvedOutput) {
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
      if (cleanupErrors.length === 1) throw new AggregateError([error, cleanupErrors[0]], "Export write failed; cleanup incomplete");
      if (cleanupErrors.length > 1) throw new AggregateError([error, ...cleanupErrors], "Export write failed; cleanup incomplete");
      throw error;
    }
  }
}
