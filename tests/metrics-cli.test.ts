import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    expect(formatHelp()).toContain("metrics export --format json|csv --output <path> [--group-by <dimension>] [--filter <dimension=value>]...");
  });
});

describe("metrics CLI", () => {
  it("rejects an HTTPS output before path resolution without filesystem side effects", () => {
    const { root, env } = createWorkspace();
    expect(executeMetrics(["enable"], { cwd: root, env })).toMatchObject({ exitCode: 0 });

    const result = executeMetrics([
      "export", "--format", "json", "--output", "https://example.test/metrics.json",
    ], { cwd: root, env });

    expect(result).toMatchObject({ exitCode: 1, stderr: expect.stringContaining("only local filesystem paths") });
    expect(existsSync(path.join(root, "https:"))).toBe(false);
  });

  it("rejects a file URI without writing an export", () => {
    const { root, env } = createWorkspace();
    expect(executeMetrics(["enable"], { cwd: root, env })).toMatchObject({ exitCode: 0 });
    const fileUri = `file://${path.join(root, "metrics.json")}`;

    const result = executeMetrics(["export", "--format", "json", "--output", fileUri], { cwd: root, env });

    expect(result).toMatchObject({ exitCode: 1, stderr: expect.stringContaining("only local filesystem paths") });
    expect(existsSync(path.join(root, "metrics.json"))).toBe(false);
  });

  it("rejects URL schemes case-insensitively before creating a scheme path", () => {
    const { root, env } = createWorkspace();
    expect(executeMetrics(["enable"], { cwd: root, env })).toMatchObject({ exitCode: 0 });

    const result = executeMetrics([
      "export", "--format", "csv", "--output", "HTTPS://example.test/metrics.csv",
    ], { cwd: root, env });

    expect(result).toMatchObject({ exitCode: 1, stderr: expect.stringContaining("only local filesystem paths") });
    expect(existsSync(path.join(root, "HTTPS:"))).toBe(false);
  });

  it("rejects a missing output value without creating a file", () => {
    const { root, env } = createWorkspace();
    expect(executeMetrics(["enable"], { cwd: root, env })).toMatchObject({ exitCode: 0 });

    const result = executeMetrics(["export", "--format", "json", "--output"], { cwd: root, env });

    expect(result).toMatchObject({ exitCode: 1, stderr: expect.stringContaining("Usage:") });
    expect(existsSync(path.join(root, "undefined"))).toBe(false);
  });

  it("exports only filtered EfficiencyReport rows grouped by the requested dimension", () => {
    const { root, env } = createWorkspace();
    const eventFile = path.join(root, "selected-events.json");
    const exportFile = path.join(root, "selected.json");
    writeFileSync(eventFile, JSON.stringify([
      { source: "afergon-ai", version: 1, eventId: "a-useful", occurredAt: "2026-07-16T08:00:00.000Z", workflowRunId: "run-1", phase: "implement", agent: "agent-a", outcome: "useful" },
      { source: "afergon-ai", version: 1, eventId: "a-failed", occurredAt: "2026-07-16T08:01:00.000Z", workflowRunId: "run-1", phase: "implement", agent: "agent-a", outcome: "failed" },
      { source: "afergon-ai", version: 1, eventId: "b-rework", occurredAt: "2026-07-16T08:02:00.000Z", workflowRunId: "run-2", phase: "review", agent: "agent-b", outcome: "rework" },
    ]));
    expect(executeMetrics(["enable"], { cwd: root, env })).toMatchObject({ exitCode: 0 });
    expect(executeMetrics(["import", eventFile], { cwd: root, env })).toMatchObject({ exitCode: 0 });

    const result = executeMetrics([
      "export", "--format", "json", "--output", exportFile,
      "--group-by", "outcome", "--filter", "agent=agent-a",
    ], { cwd: root, env });

    expect(result).toMatchObject({ exitCode: 0 });
    expect(JSON.parse(readFileSync(exportFile, "utf8"))).toEqual([
      expect.objectContaining({ groupBy: "outcome", dimension: "failed", count: 1, failedCount: 1 }),
      expect.objectContaining({ groupBy: "outcome", dimension: "useful", count: 1, usefulCount: 1 }),
    ]);
    expect(readFileSync(exportFile, "utf8")).not.toContain("eventId");
  });

  it("rejects malformed export selection before writing output", () => {
    const { root, env } = createWorkspace();
    const exportFile = path.join(root, "invalid.json");
    expect(executeMetrics(["enable"], { cwd: root, env })).toMatchObject({ exitCode: 0 });

    const result = executeMetrics([
      "export", "--format", "json", "--output", exportFile, "--filter", "agent",
    ], { cwd: root, env });

    expect(result).toMatchObject({ exitCode: 1, stderr: expect.stringContaining("dimension=value") });
    expect(existsSync(exportFile)).toBe(false);
  });

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
    expect(JSON.parse(readFileSync(exportFile, "utf8"))).toEqual([
      expect.objectContaining({ groupBy: "outcome", dimension: "rework", count: 1 }),
      expect.objectContaining({ groupBy: "outcome", dimension: "useful", count: 1 }),
    ]);
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
