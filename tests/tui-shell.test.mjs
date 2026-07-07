import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import { createActionDefinition } from "../scripts/lib/tui/actions/definitions.mjs";
import { buildCommandArgv } from "../scripts/lib/tui/command-manifest.mjs";
import {
  activateHomeSelection,
  createNavigationState,
  moveHomeSelection,
  navigateTo,
  TUI_ROUTES,
} from "../scripts/lib/tui/navigation.mjs";
import { buildRouteBreadcrumb, createTuiApp, renderHomeScreen } from "../scripts/tui.mjs";

function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

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
      modelProfiles: {
        mode: "browse",
        focusedProfileIndex: 0,
        focusedAgentIndex: 0,
        targetProfileName: undefined,
        stagedAssignments: {},
      },
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

  it("builds route breadcrumbs for top-level screens and nested model-profile flows", () => {
    expect(buildRouteBreadcrumb(createNavigationState())).toBe("Home");
    expect(buildRouteBreadcrumb(navigateTo(createNavigationState(), "configuration"))).toBe("Configuration");
    expect(buildRouteBreadcrumb(navigateTo(createNavigationState(), "status"))).toBe("Status");
    expect(buildRouteBreadcrumb(navigateTo(createNavigationState(), "model-profiles"))).toBe("Models");
    expect(buildRouteBreadcrumb({
      ...navigateTo(createNavigationState(), "model-profiles"),
      modelProfiles: {
        mode: "assignments",
        focusedProfileIndex: 0,
        focusedAgentIndex: 0,
        targetProfileName: "budget",
        stagedAssignments: {},
      },
    })).toBe("Models/budget");
  });

  it("sanitizes dynamic breadcrumb text before it is rendered", () => {
    const breadcrumb = buildRouteBreadcrumb({
      ...navigateTo(createNavigationState(), "model-profiles"),
      modelProfiles: {
        mode: "assignments",
        focusedProfileIndex: 0,
        focusedAgentIndex: 0,
        targetProfileName: "budget\u001b]2;owned\u0007\u001b[31mred",
        stagedAssignments: {},
      },
    });

    expect(breadcrumb).toBe("Models/budgetred");
    expect(breadcrumb).not.toContain("\u001b");
  });

  it("clips very long rendered breadcrumbs to the frame width without losing sanitization", () => {
    const app = createTuiApp({ exit: () => {} });

    app.navigation.route = "model-profiles";
    app.navigation.modelProfiles = {
      mode: "assignments",
      focusedProfileIndex: 0,
      focusedAgentIndex: 0,
      targetProfileName: "profile-1234567890\u001b[31m-dangerously-long-name-for-the-frame",
      stagedAssignments: {},
    };

    const renderedLines = app.screen.render(32).map(stripAnsi);

    expect(renderedLines[0]).toHaveLength(32);
    expect(visibleWidth(renderedLines[0])).toBe(32);
    expect(renderedLines[0]).toBe("┌ Models/profile-1234567890-da ─");
    expect(renderedLines[0]).not.toContain("\u001b");
  });

  it("clips wide unicode breadcrumbs to the visible frame width", () => {
    const app = createTuiApp({ exit: () => {} });

    app.navigation.route = "model-profiles";
    app.navigation.modelProfiles = {
      mode: "assignments",
      focusedProfileIndex: 0,
      focusedAgentIndex: 0,
      targetProfileName: "超長名稱超長名稱超長名稱",
      stagedAssignments: {},
    };

    const renderedLines = app.screen.render(32).map(stripAnsi);

    expect(visibleWidth(renderedLines[0])).toBeLessThanOrEqual(32);
    expect(renderedLines[0]).toContain("Models/");
    expect(renderedLines[0]).not.toContain("\u001b");
  });

  it("keeps readable rendered breadcrumbs intact when they fit within the frame", () => {
    const app = createTuiApp({ exit: () => {} });

    app.navigation.route = "model-profiles";
    app.navigation.modelProfiles = {
      mode: "assignments",
      focusedProfileIndex: 0,
      focusedAgentIndex: 0,
      targetProfileName: "budget",
      stagedAssignments: {},
    };

    const renderedLines = app.screen.render(32).map(stripAnsi);

    expect(renderedLines[0]).toBe("┌ Models/budget ────────────────");
  });

  it("renders Home body lines without a trailing right border suffix", () => {
    const renderedLines = renderHomeScreen(createNavigationState(), 60).map(stripAnsi);

    expect(renderedLines.slice(1, -1)).toSatisfy((lines) => lines.every((line) => line.startsWith("│ ") && !/\s*│$/.test(line)));
  });

  it("embeds the shortened arrow hint in the bottom frame line", () => {
    const renderedLines = renderHomeScreen(createNavigationState(), 60).map(stripAnsi);

    expect(renderedLines.at(-1)).toContain("└ ↑/↓ move ");
    expect(visibleWidth(renderedLines.at(-1))).toBe(60);
    expect(renderedLines.join("\n")).not.toContain("Use ↑/↓ to move the Home selection.");
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
    expect(terminal.output).toContain("┌ Home");
    expect(terminal.output).toContain("> Configuration [selected]");
    expect(terminal.output).toContain("  Status");
    expect(terminal.output).toContain("  Model Profiles");
    expect(terminal.output).not.toContain("Current route: home");
    expect(stripAnsi(terminal.output)).toContain("└ ↑/↓ move ");
    expect(terminal.output).toContain("Press Enter to open the selected section.");
    expect(stripAnsi(terminal.output)).toContain("Press Configuracion | Status | Models");
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
    const app = createTuiApp({
      terminal,
      exit: (payload) => exits.push(payload),
      loadConfigurationStatus: () => ({
        title: "Configuration",
        items: [{ id: "pi", label: "Pi", state: "warn", detail: "Not installed." }],
        actions: [],
        interactiveActions: [],
      }),
    });

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
    await flushTui();

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
    expect(stripAnsi(terminal.output)).toContain("└ ↑/↓ move ");
  });

  it("shows section action keyboard guidance plus form cancel help without trapping focus", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadConfigurationStatus: () => ({
        title: "Configuration",
        items: [{ id: "pi", label: "Pi", state: "warn", detail: "Not installed." }],
        actions: [{ id: "init", label: "afergon-ai init", argv: ["init"], description: "Initialize project files." }],
        interactiveActions: [
          createActionDefinition({
            id: "configuration-init",
            section: "configuration",
            kind: "mutate",
            label: "Initialize project files",
            cliEquivalent: "afergon-ai init",
            buildArgv: ({ selectedIds }) => buildCommandArgv("init", selectedIds.includes("all") ? ["--all"] : selectedIds.map((id) => `--${id}`)),
            form: {
              kind: "checkboxes",
              title: "Choose what to initialize",
              options: [
                { id: "pi", label: "Pi" },
                { id: "claude", label: "Claude" },
                { id: "opencode", label: "OpenCode" },
                { id: "all", label: "All" },
              ],
            },
          }),
        ],
      }),
    });

    app.start();
    await flushTui();
    terminal.output = "";

    terminal.emitInput("c");
    await flushTui();

    expect(terminal.output).toContain("Use ↑/↓ to move the action selection.");
    expect(terminal.output).toContain("Press Esc to cancel confirmations, forms, or output panels.");

    terminal.emitInput("\r");
    await flushTui();

    expect(terminal.output).toContain("Choose what to initialize");
    expect(terminal.output).toContain("Use Space to toggle the selected checkbox.");
    expect(terminal.output).toContain("Press Esc to cancel.");

    terminal.output = "";
    terminal.emitInput("\u001b");
    await flushTui();

    expect(app.navigation.route).toBe("configuration");
    expect(app.navigation.modal).toBeUndefined();
    expect(terminal.output).toContain("Configuration");
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
