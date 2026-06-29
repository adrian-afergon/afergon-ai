import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { getModelProfilesScreenState } from "../scripts/lib/tui/model-profiles-adapter.mjs";
import { renderModelProfilesScreen } from "../scripts/lib/tui/screens/model-profiles.mjs";
import { createTuiApp } from "../scripts/tui.mjs";

const tempRoots = [];

afterEach(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function makeTempRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-model-profiles-tui-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

class FakeTerminal {
  constructor() {
    this.columns = 100;
    this.rows = 30;
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

describe("getModelProfilesScreenState", () => {
  it("reports missing config with active-profile guidance and only stable CLI-equivalent actions", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
    };

    const state = getModelProfilesScreenState({ cwd: tempRoot, env });

    expect(state.title).toBe("Model Profiles");
    expect(state.activeProfile).toBe("(none)");
    expect(state.summary.state).toBe("warn");
    expect(state.summary.detail).toContain("No afergon-ai model config exists yet");
    expect(state.actions).toEqual([
      expect.objectContaining({ id: "models", label: "afergon-ai models", argv: ["models"] }),
    ]);
    expect(state.supportedActions).toEqual([
      expect.objectContaining({ label: "Review current profile details", command: "afergon-ai models" }),
      expect.objectContaining({ label: "Create, switch, or delete profiles", command: undefined }),
      expect.objectContaining({ label: "Set agent-specific models", command: undefined }),
    ]);
  });

  it("reports the active profile, known profiles, and resolved assignments from isolated config fixtures", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");

    writeJson(path.join(xdgHome, "afergon-ai", "config.json"), {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: {
            "afergon-ai": "openai/gpt-5.5",
            "afg-review": "inherit",
          },
          fallback: {
            "afergon-ai": "openai/gpt-5.4",
          },
        },
      },
    });

    const state = getModelProfilesScreenState({
      cwd: tempRoot,
      env: {
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
      },
    });

    expect(state.summary).toEqual(
      expect.objectContaining({
        state: "ok",
        detail: expect.stringContaining("2 profile(s) available"),
      }),
    );
    expect(state.activeProfile).toBe("budget");
    expect(state.profiles).toEqual([
      expect.objectContaining({ name: "budget", isActive: true }),
      expect.objectContaining({ name: "fallback", isActive: false }),
    ]);
    expect(state.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ agent: "afergon-ai", configured: "openai/gpt-5.5", effective: "openai/gpt-5.5", source: "explicit" }),
        expect.objectContaining({ agent: "afg-review", configured: "inherit", effective: "openai/gpt-5.5", source: "inherit" }),
      ]),
    );
  });

  it("returns a renderable fail state for invalid JSON config with repair guidance and root-cause detail", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const configDir = path.join(xdgHome, "afergon-ai");

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), "{ invalid json\n");

    const state = getModelProfilesScreenState({
      cwd: tempRoot,
      env: {
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
      },
    });

    expect(state.summary).toEqual(
      expect.objectContaining({
        state: "fail",
        detail: expect.stringContaining("Repair the file or move it aside"),
      }),
    );
    expect(state.summary.detail).toContain("rerun 'afergon-ai models show'");
    expect(state.summary.detail).toContain("invalid JSON");
    expect(state.profiles).toEqual([]);
    expect(state.assignments).toEqual([]);
  });

  it("returns a renderable fail state for invalid model config shape with repair guidance and root-cause detail", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");

    writeJson(path.join(xdgHome, "afergon-ai", "config.json"), {
      version: 1,
      models: {
        activeProfile: 42,
        profiles: {},
      },
    });

    const state = getModelProfilesScreenState({
      cwd: tempRoot,
      env: {
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
      },
    });

    expect(state.summary).toEqual(
      expect.objectContaining({
        state: "fail",
        detail: expect.stringContaining("Repair the file or move it aside"),
      }),
    );
    expect(state.summary.detail).toContain("rerun 'afergon-ai models show'");
    expect(state.summary.detail).toContain("models.activeProfile must be a string or null");
    expect(state.profiles).toEqual([]);
    expect(state.assignments).toEqual([]);
  });
});

