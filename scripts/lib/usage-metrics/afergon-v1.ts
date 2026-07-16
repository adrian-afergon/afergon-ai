import {
  EfficiencyRecord,
  type EfficiencyOutcome,
  MetricsError,
  type SemanticEventV1Input,
  UNAVAILABLE,
  type WorkflowPhase,
} from "./domain.js";
import type { EventParser } from "./ports.js";

const PHASES = new Set<WorkflowPhase>(["debate", "breakdown", "specify", "plannify", "design", "implement", "review", "fix", "re-review"]);
const OUTCOMES = new Set<EfficiencyOutcome>(["useful", "rework", "failed", "coordination", "accepted", "rejected", "unknown"]);
const ISO_UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/;

function isValidIsoUtcTimestamp(value: string): boolean {
  const match = ISO_UTC_TIMESTAMP.exec(value);
  if (!match) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fractionText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const millisecond = Number((fractionText ?? "").padEnd(3, "0").slice(0, 3));
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && date.getUTCHours() === hour
    && date.getUTCMinutes() === minute
    && date.getUTCSeconds() === second
    && date.getUTCMilliseconds() === millisecond;
}

function requiredString(input: Record<string, unknown>, field: keyof SemanticEventV1Input): string {
  const value = input[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new MetricsError(field, "missing", "a non-empty string is required");
  }
  return value.trim();
}

function optionalString(input: Record<string, unknown>, field: string): string | typeof UNAVAILABLE {
  const value = input[field];
  if (value === undefined) return UNAVAILABLE;
  if (typeof value !== "string" || !value.trim()) {
    throw new MetricsError(field, "invalid", "must be a non-empty string when supplied");
  }
  return value.trim();
}

export class V1EventParser implements EventParser {
  public parse(input: unknown): EfficiencyRecord {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new MetricsError("event", "invalid", "must be an object");
    }
    const event = input as Record<string, unknown>;
    if (event.source !== "afergon-ai") throw new MetricsError("source", "unsupported", "must be afergon-ai");
    if (event.version !== 1) throw new MetricsError("version", "unsupported", "must be 1");

    const occurredAt = requiredString(event, "occurredAt");
    if (!isValidIsoUtcTimestamp(occurredAt)) throw new MetricsError("occurredAt", "invalid", "must be a valid ISO UTC timestamp");
    const phase = requiredString(event, "phase") as WorkflowPhase;
    if (!PHASES.has(phase)) throw new MetricsError("phase", "invalid", "is not a supported workflow phase");
    const outcome = requiredString(event, "outcome") as EfficiencyOutcome;
    if (!OUTCOMES.has(outcome)) throw new MetricsError("outcome", "invalid", "is not a supported outcome");

    const suppliedReviewCycle = event.reviewCycle;
    const reviewCycle = suppliedReviewCycle === undefined ? UNAVAILABLE : suppliedReviewCycle;
    if (reviewCycle !== UNAVAILABLE && (typeof reviewCycle !== "number" || !Number.isInteger(reviewCycle) || reviewCycle < 0)) {
      throw new MetricsError("reviewCycle", "invalid", "must be a non-negative integer when supplied");
    }

    return new EfficiencyRecord({
      id: requiredString(event, "eventId"), occurredAt, workflowRunId: requiredString(event, "workflowRunId"), phase,
      agent: requiredString(event, "agent"), outcome, task: optionalString(event, "task"),
      subagent: optionalString(event, "subagent"), model: optionalString(event, "model"),
      modelProfile: optionalString(event, "modelProfile"), reviewCycle, correlationId: optionalString(event, "correlationId"),
    });
  }
}
