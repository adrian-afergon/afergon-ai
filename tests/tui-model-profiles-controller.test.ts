// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

import { createModelProfilesInputController } from "../scripts/lib/tui/model-profiles-controller.ts";
import { createNavigationState } from "../scripts/lib/tui/navigation.ts";

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

function createHarness() {
  const navigation = createNavigationState("model-profiles");
  const onNavigate = vi.fn();
  const executeAction = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
  const saveModelProfileAssignments = vi.fn(() => ({ profileName: "budget", refreshResult: { degraded: false } }));
  const controller = createModelProfilesInputController({
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
  it("exports the route-local controller factory", () => {
    expect(createModelProfilesInputController).toBeTypeOf("function");
  });

  it("maps browse transitions and enter/delete/u/n intents", async () => {
    const harness = createHarness();

    for (const input of ["down", "up", "enter", "delete", "u", "escape", "n", "x", "enter"]) {
      harness.controller.handleInput(input);
      await Promise.resolve();
    }

    expect(harness.navigation.modelProfiles).toMatchObject({ mode: "browse", createProfileSelection: "input" });
    expect(serializedActionCalls(harness.executeAction)).toEqual([
      expect.objectContaining({ id: "models-switch-focused" }),
      expect.objectContaining({ id: "model-profiles-create-profile", targetProfileName: "x" }),
    ]);
    expect(harness.onNavigate).toHaveBeenCalled();
  });

  it("moves assignment focus, opens an assignment form, and saves staged assignments", () => {
    const harness = createHarness();
    harness.navigation.modelProfiles = { ...harness.navigation.modelProfiles, mode: "assignments", targetProfileName: "budget" };

    for (const input of ["down", "enter", "escape"]) {
      harness.controller.handleInput(input);
    }

    expect(harness.navigation.modelProfiles).toMatchObject({ mode: "browse", targetProfileName: undefined });
    harness.navigation.modelProfiles = { ...harness.navigation.modelProfiles, mode: "assignments", targetProfileName: "budget" };
    harness.controller.handleInput("s");
    expect(harness.saveModelProfileAssignments).toHaveBeenCalledWith(expect.objectContaining({ profileName: "budget" }));
  });

  it("edits, validates, and submits inline profile creation", async () => {
    const harness = createHarness();
    harness.navigation.modelProfiles = { ...harness.navigation.modelProfiles, focusedProfileIndex: 1 };

    for (const input of ["enter", "d", "r", "a", "f", "t", "enter"]) {
      harness.controller.handleInput(input);
      await Promise.resolve();
    }

    expect(serializedActionCalls(harness.executeAction)).toEqual([
      expect.objectContaining({ id: "model-profiles-create-profile", targetProfileName: "draft" }),
    ]);
  });
});
