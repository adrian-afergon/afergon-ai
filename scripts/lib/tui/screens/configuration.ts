import { truncateToWidth } from "@earendil-works/pi-tui";

import { sanitizeTerminalOutput } from "../actions/forms.js";

interface ConfigurationItem {
  readonly label: string;
  readonly state: string;
  readonly detail: string;
}

interface ConfigurationAction {
  readonly label: string;
  readonly description: string;
}

interface ConfigurationScreenState {
  readonly title?: string;
  readonly items: readonly ConfigurationItem[];
  readonly actions: readonly ConfigurationAction[];
}

function padLine(text: string, width: number): string {
  return truncateToWidth(text, Math.max(1, width), "");
}

export function renderConfigurationScreen(status: ConfigurationScreenState, width: number): string[] {
  const lines = [status.title ?? "Configuration", "", "Current state", ""];

  for (const item of status.items) {
    lines.push(`${item.label} [${item.state}]: ${item.detail}`);
  }

  lines.push("", "Supported actions", "");

  for (const action of status.actions) {
    lines.push(`- ${action.label}: ${action.description}`);
  }

  lines.push(
    "",
    "Keyboard help",
    "State labels use [ok], [warn], and [fail] text markers.",
  );

  return lines.map((line) => padLine(sanitizeTerminalOutput(line), width));
}
