import { createConfirmationState, createFormState, createOutputState } from "./actions/forms.js";
import { createActionExecutionPolicy } from "./action-execution-policy.js";
import { getModelProfilesBrowseIntent } from "./model-profiles-adapter.js";
import {
  appendModelProfilesInlineCreateCharacter,
  backspaceModelProfilesInlineCreateCharacter,
  enterModelProfilesAssignments,
  enterModelProfilesInlineCreate,
  enterModelProfilesTool,
  exitModelProfilesAssignments,
  exitModelProfilesInlineCreate,
  exitModelProfilesToTools,
  moveModelProfilesAssignmentSelection,
  moveModelProfilesInlineCreateSelection,
  moveModelProfilesSelection,
  moveModelProfilesToolSelection,
  openModal,
  closeModal,
  validateModelProfilesInlineCreate,
} from "./navigation.js";
import { buildCommandArgv } from "./command-manifest.js";

const DELETE_ESCAPE_SEQUENCE = "\u001b[3~";

function createProfileCreateAction(tool) {
  return {
    id: "model-profiles-create-profile",
    section: "model-profiles",
    kind: "mutate",
    label: `Create a ${tool} profile`,
    cliEquivalent: `afergon-ai models --tool ${tool} profile create <name>`,
    confirmLabel: "Create this profile now?",
    buildArgv: ({ profileName }) => buildCommandArgv("models", ["--tool", tool, "profile", "create", profileName]),
  } as const;
}

function createAssignmentStageAction(assignment) {
  return {
    id: "model-profiles-stage-assignment",
    section: "model-profiles",
    kind: "draft",
    label: `Set model for ${assignment.agent}`,
    agentName: assignment.agent,
    form: {
      kind: "fields",
      title: `Set model for ${assignment.agent}`,
      fields: [{ id: "model", label: "Model", type: "text", initialValue: "", required: true, requiredMessage: "Model is required." }],
    },
  } as const;
}

function updateModelProfilesState(navigation, nextState) {
  navigation.modelProfiles = nextState;
}

function showModal(navigation, modal) {
  navigation.modal = openModal(navigation, modal).modal;
}

function hideModal(navigation) {
  navigation.modal = closeModal(navigation).modal;
}

/**
 * Creates the route-local Model Profiles input controller.
 * Key recognition is injected so this module remains independent of Pi TUI.
 */
