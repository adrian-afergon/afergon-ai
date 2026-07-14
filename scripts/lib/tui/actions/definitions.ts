import { isManifestCommandArgv } from "../command-manifest.js";
import { TUI_ROUTES } from "../navigation.js";

type ActionKind = "read" | "mutate";
type ActionSection = "configuration" | "status" | "model-profiles";

interface ActionFormOption {
  readonly id: string;
  readonly label: string;
}

interface ActionFieldDefinition {
  readonly id: string;
  readonly label: string;
}

interface ActionCheckboxesForm {
  readonly kind: "checkboxes";
  readonly title?: string;
  readonly options: readonly ActionFormOption[];
}

interface ActionPickerForm {
  readonly kind: "picker";
  readonly title?: string;
  readonly options: readonly ActionFormOption[];
}

interface ActionFieldsForm {
  readonly kind: "fields";
  readonly title?: string;
  readonly fields: readonly ActionFieldDefinition[];
}

type ActionForm = ActionCheckboxesForm | ActionPickerForm | ActionFieldsForm;
type ActionInput = Record<string, unknown>;
type BuildArgv = (input?: ActionInput) => readonly string[];
type BuildConfirmation = (input?: ActionInput) => string | undefined;

export interface ActionDefinition {
  readonly id: string;
  readonly section: ActionSection;
  readonly kind: ActionKind;
  readonly label: string;
  readonly argv?: readonly string[];
  readonly buildArgv?: BuildArgv;
  readonly buildConfirmation?: BuildConfirmation;
  readonly cliEquivalent?: string;
  readonly form?: ActionForm;
  readonly confirmLabel?: string;
  readonly refreshTarget?: string;
}

interface ActionDefinitionInput {
  readonly id?: string;
  readonly section?: string;
  readonly kind?: string;
  readonly label?: string;
  readonly argv?: readonly string[];
  readonly buildArgv?: BuildArgv;
  readonly buildConfirmation?: BuildConfirmation;
  readonly cliEquivalent?: string;
  readonly form?: ActionForm;
  readonly confirmLabel?: string;
  readonly refreshTarget?: string;
}

function assertArgv(argv: unknown): asserts argv is readonly string[] {
  if (!Array.isArray(argv) || argv.length === 0 || argv.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    throw new Error("Action definitions require a non-empty argv array of strings.");
  }
}

export function formatActionCliEquivalent(argv: unknown): string {
  assertArgv(argv);
  return `afergon-ai ${argv.join(" ")}`;
}

function assertForm(form: ActionForm | undefined): void {
  if (form == null) {
    return;
  }

  if (form.kind === "checkboxes" || form.kind === "picker") {
    if (!Array.isArray(form.options) || form.options.length === 0) {
      throw new Error("Picker-style action forms require a non-empty options definition.");
    }
    return;
  }

  if (form.kind === "fields") {
    if (!Array.isArray(form.fields) || form.fields.length === 0) {
      throw new Error("Field action forms require a non-empty fields definition.");
    }
    return;
  }

  throw new Error(`Unsupported action form kind: ${(form as { kind?: string }).kind}`);
}

export function resolveActionArgv(action: ActionDefinition, input: ActionInput = {}): readonly string[] {
  if (Array.isArray(action.argv)) {
    return action.argv;
  }

  if (typeof action.buildArgv !== "function") {
    throw new Error(`Action '${action.id}' is missing executable argv.`);
  }

  const argv = action.buildArgv(input);
  assertArgv(argv);
  if (!isManifestCommandArgv(argv)) {
    throw new Error("Executable action argv must be built from the stable manifest allowlist.");
  }

  return argv;
}

export function createActionDefinition({
  id,
  section,
  kind,
  label,
  argv,
  buildArgv,
  buildConfirmation,
  cliEquivalent,
  form,
  confirmLabel,
  refreshTarget,
}: ActionDefinitionInput = {}): Readonly<ActionDefinition> {
  if (typeof id !== "string" || typeof label !== "string" || id.length === 0 || label.length === 0) {
    throw new Error("Action id and label must be non-empty strings.");
  }
  if (!TUI_ROUTES.includes((section ?? "") as (typeof TUI_ROUTES)[number]) || section === "home") {
    throw new Error(`Unsupported action section: ${section}`);
  }
  if (kind !== "read" && kind !== "mutate") {
    throw new Error(`Unsupported action kind: ${kind}`);
  }

  const hasStaticArgv = argv !== undefined;
  const hasBuilder = typeof buildArgv === "function";
  if (hasStaticArgv === hasBuilder) {
    throw new Error("Action definitions require exactly one of argv or buildArgv.");
  }

  if (hasStaticArgv) {
    assertArgv(argv);
    if (!isManifestCommandArgv(argv)) {
      throw new Error("Executable action argv must be built from the stable manifest allowlist.");
    }
  }

  assertForm(form);

  const normalizedArgv = hasStaticArgv ? Object.freeze([...argv]) : undefined;
  return Object.freeze({
    id,
    section: section as ActionSection,
    kind: kind as ActionKind,
    label,
    argv: normalizedArgv,
    buildArgv: hasBuilder ? buildArgv : undefined,
    buildConfirmation: typeof buildConfirmation === "function" ? buildConfirmation : undefined,
    cliEquivalent: cliEquivalent ?? (normalizedArgv ? formatActionCliEquivalent(normalizedArgv) : undefined),
    form,
    confirmLabel,
    refreshTarget,
  });
}
