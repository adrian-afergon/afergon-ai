import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getOpenCodeBaseDir } from "./model-profiles-config.js";
import { SUPPORTED_MODEL_TOOLS, type SupportedModelTool } from "./model-profiles-core.js";

export interface ModelProfileToolInstallationOptions {
  /** Retained for callers that also load project-scoped status; detection itself is user-scoped. */
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

function getUserHomeDir(env: NodeJS.ProcessEnv): string | undefined {
  const configuredHome = process.platform === "win32"
    ? env.USERPROFILE || env.HOME || (env.HOMEDRIVE && env.HOMEPATH ? path.join(env.HOMEDRIVE, env.HOMEPATH) : undefined)
    : env.HOME || env.USERPROFILE;

  if (configuredHome?.trim()) {
    return path.resolve(configuredHome);
  }

  try {
    return path.resolve(os.homedir());
  } catch {
    return undefined;
  }
}

function resolveUserPath(value: string | undefined, env: NodeJS.ProcessEnv): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const home = getUserHomeDir(env);
  if (trimmed === "~") {
    return home;
  }
  if (trimmed.startsWith("~/") || trimmed.startsWith("~\\")) {
    return home ? path.join(home, trimmed.slice(2)) : undefined;
  }

  return path.resolve(trimmed);
}

function isDirectory(filePath: string | undefined): boolean {
  if (!filePath) {
    return false;
  }

  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function isFile(filePath: string | undefined): boolean {
  if (!filePath) {
    return false;
  }

  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function isPiDetected(env: NodeJS.ProcessEnv): boolean {
  const agentDir = resolveUserPath(env.PI_CODING_AGENT_DIR, env) ?? (() => {
    const home = getUserHomeDir(env);
    return home ? path.join(home, ".pi", "agent") : undefined;
  })();

  return isDirectory(agentDir);
}

function isClaudeDetected(env: NodeJS.ProcessEnv): boolean {
  const configDir = resolveUserPath(env.CLAUDE_CONFIG_DIR, env) ?? (() => {
    const home = getUserHomeDir(env);
    return home ? path.join(home, ".claude") : undefined;
  })();

  return isDirectory(configDir);
}

function isOpenCodeDetected(env: NodeJS.ProcessEnv): boolean {
  if (isDirectory(getOpenCodeBaseDir(env)) || isDirectory(resolveUserPath(env.OPENCODE_CONFIG_DIR, env))) {
    return true;
  }

  return isFile(resolveUserPath(env.OPENCODE_CONFIG, env));
}

export function isModelProfileToolInstalled(
  tool: SupportedModelTool,
  { env = process.env }: ModelProfileToolInstallationOptions = {},
): boolean {
  if (tool === "pi") {
    return isPiDetected(env);
  }
  if (tool === "claude") {
    return isClaudeDetected(env);
  }

  return isOpenCodeDetected(env);
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
