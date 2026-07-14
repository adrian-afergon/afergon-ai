import { type SpawnSyncOptions, type SpawnSyncReturns } from "node:child_process";

// tsconfig.build.json is relative to cwd and intentionally stays literal. Quoting
// its CMD expansion makes pnpm.cmd forward the quote characters to tsc on Windows.
// CMD strips quotes that are introduced by the expanded environment values.
const windowsCompilerCommand = "pnpm.cmd exec tsc -p tsconfig.build.json --outDir %AFERGON_AI_TSCONFIG_OUTDIR% --tsBuildInfoFile %AFERGON_AI_TSBUILDINFO%";
const windowsCompilerCommandWithInjectedFailure = `${windowsCompilerCommand} --afergon-ai-test-invalid-compiler-option`;

export interface CompilerBootstrapInvocation {
  command: string;
  arguments: string[];
  options: SpawnSyncOptions;
  description: string;
}

export function createCompilerBootstrapInvocation({
  platform,
  repoRoot,
  stagingRoot,
  injectCompilerFailure = false,
}: {
  platform: NodeJS.Platform;
  repoRoot: string;
  stagingRoot: string;
  injectCompilerFailure?: boolean;
}): CompilerBootstrapInvocation {
  const compilerArguments = [
    "exec",
    "tsc",
    "-p",
    "tsconfig.build.json",
    "--outDir",
    stagingRoot,
    "--tsBuildInfoFile",
    `${stagingRoot}/.tsbuildinfo`,
  ];
  if (injectCompilerFailure) compilerArguments.push("--afergon-ai-test-invalid-compiler-option");

  if (platform === "win32") {
    // cmd.exe is required for pnpm.cmd. Keep its command text static: filesystem
    // paths travel through the environment so they cannot be parsed as CMD syntax.
    return {
      command: "cmd.exe",
      arguments: [
        "/d",
        "/v:off",
        "/s",
        "/c",
        injectCompilerFailure ? windowsCompilerCommandWithInjectedFailure : windowsCompilerCommand,
      ],
      options: {
        cwd: repoRoot,
        env: {
          ...process.env,
          AFERGON_AI_TSCONFIG_OUTDIR: `"${stagingRoot}"`,
          AFERGON_AI_TSBUILDINFO: `"${stagingRoot}/.tsbuildinfo"`,
        },
        stdio: "inherit",
      },
      description: "cmd.exe /d /v:off /s /c pnpm.cmd exec tsc",
    };
  }

  return {
    command: "pnpm",
    arguments: compilerArguments,
    options: { cwd: repoRoot, stdio: "inherit" },
    description: "pnpm exec tsc",
  };
}

export function assertCompilerBootstrapSucceeded(
  result: Pick<SpawnSyncReturns<Buffer>, "error" | "signal" | "status">,
  description: string,
) {
  if (result.error) {
    throw new Error(
      `Unable to start the TypeScript compiler bootstrap (${description}). Ensure pnpm is installed and available on PATH. Spawn error: ${result.error.message}`,
    );
  }

  if (result.status !== 0) {
    const outcome = result.signal ? `signal ${result.signal}` : `exit code ${result.status ?? "unknown"}`;
    throw new Error(`TypeScript compiler bootstrap failed with ${outcome} (${description}). Run \`pnpm exec tsc -p tsconfig.build.json\` to reproduce.`);
  }
}
