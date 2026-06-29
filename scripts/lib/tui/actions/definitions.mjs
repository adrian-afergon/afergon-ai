import { TUI_ROUTES } from "../navigation.mjs";
import { isManifestCommandArgv } from "../command-manifest.mjs";

function assertArgv(argv) {
  if (!Array.isArray(argv) || argv.length === 0 || argv.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    throw new Error("Action definitions require a non-empty argv array of strings.");
  }
}

export function formatActionCliEquivalent(argv) {
  assertArgv(argv);
  return `afergon-ai ${argv.join(" ")}`;
}

function assertForm(form) {
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

  throw new Error(`Unsupported action form kind: ${form.kind}`);
}

export function resolveActionArgv(action, input = {}) {
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
} = {}) {
  if (typeof id !== "string" || typeof label !== "string" || id.length === 0 || label.length === 0) {
    throw new Error("Action id and label must be non-empty strings.");
  }
  if (!TUI_ROUTES.includes(section) || section === "home") throw new Error(`Unsupported action section: ${section}`);
  if (kind !== "read" && kind !== "mutate") throw new Error(`Unsupported action kind: ${kind}`);
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
    section,
    kind,
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
