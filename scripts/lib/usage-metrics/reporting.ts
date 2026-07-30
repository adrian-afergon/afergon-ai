import {
  EFFICIENCY_OUTCOMES,
  type EfficiencyOutcome,
  type EfficiencyRecord,
  type EfficiencyReport,
  type EnrichmentResult,
  type GapState,
  type ReportDimension,
  ReportQuery,
  type ReportRow,
  UNAVAILABLE,
  type Unavailable,
} from "./domain.js";
import type { EnrichmentProvider, RecordQuery } from "./ports.js";

type MutableReportRow = {
  dimension: string;
  count: number;
  usefulCount: number;
  reworkCount: number;
  failedCount: number;
  coordinationCount: number;
  acceptedCount: number;
  rejectedCount: number;
  unknownCount: number;
  reworkRate: number;
  attributionGaps: number;
  enrichmentGaps: number;
};

type EvaluatedRecord = {
  readonly record: EfficiencyRecord;
  readonly attributionGap: boolean;
  readonly enrichment: EnrichmentResult;
};

const ATTRIBUTION_FIELDS = ["task", "subagent", "model", "modelProfile", "correlationId"] as const;

export class EfficiencyReportService {
  public constructor(
    private readonly records: RecordQuery,
    private readonly enrichment?: EnrichmentProvider,
  ) {}

  public generate(query: ReportQuery = ReportQuery.create()): EfficiencyReport {
    const selected = this.records.all()
      .map((record) => this.evaluate(record))
      .filter((evaluated) => this.matches(evaluated, query));
    const rows = new Map<string, MutableReportRow>();
    let attributionGaps = 0;
    let enrichmentGaps = 0;
    let estimatedCost = 0;
    let hasEstimatedCost = false;

    for (const evaluated of selected) {
      const { record, attributionGap, enrichment } = evaluated;
      const key = String(this.valueFor(evaluated, query.groupBy));
      const row = rows.get(key) ?? this.createRow(key);
      row.count += 1;
      this.incrementOutcome(row, record.outcome);
      if (this.isRework(record)) row.reworkCount += 1;
      if (attributionGap) {
        row.attributionGaps += 1;
        attributionGaps += 1;
      }
      if (!enrichment.available) {
        row.enrichmentGaps += 1;
        enrichmentGaps += 1;
      }
      if (typeof enrichment.estimatedCost === "number" && Number.isFinite(enrichment.estimatedCost)) {
        estimatedCost += enrichment.estimatedCost;
        hasEstimatedCost = true;
      }
      row.reworkRate = row.reworkCount / row.count;
      rows.set(key, row);
    }

    const reportRows = [...rows.values()]
      .sort((left, right) => left.dimension.localeCompare(right.dimension))
      .map((row): ReportRow => row);
    return {
      query,
      total: selected.length,
      rows: reportRows,
      attributionGaps,
      enrichmentGaps,
      cost: {
        available: hasEstimatedCost,
        value: hasEstimatedCost ? estimatedCost : UNAVAILABLE,
        note: "Cost is optional context, not a success criterion.",
      },
    };
  }

  private matches(evaluated: EvaluatedRecord, query: ReportQuery): boolean {
    return Object.entries(query.filters).every(([dimension, expected]) => this.valueFor(evaluated, dimension as ReportDimension) === expected);
  }

  private evaluate(record: EfficiencyRecord): EvaluatedRecord {
    return {
      record,
      attributionGap: this.hasAttributionGap(record),
      enrichment: this.getEnrichment(record),
    };
  }

  private valueFor(evaluated: EvaluatedRecord, dimension: ReportDimension): string | number | Unavailable {
    if (dimension === "attributionGaps") return this.gapState(evaluated.attributionGap);
    if (dimension === "enrichmentGaps") return this.gapState(!evaluated.enrichment.available);
    const { record } = evaluated;
    return record[dimension];
  }

  private gapState(hasGap: boolean): GapState {
    return hasGap ? "present" : "absent";
  }

  private createRow(dimension: string): MutableReportRow {
    return {
      dimension,
      count: 0,
      usefulCount: 0,
      reworkCount: 0,
      failedCount: 0,
      coordinationCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      unknownCount: 0,
      reworkRate: 0,
      attributionGaps: 0,
      enrichmentGaps: 0,
    };
  }

  private incrementOutcome(row: MutableReportRow, outcome: EfficiencyOutcome): void {
    const field = `${outcome}Count` as `${typeof EFFICIENCY_OUTCOMES[number]}Count`;
    if (field === "usefulCount") row.usefulCount += 1;
    if (field === "failedCount") row.failedCount += 1;
    if (field === "coordinationCount") row.coordinationCount += 1;
    if (field === "acceptedCount") row.acceptedCount += 1;
    if (field === "rejectedCount") row.rejectedCount += 1;
    if (field === "unknownCount") row.unknownCount += 1;
  }

  private isRework(record: EfficiencyRecord): boolean {
    return record.outcome === "rework" || (typeof record.retryCount === "number" && record.retryCount > 0);
  }

  private hasAttributionGap(record: EfficiencyRecord): boolean {
    return ATTRIBUTION_FIELDS.some((field) => record[field] === UNAVAILABLE);
  }

  private getEnrichment(record: EfficiencyRecord) {
    if (!this.enrichment) return { available: false };
    try {
      return this.enrichment.enrich(record);
    } catch {
      return { available: false };
    }
  }
}
