import { spawn } from "node:child_process";

const DEFAULT_MAX_STREAM_BYTES = 16 * 1024;
const DEFAULT_MAX_STREAM_LINES = 200;

type SpawnChunk = string | Buffer;

interface StreamCollector {
  text: string;
  bytes: number;
  lines: number;
  truncated: boolean;
  append(chunk: SpawnChunk): void;
}

interface SpawnResultBase {
  readonly stdout: string;
  readonly stderr: string;
  readonly output: string;
}

interface SpawnCloseDetails {
  readonly ok: boolean;
  readonly exitCode: number | null;
  readonly timedOut: boolean;
  readonly stdoutTruncated: boolean;
  readonly stderrTruncated: boolean;
}

interface SpawnErrorDetails {
  readonly ok: false;
  readonly exitCode: null;
  readonly timedOut: false;
  readonly error: string;
}

interface SpawnCloseResult extends SpawnResultBase, SpawnCloseDetails {}

interface SpawnErrorResult extends SpawnResultBase, SpawnErrorDetails {}

export type ActionCommandResult = SpawnCloseResult | SpawnErrorResult;
type ActionCommandFinishResult = SpawnCloseDetails | SpawnErrorDetails;

interface SpawnLikeStream {
  on(event: "data", handler: (chunk: SpawnChunk) => void): unknown;
}

interface SpawnLikeChild {
  stdout?: SpawnLikeStream | null;
  stderr?: SpawnLikeStream | null;
  on(event: "error", handler: (error: unknown) => void): this;
  on(event: "close", handler: (exitCode: number | null) => void): this;
  kill?(): void;
}

interface SpawnLikeOptions {
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly shell: false;
  readonly stdio: readonly ["ignore", "pipe", "pipe"];
}

type SpawnLike = (command: string, argv: string[], options: SpawnLikeOptions) => SpawnLikeChild;

export interface RunActionCommandOptions {
  readonly command?: string;
  readonly argv?: readonly string[];
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly timeoutMs?: number;
  readonly maxStreamBytes?: number;
  readonly maxStreamLines?: number;
  readonly spawnImpl?: SpawnLike;
}

function createBoundedCollector({ maxBytes, maxLines }: { maxBytes: number; maxLines: number }): StreamCollector {
  return {
    text: "",
    bytes: 0,
    lines: 0,
    truncated: false,
    append(chunk) {
      if (this.truncated) {
        return;
      }

      const text = chunk.toString();
      for (const character of text) {
        const characterBytes = Buffer.byteLength(character);
        if (this.bytes + characterBytes > maxBytes || this.lines >= maxLines) {
          this.truncated = true;
          break;
        }

        this.text += character;
        this.bytes += characterBytes;
        if (character === "\n") {
          this.lines += 1;
        }
      }
    },
  };
}

export function runActionCommand({
  command,
  argv,
  cwd = process.cwd(),
  env = process.env,
  timeoutMs = 15_000,
  maxStreamBytes = DEFAULT_MAX_STREAM_BYTES,
  maxStreamLines = DEFAULT_MAX_STREAM_LINES,
  spawnImpl = spawn as SpawnLike,
}: RunActionCommandOptions = {}): Promise<ActionCommandResult> {
  if (typeof command !== "string" || command.length === 0) {
    throw new Error("runActionCommand requires a command string.");
  }
  if (!Array.isArray(argv) || argv.some((entry) => typeof entry !== "string")) {
    throw new Error("runActionCommand requires an argv array of strings.");
  }

  return new Promise((resolve) => {
    let settled = false;
    const stdoutCollector = createBoundedCollector({ maxBytes: maxStreamBytes, maxLines: maxStreamLines });
    const stderrCollector = createBoundedCollector({ maxBytes: maxStreamBytes, maxLines: maxStreamLines });
    const finish = (result: ActionCommandFinishResult): void => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      const stdout = stdoutCollector.text;
      const stderr = stderrCollector.text;
      resolve({
        stdout,
        stderr,
        output: [stdout.trimEnd(), stderr.trimEnd()].filter(Boolean).join("\n"),
        ...result,
      });
    };
    const child = spawnImpl(command, [...argv], { cwd, env, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout?.on("data", (chunk) => {
      stdoutCollector.append(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderrCollector.append(chunk);
    });
    child.on("error", (error) =>
      finish({ ok: false, exitCode: null, timedOut: false, error: error instanceof Error ? error.message : String(error) }));
    child.on("close", (exitCode) =>
      finish({
        ok: exitCode === 0,
        exitCode,
        timedOut: false,
        stdoutTruncated: stdoutCollector.truncated,
        stderrTruncated: stderrCollector.truncated,
      }));
    const timeoutId = setTimeout(() => {
      child.kill?.();
      finish({
        ok: false,
        exitCode: null,
        timedOut: true,
        stdoutTruncated: stdoutCollector.truncated,
        stderrTruncated: stderrCollector.truncated,
      });
    }, timeoutMs);
  });
}
