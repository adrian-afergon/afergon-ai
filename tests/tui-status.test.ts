// This parity suite retains imports of the authoritative MJS runtime during Phase 2.
// @ts-nocheck
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createActionDefinition } from "../dist/scripts/lib/tui/actions/definitions.js";
import { buildCommandArgv } from "../dist/scripts/lib/tui/command-manifest.js";
import * as configStatusAdapterTypeScript from "../scripts/lib/tui/config-status-adapter.ts";
import { getStatusScreenState } from "../dist/scripts/lib/tui/config-status-adapter.js";
import * as statusScreenTypeScript from "../scripts/lib/tui/screens/status.ts";
import { renderStatusScreen } from "../dist/scripts/lib/tui/screens/status.js";
import { createTuiApp } from "../scripts/tui.js";

const tempRoots = [];

afterEach(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function makeTempRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-status-tui-test-"));
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

function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

function captureBuildArgvBehavior(action, inputProvided, input) {
  if (typeof action.buildArgv !== "function") {
    return undefined;
  }

  try {
    const value = inputProvided ? action.buildArgv(input) : action.buildArgv();
    return { outcome: "return", value };
  } catch (error) {
    return {
      outcome: "throw",
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function normalizeInteractiveActions(actions) {
  return actions.map((action) => ({
    id: action.id,
    section: action.section,
    kind: action.kind,
    label: action.label,
    argv: action.argv,
    cliEquivalent: action.cliEquivalent,
    confirmLabel: action.confirmLabel,
    refreshTarget: action.refreshTarget,
    form: action.form,
    buildArgvNoArg: captureBuildArgvBehavior(action, false),
    buildArgvDefault: captureBuildArgvBehavior(action, true, {}),
    buildArgvSelected: captureBuildArgvBehavior(action, true, { selectedIds: ["claude", "pi"] }),
  }));
}

function normalizeStatusScreenState(status) {
  return {
    ...status,
    interactiveActions: normalizeInteractiveActions(status.interactiveActions),
  };
}

describe("getStatusScreenState", () => {
  it("reports readiness warnings with actionable commands when setup surfaces are missing", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
    };

    const status = getStatusScreenState({ cwd: tempRoot, env });

    expect(status.summary).toEqual(
      expect.objectContaining({
        label: "Readiness",
        state: "warn",
        detail: expect.stringContaining("afergon-ai init"),
      }),
    );
    expect(status.items).toContainEqual(
      expect.objectContaining({
        id: "model-config",
        state: "warn",
        detail: expect.stringContaining("afergon-ai models show"),
      }),
    );
    expect(status.items).toContainEqual(
      expect.objectContaining({
        id: "claude",
        state: "warn",
        detail: expect.stringContaining("afergon-ai init"),
      }),
    );
    expect(status.actions).toEqual([
      expect.objectContaining({ id: "doctor", label: "afergon-ai doctor", argv: ["doctor"] }),
      expect.objectContaining({ id: "init", label: "afergon-ai init", argv: ["init"] }),
      expect.objectContaining({ id: "update", label: "afergon-ai update", argv: ["update"] }),
      expect.objectContaining({ id: "models", label: "afergon-ai models", argv: ["models"] }),
    ]);
  });

  it("reports an ok readiness summary when all status surfaces are installed in isolated temp fixtures", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: xdgHome,
    };

    writeJson(path.join(xdgHome, "afergon-ai", "config.json"), {
      version: 1,
      models: {
        activeProfile: "default",
        profiles: {
          default: {
            "afergon-ai": "openai/gpt-5.4",
          },
        },
      },
    });
    fs.mkdirSync(path.join(tempRoot, ".pi"), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"), "# Append system\n");
    fs.writeFileSync(path.join(tempRoot, "CLAUDE.md"), "# Claude\n");
    writeJson(path.join(xdgHome, "opencode", "opencode.json"), {
      agent: {
        "afergon-ai": {
          model: "openai/gpt-5.4",
        },
      },
    });
    fs.mkdirSync(path.join(xdgHome, "opencode", "agents"), { recursive: true });
    fs.writeFileSync(path.join(xdgHome, "opencode", "agents", "afergon-ai.md"), "# afergon-ai\n");

    const status = getStatusScreenState({ cwd: tempRoot, env });
    const lines = renderStatusScreen(status, 120);
    const output = lines.join("\n");

    expect(status.summary).toEqual(
      expect.objectContaining({
        label: "Readiness",
        state: "ok",
        detail: "Ready for guided workflows.",
      }),
    );
    expect(status.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "model-config", state: "ok", detail: expect.stringContaining("OpenCode=default") }),
        expect.objectContaining({ id: "pi", state: "ok", detail: expect.stringContaining("APPEND_SYSTEM.md") }),
        expect.objectContaining({ id: "claude", state: "ok", detail: expect.stringContaining("CLAUDE.md") }),
        expect.objectContaining({ id: "opencode", state: "ok", detail: expect.stringContaining("Managed install detected") }),
      ]),
    );
    expect(output).toContain("Readiness [ok]: Ready for guided workflows.");
    expect(output).toContain("Model config [ok]:");
    expect(output).toContain("Pi [ok]:");
    expect(output).toContain("Claude Code [ok]:");
    expect(output).toContain("OpenCode [ok]:");
  });

  it("reports readiness failures with preserved root cause and repair guidance", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const configDir = path.join(xdgHome, "afergon-ai");

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), "{ invalid json\n");

    const status = getStatusScreenState({
      cwd: tempRoot,
      env: {
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
      },
    });

    expect(status.summary).toEqual(
      expect.objectContaining({
        label: "Readiness",
        state: "fail",
        detail: expect.stringContaining("afergon-ai doctor"),
      }),
    );
    expect(status.items).toContainEqual(
      expect.objectContaining({
        id: "model-config",
        state: "fail",
        detail: expect.stringContaining("invalid JSON"),
      }),
    );
    expect(status.items).toContainEqual(
      expect.objectContaining({
        id: "model-config",
        state: "fail",
        detail: expect.stringContaining("afergon-ai models show"),
      }),
    );
  });

  it("keeps the TypeScript config-status adapter aligned with emitted JavaScript for readiness warnings", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
    };

    expect(normalizeStatusScreenState(configStatusAdapterTypeScript.getStatusScreenState({ cwd: tempRoot, env }))).toEqual(
      normalizeStatusScreenState(getStatusScreenState({ cwd: tempRoot, env })),
    );
  });

  it("keeps the TypeScript config-status adapter aligned with emitted JavaScript for readiness failures", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const configDir = path.join(xdgHome, "afergon-ai");

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), "{ invalid json\n");

    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: xdgHome,
    };

    expect(normalizeStatusScreenState(configStatusAdapterTypeScript.getStatusScreenState({ cwd: tempRoot, env }))).toEqual(
      normalizeStatusScreenState(getStatusScreenState({ cwd: tempRoot, env })),
    );
  });
});

