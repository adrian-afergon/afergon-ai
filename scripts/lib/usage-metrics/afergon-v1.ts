import {
  AFERGON_AI_EVENT_SOURCE,
  AFERGON_AI_EVENT_VERSION,
  EFFICIENCY_OUTCOMES,
  type EfficiencyRecord,
  type EfficiencyOutcome,
  MetricsError,
  SemanticEventV1,
  type SemanticEventV1Input,
  UNAVAILABLE,
  WORKFLOW_PHASES,
  type WorkflowPhase,
} from "./domain.js";
import type { EventParser } from "./ports.js";

const PHASES = new Set<WorkflowPhase>(WORKFLOW_PHASES);
const OUTCOMES = new Set<EfficiencyOutcome>(EFFICIENCY_OUTCOMES);
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

function optionalNonNegativeInteger(input: Record<string, unknown>, field: string): number | typeof UNAVAILABLE {
  const value = input[field];
  if (value === undefined) return UNAVAILABLE;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new MetricsError(field, "invalid", "must be a non-negative integer when supplied");
  }
  return value;
}

export class V1EventParser implements EventParser {
  public parse(input: unknown): EfficiencyRecord {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new MetricsError("event", "invalid", "must be an object");
    }
    const event = input as Record<string, unknown>;
    if (event.source !== AFERGON_AI_EVENT_SOURCE) throw new MetricsError("source", "unsupported", "must be afergon-ai");
    if (event.version !== AFERGON_AI_EVENT_VERSION) throw new MetricsError("version", "unsupported", "must be 1");

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
    const task = optionalString(event, "task");
    const subagent = optionalString(event, "subagent");
    const model = optionalString(event, "model");
    const modelProfile = optionalString(event, "modelProfile");
    const correlationId = optionalString(event, "correlationId");
    const retryCount = optionalNonNegativeInteger(event, "retryCount");
    const reworkOfEventId = optionalString(event, "reworkOfEventId");

    return new SemanticEventV1({
      source: AFERGON_AI_EVENT_SOURCE,
      version: AFERGON_AI_EVENT_VERSION,
      eventId: requiredString(event, "eventId"),
      occurredAt,
      workflowRunId: requiredString(event, "workflowRunId"),
      phase,
      agent: requiredString(event, "agent"),
      outcome,
      task: task === UNAVAILABLE ? undefined : task,
      subagent: subagent === UNAVAILABLE ? undefined : subagent,
      model: model === UNAVAILABLE ? undefined : model,
      modelProfile: modelProfile === UNAVAILABLE ? undefined : modelProfile,
      reviewCycle: reviewCycle === UNAVAILABLE ? undefined : reviewCycle,
      correlationId: correlationId === UNAVAILABLE ? undefined : correlationId,
      retryCount: retryCount === UNAVAILABLE ? undefined : retryCount,
      reworkOfEventId: reworkOfEventId === UNAVAILABLE ? undefined : reworkOfEventId,
    }).normalize();
  }
}
