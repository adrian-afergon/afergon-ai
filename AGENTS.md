# Repository operating contract

This file governs repository-wide operation, artifact storage, design, and technology. Follow the Afergon-AI workflow in [README.md](README.md); do not reproduce or replace it here. Applicable agents, skills, and tool adapters remain authoritative for their more-specific execution concerns. If these responsibility boundaries do not resolve a conflict over the same concern, stop and ask the user.

## Start every session

1. Read `.atl/skill-registry.md` before task work; it is the canonical skill index.
2. Resolve every applicable skill and read its exact registered `SKILL.md` path before acting.
3. Report the registered skills selected during resolution, using skill names or exact paths.
4. Refresh or update the registry when a newly added applicable skill is missing. Report missing, unreadable, or inconsistent registry/configuration state; never claim that an unresolved skill was loaded.
5. Search Engram for relevant project context and preserve significant decisions and discoveries there.

## Plan implementation against actual Git state

Before the Implement gate, every implementation plan must inspect and report:

- the current branch and base/divergence;
- the complete worktree topology;
- staged changes;
- unstaged changes; and
- individual untracked paths.

Reinspect all five categories when implementation starts. Choose and justify safe reuse of the current branch/worktree or isolation with a new branch, worktree, or both. Assign explicit preserve, transfer, and stage disposition to staged, unstaged, and untracked paths, naming task-owned paths and paths that must remain untouched.

Never silently include, stage, overwrite, stash, clean, reset, restore, delete, or otherwise absorb unrelated changes. Stop when changed state invalidates the plan's isolation or disposition decision.

## Preserve human decisions and artifacts

The user owns product, scope, architecture, and trade-off decisions. Surface unresolved ambiguity instead of inventing a decision or silently rewriting an approved contract.

Store workflow artifacts under `openspec/`: debates in `debate/`, task breakdowns in `tasks/`, specifications in `specs/`, implementation plans in `plans/`, and implementation results in `results/`. Keep each artifact linked to its source task/specification and do not mix unrelated work into its change set.

## Govern new and deliberately migrated code

Apply these rules only to new code or legacy code deliberately selected for migration; they do not authorize broad remediation.

- Organize by product vertical, with domain, application, and infrastructure boundaries inside that vertical.
- Point dependencies inward: infrastructure may depend on application and domain; application may depend on domain; domain must not depend on application or infrastructure.
- Use interfaces for data structures, ports, and use-case parameters, not indiscriminately.
- Use classes to encapsulate domain behavior when no useful alternate implementation exists; prefer composition over inheritance.
- Validation Value Objects expose a static factory. Their private constructors only assign already validated values and never perform validation.

## Require artifact-appropriate evidence

Record each expected evidence item as `produced`, `not applicable`, or `outstanding`.

- Require relevant tests for testable behavior and completed review for reviewable changes.
- Do not require pointless unit tests for Markdown-only changes; review remains required.
- Treat multi-tool validation as supplementary, never as a replacement for applicable tests or review.
- Preserve POSIX and PowerShell parity for installer changes. If parity is temporarily unavailable, document the incompatibility and create a backlog item for the missing platform before acceptance.
