import { getActiveProfile, getConfigPath, loadConfig, resolveAssignments, saveProfileAssignments, SUPPORTED_AGENTS } from "../model-profiles.mjs";
import { buildCommandArgv } from "./command-manifest.mjs";

export const NEW_PROFILE_ROW_LABEL = "* New Profile";

function formatModelConfigFailure(error) {
  const reason = error instanceof Error && error.message ? error.message : String(error);

  return `Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'. Details: ${reason}`;
}

function summarizeProfiles(profileNames, activeProfile, exists) {
  if (!exists) {
    return {
      state: "warn",
      detail: "No afergon-ai model config exists yet. Use the CLI to create your first profile.",
    };
  }

  if (profileNames.length === 0) {
    return {
      state: "warn",
      detail: "No named profiles are available yet. Use the CLI to create a profile before switching models.",
    };
  }

  return {
    state: "ok",
    detail: `${profileNames.length} profile(s) available. Active profile: ${activeProfile ?? "(none)"}.`,
  };
}

function getBrowseProfileRows(profileNames, activeProfileName, focusedProfileIndex = 0) {
  return [...profileNames, NEW_PROFILE_ROW_LABEL].map((name, index) => ({
    name,
    isActive: name === activeProfileName,
    isCreate: name === NEW_PROFILE_ROW_LABEL,
    isFocused: index === focusedProfileIndex,
  }));
}

function getFocusedProfileRow(profiles, focusedProfileIndex = 0) {
  return profiles[Math.min(Math.max(focusedProfileIndex, 0), Math.max(profiles.length - 1, 0))] ?? {
    name: NEW_PROFILE_ROW_LABEL,
    isCreate: true,
    isFocused: true,
    isActive: false,
  };
}

export function getModelProfilesBrowseIntent(state, intent) {
  const focusedProfile = state?.browse?.focusedProfile;
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
        label: `Switch active profile to ${focusedProfile.name}`,
        argv: buildCommandArgv("models", ["switch", focusedProfile.name]),
        cliEquivalent: `afergon-ai models switch ${focusedProfile.name}`,
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
        label: `Delete profile ${focusedProfile.name}`,
        argv: buildCommandArgv("models", ["profile", "delete", focusedProfile.name]),
        cliEquivalent: `afergon-ai models profile delete ${focusedProfile.name}`,
        confirmLabel: "Delete the selected profile permanently?",
        confirmation: {
          kind: "typed-match",
          prompt: "Type the selected profile name to confirm deletion.",
          expectedText: focusedProfile.name,
          mismatchMessage: "Confirmation text must match the selected profile name.",
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

export function saveAssignmentsForProfile(profileName, assignments, options) {
  return saveProfileAssignments(profileName, assignments, options);
}

export function getModelProfilesScreenState({ cwd = process.cwd(), env = process.env, navigation } = {}) {
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
      profiles: [],
      assignments: [],
      interactiveActions: [],
    };
  }

  const activeProfileName = config.models.activeProfile;
  const activeProfile = getActiveProfile(config) ?? {};
  const profileNames = Object.keys(config.models.profiles).sort();
  const modelProfilesState = navigation?.modelProfiles ?? {};
  const mode = modelProfilesState.mode ?? "browse";
  const focusedProfileIndex = navigation?.modelProfiles?.focusedProfileIndex ?? 0;
  const focusedAgentIndex = navigation?.modelProfiles?.focusedAgentIndex ?? 0;
  const targetProfileName = modelProfilesState.targetProfileName;
  const stagedAssignments = modelProfilesState.stagedAssignments ?? {};
  const profiles = getBrowseProfileRows(profileNames, activeProfileName, focusedProfileIndex);
  const focusedProfile = getFocusedProfileRow(profiles, focusedProfileIndex);
  const baseAssignments = mode === "assignments"
    ? (targetProfileName ? config.models.profiles[targetProfileName] ?? {} : {})
    : (focusedProfile.isCreate ? {} : (config.models.profiles[focusedProfile.name] ?? activeProfile));
  const focusedAssignments = resolveAssignments({
    ...baseAssignments,
    ...stagedAssignments,
  }).map((assignment, index) => ({
    ...assignment,
    isFocused: mode === "assignments" && index === focusedAgentIndex,
  }));

  return {
    cwd,
    configPath,
    title: "Model Profiles",
    summary: summarizeProfiles(profileNames, activeProfileName, exists),
    activeProfile: activeProfileName ?? "(none)",
    profiles,
    assignments: mode === "browse" && focusedProfile.isCreate ? [] : focusedAssignments,
    browse: {
      mode,
      targetProfileName,
      focusedAgentIndex,
      stagedAssignments,
      focusedProfile,
      focusedProfileName: focusedProfile.name,
      isCreateSelected: focusedProfile.isCreate,
      placeholderAssignments: SUPPORTED_AGENTS,
    },
    interactiveActions: [],
  };
}
