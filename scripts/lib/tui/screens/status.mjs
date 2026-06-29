import { truncateToWidth } from "@earendil-works/pi-tui";

function padLine(text, width) {
  return truncateToWidth(text, Math.max(1, width), "");
}

export function renderStatusScreen(status, width) {
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
    "Press h to return Home.",
    "Press q or Esc to exit.",
  );

  return lines.map((line) => padLine(line, width));
}
