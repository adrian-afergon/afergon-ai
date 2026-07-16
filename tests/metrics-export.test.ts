import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { V1EventParser } from "../scripts/lib/usage-metrics/afergon-v1.js";
import { CsvMetricsExporter, JsonMetricsExporter, LocalMetricsExportWriter } from "../scripts/lib/usage-metrics/export.js";

const parser = new V1EventParser();
const roots: string[] = [];

function record() {
  return parser.parse({
    source: "afergon-ai",
    version: 1,
    eventId: "event-123",
    occurredAt: "2026-07-16T08:00:00.000Z",
    workflowRunId: "run-456",
    phase: "implement",
    agent: "afg-implement",
    outcome: "useful",
    task: "issue,18",
  });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("metrics exporters", () => {
  it("preserves structured gaps and unavailable enrichment in JSON", () => {
    const payload = JSON.parse(new JsonMetricsExporter().export([record()])) as { records: Array<Record<string, unknown>> };

    expect(payload.records[0]).toMatchObject({
      id: "event-123",
      task: "issue,18",
      model: "unavailable",
      enrichment: { available: false, estimatedCost: "unavailable" },
    });
    expect(payload.records[0].gaps).toMatchObject({ enrichment: ["estimatedCost"] });
  });

  it("uses a fixed CSV header and explicit unavailable cells", () => {
    const csv = new CsvMetricsExporter().export([record()]);
    const [header, row] = csv.trimEnd().split("\n");

    expect(header).toBe("id,occurredAt,workflowRunId,phase,agent,outcome,task,subagent,model,modelProfile,reviewCycle,correlationId,retryCount,reworkOfEventId,enrichmentAvailable,estimatedCost");
    expect(row).toContain('"issue,18"');
    expect(row).toContain("unavailable");
  });

  it("writes only local output paths", () => {
    const root = mkdtempSync(join(tmpdir(), "afergon-export-"));
    roots.push(root);
    const output = join(root, "nested", "metrics.json");
    const writer = new LocalMetricsExportWriter();

    writer.write("json", output, [record()]);

    expect(existsSync(output)).toBe(true);
    expect(readFileSync(output, "utf8")).toContain("event-123");
    expect(() => writer.write("json", "https://example.test/metrics.json", [record()])).toThrow("output:");
  });
});
