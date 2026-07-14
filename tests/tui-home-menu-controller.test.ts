// This parity suite retains imports of the authoritative MJS runtime during Phase 2.
// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

import * as controllerTypeScript from "../scripts/lib/tui/home-menu-controller.ts";
import { createHomeMenuInputController } from "../scripts/lib/tui/home-menu-controller.js";
import { createNavigationState } from "../scripts/lib/tui/navigation.js";

const keys = {
  up: (data) => data === "up",
  down: (data) => data === "down",
  enter: (data) => data === "enter",
};

function createHarness(factory, { route = "home" } = {}) {
  const navigation = createNavigationState(route);
  navigation.modal = { kind: "output", value: "keep this modal" };
  const onNavigate = vi.fn();
  const setRoute = vi.fn((nextRoute) => {
    navigation.route = nextRoute;
    navigation.modal = undefined;
  });
  const controller = factory({
    navigation,
    onNavigate,
    setRoute,
    normalizeInput: (data) => data.toLowerCase(),
    keyMatches: keys,
  });

  return { controller, navigation, onNavigate, setRoute };
}

describe("home menu input controller", () => {
  it("keeps the TypeScript public surface in parity with the runtime MJS controller", () => {
    expect(Object.keys(controllerTypeScript).sort()).toEqual(["createHomeMenuInputController"]);
  });

  it("moves selection, activates Enter, and routes c/s/m shortcuts in MJS and TypeScript parity", () => {
    const runtime = createHarness(createHomeMenuInputController);
    const typeScript = createHarness(controllerTypeScript.createHomeMenuInputController);

    for (const harness of [runtime, typeScript]) {
      expect(harness.controller.handleInput("up")).toBe(true);
      expect(harness.navigation.homeSelection).toBe(2);
      expect(harness.controller.handleInput("down")).toBe(true);
      expect(harness.navigation.homeSelection).toBe(0);
      expect(harness.controller.handleInput("enter")).toBe(true);
      expect(harness.setRoute).toHaveBeenLastCalledWith("configuration");

      harness.navigation.route = "home";
      expect(harness.controller.handleInput("C")).toBe(true);
      expect(harness.setRoute).toHaveBeenLastCalledWith("configuration");
      harness.navigation.route = "home";
      expect(harness.controller.handleInput("s")).toBe(true);
      expect(harness.setRoute).toHaveBeenLastCalledWith("status");
      harness.navigation.route = "home";
      expect(harness.controller.handleInput("M")).toBe(true);
      expect(harness.setRoute).toHaveBeenLastCalledWith("model-profiles");
    }

    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.onNavigate.mock.calls).toEqual(runtime.onNavigate.mock.calls);
    expect(typeScript.setRoute.mock.calls).toEqual(runtime.setRoute.mock.calls);
  });

  it("does nothing outside Home without changing modal state in MJS and TypeScript parity", () => {
    const runtime = createHarness(createHomeMenuInputController, { route: "status" });
    const typeScript = createHarness(controllerTypeScript.createHomeMenuInputController, { route: "status" });

    for (const harness of [runtime, typeScript]) {
      const modal = harness.navigation.modal;
      for (const input of ["up", "down", "enter", "c", "s", "m"]) {
        expect(harness.controller.handleInput(input)).toBe(false);
      }
      expect(harness.navigation).toMatchObject({ route: "status", homeSelection: 0, modal });
      expect(harness.onNavigate).not.toHaveBeenCalled();
      expect(harness.setRoute).not.toHaveBeenCalled();
    }

    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.onNavigate.mock.calls).toEqual(runtime.onNavigate.mock.calls);
    expect(typeScript.setRoute.mock.calls).toEqual(runtime.setRoute.mock.calls);
  });

  it("rejects invalid printable and non-printable Home input without navigation side effects in MJS and TypeScript parity", () => {
    const runtime = createHarness(createHomeMenuInputController);
    const typeScript = createHarness(controllerTypeScript.createHomeMenuInputController);

    for (const harness of [runtime, typeScript]) {
      const navigationBefore = structuredClone(harness.navigation);

      for (const input of ["x", "\u0003"]) {
        expect(harness.controller.handleInput(input)).toBe(false);
      }

      expect(harness.navigation).toEqual(navigationBefore);
      expect(harness.navigation).toMatchObject({ route: "home", homeSelection: 0 });
      expect(harness.onNavigate).not.toHaveBeenCalled();
      expect(harness.setRoute).not.toHaveBeenCalled();
    }

    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.onNavigate.mock.calls).toEqual(runtime.onNavigate.mock.calls);
    expect(typeScript.setRoute.mock.calls).toEqual(runtime.setRoute.mock.calls);
  });
});
