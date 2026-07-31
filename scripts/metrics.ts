#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";

import { V1EventParser } from "./lib/usage-metrics/afergon-v1.js";
import {
  ReportQuery,
  type ReportDimension,
  type ReportFilterValue,
  UNAVAILABLE,
} from "./lib/usage-metrics/domain.js";
import { LocalMetricsExportWriter, type MetricsExportFormat } from "./lib/usage-metrics/export.js";
import { MetricsPathResolver } from "./lib/usage-metrics/paths.js";
import { EfficiencyReportService } from "./lib/usage-metrics/reporting.js";
import { SqliteMetricsStore } from "./lib/usage-metrics/sqlite.js";
import { ImportMetricsUseCase } from "./lib/usage-metrics/use-cases.js";

const USAGE = "Usage: afergon-ai metrics <enable|status|import|report|export|clear>";

export interface MetricsExecutionOptions {
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
}

export interface MetricsCommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export function executeMetrics(argv: readonly string[], options: MetricsExecutionOptions = {}): MetricsCommandResult {
  try {
    const cwd = options.cwd ?? process.cwd();
    const env = options.env ?? process.env;
    const store = new SqliteMetricsStore(new MetricsPathResolver(env));
    const parser = new V1EventParser();
    const [subcommand = "", ...args] = argv;

    switch (subcommand) {
      case "enable":
        requireNoArguments(subcommand, args);
        store.enable();
        return success("Metrics enabled.\n");
      case "status":
        requireNoArguments(subcommand, args);
        return success(`${JSON.stringify(store.status())}\n`);
      case "import":
        return importEvents(args, cwd, parser, store);
      case "report":
        return reportMetrics(args, store);
      case "export":
        return exportMetrics(args, cwd, store);
      case "clear":
        return clearMetrics(args, store);
      default:
        throw new Error(`${subcommand ? `Unknown metrics subcommand: ${subcommand}` : USAGE}\n${USAGE}`);
    }
  } catch (error) {
    return { exitCode: 1, stdout: "", stderr: `${error instanceof Error ? error.message : String(error)}\n` };
  }
}

function importEvents(args: readonly string[], cwd: string, parser: V1EventParser, store: SqliteMetricsStore): MetricsCommandResult {
  if (args.length !== 1) throw new Error("Usage: afergon-ai metrics import <event-file>");
  const parsed = JSON.parse(readFileSync(path.resolve(cwd, args[0]), "utf8")) as unknown;
  const inputs = Array.isArray(parsed) ? parsed : [parsed];
  const imported = new ImportMetricsUseCase(parser, store, store).execute(inputs);
  return success(`Imported ${imported} event(s).\n`);
}

function reportMetrics(args: readonly string[], store: SqliteMetricsStore): MetricsCommandResult {
  const { groupBy, filters } = parseReportArguments(args);
  const report = new EfficiencyReportService(store).generate(ReportQuery.create(groupBy, filters));
  return success(`${JSON.stringify(report, null, 2)}\n`);
}

function exportMetrics(args: readonly string[], cwd: string, store: SqliteMetricsStore): MetricsCommandResult {
  let format: MetricsExportFormat | undefined;
  let output: string | undefined;
  const reportArguments: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--format") format = args[++index] as MetricsExportFormat;
    else if (argument === "--output") output = args[++index];
    else if (argument === "--group-by" || argument === "--filter") {
      reportArguments.push(argument, args[++index] as string);
    }
    else throw new Error(`Unknown export argument: ${argument}`);
  }
  if ((format !== "json" && format !== "csv") || !output) throw new Error("Usage: afergon-ai metrics export --format json|csv --output <path> [--group-by <dimension>] [--filter <dimension=value>]...");
  if (/^[a-z][a-z\d+.-]*:/i.test(output)) throw new Error("output: only local filesystem paths are supported");
  const { groupBy, filters } = parseReportArguments(reportArguments);
  const report = new EfficiencyReportService(store).generate(ReportQuery.create(groupBy, filters));
  new LocalMetricsExportWriter().write(format, path.resolve(cwd, output), groupBy, report.rows);
  return success(`Exported metrics to ${path.resolve(cwd, output)}.\n`);
}

function clearMetrics(args: readonly string[], store: SqliteMetricsStore): MetricsCommandResult {
  store.clearConfirmed(args.length === 1 && args[0] === "--confirm");
  return success("Metrics cleared.\n");
}

function parseReportArguments(args: readonly string[]): { groupBy: ReportDimension; filters: Partial<Record<ReportDimension, ReportFilterValue>> } {
  let groupBy: ReportDimension = "outcome";
  const filters: Partial<Record<ReportDimension, ReportFilterValue>> = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--group-by") groupBy = args[++index] as ReportDimension;
    else if (argument === "--filter") addFilter(filters, args[++index]);
    else throw new Error(`Unknown report argument: ${argument}`);
  }
  return { groupBy, filters };
}

function addFilter(filters: Partial<Record<ReportDimension, ReportFilterValue>>, expression: string | undefined): void {
  const separator = expression?.indexOf("=") ?? -1;
  if (separator <= 0) throw new Error("Report filters must use dimension=value");
  const dimension = expression!.slice(0, separator) as ReportDimension;
  const rawValue = expression!.slice(separator + 1);
  if (dimension === "reviewCycle") {
    const value = rawValue === UNAVAILABLE ? UNAVAILABLE : Number(rawValue);
    if (value !== UNAVAILABLE && (!Number.isInteger(value) || value < 0)) throw new Error("reviewCycle filters must be non-negative integers or unavailable");
    filters[dimension] = value;
    return;
  }
  filters[dimension] = rawValue;
}

function requireNoArguments(command: string, args: readonly string[]): void {
  if (args.length > 0) throw new Error(`Usage: afergon-ai metrics ${command}`);
}

function success(stdout: string): MetricsCommandResult {
  return { exitCode: 0, stdout, stderr: "" };
}

export function main(argv: readonly string[] = process.argv.slice(2)): void {
  const result = executeMetrics(argv);
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}

if (process.argv[1] && path.basename(process.argv[1]) === "metrics.js") main();
