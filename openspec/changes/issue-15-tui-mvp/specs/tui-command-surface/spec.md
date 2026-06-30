# TUI Command Surface Specification

## Purpose

Define the MVP TUI surface, accessibility extension, scriptable CLI preservation, and safe non-interactive execution.

## Requirements

### Requirement: Launch routing, safety, and parity

The system MUST open the TUI for interactive TTY no-args `afergon-ai` and `afergon-ai tui`. It MUST NOT open the TUI in non-TTY/CI. Non-TTY/CI no-args MUST print help and exit 0; non-TTY/CI explicit `tui` MUST fail fast with guidance and non-zero exit. POSIX and Windows launchers MUST match. Explicit commands including `init`, `doctor`, `update`, and `models` MUST remain scriptable.

#### Scenario: Interactive no-argument launch opens TUI
- GIVEN `afergon-ai` runs in an interactive TTY
- WHEN the user runs `afergon-ai` with no arguments
- THEN the TUI opens instead of printing default help

#### Scenario: Explicit scriptable command bypasses TUI
- GIVEN automation invokes `afergon-ai doctor`
- WHEN the command runs
- THEN it executes the explicit CLI behavior without entering the TUI

### Requirement: Home navigation and visible selection

The Home route MUST support `Up`/`Down`/`Enter` navigation for the MVP sections. It MUST retain `c`, `s`, `m`, and `h` shortcuts as backward-compatible navigation. The currently selected Home item MUST remain visibly identifiable with text markers or wording that do not rely on color alone.

#### Scenario: Arrow keys move the Home selection
- GIVEN the TUI is open on Home
- WHEN the user presses `Up` or `Down`
- THEN the selected section changes within the Home menu
- AND the selected item is visibly marked in text

#### Scenario: Enter activates the selected Home item
- GIVEN the TUI is open on Home with a section selected
- WHEN the user presses `Enter`
- THEN the TUI opens that selected section

#### Scenario: Letter shortcuts remain valid
- GIVEN the TUI is open
- WHEN the user presses `c`, `s`, `m`, or `h`
- THEN the same route changes available in the MVP continue to work

### Requirement: MVP sections and accessibility cues

The TUI MUST provide functional Configuration, Status, and Model Profiles sections. Each section MUST expose current state and supported actions without remote services. Home and section screens MUST show help and exit hints in text, and status or focus cues MUST NOT depend on color alone.

#### Scenario: MVP sections are usable with explicit hints
- GIVEN the TUI is open
- WHEN the user enters Configuration, Status, or Model Profiles
- THEN relevant current state and supported actions are visible
- AND help text identifies how to return Home and how to exit

### Requirement: Branding reuse and fallback copy

The Home screen MUST render the project-defined AFERGON-AI logo or banner from a canonical shared branding source rather than duplicating the artwork inline. If terminal width, charset, or rendering safety does not support the banner, the TUI MUST fall back to plain-text branding and navigation copy. The branding source SHOULD remain ready for future charset variants, but the system MUST NOT invent variants that do not yet exist.

#### Scenario: TUI reuses the canonical project logo
- GIVEN the terminal can render the project banner safely
- WHEN Home is shown
- THEN the AFERGON-AI logo or banner is rendered from the shared branding source

#### Scenario: TUI falls back when the banner is unsafe
- GIVEN the terminal cannot safely show the full banner
- WHEN Home is shown
- THEN readable plain-text branding is shown instead of broken or fabricated artwork

### Requirement: CLI-equivalent action visibility

The TUI SHOULD show an equivalent CLI command where a stable command exists. It MUST NOT invent equivalents.

#### Scenario: Stable equivalent is shown
- GIVEN a TUI action maps to an existing explicit CLI command
- WHEN the action is displayed
- THEN the equivalent command is visible near the action

#### Scenario: No stable equivalent exists
- GIVEN a TUI action has no explicit CLI equivalent
- WHEN the action is displayed
- THEN no fabricated command is shown

### Requirement: Review workload gating

The task plan MUST forecast changed lines for each chained PR slice. Any slice near or above the 400-line review budget MUST be gated before apply by splitting or recording `size:exception`.

#### Scenario: Slice forecast approaches the review budget
- GIVEN a forecasted slice approaches or exceeds 400 changed lines
- WHEN apply would begin
- THEN implementation is blocked until the slice is reduced or `size:exception` is accepted

### Requirement: MVP boundaries

The MVP MUST NOT implement remote telemetry, complex dashboards, or full plugin, memory, metrics, or skills management. Future sections MAY appear only as non-functional placeholders.

#### Scenario: Out-of-scope feature is requested
- GIVEN the TUI MVP is open
- WHEN the user looks for telemetry, dashboards, plugins, memory, metrics, or skills management
- THEN the MVP does not present those as functional completed features
