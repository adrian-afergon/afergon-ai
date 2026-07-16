import {
  getActiveProfile,
  getConfigPath,
  getInstalledModelProfileTools,
  getModelProfileProjectionDetail,
  getModelProfileToolLabel,
  getToolProfileStore,
  loadConfig,
  resolveAssignments,
  saveProfileAssignments,
  SUPPORTED_AGENTS,
} from "../model-profiles.js";
import type { SupportedModelTool } from "../model-profiles-core.js";
import { buildCommandArgv } from "./command-manifest.js";

export const NEW_PROFILE_ROW_LABEL = "* New Profile";

type BrowseIntent = "switch" | "delete" | "edit" | "create";

interface AssignmentRow {
  readonly agent: string;
  readonly configured: string;
  readonly effective: string | null;
  readonly source: string;
  readonly isFocused?: boolean;
}

interface FocusedProfileRow {
  readonly name: string;
  readonly isActive: boolean;
  readonly isCreate: boolean;
  readonly isFocused: boolean;
}

interface BrowseState {
  readonly focusedProfile?: FocusedProfileRow;
  readonly selectedTool?: SupportedModelTool;
}

interface ToolRow {
  readonly id: SupportedModelTool;
  readonly label: string;
  readonly isFocused: boolean;
}

interface ModelProfilesNavigationState {
  readonly mode?: "tools" | "browse" | "assignments";
  readonly focusedToolIndex?: number;
  readonly selectedToolId?: SupportedModelTool;
  readonly focusedProfileIndex?: number;
  readonly focusedAgentIndex?: number;
  readonly targetProfileName?: string;
  readonly stagedAssignments?: Record<string, string>;
  readonly createProfileName?: string;
  readonly createProfileSelection?: string;
  readonly createProfileValidation?: string;
}

interface NavigationState {
  readonly modelProfiles?: ModelProfilesNavigationState;
}

interface InlineCreateState {
  readonly value: string | undefined;
  readonly selection: string;
  readonly validationMessage: string | undefined;
}

interface BrowseProfileRow extends FocusedProfileRow {}

interface ModelProfilesScreenState {
  readonly cwd: string;
  readonly configPath: string;
  readonly title: "Model Profiles";
  readonly summary: {
    readonly state: "ok" | "warn" | "fail";
    readonly detail: string;
  };
  readonly activeProfile: string;
  readonly tools: readonly ToolRow[];
  readonly selectedTool?: SupportedModelTool;
  readonly toolLabel?: string;
  readonly projectionDetail?: string;
  readonly profiles: readonly BrowseProfileRow[];
  readonly assignments: readonly AssignmentRow[];
  readonly browse?: {
    readonly mode: "browse" | "assignments";
    readonly selectedTool: SupportedModelTool;
    readonly targetProfileName: string | undefined;
    readonly focusedAgentIndex: number;
    readonly stagedAssignments: Record<string, string>;
    readonly focusedProfile: FocusedProfileRow;
    readonly focusedProfileName: string;
    readonly isCreateSelected: boolean;
    readonly inlineCreate: InlineCreateState | undefined;
    readonly placeholderAssignments: readonly string[];
  };
  readonly interactiveActions: readonly [];
}

function formatModelConfigFailure(error: unknown): string {
  const reason = error instanceof Error && error.message ? error.message : String(error);

  return `Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'. Details: ${reason}`;
}

function summarizeProfiles(
  profileNames: readonly string[],
  activeProfile: string | null,
  exists: boolean,
  toolLabel: string,
): ModelProfilesScreenState["summary"] {
  if (!exists) {
    return {
      state: "warn",
      detail: `No afergon-ai model config exists yet. Create your first ${toolLabel} profile.`,
    };
  }

  if (profileNames.length === 0) {
    return {
      state: "warn",
      detail: `No ${toolLabel} profiles are available yet. Create a profile before switching models.`,
    };
  }

  return {
    state: "ok",
    detail: `${profileNames.length} ${toolLabel} profile(s) available. Active profile: ${activeProfile ?? "(none)"}.`,
  };
}

