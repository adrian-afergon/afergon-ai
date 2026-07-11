import { sanitizeTerminalOutput } from "./forms-output.mjs";

interface ConfirmationAction {
  readonly id: string;
  readonly confirmation?: {
    readonly kind?: string;
    readonly expectedText?: unknown;
    readonly mismatchMessage?: string;
  };
}

interface CreateConfirmationStateOptions {
  readonly action: ConfirmationAction;
}

export interface ConfirmationState {
  readonly kind: "confirm";
  readonly actionId: string;
  readonly action: ConfirmationAction;
  readonly confirmation: ConfirmationAction["confirmation"];
  readonly value: string;
  readonly validationMessage: string;
}

export function createConfirmationState({ action }: CreateConfirmationStateOptions): ConfirmationState {
  return {
    kind: "confirm",
    actionId: action.id,
    action,
    value: "",
    validationMessage: "",
    confirmation: action.confirmation,
  };
}

export function appendConfirmationCharacter(confirmationState: ConfirmationState, character: string): ConfirmationState {
  return {
    ...confirmationState,
    value: `${confirmationState.value ?? ""}${character}`,
    validationMessage: "",
  };
}

export function backspaceConfirmationCharacter(confirmationState: ConfirmationState): ConfirmationState {
  return {
    ...confirmationState,
    value: `${confirmationState.value ?? ""}`.slice(0, -1),
    validationMessage: "",
  };
}

export function validateConfirmationState(confirmationState: ConfirmationState): { ok: true } | { ok: false; message: string } {
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
