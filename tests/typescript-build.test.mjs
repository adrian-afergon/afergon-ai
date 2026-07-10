import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");

describe("TypeScript build output", () => {
  it("copies declaration bridges for runtime .mjs dependencies into dist", () => {
    const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const result = spawnSync(pnpmCommand, ["run", "build"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 120000,
    });

    expect(result.status).toBe(0);

    const startupBannerDeclarationPath = path.join(repoRoot, "dist", "extensions", "startup-banner.d.ts");
    const copiedBrandingDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "branding", "logo.d.mts");
    const copiedFormsDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "forms.d.mts");
    const actionRunnerOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "runner.js");
    const actionDefinitionsOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "definitions.js");
    const configurationScreenOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "screens", "configuration.js");
    const statusScreenOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "screens", "status.js");

    expect(readFileSync(startupBannerDeclarationPath, "utf8")).toContain("../scripts/lib/branding/logo.mjs");
    expect(existsSync(copiedBrandingDeclarationPath)).toBe(true);
    expect(readFileSync(copiedBrandingDeclarationPath, "utf8")).toContain("export const BRANDING_LOGO");
    expect(existsSync(copiedFormsDeclarationPath)).toBe(true);
    expect(readFileSync(copiedFormsDeclarationPath, "utf8")).toContain("sanitizeTerminalOutput");
    expect(existsSync(actionRunnerOutputPath)).toBe(true);
    expect(readFileSync(actionRunnerOutputPath, "utf8")).toContain("export function runActionCommand");
    expect(existsSync(actionDefinitionsOutputPath)).toBe(true);
    expect(readFileSync(actionDefinitionsOutputPath, "utf8")).toContain("export function createActionDefinition");
    expect(existsSync(configurationScreenOutputPath)).toBe(true);
    expect(readFileSync(configurationScreenOutputPath, "utf8")).toContain("export function renderConfigurationScreen");
    expect(existsSync(statusScreenOutputPath)).toBe(true);
    expect(readFileSync(statusScreenOutputPath, "utf8")).toContain("export function renderStatusScreen");
  });
});
