import {
  appendConfirmationCharacter,
  appendFormCharacter,
  backspaceConfirmationCharacter,
  backspaceFormCharacter,
  changeFormValue,
  createConfirmationState,
  getFormInput,
  getFormSubmitState,
  moveFormSelection,
  toggleCheckboxFormSelection,
  validateConfirmationState,
  validateFormInput,
} from "./actions/forms.mjs";

function showFormValidation(navigation, validation) {
  navigation.modal = {
    ...navigation.modal,
    activeIndex: validation.activeIndex ?? navigation.modal.activeIndex,
    validationMessage: validation.message,
  };
}

/**
 * Routes keyboard input for modal state without depending on Pi TUI internals.
 */
export function createModalInputController({
  navigation,
  getOutputState,
  clearOutputState,
  onNavigate,
  onFormSubmit,
  runSelectedAction,
  resolveExecutableAction,
  showModal,
  hideModal,
  shouldDismissOutput = (data) => data.length === 1 && data.toLowerCase() === "q",
  keyMatches,
}) {
  function handleFormInput(data) {
    if (keyMatches.up(data)) {
      navigation.modal = moveFormSelection(navigation.modal, -1);
    } else if (keyMatches.down(data)) {
      navigation.modal = moveFormSelection(navigation.modal, 1);
    } else if (keyMatches.escape(data)) {
      hideModal();
    } else if (keyMatches.left(data)) {
      navigation.modal = changeFormValue(navigation.modal, -1);
    } else if (keyMatches.right(data) || data === " ") {
      navigation.modal = navigation.modal.formKind === "checkboxes"
        ? toggleCheckboxFormSelection(navigation.modal)
        : changeFormValue(navigation.modal, 1);
    } else if (data === "\u007f") {
      navigation.modal = backspaceFormCharacter(navigation.modal);
    } else if (data.length === 1 && data !== "\r") {
      navigation.modal = appendFormCharacter(navigation.modal, data);
    } else if (!keyMatches.enter(data)) {
      return true;
    } else {
      const submitState = getFormSubmitState(navigation.modal);
      if (submitState.isCancel) {
        hideModal();
      } else if (onFormSubmit?.({ modal: navigation.modal, submitState })) {
        // The caller owns route-specific draft state transitions.
      } else if (navigation.modal.formKind === "checkboxes" && !submitState.isSubmit) {
        navigation.modal = toggleCheckboxFormSelection(navigation.modal);
      } else if (submitState.isSubmit || navigation.modal.formKind === "picker") {
        const validation = validateFormInput(navigation.modal);
        if (!validation.ok) {
          showFormValidation(navigation, validation);
        } else {
          const resolvedAction = resolveExecutableAction(navigation.modal.action, validation.input ?? getFormInput(navigation.modal));
          if (resolvedAction.kind === "mutate") {
            showModal(createConfirmationState({ action: resolvedAction }));
          } else {
            hideModal();
            void runSelectedAction(resolvedAction);
          }
        }
      } else {
        navigation.modal = changeFormValue(navigation.modal, 1);
      }
    }
    onNavigate();
    return true;
  }

  function handleConfirmationInput(data) {
    if (navigation.modal.confirmation?.kind === "submit-cancel" && (keyMatches.up(data) || keyMatches.down(data))) {
      navigation.modal = { ...navigation.modal, activeChoice: navigation.modal.activeChoice === "cancel" ? "submit" : "cancel" };
    } else if (keyMatches.escape(data)) {
      hideModal();
    } else if (navigation.modal.confirmation?.kind === "typed-match" && data === "\u007f") {
      navigation.modal = backspaceConfirmationCharacter(navigation.modal);
    } else if (navigation.modal.confirmation?.kind === "typed-match" && data.length === 1 && data !== "\r") {
      navigation.modal = appendConfirmationCharacter(navigation.modal, data);
    } else if (keyMatches.enter(data)) {
      if (navigation.modal.confirmation?.kind === "submit-cancel" && navigation.modal.activeChoice === "cancel") {
        hideModal();
      } else {
        const validation = validateConfirmationState(navigation.modal);
        if (!validation.ok) {
          navigation.modal = { ...navigation.modal, validationMessage: validation.message };
        } else {
          const pendingAction = navigation.modal.action;
          hideModal();
          void runSelectedAction(pendingAction);
          return true;
        }
      }
    } else {
      return true;
    }
    onNavigate();
    return true;
  }

  function handleInput(data) {
    if (navigation.modal?.kind === "form") return handleFormInput(data);
    if (navigation.modal?.kind === "confirm") return handleConfirmationInput(data);
    if (navigation.modal?.kind === "output") {
      if (keyMatches.enter(data) || keyMatches.escape(data) || shouldDismissOutput(data)) {
        clearOutputState();
        hideModal();
        onNavigate();
      }
      return true;
    }
    return false;
  }

  return { getOutputState, handleInput };
}
