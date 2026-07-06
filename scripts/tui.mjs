#!/usr/bin/env node

import {
  Key,
  matchesKey,
  ProcessTerminal,
  truncateToWidth,
  TUI,
} from "@earendil-works/pi-tui";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BRANDING_LOGO, canRenderBrandingLogo } from "./lib/branding/logo.mjs";
import { resolveActionArgv } from "./lib/tui/actions/definitions.mjs";
import {
  appendFormCharacter,
  appendConfirmationCharacter,
  backspaceFormCharacter,
  backspaceConfirmationCharacter,
  createConfirmationState,
  createFormState,
  createOutputState,
  getFormInput,
  getFormSubmitState,
  getOutputLines,
  moveFormSelection,
  changeFormValue,
  sanitizeTerminalOutput,
  toggleCheckboxFormSelection,
  validateConfirmationState,
  validateFormInput,
} from "./lib/tui/actions/forms.mjs";
import { runActionCommand } from "./lib/tui/actions/runner.mjs";
import { getConfigurationStatus, getStatusScreenState } from "./lib/tui/config-status-adapter.mjs";
import { getModelProfilesBrowseIntent, getModelProfilesScreenState } from "./lib/tui/model-profiles-adapter.mjs";
import {
  activateHomeSelection,
  closeModal,
  createNavigationState,
  enterModelProfilesAssignments,
  exitModelProfilesAssignments,
  HOME_MENU_ROUTES,
  moveHomeSelection,
  moveModelProfilesSelection,
  moveSectionActionSelection,
  navigateTo,
  normalizeSectionActionSelection,
  openModal,
} from "./lib/tui/navigation.mjs";
import { renderConfigurationScreen } from "./lib/tui/screens/configuration.mjs";
import { renderModelProfilesScreen } from "./lib/tui/screens/model-profiles.mjs";
import { renderStatusScreen } from "./lib/tui/screens/status.mjs";

const APP_TITLE = "afergon-ai TUI";
const EXIT_REASON = "user-exit";
const CLI_DISPATCH_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "cli-dispatch.mjs");
const TEAL_ANSI = "\u001b[38;5;6m";
const ANSI_RESET = "\u001b[0m";
const DELETE_ESCAPE_SEQUENCE = "\u001b[3~";

function padLine(text, width) {
  return truncateToWidth(text, Math.max(1, width), "");
}

function styleTeal(text) {
  return `${TEAL_ANSI}${text}${ANSI_RESET}`;
}

function isDeleteKey(data) {
  return matchesKey(data, Key.delete) || data === DELETE_ESCAPE_SEQUENCE;
}

export function shouldExitTui(data) {
  const printable = data.length === 1 ? data.toLowerCase() : undefined;

  return printable === "q" || matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"));
}

export function renderHomeScreen(navigation, width) {
  const homeItems = HOME_MENU_ROUTES.map((route, index) => ({
    route,
    label: route === "model-profiles" ? "Model Profiles" : route.charAt(0).toUpperCase() + route.slice(1),
    shortcut: route === "configuration" ? "c" : route === "status" ? "s" : "m",
    selected: navigation.homeSelection === index,
  }));

  const useFallbackBranding = !canRenderBrandingLogo(width);
  const brandingLines = useFallbackBranding
    ? [BRANDING_LOGO.fallbackTitle, BRANDING_LOGO.fallbackCopy, "Plain-text branding mode keeps Home readable."]
    : [...BRANDING_LOGO.lines, "", BRANDING_LOGO.tagline];

  const lines = [
    ...brandingLines,
    "",
    "Home",
    "",
    `Current route: ${navigation.route}`,
    "",
    "Sections available in this MVP slice:",
    "- Home",
    ...homeItems.map((item) => {
      const line = `${item.selected ? ">" : " "} ${item.label}${item.selected ? " [selected]" : ""} (press ${item.shortcut})`;
      return item.selected ? styleTeal(line) : line;
    }),
    "",
    "Keyboard help",
    "Use ↑/↓ to move the Home selection.",
    "Press Enter to open the selected section.",
    "Shortcut keys: c Configuration, s Status, m Model Profiles.",
    "Press c for Configuration.",
    "Press s for Status.",
    "Press m for Model Profiles.",
    "Press h to return Home from any section.",
    "Selection markers: > and [selected] identify the active Home item.",
    "Press q or Esc to exit.",
  ];

  return lines.map((line, index) => {
    const paddedLine = padLine(line, width);

    if (!useFallbackBranding && ((index >= 0 && index < BRANDING_LOGO.lines.length) || index === BRANDING_LOGO.lines.length + 1)) {
      return styleTeal(paddedLine);
    }

    return paddedLine;
  });
}

