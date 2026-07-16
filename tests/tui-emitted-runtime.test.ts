import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { runPnpm } from "./helpers/process.js";

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

async function emitInput(terminal: FakeTerminal, data: string) {
  terminal.emitInput(data);
  await flushTui();
}

async function emitText(terminal: FakeTerminal, text: string) {
  for (const character of text) {
    await emitInput(terminal, character);
  }
}

describe("emitted TUI runtime", () => {
  beforeAll(() => {
    const result = runPnpm(["run", "build"], { cwd: repoRoot, encoding: "utf8", timeout: 120000 });
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

  it("types a model value into the emitted assignment form and stages the visible result", async () => {
    const runtime = await import(`${pathToFileURL(emittedTuiPath).href}?emitted-typed-form-test`);
    const terminal = new FakeTerminal();
    const app = runtime.createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }: { navigation?: any } = {}) => {
        const mode = navigation?.modelProfiles?.mode === "assignments" ? "assignments" : "browse";
        const focusedAgentIndex = navigation?.modelProfiles?.focusedAgentIndex ?? 0;
        const stagedAssignments = navigation?.modelProfiles?.stagedAssignments ?? {};
        const assignment = {
          agent: "afergon-ai",
          configured: stagedAssignments["afergon-ai"] ?? "(unset)",
          effective: stagedAssignments["afergon-ai"] ?? "(unset)",
          source: stagedAssignments["afergon-ai"] ? "staged" : "implicit-inherit",
          isFocused: focusedAgentIndex === 0,
        };

        return {
          title: "Model Profiles",
          summary: { state: "ok", detail: "1 profile(s) available." },
          activeProfile: "budget",
          configPath: "/tmp/config.json",
          tools: [],
          selectedTool: "opencode",
          toolLabel: "OpenCode",
          projectionDetail: "The active profile is projected to managed OpenCode agents on disk.",
          profiles: [{ name: "budget", isActive: true, isCreate: false, isFocused: true }],
          assignments: [assignment],
          browse: {
            mode,
            selectedTool: "opencode",
            targetProfileName: navigation?.modelProfiles?.targetProfileName,
            focusedAgentIndex,
            stagedAssignments,
            focusedProfileName: "budget",
            focusedProfile: { name: "budget", isActive: true, isCreate: false, isFocused: true },
            isCreateSelected: false,
            inlineCreate: undefined,
            placeholderAssignments: [],
          },
          interactiveActions: [],
        };
      },
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "u");
    await emitInput(terminal, "\r");

    terminal.output = "";
    await emitText(terminal, "alpha");
    expect(terminal.output).toContain("Model: alpha");

    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "\r");

    expect(app.navigation.modelProfiles.stagedAssignments).toEqual({ "afergon-ai": "alpha" });
    expect(terminal.output).toContain("configured=alpha");
  });
});
