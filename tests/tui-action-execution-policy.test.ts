// This parity suite retains imports of the authoritative MJS runtime during Phase 2.
// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

import * as policyTypeScript from "../scripts/lib/tui/action-execution-policy.ts";
import {
  createActionExecutionPolicy,
  resolveExecutableAction,
  shouldSuppressSuccessfulOutputPanel,
} from "../scripts/lib/tui/action-execution-policy.mjs";
import { createFormState } from "../scripts/lib/tui/actions/forms.mjs";
import { buildCommandArgv } from "../scripts/lib/tui/command-manifest.mjs";
import { createModalInputController } from "../scripts/lib/tui/modal-controller.mjs";
import { createNavigationState } from "../scripts/lib/tui/navigation.mjs";

const keys = {
  up: (data) => data === "up",
  down: (data) => data === "down",
  left: (data) => data === "left",
  right: (data) => data === "right",
  enter: (data) => data === "enter",
  escape: (data) => data === "escape",
};

function createHarness(factory = createActionExecutionPolicy) {
  const navigation = createNavigationState("model-profiles");
  const executeAction = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
  const createOutputState = vi.fn(({ action, result }) => ({ kind: "output", action, result }));
  const showModal = vi.fn((modal) => { navigation.modal = modal; });
  const hideModal = vi.fn(() => { navigation.modal = undefined; });
  const onNavigate = vi.fn();
  const finalizeSuccessfulDelete = vi.fn();
  const finalizeSuccessfulProfileCreate = vi.fn();
  let outputState;
  const policy = factory({
    executeAction,
    createOutputState,
    showModal,
    hideModal,
    onNavigate,
    getRouteState: () => ({ profiles: [{ name: "budget" }] }),
    getOutputState: () => outputState,
    setOutputState: (nextState) => { outputState = nextState; },
    finalizeSuccessfulDelete,
    finalizeSuccessfulProfileCreate,
  });
  return {
    policy,
    navigation,
    executeAction,
    createOutputState,
    showModal,
    hideModal,
    onNavigate,
    finalizeSuccessfulDelete,
    finalizeSuccessfulProfileCreate,
    getOutputState: () => outputState,
  };
}

