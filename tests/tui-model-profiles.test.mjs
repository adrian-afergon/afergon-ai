import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SUPPORTED_AGENTS } from "../scripts/lib/model-profiles.mjs";
import { getModelProfilesScreenState, saveAssignmentsForProfile } from "../scripts/lib/tui/model-profiles-adapter.mjs";
import * as modelProfilesScreenTypeScript from "../scripts/lib/tui/screens/model-profiles.ts";
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function createIsolatedModelsEnv(tempRoot) {
  return {
    HOME: path.join(tempRoot, "home"),
    XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
    AFERGON_AI_CONFIG_DIR: path.join(tempRoot, "config"),
  };
}

function writeModelConfig(env, value) {
  writeJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json"), value);
}

function createModelsActionExecutor(env) {
  return async ({ action }) => {
    const configPath = path.join(env.AFERGON_AI_CONFIG_DIR, "config.json");
    const config = fs.existsSync(configPath)
      ? readJson(configPath)
      : {
          version: 1,
          models: { activeProfile: null, profiles: {} },
        };
    const [, command, ...rest] = action.argv;

    if (command === "list") {
      const profiles = Object.keys(config.models.profiles).sort();
      return {
        ok: true,
        exitCode: 0,
        stdout: profiles.map((name) => `${name === config.models.activeProfile ? "*" : " "} ${name}`).join("\n"),
        stderr: "",
        timedOut: false,
      };
    }

    if (command === "show") {
      return {
        ok: true,
        exitCode: 0,
        stdout: `Active profile: ${config.models.activeProfile ?? "(none)"}`,
        stderr: "",
        timedOut: false,
      };
    }

    if (command === "profile" && rest[0] === "show") {
      return {
        ok: true,
        exitCode: 0,
        stdout: `Shown profile: ${rest[1]}`,
        stderr: "",
        timedOut: false,
      };
    }

    if (command === "switch") {
      config.models.activeProfile = rest[0];
      writeModelConfig(env, config);
      return {
        ok: true,
        exitCode: 0,
        stdout: `Switched active profile to '${rest[0]}'.`,
        stderr: "",
        timedOut: false,
      };
    }

    if (command === "set") {
      const positional = rest.filter((entry) => entry !== "--allow-unknown");
      const [agentName, modelName] = positional;
      const activeProfile = config.models.activeProfile;
      config.models.profiles[activeProfile][agentName] = modelName;
      writeModelConfig(env, config);
      return {
        ok: true,
        exitCode: 0,
        stdout: `Updated profile '${activeProfile}': ${agentName} -> ${modelName}`,
        stderr: "",
        timedOut: false,
      };
    }

    if (command === "profile" && rest[0] === "create") {
      config.models.profiles[rest[1]] = {};
      writeModelConfig(env, config);
      return {
        ok: true,
        exitCode: 0,
        stdout: `Created profile '${rest[1]}'.`,
        stderr: "",
        timedOut: false,
      };
    }

    if (command === "profile" && rest[0] === "delete") {
      delete config.models.profiles[rest[1]];
      writeModelConfig(env, config);
      return {
        ok: true,
        exitCode: 0,
        stdout: `Deleted profile '${rest[1]}'.`,
        stderr: "",
        timedOut: false,
      };
    }

    return {
      ok: false,
      exitCode: 1,
      stdout: "",
      stderr: `Unhandled action: ${action.argv.join(" ")}`,
      timedOut: false,
    };
  };
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

async function emitInput(terminal, data) {
  terminal.emitInput(data);
  await flushTui();
}

async function emitText(terminal, text) {
  for (const character of text) {
    await emitInput(terminal, character);
  }
}

async function submitFocusedModelEntry(terminal, modelText) {
  await emitText(terminal, modelText);
  await emitInput(terminal, "\u001b[B");
  await emitInput(terminal, "\r");
}

function buildBrowseRouteState({ navigation, activeProfile = "budget", focusedProfileName = "fallback", summaryDetail = "2 profile(s) available." } = {}) {
  return {
    title: "Model Profiles",
    summary: { state: "ok", detail: summaryDetail },
    activeProfile,
    configPath: "/tmp/config.json",
    profiles: [
      { name: "budget", isActive: activeProfile === "budget", isCreate: false, isFocused: focusedProfileName === "budget" },
      { name: "fallback", isActive: activeProfile === "fallback", isCreate: false, isFocused: focusedProfileName === "fallback" },
      { name: "* New Profile", isActive: false, isCreate: true, isFocused: focusedProfileName === "* New Profile" },
    ],
    assignments: [],
    browse: {
      mode: navigation?.modelProfiles?.mode ?? "browse",
      focusedProfileName,
      focusedProfile: {
        name: focusedProfileName,
        isActive: activeProfile === focusedProfileName,
        isCreate: focusedProfileName === "* New Profile",
        isFocused: true,
      },
      isCreateSelected: focusedProfileName === "* New Profile",
    },
    interactiveActions: [],
  };
}

function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

describe("getModelProfilesScreenState", () => {
  it("reports missing config with active-profile guidance and the current interactive-state shape", () => {
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
    expect(state).not.toHaveProperty("actions");
    expect(state.interactiveActions).toEqual([]);
  });

  it("reports the active profile, known profiles, and resolved assignments from isolated config fixtures", () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);

    writeModelConfig(env, {
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
      env,
    });

    expect(state.summary).toEqual(
      expect.objectContaining({
        state: "ok",
        detail: expect.stringContaining("2 profile(s) available"),
      }),
    );
    expect(state.activeProfile).toBe("budget");
    expect(state.profiles).toEqual([
      expect.objectContaining({ name: "budget", isActive: true, isCreate: false, isFocused: true }),
      expect.objectContaining({ name: "fallback", isActive: false, isCreate: false, isFocused: false }),
      expect.objectContaining({ name: "* New Profile", isActive: false, isCreate: true, isFocused: false }),
    ]);
    expect(state.assignments).toHaveLength(SUPPORTED_AGENTS.length);
    expect(state.browse.placeholderAssignments).toEqual(SUPPORTED_AGENTS);
    expect(state.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ agent: "afergon-ai", configured: "openai/gpt-5.5", effective: "openai/gpt-5.5", source: "explicit" }),
        expect.objectContaining({ agent: "afg-review", configured: "inherit", effective: "openai/gpt-5.5", source: "inherit" }),
        expect.objectContaining({ agent: "afg-debate", configured: "(unset)", effective: "openai/gpt-5.5", source: "implicit-inherit" }),
      ]),
    );
    expect(state.interactiveActions).toEqual([]);
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
  it("keeps the TypeScript model-profiles screen mirror in parity with the runtime .mjs module for browse mode", () => {
    const state = {
      title: "Model Profiles",
      configPath: "/tmp/config.json",
      summary: { state: "ok", detail: "2 profile(s) available." },
      profiles: [
        { name: "budget", isActive: true, isCreate: false, isFocused: true },
        { name: "fallback", isActive: false, isCreate: false, isFocused: false },
        { name: "* New Profile", isActive: false, isCreate: true, isFocused: false },
      ],
      assignments: [
        { agent: "afergon-ai", configured: "openai/gpt-5.5", effective: "openai/gpt-5.5", source: "explicit" },
        { agent: "afg-review", configured: "inherit", effective: "openai/gpt-5.5", source: "inherit" },
      ],
      browse: {
        mode: "browse",
        focusedProfileName: "budget",
        isCreateSelected: false,
      },
    };

    expect(modelProfilesScreenTypeScript.renderModelProfilesScreen(state, 120)).toEqual(
      renderModelProfilesScreen(state, 120),
    );
  });

  it("keeps the TypeScript model-profiles screen mirror in parity with the runtime .mjs module for sanitized assignment mode", () => {
    const state = {
      title: "Model\u001b[31m Profiles\u001b[0m",
      configPath: "/tmp/\u001b]2;owned\u0007config.json",
      summary: { state: "fail", detail: "Active \u009b31mprofile\u009b0m unavailable" },
      profiles: [{ name: "budget\u0007", isActive: true, isCreate: false, isFocused: true }],
      assignments: [
        { agent: "afergon-ai", configured: "\u001b[31mred\u001b[0m-model", effective: "tail\u009d2;owned\u0007", source: "explicit", isFocused: true },
      ],
      browse: {
        mode: "assignments",
        targetProfileName: "budget\u001b]2;owned\u0007\u001b[31m-red\u001b[0m",
      },
    };

    expect(
      modelProfilesScreenTypeScript.renderModelProfilesScreen(state, 160, {
        styleSelected: (line) => `\u001b[38;5;6m${line}\u001b[0m`,
        styleMuted: (line) => `\u001b[38;5;250m${line}\u001b[0m`,
      }),
    ).toEqual(
      renderModelProfilesScreen(state, 160, {
        styleSelected: (line) => `\u001b[38;5;6m${line}\u001b[0m`,
        styleMuted: (line) => `\u001b[38;5;250m${line}\u001b[0m`,
      }),
    );
  });

  it("keeps the TypeScript model-profiles screen mirror in parity with the runtime .mjs module for inline create browse mode", () => {
    const state = {
      title: "Model Profiles",
      configPath: "/tmp/config.json",
      summary: { state: "ok", detail: "1 profile(s) available." },
      profiles: [
        { name: "budget", isActive: true, isCreate: false, isFocused: false },
        { name: "* New Profile", isActive: false, isCreate: true, isFocused: true },
      ],
      assignments: [],
      browse: {
        mode: "browse",
        focusedProfileName: "* New Profile",
        isCreateSelected: true,
        inlineCreate: {
          value: "draft\u001b]2;owned\u0007",
          selection: "input",
          validationMessage: "Profile name \u001b[31mis required\u001b[0m",
        },
        placeholderAssignments: ["afergon-ai"],
      },
    };

    expect(
      modelProfilesScreenTypeScript.renderModelProfilesScreen(state, 120, {
        styleSelected: (line) => `\u001b[38;5;6m${line}\u001b[0m`,
        styleMuted: (line) => `\u001b[38;5;250m${line}\u001b[0m`,
      }),
    ).toEqual(
      renderModelProfilesScreen(state, 120, {
        styleSelected: (line) => `\u001b[38;5;6m${line}\u001b[0m`,
        styleMuted: (line) => `\u001b[38;5;250m${line}\u001b[0m`,
      }),
    );
  });

  it("keeps the TypeScript model-profiles screen mirror in parity with the runtime .mjs module for new-profile placeholder details", () => {
    const state = {
      title: "Model Profiles",
      configPath: "/tmp/config.json",
      summary: { state: "ok", detail: "0 profile(s) available." },
      profiles: [{ name: "* New Profile", isActive: false, isCreate: true, isFocused: true }],
      assignments: [],
      browse: {
        mode: "browse",
        focusedProfileName: "* New Profile",
        isCreateSelected: true,
        placeholderAssignments: ["afergon-ai", "afg-review\u001b[31m"],
      },
    };

    expect(
      modelProfilesScreenTypeScript.renderModelProfilesScreen(state, 120, {
        styleMuted: (line) => `\u001b[38;5;250m${line}\u001b[0m`,
      }),
    ).toEqual(
      renderModelProfilesScreen(state, 120, {
        styleMuted: (line) => `\u001b[38;5;250m${line}\u001b[0m`,
      }),
    );
  });

  it("renders browse mode with focused cursor, active profile checkboxes, and muted detail rows", () => {
    const lines = renderModelProfilesScreen(
      {
        title: "Model Profiles",
        summary: { state: "ok", detail: "2 profile(s) available." },
        activeProfile: "budget",
        profiles: [
          { name: "budget", isActive: true, isCreate: false, isFocused: true },
          { name: "fallback", isActive: false, isCreate: false, isFocused: false },
          { name: "* New Profile", isActive: false, isCreate: true, isFocused: false },
        ],
        assignments: [
          { agent: "afergon-ai", configured: "openai/gpt-5.5", effective: "openai/gpt-5.5", source: "explicit" },
          { agent: "afg-review", configured: "inherit", effective: "openai/gpt-5.5", source: "inherit" },
          { agent: "afg-debate", configured: "(unset)", effective: "openai/gpt-5.5", source: "implicit-inherit" },
        ],
        browse: { mode: "browse", focusedProfileName: "budget", isCreateSelected: false },
      },
      120,
      {
        styleMuted: (line) => `\u001b[38;5;250m${line}\u001b[0m`,
      },
    );

    const output = lines.join("\n");
    expect(output).toContain("Model Profiles");
    expect(output).toContain("Profile list");
    expect(output).toContain("> [X] budget");
    expect(output).toContain("  [ ] fallback");
    expect(output).toContain("  * New Profile");
    expect(output).toContain("\u001b[38;5;250mProfile Details\u001b[0m");
    expect(output).toContain("\u001b[38;5;250m- afergon-ai: configured=openai/gpt-5.5, effective=openai/gpt-5.5, source=explicit\u001b[0m");
    expect(output).toContain("\u001b[38;5;250m- afg-review: configured=inherit, effective=openai/gpt-5.5, source=inherit\u001b[0m");
    expect(output).toContain("\u001b[38;5;250m- afg-debate: configured=(unset), effective=openai/gpt-5.5, source=implicit-inherit\u001b[0m");
    expect(output).not.toContain("[selected]");
    expect(output).not.toContain("Supported actions");
    expect(output).not.toContain("Stable CLI surfaces");
    expect(output).not.toContain("Interactive notes");
    expect(output).not.toContain("Summary [ok]:");
    expect(output).not.toContain("Active profile: budget");
    expect(output).toContain("Keyboard help");
    expect(output).toContain("Use ↑/↓ to move the profile selection.");
    expect(output).toContain("Press Enter to switch or start the focused profile flow.");
  });

  it("renders the active marker independently from the focused row", () => {
    const output = renderModelProfilesScreen(
      {
        title: "Model Profiles",
        summary: { state: "ok", detail: "2 profile(s) available." },
        activeProfile: "budget",
        profiles: [
          { name: "budget", isActive: true, isCreate: false, isFocused: false },
          { name: "fallback", isActive: false, isCreate: false, isFocused: true },
          { name: "* New Profile", isActive: false, isCreate: true, isFocused: false },
        ],
        assignments: [],
        browse: { mode: "browse", focusedProfileName: "fallback", isCreateSelected: false },
      },
      120,
    ).join("\n");

    expect(output).toContain("  [X] budget");
    expect(output).toContain("> [ ] fallback");
    expect(output).not.toContain("> [X] budget");
  });

  it("renders assignment focus with a fixed cursor column and no selected suffix", () => {
    const output = renderModelProfilesScreen(
      {
        title: "Model Profiles",
        configPath: "/tmp/config.json",
        summary: { state: "ok", detail: "1 profile(s) available." },
        activeProfile: "budget",
        profiles: [{ name: "budget", isActive: true, isCreate: false, isFocused: true }],
        assignments: [
          { agent: "afergon-ai", configured: "openai/gpt-5.5", effective: "openai/gpt-5.5", source: "explicit", isFocused: false },
          { agent: "afg-review", configured: "inherit", effective: "openai/gpt-5.5", source: "inherit", isFocused: true },
        ],
        browse: { mode: "assignments", targetProfileName: "budget" },
      },
      160,
      { styleSelected: (line) => `\u001b[38;5;6m${line}\u001b[0m` },
    ).join("\n");

    expect(output).toContain("  afergon-ai: configured=openai/gpt-5.5");
    expect(output).toContain("\u001b[38;5;6m> afg-review: configured=inherit");
    expect(output).not.toContain("[selected]");
  });

  it("renders placeholder detail rows for the * New Profile sentinel row to preserve layout height", () => {
    const output = renderModelProfilesScreen(
      {
        title: "Model Profiles",
        summary: { state: "ok", detail: "2 profile(s) available." },
        activeProfile: "budget",
        profiles: [
          { name: "budget", isActive: true, isCreate: false, isFocused: false },
          { name: "fallback", isActive: false, isCreate: false, isFocused: false },
          { name: "* New Profile", isActive: false, isCreate: true, isFocused: true },
        ],
        assignments: [],
        browse: {
          mode: "browse",
          focusedProfileName: "* New Profile",
          isCreateSelected: true,
          placeholderAssignments: ["afergon-ai", "afg-review", "afg-debate"],
        },
      },
      120,
      {
        styleMuted: (line) => `\u001b[38;5;250m${line}\u001b[0m`,
      },
    ).join("\n");

    expect(output).toContain("> * New Profile");
    expect(output).toContain("Profile Details");
    expect(output).not.toContain("configured=");
    expect(output).toContain("\u001b[38;5;250m- afergon-ai: pending new profile assignment\u001b[0m");
    expect(output).toContain("\u001b[38;5;250m- afg-review: pending new profile assignment\u001b[0m");
    expect(output).toContain("\u001b[38;5;250m- afg-debate: pending new profile assignment\u001b[0m");
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
    };

    expect(() => renderModelProfilesScreen(state, 160)).not.toThrow();
    expect(renderModelProfilesScreen(state, 160).join("\n")).toContain(
      "Summary [fail]: Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'. Details: invalid JSON.",
    );
  });

  it("sanitizes terminal-control characters from model-profile screen rendering", () => {
    const output = renderModelProfilesScreen(
      {
        title: "Model Profiles",
        configPath: "/tmp/\u001b[31mconfig\u001b[0m.json",
        summary: { state: "ok", detail: "Active \u009b31mprofile\u009b0m ready" },
        activeProfile: "budget\u0007",
        profiles: [
          { name: "budget\u001b]2;owned\u0007", isActive: true, isFocused: true },
          { name: "fallback\u0000", isActive: false },
        ],
        assignments: [
          { agent: "afergon-ai", configured: "\u001b[31mred\u001b[0m-model", effective: "tail\u009d2;owned\u0007", source: "explicit" },
        ],
      },
      160,
      {
        styleSelected: (line) => `\u001b[38;5;6m${line}\u001b[0m`,
        styleMuted: (line) => `\u001b[38;5;250m${line}\u001b[0m`,
      },
    ).join("\n");

    expect(output).not.toContain("Active profile ready");
    expect(output).not.toContain("Active profile: budget?");
    expect(output).toContain("\u001b[38;5;6m> [X] budget\u001b[0m");
    expect(output).toContain("fallback?");
    expect(output).toContain("\u001b[38;5;250m- afergon-ai: configured=red-model, effective=tail, source=explicit\u001b[0m");
    expect(output).not.toContain("owned");
    expect(output).not.toContain("\u0000");
  });

  it("sanitizes the assignment placeholder target profile name", () => {
    const output = renderModelProfilesScreen(
      {
        title: "Model Profiles",
        configPath: "/tmp/config.json",
        summary: { state: "ok", detail: "1 profile(s) available." },
        activeProfile: "budget",
        profiles: [{ name: "budget", isActive: true, isCreate: false, isFocused: true }],
        assignments: [],
        browse: {
          mode: "assignments",
          targetProfileName: "budget\u001b]2;owned\u0007\u001b[31m-red\u001b[0m",
        },
      },
      160,
      { styleSelected: (line) => `\u001b[38;5;6m${line}\u001b[0m` },
    ).join("\n");

    expect(output).toContain("Target profile: budget-red");
    expect(output).not.toContain("owned");
    expect(output).not.toContain("\u001b]2;");
    expect(output).not.toContain("\u001b[31m");
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
        profiles: [
          { name: "budget", isActive: true, isCreate: false, isFocused: true },
          { name: "* New Profile", isActive: false, isCreate: true, isFocused: false },
        ],
        assignments: [{ agent: "afergon-ai", configured: "openai/gpt-5.5", effective: "openai/gpt-5.5", source: "explicit" }],
        browse: { mode: "browse", focusedProfileName: "budget", isCreateSelected: false },
        interactiveActions: [],
      }),
    });

    app.start();
    await flushTui();
    expect(stripAnsi(terminal.output)).toContain("Press (C)onfiguracion | (S)tatus | (M)odels");

    terminal.output = "";
    terminal.emitInput("m");
    await flushTui();

    expect(app.navigation.route).toBe("model-profiles");
    expect(terminal.output).toContain("Model Profiles");
    expect(terminal.output).toContain("Profile list");
    expect(terminal.output).toContain("> [X] budget");
    expect(stripAnsi(terminal.output)).toContain("Active profile: budget");
    expect(stripAnsi(terminal.output)).not.toContain("Summary [ok]: 1 profile(s) available.");

    terminal.output = "";
    terminal.emitInput("h");
    await flushTui();

    expect(app.navigation.route).toBe("home");
    expect(terminal.output).toContain("Home");
    expect(stripAnsi(terminal.output)).toContain("Press (C)onfiguracion | (S)tatus | (M)odels");
  });

  it("keeps Up/Down focused on profile rows and does not move section actions", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments }) =>
        saveAssignmentsForProfile(profileName, assignments, {
          env,
          validateModelAvailability: () => ({ status: "known", availableModels: ["openai/gpt-4.1"] }),
        }),
    });

    app.start();
    await flushTui();
    terminal.emitInput("m");
    await flushTui();

    terminal.emitInput("\u001b[B");
    await flushTui();
    expect(app.navigation.modelProfiles?.focusedProfileIndex).toBe(1);
    expect(app.navigation.sectionActionSelection).toBe(0);
    expect(terminal.output).toContain("> [ ] fallback");

    terminal.emitInput("\u001b[B");
    await flushTui();
    expect(app.navigation.modelProfiles?.focusedProfileIndex).toBe(2);
    expect(terminal.output).toContain("> * New Profile");
  });

  it("switches focused profiles with Enter while preserving delete confirmation, edit entry, and inline create entry", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    terminal.emitInput("m");
    await flushTui();

    terminal.emitInput("\u001b[B");
    await flushTui();

    terminal.output = "";
    terminal.emitInput(" ");
    await flushTui();
    expect(readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json")).models.activeProfile).toBe("budget");
    expect(app.navigation.modal).toBeUndefined();
    expect(terminal.output).toBe("");

    terminal.output = "";
    terminal.emitInput("\r");
    await flushTui();
    expect(app.navigation.modelProfiles?.focusedProfileIndex).toBe(1);
    expect(terminal.output).not.toContain("Confirmation");
    expect(app.navigation.modal).toBeUndefined();
    expect(readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json")).models.activeProfile).toBe("fallback");
    expect(terminal.output).toContain("> [X] fallback");
    expect(terminal.output).toContain("  [ ] budget");
    expect(terminal.output).not.toContain("Output [ok]");
    expect(terminal.output).not.toContain("Press Enter or Esc to close this output panel.");

    terminal.output = "";
    terminal.emitInput("\u001b[A");
    await flushTui();
    expect(app.navigation.modelProfiles?.focusedProfileIndex).toBe(0);
    expect(terminal.output).toContain("> [ ] budget");
    expect(terminal.output).toContain("  [X] fallback");

    terminal.output = "";
    terminal.emitInput("\u001b[3~");
    await flushTui();
    expect(terminal.output).toContain("The selected profile will be deleted permanently and cannot be recovered.");
    expect(terminal.output).toContain("> Submit / confirm");
    expect(terminal.output).toContain("  Cancel");
    expect(terminal.output).not.toContain("Expected text: budget");
    expect(terminal.output).toContain("afergon-ai models profile delete budget");

    terminal.emitInput("\u001b");
    await flushTui();
    terminal.emitInput("\u001b[B");
    await flushTui();
    terminal.output = "";
    terminal.emitInput("u");
    await flushTui();
    expect(app.navigation.modelProfiles?.mode).toBe("assignments");
    expect(app.navigation.modelProfiles?.targetProfileName).toBe("fallback");

    terminal.emitInput("\u001b");
    await flushTui();
    terminal.emitInput("n");
    await flushTui();
    expect(terminal.output).toContain("> Profile name: (empty)");
    expect(terminal.output).toContain("  Cancel");
  });

  it("shows an output panel when an immediate profile switch fails", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => buildBrowseRouteState({ navigation }),
      executeAction: async ({ action }) => ({
        ok: false,
        exitCode: 1,
        stdout: "",
        stderr: `failed to switch ${action.argv.at(-1)}`,
        timedOut: false,
      }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");

    terminal.output = "";
    await emitInput(terminal, "\r");

    expect(app.navigation.modal?.kind).toBe("output");
    expect(terminal.output).toContain("Output [fail]");
    expect(terminal.output).toContain("failed to switch fallback");
    expect(terminal.output).toContain("Press Enter or Esc to close this output panel.");
  });

  it("shows an output panel when an immediate profile switch succeeds with degraded refresh guidance", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => buildBrowseRouteState({ navigation }),
      executeAction: async ({ action }) => ({
        ok: true,
        exitCode: 0,
        stdout: `Switched active profile to '${action.argv.at(-1)}'.\nSaved config. OpenCode refresh timed out after 500ms. Run 'afergon-ai update' to retry the host registration refresh.`,
        stderr: "",
        timedOut: false,
      }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");

    terminal.output = "";
    await emitInput(terminal, "\r");

    expect(app.navigation.modal?.kind).toBe("output");
    expect(terminal.output).toContain("Output [ok]");
    expect(terminal.output).toContain("OpenCode refresh timed out after 500ms");
    expect(terminal.output).toContain("Run 'afergon-ai update'");
  });

  it("shows an output panel when an immediate profile switch succeeds with registrar conflict guidance on stdout", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => buildBrowseRouteState({ navigation }),
      executeAction: async ({ action }) => ({
        ok: true,
        exitCode: 0,
        stdout: `Switched active profile to '${action.argv.at(-1)}'.\nConflict: agent 'afergon-ai' already exists in opencode.json and does not look managed by afergon-ai.\n  OpenCode: kept existing non-managed agent definition(s): afergon-ai`,
        stderr: "",
        timedOut: false,
      }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");

    terminal.output = "";
    await emitInput(terminal, "\r");

    expect(app.navigation.modal?.kind).toBe("output");
    expect(terminal.output).toContain("Output [ok]");
    expect(terminal.output).toContain("Conflict: agent 'afergon-ai' already exists in opencode.json");
    expect(terminal.output).toContain("OpenCode: kept existing non-managed agent definition(s): afergon-ai");
  });

  it("shows an output panel when an immediate profile switch succeeds with stderr warnings", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => buildBrowseRouteState({ navigation }),
      executeAction: async ({ action }) => ({
        ok: true,
        exitCode: 0,
        stdout: `Switched active profile to '${action.argv.at(-1)}'.`,
        stderr: "warning: OpenCode refresh was not refreshed for the current session",
        timedOut: false,
      }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");

    terminal.output = "";
    await emitInput(terminal, "\r");

    expect(app.navigation.modal?.kind).toBe("output");
    expect(terminal.output).toContain("Output [ok]");
    expect(terminal.output).toContain("warning: OpenCode refresh was not refreshed for the current session");
  });

  it("sanitizes the assignment placeholder after pressing U on a malicious profile name", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget\u001b]2;owned\u0007",
        profiles: {
          "budget\u001b]2;owned\u0007": { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    terminal.emitInput("m");
    await flushTui();

    terminal.output = "";
    terminal.emitInput("u");
    await flushTui();

    expect(app.navigation.modelProfiles?.mode).toBe("assignments");
    expect(terminal.output).toContain("Assignment editor");
    expect(terminal.output).toContain("Target profile: budget");
    expect(terminal.output).not.toContain("owned");
    expect(terminal.output).not.toContain("\u001b]2;");
  });

  it("creates a new profile inline without confirmation and focuses it after sorted refresh", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "\u001b[B");

    terminal.output = "";
    await emitInput(terminal, " ");
    expect(terminal.output).toBe("");

    await emitInput(terminal, "\r");
    expect(terminal.output).toContain("> Profile name: (empty)");
    expect(terminal.output).toContain("  Cancel");

    await emitInput(terminal, "a");
    await emitInput(terminal, "l");
    await emitInput(terminal, "p");
    await emitInput(terminal, "h");
    await emitInput(terminal, "a");
    await emitInput(terminal, "\r");

    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(app.navigation.modelProfiles?.focusedProfileIndex).toBe(0);
    expect(app.navigation.modelProfiles?.targetProfileName).toBeUndefined();
    expect(app.navigation.modal).toBeUndefined();
    expect(terminal.output).toContain("> [ ] alpha");
    expect(terminal.output).toContain("  [X] budget");
    expect(terminal.output).toContain("  * New Profile");
    expect(terminal.output).not.toContain("Assignment editor");
    expect(readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json")).models.profiles.alpha).toBeDefined();
  });

  it("shows an inline validation message and keeps state unchanged when create-name submit is empty", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "\u001b[B");

    terminal.output = "";
    await emitInput(terminal, "\r");
    await emitInput(terminal, "\r");

    expect(app.navigation.modal).toBeUndefined();
    expect(terminal.output).toContain("Profile name is required");
    expect(terminal.output).toContain("> Profile name: (empty)");
    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(app.navigation.modelProfiles?.createProfileName).toBe("");
    expect(readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json")).models.profiles.draft).toBeUndefined();
  });

  it("cancels inline profile creation from the Cancel row", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "\r");
    await emitText(terminal, "draft");

    terminal.output = "";
    await emitInput(terminal, "\u001b[B");
    expect(terminal.output).toContain("Profile name: draft");

    terminal.output = "";
    await emitInput(terminal, "\r");

    expect(app.navigation.modelProfiles?.createProfileName).toBeUndefined();
    expect(terminal.output).toContain("> * New Profile");
    expect(terminal.output).not.toContain("Profile name: draft");
    expect(readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json")).models.profiles.draft).toBeUndefined();
  });

  it("shows a bounded output panel when first-profile create succeeds with degraded refresh guidance on stdout", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => ({
        title: "Model Profiles",
        summary: { state: "warn", detail: "No named profiles are available yet." },
        activeProfile: navigation?.modelProfiles?.targetProfileName ?? "(none)",
        configPath: "/tmp/config.json",
        profiles: [{ name: "* New Profile", isActive: false, isCreate: true, isFocused: true }],
        assignments: [],
        browse: {
          mode: navigation?.modelProfiles?.mode ?? "browse",
          targetProfileName: navigation?.modelProfiles?.targetProfileName,
          inlineCreate: navigation?.modelProfiles?.createProfileName !== undefined
            ? {
                value: navigation.modelProfiles.createProfileName,
                selection: navigation.modelProfiles.createProfileSelection ?? "input",
                validationMessage: navigation.modelProfiles.createProfileValidation,
              }
            : undefined,
          focusedProfileName: "* New Profile",
          focusedProfile: { name: "* New Profile", isActive: false, isCreate: true, isFocused: true },
          isCreateSelected: true,
          placeholderAssignments: SUPPORTED_AGENTS,
        },
        interactiveActions: [],
      }),
      executeAction: async ({ action }) => ({
        ok: true,
        exitCode: 0,
        stdout: `Created profile '${action.targetProfileName}'.\nSaved config. OpenCode refresh timed out after 500ms. Run 'afergon-ai update' to retry the host registration refresh.`,
        stderr: "",
        timedOut: false,
      }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");

    terminal.output = "";
    await emitInput(terminal, "\r");
    await emitText(terminal, "draft");
    await emitInput(terminal, "\r");

    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(app.navigation.modelProfiles?.targetProfileName).toBeUndefined();
    expect(app.navigation.modal?.kind).toBe("output");
    expect(terminal.output).toContain("Output [ok]");
    expect(terminal.output).toContain("OpenCode refresh timed out after 500ms");
    expect(terminal.output).toContain("Run 'afergon-ai update' to retry the host registration refresh.");
  });

  it("shows a bounded output panel when first-profile create succeeds with warning guidance on stderr", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => ({
        title: "Model Profiles",
        summary: { state: "warn", detail: "No named profiles are available yet." },
        activeProfile: navigation?.modelProfiles?.targetProfileName ?? "(none)",
        configPath: "/tmp/config.json",
        profiles: [{ name: "* New Profile", isActive: false, isCreate: true, isFocused: true }],
        assignments: [],
        browse: {
          mode: navigation?.modelProfiles?.mode ?? "browse",
          targetProfileName: navigation?.modelProfiles?.targetProfileName,
          inlineCreate: navigation?.modelProfiles?.createProfileName !== undefined
            ? {
                value: navigation.modelProfiles.createProfileName,
                selection: navigation.modelProfiles.createProfileSelection ?? "input",
                validationMessage: navigation.modelProfiles.createProfileValidation,
              }
            : undefined,
          focusedProfileName: "* New Profile",
          focusedProfile: { name: "* New Profile", isActive: false, isCreate: true, isFocused: true },
          isCreateSelected: true,
          placeholderAssignments: SUPPORTED_AGENTS,
        },
        interactiveActions: [],
      }),
      executeAction: async ({ action }) => ({
        ok: true,
        exitCode: 0,
        stdout: `Created profile '${action.targetProfileName}'.`,
        stderr: "warning: OpenCode refresh was not refreshed for the current session",
        timedOut: false,
      }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");

    terminal.output = "";
    await emitInput(terminal, "\r");
    await emitText(terminal, "draft");
    await emitInput(terminal, "\r");

    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(app.navigation.modelProfiles?.targetProfileName).toBeUndefined();
    expect(app.navigation.modal?.kind).toBe("output");
    expect(terminal.output).toContain("Output [ok]");
    expect(terminal.output).toContain("warning: OpenCode refresh was not refreshed for the current session");
  });

  it("stages manual assignment edits in assignment mode and saves them only after S", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "\u001b[B");

    terminal.output = "";
    await emitInput(terminal, "u");
    expect(app.navigation.modelProfiles?.mode).toBe("assignments");
    expect(app.navigation.modelProfiles?.targetProfileName).toBe("fallback");

    await emitInput(terminal, "\u001b[B");
    expect(app.navigation.modelProfiles?.focusedAgentIndex).toBe(1);
    expect(terminal.output).toContain(`> ${SUPPORTED_AGENTS[1]}:`);
    expect(terminal.output).toContain(`  ${SUPPORTED_AGENTS[0]}:`);

    terminal.output = "";
    await emitInput(terminal, "\r");
    expect(terminal.output).toContain(`Set model for ${SUPPORTED_AGENTS[1]}`);

    await submitFocusedModelEntry(terminal, "openai/gpt-4.1");

    const stagedOnlyConfig = readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(stagedOnlyConfig.models.profiles.fallback[SUPPORTED_AGENTS[1]]).toBeUndefined();
    expect(app.navigation.modelProfiles?.stagedAssignments?.[SUPPORTED_AGENTS[1]]).toBe("openai/gpt-4.1");
    expect(terminal.output).toContain(`configured=openai/gpt-4.1`);

    await emitInput(terminal, "s");
    await flushTui();

    const savedConfig = readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(savedConfig.models.activeProfile).toBe("budget");
    expect(savedConfig.models.profiles.fallback[SUPPORTED_AGENTS[1]]).toBe("openai/gpt-4.1");
    expect(savedConfig.models.profiles.budget[SUPPORTED_AGENTS[1]]).toBeUndefined();
  });

  it("shows a validation message and does not save when assignment model submit is empty", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "u");

    terminal.output = "";
    await emitInput(terminal, "\r");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "\r");

    expect(app.navigation.modal?.kind).toBe("form");
    expect(terminal.output).toContain("Model is required");
    expect(app.navigation.modelProfiles?.mode).toBe("assignments");
    expect(app.navigation.modelProfiles?.stagedAssignments ?? {}).toEqual({});
    expect(readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json")).models.profiles.fallback[SUPPORTED_AGENTS[0]]).toBe("openai/gpt-5.4");
  });

  it("ignores typed text in delete confirmation and waits for submit", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const executeAction = vi.fn(createModelsActionExecutor(env));
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction,
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");

    terminal.output = "";
    await emitInput(terminal, "\u001b[3~");
    await emitText(terminal, "nope");

    expect(app.navigation.modal?.kind).toBe("confirm");
    expect(terminal.output).toContain("The selected profile will be deleted permanently and cannot be recovered.");
    expect(terminal.output).not.toContain("Typed text");
    expect(terminal.output).not.toContain("nope");
    expect(executeAction).not.toHaveBeenCalled();
    expect(readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json")).models.profiles.budget).toBeDefined();
  });

  it("opens delete confirmation from D or d on existing profiles only", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const executeAction = vi.fn(createModelsActionExecutor(env));
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction,
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");

    terminal.output = "";
    await emitInput(terminal, "D");

    expect(app.navigation.modal?.kind).toBe("confirm");
    expect(terminal.output).toContain("The selected profile will be deleted permanently and cannot be recovered.");
    expect(terminal.output).toContain("> Submit / confirm");
    expect(terminal.output).toContain("  Cancel");
    expect(terminal.output).not.toContain("Expected text: budget");
    expect(terminal.output.split("\n").findIndex((line) => line.includes("cannot be recovered"))).toBeLessThan(
      terminal.output.split("\n").findIndex((line) => line.startsWith("└")),
    );
    expect(executeAction).not.toHaveBeenCalled();

    await emitInput(terminal, "\u001b");
    await emitInput(terminal, "\u001b[B");
    terminal.output = "";
    await emitInput(terminal, "d");

    expect(app.navigation.modal?.kind).toBe("confirm");
    expect(terminal.output).toContain("The selected profile will be deleted permanently and cannot be recovered.");
    expect(terminal.output).not.toContain("Expected text: fallback");
    expect(executeAction).not.toHaveBeenCalled();

    await emitInput(terminal, "\u001b[B");
    expect(terminal.output).toContain("> Cancel");
    await emitInput(terminal, "\r");
    expect(app.navigation.modal).toBeUndefined();
    expect(executeAction).not.toHaveBeenCalled();
    await emitInput(terminal, "\u001b[B");
    expect(app.navigation.modelProfiles?.focusedProfileIndex).toBe(2);

    terminal.output = "";
    await emitInput(terminal, "D");

    expect(app.navigation.modal).toBeUndefined();
    expect(executeAction).not.toHaveBeenCalled();
    expect(readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json")).models.profiles).toEqual({
      budget: { "afergon-ai": "openai/gpt-5.5" },
      fallback: { "afergon-ai": "openai/gpt-5.4" },
    });
  });

  it("keeps typing d into the inline create profile name instead of opening delete", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
        },
      },
    });

    const executeAction = vi.fn(createModelsActionExecutor(env));
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction,
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "n");

    terminal.output = "";
    await emitInput(terminal, "d");

    expect(app.navigation.modal).toBeUndefined();
    expect(app.navigation.modelProfiles?.createProfileName).toBe("d");
    expect(terminal.output).toContain("> Profile name: d");
    expect(executeAction).not.toHaveBeenCalled();
  });

  it("deletes the focused profile after submit confirmation and refreshes the browse state", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments }) => saveAssignmentsForProfile(profileName, assignments, { env }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");

    terminal.output = "";
    await emitInput(terminal, "\u001b[3~");
    expect(terminal.output).toContain("afergon-ai models profile delete budget");

    terminal.output = "";
    await emitInput(terminal, "\r");

    const config = readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(config.models.profiles.budget).toBeUndefined();
    expect(app.navigation.modal).toBeUndefined();
    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(app.navigation.modelProfiles?.focusedProfileIndex).toBe(0);
    expect(terminal.output).not.toContain("Output [ok]");
    expect(terminal.output).not.toContain("Deleted profile 'budget'.");
    expect(terminal.output).toContain("Active profile: ");
    expect(stripAnsi(terminal.output)).toContain("Active profile: (none)");
    expect(terminal.output).toContain("> [ ] fallback");
    expect(terminal.output).toContain("  * New Profile");
    expect(stripAnsi(terminal.output)).not.toContain("budget");
  });

  it("reapplies managed host registrations when saving staged edits for the active profile", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    const refreshActiveModelProfile = vi.fn();
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      refreshActiveModelProfile,
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments, refreshActiveProfile }) =>
        saveAssignmentsForProfile(profileName, assignments, { env, refreshActiveProfile }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "u");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "\r");
    await submitFocusedModelEntry(terminal, "inherit");
    await emitInput(terminal, "s");
    await flushTui();

    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(refreshActiveModelProfile).toHaveBeenCalledTimes(1);
    expect(readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json")).models.profiles.budget[SUPPORTED_AGENTS[1]]).toBe("inherit");
    expect(app.navigation.modal).toBeUndefined();
    expect(terminal.output).not.toContain("Output [ok]");
  });

  it("shows a bounded output panel when saving staged edits for the active profile returns degraded refresh guidance", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    const refreshActiveModelProfile = vi.fn(() => ({
      status: "degraded",
      stdout: "Saved config. OpenCode refresh timed out after 500ms.",
      stderr: "Run 'afergon-ai update' to retry the host registration refresh.",
    }));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      refreshActiveModelProfile,
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments, refreshActiveProfile }) =>
        saveAssignmentsForProfile(profileName, assignments, {
          env,
          refreshActiveProfile,
          validateModelAvailability: () => ({ status: "known", availableModels: ["openai/gpt-5.5", "openai/gpt-5.4-mini"] }),
        }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "u");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "\r");
    await submitFocusedModelEntry(terminal, "openai/gpt-4.1-mini");

    terminal.output = "";
    await emitInput(terminal, "s");

    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(app.navigation.modal?.kind).toBe("output");
    expect(terminal.output).toContain("Output [ok]");
    expect(terminal.output).toContain("OpenCode refresh timed out after 500ms");
    expect(terminal.output).toContain("Run 'afergon-ai update' to retry the host registration refresh.");
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("shows a bounded output panel when active-profile assignment save gets registrar warning stdout with exit-0 status", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    const refreshActiveModelProfile = vi.fn(() => ({
      status: "clean",
      stdout: "OpenCode: warning: missing managed agent file(s): afergon-ai.md\nRun 'afergon-ai update' or 'afergon-ai init --opencode' to repair.",
      stderr: "",
    }));
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      refreshActiveModelProfile,
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments, refreshActiveProfile }) =>
        saveAssignmentsForProfile(profileName, assignments, {
          env,
          refreshActiveProfile,
          validateModelAvailability: () => ({ status: "known", availableModels: ["openai/gpt-5.5", "openai/gpt-4.1-mini"] }),
        }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "u");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "\r");
    await submitFocusedModelEntry(terminal, "openai/gpt-4.1-mini");

    terminal.output = "";
    await emitInput(terminal, "s");

    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(app.navigation.modal?.kind).toBe("output");
    expect(terminal.output).toContain("Output [ok]");
    expect(terminal.output).toContain("OpenCode: warning: missing managed agent file(s): afergon-ai.md");
    expect(terminal.output).toContain("Run 'afergon-ai update' or 'afergon-ai init --opencode' to repair.");
  });

  it("shows a bounded output panel when active-profile assignment save gets registrar conflict guidance with exit-0 status", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    const refreshActiveModelProfile = vi.fn(() => ({
      status: "clean",
      stdout: "Conflict: agent 'afergon-ai' already exists in opencode.json and does not look managed by afergon-ai.\n  OpenCode: kept existing non-managed agent definition(s): afergon-ai",
      stderr: "",
    }));
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      refreshActiveModelProfile,
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
      saveModelProfileAssignments: ({ profileName, assignments, refreshActiveProfile }) =>
        saveAssignmentsForProfile(profileName, assignments, {
          env,
          refreshActiveProfile,
          validateModelAvailability: () => ({ status: "known", availableModels: ["openai/gpt-5.5", "openai/gpt-4.1-mini"] }),
        }),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "u");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "\r");
    await emitInput(terminal, "o");
    await emitInput(terminal, "p");
    await emitInput(terminal, "e");
    await emitInput(terminal, "n");
    await emitInput(terminal, "a");
    await emitInput(terminal, "i");
    await emitInput(terminal, "/");
    await emitInput(terminal, "g");
    await emitInput(terminal, "p");
    await emitInput(terminal, "t");
    await emitInput(terminal, "-");
    await emitInput(terminal, "4");
    await emitInput(terminal, ".");
    await emitInput(terminal, "1");
    await emitInput(terminal, "-");
    await emitInput(terminal, "m");
    await emitInput(terminal, "i");
    await emitInput(terminal, "n");
    await emitInput(terminal, "i");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "\r");

    terminal.output = "";
    await emitInput(terminal, "s");

    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(app.navigation.modal?.kind).toBe("output");
    expect(terminal.output).toContain("Output [ok]");
    expect(terminal.output).toContain("Conflict: agent 'afergon-ai' already exists in opencode.json");
    expect(terminal.output).toContain("OpenCode: kept existing non-managed agent definition(s): afergon-ai");
  });

  it("drops staged assignment edits when Esc exits assignment mode", async () => {
    const tempRoot = makeTempRoot();
    const env = createIsolatedModelsEnv(tempRoot);
    writeModelConfig(env, {
      version: 1,
      models: {
        activeProfile: "budget",
        profiles: {
          budget: { "afergon-ai": "openai/gpt-5.5" },
          fallback: { "afergon-ai": "openai/gpt-5.4" },
        },
      },
    });

    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadModelProfilesScreenState: ({ navigation }) => getModelProfilesScreenState({ cwd: tempRoot, env, navigation }),
      executeAction: createModelsActionExecutor(env),
    });

    app.start();
    await flushTui();
    await emitInput(terminal, "m");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "u");
    await emitInput(terminal, "\r");
    await emitInput(terminal, "i");
    await emitInput(terminal, "n");
    await emitInput(terminal, "h");
    await emitInput(terminal, "e");
    await emitInput(terminal, "r");
    await emitInput(terminal, "i");
    await emitInput(terminal, "t");
    await emitInput(terminal, "\u001b[B");
    await emitInput(terminal, "\r");

    expect(app.navigation.modelProfiles?.stagedAssignments?.[SUPPORTED_AGENTS[0]]).toBe("inherit");

    await emitInput(terminal, "\u001b");

    const savedConfig = readJson(path.join(env.AFERGON_AI_CONFIG_DIR, "config.json"));
    expect(app.navigation.modelProfiles?.mode).toBe("browse");
    expect(app.navigation.modelProfiles?.stagedAssignments).toEqual({});
    expect(savedConfig.models.profiles.fallback[SUPPORTED_AGENTS[0]]).toBe("openai/gpt-5.4");
  });
});
