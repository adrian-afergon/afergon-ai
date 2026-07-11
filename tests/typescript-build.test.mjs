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
    const copiedFormsStateDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "forms-state.d.mts");
    const copiedActionDefinitionsDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "definitions.d.mts");
    const copiedModelProfilesConfigDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-config.d.mts");
    const copiedModelProfilesAvailabilityDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-availability.d.mts");
    const copiedModelProfilesCoreDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-core.d.mts");
    const copiedModelProfilesSaveDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-save.d.mts");
    const copiedModelProfilesSaveRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-save.mjs");
    const copiedModelProfilesHostSeedingDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-host-seeding.d.mts");
    const copiedModelProfilesHostSeedingRuntimePath = path.join(
      repoRoot,
      "dist",
      "scripts",
      "lib",
      "model-profiles-host-seeding.mjs",
    );
    const copiedModelProfilesDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles.d.mts");
    const copiedModelProfilesRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles.mjs");
    const copiedModelProfilesAdapterBridgePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-adapter.d.mts");
    const emittedModelProfilesAdapterDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-adapter.d.ts");
    const actionRunnerOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "runner.js");
    const formsConfirmationOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "forms-confirmation.js");
    const formsOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "forms-output.js");
    const formsStateOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "forms-state.js");
    const actionDefinitionsOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "actions", "definitions.js");
    const modelProfilesConfigOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-config.js");
    const modelProfilesAvailabilityOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-availability.js");
    const modelProfilesCoreOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-core.js");
    const modelProfilesSaveOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-save.js");
    const modelProfilesHostSeedingOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles-host-seeding.js");
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
    expect(existsSync(copiedFormsStateDeclarationPath)).toBe(true);
    expect(readFileSync(copiedFormsStateDeclarationPath, "utf8")).toContain('export * from "./forms-state.ts"');
    expect(existsSync(copiedActionDefinitionsDeclarationPath)).toBe(true);
    expect(readFileSync(copiedActionDefinitionsDeclarationPath, "utf8")).toContain("./definitions.ts");
    expect(existsSync(copiedModelProfilesConfigDeclarationPath)).toBe(true);
    expect(readFileSync(copiedModelProfilesConfigDeclarationPath, "utf8")).toContain('export * from "./model-profiles-config.ts"');
    expect(existsSync(copiedModelProfilesAvailabilityDeclarationPath)).toBe(true);
    expect(readFileSync(copiedModelProfilesAvailabilityDeclarationPath, "utf8")).toContain(
      'export * from "./model-profiles-availability.ts"',
    );
    expect(existsSync(copiedModelProfilesCoreDeclarationPath)).toBe(true);
    expect(readFileSync(copiedModelProfilesCoreDeclarationPath, "utf8")).toContain("export declare const SUPPORTED_AGENTS");
    expect(readFileSync(copiedModelProfilesCoreDeclarationPath, "utf8")).toContain("export declare function normalizeStoredModel");
    expect(readFileSync(copiedModelProfilesCoreDeclarationPath, "utf8")).not.toContain('export * from "./model-profiles-core.ts"');
    expect(readFileSync(copiedModelProfilesCoreDeclarationPath, "utf8")).not.toContain("AGENT_ALIASES");
    expect(readFileSync(copiedModelProfilesCoreDeclarationPath, "utf8")).not.toContain("asPlainObject");
    expect(existsSync(copiedModelProfilesSaveDeclarationPath)).toBe(true);
    expect(readFileSync(copiedModelProfilesSaveDeclarationPath, "utf8")).toContain('export * from "./model-profiles-save.ts"');
    expect(existsSync(copiedModelProfilesSaveRuntimePath)).toBe(true);
    expect(readFileSync(copiedModelProfilesSaveRuntimePath, "utf8")).toContain("export function saveProfileAssignments");
    expect(existsSync(copiedModelProfilesHostSeedingDeclarationPath)).toBe(true);
    expect(readFileSync(copiedModelProfilesHostSeedingDeclarationPath, "utf8")).toContain(
      'export * from "./model-profiles-host-seeding.ts"',
    );
    expect(existsSync(copiedModelProfilesHostSeedingRuntimePath)).toBe(true);
    expect(readFileSync(copiedModelProfilesHostSeedingRuntimePath, "utf8")).toContain("readOpenCodeAgentModels");
    expect(existsSync(copiedModelProfilesDeclarationPath)).toBe(true);
    expect(readFileSync(copiedModelProfilesDeclarationPath, "utf8")).toContain("loadConfig");
    expect(readFileSync(copiedModelProfilesDeclarationPath, "utf8")).toContain("readOpenCodeAgentModels");
    expect(existsSync(copiedModelProfilesRuntimePath)).toBe(true);
    expect(readFileSync(copiedModelProfilesRuntimePath, "utf8")).toContain('./model-profiles-save.mjs');
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
    expect(existsSync(formsStateOutputPath)).toBe(true);
    expect(readFileSync(formsStateOutputPath, "utf8")).toContain("export function createFormState");
    expect(existsSync(actionDefinitionsOutputPath)).toBe(true);
    expect(readFileSync(actionDefinitionsOutputPath, "utf8")).toContain("export function createActionDefinition");
    expect(existsSync(modelProfilesConfigOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesConfigOutputPath, "utf8")).toContain("export function loadConfig");
    expect(existsSync(modelProfilesAvailabilityOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesAvailabilityOutputPath, "utf8")).toContain("export function validateModelAvailability");
    expect(existsSync(modelProfilesCoreOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesCoreOutputPath, "utf8")).toContain("export function normalizeStoredModel");
    expect(existsSync(modelProfilesSaveOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesSaveOutputPath, "utf8")).toContain("export function saveProfileAssignments");
    expect(existsSync(modelProfilesHostSeedingOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesHostSeedingOutputPath, "utf8")).toContain("export function readOpenCodeAgentModels");
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
