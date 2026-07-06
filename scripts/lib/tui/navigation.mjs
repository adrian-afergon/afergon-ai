export const TUI_ROUTES = Object.freeze(["home", "configuration", "status", "model-profiles"]);
export const HOME_MENU_ROUTES = Object.freeze(["configuration", "status", "model-profiles"]);

function createModelProfilesState() {
  return {
    mode: "browse",
    focusedProfileIndex: 0,
    focusedAgentIndex: 0,
    targetProfileName: undefined,
    stagedAssignments: {},
  };
}

function assertHomeSelection(homeSelection) {
  if (!Number.isInteger(homeSelection) || homeSelection < 0 || homeSelection >= HOME_MENU_ROUTES.length) {
    throw new Error(`Unsupported Home selection: ${homeSelection}`);
  }
}

function assertRoute(route) {
  if (!TUI_ROUTES.includes(route)) {
    throw new Error(`Unsupported TUI route: ${route}`);
  }
}

export function createNavigationState(initialRoute = "home", initialHomeSelection = 0) {
  assertRoute(initialRoute);
  assertHomeSelection(initialHomeSelection);

  return {
    route: initialRoute,
    homeSelection: initialHomeSelection,
    modelProfiles: createModelProfilesState(),
    routes: [...TUI_ROUTES],
  };
}

export function navigateTo(state, route) {
  assertRoute(route);

  return {
    ...state,
    route,
    modelProfiles: createModelProfilesState(),
    sectionActionSelection: 0,
    modal: undefined,
  };
}

export function moveModelProfilesSelection(state, profileCount, direction) {
  const safeCount = Number.isInteger(profileCount) && profileCount > 0 ? profileCount : 1;
  const current = Number.isInteger(state?.focusedProfileIndex) ? state.focusedProfileIndex : 0;

  return {
    ...createModelProfilesState(),
    ...state,
    mode: state?.mode ?? "browse",
    focusedProfileIndex: (current + direction + safeCount) % safeCount,
  };
}

export function enterModelProfilesAssignments(state, targetProfileName) {
  return {
    ...createModelProfilesState(),
    ...state,
    mode: "assignments",
    targetProfileName,
    stagedAssignments: { ...(state?.stagedAssignments ?? {}) },
  };
}

export function exitModelProfilesAssignments(state) {
  return {
    ...createModelProfilesState(),
    ...state,
    mode: "browse",
    targetProfileName: undefined,
    stagedAssignments: {},
  };
}

export function moveModelProfilesAssignmentSelection(state, assignmentCount, direction) {
  const safeCount = Number.isInteger(assignmentCount) && assignmentCount > 0 ? assignmentCount : 1;
  const current = Number.isInteger(state?.focusedAgentIndex) ? state.focusedAgentIndex : 0;

  return {
    ...createModelProfilesState(),
    ...state,
    mode: "assignments",
    focusedAgentIndex: (current + direction + safeCount) % safeCount,
    stagedAssignments: { ...(state?.stagedAssignments ?? {}) },
  };
}

export function stageModelProfilesAssignment(state, agentName, model) {
  return {
    ...createModelProfilesState(),
    ...state,
    mode: "assignments",
    stagedAssignments: {
      ...(state?.stagedAssignments ?? {}),
      [agentName]: model,
    },
  };
}

export function moveHomeSelection(state, direction) {
  const currentSelection = state.homeSelection ?? 0;
  assertHomeSelection(currentSelection);

  const nextSelection = (currentSelection + direction + HOME_MENU_ROUTES.length) % HOME_MENU_ROUTES.length;

  return {
    ...state,
    homeSelection: nextSelection,
  };
}

export function activateHomeSelection(state) {
  const currentSelection = state.homeSelection ?? 0;
  assertHomeSelection(currentSelection);

  return navigateTo(state, HOME_MENU_ROUTES[currentSelection]);
}

export function moveSectionActionSelection(state, actionCount, direction) {
  if (!Number.isInteger(actionCount) || actionCount <= 0) {
    return {
      ...state,
      sectionActionSelection: 0,
    };
  }

  const currentSelection = normalizeSectionActionSelection(state, actionCount).sectionActionSelection;
  const nextSelection = (currentSelection + direction + actionCount) % actionCount;

  return {
    ...state,
    sectionActionSelection: nextSelection,
  };
}

export function normalizeSectionActionSelection(state, actionCount) {
  if (!Number.isInteger(actionCount) || actionCount <= 0) {
    return {
      ...state,
      sectionActionSelection: 0,
    };
  }

  const rawSelection = state.sectionActionSelection;
  const nextSelection = Number.isInteger(rawSelection)
    ? Math.min(Math.max(rawSelection, 0), actionCount - 1)
    : 0;

  if (nextSelection === rawSelection) {
    return state;
  }

  return {
    ...state,
    sectionActionSelection: nextSelection,
  };
}

export function openModal(state, modal) {
  return {
    ...state,
    modal,
  };
}

export function closeModal(state) {
  return {
    ...state,
    modal: undefined,
  };
}
