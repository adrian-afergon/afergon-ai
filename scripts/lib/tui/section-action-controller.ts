import { createSectionActionInputController as createRuntimeController } from "./section-action-controller.mjs";

export interface SectionAction {
  readonly id: string;
  readonly kind: string;
  readonly form?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

export interface SectionActionKeyMatches {
  readonly up: (data: string) => boolean;
  readonly down: (data: string) => boolean;
  readonly enter: (data: string) => boolean;
}

export interface SectionActionInputController {
  readonly handleInput: (data: string) => boolean;
  readonly syncSelection: (actions?: readonly SectionAction[]) => readonly SectionAction[];
}

export interface SectionActionInputControllerOptions {
  readonly navigation: { route: string; sectionActionSelection?: number; [key: string]: unknown };
  readonly getRouteInteractiveActions: (route: string) => readonly SectionAction[] | undefined;
  readonly onNavigate: () => void;
  readonly showModal: (modal: Record<string, unknown>) => void;
  readonly runSelectedAction: (action: SectionAction) => Promise<void> | void;
  readonly resolveExecutableAction: (action: SectionAction) => SectionAction;
  readonly keyMatches: SectionActionKeyMatches;
}

/** Typed facade for the authoritative MJS section action controller. */
export const createSectionActionInputController = (
  options: SectionActionInputControllerOptions,
): SectionActionInputController => createRuntimeController(options) as SectionActionInputController;
