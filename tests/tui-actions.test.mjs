import { describe, expect, it, vi } from "vitest";

import * as actionRunnerTypeScript from "../scripts/lib/tui/actions/runner.ts";
import { createActionDefinition } from "../scripts/lib/tui/actions/definitions.mjs";
import { getOutputLines, sanitizeTerminalOutput } from "../scripts/lib/tui/actions/forms.mjs";
import { runActionCommand } from "../scripts/lib/tui/actions/runner.mjs";
import { buildCommandArgv } from "../scripts/lib/tui/command-manifest.mjs";
import { createTuiApp } from "../scripts/tui.mjs";

class FakeTerminal {
  constructor() { this.columns = 100; this.rows = 30; this.kittyProtocolActive = false; this.output = ""; this.stopCalls = 0; }
  start(onInput, onResize) { this.onInput = onInput; this.onResize = onResize; }
  stop() { this.stopCalls += 1; }
  async drainInput() {}
  write(data) { this.output += data; }
  moveBy() {}
  hideCursor() {}
  showCursor() {}
  clearLine() {}
  clearFromCursor() {}
  clearScreen() {}
  setTitle(title) { this.title = title; }
  setProgress() {}
  emitInput(data) { this.onInput?.(data); }
}

class FakeChildProcess {
  constructor() { this.stdout = { on: vi.fn() }; this.stderr = { on: vi.fn() }; this.handlers = new Map(); this.kill = vi.fn(() => { this.killed = true; }); }
  on(event, handler) { this.handlers.set(event, handler); return this; }
  emitStdout(chunk) { this.stdout.on.mock.calls.find(([event]) => event === "data")?.[1](chunk); }
  emitStderr(chunk) { this.stderr.on.mock.calls.find(([event]) => event === "data")?.[1](chunk); }
  emit(event, ...args) { this.handlers.get(event)?.(...args); }
}

const flushTui = async () => { await new Promise((resolve) => process.nextTick(resolve)); await new Promise((resolve) => setTimeout(resolve, 0)); };
const getStatusFixture = () => ({ title: "Status", summary: { label: "Readiness", state: "ok", detail: "Ready for guided workflows." }, items: [{ id: "opencode", label: "OpenCode", state: "ok", detail: "Managed install detected." }], actions: [] });

