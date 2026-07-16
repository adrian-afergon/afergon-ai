export const UNAVAILABLE = "unavailable" as const;

export type Unavailable = typeof UNAVAILABLE;
export type Attribution = string | Unavailable;
export type WorkflowPhase =
  | "debate"
  | "breakdown"
  | "specify"
  | "plannify"
  | "design"
  | "implement"
  | "review"
  | "fix"
  | "re-review";
export type EfficiencyOutcome = "useful" | "rework" | "failed" | "coordination" | "accepted" | "rejected" | "unknown";

export class MetricsError extends Error {
  public readonly name = "MetricsError";

  public constructor(
    public readonly field: string,
    public readonly code: "invalid" | "missing" | "unsupported",
    message: string,
  ) {
    super(`${field}: ${message}`);
  }
}

export interface SemanticEventV1Input {
  readonly source: "afergon-ai";
  readonly version: 1;
  readonly eventId: string;
  readonly occurredAt: string;
  readonly workflowRunId: string;
  readonly phase: WorkflowPhase;
  readonly agent: string;
  readonly outcome: EfficiencyOutcome;
  readonly task?: string;
  readonly subagent?: string;
  readonly model?: string;
  readonly modelProfile?: string;
  readonly reviewCycle?: number;
  readonly correlationId?: string;
}

export class SemanticEventV1 {
  public constructor(public readonly value: SemanticEventV1Input) {}
}

export interface EfficiencyRecordFields {
  readonly id: string;
  readonly occurredAt: string;
  readonly workflowRunId: string;
  readonly phase: WorkflowPhase;
  readonly agent: string;
  readonly outcome: EfficiencyOutcome;
  readonly task: Attribution;
  readonly subagent: Attribution;
  readonly model: Attribution;
  readonly modelProfile: Attribution;
  readonly reviewCycle: number | Unavailable;
  readonly correlationId: Attribution;
}

export class EfficiencyRecord implements EfficiencyRecordFields {
  public constructor(public readonly fields: EfficiencyRecordFields) {}

  public get id() { return this.fields.id; }
  public get occurredAt() { return this.fields.occurredAt; }
  public get workflowRunId() { return this.fields.workflowRunId; }
  public get phase() { return this.fields.phase; }
  public get agent() { return this.fields.agent; }
  public get outcome() { return this.fields.outcome; }
  public get task() { return this.fields.task; }
  public get subagent() { return this.fields.subagent; }
  public get model() { return this.fields.model; }
  public get modelProfile() { return this.fields.modelProfile; }
  public get reviewCycle() { return this.fields.reviewCycle; }
  public get correlationId() { return this.fields.correlationId; }
}

export type ReportDimension = "task" | "phase" | "agent" | "subagent" | "model" | "modelProfile" | "outcome" | "reviewCycle";

const REPORT_DIMENSIONS = new Set<ReportDimension>(["task", "phase", "agent", "subagent", "model", "modelProfile", "outcome", "reviewCycle"]);

export class ReportQuery {
  public readonly groupBy: ReportDimension;
  public readonly filters: Readonly<Record<string, string | number | Unavailable>>;

  public constructor(groupBy: ReportDimension = "outcome", filters: Readonly<Record<string, string | number | Unavailable>> = {}) {
    if (!REPORT_DIMENSIONS.has(groupBy)) throw new MetricsError("groupBy", "invalid", "is not a supported report dimension");
    this.groupBy = groupBy;
    this.filters = filters;
  }
}

export interface ReportRow {
  readonly dimension: string;
  readonly count: number;
}

export interface MetricsStatus {
  readonly enabled: boolean;
}

export interface EnrichmentResult {
  readonly available: boolean;
}
