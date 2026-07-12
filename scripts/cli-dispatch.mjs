#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatHelp, resolveDispatchPlan } from "./lib/cli-dispatch-core.mjs";

export { formatHelp, resolveDispatchPlan } from "./lib/cli-dispatch-core.mjs";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveExecutionOptions(packageRootOrOptions = PACKAGE_ROOT) {
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

function buildBashExecution(scriptPath, forwardedArgs, cwd) {
  return {
    command: "bash",
    args: [scriptPath, ...forwardedArgs],
    cwd,
  };
}

function buildPowerShellExecution(scriptPath, forwardedArgs, cwd) {
  return {
    command: "powershell.exe",
    args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, ...forwardedArgs],
    cwd,
  };
}

export function buildExecution(plan, packageRootOrOptions = PACKAGE_ROOT) {
  const { packageRoot, cwd, platform } = resolveExecutionOptions(packageRootOrOptions);

  switch (plan.kind) {
    case "command":
      switch (plan.command) {
        case "init":
          return platform === "win32"
            ? buildPowerShellExecution(path.join(packageRoot, "scripts/init-project.ps1"), plan.forwardedArgs, cwd)
            : buildBashExecution(path.join(packageRoot, "scripts/init-project.sh"), plan.forwardedArgs, cwd);
        case "doctor":
          return buildBashExecution(path.join(packageRoot, "scripts/verify-install.sh"), plan.forwardedArgs, cwd);
        case "update":
          return platform === "win32"
            ? buildPowerShellExecution(path.join(packageRoot, "scripts/update.ps1"), plan.forwardedArgs, cwd)
            : buildBashExecution(path.join(packageRoot, "scripts/update.sh"), plan.forwardedArgs, cwd);
        case "models":
          return {
            command: process.execPath,
            args: [path.join(packageRoot, "scripts/models.mjs"), ...plan.forwardedArgs],
            cwd,
          };
        default:
          throw new Error(`Unsupported explicit command '${plan.command}'.`);
      }
    case "tui":
      return {
        command: process.execPath,
        args: [path.join(packageRoot, "scripts/tui.mjs"), ...plan.forwardedArgs],
        cwd,
      };
    default:
      throw new Error(`Cannot build execution for plan '${plan.kind}'.`);
  }
}

function isInteractiveTTY(stdin = process.stdin, stdout = process.stdout, env = process.env) {
  if (env.AFERGON_AI_FORCE_TTY === "1") {
    return true;
  }

  if (env.AFERGON_AI_FORCE_TTY === "0") {
    return false;
  }

  return Boolean(stdin.isTTY && stdout.isTTY);
}

function isCIEnvironment(env = process.env) {
  return env.CI === "1" || env.CI === "true";
}

function run(plan) {
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
  const result = spawnSync(execution.command, execution.args, {
    cwd: execution.cwd ?? process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
}

export function main(argv = process.argv.slice(2), env = process.env) {
  const plan = resolveDispatchPlan({
    argv,
    isInteractiveTTY: isInteractiveTTY(process.stdin, process.stdout, env),
    isCI: isCIEnvironment(env),
  });

  run(plan);
}

if (process.argv[1] && path.basename(process.argv[1]) === "cli-dispatch.mjs") {
  main();
}
