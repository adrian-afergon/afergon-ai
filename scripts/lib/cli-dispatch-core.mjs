const EXPLICIT_COMMANDS = new Set(["init", "doctor", "update", "models"]);

export function formatHelp() {
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

export function resolveDispatchPlan({ argv, isInteractiveTTY, isCI }) {
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

  if (EXPLICIT_COMMANDS.has(normalized)) {
    return { kind: "command", command: normalized, forwardedArgs: rest };
  }

  return {
    kind: "error",
    exitCode: 1,
    message: `Unknown command: ${command}\nRun 'afergon-ai --help' for usage.`,
  };
}
