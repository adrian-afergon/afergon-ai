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

  it("keeps supplied optional attribution verbatim", () => {
    const record = new V1EventParser().parse({
      ...validEvent,
      task: "issue-18",
      subagent: "afg-review",
      model: "openai/gpt-5.6",
      modelProfile: "quality",
      reviewCycle: 2,
      correlationId: "session-789",
    });

    expect(record).toMatchObject({
      task: "issue-18",
      subagent: "afg-review",
      model: "openai/gpt-5.6",
      modelProfile: "quality",
      reviewCycle: 2,
      correlationId: "session-789",
    });
  });
});

describe("report query value object", () => {
  it("accepts a supported report dimension", () => {
    expect(new ReportQuery("modelProfile", { outcome: "useful" })).toMatchObject({
      groupBy: "modelProfile",
      filters: { outcome: "useful" },
    });
  });

  it.each(["cost", "source"])('rejects unsupported grouping "%s"', (groupBy) => {
    expect(() => new ReportQuery(groupBy as never)).toThrow("groupBy:");
  });
});
