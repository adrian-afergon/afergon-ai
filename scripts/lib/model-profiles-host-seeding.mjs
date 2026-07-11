import fs from "node:fs";
import path from "node:path";

import { SUPPORTED_AGENTS, normalizeStoredModel } from "./model-profiles-core.mjs";
import { getOpenCodeBaseDir } from "./model-profiles-config.mjs";

function asPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function readOpenCodeAgentModels(env = process.env) {
  const opencodeConfigPath = path.join(getOpenCodeBaseDir(env), "opencode.json");
  if (!fs.existsSync(opencodeConfigPath)) {
    return {};
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(opencodeConfigPath, "utf8"));
  } catch (error) {
    console.warn(
      `Warning: could not read OpenCode config at ${opencodeConfigPath} (${error.message}); creating profile without host assignment seed.`,
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
  const snapshot = {};

  for (const agentName of SUPPORTED_AGENTS) {
    const model = normalizeStoredModel(asPlainObject(agents[agentName]).model);
    if (model && model !== "inherit") {
      snapshot[agentName] = model;
    }
  }

  return snapshot;
}
