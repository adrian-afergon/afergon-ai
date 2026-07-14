import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");

function writeProbePreload(probePath: string) {
  fs.writeFileSync(
    probePath,
    `const fs = require("node:fs");
fs.writeFileSync(process.env.AFERGON_AI_ARGV_PROBE, JSON.stringify(process.argv.slice(1)));
process.exit(0);
`,
  );
}

function describeProcessResult(result: ReturnType<typeof spawnSync>, probePath: string) {
  return [
    `status=${result.status ?? "null"}`,
    `signal=${result.signal ?? "null"}`,
    `error=${result.error?.message ?? "none"}`,
    `stdout=${result.stdout ?? ""}`,
    `stderr=${result.stderr ?? ""}`,
    `probeExists=${fs.existsSync(probePath)}`,
  ].join("\n");
}

describe("Windows CMD launcher argv contract", () => {
  it.runIf(process.platform === "win32")("forwards special arguments to node exactly once without expansion or injection", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-ai-windows-argv-"));
    const fixtureBin = path.join(fixtureRoot, "bin");
    const fixtureDist = path.join(fixtureRoot, "dist", "scripts");
    const probePath = path.join(fixtureRoot, "received-argv.json");
    const preloadPath = path.join(fixtureRoot, "argv-probe.cjs");
    const callerPath = path.join(fixtureRoot, "invoke-launcher.cmd");

    fs.mkdirSync(fixtureBin, { recursive: true });
    fs.mkdirSync(fixtureDist, { recursive: true });
    fs.copyFileSync(path.join(repoRoot, "bin", "afergon-ai.cmd"), path.join(fixtureBin, "afergon-ai.cmd"));
    fs.copyFileSync(process.execPath, path.join(fixtureBin, "node.exe"));
    fs.writeFileSync(path.join(fixtureDist, "cli-dispatch.js"), "throw new Error('argv probe should exit first');\n");
    writeProbePreload(preloadPath);

    // Keep percent syntax in the caller so accidental environment expansion is observable.
    fs.writeFileSync(
      callerPath,
      `@echo off\r\nsetlocal DisableDelayedExpansion\r\ncall "${path.join(fixtureBin, "afergon-ai.cmd")}" "space value" "bang!value!" "percent-value" "separator&value"\r\nexit /b %ERRORLEVEL%\r\n`,
    );

    try {
      const result = spawnSync("cmd.exe", ["/d", "/v:off", "/c", "call invoke-launcher.cmd"], {
        cwd: fixtureRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${fixtureBin};${process.env.PATH ?? ""}`,
          NODE_OPTIONS: "--require=./argv-probe.cjs",
          AFERGON_AI_ARGV_PROBE: probePath,
          AFERGON_AI_LITERAL_PERCENT: "percent%value%",
          value: "EXPANDED",
        },
        timeout: 10000,
      });

      expect(result.status, describeProcessResult(result, probePath)).toBe(0);
      expect(result.stderr).toBe("");
      expect(JSON.parse(fs.readFileSync(probePath, "utf8"))).toEqual([
        path.join(fixtureDist, "cli-dispatch.js"),
        "space value",
        "bang!value!",
        "percent-value",
        "separator&value",
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  }, 20000);
});
