// This parity suite retains imports of the authoritative MJS runtime during Phase 2.
// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

import * as controllerTypeScript from "../scripts/lib/tui/modal-controller.ts";
import { createModalInputController } from "../scripts/lib/tui/modal-controller.js";
import { createFormState, createConfirmationState, createOutputState } from "../scripts/lib/tui/actions/forms.mjs";
import { createNavigationState } from "../scripts/lib/tui/navigation.mjs";

const keys = {
  up: (data) => data === "up",
  down: (data) => data === "down",
  left: (data) => data === "left",
  right: (data) => data === "right",
  enter: (data) => data === "enter",
  escape: (data) => data === "escape",
};

const mutateAction = { id: "remove", kind: "mutate", label: "Remove", argv: ["remove"], confirmation: { kind: "typed-match", expectedText: "REMOVE", mismatchMessage: "Type REMOVE." } };
const submitCancelAction = { id: "submit-cancel", kind: "mutate", label: "Submit", argv: ["submit"], confirmation: { kind: "submit-cancel" } };
const pickerAction = { id: "pick", kind: "read", label: "Pick", form: { kind: "picker", options: [{ id: "one", label: "One" }, { id: "two", label: "Two" }] } };
const fieldsAction = { id: "fields", kind: "mutate", label: "Fields", form: { kind: "fields", fields: [{ id: "name", label: "Name", type: "text", required: true, requiredMessage: "Name is required." }] } };
const checkboxAction = { id: "check", kind: "mutate", label: "Check", form: { kind: "checkboxes", options: [{ id: "one", label: "One" }, { id: "two", label: "Two" }] } };

function createHarness(factory) {
  const navigation = createNavigationState("status");
  const onNavigate = vi.fn();
  const runSelectedAction = vi.fn(async () => undefined);
  const resolveExecutableAction = vi.fn((action, input = {}) => ({ ...action, resolvedInput: input }));
  let outputState;
  const controller = factory({
    navigation,
    getOutputState: () => outputState,
    clearOutputState: () => { outputState = undefined; },
    onNavigate,
    runSelectedAction,
    resolveExecutableAction,
    showModal: (modal) => { navigation.modal = modal; },
    hideModal: () => { navigation.modal = undefined; },
    keyMatches: keys,
  });
  return {
    controller, navigation, onNavigate, resolveExecutableAction, runSelectedAction,
    setOutputState: (state) => { outputState = state; },
  };
}

async function applyInputs(harness, inputs) {
  for (const input of inputs) {
    expect(harness.controller.handleInput(input)).toBe(true);
    await Promise.resolve();
  }
}

describe("modal input controller", () => {
  it("keeps the TypeScript public surface in parity with the runtime MJS controller", () => {
    expect(Object.keys(controllerTypeScript).sort()).toEqual(["createModalInputController"]);
  });

  it("keeps confirmation typed-match, submit, cancel, output dismissal, and escape transitions in parity", async () => {
    const runtime = createHarness(createModalInputController);
    const typeScript = createHarness(controllerTypeScript.createModalInputController);
    for (const harness of [runtime, typeScript]) {
      harness.navigation.modal = createConfirmationState({ action: mutateAction });
      await applyInputs(harness, ["R", "E", "M", "O", "V", "E", "enter"]);
      harness.navigation.modal = createConfirmationState({ action: mutateAction });
      await applyInputs(harness, ["escape"]);
      harness.navigation.modal = createConfirmationState({ action: submitCancelAction });
      await applyInputs(harness, ["down", "enter"]);
      harness.navigation.modal = createConfirmationState({ action: submitCancelAction });
      await applyInputs(harness, ["enter"]);
      harness.setOutputState(createOutputState({ action: mutateAction, result: { ok: true, stdout: "ok", stderr: "" } }));
      harness.navigation.modal = harness.controller.getOutputState();
      await applyInputs(harness, ["escape"]);
    }
    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.runSelectedAction.mock.calls).toEqual(runtime.runSelectedAction.mock.calls);
    expect(typeScript.onNavigate.mock.calls).toEqual(runtime.onNavigate.mock.calls);
  });

  it("keeps picker, fields, and checkbox submission, cancellation, and validation transitions in parity", async () => {
    const runtime = createHarness(createModalInputController);
    const typeScript = createHarness(controllerTypeScript.createModalInputController);
    for (const harness of [runtime, typeScript]) {
      harness.navigation.modal = createFormState({ action: pickerAction });
      await applyInputs(harness, ["down", "enter"]);
      harness.navigation.modal = createFormState({ action: fieldsAction });
      await applyInputs(harness, ["down", "enter", "up", "A", "down", "enter"]);
      harness.navigation.modal = createFormState({ action: checkboxAction });
      await applyInputs(harness, ["down", " ", "down", "enter"]);
      harness.navigation.modal = createFormState({ action: checkboxAction });
      await applyInputs(harness, ["down", "down", "down", "enter"]);
    }
    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.resolveExecutableAction.mock.calls).toEqual(runtime.resolveExecutableAction.mock.calls);
    expect(typeScript.runSelectedAction.mock.calls).toEqual(runtime.runSelectedAction.mock.calls);
  });

  it("validates fields before confirmation and preserves form cancellation boundaries", async () => {
    const harness = createHarness(createModalInputController);
    harness.navigation.modal = createFormState({ action: fieldsAction });
    await applyInputs(harness, ["down", "enter"]);
    expect(harness.navigation.modal).toEqual(expect.objectContaining({
      kind: "form",
      activeIndex: 0,
      validationMessage: "Name is required.",
    }));
    await applyInputs(harness, ["A", "down", "enter"]);
    expect(harness.navigation.modal).toEqual(expect.objectContaining({
      kind: "confirm",
      action: expect.objectContaining({ id: "fields", resolvedInput: { name: "A" } }),
    }));
    await applyInputs(harness, ["escape"]);
    expect(harness.navigation.modal).toBeUndefined();
    expect(harness.runSelectedAction).not.toHaveBeenCalled();
  });
});
