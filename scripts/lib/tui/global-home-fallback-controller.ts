import { createGlobalHomeFallbackController as createRuntimeController } from "./global-home-fallback-controller.mjs";

export interface GlobalHomeFallbackInputController {
  readonly handleInput: (data: string) => boolean;
}

export interface GlobalHomeFallbackInputControllerOptions {
  readonly navigation: { route: string; [key: string]: unknown };
  readonly onNavigate: () => void;
  readonly setRoute: (route: "home") => void;
  readonly normalizeInput: (data: string) => string | undefined;
}

/** Typed facade for the authoritative MJS global Home fallback controller. */
export const createGlobalHomeFallbackController = (
  options: GlobalHomeFallbackInputControllerOptions,
): GlobalHomeFallbackInputController => createRuntimeController(options) as GlobalHomeFallbackInputController;
