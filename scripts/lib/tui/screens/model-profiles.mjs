import { truncateToWidth } from "@earendil-works/pi-tui";

import { sanitizeTerminalOutput } from "../actions/forms.mjs";

function padLine(text, width) {
  return truncateToWidth(text, Math.max(1, width), "");
}

function sanitizeText(value) {
  return sanitizeTerminalOutput(typeof value === "string" ? value : "");
}

function getAssignmentPlaceholderProfileName(browseState) {
  return sanitizeText(browseState?.targetProfileName ?? "") || "a new profile";
}

function renderProfiles(profiles, styleSelected) {
  if (profiles.length === 0) {
    return ["- No saved profiles yet."];
  }

  return profiles.map((profile) => {
    const line = `- ${sanitizeText(profile.name)}${profile.isActive ? " [active]" : ""}${profile.isFocused ? " [selected]" : ""}`;
    return profile.isFocused && typeof styleSelected === "function" ? styleSelected(line) : line;
  });
}

function renderAssignments(assignments) {
  return assignments.map(
    (assignment) =>
      `- ${sanitizeText(assignment.agent)}: configured=${sanitizeText(assignment.configured)}, effective=${sanitizeText(assignment.effective ?? "(runtime default)")}, source=${sanitizeText(assignment.source)}`,
  );
}

function renderAssignmentEditor(assignments, styleSelected) {
  return assignments.map((assignment) => {
    const line = `${sanitizeText(assignment.agent)}${assignment.isFocused ? " [selected]" : ""}: configured=${sanitizeText(assignment.configured)}, effective=${sanitizeText(assignment.effective ?? "(runtime default)")}, source=${sanitizeText(assignment.source)}`;
    return assignment.isFocused && typeof styleSelected === "function" ? styleSelected(line) : line;
  });
}

function renderSupportedActions(actions) {
  return actions.flatMap((action) => {
    const lines = [`- ${sanitizeText(action.label)}: ${sanitizeText(action.detail)}`];
    if (action.command) {
      lines.push(`  CLI equivalent: ${sanitizeText(action.command)}`);
    }
    return lines;
  });
}

export function renderModelProfilesScreen(state, width, { styleSelected } = {}) {
  const isBrowseMode = (state.browse?.mode ?? "browse") === "browse";
  const detailLines = isBrowseMode && state.assignments.length > 0 ? renderAssignments(state.assignments) : [];
  const assignmentLines = state.assignments.length > 0 ? renderAssignmentEditor(state.assignments, styleSelected) : [];
  const lines = [
    sanitizeText(state.title ?? "Model Profiles"),
    "",
    `Summary [${sanitizeText(state.summary.state)}]: ${sanitizeText(state.summary.detail)}`,
    `Active profile: ${sanitizeText(state.activeProfile)}`,
    `Config path: ${sanitizeText(state.configPath)}`,
    "",
    "Profile list",
    "",
    ...renderProfiles(state.profiles, styleSelected),
    "",
    "Profile details",
    "",
    ...detailLines,
    "",
    "Supported actions",
    "",
    ...renderSupportedActions(state.supportedActions),
    "",
    "Stable CLI surfaces",
    "",
    ...state.actions.map((action) => `- ${sanitizeText(action.label)}: ${sanitizeText(action.description)}`),
    "",
     ...(isBrowseMode
       ? [
           "Interactive notes",
           "- Browse mode scopes arrow keys to the profile list only.",
           "- Space switches the focused profile or starts the new-profile flow.",
         ]
        : [
            "Assignment editor",
            `Target profile: ${getAssignmentPlaceholderProfileName(state.browse)}`,
            ...assignmentLines,
          ]),
     "",
     "Keyboard help",
     ...(isBrowseMode
       ? [
           "Use ↑/↓ to move the profile selection.",
           "Press Space to switch or start the focused profile flow.",
           "Press Delete to confirm deletion, U to edit, and N to create.",
         ]
      : ["Use ↑/↓ to move agents, Enter to stage a model, S to save, Esc to cancel."]),
    "Press h to return Home.",
    "Press q or Esc to exit.",
  ];

  return lines.map((line) => padLine(line, width));
}
