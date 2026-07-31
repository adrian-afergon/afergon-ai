import type { EfficiencyRecord, EnrichmentResult, MetricsStatus, ReportDimension, ReportRow } from "./domain.js";

export interface EventParser {
  parse(input: unknown): EfficiencyRecord;
}

export interface RecordQuery {
  all(): readonly EfficiencyRecord[];
}

export interface RecordStore extends RecordQuery {
  transaction<T>(work: () => T): T;
  insert(records: readonly EfficiencyRecord[]): void;
  clear(): void;
}

export interface MetricsLifecycle {
  status(): MetricsStatus;
  enable(): void;
  requireEnabled(): void;
  clearConfirmed(confirmed: boolean): void;
}

export interface EnrichmentProvider {
  enrich(record: EfficiencyRecord): EnrichmentResult;
}

export interface ReportExporter {
  export(groupBy: ReportDimension, rows: readonly ReportRow[]): string;
}
