import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");

describe("TypeScript build output", () => {
  it("copies declaration bridges for runtime .mjs dependencies into dist", async () => {
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
    const copiedModelsCliCoreRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "models-cli-core.mjs");
    const copiedCliDispatchCoreRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "cli-dispatch-core.mjs");
    const copiedCliDispatchCoreDeclarationPath = path.join(repoRoot, "dist", "scripts", "lib", "cli-dispatch-core.d.mts");
    const copiedCliDispatchWrapperPath = path.join(repoRoot, "dist", "scripts", "cli-dispatch.mjs");
    const copiedModelProfilesAdapterBridgePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-adapter.d.mts");
    const copiedModelProfilesControllerBridgePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-controller.d.mts");
    const copiedModelProfilesControllerRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-controller.mjs");
    const copiedModalControllerBridgePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "modal-controller.d.mts");
    const copiedModalControllerRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "modal-controller.mjs");
    const copiedActionExecutionPolicyBridgePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "action-execution-policy.d.mts");
    const copiedActionExecutionPolicyRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "action-execution-policy.mjs");
    const copiedHomeMenuControllerBridgePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "home-menu-controller.d.mts");
    const copiedHomeMenuControllerRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "home-menu-controller.mjs");
    const copiedGlobalHomeFallbackControllerBridgePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "global-home-fallback-controller.d.mts");
    const copiedGlobalHomeFallbackControllerRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "global-home-fallback-controller.mjs");
    const copiedSectionActionControllerBridgePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "section-action-controller.d.mts");
    const copiedSectionActionControllerRuntimePath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "section-action-controller.mjs");
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
    const modelProfilesOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "model-profiles.js");
    const modelsCliCoreOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "models-cli-core.js");
    const cliDispatchCoreOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "cli-dispatch-core.js");
    const configStatusAdapterOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "config-status-adapter.js");
    const modelProfilesAdapterOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-adapter.js");
    const modelProfilesControllerOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "model-profiles-controller.js");
    const modalControllerOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "modal-controller.js");
    const actionExecutionPolicyOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "action-execution-policy.js");
    const homeMenuControllerOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "home-menu-controller.js");
    const globalHomeFallbackControllerOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "global-home-fallback-controller.js");
    const sectionActionControllerOutputPath = path.join(repoRoot, "dist", "scripts", "lib", "tui", "section-action-controller.js");
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
    expect(readFileSync(copiedModelProfilesRuntimePath, "utf8")).toContain('./model-profiles-core.mjs');
    expect(readFileSync(copiedModelProfilesRuntimePath, "utf8")).toContain('./model-profiles-save.mjs');
    expect(existsSync(copiedModelsCliCoreRuntimePath)).toBe(true);
    expect(readFileSync(copiedModelsCliCoreRuntimePath, "utf8")).toContain("export function parseSetCommandArguments");
    const copiedModelsCliCore = await import(`${pathToFileURL(copiedModelsCliCoreRuntimePath).href}?build-artifact`);
    expect(copiedModelsCliCore.parseSetCommandArguments(["--allow-unknown", "review", "openai/gpt-5.5"])).toEqual({
      allowUnknown: true,
      agent: "review",
      model: "openai/gpt-5.5",
    });
    expect(copiedModelsCliCore.getOpenCodeRefreshTimeoutMs({ AFERGON_AI_OPENCODE_REFRESH_TIMEOUT_MS: "0" })).toBe(10000);
    expect(existsSync(copiedCliDispatchCoreDeclarationPath)).toBe(true);
    expect(readFileSync(copiedCliDispatchCoreDeclarationPath, "utf8")).toContain('export * from "./cli-dispatch-core.ts"');
    expect(existsSync(copiedCliDispatchCoreRuntimePath)).toBe(true);
    expect(readFileSync(copiedCliDispatchCoreRuntimePath, "utf8")).toContain("export function resolveDispatchPlan");
    const copiedCliDispatchCore = await import(`${pathToFileURL(copiedCliDispatchCoreRuntimePath).href}?build-artifact`);
    expect(copiedCliDispatchCore.resolveDispatchPlan({ argv: ["TUI"], isInteractiveTTY: true, isCI: false })).toEqual({
      kind: "tui",
      forwardedArgs: [],
    });
    expect(existsSync(copiedCliDispatchWrapperPath)).toBe(true);
    const copiedCliDispatchWrapper = await import(`${pathToFileURL(copiedCliDispatchWrapperPath).href}?build-artifact`);
    expect(copiedCliDispatchWrapper.resolveDispatchPlan({ argv: ["--help"], isInteractiveTTY: false, isCI: true })).toEqual({
      kind: "help",
      exitCode: 0,
    });
    const copiedCliDispatchHelp = spawnSync(process.execPath, [copiedCliDispatchWrapperPath, "--help"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AFERGON_AI_FORCE_TTY: "0", CI: "true", PATH: "" },
    });
    expect(copiedCliDispatchHelp.status).toBe(0);
    expect(copiedCliDispatchHelp.stdout).toBe(copiedCliDispatchWrapper.formatHelp());
    expect(copiedCliDispatchHelp.stderr).toBe("");
    const copiedCliDispatchError = spawnSync(process.execPath, [copiedCliDispatchWrapperPath, "not-a-command"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AFERGON_AI_FORCE_TTY: "0", CI: "true", PATH: "" },
    });
    expect(copiedCliDispatchError.status).toBe(1);
    expect(copiedCliDispatchError.stdout).toBe("");
    expect(copiedCliDispatchError.stderr).toBe("Unknown command: not-a-command\nRun 'afergon-ai --help' for usage.\n");
    expect(existsSync(copiedModelProfilesAdapterBridgePath)).toBe(true);
    expect(readFileSync(copiedModelProfilesAdapterBridgePath, "utf8")).toContain('export * from "./model-profiles-adapter.ts"');
    expect(existsSync(emittedModelProfilesAdapterDeclarationPath)).toBe(true);
    expect(readFileSync(emittedModelProfilesAdapterDeclarationPath, "utf8")).toContain('from "../model-profiles.mjs"');
    expect(existsSync(copiedModelProfilesControllerBridgePath)).toBe(true);
    expect(readFileSync(copiedModelProfilesControllerBridgePath, "utf8")).toContain('export * from "./model-profiles-controller.ts"');
    expect(existsSync(copiedModelProfilesControllerRuntimePath)).toBe(true);
    expect(readFileSync(copiedModelProfilesControllerRuntimePath, "utf8")).toContain("createModelProfilesInputController");
    const copiedModelProfilesController = await import(`${pathToFileURL(copiedModelProfilesControllerRuntimePath).href}?build-artifact`);
    expect(typeof copiedModelProfilesController.createModelProfilesInputController).toBe("function");
    expect(existsSync(copiedModalControllerBridgePath)).toBe(true);
    expect(readFileSync(copiedModalControllerBridgePath, "utf8")).toContain('export * from "./modal-controller.ts"');
    expect(existsSync(copiedModalControllerRuntimePath)).toBe(true);
    expect(readFileSync(copiedModalControllerRuntimePath, "utf8")).toContain("createModalInputController");
    const copiedModalController = await import(`${pathToFileURL(copiedModalControllerRuntimePath).href}?build-artifact`);
    expect(typeof copiedModalController.createModalInputController).toBe("function");
    expect(existsSync(copiedActionExecutionPolicyBridgePath)).toBe(true);
    expect(readFileSync(copiedActionExecutionPolicyBridgePath, "utf8")).toContain('export * from "./action-execution-policy.ts"');
    expect(existsSync(copiedActionExecutionPolicyRuntimePath)).toBe(true);
    expect(readFileSync(copiedActionExecutionPolicyRuntimePath, "utf8")).toContain("createActionExecutionPolicy");
    const copiedActionExecutionPolicy = await import(`${pathToFileURL(copiedActionExecutionPolicyRuntimePath).href}?build-artifact`);
    expect(typeof copiedActionExecutionPolicy.createActionExecutionPolicy).toBe("function");
    expect(existsSync(copiedHomeMenuControllerBridgePath)).toBe(true);
    expect(readFileSync(copiedHomeMenuControllerBridgePath, "utf8")).toContain('export * from "./home-menu-controller.ts"');
    expect(existsSync(copiedHomeMenuControllerRuntimePath)).toBe(true);
    expect(readFileSync(copiedHomeMenuControllerRuntimePath, "utf8")).toContain("createHomeMenuInputController");
    const copiedHomeMenuController = await import(`${pathToFileURL(copiedHomeMenuControllerRuntimePath).href}?build-artifact`);
    expect(typeof copiedHomeMenuController.createHomeMenuInputController).toBe("function");
    expect(existsSync(copiedGlobalHomeFallbackControllerBridgePath)).toBe(true);
    expect(readFileSync(copiedGlobalHomeFallbackControllerBridgePath, "utf8")).toContain('export * from "./global-home-fallback-controller.ts"');
    expect(existsSync(copiedGlobalHomeFallbackControllerRuntimePath)).toBe(true);
    expect(readFileSync(copiedGlobalHomeFallbackControllerRuntimePath, "utf8")).toContain("createGlobalHomeFallbackController");
    const copiedGlobalHomeFallbackController = await import(`${pathToFileURL(copiedGlobalHomeFallbackControllerRuntimePath).href}?build-artifact`);
    expect(typeof copiedGlobalHomeFallbackController.createGlobalHomeFallbackController).toBe("function");
    expect(existsSync(copiedSectionActionControllerBridgePath)).toBe(true);
    expect(readFileSync(copiedSectionActionControllerBridgePath, "utf8")).toContain('export * from "./section-action-controller.ts"');
    expect(existsSync(copiedSectionActionControllerRuntimePath)).toBe(true);
    expect(readFileSync(copiedSectionActionControllerRuntimePath, "utf8")).toContain("createSectionActionInputController");
    const copiedSectionActionController = await import(`${pathToFileURL(copiedSectionActionControllerRuntimePath).href}?build-artifact`);
    expect(typeof copiedSectionActionController.createSectionActionInputController).toBe("function");
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
    expect(existsSync(modelProfilesOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesOutputPath, "utf8")).toContain('from "./model-profiles-core.js"');
    expect(readFileSync(modelProfilesOutputPath, "utf8")).toContain('from "./model-profiles-save.js"');
    expect(existsSync(modelsCliCoreOutputPath)).toBe(true);
    expect(readFileSync(modelsCliCoreOutputPath, "utf8")).toContain("export function parseSetCommandArguments");
    const emittedModelsCliCore = await import(`${pathToFileURL(modelsCliCoreOutputPath).href}?build-artifact`);
    expect(emittedModelsCliCore.parseSetCommandArguments(["afergon-ai", "inherit"])).toEqual({
      allowUnknown: false,
      agent: "afergon-ai",
      model: "inherit",
    });
    expect(emittedModelsCliCore.formatEffective({ effective: null })).toBe("(runtime default)");
    expect(existsSync(cliDispatchCoreOutputPath)).toBe(true);
    expect(readFileSync(cliDispatchCoreOutputPath, "utf8")).toContain("export function resolveDispatchPlan");
    const emittedCliDispatchCore = await import(`${pathToFileURL(cliDispatchCoreOutputPath).href}?build-artifact`);
    expect(emittedCliDispatchCore.resolveDispatchPlan({ argv: ["invalid"], isInteractiveTTY: false, isCI: true })).toEqual({
      kind: "error",
      exitCode: 1,
      message: "Unknown command: invalid\nRun 'afergon-ai --help' for usage.",
    });
    expect(existsSync(configStatusAdapterOutputPath)).toBe(true);
    expect(readFileSync(configStatusAdapterOutputPath, "utf8")).toContain("export function getConfigurationStatus");
    expect(existsSync(modelProfilesAdapterOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesAdapterOutputPath, "utf8")).toContain("export function getModelProfilesScreenState");
    expect(existsSync(modelProfilesControllerOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesControllerOutputPath, "utf8")).toContain('from "./model-profiles-controller.mjs"');
    const emittedModelProfilesController = await import(`${pathToFileURL(modelProfilesControllerOutputPath).href}?build-artifact`);
    expect(typeof emittedModelProfilesController.createModelProfilesInputController).toBe("function");
    expect(existsSync(modalControllerOutputPath)).toBe(true);
    expect(readFileSync(modalControllerOutputPath, "utf8")).toContain('from "./modal-controller.mjs"');
    const emittedModalController = await import(`${pathToFileURL(modalControllerOutputPath).href}?build-artifact`);
    expect(typeof emittedModalController.createModalInputController).toBe("function");
    expect(existsSync(actionExecutionPolicyOutputPath)).toBe(true);
    expect(readFileSync(actionExecutionPolicyOutputPath, "utf8")).toContain('from "./action-execution-policy.mjs"');
    const emittedActionExecutionPolicy = await import(`${pathToFileURL(actionExecutionPolicyOutputPath).href}?build-artifact`);
    expect(typeof emittedActionExecutionPolicy.createActionExecutionPolicy).toBe("function");
    expect(existsSync(homeMenuControllerOutputPath)).toBe(true);
    expect(readFileSync(homeMenuControllerOutputPath, "utf8")).toContain('from "./home-menu-controller.mjs"');
    const emittedHomeMenuController = await import(`${pathToFileURL(homeMenuControllerOutputPath).href}?build-artifact`);
    expect(typeof emittedHomeMenuController.createHomeMenuInputController).toBe("function");
    expect(existsSync(globalHomeFallbackControllerOutputPath)).toBe(true);
    expect(readFileSync(globalHomeFallbackControllerOutputPath, "utf8")).toContain('from "./global-home-fallback-controller.mjs"');
    const emittedGlobalHomeFallbackController = await import(`${pathToFileURL(globalHomeFallbackControllerOutputPath).href}?build-artifact`);
    expect(typeof emittedGlobalHomeFallbackController.createGlobalHomeFallbackController).toBe("function");
    expect(existsSync(sectionActionControllerOutputPath)).toBe(true);
    expect(readFileSync(sectionActionControllerOutputPath, "utf8")).toContain('from "./section-action-controller.mjs"');
    const emittedSectionActionController = await import(`${pathToFileURL(sectionActionControllerOutputPath).href}?build-artifact`);
    expect(typeof emittedSectionActionController.createSectionActionInputController).toBe("function");
    expect(existsSync(configurationScreenOutputPath)).toBe(true);
    expect(readFileSync(configurationScreenOutputPath, "utf8")).toContain("export function renderConfigurationScreen");
    expect(existsSync(modelProfilesScreenOutputPath)).toBe(true);
    expect(readFileSync(modelProfilesScreenOutputPath, "utf8")).toContain("export function renderModelProfilesScreen");
    expect(existsSync(statusScreenOutputPath)).toBe(true);
    expect(readFileSync(statusScreenOutputPath, "utf8")).toContain("export function renderStatusScreen");
  });
});
