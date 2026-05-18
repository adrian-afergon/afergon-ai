import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// ── ASCII logo ─────────────────────────────────────────────────────────────

const LOGO = [
  " ██████╗  ████████╗███████╗██████╗  ██████╗  ███╗  ██╗  ·  ██████╗ ██╗",
  "██╔══██╗  ██╔════╝██╔════╝██╔══██╗██╔════╝  ████╗ ██║    ██╔══██╗██║",
  "███████║  █████╗  █████╗  ██████╔╝██║  ███╗ ██╔██╗██║    ███████║██║",
  "██╔══██║  ██╔══╝  ██╔══╝  ██╔══██╗██║   ██║ ██║╚████║    ██╔══██║██║",
  "██║  ██║  ██║     ██║     ██║  ██║╚██████╔╝ ██║ ╚███║    ██║  ██║██║",
  "╚═╝  ╚═╝  ╚═╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═╝  ╚══╝    ╚═╝  ╚═╝╚═╝",
];

const TAGLINE = "debate  ·  specify  ·  implement  ·  review";

// ── Color helpers ──────────────────────────────────────────────────────────

function rgb(r: number, g: number, b: number, text: string): string {
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
}

// Teal palette — distinct from gentle-pi's pink
function teal(shade: "bright" | "mid" | "dim" | "dark", text: string): string {
  const map = {
    bright: [0, 229, 255],
    mid:    [0, 188, 212],
    dim:    [0, 131, 143],
    dark:   [0,  60,  70],
  } as const;
  const [r, g, b] = map[shade];
  return rgb(r, g, b, text);
}

function fadeRgb(r: number, g: number, b: number, opacity: number, text: string): string {
  return rgb(
    Math.round(r * opacity),
    Math.round(g * opacity),
    Math.round(b * opacity),
    text,
  );
}

// ── Layout helpers ─────────────────────────────────────────────────────────

function visibleLength(s: string): number {
  return s.replace(/\x1b\[[^m]*m/g, "").length;
}

function centerLine(text: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - visibleLength(text)) / 2));
  return " ".repeat(pad) + text;
}

function rule(width: number, opacity: number): string {
  const char = "─";
  const inner = Math.max(0, width - 4);
  return fadeRgb(0, 60, 70, opacity, "  " + char.repeat(inner) + "  ");
}

function statLine(label: string, value: string, opacity: number): string {
  const l = fadeRgb(0, 131, 143, opacity, label + " ");
  const v = fadeRgb(176, 224, 230, opacity, value);
  return l + v;
}

// ── Extension ──────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    if (!ctx.hasUI) return;

    // Skip on CLI subcommands (pi install, pi update, etc.)
    const isCLI =
      process.argv.length > 2 &&
      !process.argv.every((a) => a.startsWith("-") || a.endsWith(".ts"));
    if (isCLI) return;

    const cols = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 24;
    if (cols < 60 || rows < 14) return;

    // Async project info (best-effort, updates on next render tick)
    let gitBranch = "…";
    let gitStatus = "";
    execAsync(`git -C "${ctx.cwd}" branch --show-current`)
      .then(({ stdout }) => { gitBranch = stdout.trim() || "detached"; })
      .catch(() => { gitBranch = "not a git repo"; });
    execAsync(`git -C "${ctx.cwd}" status --porcelain`)
      .then(({ stdout }) => {
        const n = stdout.trim().split("\n").filter(Boolean).length;
        gitStatus = n > 0 ? ` · ${n} change(s)` : " · clean";
      })
      .catch(() => {});

    const skills = pi.getCommands().filter((c) => c.source === "skill");

    // Fade-in state
    let tick = 0;
    const FADE_IN = 20;
    let timer: NodeJS.Timeout | null = null;

    const stopTimer = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    ctx.ui.setHeader((tui, _theme) => {
      stopTimer();

      timer = setInterval(() => {
        tick++;
        if (tick > FADE_IN + 5) { stopTimer(); return; }
        try { tui.requestRender(); } catch { stopTimer(); }
      }, 40);

      return {
        render(width: number): string[] {
          const opacity = Math.min(1, tick / FADE_IN);
          if (opacity < 0.05) return [];

          // Logo row colors: bright top → dark bottom
          const shades: Array<"bright" | "mid" | "dim" | "dark"> = [
            "bright", "bright", "mid", "mid", "dim", "dark",
          ];

          const out: string[] = [""];

          for (let i = 0; i < LOGO.length; i++) {
            const [r, g, b] = { bright: [0, 229, 255], mid: [0, 188, 212], dim: [0, 131, 143], dark: [0, 60, 70] }[shades[i]!] as [number, number, number];
            const line = fadeRgb(r, g, b, opacity, LOGO[i]!);
            out.push(truncateToWidth(centerLine(line, width), width, ""));
          }

          out.push("");

          const tagline = fadeRgb(0, 188, 212, opacity * 0.8, TAGLINE);
          out.push(truncateToWidth(centerLine(tagline, width), width, ""));

          out.push("");
          out.push(truncateToWidth(rule(width, opacity), width, ""));
          out.push("");

          // Stats
          const path = ctx.cwd.length > 50 ? "…" + ctx.cwd.slice(-49) : ctx.cwd;
          const branch = gitBranch + gitStatus;

          if (width >= 90) {
            const left  = statLine("GIT", branch, opacity);
            const right = statLine("SKILLS", `${skills.length} loaded`, opacity);
            const gap   = Math.max(4, width - 4 - visibleLength("GIT " + branch) - visibleLength("SKILLS " + `${skills.length} loaded`));
            out.push(truncateToWidth(
              "  " + left + " ".repeat(Math.floor(gap / 2)) + right,
              width, "",
            ));
          } else {
            out.push(truncateToWidth("  " + statLine("GIT", branch, opacity), width, ""));
          }

          out.push(truncateToWidth("  " + statLine("PATH", path, opacity), width, ""));
          out.push("");

          return out.map((l) => truncateToWidth(l, Math.max(1, width), ""));
        },

        invalidate() { stopTimer(); },
      };
    });
  });
}
