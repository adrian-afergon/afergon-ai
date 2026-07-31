import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { V1EventParser } from "../scripts/lib/usage-metrics/afergon-v1.js";
import { MetricsPathResolver } from "../scripts/lib/usage-metrics/paths.js";
import { SqliteMetricsStore } from "../scripts/lib/usage-metrics/sqlite.js";

const parser = new V1EventParser();
const temporaryRoots: string[] = [];

function createStore() {
  const root = mkdtempSync(join(tmpdir(), "afergon-metrics-"));
  temporaryRoots.push(root);
  const paths = new MetricsPathResolver({ AFERGON_AI_CONFIG_DIR: join(root, "config") });
  return { paths, store: new SqliteMetricsStore(paths) };
}

function event(eventId: string, outcome: string = "useful") {
  return parser.parse({
    source: "afergon-ai",
    version: 1,
    eventId,
    occurredAt: "2026-07-16T08:00:00.000Z",
    workflowRunId: "run-456",
    phase: "implement",
    agent: "afg-implement",
    outcome,
  });
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("SQLite metrics lifecycle", () => {
  it("is disabled by default without creating local files", () => {
    const { paths, store } = createStore();

    expect(store.status()).toEqual({ enabled: false });
    expect(() => store.insert([event("event-1")])).toThrow("metrics:");
    expect(existsSync(paths.resolve().metricsDirectory)).toBe(false);
  });

  it("enables, migrates, and stores normalized records", () => {
    const { paths, store } = createStore();

    store.enable();
    store.insert([event("event-1")]);

    expect(store.status()).toEqual({ enabled: true });
    expect(existsSync(paths.resolve().databaseFile)).toBe(true);
    expect(store.all()).toHaveLength(1);
  });

  it("rolls back a batch when any insert fails", () => {
    const { store } = createStore();
    store.enable();
    store.insert([event("event-1")]);

    expect(() => store.insert([event("event-2"), event("event-1")])).toThrow();
    expect(store.all().map((record) => record.id)).toEqual(["event-1"]);
  });

  it("requires confirmation and preserves unrelated configuration on clear", () => {
    const { paths, store } = createStore();
    const resolved = paths.resolve();
    mkdirSync(resolved.configDirectory, { recursive: true });
    writeFileSync(join(resolved.configDirectory, "unrelated.json"), "{}");
    store.enable();
    store.insert([event("event-1")]);

    expect(() => store.clearConfirmed(false)).toThrow("clear:");
    expect(store.all()).toHaveLength(1);

    store.clearConfirmed(true);
    expect(store.status()).toEqual({ enabled: false });
    expect(existsSync(join(resolved.configDirectory, "unrelated.json"))).toBe(true);
    expect(existsSync(resolved.metricsDirectory)).toBe(false);
  });
});
