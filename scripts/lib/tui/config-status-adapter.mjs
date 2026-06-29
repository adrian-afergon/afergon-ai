import fs from "node:fs";
import path from "node:path";

import { getOpenCodeBaseDir, loadConfig } from "../model-profiles.mjs";
import { getCommandManifestEntry } from "./command-manifest.mjs";

const CONFIGURATION_ACTION_DESCRIPTIONS = Object.freeze({
  init: "Initialize project files.",
  doctor: "Verify current installation state.",
  update: "Refresh installed afergon-ai files.",
  models: "Review and manage model profiles.",
});

const STATUS_ACTION_IDS = Object.freeze(["doctor", "init", "update", "models"]);

function createAction(id) {
  const manifestEntry = getCommandManifestEntry(id);

  return {
    ...manifestEntry,
    description: CONFIGURATION_ACTION_DESCRIPTIONS[id],
  };
}

function formatModelConfigFailure(error) {
  const reason = error instanceof Error && error.message ? error.message : String(error);

  return `Model config could not be read. Repair the file or move it aside, then rerun 'afergon-ai models show'. Details: ${reason}`;
}

function getModelConfigItem(env) {
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

function getProjectInstallItem({ id, label, filePath, presentDetail, missingDetail }) {
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

function getOpenCodeItem(env) {
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

function createActions(actionIds) {
  return actionIds.map((id) => createAction(id));
}

function addGuidance(item) {
  switch (item.id) {
    case "model-config":
      if (item.state === "warn") {
        return {
          ...item,
          detail: `${item.detail} Run 'afergon-ai models show' to inspect or create profiles.`,
        };
      }
      return item;
    case "pi":
    case "claude":
      if (item.state === "warn") {
        return {
          ...item,
          detail: `${item.detail} Run 'afergon-ai init' to install project files.`,
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

function getBaseStatusItems({ cwd, env }) {
  return [
    getModelConfigItem(env),
    getProjectInstallItem({
      id: "pi",
      label: "Pi",
      filePath: path.join(cwd, ".pi", "APPEND_SYSTEM.md"),
      presentDetail: "Installed in this project via APPEND_SYSTEM.md",
      missingDetail: "Not installed in this project.",
    }),
    getProjectInstallItem({
      id: "claude",
      label: "Claude Code",
      filePath: path.join(cwd, "CLAUDE.md"),
      presentDetail: "Installed in this project via CLAUDE.md",
      missingDetail: "Not installed in this project.",
    }),
    getOpenCodeItem(env),
  ];
}

function summarizeItems(items) {
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

export function getConfigurationStatus({ cwd = process.cwd(), env = process.env } = {}) {
  const items = getBaseStatusItems({ cwd, env });

  return {
    title: "Configuration",
    items,
    actions: createActions(["init", "doctor", "update", "models"]),
  };
}

export function getStatusScreenState({ cwd = process.cwd(), env = process.env } = {}) {
  const items = getBaseStatusItems({ cwd, env }).map((item) => addGuidance(item));

  return {
    title: "Status",
    summary: summarizeItems(items),
    items,
    actions: createActions(STATUS_ACTION_IDS),
  };
}
