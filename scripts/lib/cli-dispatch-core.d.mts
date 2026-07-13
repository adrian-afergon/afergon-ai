export type DispatchCommand = "init" | "doctor" | "update" | "models";

export type DispatchPlan =
  | { kind: "command"; command: DispatchCommand; forwardedArgs: string[] }
  | { kind: "tui"; forwardedArgs: string[] }
  | { kind: "help"; exitCode: 0 }
  | { kind: "error"; exitCode: 1; message: string };

export type DispatchRequest = {
  argv: readonly string[];
  isInteractiveTTY: boolean;
  isCI: boolean;
};

export function formatHelp(): string;
export function resolveDispatchPlan(request: DispatchRequest): DispatchPlan;
