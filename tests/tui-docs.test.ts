import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const README = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");
const DETECT_SKILLS = fs.readFileSync(path.join(REPO_ROOT, "skills", "detect-skills", "SKILL.md"), "utf8");
const APPLY_PROGRESS = fs.readFileSync(
  path.join(REPO_ROOT, "openspec", "changes", "issue-15-tui-mvp", "apply-progress.md"),
  "utf8",
);
const TUI_SPEC = fs.readFileSync(
  path.join(REPO_ROOT, "openspec", "changes", "issue-15-tui-mvp", "specs", "tui-command-surface", "spec.md"),
  "utf8",
);
const VERIFY_REPORT = fs.readFileSync(
  path.join(REPO_ROOT, "openspec", "changes", "issue-15-tui-mvp", "verify-report.md"),
  "utf8",
);

describe("TUI docs contract", () => {
  it("documents launch routing, CLI-equivalent visibility, rollback, and verification in the README", () => {
    expect(README).toContain("Interactive TTY + no args: open the TUI.");
    expect(README).toContain("Non-TTY/CI + no args: print help and exit 0.");
    expect(README).toContain("Non-TTY/CI + `tui`: fail fast with guidance instead of hanging.");
    expect(README).toContain("Use ↑/↓ to move the Home selection, Enter to open it, and `c`/`s`/`m`/`h` as direct shortcuts.");
    expect(README).toContain("Focused rows use a fixed-width `>` cursor plus teal emphasis when the terminal supports color; unfocused rows reserve the same cursor column so labels stay aligned.");
    expect(README).toContain("Action lists keep labels quiet: command metadata stays out of the picker rows and only appears in confirmations or output panels.");
    expect(README).toContain("In Model Profiles browse mode, ↑/↓ move only the profile list, Enter switches the focused existing profile inline with no success output panel, Delete or `D` opens a floating submit/cancel delete alert over the Models frame, `U` edits the focused profile, and `N` or `* New Profile` starts inline create-name entry in the profile list with Enter to create or Cancel to abort.");
    expect(README).toContain("Clean successful Enter-driven profile switches stay in the profile list without opening an output panel, while failures and degraded refresh guidance still surface bounded output.");
    expect(README).toContain("In Model Profiles assignment mode, ↑/↓ move agents, Enter opens manual `provider/model` entry for the focused agent, `S` saves staged edits to the target profile, and `Esc` cancels without saving.");
    expect(README).toContain("A filterable provider-model registry/list is tracked separately in GitHub issue #29; this slice keeps manual entry as the current assignment path.");
    expect(README).toContain("Model-profile mutations refresh the active profile, saved profile list, and resolved assignments immediately after the action succeeds.");
    expect(README).toContain("If the full AFERGON-AI banner is unsafe to render, the TUI falls back to plain-text branding instead of broken artwork.");
    expect(README).toContain("Status and failure cues use text markers such as `[ok]`, `[warn]`, and `[fail]`, not color alone.");
    expect(README).toContain("Do not invent CLI equivalents for unsupported or read-only TUI actions.");
    expect(README).toContain("PR7 docs/polish");
    expect(README).toContain("`tests/tui-docs.test.ts`");
    expect(README).toContain("Final verification checklist");
    expect(README).toContain("pnpm test");
    expect(README).toContain("./bin/afergon-ai  # expected: prints help and exits 0 in non-TTY mode");
    expect(README).toContain("./bin/afergon-ai tui  # expected: exits 1 in non-TTY mode after printing guidance");
    expect(README).toContain("./bin/afergon-ai doctor --opencode");
    expect(README).toContain("./bin/afergon-ai models show \"budget profile\"");
    expect(TUI_SPEC).toContain("Destructive or higher-risk mutations MUST require an in-TUI confirmation before execution.");
    expect(TUI_SPEC).toContain("Direct focused profile switch executes immediately");
    expect(TUI_SPEC).toContain("the TUI switches to that profile immediately without a pre-execution confirmation step");
    expect(TUI_SPEC).toContain("Assignment editor save is an explicit direct action");
    expect(TUI_SPEC).toContain("the TUI saves those staged edits immediately without an extra confirmation step");
    expect(TUI_SPEC).toContain("The current Model Profiles UX does not present a legacy action-list `models set` confirmation or picker.");
    expect(TUI_SPEC).not.toContain("GIVEN the user activates `init`, `update`, `models set`, `models profile create`, or `models profile delete`");
    expect(TUI_SPEC).toContain("assignment-editor model entry");
    expect(VERIFY_REPORT).toContain("Result: 10 test files passed, 173 tests passed");
    expect(VERIFY_REPORT).toContain("Current `pnpm test` passed 173/173");
    expect(VERIFY_REPORT).toContain("| **Total runtime suite** | **173** | **10** | Vitest |");
    expect(APPLY_PROGRESS).toContain("Historical tests added across all TDD slices");
    expect(APPLY_PROGRESS).toContain("Historical passing checkpoints recorded across all slices");
  });
});

describe("active documentation contract", () => {
  it("does not advertise Pi as a supported host in the README", () => {
    expect(README).not.toContain("init --pi");
    expect(README).not.toContain("init --all");
    expect(README).not.toContain("pi install");
    expect(README).not.toContain("Pi setup");
    expect(README).not.toContain("Pi-native");
    expect(README).not.toMatch(/works with .*Pi/i);
  });

  it("directs users to OpenCode init in the README", () => {
    expect(README).toContain("afergon-ai init");
    expect(README).toContain("afergon-ai init --opencode");
    expect(README).toContain("`init` configures OpenCode by default");
  });

  it("does not claim Pi discovery or configuration in detect-skills guidance", () => {
    expect(DETECT_SKILLS).not.toContain("Pi discovers");
    expect(DETECT_SKILLS).not.toContain("compatible with Pi");
    expect(DETECT_SKILLS).not.toContain("available to Pi");
    expect(DETECT_SKILLS).toContain("OpenCode discovers");
  });

  it("preserves permitted Pi references outside active host guidance", () => {
    const exploration = fs.readFileSync(
      path.join(REPO_ROOT, "openspec", "changes", "issue-15-tui-mvp", "exploration.md"),
      "utf8",
    );
    expect(exploration).toContain("@earendil-works/pi-tui");
    expect(exploration).toContain("extensions/startup-banner.ts");

    const packageJson = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"));
    expect(packageJson.peerDependencies).toHaveProperty("@earendil-works/pi-tui");
  });
});
