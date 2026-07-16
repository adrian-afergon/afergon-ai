import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { type EfficiencyRecord, UNAVAILABLE } from "./domain.js";
import type { RecordExporter } from "./ports.js";

const CSV_HEADERS = [
  "id", "occurredAt", "workflowRunId", "phase", "agent", "outcome", "task", "subagent", "model",
  "modelProfile", "reviewCycle", "correlationId", "retryCount", "reworkOfEventId", "enrichmentAvailable", "estimatedCost",
] as const;
const ATTRIBUTION_FIELDS = ["task", "subagent", "model", "modelProfile", "correlationId"] as const;

type ExportedRecord = {
  id: string;
  occurredAt: string;
  workflowRunId: string;
  phase: string;
  agent: string;
  outcome: string;
  task: string | number;
  subagent: string | number;
  model: string | number;
  modelProfile: string | number;
  reviewCycle: string | number;
  correlationId: string | number;
  retryCount: string | number;
  reworkOfEventId: string | number;
  gaps: { attribution: readonly string[]; enrichment: readonly ["estimatedCost"] };
  enrichment: { available: false; estimatedCost: typeof UNAVAILABLE };
};

export class JsonMetricsExporter implements RecordExporter {
  public export(records: readonly EfficiencyRecord[]): string {
    return JSON.stringify({
      version: 1,
      records: records.map((record) => this.toExportedRecord(record)),
    }, null, 2) + "\n";
  }

  private toExportedRecord(record: EfficiencyRecord): ExportedRecord {
    return {
      id: record.id,
      occurredAt: record.occurredAt,
      workflowRunId: record.workflowRunId,
      phase: record.phase,
      agent: record.agent,
      outcome: record.outcome,
      task: record.task,
      subagent: record.subagent,
      model: record.model,
      modelProfile: record.modelProfile,
      reviewCycle: record.reviewCycle,
      correlationId: record.correlationId,
      retryCount: record.retryCount,
      reworkOfEventId: record.reworkOfEventId,
      gaps: {
        attribution: ATTRIBUTION_FIELDS.filter((field) => record[field] === UNAVAILABLE),
        enrichment: ["estimatedCost"],
      },
      enrichment: { available: false, estimatedCost: UNAVAILABLE },
    };
  }
}

export class CsvMetricsExporter implements RecordExporter {
  public export(records: readonly EfficiencyRecord[]): string {
    const rows = records.map((record) => [
      record.id,
      record.occurredAt,
      record.workflowRunId,
      record.phase,
      record.agent,
      record.outcome,
      record.task,
      record.subagent,
      record.model,
      record.modelProfile,
      record.reviewCycle,
      record.correlationId,
      record.retryCount,
      record.reworkOfEventId,
      false,
      UNAVAILABLE,
    ].map((value) => this.escape(value)).join(","));
    return `${CSV_HEADERS.join(",")}\n${rows.join("\n")}${rows.length > 0 ? "\n" : ""}`;
  }

  private escape(value: string | number | boolean): string {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }
}

export type MetricsExportFormat = "json" | "csv";

export class LocalMetricsExportWriter {
  private readonly exporters: Readonly<Record<MetricsExportFormat, RecordExporter>> = {
    json: new JsonMetricsExporter(),
    csv: new CsvMetricsExporter(),
  };

  public write(format: MetricsExportFormat, output: string, records: readonly EfficiencyRecord[]): void {
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(output) || output.startsWith("file:")) {
      throw new Error("output: only local filesystem paths are supported");
    }
    const destination = path.resolve(output);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, this.exporters[format].export(records));
  }
}
