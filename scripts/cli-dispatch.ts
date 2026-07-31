#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatHelp, resolveDispatchPlan, type DispatchPlan } from "./lib/cli-dispatch-core.js";

export { formatHelp, resolveDispatchPlan } from "./lib/cli-dispatch-core.js";

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

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveExecutionOptions(packageRootOrOptions: string | ExecutionOptions = PACKAGE_ROOT): Required<ExecutionOptions> {
  if (typeof packageRootOrOptions === "string") {
    return {
      packageRoot: packageRootOrOptions,
      cwd: process.cwd(),
      platform: process.platform,
    };
  }

  return {
    packageRoot: packageRootOrOptions.packageRoot ?? PACKAGE_ROOT,
    cwd: packageRootOrOptions.cwd ?? process.cwd(),
    platform: packageRootOrOptions.platform ?? process.platform,
  };
}

function buildBashExecution(scriptPath: string, forwardedArgs: string[], cwd: string): DispatchExecution {
  return { command: "bash", args: [scriptPath, ...forwardedArgs], cwd };
}

function buildPowerShellExecution(scriptPath: string, forwardedArgs: string[], cwd: string): DispatchExecution {
  return {
    command: "powershell.exe",
    args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, ...forwardedArgs],
    cwd,
  };
}

export function buildExecution(
  plan: Extract<DispatchPlan, { kind: "command" | "tui" }>,
  packageRootOrOptions: string | ExecutionOptions = PACKAGE_ROOT,
): DispatchExecution {
  const { packageRoot, cwd, platform } = resolveExecutionOptions(packageRootOrOptions);

  switch (plan.kind) {
    case "command":
      switch (plan.command) {
        case "init":
          return platform === "win32"
            ? buildPowerShellExecution(path.join(packageRoot, "scripts/init-project.ps1"), plan.forwardedArgs, cwd)
            : buildBashExecution(path.join(packageRoot, "scripts/init-project.sh"), plan.forwardedArgs, cwd);
        case "doctor":
          return platform === "win32"
            ? buildPowerShellExecution(path.join(packageRoot, "scripts/verify-install.ps1"), plan.forwardedArgs, cwd)
            : buildBashExecution(path.join(packageRoot, "scripts/verify-install.sh"), plan.forwardedArgs, cwd);
        case "update":
          return platform === "win32"
            ? buildPowerShellExecution(path.join(packageRoot, "scripts/update.ps1"), plan.forwardedArgs, cwd)
            : buildBashExecution(path.join(packageRoot, "scripts/update.sh"), plan.forwardedArgs, cwd);
        case "models":
          return { command: process.execPath, args: [path.join(packageRoot, "scripts/models.js"), ...plan.forwardedArgs], cwd };
        case "metrics":
          return { command: process.execPath, args: [path.join(packageRoot, "scripts/metrics.js"), ...plan.forwardedArgs], cwd };
      }
    case "tui":
      return { command: process.execPath, args: [path.join(packageRoot, "scripts/tui.js"), ...plan.forwardedArgs], cwd };
  }
}

function isInteractiveTTY(stdin: NodeJS.ReadStream = process.stdin, stdout: NodeJS.WriteStream = process.stdout, env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.AFERGON_AI_FORCE_TTY === "1") return true;
  if (env.AFERGON_AI_FORCE_TTY === "0") return false;
  return Boolean(stdin.isTTY && stdout.isTTY);
}

function isCIEnvironment(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.CI === "1" || env.CI === "true";
}

function run(plan: DispatchPlan): void {
  if (plan.kind === "help") {
    process.stdout.write(formatHelp());
    process.exitCode = plan.exitCode;
    return;
  }

  if (plan.kind === "error") {
    process.stderr.write(`${plan.message}\n`);
    process.exitCode = plan.exitCode;
    return;
  }

  const execution = buildExecution(plan);
  const result = spawnSync(execution.command, execution.args, { cwd: execution.cwd, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

export function main(argv: readonly string[] = process.argv.slice(2), env: NodeJS.ProcessEnv = process.env): void {
  const plan = resolveDispatchPlan({ argv, isInteractiveTTY: isInteractiveTTY(process.stdin, process.stdout, env), isCI: isCIEnvironment(env) });
  run(plan);
}

if (process.argv[1] && path.basename(process.argv[1]) === "cli-dispatch.js") {
  main();
}