describe("renderStatusScreen", () => {
  it("keeps the TypeScript status screen aligned with emitted JavaScript for readiness summaries", () => {
    const state = {
      title: "Status",
      summary: { label: "Readiness", state: "warn", detail: "Run afergon-ai init to finish setup." },
      items: [{ id: "claude", label: "Claude Code", state: "warn", detail: "Run afergon-ai init to install project files." }],
      actions: [
        { id: "doctor", label: "afergon-ai doctor", argv: ["doctor"], description: "Verify current installation state." },
      ],
    };

    expect(statusScreenTypeScript.renderStatusScreen(state, 100)).toEqual(renderStatusScreen(state, 100));
  });

  it("keeps the TypeScript status screen aligned with emitted JavaScript for sanitized terminal-control input", () => {
    const state = {
      title: "Status",
      summary: {
        label: "Read\u001b[32miness\u001b[0m",
        state: "warn",
        detail: "Inspect /repo/\u009d2;owned\u0007CLAUDE.md\u0085Run afergon-ai doctor.",
      },
      items: [
        {
          id: "claude",
          label: "Claude\u009b31m Code\u009b0m",
          state: "fail",
          detail: "Repair \u001b]2;owned\u0007/tmp/CLAUDE.md and retry.",
        },
      ],
      actions: [
        {
          id: "doctor",
          label: "afergon-ai doctor",
          argv: ["doctor"],
          description: "Verify \u001b[31mcurrent\u001b[0m installation",
        },
      ],
    };

    expect(statusScreenTypeScript.renderStatusScreen(state, 200)).toEqual(renderStatusScreen(state, 200));
  });

  it("renders readiness, item health, and stable CLI-equivalent actions", () => {
    const lines = renderStatusScreen(
      {
        title: "Status",
        summary: { label: "Readiness", state: "warn", detail: "Run afergon-ai init to finish setup." },
        items: [{ id: "claude", label: "Claude Code", state: "warn", detail: "Run afergon-ai init to install project files." }],
        actions: [
          { id: "doctor", label: "afergon-ai doctor", argv: ["doctor"], description: "Verify current installation state." },
        ],
      },
      100,
    );

    expect(lines.join("\n")).toContain("Status");
    expect(lines.join("\n")).toContain("Readiness [warn]: Run afergon-ai init to finish setup.");
    expect(lines.join("\n")).toContain("Claude Code [warn]: Run afergon-ai init to install project files.");
    expect(lines.join("\n")).toContain("afergon-ai doctor");
    expect(lines.join("\n")).toContain("Keyboard help");
    expect(lines.join("\n")).toContain("State labels use [ok], [warn], and [fail] text markers.");
    expect(lines.join("\n")).not.toContain("Press h to return Home");
  });

  it("sanitizes terminal control sequences from status labels, details, and paths", () => {
    const lines = renderStatusScreen(
      {
        title: "Status",
        summary: {
          label: "Read\u001b[32miness\u001b[0m",
          state: "warn",
          detail: "Inspect /repo/\u009d2;owned\u0007CLAUDE.md\u0085Run afergon-ai doctor.",
        },
        items: [
          {
            id: "claude",
            label: "Claude\u009b31m Code\u009b0m",
            state: "fail",
            detail: "Repair \u001b]2;owned\u0007/tmp/CLAUDE.md and retry.",
          },
        ],
        actions: [
          {
            id: "doctor",
            label: "afergon-ai doctor",
            argv: ["doctor"],
            description: "Verify \u001b[31mcurrent\u001b[0m installation",
          },
        ],
      },
      200,
    );

    const output = lines.join("\n");

    expect(output).toContain("Readiness [warn]: Inspect /repo/CLAUDE.md?Run afergon-ai doctor.");
    expect(output).toContain("Claude Code [fail]: Repair /tmp/CLAUDE.md and retry.");
    expect(output).toContain("- afergon-ai doctor: Verify current installation");
    expect(output).toContain("[warn]");
    expect(output).toContain("[fail]");
    expect(output).not.toContain("\u001b");
    expect(output).not.toContain("\u009b");
    expect(output).not.toContain("\u009d");
    expect(output).not.toContain("owned");
  });
});

