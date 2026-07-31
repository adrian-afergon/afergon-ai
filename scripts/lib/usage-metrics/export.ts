import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { ReportDimension, ReportRow } from "./domain.js";
import type { ReportExporter } from "./ports.js";

const CSV_HEADERS = [
  "groupBy", "dimension", "count", "usefulCount", "reworkCount", "failedCount", "coordinationCount",
  "acceptedCount", "rejectedCount", "unknownCount", "reworkRate", "attributionGaps", "enrichmentGaps",
] as const;

type ExportedReportRow = { readonly groupBy: ReportDimension } & ReportRow;

export class JsonMetricsExporter implements ReportExporter {
  public export(groupBy: ReportDimension, rows: readonly ReportRow[]): string {
    return `${JSON.stringify(rows.map((row): ExportedReportRow => ({ groupBy, ...row })), null, 2)}\n`;
  }
}

export class CsvMetricsExporter implements ReportExporter {
  public export(groupBy: ReportDimension, reportRows: readonly ReportRow[]): string {
    const rows = reportRows.map((row) => [
      groupBy,
      row.dimension,
      row.count,
      row.usefulCount,
      row.reworkCount,
      row.failedCount,
      row.coordinationCount,
      row.acceptedCount,
      row.rejectedCount,
      row.unknownCount,
      row.reworkRate,
      row.attributionGaps,
      row.enrichmentGaps,
    ].map((value) => this.escape(value)).join(","));
    return `${CSV_HEADERS.join(",")}\n${rows.join("\n")}${rows.length > 0 ? "\n" : ""}`;
  }

  private escape(value: string | number | boolean): string {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }
}

export type MetricsExportFormat = "json" | "csv";

export function assertLocalOutputPath(output: string): void {
  if (!path.win32.isAbsolute(output) && /^[a-z][a-z\d+.-]*:/i.test(output)) {
    throw new Error("output: only local filesystem paths are supported");
  }
}

export class LocalMetricsExportWriter {
  private readonly exporters: Readonly<Record<MetricsExportFormat, ReportExporter>> = {
    json: new JsonMetricsExporter(),
    csv: new CsvMetricsExporter(),
  };

  public write(format: MetricsExportFormat, output: string, groupBy: ReportDimension, rows: readonly ReportRow[]): void {
    assertLocalOutputPath(output);
    const destination = path.resolve(output);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, this.exporters[format].export(groupBy, rows));
  }
}
