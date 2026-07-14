import path from "node:path";
import { spawnSync } from "node:child_process";
import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import * as navigationTypeScript from "../scripts/lib/tui/navigation.ts";
import { createActionDefinition } from "../scripts/lib/tui/actions/definitions.mjs";
import { buildCommandArgv } from "../scripts/lib/tui/command-manifest.mjs";
import {
  appendModelProfilesInlineCreateCharacter,
  activateHomeSelection,
  backspaceModelProfilesInlineCreateCharacter,
  closeModal,
  createNavigationState,
  enterModelProfilesAssignments,
  enterModelProfilesInlineCreate,
  exitModelProfilesAssignments,
  exitModelProfilesInlineCreate,
  HOME_MENU_ROUTES,
  moveHomeSelection,
  moveModelProfilesAssignmentSelection,
  moveModelProfilesInlineCreateSelection,
  moveModelProfilesSelection,
  moveSectionActionSelection,
  navigateTo,
  normalizeSectionActionSelection,
  openModal,
  stageModelProfilesAssignment,
  TUI_ROUTES,
  validateModelProfilesInlineCreate,
} from "../scripts/lib/tui/navigation.mjs";
import { buildRouteBreadcrumb, createTuiApp, renderHomeScreen } from "../scripts/tui.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");

function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