export function createHomeScreen({ navigation, onExit }) {
  return {
    render(width) {
      return renderHomeScreen(navigation, width);
    },
    handleInput(data) {
      if (shouldExitTui(data)) {
        onExit({ code: 0, reason: EXIT_REASON });
      }
    },
    invalidate() {},
  };
}

function setRoute(navigation, route) {
  Object.assign(navigation, navigateTo(navigation, route));
}

function updateHomeSelection(navigation, direction) {
  Object.assign(navigation, moveHomeSelection(navigation, direction));
}

function activateSelectedHomeRoute(navigation) {
  Object.assign(navigation, activateHomeSelection(navigation));
}

function moveSelectedSectionAction(navigation, actionCount, direction) {
  Object.assign(navigation, moveSectionActionSelection(navigation, actionCount, direction));
}

function syncSectionActionSelection(navigation, actionCount) {
  Object.assign(navigation, normalizeSectionActionSelection(navigation, actionCount));
}

function showModal(navigation, modal) {
  navigation.modal = openModal(navigation, modal).modal;
}

function hideModal(navigation) {
  navigation.modal = closeModal(navigation).modal;
}

function updateModelProfilesState(navigation, nextState) {
  navigation.modelProfiles = nextState;
}

function renderInteractiveActions(actions, navigation) {
  if (actions.length === 0) {
    return [];
  }

  syncSectionActionSelection(navigation, actions.length);

  return [
    "",
    "Interactive actions",
    "",
    ...actions.flatMap((action, index) => {
      const selected = (navigation.sectionActionSelection ?? 0) === index;
      const line = `${selected ? ">" : " "} ${action.label}${selected ? " [selected]" : ""}`;
      return [selected ? styleTeal(line) : line];
    }),
    "",
    "Keyboard help",
    "Use ↑/↓ to move the action selection.",
    "Press Enter to run the selected action.",
    "Press Esc to cancel confirmations, forms, or output panels.",
  ];
}

function renderConfirmationModal(modal) {
  const prompt = modal.confirmation?.prompt ?? modal.action.confirmLabel ?? "Confirm this action?";
  return [
    "",
    "Confirmation",
    `Action: ${sanitizeTerminalOutput(modal.action.label)}`,
    sanitizeTerminalOutput(prompt),
    `CLI equivalent: ${sanitizeTerminalOutput(modal.action.cliEquivalent ?? "")}`,
    `Argv: ${JSON.stringify((modal.action.argv ?? []).map((entry) => sanitizeTerminalOutput(entry)))}`,
    ...(modal.confirmation?.kind === "typed-match"
      ? [
          `Expected text: ${sanitizeTerminalOutput(modal.confirmation.expectedText ?? "") || "(empty)"}`,
          `Typed text: ${sanitizeTerminalOutput(modal.value ?? "") || "(empty)"}`,
        ]
      : []),
    ...(modal.validationMessage ? [sanitizeTerminalOutput(modal.validationMessage)] : []),
    "Press Enter to confirm.",
    "Press Esc to cancel.",
  ];
}

