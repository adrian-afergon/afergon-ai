// This parity suite retains imports of the authoritative MJS runtime during Phase 2.
// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

import * as controllerTypeScript from "../scripts/lib/tui/global-home-fallback-controller.ts";
import { createNavigationState } from "../scripts/lib/tui/navigation.mjs";
import { createGlobalHomeFallbackController } from "../scripts/lib/tui/global-home-fallback-controller.mjs";

function createHarness(factory, { route = "status" } = {}) {
  const navigation = createNavigationState(route);
  navigation.modal = { kind: "output", value: "keep this modal" };
  navigation.sectionActionSelection = 1;
  const onNavigate = vi.fn();
  const setRoute = vi.fn((nextRoute) => {
    navigation.route = nextRoute;
  });
  const controller = factory({
    navigation,
    onNavigate,
    setRoute,
    normalizeInput: (data) => (data.length === 1 ? data.toLowerCase() : undefined),
  });

  return { controller, navigation, onNavigate, setRoute };
}

describe("global Home fallback controller", () => {
  it("keeps the TypeScript public surface in parity with the runtime MJS controller", () => {
    expect(Object.keys(controllerTypeScript).sort()).toEqual(["createGlobalHomeFallbackController"]);
  });

  it("returns off-Home printable h to Home without mutating unrelated state in MJS and TypeScript parity", () => {
    const runtime = createHarness(createGlobalHomeFallbackController);
    const typeScript = createHarness(controllerTypeScript.createGlobalHomeFallbackController);

    for (const harness of [runtime, typeScript]) {
      const modal = harness.navigation.modal;
      const sectionActionSelection = harness.navigation.sectionActionSelection;

      expect(harness.controller.handleInput("H")).toBe(true);
      expect(harness.setRoute).toHaveBeenCalledWith("home");
      expect(harness.navigation).toMatchObject({ route: "home", modal, sectionActionSelection });
      expect(harness.onNavigate).toHaveBeenCalledTimes(1);
    }

    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.onNavigate.mock.calls).toEqual(runtime.onNavigate.mock.calls);
    expect(typeScript.setRoute.mock.calls).toEqual(runtime.setRoute.mock.calls);
  });

  it("does not handle h on Home in MJS and TypeScript parity", () => {
    const runtime = createHarness(createGlobalHomeFallbackController, { route: "home" });
    const typeScript = createHarness(controllerTypeScript.createGlobalHomeFallbackController, { route: "home" });

    for (const harness of [runtime, typeScript]) {
      const navigationBefore = structuredClone(harness.navigation);

      expect(harness.controller.handleInput("h")).toBe(false);
      expect(harness.navigation).toEqual(navigationBefore);
      expect(harness.onNavigate).not.toHaveBeenCalled();
      expect(harness.setRoute).not.toHaveBeenCalled();
    }

    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.onNavigate.mock.calls).toEqual(runtime.onNavigate.mock.calls);
    expect(typeScript.setRoute.mock.calls).toEqual(runtime.setRoute.mock.calls);
  });

  it("rejects invalid printable and non-printable input without side effects in MJS and TypeScript parity", () => {
    const runtime = createHarness(createGlobalHomeFallbackController);
    const typeScript = createHarness(controllerTypeScript.createGlobalHomeFallbackController);

    for (const harness of [runtime, typeScript]) {
      const navigationBefore = structuredClone(harness.navigation);

      for (const input of ["x", "\u0003"]) {
        expect(harness.controller.handleInput(input)).toBe(false);
      }

      expect(harness.navigation).toEqual(navigationBefore);
      expect(harness.onNavigate).not.toHaveBeenCalled();
      expect(harness.setRoute).not.toHaveBeenCalled();
    }

    expect(typeScript.navigation).toEqual(runtime.navigation);
    expect(typeScript.onNavigate.mock.calls).toEqual(runtime.onNavigate.mock.calls);
    expect(typeScript.setRoute.mock.calls).toEqual(runtime.setRoute.mock.calls);
  });
});
