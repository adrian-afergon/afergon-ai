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

const EXPLICIT_COMMANDS = new Set<DispatchCommand>(["init", "doctor", "update", "models"]);

export function formatHelp(): string {
  return [
    "",
    "afergon-ai — development harness CLI",
    "",
    "Usage:",
    "  afergon-ai tui",
    "  afergon-ai init [--pi] [--claude] [--opencode] [--all]",
    "  afergon-ai doctor [--opencode]",
    "  afergon-ai update",
    "  afergon-ai models [show [profile]|list|switch|set|profile]",
    "",
    "Commands:",
    "  tui      Open the interactive afergon-ai TUI (TTY only)",
    "  init     Initialize afergon-ai in the current project",
    "  doctor   Verify install; use --opencode for agents/commands checks",
    "  update   Re-apply latest afergon-ai files to all installed tools",
    "  models   Manage afergon-ai model profiles and refresh compatible host config",
    "",
  ].join("\n");
}

export function resolveDispatchPlan({ argv, isInteractiveTTY, isCI }: DispatchRequest): DispatchPlan {
  const [command = "", ...rest] = argv;
  const normalized = command.toLowerCase();
  const interactiveLaunch = isInteractiveTTY && !isCI;

  if (!normalized) {
    return interactiveLaunch ? { kind: "tui", forwardedArgs: [] } : { kind: "help", exitCode: 0 };
  }

  if (normalized === "--help" || normalized === "-h") {
    return { kind: "help", exitCode: 0 };
  }

  if (normalized === "tui") {
    return interactiveLaunch
      ? { kind: "tui", forwardedArgs: rest }
      : {
          kind: "error",
          exitCode: 1,
          message:
            "The afergon-ai TUI requires an interactive terminal. Run 'afergon-ai --help' or an explicit command like 'afergon-ai doctor'.",
        };
  }

  if (EXPLICIT_COMMANDS.has(normalized as DispatchCommand)) {
    return { kind: "command", command: normalized as DispatchCommand, forwardedArgs: rest };
  }

  return {
    kind: "error",
    exitCode: 1,
    message: `Unknown command: ${command}\nRun 'afergon-ai --help' for usage.`,
  };
}
