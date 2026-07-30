import fs from "node:fs";
import path from "node:path";

import { createActionDefinition, type ActionDefinition } from "./actions/definitions.js";
import { buildCommandArgv, getCommandManifestEntry, type CommandManifestEntry, type ManifestCommandArgv } from "./command-manifest.js";
import { getOpenCodeBaseDir, loadConfig } from "../model-profiles.js";

type SupportedInitId = "opencode";
type ManifestActionId = CommandManifestEntry["id"];
type StatusState = "ok" | "warn" | "fail";

interface StatusAction extends Readonly<CommandManifestEntry> {
  readonly description: string;
}

interface StatusItem {
  readonly id: string;
  readonly label: string;
  readonly state: StatusState;
  readonly detail: string;
}

interface StatusSummary {
  readonly label: "Readiness";
  readonly state: StatusState;
  readonly detail: string;
}

interface ConfigurationStatus {
  readonly title: "Configuration";
  readonly items: readonly StatusItem[];
  readonly actions: readonly StatusAction[];
  readonly interactiveActions: readonly ActionDefinition[];
}

interface StatusScreenState {
  readonly title: "Status";
  readonly summary: StatusSummary;
  readonly items: readonly StatusItem[];
  readonly actions: readonly StatusAction[];
  readonly interactiveActions: readonly ActionDefinition[];
}

interface GetStateOptions {
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
}

const CONFIGURATION_ACTION_DESCRIPTIONS: Readonly<Record<ManifestActionId, string>> = Object.freeze({
  init: "Initialize project files.",
  doctor: "Verify current installation state.",
  update: "Refresh installed afergon-ai files.",
  models: "Review and manage model profiles.",
});

const STATUS_ACTION_IDS = Object.freeze(["doctor", "init", "update", "models"] as const);

function createAction(id: ManifestActionId): StatusAction {
  const manifestEntry = getCommandManifestEntry(id);
  if (!manifestEntry) {
    throw new Error(`Unknown command manifest entry: ${id}`);
  }

  return {
    ...manifestEntry,
    description: CONFIGURATION_ACTION_DESCRIPTIONS[id],
  };
}

function formatModelConfigFailure(error: unknown): string {
  const reason = error instanceof Error && error.message ? error.message : String(error);

  return `Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'. Details: ${reason}`;
}

function getModelConfigItem(env: NodeJS.ProcessEnv): StatusItem {
  try {
    const { config, configPath, exists } = loadConfig(env);

    if (!exists) {
      return {
        id: "model-config",
        label: "Model config",
        state: "warn",
        detail: `Config file not created yet at ${configPath}.`,
      };
    }

    return {
      id: "model-config",
      label: "Model config",
      state: "ok",
      detail: `Config file exists at ${configPath}; active profile: ${config.models.activeProfile ?? "(none)"}.`,
    };
  } catch (error) {
    return {
      id: "model-config",
      label: "Model config",
      state: "fail",
      detail: formatModelConfigFailure(error),
    };
  }
}

function getProjectInstallItem({ id, label, filePath, presentDetail, missingDetail }: {
  readonly id: string;
  readonly label: string;
  readonly filePath: string;
  readonly presentDetail: string;
  readonly missingDetail: string;
}): StatusItem {
  return fs.existsSync(filePath)
    ? {
        id,
        label,
        state: "ok",
        detail: `${presentDetail} (${filePath})`,
      }
    : {
        id,
        label,
        state: "warn",
        detail: missingDetail,
      };
}

function getOpenCodeItem(env: NodeJS.ProcessEnv): StatusItem {
  const baseDir = getOpenCodeBaseDir(env);
  const configPath = path.join(baseDir, "opencode.json");
  const agentPath = path.join(baseDir, "agents", "afergon-ai.md");

  if (fs.existsSync(configPath) && fs.existsSync(agentPath)) {
    return {
      id: "opencode",
      label: "OpenCode",
      state: "ok",
      detail: `Managed install detected via ${configPath}.`,
    };
  }

  return {
    id: "opencode",
    label: "OpenCode",
    state: "warn",
    detail: `Managed install not detected under ${baseDir}.`,
  };
}

