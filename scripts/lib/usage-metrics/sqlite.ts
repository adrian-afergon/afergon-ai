import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, rmdirSync, writeFileSync } from "node:fs";

import { EfficiencyRecord, MetricsError, UNAVAILABLE, type Attribution, type MetricsStatus } from "./domain.js";
import type { MetricsLifecycle, RecordStore } from "./ports.js";
import type { MetricsPathResolver, MetricsPaths } from "./paths.js";

type StoredRecord = {
  id: string;
  occurred_at: string;
  workflow_run_id: string;
  phase: string;
  agent: string;
  outcome: string;
  task: string | null;
  subagent: string | null;
  model: string | null;
  model_profile: string | null;
  review_cycle: number | null;
  correlation_id: string | null;
  retry_count: number | null;
  rework_of_event_id: string | null;
};

export class SqliteMetricsStore implements RecordStore, MetricsLifecycle {
  private database?: DatabaseSync;

  public constructor(private readonly pathResolver: MetricsPathResolver) {}

  public status(): MetricsStatus {
    const paths = this.pathResolver.resolve();
    if (!existsSync(paths.stateFile)) return { enabled: false };
    try {
      const state = JSON.parse(readFileSync(paths.stateFile, "utf8")) as { enabled?: unknown };
      if (state.enabled !== true) throw new Error("enabled flag is not true");
      return { enabled: true };
    } catch {
      throw new MetricsError("state", "invalid", "must contain enabled=true JSON");
    }
  }

  public enable(): void {
    const paths = this.pathResolver.resolve();
    const wasEnabled = this.status().enabled;
    mkdirSync(paths.metricsDirectory, { recursive: true });
    if (!wasEnabled) this.writeState(paths);
    try {
      this.database ??= this.openDatabase(paths);
    } catch (error) {
      if (!wasEnabled) this.removeOwnedFiles(paths);
      throw error;
    }
  }

  public requireEnabled(): void {
    if (!this.status().enabled) throw new MetricsError("metrics", "disabled", "must be enabled before use");
  }

  public transaction<T>(work: () => T): T {
    const database = this.databaseForUse();
    database.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      database.exec("COMMIT");
      return result;
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  public insert(records: readonly EfficiencyRecord[]): void {
    if (records.length === 0) return;
    this.transaction(() => {
      const statement = this.databaseForUse().prepare(`
        INSERT INTO records (
          id, occurred_at, workflow_run_id, phase, agent, outcome, task, subagent,
          model, model_profile, review_cycle, correlation_id, retry_count, rework_of_event_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const record of records) {
        statement.run(
          record.id,
          record.occurredAt,
          record.workflowRunId,
          record.phase,
          record.agent,
          record.outcome,
          this.toNullable(record.task),
          this.toNullable(record.subagent),
          this.toNullable(record.model),
          this.toNullable(record.modelProfile),
          this.toNullable(record.reviewCycle),
          this.toNullable(record.correlationId),
          this.toNullable(record.retryCount),
          this.toNullable(record.reworkOfEventId),
        );
      }
    });
  }

  public all(): readonly EfficiencyRecord[] {
    const rows = this.databaseForUse().prepare("SELECT * FROM records ORDER BY rowid").all() as unknown as StoredRecord[];
    return rows.map((row) => new EfficiencyRecord({
      id: row.id,
      occurredAt: row.occurred_at,
      workflowRunId: row.workflow_run_id,
      phase: row.phase as EfficiencyRecord["phase"],
      agent: row.agent,
      outcome: row.outcome as EfficiencyRecord["outcome"],
      task: this.fromNullable(row.task),
      subagent: this.fromNullable(row.subagent),
      model: this.fromNullable(row.model),
      modelProfile: this.fromNullable(row.model_profile),
      reviewCycle: row.review_cycle ?? UNAVAILABLE,
      correlationId: this.fromNullable(row.correlation_id),
      retryCount: row.retry_count ?? UNAVAILABLE,
      reworkOfEventId: this.fromNullable(row.rework_of_event_id),
    }));
  }

  public clear(): void {
    this.removeOwnedFiles(this.pathResolver.resolve());
  }

  public clearConfirmed(confirmed: boolean): void {
    if (!confirmed) throw new MetricsError("clear", "invalid", "requires explicit confirmation");
    this.clear();
  }

  private databaseForUse(): DatabaseSync {
    this.requireEnabled();
    if (!this.database) this.database = this.openDatabase(this.pathResolver.resolve());
    return this.database;
  }

  private openDatabase(paths: MetricsPaths): DatabaseSync {
    mkdirSync(paths.metricsDirectory, { recursive: true });
    const database = new DatabaseSync(paths.databaseFile);
    database.exec("PRAGMA journal_mode = WAL");
    database.exec("PRAGMA user_version = 1");
    database.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        occurred_at TEXT NOT NULL,
        workflow_run_id TEXT NOT NULL,
        phase TEXT NOT NULL,
        agent TEXT NOT NULL,
        outcome TEXT NOT NULL,
        task TEXT,
        subagent TEXT,
        model TEXT,
        model_profile TEXT,
        review_cycle INTEGER,
        correlation_id TEXT,
        retry_count INTEGER,
        rework_of_event_id TEXT
      ) STRICT
    `);
    return database;
  }

  private writeState(paths: MetricsPaths): void {
    const temporaryState = `${paths.stateFile}.tmp`;
    writeFileSync(temporaryState, `${JSON.stringify({ enabled: true })}\n`, { mode: 0o600 });
    renameSync(temporaryState, paths.stateFile);
  }

  private removeOwnedFiles(paths: MetricsPaths): void {
    this.database?.close();
    this.database = undefined;
    for (const file of [paths.databaseFile, `${paths.databaseFile}-wal`, `${paths.databaseFile}-shm`, paths.stateFile]) {
      rmSync(file, { force: true });
    }
    try {
      rmdirSync(paths.metricsDirectory);
    } catch {
      // Preserve the owned directory if another local file is present.
    }
  }

  private toNullable(value: string | number | typeof UNAVAILABLE): string | number | null {
    return value === UNAVAILABLE ? null : value;
  }

  private fromNullable(value: string | null): Attribution {
    return value === null ? UNAVAILABLE : value;
  }
}
