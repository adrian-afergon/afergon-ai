import { describe, expect, it } from "vitest";

import { V1EventParser } from "../scripts/lib/usage-metrics/afergon-v1.js";
import { ReportQuery, type EfficiencyRecord } from "../scripts/lib/usage-metrics/domain.js";
import { ImportMetricsUseCase } from "../scripts/lib/usage-metrics/use-cases.js";
import type { EnrichmentProvider, MetricsLifecycle, RecordQuery, RecordStore } from "../scripts/lib/usage-metrics/ports.js";
import { EfficiencyReportService } from "../scripts/lib/usage-metrics/reporting.js";

const parser = new V1EventParser();
const completeAttribution = { task: "issue-18", subagent: "reviewer", model: "gpt-5.6", modelProfile: "quality", correlationId: "session-1" };

function event(eventId: string, values: Record<string, unknown> = {}) {
  return parser.parse({
    source: "afergon-ai",
    version: 1,
    eventId,
    occurredAt: "2026-07-16T08:00:00.000Z",
    workflowRunId: "run-456",
    phase: "implement",
    agent: "agent-a",
    outcome: "useful",
    ...values,
  });
}

class InMemoryQuery implements RecordQuery {
  public constructor(private readonly records: readonly EfficiencyRecord[]) {}
  public all(): readonly EfficiencyRecord[] { return this.records; }
}

function report(records: readonly EfficiencyRecord[], query: ReportQuery, enrichment?: EnrichmentProvider) {
  return new EfficiencyReportService(new InMemoryQuery(records), enrichment).generate(query);
}
class InMemoryStore implements RecordStore {
  public records: EfficiencyRecord[] = [];
  public transaction<T>(work: () => T): T { return work(); }
  public insert(records: readonly EfficiencyRecord[]): void { this.records.push(...records); }
  public all(): readonly EfficiencyRecord[] { return this.records; }
  public clear(): void { this.records = []; }
}

class EnabledLifecycle implements MetricsLifecycle {
  public required = 0;
  public status() { return { enabled: true }; }
  public enable(): void {}
  public requireEnabled(): void { this.required += 1; }
  public clearConfirmed(): void {}
}

function selectiveEnrichment(calls?: Map<string, number>): EnrichmentProvider {
  return { enrich(record) {
    if (calls) calls.set(record.id, (calls.get(record.id) ?? 0) + 1);
    return { available: record.id === "enriched" };
  } };
}
describe("metrics use cases and reports", () => {
  it("validates all events before importing a batch", () => {
    const store = new InMemoryStore();
    const lifecycle = new EnabledLifecycle();
    const useCase = new ImportMetricsUseCase(parser, lifecycle, store);

    expect(() => useCase.execute([{
      source: "afergon-ai", version: 1, eventId: "valid", occurredAt: "2026-07-16T08:00:00.000Z",
      workflowRunId: "run", phase: "implement", agent: "agent-a", outcome: "useful",
    }, { source: "gentle-ai" }])).toThrow("source:");
    expect(store.records).toHaveLength(0);
    expect(lifecycle.required).toBe(1);
  });

  it("filters one agent and groups rework outcomes with review evidence", () => {
    const service = new EfficiencyReportService(new InMemoryQuery([
      event("event-1", { agent: "agent-a", outcome: "rework", reviewCycle: 1, retryCount: 1 }),
      event("event-2", { agent: "agent-a", outcome: "useful", reviewCycle: 1 }),
      event("event-3", { agent: "agent-b", outcome: "failed" }),
    ]));

    const report = service.generate(ReportQuery.create("outcome", { agent: "agent-a" }));

    expect(report.total).toBe(2);
    expect(report.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ dimension: "rework", count: 1, reworkCount: 1 }),
      expect.objectContaining({ dimension: "useful", count: 1, reworkCount: 0 }),
    ]));
  });

  it("shows unavailable attribution and enrichment without blocking the report", () => {
    const service = new EfficiencyReportService(new InMemoryQuery([event("event-1")]));

    const report = service.generate(ReportQuery.create("task"));

    expect(report.rows).toEqual([
      expect.objectContaining({ dimension: "unavailable", count: 1, attributionGaps: 1, enrichmentGaps: 1 }),
    ]);
    expect(report.cost).toEqual({ available: false, value: "unavailable", note: "Cost is optional context, not a success criterion." });
  });

  it("groups mixed records by exact attribution-gap state", () => {
    const result = report([event("complete", completeAttribution), event("gap")], ReportQuery.create("attributionGaps"));
    expect(result.rows).toEqual([expect.objectContaining({ dimension: "absent", count: 1 }), expect.objectContaining({ dimension: "present", count: 1 })]);
  });
  it("uses one present row when every record has an attribution gap", () => {
    const result = report([event("gap-1"), event("gap-2")], ReportQuery.create("attributionGaps"));
    expect(result.total).toBe(2);
    expect(result.rows).toEqual([expect.objectContaining({ dimension: "present", count: 2, attributionGaps: 2 })]);
  });
  it("groups mixed records by exact enrichment-gap state", () => {
    const result = report([event("enriched"), event("gap")], ReportQuery.create("enrichmentGaps"), selectiveEnrichment());
    expect(result.rows).toEqual([expect.objectContaining({ dimension: "absent", count: 1 }), expect.objectContaining({ dimension: "present", count: 1 })]);
  });
  it("composes an attribution-gap filter with an existing dimension filter", () => {
    const result = report([
      event("agent-a-complete", completeAttribution),
      event("agent-a-gap", { agent: "agent-a" }),
      event("agent-b-gap", { agent: "agent-b" }),
    ], ReportQuery.create("outcome", { agent: "agent-a", attributionGaps: "present" }));
    expect(result.total).toBe(1);
    expect(result.rows).toEqual([expect.objectContaining({ dimension: "useful", count: 1 })]);
  });
  it("filters enrichment gaps from one consistent result per record", () => {
    const calls = new Map<string, number>();
    const result = report([event("enriched"), event("gap")], ReportQuery.create("outcome", { enrichmentGaps: "present" }), selectiveEnrichment(calls));
    expect(result.total).toBe(1);
    expect(result.rows).toEqual([expect.objectContaining({ dimension: "useful", count: 1, enrichmentGaps: 1 })]);
    expect(calls).toEqual(new Map([["enriched", 1], ["gap", 1]]));
  });

  it("filters exact absent states for both gap dimensions", () => {
    const result = report([event("enriched", completeAttribution), event("gap")],
      ReportQuery.create("outcome", { attributionGaps: "absent", enrichmentGaps: "absent" }), selectiveEnrichment());
    expect(result.total).toBe(1);
    expect(result.rows).toEqual([expect.objectContaining({ dimension: "useful", count: 1, attributionGaps: 0, enrichmentGaps: 0 })]);
  });
});
