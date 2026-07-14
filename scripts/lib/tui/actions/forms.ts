import { getOutputLines, sanitizeTerminalOutput } from "./forms-output.js";
import { appendConfirmationCharacter, backspaceConfirmationCharacter, createConfirmationState, validateConfirmationState } from "./forms-confirmation.js";
import { appendFormCharacter, backspaceFormCharacter, changeFormValue, createCheckboxFormState, createFormState, getCheckboxFormSubmitState, getFormInput, getFormSubmitState, moveCheckboxFormSelection, moveFormSelection, toggleCheckboxFormSelection, validateFormInput } from "./forms-state.js";

export { getOutputLines, sanitizeTerminalOutput };
export { appendConfirmationCharacter, backspaceConfirmationCharacter, createConfirmationState, validateConfirmationState };
export { appendFormCharacter, backspaceFormCharacter, changeFormValue, createCheckboxFormState, createFormState, getCheckboxFormSubmitState, getFormInput, getFormSubmitState, moveCheckboxFormSelection, moveFormSelection, toggleCheckboxFormSelection, validateFormInput };
export const createOutputState = ({ action, result }: { action: any; result: any }) => ({ kind: "output" as const, actionId: action.id, action, result });