describe("runActionCommand", () => {
  it("keeps the TypeScript action runner in parity with the runtime .mjs module for successful execution", async () => {
    const createSpawnImpl = () => {
      const child = new FakeChildProcess();
      const spawnImpl = vi.fn(() => {
        queueMicrotask(() => {
          child.emitStdout("doctor ok\n");
          child.emit("close", 0);
        });
        return child;
      });

      return { child, spawnImpl };
    };

    const runtime = createSpawnImpl();
    const runtimeResult = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "doctor", "--opencode"],
      cwd: "/tmp/afergon-ai",
      spawnImpl: runtime.spawnImpl,
    });

    const typeScript = createSpawnImpl();
    const typeScriptResult = await actionRunnerTypeScript.runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "doctor", "--opencode"],
      cwd: "/tmp/afergon-ai",
      spawnImpl: typeScript.spawnImpl,
    });

    expect(typeScriptResult).toEqual(runtimeResult);
    expect(typeScript.spawnImpl).toHaveBeenCalledWith(
      process.execPath,
      ["scripts/cli-dispatch.mjs", "doctor", "--opencode"],
      expect.objectContaining({ cwd: "/tmp/afergon-ai", shell: false }),
    );
  });

  it("keeps the TypeScript action runner in parity with the runtime .mjs module for failure and timeout paths", async () => {
    const runtimeFailureChild = new FakeChildProcess();
    const runtimeFailure = runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "update"],
      spawnImpl: vi.fn(() => {
        queueMicrotask(() => {
          runtimeFailureChild.emitStderr("permission denied\n");
          runtimeFailureChild.emit("close", 1);
        });
        return runtimeFailureChild;
      }),
    });

    const typeScriptFailureChild = new FakeChildProcess();
    const typeScriptFailure = actionRunnerTypeScript.runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "update"],
      spawnImpl: vi.fn(() => {
        queueMicrotask(() => {
          typeScriptFailureChild.emitStderr("permission denied\n");
          typeScriptFailureChild.emit("close", 1);
        });
        return typeScriptFailureChild;
      }),
    });

    await expect(typeScriptFailure).resolves.toEqual(await runtimeFailure);

    const runtimeTimeoutChild = new FakeChildProcess();
    const runtimeTimeout = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "doctor"],
      timeoutMs: 5,
      spawnImpl: vi.fn(() => runtimeTimeoutChild),
    });

    const typeScriptTimeoutChild = new FakeChildProcess();
    const typeScriptTimeout = await actionRunnerTypeScript.runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "doctor"],
      timeoutMs: 5,
      spawnImpl: vi.fn(() => typeScriptTimeoutChild),
    });

    expect(typeScriptTimeout).toEqual(runtimeTimeout);
    expect(typeScriptTimeoutChild.kill).toHaveBeenCalled();
  });

  it("keeps the TypeScript action runner in parity with the runtime .mjs module when output truncates at configured limits", async () => {
    const createSpawnImpl = () => {
      const child = new FakeChildProcess();
      const spawnImpl = vi.fn(() => {
        queueMicrotask(() => {
          child.emitStdout("one\ntwo\nthree\nfour\n");
          child.emitStderr("err-one\nerr-two\nerr-three\n");
          child.emit("close", 1);
        });
        return child;
      });

      return { spawnImpl };
    };

    const runtime = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "doctor", "--opencode"],
      spawnImpl: createSpawnImpl().spawnImpl,
      maxStreamBytes: 12,
      maxStreamLines: 2,
    });

    const typeScript = await actionRunnerTypeScript.runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "doctor", "--opencode"],
      spawnImpl: createSpawnImpl().spawnImpl,
      maxStreamBytes: 12,
      maxStreamLines: 2,
    });

    expect(typeScript).toEqual(runtime);
    expect(typeScript).toEqual(expect.objectContaining({
      stdoutTruncated: true,
      stderrTruncated: true,
      stdout: "one\ntwo\n",
      stderr: "err-one\nerr-",
    }));
  });

  it("builds explicit argv arrays from stable manifest entries without fabricating shell commands", () => {
    const argv = buildCommandArgv("doctor", ["--opencode"]);
    expect(argv).toEqual(["doctor", "--opencode"]);
    expect(() => argv.push("--mutated")).toThrow(TypeError);
    expect(() => buildCommandArgv("doctor", "--opencode")).toThrow(/argv array/i);
  });

  it("spawns explicit argv arrays with shell disabled and captures output", async () => {
    const child = new FakeChildProcess();
    const spawnImpl = vi.fn(() => { queueMicrotask(() => { child.emitStdout("doctor ok\n"); child.emit("close", 0); }); return child; });
    const result = await runActionCommand({ command: process.execPath, argv: ["scripts/cli-dispatch.mjs", "doctor", "--opencode"], cwd: "/tmp/afergon-ai", spawnImpl });
    expect(spawnImpl).toHaveBeenCalledWith(process.execPath, ["scripts/cli-dispatch.mjs", "doctor", "--opencode"], expect.objectContaining({ cwd: "/tmp/afergon-ai", shell: false }));
    expect(result).toEqual(expect.objectContaining({ ok: true, exitCode: 0, stdout: "doctor ok\n", stderr: "" }));
  });

  it("reports stderr and timeout failures without falling back to a shell string", async () => {
    const failureChild = new FakeChildProcess();
    const failureResult = runActionCommand({ command: process.execPath, argv: ["scripts/cli-dispatch.mjs", "update"], spawnImpl: vi.fn(() => { queueMicrotask(() => { failureChild.emitStderr("permission denied\n"); failureChild.emit("close", 1); }); return failureChild; }) });
    await expect(failureResult).resolves.toEqual(expect.objectContaining({ ok: false, exitCode: 1, stderr: "permission denied\n", timedOut: false }));

    const timeoutChild = new FakeChildProcess();
    const timeoutResult = await runActionCommand({ command: process.execPath, argv: ["scripts/cli-dispatch.mjs", "doctor"], timeoutMs: 5, spawnImpl: vi.fn(() => timeoutChild) });
    expect(timeoutChild.kill).toHaveBeenCalled();
    expect(timeoutResult).toEqual(expect.objectContaining({ ok: false, exitCode: null, timedOut: true }));
  });

  it("caps captured stdout and stderr, marks truncation, and preserves failure metadata", async () => {
    const child = new FakeChildProcess();
    const spawnImpl = vi.fn(() => {
      queueMicrotask(() => {
        child.emitStdout("one\ntwo\nthree\nfour\n");
        child.emitStderr("err-one\nerr-two\nerr-three\n");
        child.emit("close", 1);
      });
      return child;
    });

    const result = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "doctor", "--opencode"],
      spawnImpl,
      maxStreamBytes: 12,
      maxStreamLines: 2,
    });

    expect(result).toEqual(expect.objectContaining({
      ok: false,
      exitCode: 1,
      timedOut: false,
      stdout: "one\ntwo\n",
      stderr: "err-one\nerr-",
      stdoutTruncated: true,
      stderrTruncated: true,
    }));
  });

  it("does not mark truncation when stdout or stderr lands exactly on the configured byte and line boundaries", async () => {
    const child = new FakeChildProcess();
    const spawnImpl = vi.fn(() => {
      queueMicrotask(() => {
        child.emitStdout("one\ntwo\n");
        child.emitStderr("12345678");
        child.emit("close", 0);
      });
      return child;
    });

    const result = await runActionCommand({
      command: process.execPath,
      argv: ["scripts/cli-dispatch.mjs", "doctor", "--opencode"],
      spawnImpl,
      maxStreamBytes: 8,
      maxStreamLines: 2,
    });

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      exitCode: 0,
      timedOut: false,
      stdout: "one\ntwo\n",
      stderr: "12345678",
      stdoutTruncated: false,
      stderrTruncated: false,
    }));
  });

  it("rejects executable action definitions that are not built from the stable manifest allowlist", () => {
    expect(() => createActionDefinition({ id: "status-unsafe", section: "status", kind: "read", label: "Unsafe", argv: ["bash", "-lc", "rm -rf /"] })).toThrow(/stable manifest/i);
    expect(createActionDefinition({ id: "status-safe", section: "status", kind: "read", label: "Safe", argv: buildCommandArgv("doctor", ["--opencode"]) })).toEqual(expect.objectContaining({ argv: ["doctor", "--opencode"] }));
  });
});

