import { createConfirmationState, createFormState } from "./actions/forms.mjs";
import { moveSectionActionSelection, normalizeSectionActionSelection } from "./navigation.mjs";

/**
 * Routes section action selection and activation without depending on Pi TUI.
 * Key recognition is injected so the MJS runtime shell retains Pi ownership.
 */
export function createSectionActionInputController({
  navigation,
  getRouteInteractiveActions,
  onNavigate,
  showModal,
  runSelectedAction,
  resolveExecutableAction,
  keyMatches,
}) {
  function getInteractiveActions() {
    const actions = getRouteInteractiveActions(navigation.route);
    return Array.isArray(actions) ? actions : [];
  }

  function syncSelection(actions = getInteractiveActions()) {
    Object.assign(navigation, normalizeSectionActionSelection(navigation, actions.length));
    return actions;
  }

  function handleInput(data) {
    const actions = syncSelection();
    if (navigation.route === "home") {
      return false;
    }

    if (actions.length === 0) {
      return false;
    }

    if (keyMatches.up(data) || keyMatches.down(data)) {
      Object.assign(navigation, moveSectionActionSelection(navigation, actions.length, keyMatches.up(data) ? -1 : 1));
      onNavigate();
      return true;
    }

    if (!keyMatches.enter(data)) {
      return false;
    }

    const selectedAction = actions[navigation.sectionActionSelection ?? 0];
    if (!selectedAction) {
      onNavigate();
      return true;
    }

    if (selectedAction.form) {
      showModal(createFormState({ action: selectedAction }));
      onNavigate();
      return true;
    }

    const executableAction = resolveExecutableAction(selectedAction);
    if (selectedAction.kind === "mutate") {
      showModal(createConfirmationState({ action: executableAction }));
      onNavigate();
      return true;
    }

    void runSelectedAction(executableAction);
    return true;
  }

  return { handleInput, syncSelection };
}
