import path from "node:path";
import { fileURLToPath } from "node:url";

import { getConfigDir } from "./model-profiles-config.mjs";
import { normalizeProfileName, normalizeRefreshResult, SUPPORTED_AGENTS } from "./model-profiles-core.mjs";

const DEFAULT_OPENCODE_REFRESH_TIMEOUT_MS = 10000;

export function isDirectExecution(argv = process.argv, moduleUrl = import.meta.url) {
  return Boolean(argv[1]) && path.resolve(argv[1]) === fileURLToPath(moduleUrl);
}

export function getOpenCodeRefreshTimeoutMs(env = process.env) {
  const rawTimeout = env.AFERGON_AI_OPENCODE_REFRESH_TIMEOUT_MS;
  if (!rawTimeout) {
    return DEFAULT_OPENCODE_REFRESH_TIMEOUT_MS;
  }

  const timeout = Number.parseInt(rawTimeout, 10);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_OPENCODE_REFRESH_TIMEOUT_MS;
}

export function createRegistrationEnv(env = process.env) {
  return {
    ...env,
    AFERGON_AI_CONFIG_DIR: getConfigDir(env),
    AFG_OPENCODE_REGISTER_NONINTERACTIVE: "1",
    ...(env.XDG_CONFIG_HOME ? { XDG_CONFIG_HOME: path.resolve(env.XDG_CONFIG_HOME) } : {}),
  };
}

export function createRefreshResult(result) {
  return normalizeRefreshResult(result);
}

export function formatUnknownModelError(model, provider, suggestions) {
  const lines = [`Requested model '${model}' is not available from provider '${provider}'.`];
  if (suggestions.length > 0) {
    lines.push(`Did you mean: ${suggestions.join(", ")}?`);
  }
  lines.push("If you really need to save it anyway, rerun with '--allow-unknown'.");
  return lines.join(" ");
}

export function formatEffective(entry) {
  return entry.effective ?? "(runtime default)";
}

export function getProfileOrThrow(config, profileNameInput) {
  const profileName = normalizeProfileName(profileNameInput);
  const profile = config.models.profiles[profileName];
  if (!profile) {
    const available = Object.keys(config.models.profiles).sort();
    const suffix = available.length > 0 ? ` Available profiles: ${available.join(", ")}` : " No profiles exist yet.";
    throw new Error(`Unknown profile '${profileName}'.${suffix}`);
  }

  return { profileName, profile };
}

export function parseSetCommandArguments(args) {
  let allowUnknown = false;
  const positional = [];

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

  return { allowUnknown, agent: positional[0], model: positional[1] };
}

export function printHelp(log = console.log) {
  log("afergon-ai models — manage afergon-ai model profiles");
  log("");
  log("Usage:");
  log("  afergon-ai models");
  log("  afergon-ai models show");
  log("  afergon-ai models show <profile>");
  log("  afergon-ai models list");
  log("  afergon-ai models switch <profile>");
  log("  afergon-ai models set [--allow-unknown] <agent> <model|inherit>");
  log("  afergon-ai models profile show <name>");
  log("  afergon-ai models profile create <name>");
  log("  afergon-ai models profile delete <name>");
  log("");
  log(`Supported agents: ${SUPPORTED_AGENTS.join(", ")}`);
  log("Aliases: orchestrator, main, debate, breakdown, specify, plannify, implement, review, design");
  log("");
  log("Notes:");
  log("  - Missing agent assignments inherit from afergon-ai.");
  log("  - 'inherit' means defer to afergon-ai; if that is also unset, runtime defaults are preserved.");
  log("  - Concrete model strings should use provider/model format, for example 'openai/gpt-5.5'.");
  log("  - Concrete models are validated with 'opencode models <provider>' when available.");
  log("  - Use '--allow-unknown' to save an unlisted or custom concrete model after reviewing the warning.");
  log("  - Changes update afergon-ai-owned config and refresh compatible host config on disk when supported.");
  log("  - Live hot-swap is not guaranteed for already-running sessions.");
}