describe("sanitizeTerminalOutput", () => {
  it("removes C1 control sequences while preserving printable text and newlines", () => {
    expect(sanitizeTerminalOutput("safe\n\u009b31mred\u009b0m\n\u009d2;owned\u0007tail\u0085done\n")).toBe("safe\nred\ntail?done\n");
  });

  it("caps rendered output lines and bytes and shows a truncation indicator", () => {
    const outputLines = getOutputLines({
      action: { label: "Run doctor", cliEquivalent: "afergon-ai doctor --opencode" },
      result: {
        ok: false,
        timedOut: false,
        stdout: "alpha\nbeta\ngamma\ndelta\n",
        stderr: "1234567890ABCDEFGHIJ\n",
        stdoutTruncated: false,
        stderrTruncated: true,
      },
    }, {
      maxOutputLines: 8,
      maxOutputBytes: 70,
    });

    expect(outputLines).toEqual([
      "Output [fail]",
      "Action: Run doctor",
      "CLI equivalent: afergon-ai doctor --opencode",
      "",
      "stdout",
      "alpha",
      "beta",
      "[output truncated]",
      "",
      "Press Enter or Esc to close this output panel.",
    ]);
  });
});

describe("createTuiApp interactive actions", () => {
  it("renders selected actions with a teal fixed cursor, hides noisy metadata, and still requires confirmation", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async () => ({ ok: true, exitCode: 0, stdout: "updated\n", stderr: "", timedOut: false }));
    const app = createTuiApp({ terminal, exit: () => {}, loadStatusScreenState: getStatusFixture, interactiveActionsByRoute: { status: [createActionDefinition({ id: "status-update", section: "status", kind: "mutate", label: "Refresh managed files", argv: buildCommandArgv("update", ["--check"]), cliEquivalent: "afergon-ai update --check" })] }, executeAction });
    app.start();
    await flushTui();
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    expect(terminal.output).toContain("\u001b[38;5;6m> Refresh managed files\u001b[0m");
    expect(terminal.output).not.toContain("CLI equivalent: afergon-ai update --check");
    expect(terminal.output).not.toContain("Execution: confirmation required");
    terminal.emitInput("\r");
    await flushTui();
    expect(terminal.output).toContain("Confirmation");
    expect(terminal.output).toContain("afergon-ai update --check");
    expect(executeAction).not.toHaveBeenCalled();
  });

  it("confirms mutating actions, lets Escape cancel, and restores focus to the selected action", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async () => ({ ok: true, exitCode: 0, stdout: "updated\n", stderr: "", timedOut: false }));
    const app = createTuiApp({ terminal, exit: () => {}, loadStatusScreenState: getStatusFixture, interactiveActionsByRoute: { status: [createActionDefinition({ id: "status-update", section: "status", kind: "mutate", label: "Refresh managed files", argv: buildCommandArgv("update", ["--check"]), cliEquivalent: "afergon-ai update --check" })] }, executeAction });
    app.start();
    await flushTui();
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    expect(terminal.output).toContain("> Refresh managed files");
    terminal.emitInput("\r");
    await flushTui();
    expect(terminal.output).toContain("Confirmation");
    expect(terminal.output).toContain("afergon-ai update --check");
    expect(executeAction).not.toHaveBeenCalled();
    terminal.output = "";
    terminal.emitInput("\u001b");
    await flushTui();
    expect(terminal.output).not.toContain("Confirmation");
    expect(app.navigation.route).toBe("status");
    expect(app.navigation.modal).toBeUndefined();
    expect(app.navigation.sectionActionSelection).toBe(0);
  });

  it("runs read-only actions inline, renders captured output, and closes the output panel on Escape", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async ({ action }) => ({ ok: false, exitCode: 1, stdout: "doctor summary\n", stderr: `${action.id} failed\n`, timedOut: false }));
    const app = createTuiApp({ terminal, exit: () => {}, loadStatusScreenState: getStatusFixture, interactiveActionsByRoute: { status: [createActionDefinition({ id: "status-doctor", section: "status", kind: "read", label: "Run doctor", argv: buildCommandArgv("doctor", ["--opencode"]), cliEquivalent: "afergon-ai doctor --opencode" })] }, executeAction });
    app.start();
    await flushTui();
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    terminal.emitInput("\r");
    await flushTui();
    expect(executeAction).toHaveBeenCalledWith(expect.objectContaining({ action: expect.objectContaining({ id: "status-doctor", argv: ["doctor", "--opencode"] }) }));
    expect(terminal.output).toContain("Output [fail]");
    expect(terminal.output).toContain("doctor summary");
    expect(terminal.output).toContain("status-doctor failed");
    terminal.output = "";
    terminal.emitInput("\u001b");
    await flushTui();
    expect(terminal.output).not.toContain("Output [fail]");
    expect(app.navigation.route).toBe("status");
    expect(app.navigation.modal).toBeUndefined();
    expect(app.navigation.sectionActionSelection).toBe(0);
  });

  it("clamps stale action selection when a route exposes fewer actions before render and execution", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async ({ action }) => ({ ok: true, exitCode: 0, stdout: `${action.id}\n`, stderr: "", timedOut: false }));
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadStatusScreenState: getStatusFixture,
      interactiveActionsByRoute: {
        configuration: [
          createActionDefinition({ id: "configuration-init", section: "configuration", kind: "mutate", label: "Initialize", argv: buildCommandArgv("init") }),
          createActionDefinition({ id: "configuration-doctor", section: "configuration", kind: "read", label: "Doctor", argv: buildCommandArgv("doctor") }),
          createActionDefinition({ id: "configuration-update", section: "configuration", kind: "mutate", label: "Update", argv: buildCommandArgv("update") }),
        ],
        status: [
          createActionDefinition({ id: "status-doctor", section: "status", kind: "read", label: "Run doctor", argv: buildCommandArgv("doctor", ["--opencode"]), cliEquivalent: "afergon-ai doctor --opencode" }),
        ],
      },
      executeAction,
    });

    app.start();
    await flushTui();
    app.navigation.sectionActionSelection = 2;
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    expect(app.navigation.sectionActionSelection).toBe(0);
    expect(terminal.output).toContain("> Run doctor");
    terminal.emitInput("\r");
    await flushTui();
    expect(executeAction).toHaveBeenCalledWith(expect.objectContaining({ action: expect.objectContaining({ id: "status-doctor" }) }));
  });

  it("sanitizes ANSI and control-sequence output before rendering the output panel", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async () => ({
      ok: false,
      exitCode: 1,
      stdout: "\u001b[31mred\u001b[0m\nline\u0007\u001b]2;owned\u0007",
      stderr: "bad\r\u001b[2Jclear\u0000done\n",
      timedOut: false,
    }));
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadStatusScreenState: getStatusFixture,
      interactiveActionsByRoute: {
        status: [createActionDefinition({ id: "status-doctor", section: "status", kind: "read", label: "Run doctor", argv: buildCommandArgv("doctor", ["--opencode"]), cliEquivalent: "afergon-ai doctor --opencode" })],
      },
      executeAction,
    });

    app.start();
    await flushTui();
    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    terminal.emitInput("\r");
    await flushTui();
    expect(terminal.output).toContain("red");
    expect(terminal.output).toContain("line");
    expect(terminal.output).toContain("bad");
    expect(terminal.output).toContain("bad?clear?done");
    expect(terminal.output).toContain("clear?done");
    expect(terminal.output).not.toContain("\u001b[31mred");
    expect(terminal.output).not.toContain("\u001b]2;owned\u0007");
    expect(terminal.output).not.toContain("owned");
    expect(terminal.output).not.toContain("line\u0007");
    expect(terminal.output).not.toContain("done\u0000");
  });
});
