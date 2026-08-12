import { cp, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { assertCompilerBootstrapSucceeded, createCompilerBootstrapInvocation } from "./lib/typescript-build-bootstrap.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(repoRoot, "dist");
const runtimeDirsToCopy = ["adapters", "skills"];
const runtimeScriptAssets = ["init-project.ps1", "init-project.sh", "register-opencode-agents.sh", "update.ps1", "update.sh", "verify-install.ps1", "verify-install.sh"];
const injectedCopyFailure = process.env.AFERGON_AI_TEST_FAIL_RUNTIME_COPY;
const injectedCompilerFailure = process.env.AFERGON_AI_TEST_FAIL_COMPILER;
const injectedBackupCleanupFailure = process.env.AFERGON_AI_TEST_FAIL_BACKUP_CLEANUP;
const buildId = `${process.pid}-${Date.now()}`;
const stagingRoot = path.join(repoRoot, `.dist-staging-${buildId}`);
const backupRoot = path.join(repoRoot, `.dist-backup-${buildId}`);

async function recoverInterruptedPublication() {
  if (existsSync(distRoot)) return;

  const backupEntries = await readdir(repoRoot, { withFileTypes: true });
  const strandedBackups = await Promise.all(
    backupEntries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(".dist-backup-"))
      .map(async (entry) => {
        const backupPath = path.join(repoRoot, entry.name);
        return { name: entry.name, path: backupPath, modifiedAt: (await stat(backupPath)).mtimeMs };
      }),
  );

  if (strandedBackups.length === 0) return;

  // An interrupted later publication can leave an older cleanup-failed backup beside
  // the most recently moved dist. Restore the newest one, breaking timestamp ties by
  // backup name, and retain every older backup for manual recovery rather than deleting it.
  strandedBackups.sort((left, right) => right.modifiedAt - left.modifiedAt || right.name.localeCompare(left.name));
  await rename(strandedBackups[0].path, distRoot);
}

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
    if (injectedBackupCleanupFailure) {
      throw new Error("Injected backup cleanup failure");
    }
    await rm(backupRoot, { recursive: true, force: true });
  }
}

try {
  await recoverInterruptedPublication();
  await mkdir(stagingRoot, { recursive: true });

  const compilerInvocation = createCompilerBootstrapInvocation({
    platform: process.platform,
    repoRoot,
    stagingRoot,
    injectCompilerFailure: Boolean(injectedCompilerFailure),
  });
  const tscResult = spawnSync(
    compilerInvocation.command,
    compilerInvocation.arguments,
    compilerInvocation.options,
  );
  assertCompilerBootstrapSucceeded(tscResult, compilerInvocation.description);

  {
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

    for (const relativePath of runtimeScriptAssets) {
      await cp(path.join(repoRoot, "scripts", relativePath), path.join(stagingRoot, "scripts", relativePath));
    }

    await publishBuild();
  }
} finally {
  await rm(stagingRoot, { recursive: true, force: true });
}
