import { truncateToWidth } from "@earendil-works/pi-tui";

import { sanitizeTerminalOutput } from "../actions/forms.js";
import { renderFocusLine } from "../rendering.js";

interface BrowseStateInlineCreate {
  readonly value?: string;
  readonly selection?: string;
  readonly validationMessage?: string;
}

interface BrowseStateProfileRow {
  readonly name?: string;
  readonly isActive?: boolean;
  readonly isCreate?: boolean;
  readonly isFocused?: boolean;
}

interface BrowseStateAssignment {
  readonly agent?: string;
  readonly configured?: string;
  readonly effective?: string | null;
  readonly source?: string;
  readonly isFocused?: boolean;
}

interface BrowseState {
  readonly mode?: string;
  readonly targetProfileName?: string;
  readonly isCreateSelected?: boolean;
  readonly inlineCreate?: BrowseStateInlineCreate;
  readonly placeholderAssignments?: readonly string[];
}

interface ToolRow {
  readonly label?: string;
  readonly isFocused?: boolean;
}

interface ModelProfilesScreenState {
  readonly title?: string;
  readonly configPath?: string;
  readonly summary?: {
    readonly state?: string;
    readonly detail?: string;
  };
  readonly profiles: readonly BrowseStateProfileRow[];
  readonly assignments: readonly BrowseStateAssignment[];
  readonly tools?: readonly ToolRow[];
  readonly toolLabel?: string;
  readonly projectionDetail?: string;
  readonly browse?: BrowseState;
}

interface ScreenStyleOptions {
  readonly styleSelected?: (line: string) => string;
  readonly styleMuted?: (line: string) => string;
}

function padLine(text: string, width: number): string {
  return truncateToWidth(text, Math.max(1, width), "");
}

function sanitizeText(value: unknown): string {
  return sanitizeTerminalOutput(typeof value === "string" ? value : "");
}

function getAssignmentPlaceholderProfileName(browseState: BrowseState | undefined): string {
  return sanitizeText(browseState?.targetProfileName ?? "") || "a new profile";
}

function renderProfiles(
  profiles: readonly BrowseStateProfileRow[],
  styleSelected: ScreenStyleOptions["styleSelected"],
  inlineCreate: BrowseStateInlineCreate | undefined,
): string[] {
  if (profiles.length === 0) {
    return ["- No saved profiles yet."];
  }

  return profiles.flatMap((profile) => {
    const label = profile.isCreate
      ? sanitizeText(profile.name)
      : `[${profile.isActive ? "X" : " "}] ${sanitizeText(profile.name)}`;
    const line = renderFocusLine(label, profile.isFocused && !(profile.isCreate && inlineCreate));
    const renderedLine = profile.isFocused && typeof styleSelected === "function" ? styleSelected(line) : line;

    if (!profile.isCreate || !inlineCreate) {
      return [renderedLine];
    }

    const inputValue = sanitizeText(inlineCreate.value) || "(empty)";
    const inputLine = renderFocusLine(`Profile name: ${inputValue}`, inlineCreate.selection === "input");
    const cancelLine = renderFocusLine("Cancel", inlineCreate.selection === "cancel");

    return [
      renderedLine,
      inlineCreate.selection === "input" && typeof styleSelected === "function" ? styleSelected(inputLine) : inputLine,
      inlineCreate.selection === "cancel" && typeof styleSelected === "function" ? styleSelected(cancelLine) : cancelLine,
      ...(inlineCreate.validationMessage ? [sanitizeText(inlineCreate.validationMessage)] : []),
    ];
  });
}

function renderTools(tools: readonly ToolRow[], styleSelected: ScreenStyleOptions["styleSelected"]): string[] {
  if (tools.length === 0) {
    return ["- No user-scoped tool configuration was detected."];
  }

  return tools.map((tool) => {
    const line = renderFocusLine(sanitizeText(tool.label), tool.isFocused);
    return tool.isFocused && typeof styleSelected === "function" ? styleSelected(line) : line;
  });
}

function renderAssignments(assignments: readonly BrowseStateAssignment[]): string[] {
  return assignments.map(
    (assignment) =>
      `- ${sanitizeText(assignment.agent)}: configured=${sanitizeText(assignment.configured)}, effective=${sanitizeText(assignment.effective ?? "(runtime default)")}, source=${sanitizeText(assignment.source)}`,
  );
}

function renderAssignmentEditor(
  assignments: readonly BrowseStateAssignment[],
  styleSelected: ScreenStyleOptions["styleSelected"],
): string[] {
  return assignments.map((assignment) => {
    const line = renderFocusLine(
      `${sanitizeText(assignment.agent)}: configured=${sanitizeText(assignment.configured)}, effective=${sanitizeText(assignment.effective ?? "(runtime default)")}, source=${sanitizeText(assignment.source)}`,
      assignment.isFocused,
    );
    return assignment.isFocused && typeof styleSelected === "function" ? styleSelected(line) : line;
  });
}

function renderMutedLines(lines: readonly string[], styleMuted: ScreenStyleOptions["styleMuted"]): string[] {
  return lines.map((line) => (typeof styleMuted === "function" && line ? styleMuted(line) : line));
}

function renderNewProfilePlaceholderRows(agentNames: readonly string[] = []): string[] {
  return agentNames.map((agentName) => `- ${sanitizeText(agentName)}: pending new profile assignment`);
}

export function renderModelProfilesScreen(
  state: ModelProfilesScreenState,
  width: number,
  { styleSelected, styleMuted }: ScreenStyleOptions = {},
): string[] {
  if (!state.browse && state.tools) {
    return [
      sanitizeText(state.title ?? "Model Profiles"),
      "",
      ...(state.summary?.state === "fail" ? [`Summary [fail]: ${sanitizeText(state.summary.detail)}`] : [sanitizeText(state.summary?.detail)]),
      "",
      "Detected tools",
      "",
      ...renderTools(state.tools ?? [], styleSelected),
      "",
      "Keyboard help",
      "Use ↑/↓ to move the tool selection.",
      "Press Enter to manage profiles for the focused tool.",
    ].map((line) => padLine(line, width));
  }

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
    `Tool: ${sanitizeText(state.toolLabel ?? "OpenCode")}`,
    sanitizeText(state.projectionDetail),
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
          "Press Delete or D to confirm deletion, U to edit, Esc to return to tools, and N to create.",
        ]
      : ["Use ↑/↓ to move agents, Enter to stage a model, S to save, Esc to cancel."]),
  ];

  return lines.map((line) => padLine(line, width));
}
