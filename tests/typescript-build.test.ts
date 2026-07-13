import path from "node:path";
import { existsSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");
const distScripts = path.join(repoRoot, "dist", "scripts");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function runBuild(environment: NodeJS.ProcessEnv = {}) {
  return spawnSync(pnpmCommand, ["run", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, ...environment },
    timeout: 120000,
  });
}

describe("TypeScript build output", () => {
  it("declares a package lifecycle build for the ignored dist runtime", () => {
    const packageMetadata = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));

    expect(packageMetadata.files).toContain("dist/");
    expect(packageMetadata.scripts.prepack).toBe("pnpm run build");
    expect(packageMetadata.scripts.build).toBe("tsx ./scripts/build-typescript.ts");
    expect(packageMetadata.scripts.typecheck).toBe("tsc -p tsconfig.runtime.json --noEmit");
    expect(packageMetadata.devDependencies.tsx).toBeDefined();
    expect(existsSync(path.join(repoRoot, "scripts", "build-typescript.ts"))).toBe(true);
    expect(existsSync(path.join(repoRoot, "scripts", "build-typescript.mjs"))).toBe(false);
    expect(readFileSync(path.join(repoRoot, "scripts", "tui.ts"), "utf8")).not.toContain("@ts-nocheck");
  });

  it("emits the dispatcher, models, and TUI as NodeNext JavaScript without copied runtime MJS", async () => {
    const result = runBuild();

    expect(result.status).toBe(0);
    for (const runtimePath of [
      "cli-dispatch.js",
      "models.js",
      "tui.js",
      "lib/cli-dispatch-core.js",
      "lib/model-profiles.js",
      "lib/tui/actions/forms.js",
      "lib/tui/modal-controller.js",
      "lib/tui/model-profiles-controller.js",
    ]) {
      expect(existsSync(path.join(distScripts, runtimePath))).toBe(true);
    }
    expect(existsSync(path.join(distScripts, "tui.mjs"))).toBe(false);
    expect(existsSync(path.join(distScripts, "lib/tui/modal-controller.mjs"))).toBe(false);
    expect(existsSync(path.join(distScripts, "lib/model-profiles.mjs"))).toBe(false);

    const tui = await import(`${pathToFileURL(path.join(distScripts, "tui.js")).href}?build-artifact`);
    expect(typeof tui.createTuiApp).toBe("function");
    expect(typeof tui.renderHomeScreen).toBe("function");
  }, 120000);

  it("reports actionable local health for the emitted dist runtime without remote telemetry", () => {
    expect(runBuild().status).toBe(0);

    const result = spawnSync(pnpmCommand, ["run", "health:runtime"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 120000,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("OK dist/scripts/tui.js imports successfully");
    expect(result.stdout).toContain("no remote telemetry");
  }, 120000);

  it("persists failed dist health checks locally and exposes them through doctor", () => {
    expect(runBuild().status).toBe(0);
    const logPath = path.join(mkdtempSync(path.join(repoRoot, ".runtime-health-")), "failures.jsonl");
    const runtimePath = path.join(distScripts, "tui.js");
    const unavailableRuntimePath = `${runtimePath}.unavailable`;

    try {
      renameSync(runtimePath, unavailableRuntimePath);
      const failedHealth = spawnSync(pnpmCommand, ["run", "health:runtime"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, AFERGON_AI_RUNTIME_HEALTH_LOG: logPath },
      });
      const doctor = spawnSync(pnpmCommand, ["run", "doctor:runtime"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, AFERGON_AI_RUNTIME_HEALTH_LOG: logPath },
      });

      expect(failedHealth.status).not.toBe(0);
      expect(doctor.status).toBe(1);
      expect(doctor.stdout).toContain("Missing built runtime: dist/scripts/tui.js");
      expect(doctor.stdout).toContain("local-only");
    } finally {
      renameSync(unavailableRuntimePath, runtimePath);
      rmSync(path.dirname(logPath), { recursive: true, force: true });
    }
  }, 120000);

  it("reports doctor success when the local health log is missing or empty", () => {
    expect(runBuild().status).toBe(0);
    const logDirectory = mkdtempSync(path.join(repoRoot, ".runtime-health-"));
    const logPath = path.join(logDirectory, "failures.jsonl");
    const environment = { ...process.env, AFERGON_AI_RUNTIME_HEALTH_LOG: logPath };

    try {
      for (const setup of [
        () => {},
        () => writeFileSync(logPath, "\n"),
      ]) {
        setup();
        const doctor = spawnSync(pnpmCommand, ["run", "doctor:runtime"], {
          cwd: repoRoot, encoding: "utf8", env: environment,
        });

        expect(doctor.status).toBe(0);
        expect(doctor.stdout).toContain(`Runtime doctor: no recorded local-only health failures (${logPath}).`);
      }
    } finally {
      rmSync(logDirectory, { recursive: true, force: true });
    }
  }, 120000);

  it("keeps generated runtime launchers on emitted JavaScript", () => {
    const posixLauncher = readFileSync(path.join(repoRoot, "bin", "afergon-ai"), "utf8");
    const windowsLauncher = readFileSync(path.join(repoRoot, "bin", "afergon-ai.cmd"), "utf8");
    const dispatcher = readFileSync(path.join(repoRoot, "scripts", "cli-dispatch.ts"), "utf8");

    expect(posixLauncher).toContain("dist/scripts/cli-dispatch.js");
    expect(windowsLauncher).toContain("dist\\scripts\\cli-dispatch.js");
    expect(dispatcher).toContain('"scripts/tui.js"');
    expect(dispatcher).toContain('"scripts/models.js"');
  });

  it("packs a clean checkout with a standalone JavaScript TUI runtime", () => {
    const fixtureRoot = mkdtempSync(path.join(repoRoot, ".typescript-pack-"));
    const archiveDirectory = path.join(fixtureRoot, "archives");

    try {
      const packResult = spawnSync(pnpmCommand, ["pack", "--pack-destination", archiveDirectory], {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: 120000,
      });
      expect(packResult.status).toBe(0);
      const archive = readdirSync(archiveDirectory).find((entry) => entry.endsWith(".tgz"));
      expect(archive).toBeDefined();
      if (!archive) throw new Error("pnpm pack did not produce an archive");
      const archiveContents = spawnSync("tar", ["-tzf", path.join(archiveDirectory, archive)], { encoding: "utf8" });

      expect(archiveContents.status).toBe(0);
      expect(archiveContents.stdout).toContain("package/dist/scripts/tui.js");
      expect(archiveContents.stdout).not.toContain("package/dist/scripts/tui.mjs");
      expect(archiveContents.stdout).not.toContain("package/dist/scripts/lib/tui/modal-controller.mjs");
      expect(archiveContents.stdout).not.toMatch(/package\/(?:dist\/)?scripts\/lib\/.*\.mjs\n/);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  }, 120000);

  it("recovers an interrupted dist-to-backup publication before the next build", () => {
    expect(runBuild().status).toBe(0);

    const backupRoot = path.join(repoRoot, ".dist-backup-interrupted-build-test");
    const runtimePath = path.join(distScripts, "tui.js");
    const previousRuntime = readFileSync(runtimePath, "utf8");

    rmSync(backupRoot, { recursive: true, force: true });
    renameSync(path.join(repoRoot, "dist"), backupRoot);

    try {
      const result = runBuild({ AFERGON_AI_TEST_FAIL_RUNTIME_COPY: "adapters" });

      expect(result.status).not.toBe(0);
      expect(existsSync(path.join(repoRoot, "dist"))).toBe(true);
      expect(existsSync(backupRoot)).toBe(false);
      expect(readFileSync(runtimePath, "utf8")).toBe(previousRuntime);
    } finally {
      if (!existsSync(path.join(repoRoot, "dist")) && existsSync(backupRoot)) {
        renameSync(backupRoot, path.join(repoRoot, "dist"));
      }
      rmSync(backupRoot, { recursive: true, force: true });
    }
  }, 120000);

  it("restores the newest backup and retains older backups after cleanup failure and interrupted publication", () => {
    expect(runBuild().status).toBe(0);

    const olderBackup = path.join(repoRoot, ".dist-backup-cleanup-failure-test");
    const newestBackup = path.join(repoRoot, ".dist-backup-interrupted-publication-test");
    const runtimePath = path.join(distScripts, "tui.js");

    rmSync(olderBackup, { recursive: true, force: true });
    rmSync(newestBackup, { recursive: true, force: true });

    try {
      const backupsBeforeCleanupFailure = new Set(
        readdirSync(repoRoot).filter((entry) => entry.startsWith(".dist-backup-")),
      );
      expect(runBuild({ AFERGON_AI_TEST_FAIL_BACKUP_CLEANUP: "1" }).status).not.toBe(0);
      const cleanupFailureBackup = readdirSync(repoRoot).find(
        (entry) => entry.startsWith(".dist-backup-") && !backupsBeforeCleanupFailure.has(entry),
      );
      expect(cleanupFailureBackup).toBeDefined();
      renameSync(path.join(repoRoot, cleanupFailureBackup!), olderBackup);

      const newestRuntime = readFileSync(runtimePath, "utf8");
      renameSync(path.join(repoRoot, "dist"), newestBackup);
      utimesSync(olderBackup, new Date(1), new Date(1));
      utimesSync(newestBackup, new Date(2), new Date(2));

      const result = runBuild({ AFERGON_AI_TEST_FAIL_RUNTIME_COPY: "adapters" });

      expect(result.status).not.toBe(0);
      expect(readFileSync(runtimePath, "utf8")).toBe(newestRuntime);
      expect(existsSync(olderBackup)).toBe(true);
      expect(existsSync(newestBackup)).toBe(false);
    } finally {
      if (!existsSync(path.join(repoRoot, "dist"))) {
        for (const backup of [newestBackup, olderBackup]) {
          if (existsSync(backup)) {
            renameSync(backup, path.join(repoRoot, "dist"));
            break;
          }
        }
      }
      rmSync(olderBackup, { recursive: true, force: true });
      rmSync(newestBackup, { recursive: true, force: true });
    }
  }, 120000);

  it("preserves the prior dist runtime when runtime artifact copying fails", () => {
    expect(runBuild().status).toBe(0);

    const runtimePath = path.join(distScripts, "tui.js");
    const previousRuntime = readFileSync(runtimePath, "utf8");
    const result = runBuild({ AFERGON_AI_TEST_FAIL_RUNTIME_COPY: "adapters" });

    expect(result.status).not.toBe(0);
    expect(readFileSync(runtimePath, "utf8")).toBe(previousRuntime);
  }, 120000);

  it("preserves the prior dist runtime when the compiler fails before publication", () => {
    expect(runBuild().status).toBe(0);

    const runtimePath = path.join(distScripts, "tui.js");
    const previousRuntime = readFileSync(runtimePath, "utf8");
    const result = runBuild({ AFERGON_AI_TEST_FAIL_COMPILER: "1" });

    expect(result.status).not.toBe(0);
    expect(readFileSync(runtimePath, "utf8")).toBe(previousRuntime);
  }, 120000);
});
