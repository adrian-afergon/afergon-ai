import { createHomeMenuInputController as createRuntimeController } from "./home-menu-controller.mjs";

export type HomeMenuRoute = "home" | "configuration" | "status" | "model-profiles";

export interface HomeMenuKeyMatches {
  readonly up: (data: string) => boolean;
  readonly down: (data: string) => boolean;
  readonly enter: (data: string) => boolean;
}

export interface HomeMenuInputController {
  readonly handleInput: (data: string) => boolean;
}

export interface HomeMenuInputControllerOptions {
  readonly navigation: { route: HomeMenuRoute; homeSelection: number; [key: string]: unknown };
  readonly onNavigate: () => void;
  readonly setRoute: (route: Exclude<HomeMenuRoute, "home">) => void;
  readonly normalizeInput: (data: string) => string | undefined;
  readonly keyMatches: HomeMenuKeyMatches;
}

/** Typed facade for the authoritative MJS Home menu controller. */
export const createHomeMenuInputController = (
  options: HomeMenuInputControllerOptions,
): HomeMenuInputController => createRuntimeController(options) as HomeMenuInputController;