describe("createTuiApp status route", () => {
  it("navigates from Home to Status and back with discoverable keyboard shortcuts", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadStatusScreenState: () => ({
        title: "Status",
        summary: { label: "Readiness", state: "ok", detail: "Ready for guided workflows." },
        items: [{ id: "opencode", label: "OpenCode", state: "ok", detail: "Managed install detected." }],
        actions: [{ id: "doctor", label: "afergon-ai doctor", argv: ["doctor"], description: "Verify install." }],
      }),
    });

    app.start();
    await flushTui();
    terminal.output = "";

    terminal.emitInput("s");
    await flushTui();

    expect(app.navigation.route).toBe("status");
    expect(terminal.output).toContain("Status");
    expect(terminal.output).toContain("Readiness [ok]: Ready for guided workflows.");
    expect(terminal.output).toContain("afergon-ai doctor");

    terminal.output = "";
    terminal.emitInput("h");
    await flushTui();

    expect(app.navigation.route).toBe("home");
    expect(terminal.output).toContain("Home");
    expect(stripAnsi(terminal.output)).toContain("Press (C)onfiguracion | (S)tatus | (M)odels");
  });

  it("runs the status doctor action inline with --opencode and shows bounded failure output", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async ({ action }) => ({
      ok: false,
      exitCode: 1,
      stdout: "doctor summary\n",
      stderr: `${action.id} failed\n`,
      timedOut: false,
    }));
    const app = createTuiApp({
      terminal,
      exit: () => {},
      executeAction,
      loadStatusScreenState: () => ({
        title: "Status",
        summary: { label: "Readiness", state: "warn", detail: "Run afergon-ai doctor --opencode." },
        items: [{ id: "opencode", label: "OpenCode", state: "warn", detail: "Managed install not detected." }],
        actions: [{ id: "doctor", label: "afergon-ai doctor", argv: ["doctor"], description: "Verify install." }],
        interactiveActions: [
          createActionDefinition({
            id: "status-doctor",
            section: "status",
            kind: "read",
            label: "Run doctor for OpenCode",
            argv: buildCommandArgv("doctor", ["--opencode"]),
          }),
        ],
      }),
    });

    app.start();
    await flushTui();
    terminal.output = "";

    terminal.emitInput("s");
    await flushTui();
    expect(terminal.output).toContain("> Run doctor for OpenCode");

    terminal.emitInput("\r");
    await flushTui();

    expect(executeAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: expect.objectContaining({ id: "status-doctor", argv: ["doctor", "--opencode"] }) }),
    );
    expect(terminal.output).toContain("Output [fail]");
    expect(terminal.output).toContain("doctor summary");
    expect(terminal.output).toContain("status-doctor failed");

    terminal.output = "";
    terminal.emitInput("\u001b");
    await flushTui();

    expect(terminal.output).not.toContain("Output [fail]");
    expect(app.navigation.route).toBe("status");
  });

  it("requires confirmation for update, lets Escape cancel, and keeps focus on the selected status action", async () => {
    const terminal = new FakeTerminal();
    const executeAction = vi.fn(async () => ({ ok: true, exitCode: 0, stdout: "updated\n", stderr: "", timedOut: false }));
    const app = createTuiApp({
      terminal,
      exit: () => {},
      executeAction,
      loadStatusScreenState: () => ({
        title: "Status",
        summary: { label: "Readiness", state: "warn", detail: "Setup is incomplete." },
        items: [{ id: "claude", label: "Claude Code", state: "warn", detail: "Not installed." }],
        actions: [{ id: "update", label: "afergon-ai update", argv: ["update"], description: "Refresh installed files." }],
        interactiveActions: [
          createActionDefinition({
            id: "status-update",
            section: "status",
            kind: "mutate",
            label: "Refresh managed files",
            argv: buildCommandArgv("update"),
          }),
        ],
      }),
    });

    app.start();
    await flushTui();
    terminal.output = "";

    terminal.emitInput("s");
    await flushTui();
    terminal.emitInput("\r");
    await flushTui();

    expect(terminal.output).toContain("Confirmation");
    expect(terminal.output).toContain("afergon-ai update");
    expect(executeAction).not.toHaveBeenCalled();

    terminal.output = "";
    terminal.emitInput("\u001b");
    await flushTui();

    expect(executeAction).not.toHaveBeenCalled();
    expect(terminal.output).not.toContain("Confirmation");
    expect(app.navigation.route).toBe("status");
    expect(app.navigation.modal).toBeUndefined();
    expect(app.navigation.sectionActionSelection).toBe(0);
  });
});
