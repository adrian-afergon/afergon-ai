import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const README = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");
const PROMPT = fs.readFileSync(path.join(REPO_ROOT, "prompts", "afergon-ai.md"), "utf8");

describe("TUI docs contract", () => {
  it("documents launch routing, CLI-equivalent visibility, rollback, and verification in the README", () => {
    expect(README).toContain("Interactive TTY + no args: open the TUI.");
    expect(README).toContain("Non-TTY/CI + no args: print help and exit 0.");
    expect(README).toContain("Non-TTY/CI + `tui`: fail fast with guidance instead of hanging.");
    expect(README).toContain("Use ↑/↓ to move the Home selection, Enter to open it, and `c`/`s`/`m`/`h` as direct shortcuts.");
    expect(README).toContain("If the full AFERGON-AI banner is unsafe to render, the TUI falls back to plain-text branding instead of broken artwork.");
    expect(README).toContain("Status, failure, and selection cues use text markers such as `[ok]`, `[warn]`, `[fail]`, and `[selected]`, not color alone.");
    expect(README).toContain("Do not invent CLI equivalents for unsupported or read-only TUI actions.");
    expect(README).toContain("PR7 docs/polish");
    expect(README).toContain("`tests/tui-docs.test.mjs`");
    expect(README).toContain("Final verification checklist");
    expect(README).toContain("pnpm test");
    expect(README).toContain("./bin/afergon-ai  # expected: prints help and exits 0 in non-TTY mode");
    expect(README).toContain("./bin/afergon-ai tui  # expected: exits 1 in non-TTY mode after printing guidance");
    expect(README).toContain("./bin/afergon-ai doctor --opencode");
    expect(README).toContain("./bin/afergon-ai models show \"budget profile\"");
  });

  it("documents the dispatcher contract in the Pi prompt", () => {
    expect(PROMPT).toContain("## Command Surface And TUI Launch Contract");
    expect(PROMPT).toContain("Interactive TTY + no args → open the TUI.");
    expect(PROMPT).toContain("Non-TTY/CI + `tui` → fail fast with guidance and a non-zero exit.");
    expect(PROMPT).toContain("Windows launchers must match POSIX behavior and preserve the full argv surface");
    expect(PROMPT).toContain("Home accessibility cues must stay text-first: arrow selection plus Enter, direct `c`/`s`/`m`/`h` shortcuts, explicit exit hints, and plain-text branding fallback when the banner is unsafe.");
    expect(PROMPT).toContain("Show CLI equivalents only where a stable explicit command already exists");
    expect(PROMPT).toContain("`tests/tui-docs.test.mjs`");
  });
});
