import { describe, expect, it } from "vitest";

import { V1EventParser } from "../scripts/lib/usage-metrics/afergon-v1.js";
import { ReportQuery } from "../scripts/lib/usage-metrics/domain.js";

const validEvent = {
  source: "afergon-ai",
  version: 1,
  eventId: "event-123",
  occurredAt: "2026-07-16T08:00:00.000Z",
  workflowRunId: "run-456",
  phase: "implement",
  agent: "afg-implement",
  outcome: "useful",
};

function directReportQueryConstructionMustRemainUnavailable(): ReportQuery {
  // @ts-expect-error ReportQuery construction is restricted to its validating factory.
  return new ReportQuery();
}

void directReportQueryConstructionMustRemainUnavailable;

describe("AFERGON-AI v1 event parser", () => {
  it("normalizes a valid event and preserves unavailable optional attribution", () => {
    const record = new V1EventParser().parse(validEvent);

    expect(record).toMatchObject({
      id: "event-123",
      occurredAt: "2026-07-16T08:00:00.000Z",
      workflowRunId: "run-456",
      phase: "implement",
      agent: "afg-implement",
      outcome: "useful",
      task: "unavailable",
      subagent: "unavailable",
      model: "unavailable",
      modelProfile: "unavailable",
      reviewCycle: "unavailable",
      correlationId: "unavailable",
    });
  });

  it.each([
    ["foreign source", { ...validEvent, source: "gentle-ai" }, "source"],
    ["unsupported version", { ...validEvent, version: 2 }, "version"],
    ["malformed timestamp", { ...validEvent, occurredAt: "tomorrow" }, "occurredAt"],
    ["parseable non-ISO timestamp", { ...validEvent, occurredAt: "July 16, 2026 08:00:00" }, "occurredAt"],
    ["calendar-invalid ISO timestamp", { ...validEvent, occurredAt: "2026-02-30T08:00:00.000Z" }, "occurredAt"],
    ["missing required agent", { ...validEvent, agent: "" }, "agent"],
  ])("rejects %s with a typed diagnostic", (_label, event, field) => {
    expect(() => new V1EventParser().parse(event)).toThrow(`${field}:`);
  });

  it.each(["eventId", "occurredAt", "workflowRunId", "phase", "agent", "outcome"] as const)(
    "rejects a missing required %s field",
    (field) => {
      expect(() => new V1EventParser().parse({ ...validEvent, [field]: "" })).toThrow(`${field}:`);
    },
  );

  it.each([
    ["invalid phase", { ...validEvent, phase: "not-a-phase" }, "phase"],
    ["invalid outcome", { ...validEvent, outcome: "not-an-outcome" }, "outcome"],
    ["negative review cycle", { ...validEvent, reviewCycle: -1 }, "reviewCycle"],
    ["fractional review cycle", { ...validEvent, reviewCycle: 1.5 }, "reviewCycle"],
    ["negative retry count", { ...validEvent, retryCount: -1 }, "retryCount"],
    ["fractional retry count", { ...validEvent, retryCount: 1.5 }, "retryCount"],
    ["empty rework event", { ...validEvent, reworkOfEventId: "" }, "reworkOfEventId"],
  ])("rejects %s with a typed diagnostic", (_label, event, field) => {
    expect(() => new V1EventParser().parse(event)).toThrow(`${field}:`);
  });

  it("keeps supplied optional attribution verbatim", () => {
    const record = new V1EventParser().parse({
      ...validEvent,
      task: "issue-18",
      subagent: "afg-review",
      model: "openai/gpt-5.6",
       modelProfile: "quality",
       reviewCycle: 2,
       correlationId: "session-789",
       retryCount: 1,
       reworkOfEventId: "event-122",
     });

    expect(record).toMatchObject({
      task: "issue-18",
      subagent: "afg-review",
      model: "openai/gpt-5.6",
      modelProfile: "quality",
      reviewCycle: 2,
      correlationId: "session-789",
      retryCount: 1,
      reworkOfEventId: "event-122",
    });
  });
});

describe("report query value object", () => {
  it("creates a query with a supported grouping and filter", () => {
    expect(ReportQuery.create("modelProfile", { outcome: "useful" })).toMatchObject({
      groupBy: "modelProfile",
      filters: { outcome: "useful" },
    });
  });

  it("creates the default outcome query without filters", () => {
    expect(ReportQuery.create()).toMatchObject({ groupBy: "outcome", filters: {} });
  });

  it("preserves the unsupported-grouping diagnostic", () => {
    expect(() => ReportQuery.create("unsupported" as never)).toThrow(expect.objectContaining({
      field: "groupBy",
      code: "invalid",
      message: "groupBy: is not a supported report dimension",
    }));
  });

  it("preserves the unsupported-filter diagnostic", () => {
    expect(() => ReportQuery.create("outcome", { unsupported: "value" } as never)).toThrow(expect.objectContaining({
      field: "filter",
      code: "invalid",
      message: "filter: unsupported is not a supported report dimension",
    }));
  });
});
