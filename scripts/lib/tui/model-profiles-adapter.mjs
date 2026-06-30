import { getActiveProfile, getConfigPath, loadConfig, resolveAssignments } from "../model-profiles.mjs";
import { getCommandManifestEntry } from "./command-manifest.mjs";

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

export function getModelProfilesScreenState({ cwd = process.cwd(), env = process.env } = {}) {
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
      supportedActions: createSupportedActions(),
    };
  }

  const activeProfileName = config.models.activeProfile;
  const activeProfile = getActiveProfile(config) ?? {};
  const profileNames = Object.keys(config.models.profiles).sort();

  return {
    cwd,
    configPath,
    title: "Model Profiles",
    summary: summarizeProfiles(profileNames, activeProfileName, exists),
    activeProfile: activeProfileName ?? "(none)",
    profiles: profileNames.map((name) => ({
      name,
      isActive: name === activeProfileName,
    })),
    assignments: resolveAssignments(activeProfile),
    actions: [createStableModelsAction()],
    supportedActions: createSupportedActions(),
  };
}
