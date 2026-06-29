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

export function getConfigurationStatus({ cwd = process.cwd(), env = process.env } = {}) {
  return {
    title: "Configuration",
    items: getBaseStatusItems({ cwd, env }),
    actions: ["init", "doctor", "update", "models"].map((id) => createAction(id)),
  };
}