describe("renderModelProfilesScreen", () => {
  it("renders active profile state, supported profile actions, and only stable CLI-equivalent commands", () => {
    const lines = renderModelProfilesScreen(
      {
        title: "Model Profiles",
        summary: { state: "ok", detail: "2 profile(s) available." },
        activeProfile: "budget",
        profiles: [
          { name: "budget", isActive: true },
          { name: "fallback", isActive: false },
        ],
        assignments: [
          { agent: "afergon-ai", configured: "openai/gpt-5.5", effective: "openai/gpt-5.5", source: "explicit" },
          { agent: "afg-review", configured: "inherit", effective: "openai/gpt-5.5", source: "inherit" },
        ],
        actions: [{ id: "models", label: "afergon-ai models", argv: ["models"], description: "Manage model profiles from the CLI." }],
        supportedActions: [
          { label: "Review current profile details", detail: "Inspect the active profile and resolved assignments.", command: "afergon-ai models" },
          { label: "Create, switch, or delete profiles", detail: "Use the CLI when you need to change profile membership." },
        ],
      },
      120,
    );

    const output = lines.join("\n");
    expect(output).toContain("Model Profiles");
    expect(output).toContain("Active profile: budget");
    expect(output).toContain("budget [active]");
    expect(output).toContain("fallback");
    expect(output).toContain("afergon-ai: configured=openai/gpt-5.5, effective=openai/gpt-5.5, source=explicit");
    expect(output).toContain("afg-review: configured=inherit, effective=openai/gpt-5.5, source=inherit");
    expect(output).toContain("CLI equivalent: afergon-ai models");
    expect(output).toContain("Keyboard help");
    expect(output).toContain("State labels use [ok], [warn], and [fail] text markers where applicable.");
    expect(output).not.toContain("afergon-ai models switch");
  });

  it("renders a fail state without throwing", () => {
    const state = {
      title: "Model Profiles",
      configPath: "/tmp/config.json",
      summary: {
        state: "fail",
        detail:
          "Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'. Details: invalid JSON.",
      },
      activeProfile: "(unavailable)",
      profiles: [],
      assignments: [],
      actions: [{ id: "models", label: "afergon-ai models", argv: ["models"], description: "Manage model profiles from the CLI." }],
      supportedActions: [
        { label: "Review current profile details", detail: "Inspect the active profile and resolved assignments.", command: "afergon-ai models" },
      ],
    };

    expect(() => renderModelProfilesScreen(state, 160)).not.toThrow();
    expect(renderModelProfilesScreen(state, 160).join("\n")).toContain(
      "Summary [fail]: Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'. Details: invalid JSON.",
    );
  });
});

describe("createTuiApp model-profiles route", () => {
  it("navigates from Home to Model Profiles and back with discoverable keyboard shortcuts", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: () => ({
        title: "Model Profiles",
        summary: { state: "ok", detail: "1 profile(s) available." },
        activeProfile: "budget",
        profiles: [{ name: "budget", isActive: true }],
        assignments: [{ agent: "afergon-ai", configured: "openai/gpt-5.5", effective: "openai/gpt-5.5", source: "explicit" }],
        actions: [{ id: "models", label: "afergon-ai models", argv: ["models"], description: "Manage model profiles from the CLI." }],
        supportedActions: [{ label: "Review current profile details", detail: "Inspect the active profile.", command: "afergon-ai models" }],
      }),
    });

    app.start();
    await flushTui();
    expect(terminal.output).toContain("Press m for Model Profiles");

    terminal.output = "";
    terminal.emitInput("m");
    await flushTui();

    expect(app.navigation.route).toBe("model-profiles");
    expect(terminal.output).toContain("Model Profiles");
    expect(terminal.output).toContain("Active profile: budget");
    expect(terminal.output).toContain("afergon-ai models");

    terminal.output = "";
    terminal.emitInput("h");
    await flushTui();

    expect(app.navigation.route).toBe("home");
    expect(terminal.output).toContain("Home");
    expect(terminal.output).toContain("Press m for Model Profiles");
  });
});
