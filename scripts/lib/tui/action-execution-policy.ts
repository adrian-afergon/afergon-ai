// @ts-nocheck
import { hasDegradedRefreshGuidance } from "../model-profiles.js";
import { resolveActionArgv } from "./actions/definitions.js";

const OUTPUT_SUPPRESSING_ACTION_IDS = new Set(["models-switch-focused", "models-delete-focused"]);
const PROFILE_CREATE_ACTION_ID = "model-profiles-create-profile";

/** Resolves the executable action used by both section and modal flows. */
export function resolveExecutableAction(action, input = {}) {
  const argv = resolveActionArgv(action, input);
  return {
    ...action,
    argv,
    cliEquivalent: action.buildArgv ? `afergon-ai ${argv.join(" ")}` : (action.cliEquivalent ?? `afergon-ai ${argv.join(" ")}`),
    confirmation: typeof action.buildConfirmation === "function" ? action.buildConfirmation(input) : action.confirmation,
  };
}

/** Returns whether a clean profile switch or delete can return directly to its route. */
export function shouldSuppressSuccessfulOutputPanel(action, result, sanitizeOutput = String) {
  if (result?.ok !== true || !OUTPUT_SUPPRESSING_ACTION_IDS.has(action?.id)) {
    return false;
  }

  const stderr = sanitizeOutput(result.stderr ?? "").trim();
  return !stderr && !hasDegradedRefreshGuidance({ stdout: sanitizeOutput(result.stdout ?? "").toLowerCase(), stderr });
}

function shouldShowProfileCreateOutput(action, result) {
  return result?.ok === true && action?.id === PROFILE_CREATE_ACTION_ID && hasDegradedRefreshGuidance({
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? ""),
  });
}

/**
 * Owns action execution output policy while leaving route state and rendering
 * dependencies injected by the Pi TUI shell or a route controller.
 */
export function createActionExecutionPolicy({
  executeAction,
  createOutputState,
  showModal,
  hideModal,
  onNavigate,
  getRouteState = () => undefined,
  setOutputState,
  sanitizeOutput = String,
  finalizeSuccessfulDelete,
  finalizeSuccessfulProfileCreate,
}) {
  function showOutput(action, result) {
    const outputState = createOutputState({ action, result });
    setOutputState(outputState);
    showModal(outputState);
  }

  async function runSelectedAction(action) {
    let result;
    try {
      result = await executeAction({ action });
    } catch (error) {
      result = {
        ok: false,
        exitCode: 1,
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        timedOut: false,
      };
    }

    if (action.id === PROFILE_CREATE_ACTION_ID && result.ok) {
      finalizeSuccessfulProfileCreate?.(action, result);
      if (shouldShowProfileCreateOutput(action, result)) {
        showOutput(action, result);
      } else {
        setOutputState(undefined);
        hideModal();
      }
      onNavigate();
      return;
    }

    if (shouldSuppressSuccessfulOutputPanel(action, result, sanitizeOutput)) {
      if (action.id === "models-delete-focused") {
        finalizeSuccessfulDelete?.(getRouteState());
      }
      setOutputState(undefined);
      hideModal();
      onNavigate();
      return;
    }

    showOutput(action, result);
    onNavigate();
  }

  return { resolveExecutableAction, runSelectedAction, shouldSuppressSuccessfulOutputPanel };
}