export function createModelProfilesInputController({
  navigation,
  onNavigate,
  getRouteState,
  executeAction,
  saveModelProfileAssignments,
  refreshActiveModelProfile,
  keyMatches,
}) {
  let outputState;

  function finalizeSuccessfulDelete(routeState) {
    const currentIndex = Number.isInteger(navigation.modelProfiles?.focusedProfileIndex) ? navigation.modelProfiles.focusedProfileIndex : 0;
    const maxIndex = Math.max((routeState?.profiles?.length ?? 1) - 1, 0);
    updateModelProfilesState(navigation, {
      ...navigation.modelProfiles,
      mode: "browse",
      focusedProfileIndex: Math.min(Math.max(currentIndex, 0), maxIndex),
      focusedAgentIndex: 0,
      targetProfileName: undefined,
      stagedAssignments: {},
      createProfileName: undefined,
      createProfileSelection: "input",
      createProfileValidation: undefined,
    });
  }

  const actionExecutionPolicy = createActionExecutionPolicy({
    executeAction,
    createOutputState,
    showModal: (modal) => showModal(navigation, modal),
    hideModal: () => hideModal(navigation),
    onNavigate,
    getRouteState,
    setOutputState: (nextOutputState) => { outputState = nextOutputState; },
    finalizeSuccessfulDelete,
    finalizeSuccessfulProfileCreate: (action) => {
      const refreshedRouteState = getRouteState();
      const createdProfileIndex = refreshedRouteState?.profiles?.findIndex((profile) => profile.name === action.targetProfileName);
      updateModelProfilesState(navigation, exitModelProfilesInlineCreate(navigation.modelProfiles, {
        focusedProfileIndex: createdProfileIndex >= 0 ? createdProfileIndex : navigation.modelProfiles?.focusedProfileIndex,
      }));
    },
  });
  const { resolveExecutableAction, runSelectedAction } = actionExecutionPolicy;

  function showAssignmentSaveError(error) {
    outputState = createOutputState({
      action: { id: "model-profiles-save-assignments", label: "Save staged assignments", cliEquivalent: "TUI assignment save" },
      result: { ok: false, exitCode: 1, stdout: "", stderr: error instanceof Error ? error.message : String(error), timedOut: false },
    });
    showModal(navigation, outputState);
    onNavigate();
  }

  function finalizeAssignmentSave(saveResult) {
    updateModelProfilesState(navigation, exitModelProfilesAssignments(navigation.modelProfiles));
    if (saveResult?.refreshResult?.degraded === true) {
      const refreshResult = saveResult.refreshResult ?? {};
      outputState = createOutputState({
        action: { id: "model-profiles-save-assignments", label: "Save staged assignments", cliEquivalent: "TUI assignment save" },
        result: { ok: true, exitCode: 0, stdout: [`Saved staged assignments for profile '${saveResult.profileName ?? "(unknown)"}'.`, refreshResult.stdout].filter(Boolean).join("\n"), stderr: refreshResult.stderr ?? "", timedOut: false },
      });
      showModal(navigation, outputState);
    } else {
      outputState = undefined;
      hideModal(navigation);
    }
    onNavigate();
  }

  function saveFocusedProfileAssignments() {
    try {
      const tool = navigation.modelProfiles?.selectedToolId ?? "opencode";
      const result = saveModelProfileAssignments({
        tool,
        profileName: navigation.modelProfiles?.targetProfileName,
        assignments: navigation.modelProfiles?.stagedAssignments ?? {},
        refreshActiveProfile: () => refreshActiveModelProfile({ tool }),
      });
      if (result && typeof result.then === "function") {
        result.then(finalizeAssignmentSave).catch(showAssignmentSaveError);
      } else {
        finalizeAssignmentSave(result);
      }
    } catch (error) {
      showAssignmentSaveError(error);
    }
  }

  function submitInlineProfileCreate() {
    const validatedState = validateModelProfilesInlineCreate(navigation.modelProfiles);
    updateModelProfilesState(navigation, validatedState);
    if (validatedState.createProfileValidation) {
      onNavigate();
      return;
    }
    const profileName = validatedState.createProfileName;
    const tool = validatedState.selectedToolId ?? "opencode";
    void runSelectedAction({ ...resolveExecutableAction(createProfileCreateAction(tool), { profileName }), targetProfileName: profileName });
  }

  function handleInput(data) {
    if (navigation.route !== "model-profiles") {
      return false;
    }
    const routeState = getRouteState();
    const mode = routeState?.browse?.mode ?? navigation.modelProfiles?.mode;
    const printable = data.length === 1 ? data.toLowerCase() : undefined;

    if (mode === "tools") {
      if (keyMatches.up(data) || keyMatches.down(data)) {
        updateModelProfilesState(
          navigation,
          moveModelProfilesToolSelection(navigation.modelProfiles, routeState?.tools?.length ?? 1, keyMatches.up(data) ? -1 : 1),
        );
        onNavigate();
        return true;
      }
      if (keyMatches.enter(data)) {
        const focusedTool = routeState?.tools?.[navigation.modelProfiles?.focusedToolIndex ?? 0];
        if (focusedTool?.id) {
          updateModelProfilesState(navigation, enterModelProfilesTool(navigation.modelProfiles, focusedTool.id));
          onNavigate();
        }
        return true;
      }
      return false;
    }

    if (mode === "assignments") {
      if (keyMatches.escape(data)) {
        updateModelProfilesState(navigation, exitModelProfilesAssignments(navigation.modelProfiles));
        onNavigate();
        return true;
      }
      if (keyMatches.up(data) || keyMatches.down(data)) {
        updateModelProfilesState(navigation, moveModelProfilesAssignmentSelection(navigation.modelProfiles, routeState?.assignments?.length ?? 1, keyMatches.up(data) ? -1 : 1));
        onNavigate();
        return true;
      }
      if (keyMatches.enter(data)) {
        const focusedAssignment = routeState?.assignments?.[navigation.modelProfiles?.focusedAgentIndex ?? 0];
        if (focusedAssignment) {
          showModal(navigation, createFormState({ action: createAssignmentStageAction(focusedAssignment) }));
          onNavigate();
        }
        return true;
      }
      if (printable === "s") {
        saveFocusedProfileAssignments();
        return true;
      }
      return false;
    }

    if (mode !== "browse") {
      return false;
    }
    const isInlineCreate = routeState?.browse?.inlineCreate !== undefined;
    if (isInlineCreate) {
      if (keyMatches.escape(data)) {
        updateModelProfilesState(navigation, exitModelProfilesInlineCreate(navigation.modelProfiles));
      } else if (keyMatches.up(data) || keyMatches.down(data)) {
        updateModelProfilesState(navigation, moveModelProfilesInlineCreateSelection(navigation.modelProfiles, keyMatches.up(data) ? -1 : 1));
      } else if (data === "\u007f") {
        updateModelProfilesState(navigation, backspaceModelProfilesInlineCreateCharacter(navigation.modelProfiles));
      } else if (keyMatches.enter(data)) {
        if (navigation.modelProfiles?.createProfileSelection === "cancel") {
          updateModelProfilesState(navigation, exitModelProfilesInlineCreate(navigation.modelProfiles));
          onNavigate();
          return true;
        }
        submitInlineProfileCreate();
        return true;
      } else if (data.length === 1) {
        updateModelProfilesState(navigation, appendModelProfilesInlineCreateCharacter(navigation.modelProfiles, data));
      } else {
        return false;
      }
      onNavigate();
      return true;
    }

    if (keyMatches.up(data) || keyMatches.down(data)) {
      updateModelProfilesState(navigation, moveModelProfilesSelection(navigation.modelProfiles, routeState?.profiles?.length ?? 1, keyMatches.up(data) ? -1 : 1));
      onNavigate();
      return true;
    }
    if (keyMatches.escape(data)) {
      updateModelProfilesState(navigation, exitModelProfilesToTools(navigation.modelProfiles));
      onNavigate();
      return true;
    }
    const intent: ReturnType<typeof getModelProfilesBrowseIntent> = keyMatches.enter(data)
      ? getModelProfilesBrowseIntent(routeState, "switch")
      : (data === DELETE_ESCAPE_SEQUENCE || printable === "d")
        ? getModelProfilesBrowseIntent(routeState, "delete")
        : printable === "u"
          ? getModelProfilesBrowseIntent(routeState, "edit")
          : printable === "n"
            ? getModelProfilesBrowseIntent(routeState, "create")
            : { kind: "none" };
    if (intent.kind === "run-action") {
      void runSelectedAction(intent.action);
      return true;
    }
    if (intent.kind === "confirm-action") {
      showModal(navigation, createConfirmationState({ action: intent.action }));
      onNavigate();
      return true;
    }
    if (intent.kind === "assignments-entry") {
      updateModelProfilesState(navigation, enterModelProfilesAssignments(navigation.modelProfiles, intent.targetProfileName));
      onNavigate();
      return true;
    }
    if (intent.kind === "create-entry") {
      updateModelProfilesState(navigation, enterModelProfilesInlineCreate(navigation.modelProfiles));
      onNavigate();
      return true;
    }
    return false;
  }

  return { clearOutputState: () => { outputState = undefined; }, getOutputState: () => outputState, handleInput, resolveExecutableAction, runSelectedAction };
}
