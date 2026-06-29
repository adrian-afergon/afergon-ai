import { truncateToWidth } from "@earendil-works/pi-tui";

import { sanitizeTerminalOutput } from "../actions/forms.mjs";

function padLine(text, width) {
  return truncateToWidth(text, Math.max(1, width), "");
}

function renderProfiles(profiles) {
  if (profiles.length === 0) {
    return ["- No saved profiles yet."];
  }

  return profiles.map((profile) => `- ${profile.name}${profile.isActive ? " [active]" : ""}`);
}

function renderAssignments(assignments) {
  return assignments.map(
    (assignment) =>
      `- ${assignment.agent}: configured=${assignment.configured}, effective=${assignment.effective ?? "(runtime default)"}, source=${assignment.source}`,
  );
}

function renderSupportedActions(actions) {
  return actions.flatMap((action) => {
    const lines = [`- ${action.label}: ${action.detail}`];
    if (action.command) {
      lines.push(`  CLI equivalent: ${action.command}`);
    }
    return lines;
  });
}

export function renderModelProfilesScreen(state, width) {
  const lines = [
    state.title ?? "Model Profiles",
    "",
    `Summary [${state.summary.state}]: ${state.summary.detail}`,
    `Active profile: ${state.activeProfile}`,
    `Config path: ${state.configPath}`,
    "",
    "Profiles",
    "",
    ...renderProfiles(state.profiles),
    "",
    "Resolved assignments",
    "",
    ...renderAssignments(state.assignments),
    "",
    "Supported actions",
    "",
    ...renderSupportedActions(state.supportedActions),
    "",
    "Stable CLI surfaces",
    "",
    ...state.actions.map((action) => `- ${action.label}: ${action.description}`),
    "",
    "Interactive notes",
    "- Use inline actions for list/show results and picker or text forms for profile changes.",
    "- Successful profile mutations refresh this section before you keep navigating.",
    "",
    "Keyboard help",
    "State labels use [ok], [warn], and [fail] text markers where applicable.",
    "Press h to return Home.",
    "Press q or Esc to exit.",
  ];

  return lines.map((line) => padLine(sanitizeTerminalOutput(line), width));
}
