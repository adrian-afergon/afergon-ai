#!/usr/bin/env node

import { Key, matchesKey, ProcessTerminal, truncateToWidth, TUI } from "@earendil-works/pi-tui";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getConfigurationStatus, getStatusScreenState } from "./lib/tui/config-status-adapter.mjs";
import { getModelProfilesScreenState } from "./lib/tui/model-profiles-adapter.mjs";
import { createNavigationState, navigateTo } from "./lib/tui/navigation.mjs";
import { renderConfigurationScreen } from "./lib/tui/screens/configuration.mjs";
import { renderModelProfilesScreen } from "./lib/tui/screens/model-profiles.mjs";
import { renderStatusScreen } from "./lib/tui/screens/status.mjs";

const APP_TITLE = "afergon-ai TUI";
const EXIT_REASON = "user-exit";
const LOGO = [
  " █████╗  ███████╗ ███████╗ ██████╗   ██████╗   ██████╗  ███╗   ██╗  ·   █████╗  ██╗",
  "██╔══██╗ ██╔════╝ ██╔════╝ ██╔══██╗ ██╔════╝  ██╔═══██╗ ████╗  ██║     ██╔══██╗ ██║",
  "███████║ █████╗   █████╗   ██████╔╝ ██║  ███╗ ██║   ██║ ██╔██╗ ██║     ███████║ ██║",
  "██╔══██║ ██╔══╝   ██╔══╝   ██╔══██╗ ██║   ██║ ██║   ██║ ██║╚██╗██║     ██╔══██║ ██║",
  "██║  ██║ ██║      ███████╗ ██║  ██║ ╚██████╔╝ ╚██████╔╝ ██║ ╚████║     ██║  ██║ ██║",
  "╚═╝  ╚═╝ ╚═╝      ╚══════╝ ╚═╝  ╚═╝  ╚═════╝   ╚═════╝  ╚═╝  ╚═══╝     ╚═╝  ╚═╝ ╚═╝",
];
const TAGLINE = "debate  ·  specify  ·  implement  ·  review";

function padLine(text, width) {
  return truncateToWidth(text, Math.max(1, width), "");
}

export function shouldExitTui(data) {
  const printable = data.length === 1 ? data.toLowerCase() : undefined;
  return printable === "q" || matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"));
}

export function renderHomeScreen(navigation, width) {
  const lines = [
    ...LOGO,
    "",
    TAGLINE,
    "",
    "Home",
    "",
    `Current route: ${navigation.route}`,
    "",
    "Sections available in this MVP slice:",
    "- Home",
    "- Configuration (press c)",
    "- Status (press s)",
    "- Model Profiles (press m)",
    "",
    "Press c for Configuration.",
    "Press s for Status.",
    "Press m for Model Profiles.",
    "Press h to return Home from any section.",
    "Press q or Esc to exit.",
  ];

  return lines.map((line) => padLine(line, width));
}

function setRoute(navigation, route) {
  Object.assign(navigation, navigateTo(navigation, route));
}

function createMainScreen({ navigation, onExit, onNavigate, loadConfigurationStatus, loadStatusScreenState, loadModelProfilesScreenState }) {
  return {
    render(width) {
      if (navigation.route === "configuration") {
        return renderConfigurationScreen(loadConfigurationStatus(), width);
      }

      if (navigation.route === "status") {
        return renderStatusScreen(loadStatusScreenState(), width);
      }

      if (navigation.route === "model-profiles") {
        return renderModelProfilesScreen(loadModelProfilesScreenState(), width);
      }

      return renderHomeScreen(navigation, width);
    },
    handleInput(data) {
      if (shouldExitTui(data)) {
        onExit({ code: 0, reason: EXIT_REASON });
        return;
      }

      const printable = data.length === 1 ? data.toLowerCase() : undefined;

      if (navigation.route === "home" && printable === "c") {
        setRoute(navigation, "configuration");
        onNavigate();
        return;
      }

      if (navigation.route === "home" && printable === "s") {
        setRoute(navigation, "status");
        onNavigate();
        return;
      }

      if (navigation.route === "home" && printable === "m") {
        setRoute(navigation, "model-profiles");
        onNavigate();
        return;
      }

      if (navigation.route !== "home" && printable === "h") {
        setRoute(navigation, "home");
        onNavigate();
      }
    },
    invalidate() {},
  };
}

export function createTuiApp({
  terminal = new ProcessTerminal(),
  exit = ({ code }) => process.exit(code),
  loadConfigurationStatus = () => getConfigurationStatus(),
  loadStatusScreenState = () => getStatusScreenState(),
  loadModelProfilesScreenState = () => getModelProfilesScreenState(),
} = {}) {
  const navigation = createNavigationState();
  const tui = new TUI(terminal);
  let stopped = false;

  const stop = ({ code = 0, reason = EXIT_REASON } = {}) => {
    if (stopped) {
      return;
    }

    stopped = true;
    tui.stop();
    exit({ code, reason });
  };

  const screen = createMainScreen({ navigation, onExit: stop, onNavigate: () => tui.requestRender(true), loadConfigurationStatus, loadStatusScreenState, loadModelProfilesScreenState });
  tui.addChild(screen);
  tui.setFocus(screen);
  terminal.setTitle?.(APP_TITLE);

  return {
    navigation,
    screen,
    start() {
      tui.start();
      tui.requestRender(true);
      return this;
    },
    stop,
    terminal,
    tui,
  };
}

export function main() {
  createTuiApp().start();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
