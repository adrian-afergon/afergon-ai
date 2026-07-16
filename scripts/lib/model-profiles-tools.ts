import fs from "node:fs";
import path from "node:path";

import { getOpenCodeBaseDir } from "./model-profiles-config.js";
import { SUPPORTED_MODEL_TOOLS, type SupportedModelTool } from "./model-profiles-core.js";

export interface ModelProfileToolInstallationOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export function isModelProfileToolInstalled(
  tool: SupportedModelTool,
  { cwd = process.cwd(), env = process.env }: ModelProfileToolInstallationOptions = {},
): boolean {
  if (tool === "pi") {
    return fs.existsSync(path.join(cwd, ".pi", "APPEND_SYSTEM.md"));
  }
  if (tool === "claude") {
    return fs.existsSync(path.join(cwd, "CLAUDE.md"));
  }

  const baseDir = getOpenCodeBaseDir(env);
  return fs.existsSync(path.join(baseDir, "opencode.json")) &&
    fs.existsSync(path.join(baseDir, "agents", "afergon-ai.md"));
}

export function getInstalledModelProfileTools(
  options: ModelProfileToolInstallationOptions = {},
): SupportedModelTool[] {
  return SUPPORTED_MODEL_TOOLS.filter((tool) => isModelProfileToolInstalled(tool, options));
}

export function getModelProfileProjectionDetail(tool: SupportedModelTool): string {
  if (tool === "opencode") {
    return "The active profile is projected to managed OpenCode agents on disk.";
  }

  return `${tool === "pi" ? "Pi" : "Claude Code"} profiles are stored in afergon-ai only; host projection is not available yet.`;
}
