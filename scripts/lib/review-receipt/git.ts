import { execFileSync } from "node:child_process";

const trustedGitExecutable = "/usr/bin/git";

const blocked = new Set([
  "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_OBJECT_DIRECTORY",
  "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_CEILING_DIRECTORIES", "GIT_DISCOVERY_ACROSS_FILESYSTEM",
  "GIT_IMPLICIT_WORK_TREE", "GIT_CONFIG_PARAMETERS", "GIT_CONFIG_GLOBAL", "GIT_CONFIG_SYSTEM",
  "GIT_CONFIG_NOSYSTEM", "GIT_CONFIG_COUNT", "GIT_NAMESPACE", "GIT_SHALLOW_FILE", "GIT_GRAFT_FILE",
  "GIT_REPLACE_REF_BASE", "GIT_NO_REPLACE_OBJECTS",
]);

export class GitReceiptError extends Error {
  constructor(readonly reason: string) { super(reason); }
}

export function sanitizeGitEnvironment(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const environment = { ...process.env, ...overrides };
  for (const key of Object.keys(environment)) {
    if (blocked.has(key) || /^GIT_CONFIG_(KEY|VALUE)_/.test(key)) delete environment[key];
  }
  return environment;
}

export function runGit(cwd: string, args: string[], overrides?: NodeJS.ProcessEnv): string {
  return runGitBytes(cwd, args, overrides).toString("utf8");
}

export function runGitBytes(cwd: string, args: string[], overrides?: NodeJS.ProcessEnv): Buffer {
  try {
    return execFileSync(trustedGitExecutable, args, {
      cwd, encoding: "buffer", env: sanitizeGitEnvironment(overrides), shell: false, timeout: 5_000, maxBuffer: 1_048_576, stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new GitReceiptError("git-unavailable");
  }
}