function createActions(actionIds: readonly ManifestActionId[]): readonly StatusAction[] {
  return actionIds.map((id) => createAction(id));
}

export function buildInitCommandArgv({ selectedIds = [] }: { selectedIds?: readonly string[] } = {}): ManifestCommandArgv {
  // OpenCode is the only supported host; the CLI default is `init` with no flags.
  void selectedIds;
  return buildCommandArgv("init");
}

function createInteractiveActions(section: "configuration" | "status"): readonly ActionDefinition[] {
  const doctorArgv = section === "status" ? buildCommandArgv("doctor", ["--opencode"]) : buildCommandArgv("doctor");

  return [
    createActionDefinition({
      id: `${section}-doctor`,
      section,
      kind: "read",
      label: section === "status" ? "Run doctor for OpenCode" : "Run doctor",
      argv: doctorArgv,
    }),
    createActionDefinition({
      id: `${section}-init`,
      section,
      kind: "mutate",
      label: "Initialize project files",
      cliEquivalent: "afergon-ai init",
      argv: buildCommandArgv("init"),
      confirmLabel: "Initialize OpenCode project files?",
      refreshTarget: section,
    }),
    createActionDefinition({
      id: `${section}-update`,
      section,
      kind: "mutate",
      label: "Refresh managed files",
      argv: buildCommandArgv("update"),
      confirmLabel: "Refresh the managed files for this installation?",
      refreshTarget: section,
    }),
  ];
}

function addGuidance(item: StatusItem): StatusItem {
  switch (item.id) {
    case "model-config":
      if (item.state === "warn") {
        return {
          ...item,
          detail: `${item.detail} Run 'afergon-ai models show' to inspect or create profiles.`,
        };
      }
      return item;
    case "opencode":
      if (item.state === "warn") {
        return {
          ...item,
          detail: `${item.detail} Run 'afergon-ai init --opencode' or 'afergon-ai doctor --opencode' to repair the managed host install.`,
        };
      }
      return item;
    default:
      return item;
  }
}

function getBaseStatusItems({ cwd, env }: { cwd: string; env: NodeJS.ProcessEnv }): readonly StatusItem[] {
  return [
    getModelConfigItem(env),
    getOpenCodeItem(env),
  ];
}

function summarizeItems(items: readonly StatusItem[]): StatusSummary {
  const hasFailures = items.some((item) => item.state === "fail");
  if (hasFailures) {
    return {
      label: "Readiness",
      state: "fail",
      detail: "Interactive workflows need attention. Run 'afergon-ai doctor' first, then repair any failed items.",
    };
  }

  const hasWarnings = items.some((item) => item.state === "warn");
  if (hasWarnings) {
    return {
      label: "Readiness",
      state: "warn",
      detail: "Setup is incomplete. Run 'afergon-ai init' for missing project files, then rerun 'afergon-ai doctor'.",
    };
  }

  return {
    label: "Readiness",
    state: "ok",
    detail: "Ready for guided workflows.",
  };
}

export function getConfigurationStatus({ cwd = process.cwd(), env = process.env }: GetStateOptions = {}): ConfigurationStatus {
  const items = getBaseStatusItems({ cwd, env });

  return {
    title: "Configuration",
    items,
    actions: createActions(["init", "doctor", "update", "models"]),
    interactiveActions: createInteractiveActions("configuration"),
  };
}

export function getStatusScreenState({ cwd = process.cwd(), env = process.env }: GetStateOptions = {}): StatusScreenState {
  const items = getBaseStatusItems({ cwd, env }).map((item) => addGuidance(item));

  return {
    title: "Status",
    summary: summarizeItems(items),
    items,
    actions: createActions(STATUS_ACTION_IDS),
    interactiveActions: createInteractiveActions("status"),
  };
}
