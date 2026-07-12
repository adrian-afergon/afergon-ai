import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(repoRoot, "dist");
const runtimeDirsToCopy = ["adapters", "prompts", "scripts", "skills"];

await rm(distRoot, { recursive: true, force: true });

const tscCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const tscResult = spawnSync(tscCommand, ["exec", "tsc", "-p", "tsconfig.build.json"], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (tscResult.status !== 0) {
  process.exit(tscResult.status ?? 1);
}

await mkdir(distRoot, { recursive: true });

for (const relativeDir of runtimeDirsToCopy) {
  await cp(path.join(repoRoot, relativeDir), path.join(distRoot, relativeDir), {
    recursive: true,
    filter: (sourcePath) => {
      const entryPath = path.resolve(sourcePath);
      return !entryPath.endsWith(".ts") && path.basename(entryPath) !== ".DS_Store";
    },
  });
}
