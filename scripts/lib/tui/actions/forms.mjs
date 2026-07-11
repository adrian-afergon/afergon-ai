import { getOutputLines, sanitizeTerminalOutput } from "./forms-output.mjs";
import {
  appendConfirmationCharacter,
  backspaceConfirmationCharacter,
  createConfirmationState,
  validateConfirmationState,
} from "./forms-confirmation.mjs";

export { getOutputLines, sanitizeTerminalOutput } from "./forms-output.mjs";
export {
  appendConfirmationCharacter,
  backspaceConfirmationCharacter,
  createConfirmationState,
  validateConfirmationState,
} from "./forms-confirmation.mjs";

export const createOutputState = ({ action, result } = {}) => ({ kind: "output", actionId: action.id, action, result });

export function createCheckboxFormState({ action } = {}) {
  const options = action?.form?.options ?? [];
  const defaultSelectedIds = options.some((option) => option.id === "all") ? ["all"] : [];

  return {
    kind: "form",
    formKind: "checkboxes",
    actionId: action.id,
    action,
    activeIndex: 0,
    selectedIds: defaultSelectedIds,
    validationMessage: "",
  };
}

function createPickerFormState({ action } = {}) {
  return {
    kind: "form",
    formKind: "picker",
    actionId: action.id,
    action,
    activeIndex: 0,
    selectedId: action.form.options[0]?.id,
    validationMessage: "",
  };
}

function createFieldsFormState({ action } = {}) {
  return {
    kind: "form",
    formKind: "fields",
    actionId: action.id,
    action,
    activeIndex: 0,
    values: Object.fromEntries(
      action.form.fields.map((field) => [
        field.id,
        field.type === "toggle"
          ? Boolean(field.initialValue)
          : field.type === "picker"
            ? (field.options[0]?.id ?? "")
            : (field.initialValue ?? ""),
        ]),
    ),
    validationMessage: "",
  };
}

function clearValidationMessage(state) {
  return {
    ...state,
    validationMessage: "",
  };
}

export function createFormState({ action } = {}) {
  if (action?.form?.kind === "checkboxes") {
    return createCheckboxFormState({ action });
  }
  if (action?.form?.kind === "picker") {
    return createPickerFormState({ action });
  }
  if (action?.form?.kind === "fields") {
    return createFieldsFormState({ action });
  }

  throw new Error(`Unsupported form kind: ${action?.form?.kind}`);
}

function getFieldsFormItemCount(formState) {
  return formState.action.form.fields.length + 2;
}

function getFieldsFormField(formState) {
  return formState.action.form.fields[formState.activeIndex];
}

export function moveCheckboxFormSelection(formState, direction) {
  const optionCount = formState.action.form.options.length;
  const itemCount = optionCount + 2;
  return clearValidationMessage({
    ...formState,
    activeIndex: (formState.activeIndex + direction + itemCount) % itemCount,
  });
}

export function moveFormSelection(formState, direction) {
  if (formState.formKind === "picker") {
    const itemCount = formState.action.form.options.length + 1;
    return {
      ...clearValidationMessage(formState),
      activeIndex: (formState.activeIndex + direction + itemCount) % itemCount,
    };
  }

  if (formState.formKind === "fields") {
    const itemCount = getFieldsFormItemCount(formState);
    return {
      ...clearValidationMessage(formState),
      activeIndex: (formState.activeIndex + direction + itemCount) % itemCount,
    };
  }

  return moveCheckboxFormSelection(formState, direction);
}

export function toggleCheckboxFormSelection(formState) {
  const options = formState.action.form.options;
  const option = options[formState.activeIndex];
  if (!option) {
    return formState;
  }

  const selectedIds = new Set(formState.selectedIds);
  if (option.id === "all") {
    if (selectedIds.has("all")) {
      selectedIds.delete("all");
    } else {
      selectedIds.clear();
      selectedIds.add("all");
    }
  } else if (selectedIds.has(option.id)) {
    selectedIds.delete(option.id);
  } else {
    selectedIds.delete("all");
    selectedIds.add(option.id);
  }

  return {
    ...clearValidationMessage(formState),
    selectedIds: [...selectedIds],
  };
}

