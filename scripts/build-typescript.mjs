import { cp, mkdir, rename, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(repoRoot, "dist");
const runtimeDirsToCopy = ["adapters", "prompts", "scripts", "skills"];
const injectedCopyFailure = process.env.AFERGON_AI_TEST_FAIL_RUNTIME_COPY;
const buildId = `${process.pid}-${Date.now()}`;
const stagingRoot = path.join(repoRoot, `.dist-staging-${buildId}`);
const backupRoot = path.join(repoRoot, `.dist-backup-${buildId}`);

async function publishBuild() {
  const hasPreviousDist = existsSync(distRoot);

  if (hasPreviousDist) {
    await rename(distRoot, backupRoot);
  }

  try {
    await rename(stagingRoot, distRoot);
  } catch (error) {
    if (hasPreviousDist) {
      await rename(backupRoot, distRoot);
    }
    throw error;
  }

  if (hasPreviousDist) {
    await rm(backupRoot, { recursive: true, force: true });
  }
}

try {
  await mkdir(stagingRoot, { recursive: true });

  const tscCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const tscResult = spawnSync(
    tscCommand,
    [
      "exec",
      "tsc",
      "-p",
      "tsconfig.build.json",
      "--outDir",
      stagingRoot,
      "--tsBuildInfoFile",
      path.join(stagingRoot, ".tsbuildinfo"),
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  if (tscResult.status !== 0) {
    process.exitCode = tscResult.status ?? 1;
  } else {
    for (const relativeDir of runtimeDirsToCopy) {
      if (injectedCopyFailure === relativeDir) {
        throw new Error(`Injected runtime artifact copy failure: ${relativeDir}`);
      }

      await cp(path.join(repoRoot, relativeDir), path.join(stagingRoot, relativeDir), {
        recursive: true,
        filter: (sourcePath) => {
          const entryPath = path.resolve(sourcePath);
          return !entryPath.endsWith(".ts") && path.basename(entryPath) !== ".DS_Store";
        },
      });
    }

    await publishBuild();
  }
} finally {
  await rm(stagingRoot, { recursive: true, force: true });
}
