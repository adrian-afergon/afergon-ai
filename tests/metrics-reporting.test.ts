import { describe, expect, it } from "vitest";

import { V1EventParser } from "../scripts/lib/usage-metrics/afergon-v1.js";
import { ReportQuery, type EfficiencyRecord } from "../scripts/lib/usage-metrics/domain.js";
import { ImportMetricsUseCase } from "../scripts/lib/usage-metrics/use-cases.js";
import type { EnrichmentProvider, MetricsLifecycle, RecordQuery, RecordStore } from "../scripts/lib/usage-metrics/ports.js";
import { EfficiencyReportService } from "../scripts/lib/usage-metrics/reporting.js";

const parser = new V1EventParser();

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

class SelectiveEnrichment implements EnrichmentProvider {
  public enrich(record: EfficiencyRecord) {
    return { available: record.id === "enriched" };
  }
}

class CountingEnrichment extends SelectiveEnrichment {
  public readonly calls = new Map<string, number>();

  public override enrich(record: EfficiencyRecord) {
    this.calls.set(record.id, (this.calls.get(record.id) ?? 0) + 1);
    return super.enrich(record);
  }
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
    const service = new EfficiencyReportService(new InMemoryQuery([
      event("complete", {
        task: "issue-18",
        subagent: "reviewer",
        model: "gpt-5.6",
        modelProfile: "quality",
        correlationId: "session-1",
      }),
      event("gap", { task: "issue-18" }),
    ]));

    const report = service.generate(ReportQuery.create("attributionGaps"));

    expect(report.rows).toEqual([
      expect.objectContaining({ dimension: "absent", count: 1 }),
      expect.objectContaining({ dimension: "present", count: 1 }),
    ]);
  });

  it("uses one present row when every record has an attribution gap", () => {
    const service = new EfficiencyReportService(new InMemoryQuery([event("gap-1"), event("gap-2")]));

    const report = service.generate(ReportQuery.create("attributionGaps"));

    expect(report.total).toBe(2);
    expect(report.rows).toEqual([
      expect.objectContaining({ dimension: "present", count: 2, attributionGaps: 2 }),
    ]);
  });

  it("groups mixed records by exact enrichment-gap state", () => {
    const service = new EfficiencyReportService(
      new InMemoryQuery([event("enriched"), event("gap")]),
      new SelectiveEnrichment(),
    );

    const report = service.generate(ReportQuery.create("enrichmentGaps"));

    expect(report.rows).toEqual([
      expect.objectContaining({ dimension: "absent", count: 1 }),
      expect.objectContaining({ dimension: "present", count: 1 }),
    ]);
  });

  it("composes an attribution-gap filter with an existing dimension filter", () => {
    const service = new EfficiencyReportService(new InMemoryQuery([
      event("agent-a-complete", {
        agent: "agent-a",
        task: "issue-18",
        subagent: "reviewer",
        model: "gpt-5.6",
        modelProfile: "quality",
        correlationId: "session-1",
      }),
      event("agent-a-gap", { agent: "agent-a" }),
      event("agent-b-gap", { agent: "agent-b" }),
    ]));

    const report = service.generate(ReportQuery.create("outcome", {
      agent: "agent-a",
      attributionGaps: "present",
    }));

    expect(report.total).toBe(1);
    expect(report.rows).toEqual([expect.objectContaining({ dimension: "useful", count: 1 })]);
  });

  it("filters enrichment gaps from one consistent result per record", () => {
    const enrichment = new CountingEnrichment();
    const service = new EfficiencyReportService(
      new InMemoryQuery([event("enriched"), event("gap")]),
      enrichment,
    );

    const report = service.generate(ReportQuery.create("outcome", { enrichmentGaps: "present" }));

    expect(report.total).toBe(1);
    expect(report.rows).toEqual([expect.objectContaining({ dimension: "useful", count: 1, enrichmentGaps: 1 })]);
    expect(enrichment.calls).toEqual(new Map([["enriched", 1], ["gap", 1]]));
  });

  it("filters exact absent states for both gap dimensions", () => {
    const completeAttribution = {
      task: "issue-18",
      subagent: "reviewer",
      model: "gpt-5.6",
      modelProfile: "quality",
      correlationId: "session-1",
    };
    const service = new EfficiencyReportService(
      new InMemoryQuery([event("enriched", completeAttribution), event("gap")]),
      new SelectiveEnrichment(),
    );

    const report = service.generate(ReportQuery.create("outcome", {
      attributionGaps: "absent",
      enrichmentGaps: "absent",
    }));

    expect(report.total).toBe(1);
    expect(report.rows).toEqual([
      expect.objectContaining({ dimension: "useful", count: 1, attributionGaps: 0, enrichmentGaps: 0 }),
    ]);
  });
});
