#!/usr/bin/env node

import { Key, matchesKey, ProcessTerminal, truncateToWidth, TUI } from "@earendil-works/pi-tui";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createNavigationState, navigateTo } from "./lib/tui/navigation.mjs";

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
    "Press h to return Home from any section.",
    "Press q or Esc to exit.",
  ];

  return lines.map((line) => padLine(line, width));
}

function renderPlaceholderScreen(route, width) {
  return [
    route === "model-profiles" ? "Model Profiles" : route.charAt(0).toUpperCase() + route.slice(1),
    "",
    "This screen will land in a later slice.",
    "Press h to return Home.",
    "Press q or Esc to exit.",
  ].map((line) => padLine(line, width));
}

function setRoute(navigation, route) {
  Object.assign(navigation, navigateTo(navigation, route));
}

function createMainScreen({ navigation, onExit, onNavigate }) {
  return {
    render(width) {
      return navigation.route === "home" ? renderHomeScreen(navigation, width) : renderPlaceholderScreen(navigation.route, width);
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

export function createTuiApp({ terminal = new ProcessTerminal(), exit = ({ code }) => process.exit(code) } = {}) {
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

  const screen = createMainScreen({ navigation, onExit: stop, onNavigate: () => tui.requestRender(true) });
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
