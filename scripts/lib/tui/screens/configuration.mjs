import { truncateToWidth } from "@earendil-works/pi-tui";

import { sanitizeTerminalOutput } from "../actions/forms.mjs";

function padLine(text, width) {
  return truncateToWidth(text, Math.max(1, width), "");
}

export function renderConfigurationScreen(status, width) {
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
