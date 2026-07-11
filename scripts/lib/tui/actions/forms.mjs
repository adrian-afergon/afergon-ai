import { getOutputLines, sanitizeTerminalOutput } from "./forms-output.mjs";
import {
  appendConfirmationCharacter,
  backspaceConfirmationCharacter,
  createConfirmationState,
  validateConfirmationState,
} from "./forms-confirmation.mjs";
import {
  appendFormCharacter,
  backspaceFormCharacter,
  changeFormValue,
  createCheckboxFormState,
  createFormState,
  getCheckboxFormSubmitState,
  getFormInput,
  getFormSubmitState,
  moveCheckboxFormSelection,
  moveFormSelection,
  toggleCheckboxFormSelection,
  validateFormInput,
} from "./forms-state.mjs";

export { getOutputLines, sanitizeTerminalOutput } from "./forms-output.mjs";
export {
  appendConfirmationCharacter,
  backspaceConfirmationCharacter,
  createConfirmationState,
  validateConfirmationState,
} from "./forms-confirmation.mjs";
export {
  appendFormCharacter,
  backspaceFormCharacter,
  changeFormValue,
  createCheckboxFormState,
  createFormState,
  getCheckboxFormSubmitState,
  getFormInput,
  getFormSubmitState,
  moveCheckboxFormSelection,
  moveFormSelection,
  toggleCheckboxFormSelection,
  validateFormInput,
} from "./forms-state.mjs";

export const createOutputState = ({ action, result } = {}) => ({ kind: "output", actionId: action.id, action, result });