function renderPickerFormModal(modal) {
  const cancelIndex = modal.action.form.options.length;

  return [
    "",
    modal.action.form.title,
    ...(modal.action.cliEquivalent ? [`CLI equivalent: ${sanitizeTerminalOutput(modal.action.cliEquivalent)}`] : []),
    "",
    ...modal.action.form.options.map((option, index) => {
      const selected = modal.activeIndex === index;
      return `${selected ? ">" : " "} ${sanitizeTerminalOutput(option.label)}${selected ? " [selected]" : ""}`;
    }),
    `${modal.activeIndex === cancelIndex ? ">" : " "} Cancel`,
    "",
    ...(modal.validationMessage ? [sanitizeTerminalOutput(modal.validationMessage), ""] : []),
    "Use ↑/↓ to move within the picker.",
    "Press Enter to choose the selected option.",
    "Press Esc to cancel.",
  ];
}

function renderFieldsFormModal(modal) {
  const submitIndex = modal.action.form.fields.length;
  const cancelIndex = submitIndex + 1;

  return [
    "",
    modal.action.form.title,
    ...(modal.action.cliEquivalent ? [`CLI equivalent: ${sanitizeTerminalOutput(modal.action.cliEquivalent)}`] : []),
    "",
    ...modal.action.form.fields.map((field, index) => {
      const marker = modal.activeIndex === index ? ">" : " ";
      if (field.type === "toggle") {
        return `${marker} ${sanitizeTerminalOutput(field.label)}: [${modal.values[field.id] ? "x" : " "}]`;
      }
      return `${marker} ${sanitizeTerminalOutput(field.label)}: ${sanitizeTerminalOutput(modal.values[field.id] || "(empty)")}`;
    }),
    `${modal.activeIndex === submitIndex ? ">" : " "} Submit`,
    `${modal.activeIndex === cancelIndex ? ">" : " "} Cancel`,
    "",
    ...(modal.validationMessage ? [sanitizeTerminalOutput(modal.validationMessage), ""] : []),
    "Use ↑/↓ to move within the form.",
    "Use ←/→ or Space to change selectors and toggles.",
    "Type to edit text fields, Enter to submit, Esc to cancel.",
  ];
}

function renderCheckboxFormModal(modal) {
  const options = modal.action.form.options;
  const submitIndex = options.length;
  const cancelIndex = submitIndex + 1;

  return [
    "",
    modal.action.form.title,
    ...(modal.action.cliEquivalent ? [`CLI equivalent: ${sanitizeTerminalOutput(modal.action.cliEquivalent)}`] : []),
    "",
    ...options.map((option, index) => {
      const marker = modal.activeIndex === index ? ">" : " ";
      const checked = modal.selectedIds.includes(option.id) ? "x" : " ";
      return `${marker} ${sanitizeTerminalOutput(option.label)} [${checked}]`;
    }),
    `${modal.activeIndex === submitIndex ? ">" : " "} Submit`,
    `${modal.activeIndex === cancelIndex ? ">" : " "} Cancel`,
    "",
    ...(modal.validationMessage ? [sanitizeTerminalOutput(modal.validationMessage), ""] : []),
    "Use ↑/↓ to move within the form.",
    "Use Space to toggle the selected checkbox.",
    "Press Enter to submit or activate Cancel.",
    "Press Esc to cancel.",
  ];
}

function appendInteractionPanels(lines, navigation, outputState, interactiveActions) {
  const augmentedLines = [...lines, ...renderInteractiveActions(interactiveActions, navigation)];

  if (navigation.modal?.kind === "confirm") {
    augmentedLines.push(...renderConfirmationModal(navigation.modal));
  }

  if (navigation.modal?.kind === "form") {
    if (navigation.modal.formKind === "picker") {
      augmentedLines.push(...renderPickerFormModal(navigation.modal));
    } else if (navigation.modal.formKind === "fields") {
      augmentedLines.push(...renderFieldsFormModal(navigation.modal));
    } else {
      augmentedLines.push(...renderCheckboxFormModal(navigation.modal));
    }
  }

  if (navigation.modal?.kind === "output" && outputState) {
    augmentedLines.push("", ...getOutputLines(outputState));
  }

  return augmentedLines;
}

