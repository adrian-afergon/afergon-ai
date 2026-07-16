import type { EfficiencyRecord, EnrichmentResult, MetricsStatus, ReportQuery, ReportRow } from "./domain.js";

export interface EventParser {
  parse(input: unknown): EfficiencyRecord;
}

export interface RecordStore {
  transaction<T>(work: () => T): T;
  insert(records: readonly EfficiencyRecord[]): void;
  query(query: ReportQuery): readonly ReportRow[];
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

export interface RecordExporter {
  export(records: readonly EfficiencyRecord[]): string;
}
