export interface ProfileExportPort {
  writeExclusive(outputPath: string, contents: string | Uint8Array, protectedPaths: readonly string[]): void;
}