function renderPlaceholderScreen(route, width) {
  return [
    `${route} (coming later)`,
    "",
    "This screen is outside the current slice.",
    "Press h to return Home.",
    "Press q or Esc to exit.",
  ].map((line) => padLine(line, width));
}

function createMainScreen({
  navigation,
  onExit,
  onNavigate,
  loadConfigurationStatus,
  loadStatusScreenState,
  loadModelProfilesScreenState,
  getInteractiveActions,
  executeAction,
}) {
  let outputState;

  function getRouteState(route) {
    if (route === "configuration") {
      return loadConfigurationStatus();
    }

    if (route === "status") {
      return loadStatusScreenState();
    }

    if (route === "model-profiles") {
      return loadModelProfilesScreenState({ navigation });
    }

    return undefined;
  }

  function getRouteInteractiveActions(route) {
    const routeState = getRouteState(route);
    if (Array.isArray(routeState?.interactiveActions)) {
      return routeState.interactiveActions;
    }

    return getInteractiveActions(route);
  }

  function resolveExecutableAction(action, input = {}) {
    const argv = resolveActionArgv(action, input);
    return {
      ...action,
      argv,
      cliEquivalent: action.buildArgv ? `afergon-ai ${argv.join(" ")}` : (action.cliEquivalent ?? `afergon-ai ${argv.join(" ")}`),
      confirmation: typeof action.buildConfirmation === "function" ? action.buildConfirmation(input) : action.confirmation,
    };
  }

  async function runSelectedAction(action) {
    const result = await executeAction({ action });
    outputState = createOutputState({ action, result });
    showModal(navigation, outputState);
    onNavigate();
  }

  return {
    render(width) {
      const interactiveActions = getRouteInteractiveActions(navigation.route);
      syncSectionActionSelection(navigation, interactiveActions.length);

      if (navigation.route === "configuration") {
        return appendInteractionPanels(renderConfigurationScreen(getRouteState("configuration"), width), navigation, outputState, interactiveActions);
      }

      if (navigation.route === "status") {
        return appendInteractionPanels(renderStatusScreen(getRouteState("status"), width), navigation, outputState, interactiveActions);
      }

      if (navigation.route === "model-profiles") {
        return appendInteractionPanels(renderModelProfilesScreen(getRouteState("model-profiles"), width, { styleSelected: styleTeal }), navigation, outputState, interactiveActions);
      }

      if (navigation.route !== "home") {
        return renderPlaceholderScreen(navigation.route, width);
      }

      return renderHomeScreen(navigation, width);
    },
    handleInput(data) {
      if (navigation.modal?.kind === "form") {
        if (matchesKey(data, Key.up)) {
          navigation.modal = moveFormSelection(navigation.modal, -1);
          onNavigate();
          return;
        }

        if (matchesKey(data, Key.down)) {
          navigation.modal = moveFormSelection(navigation.modal, 1);
          onNavigate();
          return;
        }

        if (matchesKey(data, Key.escape)) {
          hideModal(navigation);
          onNavigate();
          return;
        }

        if (matchesKey(data, Key.left)) {
          navigation.modal = changeFormValue(navigation.modal, -1);
          onNavigate();
          return;
        }

        if (matchesKey(data, Key.right) || data === " ") {
          if (navigation.modal.formKind === "checkboxes") {
            navigation.modal = toggleCheckboxFormSelection(navigation.modal);
          } else {
            navigation.modal = changeFormValue(navigation.modal, 1);
          }
          onNavigate();
          return;
        }

        if (data === "\u007f") {
          navigation.modal = backspaceFormCharacter(navigation.modal);
          onNavigate();
          return;
        }

        if (data.length === 1 && data !== "\r") {
          navigation.modal = appendFormCharacter(navigation.modal, data);
          onNavigate();
          return;
        }

        if (matchesKey(data, Key.enter)) {
          if (navigation.modal.formKind === "checkboxes") {
            const submitState = getFormSubmitState(navigation.modal);
            if (submitState.isCancel) {
              hideModal(navigation);
              onNavigate();
              return;
            }

          if (submitState.isSubmit) {
              const validation = validateFormInput(navigation.modal);
              if (!validation.ok) {
                navigation.modal = {
                  ...navigation.modal,
                  activeIndex: validation.activeIndex ?? navigation.modal.activeIndex,
                  validationMessage: validation.message,
                };
                onNavigate();
                return;
              }

              const resolvedAction = resolveExecutableAction(navigation.modal.action, validation.input);
              showModal(navigation, createConfirmationState({ action: resolvedAction }));
              onNavigate();
              return;
            }

            navigation.modal = toggleCheckboxFormSelection(navigation.modal);
            onNavigate();
            return;
          }

          const submitState = getFormSubmitState(navigation.modal);
          if (submitState.isCancel) {
            hideModal(navigation);
            onNavigate();
            return;
          }

          if (submitState.isSubmit || navigation.modal.formKind === "picker") {
            if (navigation.modal.formKind === "fields" && submitState.isSubmit) {
              const validation = validateFormInput(navigation.modal);
              if (!validation.ok) {
                navigation.modal = {
                  ...navigation.modal,
                  activeIndex: validation.activeIndex ?? navigation.modal.activeIndex,
                  validationMessage: validation.message,
                };
                onNavigate();
                return;
              }

              const resolvedAction = resolveExecutableAction(navigation.modal.action, validation.input);
              showModal(navigation, createConfirmationState({ action: resolvedAction }));
              onNavigate();
              return;
            }

            const resolvedAction = resolveExecutableAction(navigation.modal.action, getFormInput(navigation.modal));
            if (resolvedAction.kind === "mutate") {
              showModal(navigation, createConfirmationState({ action: resolvedAction }));
            } else {
              hideModal(navigation);
              runSelectedAction(resolvedAction);
            }
            onNavigate();
            return;
          }

          navigation.modal = changeFormValue(navigation.modal, 1);
          onNavigate();
          return;
        }

        if (data === " ") {
          navigation.modal = toggleCheckboxFormSelection(navigation.modal);
          onNavigate();
          return;
        }

        return;
      }

      if (navigation.modal?.kind === "confirm") {
        if (matchesKey(data, Key.escape)) {
          hideModal(navigation);
          onNavigate();
          return;
        }

        if (data === "\u007f") {
          navigation.modal = backspaceConfirmationCharacter(navigation.modal);
          onNavigate();
          return;
        }

        if (data.length === 1 && data !== "\r") {
          navigation.modal = appendConfirmationCharacter(navigation.modal, data);
          onNavigate();
          return;
        }

        if (matchesKey(data, Key.enter)) {
          const validation = validateConfirmationState(navigation.modal);
          if (!validation.ok) {
            navigation.modal = {
              ...navigation.modal,
              validationMessage: validation.message,
            };
            onNavigate();
            return;
          }

          const pendingAction = navigation.modal.action;
          hideModal(navigation);
          runSelectedAction(pendingAction);
          return;
        }
        return;
      }

      if (navigation.modal?.kind === "output") {
        if (matchesKey(data, Key.enter) || matchesKey(data, Key.escape) || shouldExitTui(data)) {
          outputState = undefined;
          hideModal(navigation);
          onNavigate();
        }
        return;
      }

      if (navigation.route === "model-profiles" && navigation.modelProfiles?.mode === "assignments" && matchesKey(data, Key.escape)) {
        updateModelProfilesState(navigation, exitModelProfilesAssignments(navigation.modelProfiles));
        onNavigate();
        return;
      }

      if (shouldExitTui(data)) {
        onExit({ code: 0, reason: EXIT_REASON });
        return;
      }

      const printable = data.length === 1 ? data.toLowerCase() : undefined;
      const interactiveActions = getRouteInteractiveActions(navigation.route);
      syncSectionActionSelection(navigation, interactiveActions.length);

      if (navigation.route === "model-profiles") {
        const routeState = getRouteState("model-profiles");

        if ((routeState?.browse?.mode ?? navigation.modelProfiles?.mode) === "browse") {
          if (matchesKey(data, Key.up)) {
            updateModelProfilesState(navigation, moveModelProfilesSelection(navigation.modelProfiles, routeState?.profiles?.length ?? 1, -1));
            onNavigate();
            return;
          }

          if (matchesKey(data, Key.down)) {
            updateModelProfilesState(navigation, moveModelProfilesSelection(navigation.modelProfiles, routeState?.profiles?.length ?? 1, 1));
            onNavigate();
            return;
          }

          const intent = data === " "
            ? getModelProfilesBrowseIntent(routeState, "switch")
            : isDeleteKey(data)
              ? getModelProfilesBrowseIntent(routeState, "delete")
              : printable === "u"
                ? getModelProfilesBrowseIntent(routeState, "edit")
                : printable === "n"
                  ? getModelProfilesBrowseIntent(routeState, "create")
                  : { kind: "none" };

          if (intent.kind === "confirm-action") {
            showModal(navigation, createConfirmationState({ action: intent.action }));
            onNavigate();
            return;
          }

          if (intent.kind === "assignments-entry") {
            updateModelProfilesState(navigation, enterModelProfilesAssignments(navigation.modelProfiles, intent.targetProfileName));
            onNavigate();
            return;
          }

          if (intent.kind === "create-entry") {
            updateModelProfilesState(navigation, enterModelProfilesAssignments(navigation.modelProfiles, undefined));
            onNavigate();
            return;
          }
        }
      }

      if (navigation.route === "home" && matchesKey(data, Key.up)) {
        updateHomeSelection(navigation, -1);
        onNavigate();
        return;
      }

      if (navigation.route === "home" && matchesKey(data, Key.down)) {
        updateHomeSelection(navigation, 1);
        onNavigate();
        return;
      }

      if (navigation.route === "home" && matchesKey(data, Key.enter)) {
        activateSelectedHomeRoute(navigation);
        onNavigate();
        return;
      }

      if (navigation.route !== "home" && interactiveActions.length > 0 && matchesKey(data, Key.up)) {
        moveSelectedSectionAction(navigation, interactiveActions.length, -1);
        onNavigate();
        return;
      }

      if (navigation.route !== "home" && interactiveActions.length > 0 && matchesKey(data, Key.down)) {
        moveSelectedSectionAction(navigation, interactiveActions.length, 1);
        onNavigate();
        return;
      }

      if (navigation.route !== "home" && interactiveActions.length > 0 && matchesKey(data, Key.enter)) {
        const selectedAction = interactiveActions[navigation.sectionActionSelection ?? 0];
        if (!selectedAction) {
          onNavigate();
          return;
        }

        if (selectedAction.form) {
          showModal(navigation, createFormState({ action: selectedAction }));
          onNavigate();
          return;
        }

        if (selectedAction.kind === "mutate") {
          showModal(navigation, createConfirmationState({ action: resolveExecutableAction(selectedAction) }));
          onNavigate();
          return;
        }

        runSelectedAction(resolveExecutableAction(selectedAction));
        return;
      }

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
  loadModelProfilesScreenState = ({ navigation } = {}) => getModelProfilesScreenState({ navigation }),
  interactiveActionsByRoute = {},
  executeAction = ({ action }) => runActionCommand({ command: process.execPath, argv: [CLI_DISPATCH_PATH, ...action.argv] }),
} = {}) {
  const navigation = createNavigationState();
  navigation.sectionActionSelection = 0;
  navigation.modal = undefined;
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

  const screen = createMainScreen({
    navigation,
    onExit: stop,
    onNavigate: () => tui.requestRender(true),
    loadConfigurationStatus,
    loadStatusScreenState,
    loadModelProfilesScreenState,
    getInteractiveActions: (route) => interactiveActionsByRoute[route] ?? [],
    executeAction,
  });
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