describe("TUI action execution policy", () => {
  it("keeps the TypeScript public surface in parity with runtime MJS", () => {
    expect(Object.keys(policyTypeScript).sort()).toEqual([
      "createActionExecutionPolicy",
      "resolveExecutableAction",
      "shouldSuppressSuccessfulOutputPanel",
    ]);
  });

  it.each([
    ["runtime MJS", createActionExecutionPolicy],
    ["TypeScript facade", policyTypeScript.createActionExecutionPolicy],
  ])("translates a rejecting executeAction dependency into bounded failure output for %s", async (_runtime, factory) => {
    const harness = createHarness(factory);
    harness.executeAction.mockRejectedValueOnce(new Error("execution boundary unavailable"));

    await expect(harness.policy.runSelectedAction({ id: "models-switch-focused", argv: ["models", "use"] })).resolves.toBeUndefined();

    expect(harness.createOutputState).toHaveBeenCalledWith({
      action: expect.objectContaining({ id: "models-switch-focused" }),
      result: {
        ok: false,
        exitCode: 1,
        stdout: "",
        stderr: "execution boundary unavailable",
        timedOut: false,
      },
    });
    expect(harness.showModal).toHaveBeenCalledTimes(1);
    expect(harness.onNavigate).toHaveBeenCalledTimes(1);
  });

  it("resolves dynamic argv, CLI text, and confirmation from the same authoritative policy", () => {
    const action = {
      id: "models-delete-focused",
      kind: "mutate",
      buildArgv: ({ name }) => buildCommandArgv("models", ["profile", "delete", name]),
      buildConfirmation: ({ name }) => ({ kind: "typed-match", expectedText: name.toUpperCase() }),
    };

    expect(resolveExecutableAction(action, { name: "budget" })).toEqual(expect.objectContaining({
      argv: ["models", "profile", "delete", "budget"],
      cliEquivalent: "afergon-ai models profile delete budget",
      confirmation: { kind: "typed-match", expectedText: "BUDGET" },
    }));
  });

  it("suppresses only clean successful profile switches and deletes", () => {
    expect(shouldSuppressSuccessfulOutputPanel({ id: "models-switch-focused" }, { ok: true, stdout: "Switched", stderr: "" })).toBe(true);
    expect(shouldSuppressSuccessfulOutputPanel({ id: "models-delete-focused" }, { ok: true, stdout: "Deleted", stderr: "warning" })).toBe(false);
    expect(shouldSuppressSuccessfulOutputPanel({ id: "models-switch-focused" }, { ok: true, stdout: "Refresh degraded", stderr: "" })).toBe(false);
    expect(shouldSuppressSuccessfulOutputPanel({ id: "other" }, { ok: true, stdout: "", stderr: "" })).toBe(false);
  });

  it("finalizes clean delete state without an output panel and shows failed or degraded output", async () => {
    const harness = createHarness();
    await harness.policy.runSelectedAction({ id: "models-delete-focused", argv: ["models", "delete"] });

    expect(harness.finalizeSuccessfulDelete).toHaveBeenCalledWith({ profiles: [{ name: "budget" }] });
    expect(harness.getOutputState()).toBeUndefined();
    expect(harness.hideModal).toHaveBeenCalledTimes(1);

    harness.executeAction.mockResolvedValueOnce({ ok: true, stdout: "Refresh degraded", stderr: "" });
    await harness.policy.runSelectedAction({ id: "models-switch-focused", argv: ["models", "use"] });

    expect(harness.getOutputState()).toEqual(expect.objectContaining({ kind: "output", action: expect.objectContaining({ id: "models-switch-focused" }) }));
    expect(harness.showModal).toHaveBeenCalledTimes(1);
  });

  it("preserves create success cleanup while surfacing degraded refresh guidance", async () => {
    const harness = createHarness();
    await harness.policy.runSelectedAction({ id: "model-profiles-create-profile", argv: ["models", "profile", "create", "budget"] });

    expect(harness.finalizeSuccessfulProfileCreate).toHaveBeenCalledWith(expect.objectContaining({ id: "model-profiles-create-profile" }), expect.any(Object));
    expect(harness.getOutputState()).toBeUndefined();

    harness.executeAction.mockResolvedValueOnce({ ok: true, stdout: "Refresh degraded", stderr: "" });
    await harness.policy.runSelectedAction({ id: "model-profiles-create-profile", argv: ["models", "profile", "create", "budget"] });

    expect(harness.getOutputState()).toEqual(expect.objectContaining({ kind: "output" }));
  });

  it("uses policy resolution for a form submission before modal confirmation and execution", async () => {
    const harness = createHarness();
    const action = {
      id: "form-mutate",
      kind: "mutate",
      form: { kind: "fields", fields: [{ id: "name", label: "Name", type: "text", required: true, requiredMessage: "Name is required." }] },
      buildArgv: ({ name }) => buildCommandArgv("models", ["profile", "create", name]),
      buildConfirmation: ({ name }) => ({ kind: "typed-match", expectedText: name }),
    };
    harness.navigation.modal = createFormState({ action });
    const modalController = createModalInputController({
      navigation: harness.navigation,
      getOutputState: harness.getOutputState,
      clearOutputState: () => undefined,
      onNavigate: harness.onNavigate,
      runSelectedAction: harness.policy.runSelectedAction,
      resolveExecutableAction: harness.policy.resolveExecutableAction,
      showModal: harness.showModal,
      hideModal: harness.hideModal,
      keyMatches: keys,
    });

    modalController.handleInput("b");
    modalController.handleInput("down");
    modalController.handleInput("enter");
    expect(harness.navigation.modal).toEqual(expect.objectContaining({
      kind: "confirm",
      action: expect.objectContaining({ argv: ["models", "profile", "create", "b"] }),
    }));
    modalController.handleInput("b");
    modalController.handleInput("enter");
    await Promise.resolve();
    expect(harness.executeAction).toHaveBeenCalledWith(expect.objectContaining({ action: expect.objectContaining({ id: "form-mutate" }) }));
  });
});
