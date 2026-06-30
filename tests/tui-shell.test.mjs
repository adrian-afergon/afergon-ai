import { describe, expect, it } from "vitest";

import {
  activateHomeSelection,
  createNavigationState,
  moveHomeSelection,
  navigateTo,
  TUI_ROUTES,
} from "../scripts/lib/tui/navigation.mjs";
import { createTuiApp } from "../scripts/tui.mjs";

class FakeTerminal {
  constructor() {
    this.columns = 80;
    this.rows = 24;
    this.kittyProtocolActive = false;
    this.output = "";
    this.stopCalls = 0;
    this.title = "";
    this.onInput = undefined;
    this.onResize = undefined;
  }

  start(onInput, onResize) {
    this.onInput = onInput;
    this.onResize = onResize;
  }

  stop() {
    this.stopCalls += 1;
  }

  async drainInput() {}

  write(data) {
    this.output += data;
  }

  moveBy() {}

  hideCursor() {}

  showCursor() {}

  clearLine() {}

  clearFromCursor() {}

  clearScreen() {}

  setTitle(title) {
    this.title = title;
  }

  setProgress() {}

  emitInput(data) {
    this.onInput?.(data);
  }
}

async function flushTui() {
  await new Promise((resolve) => process.nextTick(resolve));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("navigation state", () => {
  it("defaults to the home route and exposes only the MVP route set", () => {
    expect(createNavigationState()).toEqual({
      route: "home",
      homeSelection: 0,
      routes: ["home", "configuration", "status", "model-profiles"],
    });

    expect(TUI_ROUTES).toEqual(["home", "configuration", "status", "model-profiles"]);
  });

  it("rejects navigation outside the MVP route set", () => {
    expect(navigateTo(createNavigationState(), "configuration").route).toBe("configuration");
    expect(() => navigateTo(createNavigationState(), "telemetry")).toThrow(/Unsupported TUI route/);
  });

  it("wraps Home selection when moving up and down", () => {
    const state = createNavigationState();

    expect(moveHomeSelection(state, -1).homeSelection).toBe(2);
    expect(moveHomeSelection(state, 1).homeSelection).toBe(1);
    expect(moveHomeSelection({ ...state, homeSelection: 2 }, 1).homeSelection).toBe(0);
  });

  it("activates the selected Home route", () => {
    expect(activateHomeSelection(createNavigationState()).route).toBe("configuration");
    expect(activateHomeSelection({ ...createNavigationState(), homeSelection: 1 }).route).toBe("status");
    expect(activateHomeSelection({ ...createNavigationState(), homeSelection: 2 }).route).toBe("model-profiles");
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
    expect(app.navigation.homeSelection).toBe(0);
    expect(terminal.title).toBe("afergon-ai TUI");
    expect(terminal.output).toContain("AFERGON-AI");
    expect(terminal.output).toContain("debate · specify · implement · review");
    expect(terminal.output).toContain("Home");
    expect(terminal.output).toContain("> Configuration [selected]");
    expect(terminal.output).toContain("  Status");
    expect(terminal.output).toContain("  Model Profiles");
    expect(terminal.output).toContain("Keyboard help");
    expect(terminal.output).toContain("Use ↑/↓ to move the Home selection.");
    expect(terminal.output).toContain("Press Enter to open the selected section.");
    expect(terminal.output).toContain("Selection markers: > and [selected] identify the active Home item.");
    expect(terminal.output).toContain("Press q or Esc to exit");
    expect(exits).toEqual([]);
  });

  it("moves the Home selection with arrow keys and opens the selected route with Enter", async () => {
    const terminal = new FakeTerminal();
    const exits = [];
    const app = createTuiApp({ terminal, exit: (payload) => exits.push(payload) });

    app.start();
    await flushTui();

    terminal.emitInput("\u001b[B");
    await flushTui();

    expect(app.navigation.homeSelection).toBe(1);
    expect(terminal.output).toContain("> Status [selected]");
  
    terminal.emitInput("\r");
    await flushTui();

    expect(app.navigation.route).toBe("status");
    expect(exits).toEqual([]);
  });

  it("preserves c/s/m/h shortcuts alongside arrow navigation", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({ terminal, exit: () => {} });

    app.start();
    await flushTui();

    terminal.emitInput("s");
    await flushTui();
    expect(app.navigation.route).toBe("status");

    terminal.emitInput("h");
    await flushTui();
    expect(app.navigation.route).toBe("home");

    terminal.emitInput("m");
    await flushTui();
    expect(app.navigation.route).toBe("model-profiles");

    terminal.emitInput("h");
    await flushTui();
    expect(app.navigation.route).toBe("home");

    terminal.emitInput("c");
    await flushTui();
    expect(app.navigation.route).toBe("configuration");
  });

  it("ignores arrow and enter keys off Home so the TUI stays responsive", async () => {
    const terminal = new FakeTerminal();
    const exits = [];
    const app = createTuiApp({ terminal, exit: (payload) => exits.push(payload) });

    app.start();
    await flushTui();
    terminal.emitInput("c");
    await flushTui();

    terminal.emitInput("\u001b[A");
    terminal.emitInput("\r");
    await flushTui();

    expect(app.navigation.route).toBe("configuration");
    expect(exits).toEqual([]);

    terminal.emitInput("q");

    expect(terminal.stopCalls).toBe(1);
    expect(exits).toEqual([{ code: 0, reason: "user-exit" }]);
  });

  it("uses plain-text fallback branding and keyboard guidance when the banner is unsafe to render", async () => {
    const terminal = new FakeTerminal();
    terminal.columns = 60;
    const app = createTuiApp({ terminal, exit: () => {} });

    app.start();
    await flushTui();

    expect(terminal.output).toContain("AFERGON-AI");
    expect(terminal.output).toContain("debate · specify · implement · review");
    expect(terminal.output).toContain("Plain-text branding mode keeps Home readable.");
    expect(terminal.output).toContain("Keyboard help");
  });

  it("stops the TUI when q is pressed", async () => {
    const terminal = new FakeTerminal();
    const exits = [];
    const app = createTuiApp({ terminal, exit: (payload) => exits.push(payload) });

    app.start();
    await flushTui();
    terminal.emitInput("q");

    expect(terminal.stopCalls).toBe(1);
    expect(exits).toEqual([{ code: 0, reason: "user-exit" }]);
  });

  it("stops the TUI when Escape is pressed", async () => {
    const terminal = new FakeTerminal();
    const exits = [];
    const app = createTuiApp({ terminal, exit: (payload) => exits.push(payload) });

    app.start();
    await flushTui();
    terminal.emitInput("\u001b");

    expect(terminal.stopCalls).toBe(1);
    expect(exits).toEqual([{ code: 0, reason: "user-exit" }]);
  });
});