function getBrowseProfileRows(
  profileNames: readonly string[],
  activeProfileName: string | null,
  focusedProfileIndex = 0,
): readonly BrowseProfileRow[] {
  return [...profileNames, NEW_PROFILE_ROW_LABEL].map((name, index) => ({
    name,
    isActive: name === activeProfileName,
    isCreate: name === NEW_PROFILE_ROW_LABEL,
    isFocused: index === focusedProfileIndex,
  }));
}

function getFocusedProfileRow(
  profiles: readonly BrowseProfileRow[],
  focusedProfileIndex = 0,
): FocusedProfileRow {
  return profiles[Math.min(Math.max(focusedProfileIndex, 0), Math.max(profiles.length - 1, 0))] ?? {
    name: NEW_PROFILE_ROW_LABEL,
    isCreate: true,
    isFocused: true,
    isActive: false,
  };
}

export function getModelProfilesBrowseIntent(
  state: { readonly browse?: BrowseState } | undefined,
  intent: BrowseIntent,
):
  | { readonly kind: "none" }
  | { readonly kind: "create-entry" }
  | { readonly kind: "assignments-entry"; readonly targetProfileName: string }
  | {
      readonly kind: "run-action";
      readonly action: {
        readonly id: "models-switch-focused";
        readonly section: "model-profiles";
        readonly kind: "mutate";
        readonly label: string;
        readonly argv: readonly string[];
        readonly cliEquivalent: string;
      };
    }
  | {
      readonly kind: "confirm-action";
      readonly action: {
        readonly id: "models-delete-focused";
        readonly section: "model-profiles";
        readonly kind: "mutate";
        readonly label: string;
        readonly argv: readonly string[];
        readonly cliEquivalent: string;
        readonly confirmLabel: string;
        readonly confirmation: {
          readonly kind: "submit-cancel";
          readonly prompt: string;
        };
      };
    } {
  const focusedProfile = state?.browse?.focusedProfile;
  const tool = state?.browse?.selectedTool ?? "opencode";
  const toolLabel = getModelProfileToolLabel(tool);
  if (!focusedProfile) {
    return { kind: "none" };
  }

  if (intent === "switch") {
    if (focusedProfile.isCreate) {
      return { kind: "create-entry" };
    }

    return {
      kind: "run-action",
      action: {
        id: "models-switch-focused",
        section: "model-profiles",
        kind: "mutate",
        label: `Switch active ${toolLabel} profile to ${focusedProfile.name}`,
        argv: buildCommandArgv("models", ["--tool", tool, "switch", focusedProfile.name]),
        cliEquivalent: `afergon-ai models --tool ${tool} switch ${focusedProfile.name}`,
      },
    };
  }

  if (intent === "delete" && !focusedProfile.isCreate) {
    return {
      kind: "confirm-action",
      action: {
        id: "models-delete-focused",
        section: "model-profiles",
        kind: "mutate",
        label: `Delete ${toolLabel} profile ${focusedProfile.name}`,
        argv: buildCommandArgv("models", ["--tool", tool, "profile", "delete", focusedProfile.name]),
        cliEquivalent: `afergon-ai models --tool ${tool} profile delete ${focusedProfile.name}`,
        confirmLabel: `Delete the selected ${toolLabel} profile permanently?`,
        confirmation: {
          kind: "submit-cancel",
          prompt: `The selected ${toolLabel} profile will be deleted permanently and cannot be recovered.`,
        },
      },
    };
  }

  if (intent === "edit" && !focusedProfile.isCreate) {
    return { kind: "assignments-entry", targetProfileName: focusedProfile.name };
  }

  if (intent === "create") {
    return { kind: "create-entry" };
  }

  return { kind: "none" };
}

export function saveAssignmentsForProfile(
  profileName: string,
  assignments: Record<string, string>,
  options?: Parameters<typeof saveProfileAssignments>[2],
): ReturnType<typeof saveProfileAssignments> {
  return saveProfileAssignments(profileName, assignments, options);
}

