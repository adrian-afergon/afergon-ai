import { describe, expect, it, vi } from "vitest";

import * as controllerTypeScript from "../scripts/lib/tui/model-profiles-controller.ts";
import { createModelProfilesInputController } from "../scripts/lib/tui/model-profiles-controller.js";
import { createNavigationState } from "../scripts/lib/tui/navigation.js";

const keys = {
  up: (data) => data === "up",
  down: (data) => data === "down",
  enter: (data) => data === "enter",
  escape: (data) => data === "escape",
};

function createRouteState(navigation) {
  const focusedProfile = navigation.modelProfiles.focusedProfileIndex === 1
    ? { name: "* New Profile", isCreate: true }
    : { name: "budget", isCreate: false };

  return {
    profiles: [{ name: "budget" }, { name: "* New Profile" }],
    assignments: [{ agent: "afergon-ai" }, { agent: "afg-review" }],
    browse: {
      mode: navigation.modelProfiles.mode,
      focusedProfile,
      inlineCreate: navigation.modelProfiles.createProfileName === undefined
        ? undefined
        : { value: navigation.modelProfiles.createProfileName },
    },
  };
}

function createHarness(factory) {
  const navigation = createNavigationState("model-profiles");
  const onNavigate = vi.fn();
  const executeAction = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
  const saveModelProfileAssignments = vi.fn(() => ({ profileName: "budget", refreshResult: { degraded: false } }));
  const controller = factory({
    navigation,
    onNavigate,
    getRouteState: () => createRouteState(navigation),
    executeAction,
    saveModelProfileAssignments,
    refreshActiveModelProfile: () => undefined,
    keyMatches: keys,
  });

  return { controller, executeAction, navigation, onNavigate, saveModelProfileAssignments };
}

function serializedActionCalls(spy) {
  return spy.mock.calls.map(([{ action }]) => JSON.parse(JSON.stringify(action)));
}

describe("model-profiles input controller", () => {
  it("keeps the TypeScript public surface in parity with the runtime MJS controller", () => {
    expect(Object.keys(controllerTypeScript).sort()).toEqual(["createModelProfilesInputController"]);
  });

  it("keeps browse transitions and enter/delete/u/n intent mapping in parity", async () => {
    const runtime = createHarness(createModelProfilesInputController);
    const typeScript = createHarness(controllerTypeScript.createModelProfilesInputController);

    for (const input of ["down", "up", "enter", "delete", "u", "escape", "n", "x", "enter"]) {
      runtime.controller.handleInput(input);
      typeScript.controller.handleInput(input);
      await Promise.resolve();
    }

    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(serializedActionCalls(typeScript.executeAction)).toEqual(serializedActionCalls(runtime.executeAction));
    expect(typeScript.onNavigate.mock.calls).toEqual(runtime.onNavigate.mock.calls);
  });

  it("moves assignment focus, opens an assignment form, and saves staged assignments in parity", () => {
    const runtime = createHarness(createModelProfilesInputController);
    const typeScript = createHarness(controllerTypeScript.createModelProfilesInputController);

    runtime.navigation.modelProfiles = { ...runtime.navigation.modelProfiles, mode: "assignments", targetProfileName: "budget" };
    typeScript.navigation.modelProfiles = { ...typeScript.navigation.modelProfiles, mode: "assignments", targetProfileName: "budget" };

    for (const input of ["down", "enter", "escape", "s"]) {
      runtime.controller.handleInput(input);
      typeScript.controller.handleInput(input);
    }

    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.saveModelProfileAssignments.mock.calls).toEqual(runtime.saveModelProfileAssignments.mock.calls);
  });

  it("edits, validates, and submits inline creation with equivalent state transitions", async () => {
    const runtime = createHarness(createModelProfilesInputController);
    const typeScript = createHarness(controllerTypeScript.createModelProfilesInputController);

    runtime.navigation.modelProfiles = { ...runtime.navigation.modelProfiles, focusedProfileIndex: 1 };
    typeScript.navigation.modelProfiles = { ...typeScript.navigation.modelProfiles, focusedProfileIndex: 1 };

    for (const input of ["enter", "d", "r", "a", "f", "t", "enter"]) {
      runtime.controller.handleInput(input);
      typeScript.controller.handleInput(input);
      await Promise.resolve();
    }

    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(serializedActionCalls(typeScript.executeAction)).toEqual(serializedActionCalls(runtime.executeAction));
  });
});