function createRouteRenderApp() {
  return createTuiApp({
    exit: () => {},
    loadConfigurationStatus: () => ({
      title: "Configuration",
      items: [{ id: "pi", label: "Pi", state: "warn", detail: "Not installed." }],
      actions: [],
      interactiveActions: [],
    }),
    loadStatusScreenState: () => ({
      title: "Status",
      summary: { label: "Readiness", state: "warn", detail: "Run afergon-ai init." },
      items: [{ id: "claude", label: "Claude Code", state: "warn", detail: "Not installed." }],
      actions: [],
      interactiveActions: [],
    }),
    loadModelProfilesScreenState: () => ({
      title: "Model Profiles",
      activeProfile: "default",
      summary: { state: "ok", detail: "1 profile available" },
      profiles: [{ name: "default", active: true }],
      assignments: [{ agent: "afergon-ai", model: "openai/gpt-5.4", source: "explicit" }],
      actions: [],
      interactiveActions: [],
    }),
  });
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
  it("keeps the TypeScript navigation export surface in parity with the runtime .mjs module", () => {
    expect(Object.keys(navigationTypeScript).sort()).toEqual([
      "HOME_MENU_ROUTES",
      "TUI_ROUTES",
      "activateHomeSelection",
      "appendModelProfilesInlineCreateCharacter",
      "backspaceModelProfilesInlineCreateCharacter",
      "closeModal",
      "createNavigationState",
      "enterModelProfilesAssignments",
      "enterModelProfilesInlineCreate",
      "exitModelProfilesAssignments",
      "exitModelProfilesInlineCreate",
      "moveHomeSelection",
      "moveModelProfilesAssignmentSelection",
      "moveModelProfilesInlineCreateSelection",
      "moveModelProfilesSelection",
      "moveSectionActionSelection",
      "navigateTo",
      "normalizeSectionActionSelection",
      "openModal",
      "stageModelProfilesAssignment",
      "validateModelProfilesInlineCreate",
    ]);
  });

  it("keeps every exported navigation value and helper in parity with the runtime .mjs module", () => {
    const runtimeState = createNavigationState("home", 1);
    const typeScriptState = navigationTypeScript.createNavigationState("home", 1);
    const inlineCreateState = {
      ...typeScriptState.modelProfiles,
      createProfileName: "  budget  ",
      createProfileSelection: "cancel",
      createProfileValidation: "Stale",
    };
    const assignmentState = navigationTypeScript.enterModelProfilesAssignments(typeScriptState.modelProfiles, "budget");

    expect(navigationTypeScript.TUI_ROUTES).toEqual(TUI_ROUTES);
    expect(navigationTypeScript.HOME_MENU_ROUTES).toEqual(HOME_MENU_ROUTES);
    expect(typeScriptState).toEqual(runtimeState);
    expect(navigationTypeScript.navigateTo(typeScriptState, "status")).toEqual(navigateTo(runtimeState, "status"));
    expect(navigationTypeScript.moveModelProfilesSelection(typeScriptState.modelProfiles, 3, -1)).toEqual(
      moveModelProfilesSelection(runtimeState.modelProfiles, 3, -1),
    );
    expect(navigationTypeScript.enterModelProfilesInlineCreate(typeScriptState.modelProfiles)).toEqual(
      enterModelProfilesInlineCreate(runtimeState.modelProfiles),
    );
    expect(navigationTypeScript.exitModelProfilesInlineCreate(inlineCreateState, { focusedProfileIndex: 2 })).toEqual(
      exitModelProfilesInlineCreate(inlineCreateState, { focusedProfileIndex: 2 }),
    );
    expect(navigationTypeScript.moveModelProfilesInlineCreateSelection(inlineCreateState, 1)).toEqual(
      moveModelProfilesInlineCreateSelection(inlineCreateState, 1),
    );
    expect(navigationTypeScript.appendModelProfilesInlineCreateCharacter(inlineCreateState, "x")).toEqual(
      appendModelProfilesInlineCreateCharacter(inlineCreateState, "x"),
    );
    expect(navigationTypeScript.backspaceModelProfilesInlineCreateCharacter(inlineCreateState)).toEqual(
      backspaceModelProfilesInlineCreateCharacter(inlineCreateState),
    );
    expect(navigationTypeScript.validateModelProfilesInlineCreate(inlineCreateState)).toEqual(
      validateModelProfilesInlineCreate(inlineCreateState),
    );
    expect(navigationTypeScript.enterModelProfilesAssignments(typeScriptState.modelProfiles, "budget")).toEqual(
      enterModelProfilesAssignments(runtimeState.modelProfiles, "budget"),
    );
    expect(navigationTypeScript.exitModelProfilesAssignments(assignmentState)).toEqual(
      exitModelProfilesAssignments(assignmentState),
    );
    expect(navigationTypeScript.moveModelProfilesAssignmentSelection(assignmentState, 3, -1)).toEqual(
      moveModelProfilesAssignmentSelection(assignmentState, 3, -1),
    );
    expect(navigationTypeScript.stageModelProfilesAssignment(assignmentState, "afergon-ai", "openai/gpt-5.4")).toEqual(
      stageModelProfilesAssignment(assignmentState, "afergon-ai", "openai/gpt-5.4"),
    );
    expect(navigationTypeScript.moveHomeSelection(typeScriptState, -1)).toEqual(moveHomeSelection(runtimeState, -1));
    expect(navigationTypeScript.activateHomeSelection(typeScriptState)).toEqual(activateHomeSelection(runtimeState));
    expect(navigationTypeScript.moveSectionActionSelection({ ...typeScriptState, sectionActionSelection: 1 }, 3, 1)).toEqual(
      moveSectionActionSelection({ ...runtimeState, sectionActionSelection: 1 }, 3, 1),
    );
    expect(navigationTypeScript.normalizeSectionActionSelection({ ...typeScriptState, sectionActionSelection: 99 }, 3)).toEqual({
      ...normalizeSectionActionSelection({ ...runtimeState, sectionActionSelection: 99 }, 3),
    });
    expect(navigationTypeScript.openModal(typeScriptState, { kind: "confirm", actionId: "status-update" })).toEqual(
      openModal(runtimeState, { kind: "confirm", actionId: "status-update" }),
    );
    expect(navigationTypeScript.closeModal({ ...typeScriptState, modal: { kind: "confirm", actionId: "status-update" } })).toEqual(
      closeModal({ ...runtimeState, modal: { kind: "confirm", actionId: "status-update" } }),
    );
  });

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

  it("renders the Models frame header with a right-aligned active-profile label", () => {
    const app = createRouteRenderApp();
    app.navigation.route = "model-profiles";

    const renderedLines = app.screen.render(80).map(stripAnsi);

    expect(renderedLines[0]).toContain("┌ Models ");
    expect(renderedLines[0]).toContain("Active profile: default");
    expect(renderedLines[0]).toMatch(/Active profile: default\s*$/);
    expect(renderedLines.join("\n")).not.toContain("Summary [ok]: 1 profile available");
  });

  it("renders Home body lines without a trailing right border suffix", () => {
    const renderedLines = renderHomeScreen(createNavigationState(), 60).map(stripAnsi);

    expect(renderedLines.slice(1, -1)).toSatisfy((lines) => lines.every((line) => line.startsWith("│ ") && !/\s*│$/.test(line)));
  });

  it("embeds the shortened arrow hint in the bottom frame line", () => {
    const renderedLines = renderHomeScreen(createNavigationState(), 60).map(stripAnsi);

    expect(renderedLines.at(-1)).toContain("└ ↑/↓ move ");
    expect(renderedLines.at(-1)).toContain(" Press q or Esc to exit ");
    expect(visibleWidth(renderedLines.at(-1))).toBe(60);
    expect(renderedLines.join("\n")).not.toContain("Use ↑/↓ to move the Home selection.");
    expect(renderedLines.join("\n")).not.toContain("Press h to return Home from any section.");
  });

  it("keeps non-Home frame footers within narrow widths for representative routes", () => {
    const app = createRouteRenderApp();

    for (const route of ["configuration", "status", "model-profiles"]) {
      app.navigation.route = route;

      for (const width of [20, 21, 22, 23, 24]) {
        const renderedLines = app.screen.render(width).map(stripAnsi);
        const footer = renderedLines.at(-1);

        expect(visibleWidth(footer)).toBeLessThanOrEqual(width);
        expect(footer).toMatch(/^└/);
        expect(footer).not.toContain("│");
      }
    }
  });

  it("preserves both non-Home footer hints when the frame is wide enough", () => {
    const app = createRouteRenderApp();
    app.navigation.route = "configuration";

    const renderedLines = app.screen.render(60).map(stripAnsi);
    const footer = renderedLines.at(-1);

    expect(footer).toContain("Press H to return home");
    expect(footer).toContain("Press q or Esc to exit");
    expect(visibleWidth(footer)).toBe(60);
  });
});

