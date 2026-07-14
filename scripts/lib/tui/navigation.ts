export const TUI_ROUTES = Object.freeze(["home", "configuration", "status", "model-profiles"] as const);
export const HOME_MENU_ROUTES = Object.freeze(["configuration", "status", "model-profiles"] as const);

export type TuiRoute = (typeof TUI_ROUTES)[number];
export type HomeMenuRoute = (typeof HOME_MENU_ROUTES)[number];
export type ModelProfilesMode = "browse" | "assignments";
export type InlineCreateSelection = "input" | "cancel";

export interface ModelProfilesState {
  readonly mode: ModelProfilesMode;
  readonly focusedProfileIndex: number;
  readonly focusedAgentIndex: number;
  readonly targetProfileName: string | undefined;
  readonly stagedAssignments: Readonly<Record<string, string>>;
  readonly createProfileName?: string | undefined;
  readonly createProfileSelection?: InlineCreateSelection;
  readonly createProfileValidation?: string | undefined;
}

export interface NavigationState {
  readonly route: TuiRoute;
  readonly homeSelection: number;
  readonly modelProfiles: ModelProfilesState;
  readonly routes: readonly TuiRoute[];
  readonly sectionActionSelection?: number;
  readonly modal?: unknown;
}

interface ExitInlineCreateOptions {
  readonly focusedProfileIndex?: number;
}

function createModelProfilesState(): ModelProfilesState {
  return {
    mode: "browse",
    focusedProfileIndex: 0,
    focusedAgentIndex: 0,
    targetProfileName: undefined,
    stagedAssignments: {},
  };
}

function assertHomeSelection(homeSelection: number): void {
  if (!Number.isInteger(homeSelection) || homeSelection < 0 || homeSelection >= HOME_MENU_ROUTES.length) {
    throw new Error(`Unsupported Home selection: ${homeSelection}`);
  }
}

function assertRoute(route: string): asserts route is TuiRoute {
  if (!TUI_ROUTES.includes(route as TuiRoute)) {
    throw new Error(`Unsupported TUI route: ${route}`);
  }
}

export function createNavigationState(initialRoute: string = "home", initialHomeSelection: number = 0): NavigationState {
  assertRoute(initialRoute);
  assertHomeSelection(initialHomeSelection);

  return {
    route: initialRoute,
    homeSelection: initialHomeSelection,
    modelProfiles: createModelProfilesState(),
    routes: [...TUI_ROUTES],
  };
}

export function navigateTo(state: NavigationState, route: string): NavigationState {
  assertRoute(route);

  return {
    ...state,
    route,
    modelProfiles: createModelProfilesState(),
    sectionActionSelection: 0,
    modal: undefined,
  };
}

export function moveModelProfilesSelection(state: Partial<ModelProfilesState> | undefined, profileCount: number, direction: number): ModelProfilesState {
  const safeCount = Number.isInteger(profileCount) && profileCount > 0 ? profileCount : 1;
  const focusedProfileIndex = state?.focusedProfileIndex;
  const current = typeof focusedProfileIndex === "number" && Number.isInteger(focusedProfileIndex) ? focusedProfileIndex : 0;

  return {
    ...createModelProfilesState(),
    ...state,
    mode: state?.mode ?? "browse",
    focusedProfileIndex: (current + direction + safeCount) % safeCount,
  };
}

export function enterModelProfilesInlineCreate(state: Partial<ModelProfilesState> | undefined): ModelProfilesState {
  return {
    ...createModelProfilesState(),
    ...state,
    mode: "browse",
    createProfileName: "",
    createProfileSelection: "input",
    createProfileValidation: undefined,
  };
}

export function exitModelProfilesInlineCreate(state: Partial<ModelProfilesState> | undefined, options: ExitInlineCreateOptions = {}): ModelProfilesState {
  const focusedProfileIndex = options.focusedProfileIndex;

  return {
    ...createModelProfilesState(),
    ...state,
    mode: "browse",
    focusedProfileIndex: typeof focusedProfileIndex === "number" && Number.isInteger(focusedProfileIndex)
      ? focusedProfileIndex
      : (state?.focusedProfileIndex ?? 0),
    createProfileName: undefined,
    createProfileSelection: "input",
    createProfileValidation: undefined,
  };
}

export function moveModelProfilesInlineCreateSelection(state: Partial<ModelProfilesState> | undefined, direction: number): ModelProfilesState {
  const currentSelection = state?.createProfileSelection === "cancel" ? 1 : 0;
  const nextSelection = (currentSelection + direction + 2) % 2;

  return {
    ...createModelProfilesState(),
    ...state,
    mode: "browse",
    createProfileSelection: nextSelection === 1 ? "cancel" : "input",
    createProfileValidation: undefined,
  };
}

