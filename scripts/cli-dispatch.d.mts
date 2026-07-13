export { formatHelp, resolveDispatchPlan } from "./lib/cli-dispatch-core.mjs";

import type { DispatchPlan } from "./lib/cli-dispatch-core.mjs";

export type DispatchExecution = {
  command: string;
  args: string[];
  cwd: string;
};

export type ExecutionOptions = {
  packageRoot?: string;
  cwd?: string;
  platform?: NodeJS.Platform;
};

export function buildExecution(
  plan: Extract<DispatchPlan, { kind: "command" | "tui" }>,
  packageRootOrOptions?: string | ExecutionOptions,
): DispatchExecution;

export function main(argv?: readonly string[], env?: NodeJS.ProcessEnv): void;
