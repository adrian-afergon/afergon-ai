# Spec: Remove Pi host package distribution

- **Source Task**: 003-remove-pi-host-integration.md
- **State**: ready

## Scope

Remove Pi-specific package identity, manifest, extension, prompt, repository state, and coding-agent dependency from the published package. Retain the standalone TUI, its direct `@earendil-works/pi-tui` runtime dependency, OpenCode adapters, and skills as package content. Do not change the package version, add engine constraints, or rewrite historical OpenSpec records or model identifiers.

## Requirements

- Remove the package `pi` manifest, Pi keywords/description identity, `@earendil-works/pi-coding-agent` declarations and resolved lockfile entry, Pi extension source, Pi prompt asset, and repository `.pi` host state.
- Keep `@earendil-works/pi-tui` as a direct runtime dependency used by the standalone TUI; it must not be removed or replaced.
- Configure package contents and the build copy boundary so the packed archive includes `dist` with the TUI runtime, OpenCode adapters, and skills, but excludes Pi-only `extensions/`, `prompts/`, and repository Pi host state.
- Preserve OpenCode adapter content, skills, model identifiers, and historical OpenSpec artifacts even where their text contains `pi` or `claude`.
- Provide automated archive/content checks and retain successful typecheck, build, runtime-health, focused-test, and full-suite validation evidence.

## Acceptance Criteria

```gherkin
Feature: OpenCode-oriented package distribution without Pi host integration

  Scenario: Happy path - package metadata retains only the standalone TUI Pi dependency
    Given afergon-ai package metadata is prepared for publication
    When its runtime dependencies are inspected
    Then `@earendil-works/pi-tui` is a direct runtime dependency
    And no Pi manifest, Pi host package identity, or `@earendil-works/pi-coding-agent` dependency is declared

  Scenario: Edge case - packed archive excludes Pi-only content while retaining runtime workflow content
    Given the package build has completed
    When a package archive is generated
    Then the archive contains the standalone TUI runtime, OpenCode adapters, and skills content
    And the archive contains no `extensions/`, `prompts/`, or repository Pi host state

  Scenario: Edge case - retained non-host Pi naming remains intact
    Given model identifiers and historical OpenSpec records contain the text "pi" or "claude"
    When Pi host package integration is removed
    Then those model identifiers and historical records remain unchanged

  Scenario: Failure case - archive validation detects a Pi-only package artifact
    Given a generated package archive contains a Pi extension, Pi prompt, or repository Pi host state
    When package-content validation runs
    Then validation fails and identifies the prohibited artifact
```

## Technical Dependencies

- Phase 1 branch `chore/opencode-only-01-remove-claude-host` at commit `968aab6`
