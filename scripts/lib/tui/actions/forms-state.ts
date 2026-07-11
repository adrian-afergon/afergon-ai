import { sanitizeTerminalOutput } from "./forms-output.mjs";

interface ActionFormOption {
  readonly id: string;
  readonly label?: string;
}

interface BaseActionField {
  readonly id: string;
  readonly label: string;
  readonly initialValue?: unknown;
}

interface TextActionField extends BaseActionField {
  readonly type: "text";
  readonly required?: boolean;
  readonly requiredMessage?: string;
  readonly matchesSanitizedFieldId?: string;
  readonly mismatchMessage?: string;
}

interface ToggleActionField extends BaseActionField {
  readonly type: "toggle";
}

interface PickerActionField extends BaseActionField {
  readonly type: "picker";
  readonly options: readonly ActionFormOption[];
}

type ActionField = TextActionField | ToggleActionField | PickerActionField;

interface CheckboxesActionForm {
  readonly kind: "checkboxes";
  readonly options: readonly ActionFormOption[];
}

interface PickerActionForm {
  readonly kind: "picker";
  readonly options: readonly ActionFormOption[];
}

interface FieldsActionForm {
  readonly kind: "fields";
  readonly fields: readonly ActionField[];
}

type ActionForm = CheckboxesActionForm | PickerActionForm | FieldsActionForm;

interface FormAction {
  readonly id: string;
  readonly form: ActionForm;
}

interface CheckboxAction extends FormAction {
  readonly form: CheckboxesActionForm;
}

interface PickerAction extends FormAction {
  readonly form: PickerActionForm;
}

interface FieldsAction extends FormAction {
  readonly form: FieldsActionForm;
}

interface CreateFormStateOptions<TAction extends FormAction = FormAction> {
  readonly action: TAction;
}

interface BaseFormState<TFormKind extends string, TAction extends FormAction> {
  readonly kind: "form";
  readonly formKind: TFormKind;
  readonly actionId: string;
  readonly action: TAction;
  readonly activeIndex: number;
  readonly validationMessage: string;
}

export interface CheckboxFormState extends BaseFormState<"checkboxes", CheckboxAction> {
  readonly selectedIds: readonly string[];
}

export interface PickerFormState extends BaseFormState<"picker", PickerAction> {
  readonly selectedId: string | undefined;
}

type FieldValue = unknown;

export interface FieldsFormState extends BaseFormState<"fields", FieldsAction> {
  readonly values: Readonly<Record<string, FieldValue>>;
}

export type FormState = CheckboxFormState | PickerFormState | FieldsFormState;

function getFieldInitialValue(field: ActionField): FieldValue {
  if (field.type === "toggle") {
    return Boolean(field.initialValue);
  }

  if (field.type === "picker") {
    return field.options[0]?.id ?? "";
  }

  return field.initialValue ?? "";
}

export function createCheckboxFormState({ action }: CreateFormStateOptions<CheckboxAction>): CheckboxFormState {
  const options = action.form.options;
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

function createPickerFormState({ action }: CreateFormStateOptions<PickerAction>): PickerFormState {
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

function createFieldsFormState({ action }: CreateFormStateOptions<FieldsAction>): FieldsFormState {
  return {
    kind: "form",
    formKind: "fields",
    actionId: action.id,
    action,
    activeIndex: 0,
    values: Object.fromEntries(action.form.fields.map((field) => [field.id, getFieldInitialValue(field)])),
    validationMessage: "",
  };
}

function clearValidationMessage<TState extends FormState>(state: TState): TState {
  return {
    ...state,
    validationMessage: "",
  };
}

export function createFormState({ action }: CreateFormStateOptions): FormState {
  if (action.form.kind === "checkboxes") {
    return createCheckboxFormState({ action: action as CheckboxAction });
  }

  if (action.form.kind === "picker") {
    return createPickerFormState({ action: action as PickerAction });
  }

  if (action.form.kind === "fields") {
    return createFieldsFormState({ action: action as FieldsAction });
  }

  throw new Error(`Unsupported form kind: ${(action.form as { kind?: string }).kind}`);
}

function getFieldsFormItemCount(formState: FieldsFormState): number {
  return formState.action.form.fields.length + 2;
}

function getFieldsFormField(formState: FieldsFormState): ActionField | undefined {
  return formState.action.form.fields[formState.activeIndex];
}

export function moveCheckboxFormSelection(formState: CheckboxFormState, direction: number): CheckboxFormState {
  const optionCount = formState.action.form.options.length;
  const itemCount = optionCount + 2;

  return clearValidationMessage({
    ...formState,
    activeIndex: (formState.activeIndex + direction + itemCount) % itemCount,
  });
}

export function moveFormSelection(formState: FormState, direction: number): FormState {
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

export function toggleCheckboxFormSelection(formState: CheckboxFormState): CheckboxFormState {
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

export function changeFormValue(formState: FormState, direction: number): FormState {
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
    const currentIndex = Math.max(0, field.options.findIndex((option) => option.id === formState.values[field.id]));
    const nextIndex = (currentIndex + direction + field.options.length) % field.options.length;
    const nextOption = field.options[nextIndex];

    return {
      ...clearValidationMessage(formState),
      values: {
        ...formState.values,
        [field.id]: nextOption.id,
      },
    };
  }

  return formState;
}

export function appendFormCharacter(formState: FormState, character: string): FormState {
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

export function backspaceFormCharacter(formState: FormState): FormState {
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

export function getCheckboxFormSubmitState(formState: CheckboxFormState): { isSubmit: boolean; isCancel: boolean } {
  const submitIndex = formState.action.form.options.length;
  const cancelIndex = submitIndex + 1;

  return {
    isSubmit: formState.activeIndex === submitIndex,
    isCancel: formState.activeIndex === cancelIndex,
  };
}

export function getFormSubmitState(formState: FormState): { isSubmit: boolean; isCancel: boolean } {
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

export function getFormInput(formState: FormState): Record<string, unknown> | { selectedId: string | undefined } | { selectedIds: readonly string[] } {
  if (formState.formKind === "picker") {
    const option = formState.action.form.options[formState.activeIndex] ?? formState.action.form.options[0];
    return { selectedId: option?.id };
  }

  if (formState.formKind === "fields") {
    return { ...formState.values };
  }

  return { selectedIds: formState.selectedIds };
}

export function validateFormInput(
  formState: FormState,
): { ok: true; input: ReturnType<typeof getFormInput> } | { ok: false; message: string; activeIndex: number } {
  if (formState.formKind !== "fields") {
    return { ok: true, input: getFormInput(formState) };
  }

  for (const [index, field] of formState.action.form.fields.entries()) {
    const rawValue = formState.values[field.id];
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (field.type === "text" && field.required && typeof value === "string" && value.length === 0) {
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
