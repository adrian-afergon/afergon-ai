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

function renderProfiles(profiles, styleSelected, inlineCreate) {
  if (profiles.length === 0) {
    return ["- No saved profiles yet."];
  }

  return profiles.flatMap((profile) => {
    const marker = profile.isFocused && !(profile.isCreate && inlineCreate) ? ">" : " ";
    const label = profile.isCreate
      ? sanitizeText(profile.name)
      : `[${profile.isActive ? "X" : " "}] ${sanitizeText(profile.name)}`;
    const line = `${marker} ${label}`;
    const renderedLine = profile.isFocused && typeof styleSelected === "function" ? styleSelected(line) : line;

    if (!profile.isCreate || !inlineCreate) {
      return [renderedLine];
    }

    const inputMarker = inlineCreate.selection === "input" ? ">" : " ";
    const cancelMarker = inlineCreate.selection === "cancel" ? ">" : " ";
    const inputValue = sanitizeText(inlineCreate.value) || "(empty)";
    const inputLine = `${inputMarker} Profile name: ${inputValue}`;
    const cancelLine = `${cancelMarker} Cancel`;

    return [
      renderedLine,
      inlineCreate.selection === "input" && typeof styleSelected === "function" ? styleSelected(inputLine) : inputLine,
      inlineCreate.selection === "cancel" && typeof styleSelected === "function" ? styleSelected(cancelLine) : cancelLine,
      ...(inlineCreate.validationMessage ? [sanitizeText(inlineCreate.validationMessage)] : []),
    ];
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
    const marker = assignment.isFocused ? ">" : " ";
    const line = `${marker} ${sanitizeText(assignment.agent)}: configured=${sanitizeText(assignment.configured)}, effective=${sanitizeText(assignment.effective ?? "(runtime default)")}, source=${sanitizeText(assignment.source)}`;
    return assignment.isFocused && typeof styleSelected === "function" ? styleSelected(line) : line;
  });
}

function renderMutedLines(lines, styleMuted) {
  return lines.map((line) => (typeof styleMuted === "function" && line ? styleMuted(line) : line));
}

function renderNewProfilePlaceholderRows(agentNames = []) {
  return agentNames.map((agentName) => `- ${sanitizeText(agentName)}: pending new profile assignment`);
}

export function renderModelProfilesScreen(state, width, { styleSelected, styleMuted } = {}) {
  const isBrowseMode = (state.browse?.mode ?? "browse") === "browse";
  const inlineCreate = isBrowseMode ? state.browse?.inlineCreate : undefined;
  const showNewProfilePlaceholders = isBrowseMode && state.browse?.isCreateSelected && state.assignments.length === 0;
  const detailLines = isBrowseMode
    ? renderMutedLines(
        state.assignments.length > 0
          ? renderAssignments(state.assignments)
          : (showNewProfilePlaceholders ? renderNewProfilePlaceholderRows(state.browse?.placeholderAssignments) : []),
        styleMuted,
      )
    : [];
  const assignmentLines = state.assignments.length > 0 ? renderAssignmentEditor(state.assignments, styleSelected) : [];
  const lines = [
    sanitizeText(state.title ?? "Model Profiles"),
    "",
    ...(state.summary?.state === "fail" ? [`Summary [fail]: ${sanitizeText(state.summary.detail)}`] : []),
    `Config path: ${sanitizeText(state.configPath)}`,
    "",
    "Profile list",
    "",
    ...renderProfiles(state.profiles, styleSelected, inlineCreate),
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
          inlineCreate ? "Type a profile name, Enter to create, or select Cancel." : "Press Enter to switch or start the focused profile flow.",
          "Press Delete or D to confirm deletion, U to edit, and N to create.",
        ]
      : ["Use ↑/↓ to move agents, Enter to stage a model, S to save, Esc to cancel."]),
  ];

  return lines.map((line) => padLine(line, width));
}
