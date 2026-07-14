import fs from "node:fs";
import path from "node:path";

import { SUPPORTED_AGENTS, normalizeStoredModel, type SupportedAgent } from "./model-profiles-core.js";
import { getOpenCodeBaseDir } from "./model-profiles-config.js";

function asPlainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function readOpenCodeAgentModels(
  env: NodeJS.ProcessEnv = process.env,
): Partial<Record<SupportedAgent, string>> {
  const opencodeConfigPath = path.join(getOpenCodeBaseDir(env), "opencode.json");
  if (!fs.existsSync(opencodeConfigPath)) {
    return {};
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(opencodeConfigPath, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Warning: could not read OpenCode config at ${opencodeConfigPath} (${message}); creating profile without host assignment seed.`,
    );
    return {};
  }

  if (!isPlainObject(raw)) {
    console.warn(
      `Warning: OpenCode config at ${opencodeConfigPath} is not an object; creating profile without host assignment seed.`,
    );
    return {};
  }

  const agents = asPlainObject(raw.agent);
  const snapshot: Partial<Record<SupportedAgent, string>> = {};

  for (const agentName of SUPPORTED_AGENTS) {
    const model = normalizeStoredModel(asPlainObject(agents[agentName]).model);
    if (model && model !== "inherit") {
      snapshot[agentName] = model;
    }
  }

  return snapshot;
}