export function changeFormValue(formState, direction) {
  if (formState.formKind !== "fields") {
    return formState;
  }

  const field = getFieldsFormField(formState);
  if (!field) {
    return formState;
  }

  if (field.type === "toggle") {
    return {
      ...clearValidationMessage(formState),
      values: {
        ...formState.values,
        [field.id]: !formState.values[field.id],
      },
    };
  }

  if (field.type === "picker") {
    const currentIndex = Math.max(
      0,
      field.options.findIndex((option) => option.id === formState.values[field.id]),
    );
    const nextIndex = (currentIndex + direction + field.options.length) % field.options.length;
    return {
      ...clearValidationMessage(formState),
      values: {
        ...formState.values,
        [field.id]: field.options[nextIndex].id,
      },
    };
  }

  return formState;
}

export function appendFormCharacter(formState, character) {
  if (formState.formKind !== "fields") {
    return formState;
  }

  const field = getFieldsFormField(formState);
  if (!field || field.type !== "text") {
    return formState;
  }

  return {
    ...clearValidationMessage(formState),
    values: {
      ...formState.values,
      [field.id]: `${formState.values[field.id] ?? ""}${character}`,
    },
  };
}

export function backspaceFormCharacter(formState) {
  if (formState.formKind !== "fields") {
    return formState;
  }

  const field = getFieldsFormField(formState);
  if (!field || field.type !== "text") {
    return formState;
  }

  return {
    ...clearValidationMessage(formState),
    values: {
      ...formState.values,
      [field.id]: `${formState.values[field.id] ?? ""}`.slice(0, -1),
    },
  };
}

export function getCheckboxFormSubmitState(formState) {
  const submitIndex = formState.action.form.options.length;
  const cancelIndex = submitIndex + 1;
  return {
    isSubmit: formState.activeIndex === submitIndex,
    isCancel: formState.activeIndex === cancelIndex,
  };
}

export function getFormSubmitState(formState) {
  if (formState.formKind === "picker") {
    const cancelIndex = formState.action.form.options.length;
    return {
      isSubmit: formState.activeIndex < cancelIndex,
      isCancel: formState.activeIndex === cancelIndex,
    };
  }

  if (formState.formKind === "fields") {
    const submitIndex = formState.action.form.fields.length;
    const cancelIndex = submitIndex + 1;
    return {
      isSubmit: formState.activeIndex === submitIndex,
      isCancel: formState.activeIndex === cancelIndex,
    };
  }

  return getCheckboxFormSubmitState(formState);
}

export function getFormInput(formState) {
  if (formState.formKind === "picker") {
    const option = formState.action.form.options[formState.activeIndex] ?? formState.action.form.options[0];
    return { selectedId: option?.id };
  }

  if (formState.formKind === "fields") {
    return { ...formState.values };
  }

  return { selectedIds: formState.selectedIds };
}

export function validateFormInput(formState) {
  if (formState.formKind !== "fields") {
    return { ok: true, input: getFormInput(formState) };
  }

  for (const [index, field] of formState.action.form.fields.entries()) {
    const rawValue = formState.values[field.id];
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
    if (field.type === "text" && field.required && value.length === 0) {
      return {
        ok: false,
        message: field.requiredMessage ?? `${field.label} is required.`,
        activeIndex: index,
      };
    }

    if (field.type === "text" && typeof field.matchesSanitizedFieldId === "string") {
      const expected = sanitizeTerminalOutput(String(formState.values[field.matchesSanitizedFieldId] ?? "")).trim();
      const actual = sanitizeTerminalOutput(String(rawValue ?? "")).trim();
      if (actual !== expected) {
        return {
          ok: false,
          message: field.mismatchMessage ?? `${field.label} must match the selected value.`,
          activeIndex: index,
        };
      }
    }
  }

  return { ok: true, input: getFormInput(formState) };
}
