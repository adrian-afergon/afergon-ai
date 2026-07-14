import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");

function runPnpmScript(script: "build" | "health:runtime", environment: NodeJS.ProcessEnv = {}) {
  const windowsCommand = `pnpm.cmd run ${script}`;
  return spawnSync(
    process.platform === "win32" ? "cmd.exe" : "pnpm",
    process.platform === "win32" ? ["/d", "/v:off", "/s", "/c", windowsCommand] : ["run", script],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, ...environment },
      timeout: 120000,
    },
  );
}

function runBuild(environment: NodeJS.ProcessEnv = {}) {
  return runPnpmScript("build", environment);
}

describe("Windows TypeScript compiler bootstrap", () => {
  it.runIf(process.platform === "win32")("executes the CMD pnpm.cmd bootstrap before the workflow build and preserves dist after a compiler failure", () => {
    const successfulBuild = runBuild();

    expect(successfulBuild.error).toBeUndefined();
    expect(successfulBuild.signal).toBeNull();
    expect(successfulBuild.status).toBe(0);

    const healthCheck = runPnpmScript("health:runtime");
    expect(healthCheck.status).toBe(0);
    expect(healthCheck.stdout).toContain("OK dist/scripts/tui.js imports successfully");

    const runtimePath = path.join(repoRoot, "dist", "scripts", "tui.js");
    const previousRuntime = readFileSync(runtimePath, "utf8");
    const failedBuild = runBuild({ AFERGON_AI_TEST_FAIL_COMPILER: "1" });

    expect(failedBuild.status).not.toBe(0);
    expect(readFileSync(runtimePath, "utf8")).toBe(previousRuntime);
  }, 180000);
});
