import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");
const emittedTuiPath = path.join(repoRoot, "dist", "scripts", "tui.js");

class FakeTerminal {
  columns = 100;
  rows = 30;
  kittyProtocolActive = false;
  output = "";
  stopCalls = 0;
  onInput?: (data: string) => void;

  start(onInput: (data: string) => void) { this.onInput = onInput; }
  stop() { this.stopCalls += 1; }
  async drainInput() {}
  write(data: string) { this.output += data; }
  moveBy() {}
  hideCursor() {}
  showCursor() {}
  clearLine() {}
  clearFromCursor() {}
  clearScreen() {}
  setTitle() {}
  setProgress() {}
  emitInput(data: string) { this.onInput?.(data); }
}

async function flushTui() {
  await new Promise((resolve) => process.nextTick(resolve));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("emitted TUI runtime", () => {
  beforeAll(() => {
    const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const result = spawnSync(pnpmCommand, ["run", "build"], { cwd: repoRoot, encoding: "utf8", timeout: 120000 });
    expect(result.status).toBe(0);
  }, 120000);

  it("starts, renders, accepts input, and exits through the emitted JavaScript entrypoint", async () => {
    const runtime = await import(`${pathToFileURL(emittedTuiPath).href}?emitted-runtime-test`);
    const terminal = new FakeTerminal();
    const exits: Array<{ code: number; reason: string }> = [];
    const app = runtime.createTuiApp({
      terminal,
      exit: (result: { code: number; reason: string }) => exits.push(result),
      loadStatusScreenState: () => ({ title: "Status", summary: { label: "Readiness", state: "ok", detail: "Ready." }, items: [], actions: [] }),
    });

    app.start();
    await flushTui();
    expect(terminal.output).toContain("Sections available in this MVP slice:");

    terminal.output = "";
    terminal.emitInput("s");
    await flushTui();
    expect(terminal.output).toContain("Status");

    terminal.emitInput("q");
    expect(terminal.stopCalls).toBe(1);
    expect(exits).toEqual([{ code: 0, reason: "user-exit" }]);
  });
});
