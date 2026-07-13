// This parity suite retains imports of the authoritative MJS runtime during Phase 2.
// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

import * as controllerTypeScript from "../scripts/lib/tui/section-action-controller.ts";
import { createSectionActionInputController } from "../scripts/lib/tui/section-action-controller.mjs";
import { createNavigationState } from "../scripts/lib/tui/navigation.mjs";

const keys = {
  up: (data) => data === "up",
  down: (data) => data === "down",
  enter: (data) => data === "enter",
};

const readAction = { id: "doctor", kind: "read", label: "Run doctor" };
const mutateAction = { id: "update", kind: "mutate", label: "Update managed files" };
const formAction = { id: "init", kind: "mutate", label: "Initialize", form: { kind: "checkboxes", options: [] } };

function createHarness(factory, { route = "status", actions = [readAction, mutateAction, formAction] } = {}) {
  const navigation = createNavigationState(route);
  const onNavigate = vi.fn();
  const showModal = vi.fn((modal) => { navigation.modal = modal; });
  const runSelectedAction = vi.fn();
  const resolveExecutableAction = vi.fn((action) => ({ ...action, argv: [action.id] }));
  let currentActions = actions;
  const controller = factory({
    navigation,
    getRouteInteractiveActions: () => currentActions,
    onNavigate,
    showModal,
    runSelectedAction,
    resolveExecutableAction,
    keyMatches: keys,
  });
  return {
    controller,
    navigation,
    onNavigate,
    showModal,
    runSelectedAction,
    resolveExecutableAction,
    setActions: (nextActions) => { currentActions = nextActions; },
  };
}

describe("section action input controller", () => {
  it("keeps the TypeScript public surface in parity with the runtime MJS controller", () => {
    expect(Object.keys(controllerTypeScript).sort()).toEqual(["createSectionActionInputController"]);
  });

  it("keeps selection clamping and up/down movement in MJS and TypeScript parity", () => {
    const runtime = createHarness(createSectionActionInputController);
    const typeScript = createHarness(controllerTypeScript.createSectionActionInputController);
    for (const harness of [runtime, typeScript]) {
      harness.navigation.sectionActionSelection = 9;
      harness.controller.syncSelection();
      expect(harness.navigation.sectionActionSelection).toBe(2);
      expect(harness.controller.handleInput("down")).toBe(true);
      expect(harness.navigation.sectionActionSelection).toBe(0);
      expect(harness.controller.handleInput("up")).toBe(true);
      expect(harness.navigation.sectionActionSelection).toBe(2);
      harness.setActions([readAction]);
      harness.controller.syncSelection();
      expect(harness.navigation.sectionActionSelection).toBe(0);
    }
    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.onNavigate.mock.calls).toEqual(runtime.onNavigate.mock.calls);
  });

  it("opens forms, confirms mutations, and runs read actions inline in MJS and TypeScript parity", () => {
    const runtime = createHarness(createSectionActionInputController);
    const typeScript = createHarness(controllerTypeScript.createSectionActionInputController);
    for (const harness of [runtime, typeScript]) {
      harness.navigation.sectionActionSelection = 2;
      expect(harness.controller.handleInput("enter")).toBe(true);
      expect(harness.showModal).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "form", action: formAction }));
      harness.navigation.sectionActionSelection = 1;
      expect(harness.controller.handleInput("enter")).toBe(true);
      expect(harness.showModal).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "confirm", action: expect.objectContaining({ id: "update", argv: ["update"] }) }));
      harness.navigation.sectionActionSelection = 0;
      expect(harness.controller.handleInput("enter")).toBe(true);
      expect(harness.runSelectedAction).toHaveBeenLastCalledWith(expect.objectContaining({ id: "doctor", argv: ["doctor"] }));
    }
    expect(typeScript.showModal.mock.calls).toEqual(runtime.showModal.mock.calls);
    expect(typeScript.runSelectedAction.mock.calls).toEqual(runtime.runSelectedAction.mock.calls);
    expect(typeScript.resolveExecutableAction.mock.calls).toEqual(runtime.resolveExecutableAction.mock.calls);
  });

  it("refreshes actions on Enter after the rendered list is reordered in MJS and TypeScript parity", () => {
    const runtime = createHarness(createSectionActionInputController);
    const typeScript = createHarness(controllerTypeScript.createSectionActionInputController);
    for (const harness of [runtime, typeScript]) {
      harness.navigation.sectionActionSelection = 1;
      harness.controller.syncSelection([readAction, mutateAction, formAction]);
      harness.setActions([formAction, readAction, mutateAction]);

      expect(harness.controller.handleInput("enter")).toBe(true);
      expect(harness.runSelectedAction).toHaveBeenLastCalledWith(expect.objectContaining({ id: "doctor", argv: ["doctor"] }));
      expect(harness.showModal).not.toHaveBeenCalled();
    }
    expect(typeScript.runSelectedAction.mock.calls).toEqual(runtime.runSelectedAction.mock.calls);
    expect(typeScript.resolveExecutableAction.mock.calls).toEqual(runtime.resolveExecutableAction.mock.calls);
  });

  it("does nothing on Home or when the current section has no actions", () => {
    const home = createHarness(createSectionActionInputController, { route: "home" });
    const empty = createHarness(createSectionActionInputController, { actions: [] });
    for (const harness of [home, empty]) {
      expect(harness.controller.handleInput("up")).toBe(false);
      expect(harness.controller.handleInput("down")).toBe(false);
      expect(harness.controller.handleInput("enter")).toBe(false);
      expect(harness.navigation.sectionActionSelection).toBe(0);
      expect(harness.onNavigate).not.toHaveBeenCalled();
      expect(harness.showModal).not.toHaveBeenCalled();
      expect(harness.runSelectedAction).not.toHaveBeenCalled();
    }
  });
});
