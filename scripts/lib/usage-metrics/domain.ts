export const UNAVAILABLE = "unavailable" as const;
export const AFERGON_AI_EVENT_SOURCE = "afergon-ai" as const;
export const AFERGON_AI_EVENT_VERSION = 1 as const;

export type Unavailable = typeof UNAVAILABLE;
export type Attribution = string | Unavailable;
export const WORKFLOW_PHASES = ["debate", "breakdown", "specify", "plannify", "design", "implement", "review", "fix", "re-review"] as const;
export type WorkflowPhase = typeof WORKFLOW_PHASES[number];
export const EFFICIENCY_OUTCOMES = ["useful", "rework", "failed", "coordination", "accepted", "rejected", "unknown"] as const;
export type EfficiencyOutcome = typeof EFFICIENCY_OUTCOMES[number];

export class MetricsError extends Error {
  public readonly name = "MetricsError";

  public constructor(
    public readonly field: string,
    public readonly code: "invalid" | "missing" | "unsupported" | "disabled",
    message: string,
  ) {
    super(`${field}: ${message}`);
  }
}

export interface SemanticEventV1Input {
  readonly source: typeof AFERGON_AI_EVENT_SOURCE;
  readonly version: typeof AFERGON_AI_EVENT_VERSION;
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
  readonly retryCount?: number;
  readonly reworkOfEventId?: string;
}

export class SemanticEventV1 {
  public constructor(public readonly value: SemanticEventV1Input) {}

  public normalize(): EfficiencyRecord {
    return new EfficiencyRecord({
      id: this.value.eventId,
      occurredAt: this.value.occurredAt,
      workflowRunId: this.value.workflowRunId,
      phase: this.value.phase,
      agent: this.value.agent,
      outcome: this.value.outcome,
      task: this.value.task ?? UNAVAILABLE,
      subagent: this.value.subagent ?? UNAVAILABLE,
      model: this.value.model ?? UNAVAILABLE,
      modelProfile: this.value.modelProfile ?? UNAVAILABLE,
      reviewCycle: this.value.reviewCycle ?? UNAVAILABLE,
      correlationId: this.value.correlationId ?? UNAVAILABLE,
      retryCount: this.value.retryCount ?? UNAVAILABLE,
      reworkOfEventId: this.value.reworkOfEventId ?? UNAVAILABLE,
    });
  }
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
  readonly retryCount: number | Unavailable;
  readonly reworkOfEventId: Attribution;
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
  public get retryCount() { return this.fields.retryCount; }
  public get reworkOfEventId() { return this.fields.reworkOfEventId; }
}

export const REPORT_DIMENSIONS = ["task", "phase", "agent", "subagent", "model", "modelProfile", "outcome", "reviewCycle"] as const;
export type ReportDimension = typeof REPORT_DIMENSIONS[number];
export type ReportFilterValue = string | number | Unavailable;

const REPORT_DIMENSION_SET = new Set<ReportDimension>(REPORT_DIMENSIONS);

export class ReportQuery {
  public readonly groupBy: ReportDimension;
  public readonly filters: Readonly<Partial<Record<ReportDimension, ReportFilterValue>>>;

  public static create(
    groupBy: ReportDimension = "outcome",
    filters: Readonly<Partial<Record<ReportDimension, ReportFilterValue>>> = {},
  ): ReportQuery {
    if (!REPORT_DIMENSION_SET.has(groupBy)) throw new MetricsError("groupBy", "invalid", "is not a supported report dimension");
    for (const dimension of Object.keys(filters)) {
      if (!REPORT_DIMENSION_SET.has(dimension as ReportDimension)) throw new MetricsError("filter", "invalid", `${dimension} is not a supported report dimension`);
    }
    return new ReportQuery(groupBy, filters);
  }

  private constructor(groupBy: ReportDimension, filters: Readonly<Partial<Record<ReportDimension, ReportFilterValue>>>) {
    this.groupBy = groupBy;
    this.filters = filters;
  }
}

export interface ReportRow {
  readonly dimension: string;
  readonly count: number;
  readonly usefulCount: number;
  readonly reworkCount: number;
  readonly failedCount: number;
  readonly coordinationCount: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly unknownCount: number;
  readonly reworkRate: number;
  readonly attributionGaps: number;
  readonly enrichmentGaps: number;
}

export interface EfficiencyReport {
  readonly query: ReportQuery;
  readonly total: number;
  readonly rows: readonly ReportRow[];
  readonly attributionGaps: number;
  readonly enrichmentGaps: number;
  readonly cost: {
    readonly available: boolean;
    readonly value: number | Unavailable;
    readonly note: "Cost is optional context, not a success criterion.";
  };
}

export interface MetricsStatus {
  readonly enabled: boolean;
}

export interface EnrichmentResult {
  readonly available: boolean;
  readonly estimatedCost?: number;
}
