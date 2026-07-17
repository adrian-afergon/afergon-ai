import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { buildExecution, formatHelp, resolveDispatchPlan } from "../scripts/cli-dispatch.js";
import { executeMetrics } from "../scripts/metrics.js";

const roots: string[] = [];

function createWorkspace() {
  const root = mkdtempSync(path.join(tmpdir(), "afergon-cli-"));
  roots.push(root);
  const env = { ...process.env, AFERGON_AI_CONFIG_DIR: path.join(root, "config") };
  return { root, env };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("metrics dispatch", () => {
  it("routes metrics as an explicit command and documents it", () => {
    expect(resolveDispatchPlan({ argv: ["metrics", "status"], isInteractiveTTY: false, isCI: true })).toEqual({
      kind: "command", command: "metrics", forwardedArgs: ["status"],
    });
    expect(buildExecution({ kind: "command", command: "metrics", forwardedArgs: ["status"] }, { packageRoot: "/pkg", cwd: "/work", platform: "linux" })).toEqual({
      command: process.execPath, args: ["/pkg/scripts/metrics.js", "status"], cwd: "/work",
    });
    expect(formatHelp()).toContain("afergon-ai metrics");
    expect(formatHelp()).toContain("afergon-ai metrics --help");
  });
});

describe("metrics help", () => {
  it.each([
    [["--help"], ["enable", "status", "import", "report", "export", "clear"]],
    [["-h"], ["Usage: afergon-ai metrics"]],
    [["enable", "--help"], ["Usage: afergon-ai metrics enable"]],
    [["status", "--help"], ["Usage: afergon-ai metrics status"]],
    [["import", "--help"], ["<event-file>"]],
    [["report", "--help"], ["--group-by <dimension>", "--filter dimension=value", "reviewCycle"]],
    [["export", "--help"], ["--format json|csv", "--output <path>"]],
    [["clear", "--help"], ["--confirm"]],
  ] as const)("prints discoverable help for %s", (argv, expectedFragments) => {
    const { root, env } = createWorkspace();
    const result = executeMetrics(argv, { cwd: root, env });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    for (const fragment of expectedFragments) expect(result.stdout).toContain(fragment);
    expect(existsSync(path.join(root, "config", "metrics"))).toBe(false);
  });

  it("exposes help through the emitted metrics runtime", () => {
    const runtimePath = path.resolve(import.meta.dirname, "../dist/scripts/metrics.js");
    const result = spawnSync(process.execPath, [runtimePath, "report", "--help"], { encoding: "utf8" });

    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("must be enabled");
    expect(result.stdout).toContain("--group-by <dimension>");
  });
});

describe("metrics CLI", () => {
  it("supports enable, import, filtered report, export, and confirmed clear", () => {
    const { root, env } = createWorkspace();
    const eventFile = path.join(root, "events.json");
    const exportFile = path.join(root, "out.json");
    writeFileSync(eventFile, JSON.stringify([{
      source: "afergon-ai", version: 1, eventId: "event-1", occurredAt: "2026-07-16T08:00:00.000Z",
      workflowRunId: "run-1", phase: "implement", agent: "agent-a", outcome: "useful",
    }, {
      source: "afergon-ai", version: 1, eventId: "event-2", occurredAt: "2026-07-16T08:01:00.000Z",
      workflowRunId: "run-1", phase: "review", agent: "agent-b", outcome: "rework",
    }]));

    expect(executeMetrics(["status"], { cwd: root, env })).toMatchObject({ exitCode: 0, stdout: '{"enabled":false}\n' });
    expect(executeMetrics(["enable"], { cwd: root, env })).toMatchObject({ exitCode: 0 });
    expect(executeMetrics(["import", eventFile], { cwd: root, env })).toMatchObject({ exitCode: 0, stdout: "Imported 2 event(s).\n" });
    const report = executeMetrics(["report", "--group-by", "outcome", "--filter", "agent=agent-a"], { cwd: root, env });
    expect(report.exitCode).toBe(0);
    expect(JSON.parse(report.stdout).rows).toEqual([expect.objectContaining({ dimension: "useful", count: 1 })]);
    expect(executeMetrics(["export", "--format", "json", "--output", exportFile], { cwd: root, env })).toMatchObject({ exitCode: 0 });
    expect(existsSync(exportFile)).toBe(true);
    expect(readFileSync(exportFile, "utf8")).toContain("event-1");
    expect(executeMetrics(["clear"], { cwd: root, env })).toMatchObject({ exitCode: 1, stderr: expect.stringContaining("confirmation") });
    expect(executeMetrics(["clear", "--confirm"], { cwd: root, env })).toMatchObject({ exitCode: 0 });
  });

  it("rejects unknown or missing subcommands without persistence", () => {
    const { root, env } = createWorkspace();

    expect(executeMetrics([], { cwd: root, env })).toMatchObject({ exitCode: 1, stderr: expect.stringContaining("metrics") });
    expect(executeMetrics(["unknown"], { cwd: root, env })).toMatchObject({ exitCode: 1, stderr: expect.stringContaining("Unknown metrics subcommand") });
    expect(executeMetrics(["import", path.join(root, "missing.json")], { cwd: root, env })).toMatchObject({ exitCode: 1 });
    expect(existsSync(path.join(root, "config", "metrics"))).toBe(false);
  });
});
