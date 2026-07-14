import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimeEntries = ["scripts/cli-dispatch.js", "scripts/models.js", "scripts/tui.js"];
const logPath = process.env.AFERGON_AI_RUNTIME_HEALTH_LOG
  ?? path.join(process.env.XDG_STATE_HOME ?? path.join(os.homedir(), ".local", "state"), "afergon-ai", "runtime-health.jsonl");

function recordFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  mkdirSync(path.dirname(logPath), { recursive: true });
  appendFileSync(logPath, `${JSON.stringify({ timestamp: new Date().toISOString(), message })}\n`);
  console.error(`Recorded local-only runtime health failure: ${logPath}`);
}

if (process.argv.includes("--report")) {
  const failures = existsSync(logPath)
    ? readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
    : [];
  if (failures.length === 0) {
    console.log(`Runtime doctor: no recorded local-only health failures (${logPath}).`);
  } else {
    console.log(`Runtime doctor: ${failures.length} recorded local-only health failure(s) in ${logPath}.`);
    for (const failure of failures.slice(-5)) console.log(`${failure.timestamp}: ${failure.message}`);
    process.exitCode = 1;
  }
} else {
  try {
    for (const entry of runtimeEntries) {
      const runtimePath = path.join(packageRoot, "dist", entry);
      if (!existsSync(runtimePath)) {
        throw new Error(`Missing built runtime: dist/${entry}. Run pnpm build, then retry.`);
      }

      await import(pathToFileURL(runtimePath).href);
      console.log(`OK dist/${entry} imports successfully`);
    }

    console.log("Local dist runtime health check passed (no remote telemetry).");
  } catch (error) {
    recordFailure(error);
    throw error;
  }
}
