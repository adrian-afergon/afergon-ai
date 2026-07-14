import { sanitizeTerminalOutput } from "./forms-output.mjs";

export const createConfirmationState = ({ action } = {}) => ({
  kind: "confirm",
  actionId: action.id,
  action,
  value: "",
  validationMessage: "",
  confirmation: action.confirmation,
});

export function appendConfirmationCharacter(confirmationState, character) {
  return {
    ...confirmationState,
    value: `${confirmationState.value ?? ""}${character}`,
    validationMessage: "",
  };
}

export function backspaceConfirmationCharacter(confirmationState) {
  return {
    ...confirmationState,
    value: `${confirmationState.value ?? ""}`.slice(0, -1),
    validationMessage: "",
  };
}

export function validateConfirmationState(confirmationState) {
  if (confirmationState.confirmation?.kind !== "typed-match") {
    return { ok: true };
  }

  const expected = sanitizeTerminalOutput(String(confirmationState.confirmation.expectedText ?? "")).trim();
  const actual = sanitizeTerminalOutput(String(confirmationState.value ?? "")).trim();
  if (actual !== expected) {
    return {
      ok: false,
      message: confirmationState.confirmation.mismatchMessage ?? "Confirmation text does not match.",
    };
  }

  return { ok: true };
}
