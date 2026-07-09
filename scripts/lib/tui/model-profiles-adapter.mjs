import { getActiveProfile, getConfigPath, loadConfig, resolveAssignments, SUPPORTED_AGENTS } from "../model-profiles.mjs";
import { createActionDefinition } from "./actions/definitions.mjs";
import { buildCommandArgv, getCommandManifestEntry } from "./command-manifest.mjs";

export const NEW_PROFILE_ROW_LABEL = "* New Profile";

function formatModelConfigFailure(error) {
  const reason = error instanceof Error && error.message ? error.message : String(error);

  return `Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'. Details: ${reason}`;
}

function createStableModelsAction() {
  const manifestEntry = getCommandManifestEntry("models");

  return {
    ...manifestEntry,
    description: "Manage model profiles from the CLI.",
  };
}

function createSupportedActions() {
  return [
    {
      id: "review-profile",
      label: "Review current profile details",
      detail: "Inspect the active profile and resolved assignments.",
      command: "afergon-ai models",
    },
    {
      id: "manage-profiles",
      label: "Create, switch, or delete profiles",
      detail: "Use the CLI when you need to change profile membership.",
      command: undefined,
    },
    {
      id: "set-models",
      label: "Set agent-specific models",
      detail: "Use the CLI to update concrete or inherited agent assignments.",
      command: undefined,
    },
  ];
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

function createProfilePickerOptions(profileNames) {
  return profileNames.map((name) => ({ id: name, label: name }));
}

function createInteractiveActions(profileNames) {
  const actions = [
    createActionDefinition({
      id: "models-list",
      section: "model-profiles",
      kind: "read",
      label: "List saved profiles",
      argv: buildCommandArgv("models", ["list"]),
    }),
    createActionDefinition({
      id: "models-show",
      section: "model-profiles",
      kind: "read",
      label: "Show current profile details",
      argv: buildCommandArgv("models", ["show"]),
    }),
  ];

  if (profileNames.length > 0) {
    const options = createProfilePickerOptions(profileNames);
    actions.push(
      createActionDefinition({
        id: "models-profile-show",
        section: "model-profiles",
        kind: "read",
        label: "Show a saved profile",
        cliEquivalent: "afergon-ai models profile show <name>",
        buildArgv: ({ selectedId }) => buildCommandArgv("models", ["profile", "show", selectedId]),
        form: {
          kind: "picker",
          title: "Choose a profile",
          options,
        },
      }),
      createActionDefinition({
        id: "models-switch",
        section: "model-profiles",
        kind: "mutate",
        label: "Switch active profile",
        cliEquivalent: "afergon-ai models switch <profile>",
        buildArgv: ({ selectedId }) => buildCommandArgv("models", ["switch", selectedId]),
        form: {
          kind: "picker",
          title: "Choose a profile",
          options,
        },
        confirmLabel: "Switch the active profile now?",
        refreshTarget: "model-profiles",
      }),
    );
  }

  actions.push(
    createActionDefinition({
      id: "models-set",
      section: "model-profiles",
      kind: "mutate",
      label: "Set an agent model",
      cliEquivalent: "afergon-ai models set [--allow-unknown] <agent> <model|inherit>",
      buildArgv: ({ agent, model, allowUnknown }) =>
        buildCommandArgv("models", ["set", ...(allowUnknown ? ["--allow-unknown"] : []), agent, model]),
      form: {
        kind: "fields",
        title: "Set an agent model",
        fields: [
          {
            id: "agent",
            label: "Agent",
            type: "picker",
            options: SUPPORTED_AGENTS.map((agentName) => ({ id: agentName, label: agentName })),
          },
          { id: "model", label: "Model", type: "text", initialValue: "", required: true, requiredMessage: "Model is required." },
          { id: "allowUnknown", label: "Allow unknown model", type: "toggle", initialValue: false },
        ],
      },
      confirmLabel: "Save this model assignment?",
      refreshTarget: "model-profiles",
    }),
    createActionDefinition({
      id: "models-profile-create",
      section: "model-profiles",
      kind: "mutate",
      label: "Create a profile",
      cliEquivalent: "afergon-ai models profile create <name>",
        buildArgv: ({ profileName }) => buildCommandArgv("models", ["profile", "create", profileName]),
        form: {
          kind: "fields",
          title: "Create a profile",
          fields: [{ id: "profileName", label: "Profile name", type: "text", initialValue: "", required: true, requiredMessage: "Profile name is required." }],
        },
        confirmLabel: "Create this profile now?",
        refreshTarget: "model-profiles",
    }),
  );

  if (profileNames.length > 0) {
    actions.push(
      createActionDefinition({
        id: "models-profile-delete",
        section: "model-profiles",
        kind: "mutate",
        label: "Delete a profile",
        cliEquivalent: "afergon-ai models profile delete <name>",
        buildArgv: ({ selectedId }) => buildCommandArgv("models", ["profile", "delete", selectedId]),
        buildConfirmation: ({ selectedId }) => ({
          kind: "typed-match",
          prompt: "Type the selected profile name to confirm deletion.",
          expectedText: selectedId,
          mismatchMessage: "Confirmation text must match the selected profile name.",
        }),
        form: {
          kind: "picker",
          title: "Choose a profile",
          options: createProfilePickerOptions(profileNames),
        },
        confirmLabel: "Delete the selected profile permanently?",
        refreshTarget: "model-profiles",
      }),
    );
  }

  return actions;
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
      kind: "confirm-action",
      action: {
        id: "models-switch-focused",
        section: "model-profiles",
        kind: "mutate",
        label: `Switch active profile to ${focusedProfile.name}`,
        argv: buildCommandArgv("models", ["switch", focusedProfile.name]),
        cliEquivalent: `afergon-ai models switch ${focusedProfile.name}`,
        confirmLabel: "Switch the active profile now?",
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
    return { kind: "assignments-entry", targetProfileName: undefined };
  }

  return { kind: "none" };
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
      actions: [createStableModelsAction()],
      interactiveActions: [],
      supportedActions: createSupportedActions(),
    };
  }

  const activeProfileName = config.models.activeProfile;
  const activeProfile = getActiveProfile(config) ?? {};
  const profileNames = Object.keys(config.models.profiles).sort();
  const focusedProfileIndex = navigation?.modelProfiles?.focusedProfileIndex ?? 0;
  const profiles = getBrowseProfileRows(profileNames, activeProfileName, focusedProfileIndex);
  const focusedProfile = getFocusedProfileRow(profiles, focusedProfileIndex);
  const focusedAssignments = focusedProfile.isCreate
    ? []
    : resolveAssignments(config.models.profiles[focusedProfile.name] ?? activeProfile);

  return {
    cwd,
    configPath,
    title: "Model Profiles",
    summary: summarizeProfiles(profileNames, activeProfileName, exists),
    activeProfile: activeProfileName ?? "(none)",
    profiles,
    assignments: focusedAssignments,
    browse: {
      mode: navigation?.modelProfiles?.mode ?? "browse",
      targetProfileName: navigation?.modelProfiles?.targetProfileName,
      focusedProfile,
      focusedProfileName: focusedProfile.name,
      isCreateSelected: focusedProfile.isCreate,
    },
    actions: [createStableModelsAction()],
    interactiveActions: [],
    supportedActions: createSupportedActions(),
    browseActions: createInteractiveActions(profileNames),
  };
}
