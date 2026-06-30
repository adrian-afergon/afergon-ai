import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { getConfigurationStatus } from "../scripts/lib/tui/config-status-adapter.mjs";
import { renderConfigurationScreen } from "../scripts/lib/tui/screens/configuration.mjs";
import { createTuiApp } from "../scripts/tui.mjs";

const tempRoots = [];

afterEach(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

function makeTempRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-config-tui-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
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

describe("getConfigurationStatus", () => {
  it("reports missing local configuration/install surfaces and exposes only stable CLI actions", () => {
    const tempRoot = makeTempRoot();
    const env = {
      HOME: path.join(tempRoot, "home"),
      XDG_CONFIG_HOME: path.join(tempRoot, "xdg"),
    };

    const status = getConfigurationStatus({ cwd: tempRoot, env });

    expect(status.items).toEqual([
      expect.objectContaining({ id: "model-config", state: "warn", detail: expect.stringContaining("not created") }),
      expect.objectContaining({ id: "pi", state: "warn", detail: "Not installed in this project." }),
      expect.objectContaining({ id: "claude", state: "warn", detail: "Not installed in this project." }),
      expect.objectContaining({ id: "opencode", state: "warn", detail: expect.stringContaining("not detected") }),
    ]);

    expect(status.actions).toEqual([
      expect.objectContaining({ id: "init", label: "afergon-ai init", argv: ["init"] }),
      expect.objectContaining({ id: "doctor", label: "afergon-ai doctor", argv: ["doctor"] }),
      expect.objectContaining({ id: "update", label: "afergon-ai update", argv: ["update"] }),
      expect.objectContaining({ id: "models", label: "afergon-ai models", argv: ["models"] }),
    ]);
    expect(status.actions.map((action) => action.id)).not.toContain("configuration");
  });

  it("reports discovered configuration/install state from existing project and host files", () => {
    const tempRoot = makeTempRoot();
    const home = path.join(tempRoot, "home");
    const xdgHome = path.join(tempRoot, "xdg");
    const configDir = path.join(xdgHome, "afergon-ai");
    const opencodeBaseDir = path.join(xdgHome, "opencode");

    fs.mkdirSync(path.join(tempRoot, ".pi"), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, ".pi", "APPEND_SYSTEM.md"), "pi");
    fs.writeFileSync(path.join(tempRoot, "CLAUDE.md"), "claude");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, "config.json"),
      `${JSON.stringify({ version: 1, models: { activeProfile: "default", profiles: { default: {} } } }, null, 2)}\n`,
    );
    fs.mkdirSync(path.join(opencodeBaseDir, "agents"), { recursive: true });
    fs.mkdirSync(path.join(opencodeBaseDir, "commands"), { recursive: true });
    fs.writeFileSync(path.join(opencodeBaseDir, "opencode.json"), "{}\n");
    fs.writeFileSync(path.join(opencodeBaseDir, "agents", "afergon-ai.md"), "agent");

    const status = getConfigurationStatus({
      cwd: tempRoot,
      env: {
        HOME: home,
        XDG_CONFIG_HOME: xdgHome,
      },
    });

    expect(status.items).toEqual([
      expect.objectContaining({ id: "model-config", state: "ok", detail: expect.stringContaining("active profile: default") }),
      expect.objectContaining({ id: "pi", state: "ok", detail: expect.stringContaining("APPEND_SYSTEM.md") }),
      expect.objectContaining({ id: "claude", state: "ok", detail: expect.stringContaining("CLAUDE.md") }),
      expect.objectContaining({ id: "opencode", state: "ok", detail: expect.stringContaining("opencode.json") }),
    ]);
  });

  it("reports invalid JSON config with actionable repair guidance", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const configDir = path.join(xdgHome, "afergon-ai");

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), "{ invalid json\n");

    const status = getConfigurationStatus({
      cwd: tempRoot,
      env: {
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
      },
    });

    expect(status.items).toContainEqual(
      expect.objectContaining({
        id: "model-config",
        state: "fail",
        detail: expect.stringContaining("rerun 'afergon-ai models show'"),
      }),
    );
    expect(status.items).toContainEqual(
      expect.objectContaining({
        id: "model-config",
        state: "fail",
        detail: expect.stringContaining("invalid JSON"),
      }),
    );
  });

  it("reports invalid config shape with actionable repair guidance", () => {
    const tempRoot = makeTempRoot();
    const xdgHome = path.join(tempRoot, "xdg");
    const configDir = path.join(xdgHome, "afergon-ai");

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, "config.json"),
      `${JSON.stringify({ version: 1, models: { activeProfile: 42, profiles: {} } }, null, 2)}\n`,
    );

    const status = getConfigurationStatus({
      cwd: tempRoot,
      env: {
        HOME: path.join(tempRoot, "home"),
        XDG_CONFIG_HOME: xdgHome,
      },
    });

    expect(status.items).toContainEqual(
      expect.objectContaining({
        id: "model-config",
        state: "fail",
        detail: expect.stringContaining("rerun 'afergon-ai models show'"),
      }),
    );
    expect(status.items).toContainEqual(
      expect.objectContaining({
        id: "model-config",
        state: "fail",
        detail: expect.stringContaining("models.activeProfile must be a string or null"),
      }),
    );
  });
});

