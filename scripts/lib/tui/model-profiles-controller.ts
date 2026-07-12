import { createModelProfilesInputController as createRuntimeController } from "./model-profiles-controller.mjs";

export interface ModelProfilesInputKeyMatches {
  readonly up: (data: string) => boolean;
  readonly down: (data: string) => boolean;
  readonly enter: (data: string) => boolean;
  readonly escape: (data: string) => boolean;
}

export interface ModelProfilesInputController {
  readonly clearOutputState: () => void;
  readonly getOutputState: () => unknown;
  readonly handleInput: (data: string) => boolean;
  readonly resolveExecutableAction: (action: Record<string, unknown>, input?: Record<string, unknown>) => Record<string, unknown>;
  readonly runSelectedAction: (action: Record<string, unknown>) => Promise<void>;
}

export interface ModelProfilesInputControllerOptions {
  readonly navigation: Record<string, any>;
  readonly onNavigate: () => void;
  readonly getRouteState: () => Record<string, any> | undefined;
  readonly executeAction: (input: { readonly action: Record<string, unknown> }) => Promise<Record<string, any>>;
  readonly saveModelProfileAssignments: (input: Record<string, unknown>) => unknown;
  readonly refreshActiveModelProfile: () => unknown;
  readonly keyMatches: ModelProfilesInputKeyMatches;
}

/**
 * Typed facade for the authoritative MJS route controller. It deliberately
 * imports runtime MJS; the runtime module never imports TypeScript source.
 */
export const createModelProfilesInputController = (
  options: ModelProfilesInputControllerOptions,
): ModelProfilesInputController => createRuntimeController(options) as ModelProfilesInputController;
