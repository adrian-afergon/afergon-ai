import { createModalInputController as createRuntimeController } from "./modal-controller.mjs";

export interface ModalKeyMatches {
  readonly up: (data: string) => boolean;
  readonly down: (data: string) => boolean;
  readonly left: (data: string) => boolean;
  readonly right: (data: string) => boolean;
  readonly enter: (data: string) => boolean;
  readonly escape: (data: string) => boolean;
}

export interface ModalInputController {
  readonly getOutputState: () => unknown;
  readonly handleInput: (data: string) => boolean;
}

export interface ModalInputControllerOptions {
  readonly navigation: { modal?: Record<string, any> };
  readonly getOutputState: () => unknown;
  readonly clearOutputState: () => void;
  readonly onNavigate: () => void;
  readonly onFormSubmit?: (input: { readonly modal: Record<string, any>; readonly submitState: Record<string, boolean> }) => boolean;
  readonly runSelectedAction: (action: Record<string, unknown>) => Promise<void>;
  readonly resolveExecutableAction: (action: Record<string, unknown>, input?: Record<string, unknown>) => Record<string, any>;
  readonly showModal: (modal: Record<string, unknown>) => void;
  readonly hideModal: () => void;
  readonly shouldDismissOutput?: (data: string) => boolean;
  readonly keyMatches: ModalKeyMatches;
}

/** Typed facade for the authoritative MJS modal controller. */
export const createModalInputController = (options: ModalInputControllerOptions): ModalInputController =>
  createRuntimeController(options) as ModalInputController;