export function getModelProfilesScreenState(
  { cwd = process.cwd(), env = process.env, navigation }: { cwd?: string; env?: NodeJS.ProcessEnv; navigation?: NavigationState } = {},
): ModelProfilesScreenState {
  let config;
  let configPath;
  let exists;

  try {
    ({ config, configPath, exists } = loadConfig(env));
  } catch (error) {
    return {
      cwd,
      configPath: getConfigPath(env),
      title: "Model Profiles",
      summary: {
        state: "fail",
        detail: formatModelConfigFailure(error),
      },
      activeProfile: "(unavailable)",
      tools: [],
      profiles: [],
      assignments: [],
      interactiveActions: [],
    };
  }

  const installedTools = getInstalledModelProfileTools({ cwd, env });
  const modelProfilesState = navigation?.modelProfiles ?? {};
  const hasNavigation = navigation?.modelProfiles !== undefined;
  const mode = modelProfilesState.mode ?? (hasNavigation ? "tools" : "browse");
  const selectedTool = modelProfilesState.selectedToolId;
  const tools = installedTools.map((tool, index) => ({
    id: tool,
    label: getModelProfileToolLabel(tool),
    isFocused: index === (modelProfilesState.focusedToolIndex ?? 0),
  }));

  if (hasNavigation && (mode === "tools" || !selectedTool || !installedTools.includes(selectedTool))) {
    const missingSelectedTool = mode !== "tools" && selectedTool && !installedTools.includes(selectedTool);
    return {
      cwd,
      configPath,
      title: "Model Profiles",
      summary: installedTools.length === 0
        ? {
            state: "warn",
            detail: "No user-scoped tool configuration was detected. Install Pi, Claude Code, or OpenCode, then reopen Model Profiles.",
          }
        : {
            state: missingSelectedTool ? "warn" : "ok",
            detail: missingSelectedTool
              ? `${getModelProfileToolLabel(selectedTool)} is no longer detected in user scope. Choose a detected tool.`
              : "Choose a detected tool before managing its profiles.",
          },
      activeProfile: "(none)",
      tools,
      profiles: [],
      assignments: [],
      interactiveActions: [],
    };
  }

  const tool = selectedTool ?? "opencode";
  const browseMode = mode === "assignments" ? "assignments" : "browse";
  const store = getToolProfileStore(config, tool);
  const activeProfileName = store.activeProfile;
  const activeProfile = getActiveProfile(config, tool) ?? {};
  const profileNames = Object.keys(store.profiles).sort();
  const focusedProfileIndex = navigation?.modelProfiles?.focusedProfileIndex ?? 0;
  const focusedAgentIndex = navigation?.modelProfiles?.focusedAgentIndex ?? 0;
  const targetProfileName = modelProfilesState.targetProfileName;
  const stagedAssignments = modelProfilesState.stagedAssignments ?? {};
  const inlineCreate = modelProfilesState.createProfileName !== undefined
    ? {
        value: modelProfilesState.createProfileName,
        selection: modelProfilesState.createProfileSelection ?? "input",
        validationMessage: modelProfilesState.createProfileValidation,
      }
    : undefined;
  const profiles = getBrowseProfileRows(profileNames, activeProfileName, focusedProfileIndex);
  const focusedProfile = getFocusedProfileRow(profiles, focusedProfileIndex);
  const baseAssignments = browseMode === "assignments"
    ? (targetProfileName ? store.profiles[targetProfileName] ?? {} : {})
    : (focusedProfile.isCreate ? {} : (store.profiles[focusedProfile.name] ?? activeProfile));
  const focusedAssignments = resolveAssignments({
    ...baseAssignments,
    ...stagedAssignments,
  }).map((assignment, index) => ({
    ...assignment,
    isFocused: browseMode === "assignments" && index === focusedAgentIndex,
  }));

  return {
    cwd,
    configPath,
    title: "Model Profiles",
    summary: summarizeProfiles(profileNames, activeProfileName, exists, getModelProfileToolLabel(tool)),
    activeProfile: activeProfileName ?? "(none)",
    tools,
    selectedTool: tool,
    toolLabel: getModelProfileToolLabel(tool),
    projectionDetail: getModelProfileProjectionDetail(tool),
    profiles,
    assignments: browseMode === "browse" && focusedProfile.isCreate ? [] : focusedAssignments,
    browse: {
      mode: browseMode,
      selectedTool: tool,
      targetProfileName,
      focusedAgentIndex,
      stagedAssignments,
      focusedProfile,
      focusedProfileName: focusedProfile.name,
      isCreateSelected: focusedProfile.isCreate,
      inlineCreate,
      placeholderAssignments: SUPPORTED_AGENTS,
    },
    interactiveActions: [],
  };
}
