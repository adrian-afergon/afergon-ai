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
    const marker = profile.isFocused ? ">" : " ";
    const label = profile.isCreate
      ? sanitizeText(profile.name)
      : `[${profile.isActive ? "X" : " "}] ${sanitizeText(profile.name)}`;
    const line = `${marker} ${label}`;
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

function renderMutedLines(lines, styleMuted) {
  return lines.map((line) => (typeof styleMuted === "function" && line ? styleMuted(line) : line));
}

export function renderModelProfilesScreen(state, width, { styleSelected, styleMuted } = {}) {
  const isBrowseMode = (state.browse?.mode ?? "browse") === "browse";
  const detailLines = isBrowseMode && state.assignments.length > 0 ? renderMutedLines(renderAssignments(state.assignments), styleMuted) : [];
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
    ...(isBrowseMode ? renderMutedLines(["Profile Details"], styleMuted) : ["Assignment editor"]),
    "",
    ...(isBrowseMode ? detailLines : [
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
  ];

  return lines.map((line) => padLine(line, width));
}
