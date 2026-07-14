import { spawnSync, type SpawnSyncOptions, type SpawnSyncReturns } from "node:child_process";
import path from "node:path";

function quoteCmdArgument(argument: string): string {
  if (!/[\s&%!^]/u.test(argument)) return argument;
  return `"${argument.replaceAll('"', '\\"')}"`;
}

export function runPnpm(
  args: string[],
  options: SpawnSyncOptions = {},
): SpawnSyncReturns<string | Buffer> {
  if (process.platform !== "win32") return spawnSync("pnpm", args, options);

  return spawnSync(
    "cmd.exe",
    ["/d", "/v:off", "/c", `pnpm.cmd ${args.map(quoteCmdArgument).join(" ")}`],
    options,
  );
}

export function getTarCommand(): string {
  if (process.platform !== "win32") return "tar";
  return path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
}