describe("renderConfigurationScreen", () => {
  it("renders configuration state plus stable CLI-equivalent actions", () => {
    const lines = renderConfigurationScreen(
      {
        items: [
          { id: "model-config", label: "Model config", state: "ok", detail: "Config file exists." },
          { id: "pi", label: "Pi", state: "warn", detail: "Not installed in this project." },
        ],
        actions: [
          { id: "init", label: "afergon-ai init", argv: ["init"], description: "Initialize project files." },
          { id: "doctor", label: "afergon-ai doctor", argv: ["doctor"], description: "Verify current installation state." },
        ],
      },
      100,
    );

    expect(lines.join("\n")).toContain("Configuration");
    expect(lines.join("\n")).toContain("Model config [ok]: Config file exists.");
    expect(lines.join("\n")).toContain("Pi [warn]: Not installed in this project.");
    expect(lines.join("\n")).toContain("afergon-ai init");
    expect(lines.join("\n")).toContain("afergon-ai doctor");
    expect(lines.join("\n")).toContain("Keyboard help");
    expect(lines.join("\n")).toContain("State labels use [ok], [warn], and [fail] text markers.");
    expect(lines.join("\n")).not.toContain("afergon-ai configuration");
  });

  it("renders a model-config failure item without throwing", () => {
    const status = {
      title: "Configuration",
      items: [
        {
          id: "model-config",
          label: "Model config",
          state: "fail",
          detail: "Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'.",
        },
      ],
      actions: [{ id: "doctor", label: "afergon-ai doctor", argv: ["doctor"], description: "Verify install." }],
    };

    expect(() => renderConfigurationScreen(status, 160)).not.toThrow();
    expect(renderConfigurationScreen(status, 160).join("\n")).toContain(
      "Model config [fail]: Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'.",
    );
  });
});

describe("createTuiApp configuration route", () => {
  it("navigates from Home to Configuration and back with discoverable keyboard shortcuts", async () => {
    const terminal = new FakeTerminal();
    const app = createTuiApp({
      terminal,
      exit: () => {},
      loadConfigurationStatus: () => ({
        items: [{ id: "model-config", label: "Model config", state: "ok", detail: "Config file exists." }],
        actions: [{ id: "doctor", label: "afergon-ai doctor", argv: ["doctor"], description: "Verify install." }],
      }),
    });

    app.start();
    await flushTui();
    terminal.output = "";

    terminal.emitInput("c");
    await flushTui();

    expect(app.navigation.route).toBe("configuration");
    expect(terminal.output).toContain("Configuration");
    expect(terminal.output).toContain("afergon-ai doctor");
    expect(terminal.output).toContain("Press h to return Home");

    terminal.output = "";
    terminal.emitInput("h");
    await flushTui();

    expect(app.navigation.route).toBe("home");
    expect(terminal.output).toContain("Home");
    expect(terminal.output).toContain("Press c for Configuration");
  });
});
