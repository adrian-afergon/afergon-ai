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
    const copiedFormsConfirmationDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "forms-confirmation.d.mts");
    const copiedFormsOutputDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "forms-output.d.mts");
    const copiedActionDefinitionsDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "definitions.d.mts");
    const copiedModelProfilesDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles.d.mts");
    const copiedModelProfilesAdapterBridgePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-adapter.d.mts");
    const emittedModelProfilesAdapterDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-adapter.d.ts");
    const actionRunnerOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "runner.js");
    const formsConfirmationOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "forms-confirmation.js");
    const formsOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "forms-output.js");
    const actionDefinitionsOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "definitions.js");
    const configStatusAdapterOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "config-status-adapter.js");
    const modelProfilesAdapterOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-adapter.js");
    const configurationScreenOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "screens", "configuration.js");
    const modelProfilesScreenOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "screens", "model-profiles.js");
    const statusScreenOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "screens", "status.js");

    expect(readFileSync(startupBannerDeclarationPath, "utf8")).toContain("../scripts/lib/branding/logo.mjs");
    expect(existsSync(copiedBrandingDeclarationPath)).toBe(true);
    expect(readFileSync(copiedBrandingDeclarationPath, "utf8")).toContain("export const BRANDING_LOGO");
    expect(existsSync(copiedFormsDeclarationPath)).toBe(true);
    expect(readFileSync(copiedFormsDeclarationPath, "utf8")).toContain("sanitizeTerminalOutput");
    expect(existsSync(copiedFormsConfirmationDeclarationPath)).toBe(true);
    expect(readFileSync(copiedFormsConfirmationDeclarationPath, "utf8")).toContain('export * from "./forms-confirmation.ts"');
    expect(existsSync(copiedFormsOutputDeclarationPath)).toBe(true);
    expect(readFileSync(copiedFormsOutputDeclarationPath, "utf8")).toContain('export * from "./forms-output.ts"');
    expect(existsSync(copiedActionDefinitionsDeclarationPath)).toBe(true);
    expect(readFileSync(copiedActionDefinitionsDeclarationPath, "utf8")).toContain("./definitions.ts");
    expect(existsSync(copiedModelProfilesDeclarationPath)).toBe(true);
    expect(readFileSync(copiedModelProfilesDeclarationPath, "utf8")).toContain("loadConfig");
    expect(existsSync(copiedModelProfilesAdapterBridgePath)).toBe(true);
    expect(readFileSync(copiedModelProfilesAdapterBridgePath, "utf8")).toContain('export * from "./model-profiles-adapter.ts"');
    expect(existsSync(emittedModelProfilesAdapterDeclarationPath)).toBe(true);
    expect(readFileSync(emittedModelProfilesAdapterDeclarationPath, "utf8")).toContain('from "../model-profiles.mjs"');
    expect(existsSync(actionRunnerOutputPath)).toBe(true);
    expect(readFileSync(actionRunnerOutputPath, "utf8")).toContain("export function runActionCommand");
    expect(existsSync(formsConfirmationOutputPath)).toBe(true);
    expect(readFileSync(formsConfirmationOutputPath, "utf8")).toContain("export function validateConfirmationState");
    expect(existsSync(formsOutputPath)).toBe(true);
    expect(readFileSync(formsOutputPath, "utf8")).toContain("export function sanitizeTerminalOutput");
    expect(existsSync(actionDefinitionsOutputPath)).toBe(true);
    expect(readFileSync(actionDefinitionsOutputPath, "utf8")).toContain("export function createActionDefinition");
    expect(existsSync(configStatusAdapterOutputPath)).toBe(true);
    expect(readFileSync(configStatusAdapterOutputPath, "utf8")).toContain("export function getConfigurationStatus");
    expect(existsSync(modelProfilesAdapterOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesAdapterOutputPath, "utf8")).toContain("export function getModelProfilesScreenState");
    expect(existsSync(configurationScreenOutputPath)).toBe(true);
    expect(readFileSync(configurationScreenOutputPath, "utf8")).toContain("export function renderConfigurationScreen");
    expect(existsSync(modelProfilesScreenOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesScreenOutputPath, "utf8")).toContain("export function renderModelProfilesScreen");
    expect(existsSync(statusScreenOutputPath)).toBe(true);
    expect(readFileSync(statusScreenOutputPath, "utf8")).toContain("export function renderStatusScreen");
  });
});
