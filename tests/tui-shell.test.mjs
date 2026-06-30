import { describe, expect, it } from "vitest";

import { createNavigationState, navigateTo, TUI_ROUTES } from "../scripts/lib/tui/navigation.mjs";
import { createTuiApp } from "../scripts/tui.mjs";

class FakeTerminal {
  constructor() {
    this.columns = 120;
    this.rows = 24;
    this.kittyProtocolActive = false;
    this.output = "";
    this.stopCalls = 0;
    this.title = "";
    this.onInput = undefined;
    this.onResize = undefined;
  }
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

async function flushTui() {
  await new Promise((resolve) => process.nextTick(resolve));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("navigation state", () => {
  it("defaults to the home route and exposes only the MVP route set", () => {
    expect(createNavigationState()).toEqual({ route: "home", routes: ["home", "configuration", "status", "model-profiles"] });
    expect(TUI_ROUTES).toEqual(["home", "configuration", "status", "model-profiles"]);
  });

  it("rejects navigation outside the MVP route set", () => {
    expect(navigateTo(createNavigationState(), "configuration").route).toBe("configuration");
    expect(() => navigateTo(createNavigationState(), "telemetry")).toThrow(/Unsupported TUI route/);
  });
});

describe("createTuiApp", () => {
  it("starts on the home route and renders the minimal shell", async () => {
    const terminal = new FakeTerminal();
    const exits = [];
    const app = createTuiApp({ terminal, exit: (payload) => exits.push(payload) });

    app.start();
    await flushTui();

    expect(app.navigation.route).toBe("home");
    expect(terminal.title).toBe("afergon-ai TUI");
    expect(terminal.output).toContain("█████");
    expect(terminal.output).toContain("debate  ·  specify  ·  implement  ·  review");
    expect(terminal.output).toContain("- Configuration (press c)");
    expect(terminal.output).toContain("Press c for Configuration.");
    expect(exits).toEqual([]);
  });

  it("renders the Configuration route while preserving Home/Status/Model Profiles shortcuts", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({ terminal, exit: () => {}, loadConfigurationStatus: () => ({ title: "Configuration", items: [{ label: "Pi", state: "ok", detail: "installed" }], actions: [{ label: "afergon-ai init", description: "Initialize project files." }] }) });

    app.start();
    await flushTui();

    terminal.emitInput("c");
    await flushTui();
    expect(app.navigation.route).toBe("configuration");
    expect(terminal.output).toContain("Current state");

    terminal.emitInput("h");
    await flushTui();
    expect(app.navigation.route).toBe("home");

    terminal.emitInput("s");
    await flushTui();
    expect(app.navigation.route).toBe("status");
    expect(terminal.output).toContain("This screen will land in a later slice.");

    terminal.emitInput("h");
    await flushTui();
    terminal.emitInput("m");
    await flushTui();
    expect(app.navigation.route).toBe("model-profiles");
  });

  it("stops the TUI when q or Escape is pressed", async () => {
    const terminal = new FakeTerminal();
    const exits = [];
    const app = createTuiApp({ terminal, exit: (payload) => exits.push(payload) });
    app.start();
    await flushTui();
    terminal.emitInput("q");
    expect(terminal.stopCalls).toBe(1);
    expect(exits).toEqual([{ code: 0, reason: "user-exit" }]);
  });
});