describe("createTuiApp", () => {
  it("imports scripts/tui.mjs without running the models CLI or printing config", () => {
    const result = spawnSync(process.execPath, ["-e", "await import('./scripts/tui.mjs')"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
  });

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
    expect(terminal.output).toContain("> Configuration");
    expect(terminal.output).toContain("  Status");
    expect(terminal.output).toContain("  Model Profiles");
    expect(terminal.output).not.toContain("[selected]");
    expect(terminal.output).not.toContain("Current route: home");
    expect(stripAnsi(terminal.output)).toContain("└ ↑/↓ move ");
    expect(stripAnsi(terminal.output)).toContain("Press q or Esc to exit");
    expect(terminal.output).toContain("Press Enter to open the selected section.");
    expect(stripAnsi(terminal.output)).toContain("Press (C)onfiguracion | (S)tatus | (M)odels");
    expect(terminal.output).not.toContain("Press h to return Home from any section.");
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
    expect(terminal.output).toContain("> Status");
    expect(terminal.output).not.toContain("[selected]");
  
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

  it("runs the global h fallback only after modal input declines it", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({ terminal, exit: () => {} });

    app.start();
    await flushTui();
    terminal.emitInput("s");
    await flushTui();
    app.navigation.modal = { kind: "output" };

    terminal.emitInput("h");
    await flushTui();

    expect(app.navigation).toMatchObject({ route: "status", modal: { kind: "output" } });

    app.navigation.modal = undefined;
    terminal.emitInput("h");
    await flushTui();

    expect(app.navigation.route).toBe("home");
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
