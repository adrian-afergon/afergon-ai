import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import type { ReportRow } from "../scripts/lib/usage-metrics/domain.js";
import { assertLocalOutputPath, CsvMetricsExporter, JsonMetricsExporter, LocalMetricsExportWriter } from "../scripts/lib/usage-metrics/export.js";

const roots: string[] = [];

function reportRow(values: Partial<ReportRow> = {}): ReportRow {
  return {
    dimension: "agent-a", count: 2, usefulCount: 1, reworkCount: 1, failedCount: 0,
    coordinationCount: 0, acceptedCount: 0, rejectedCount: 0, unknownCount: 0,
    reworkRate: 0.5, attributionGaps: 1, enrichmentGaps: 2,
    ...values,
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("metrics exporters", () => {
  it("accepts a Windows drive absolute path as a local output", () => {
    expect(() => assertLocalOutputPath("C:\\exports\\metrics.json")).not.toThrow();
  });

  it("uses stable empty JSON and CSV report schemas", () => {
    expect(new JsonMetricsExporter().export("outcome", [])).toBe("[]\n");
    expect(new CsvMetricsExporter().export("outcome", [])).toBe(
      "groupBy,dimension,count,usefulCount,reworkCount,failedCount,coordinationCount,acceptedCount,rejectedCount,unknownCount,reworkRate,attributionGaps,enrichmentGaps\n",
    );
  });

  it("preserves non-default grouping in matching stable JSON and CSV rows", () => {
    const row = reportRow();

    expect(JSON.parse(new JsonMetricsExporter().export("agent", [row]))).toEqual([{ groupBy: "agent", ...row }]);
    expect(new CsvMetricsExporter().export("agent", [row])).toBe(
      "groupBy,dimension,count,usefulCount,reworkCount,failedCount,coordinationCount,acceptedCount,rejectedCount,unknownCount,reworkRate,attributionGaps,enrichmentGaps\n" +
      "agent,agent-a,2,1,1,0,0,0,0,0,0.5,1,2\n",
    );
  });

  it("writes only local output paths", () => {
    const root = mkdtempSync(join(tmpdir(), "afergon-export-"));
    roots.push(root);
    const output = join(root, "nested", "metrics.json");
    const writer = new LocalMetricsExportWriter();

    writer.write("json", output, "outcome", [reportRow({ dimension: "useful", count: 1 })]);

    expect(existsSync(output)).toBe(true);
    expect(readFileSync(output, "utf8")).toContain('"dimension": "useful"');
    expect(() => writer.write("json", "https://example.test/metrics.json", "outcome", [])).toThrow("output:");
  });
});
