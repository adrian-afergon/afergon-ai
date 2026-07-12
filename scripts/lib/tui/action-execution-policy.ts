import {
  createActionExecutionPolicy as createRuntimePolicy,
  resolveExecutableAction as resolveRuntimeAction,
  shouldSuppressSuccessfulOutputPanel as shouldSuppressRuntimeOutput,
} from "./action-execution-policy.mjs";

export interface ExecutableAction extends Record<string, unknown> {
  readonly id: string;
  readonly argv?: readonly string[];
}

export interface ActionExecutionResult {
  readonly ok?: boolean;
  readonly stdout?: string;
  readonly stderr?: string;
  readonly [key: string]: unknown;
}

export interface ActionExecutionPolicy {
  readonly resolveExecutableAction: (action: ExecutableAction, input?: Record<string, unknown>) => ExecutableAction;
  readonly runSelectedAction: (action: ExecutableAction) => Promise<void>;
  readonly shouldSuppressSuccessfulOutputPanel: (action: ExecutableAction, result: ActionExecutionResult) => boolean;
}

export interface ActionExecutionPolicyOptions {
  readonly executeAction: (input: { readonly action: ExecutableAction }) => Promise<ActionExecutionResult>;
  readonly createOutputState: (input: { readonly action: ExecutableAction; readonly result: ActionExecutionResult }) => Record<string, unknown>;
  readonly showModal: (modal: Record<string, unknown>) => void;
  readonly hideModal: () => void;
  readonly onNavigate: () => void;
  readonly getRouteState?: () => Record<string, unknown> | undefined;
  readonly setOutputState: (state: Record<string, unknown> | undefined) => void;
  readonly sanitizeOutput?: (value: unknown) => string;
  readonly finalizeSuccessfulDelete?: (routeState: Record<string, unknown> | undefined) => void;
  readonly finalizeSuccessfulProfileCreate?: (action: ExecutableAction, result: ActionExecutionResult) => void;
}

/** Typed facade for the authoritative MJS action execution policy. */
export const createActionExecutionPolicy = (options: ActionExecutionPolicyOptions): ActionExecutionPolicy =>
  createRuntimePolicy(options) as ActionExecutionPolicy;

export const resolveExecutableAction = (action: ExecutableAction, input?: Record<string, unknown>): ExecutableAction =>
  resolveRuntimeAction(action, input) as ExecutableAction;

export const shouldSuppressSuccessfulOutputPanel = (action: ExecutableAction, result: ActionExecutionResult): boolean =>
  shouldSuppressRuntimeOutput(action, result);
