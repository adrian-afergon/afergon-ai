import { truncateToWidth } from "@earendil-works/pi-tui";

import { sanitizeTerminalOutput } from "../actions/forms.js";

interface StatusSummary {
  readonly label: string;
  readonly state: string;
  readonly detail: string;
}

interface StatusItem {
  readonly label: string;
  readonly state: string;
  readonly detail: string;
}

interface StatusAction {
  readonly label: string;
  readonly description: string;
}

interface StatusScreenState {
  readonly title?: string;
  readonly summary: StatusSummary;
  readonly items: readonly StatusItem[];
  readonly actions: readonly StatusAction[];
}

function padLine(text: string, width: number): string {
  return truncateToWidth(text, Math.max(1, width), "");
}

export function renderStatusScreen(status: StatusScreenState, width: number): string[] {
  const lines = [status.title ?? "Status", "", `${status.summary.label} [${status.summary.state}]: ${status.summary.detail}`, "", "Current health", ""];

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
