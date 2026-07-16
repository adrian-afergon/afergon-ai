import path from "node:path";
import { fileURLToPath } from "node:url";

import { getConfigDir } from "./model-profiles-config.js";
import {
  normalizeModelProfileTool,
  normalizeProfileName,
  normalizeRefreshResult,
  SUPPORTED_AGENTS,
  type RefreshResult,
  type SupportedModelTool,
} from "./model-profiles-core.js";

const DEFAULT_OPENCODE_REFRESH_TIMEOUT_MS = 10000;

type ProfileStore = {
  profiles: Record<string, Record<string, unknown>>;
};

type LegacyProfileConfig = {
  models: ProfileStore;
};

export function isDirectExecution(argv: readonly string[] = process.argv, moduleUrl = import.meta.url): boolean {
  return Boolean(argv[1]) && path.resolve(argv[1]!) === fileURLToPath(moduleUrl);
}

export function getOpenCodeRefreshTimeoutMs(env: NodeJS.ProcessEnv = process.env): number {
  const rawTimeout = env.AFERGON_AI_OPENCODE_REFRESH_TIMEOUT_MS;
  if (!rawTimeout) {
    return DEFAULT_OPENCODE_REFRESH_TIMEOUT_MS;
  }

  const timeout = Number.parseInt(rawTimeout, 10);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_OPENCODE_REFRESH_TIMEOUT_MS;
}

export function createRegistrationEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return {
    ...env,
    AFERGON_AI_CONFIG_DIR: getConfigDir(env),
    AFG_OPENCODE_REGISTER_NONINTERACTIVE: "1",
    ...(env.XDG_CONFIG_HOME ? { XDG_CONFIG_HOME: path.resolve(env.XDG_CONFIG_HOME) } : {}),
  };
}

export function createRefreshResult(result?: Parameters<typeof normalizeRefreshResult>[0]): RefreshResult | undefined {
  return normalizeRefreshResult(result);
}

export function formatUnknownModelError(model: string, provider: string, suggestions: readonly string[]): string {
  const lines = [`Requested model '${model}' is not available from provider '${provider}'.`];
  if (suggestions.length > 0) {
    lines.push(`Did you mean: ${suggestions.join(", ")}?`);
  }
  lines.push("If you really need to save it anyway, rerun with '--allow-unknown'.");
  return lines.join(" ");
}

export function formatEffective(entry: { effective?: string | null }): string {
  return entry.effective ?? "(runtime default)";
}

export function getProfileOrThrow(storeOrConfig: ProfileStore | LegacyProfileConfig, profileNameInput: unknown): { profileName: string; profile: Record<string, unknown> } {
  const store = "models" in storeOrConfig ? storeOrConfig.models : storeOrConfig;
  const profileName = normalizeProfileName(profileNameInput);
  const profile = store.profiles[profileName];
  if (!profile) {
    const available = Object.keys(store.profiles).sort();
    const suffix = available.length > 0 ? ` Available profiles: ${available.join(", ")}` : " No profiles exist yet.";
    throw new Error(`Unknown profile '${profileName}'.${suffix}`);
  }

  return { profileName, profile };
}

export function parseModelsToolArguments(args: readonly string[]): { tool: SupportedModelTool; args: string[] } {
  let tool: SupportedModelTool = "opencode";
  let foundTool = false;
  const remaining: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument !== "--tool") {
      remaining.push(argument!);
      continue;
    }

    if (foundTool || index + 1 >= args.length) {
      throw new Error("Usage: afergon-ai models [--tool <pi|claude|opencode>] <command>");
    }
    tool = normalizeModelProfileTool(args[index + 1]);
    foundTool = true;
    index += 1;
  }

  return { tool, args: remaining };
}

export function parseSetCommandArguments(args: readonly string[]): { allowUnknown: boolean; agent: string; model: string } {
  let allowUnknown = false;
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === "--allow-unknown") {
      allowUnknown = true;
      continue;
    }
    positional.push(arg);
  }

  if (positional.length !== 2) {
    throw new Error("Usage: afergon-ai models set [--allow-unknown] <agent> <model|inherit>");
  }

  return { allowUnknown, agent: positional[0]!, model: positional[1]! };
}

export function printHelp(log: (line: string) => void = console.log): void {
  log("afergon-ai models — manage afergon-ai model profiles");
  log("");
  log("Usage:");
  log("  afergon-ai models");
  log("  afergon-ai models [--tool <pi|claude|opencode>] show [profile]");
  log("  afergon-ai models [--tool <pi|claude|opencode>] list");
  log("  afergon-ai models [--tool <pi|claude|opencode>] switch <profile>");
  log("  afergon-ai models [--tool <pi|claude|opencode>] set [--allow-unknown] <agent> <model|inherit>");
  log("  afergon-ai models [--tool <pi|claude|opencode>] profile <show|create|delete> <name>");
  log("");
  log(`Supported agents: ${SUPPORTED_AGENTS.join(", ")}`);
  log("Aliases: orchestrator, main, debate, breakdown, specify, plannify, implement, review, design");
  log("");
  log("Notes:");
  log("  - Missing agent assignments inherit from afergon-ai.");
  log("  - 'inherit' means defer to afergon-ai; if that is also unset, runtime defaults are preserved.");
  log("  - Omit --tool to preserve the existing OpenCode default.");
  log("  - OpenCode model strings use provider/model format and are validated with 'opencode models <provider>' when available.");
  log("  - Pi and Claude Code accept non-empty manual model strings until their model registries are available.");
  log("  - Use '--allow-unknown' to save an unlisted or custom OpenCode model after reviewing the warning.");
  log("  - Changes refresh compatible host config on disk when supported; Pi and Claude Code profiles are stored only for now.");
  log("  - Live hot-swap is not guaranteed for already-running sessions.");
}