export function appendModelProfilesInlineCreateCharacter(state: Partial<ModelProfilesState> | undefined, character: string): ModelProfilesState {
  return {
    ...createModelProfilesState(),
    ...state,
    mode: "browse",
    createProfileName: `${state?.createProfileName ?? ""}${character}`,
    createProfileSelection: "input",
    createProfileValidation: undefined,
  };
}

export function backspaceModelProfilesInlineCreateCharacter(state: Partial<ModelProfilesState> | undefined): ModelProfilesState {
  return {
    ...createModelProfilesState(),
    ...state,
    mode: "browse",
    createProfileName: (state?.createProfileName ?? "").slice(0, -1),
    createProfileSelection: "input",
    createProfileValidation: undefined,
  };
}

export function validateModelProfilesInlineCreate(state: Partial<ModelProfilesState> | undefined): ModelProfilesState {
  const profileName = (state?.createProfileName ?? "").trim();
  if (!profileName) {
    return {
      ...createModelProfilesState(),
      ...state,
      mode: "browse",
      createProfileSelection: "input",
      createProfileValidation: "Profile name is required.",
    };
  }

  return {
    ...createModelProfilesState(),
    ...state,
    mode: "browse",
    createProfileName: profileName,
    createProfileSelection: "input",
    createProfileValidation: undefined,
  };
}

export function enterModelProfilesAssignments(state: Partial<ModelProfilesState> | undefined, targetProfileName: string | undefined): ModelProfilesState {
  return {
    ...createModelProfilesState(),
    ...state,
    mode: "assignments",
    targetProfileName,
    stagedAssignments: { ...(state?.stagedAssignments ?? {}) },
  };
}

export function exitModelProfilesAssignments(state: Partial<ModelProfilesState> | undefined): ModelProfilesState {
  return {
    ...createModelProfilesState(),
    ...state,
    mode: "browse",
    targetProfileName: undefined,
    stagedAssignments: {},
  };
}

export function moveModelProfilesAssignmentSelection(state: Partial<ModelProfilesState> | undefined, assignmentCount: number, direction: number): ModelProfilesState {
  const safeCount = Number.isInteger(assignmentCount) && assignmentCount > 0 ? assignmentCount : 1;
  const focusedAgentIndex = state?.focusedAgentIndex;
  const current = typeof focusedAgentIndex === "number" && Number.isInteger(focusedAgentIndex) ? focusedAgentIndex : 0;

  return {
    ...createModelProfilesState(),
    ...state,
    mode: "assignments",
    focusedAgentIndex: (current + direction + safeCount) % safeCount,
    stagedAssignments: { ...(state?.stagedAssignments ?? {}) },
  };
}

export function stageModelProfilesAssignment(state: Partial<ModelProfilesState> | undefined, agentName: string, model: string): ModelProfilesState {
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

export function moveHomeSelection(state: NavigationState, direction: number): NavigationState {
  const currentSelection = state.homeSelection ?? 0;
  assertHomeSelection(currentSelection);

  const nextSelection = (currentSelection + direction + HOME_MENU_ROUTES.length) % HOME_MENU_ROUTES.length;

  return {
    ...state,
    homeSelection: nextSelection,
  };
}

export function activateHomeSelection(state: NavigationState): NavigationState {
  const currentSelection = state.homeSelection ?? 0;
  assertHomeSelection(currentSelection);

  return navigateTo(state, HOME_MENU_ROUTES[currentSelection]!);
}

export function moveSectionActionSelection(state: NavigationState, actionCount: number, direction: number): NavigationState {
  if (!Number.isInteger(actionCount) || actionCount <= 0) {
    return {
      ...state,
      sectionActionSelection: 0,
    };
  }

  const currentSelection = normalizeSectionActionSelection(state, actionCount).sectionActionSelection ?? 0;
  const nextSelection = (currentSelection + direction + actionCount) % actionCount;

  return {
    ...state,
    sectionActionSelection: nextSelection,
  };
}

export function normalizeSectionActionSelection(state: NavigationState, actionCount: number): NavigationState {
  if (!Number.isInteger(actionCount) || actionCount <= 0) {
    return {
      ...state,
      sectionActionSelection: 0,
    };
  }

  const rawSelection = state.sectionActionSelection;
  const nextSelection = typeof rawSelection === "number" && Number.isInteger(rawSelection)
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

export function openModal(state: NavigationState, modal: unknown): NavigationState {
  return {
    ...state,
    modal,
  };
}

export function closeModal(state: NavigationState): NavigationState {
  return {
    ...state,
    modal: undefined,
  };
}
