import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import * as brandingLogoTypeScript from "../scripts/lib/branding/logo.ts";
import {
  BRANDING_LOGO,
  canRenderBrandingLogo,
  getBrandingLines,
} from "../scripts/lib/branding/logo.mjs";
import { createNavigationState } from "../scripts/lib/tui/navigation.mjs";
import { renderHomeScreen } from "../scripts/tui.mjs";
import startupBannerExtension, {
  STARTUP_BANNER_BRANDING,
} from "../extensions/startup-banner.ts";

function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

function renderStartupBanner(width) {
  vi.useFakeTimers();

  try {
    let sessionStartHandler;
    let headerFactory;

    const pi = {
      getCommands() {
        return [];
      },
      on(event, handler) {
        if (event === "session_start") {
          sessionStartHandler = handler;
        }
      },
    };

    startupBannerExtension(pi);

    sessionStartHandler?.({}, {
      hasUI: true,
      cwd: process.cwd(),
      ui: {
        setHeader(factory) {
          headerFactory = factory;
        },
      },
    });

    expect(headerFactory).toBeTypeOf("function");

    const header = headerFactory(
      {
        requestRender() {},
      },
      {},
    );

    vi.advanceTimersByTime(80);

    return header.render(width).map(stripAnsi);
  } finally {
    vi.useRealTimers();
  }
}

describe("branding logo contract", () => {
  it("keeps the TypeScript branding module in parity with the runtime .mjs module", () => {
    expect(brandingLogoTypeScript.BRANDING_LOGO).toEqual(BRANDING_LOGO);
    expect(brandingLogoTypeScript.getBrandingLines()).toEqual(getBrandingLines());
    expect(brandingLogoTypeScript.getBrandingLines("default")).toEqual(getBrandingLines("default"));
    expect(brandingLogoTypeScript.getBrandingLines("ascii")).toEqual(getBrandingLines("ascii"));
    expect(brandingLogoTypeScript.canRenderBrandingLogo(120)).toBe(canRenderBrandingLogo(120));
    expect(brandingLogoTypeScript.canRenderBrandingLogo(60)).toBe(canRenderBrandingLogo(60));
  });

  it("exposes the canonical AFERGON-AI artwork, tagline, and plain-text fallback copy", () => {
    expect(BRANDING_LOGO).toEqual({
      lines: [
        " █████╗  ███████╗ ███████╗ ██████╗   ██████╗   ██████╗  ███╗   ██╗  ·   █████╗  ██╗",
        "██╔══██╗ ██╔════╝ ██╔════╝ ██╔══██╗ ██╔════╝  ██╔═══██╗ ████╗  ██║     ██╔══██╗ ██║",
        "███████║ █████╗   █████╗   ██████╔╝ ██║  ███╗ ██║   ██║ ██╔██╗ ██║     ███████║ ██║",
        "██╔══██║ ██╔══╝   ██╔══╝   ██╔══██╗ ██║   ██║ ██║   ██║ ██║╚██╗██║     ██╔══██║ ██║",
        "██║  ██║ ██║      ███████╗ ██║  ██║ ╚██████╔╝ ╚██████╔╝ ██║ ╚████║     ██║  ██║ ██║",
        "╚═╝  ╚═╝ ╚═╝      ╚══════╝ ╚═╝  ╚═╝  ╚═════╝   ╚═════╝  ╚═╝  ╚═══╝     ╚═╝  ╚═╝ ╚═╝",
      ],
      tagline: "debate  ·  specify  ·  implement  ·  review",
      fallbackTitle: "AFERGON-AI",
      fallbackCopy: "debate · specify · implement · review",
    });
  });

  it("supports explicit variant lookup without inventing nonexistent artwork", () => {
    expect(getBrandingLines()).toEqual(BRANDING_LOGO.lines);
    expect(getBrandingLines("default")).toEqual(BRANDING_LOGO.lines);
    expect(getBrandingLines("ascii")).toBeUndefined();
  });

  it("treats narrow widths as unsafe for the canonical banner", () => {
    expect(canRenderBrandingLogo(120)).toBe(true);
    expect(canRenderBrandingLogo(60)).toBe(false);
  });
});

describe("startup banner and TUI home branding", () => {
  it("imports the runtime branding .mjs module instead of a non-emitted .js artifact", () => {
    const startupBannerSource = readFileSync(new URL("../extensions/startup-banner.ts", import.meta.url), "utf8");

    expect(startupBannerSource).toContain('../scripts/lib/branding/logo.mjs');
    expect(startupBannerSource).not.toContain('../scripts/lib/branding/logo.js');
  });

  it("reuses the shared branding source in the startup banner", () => {
    expect(STARTUP_BANNER_BRANDING).toBe(BRANDING_LOGO);
  });

  it("renders the shared startup banner output when the viewport can fit it", () => {
    const lines = renderStartupBanner(120);

    expect(lines.some((line) => line.includes(BRANDING_LOGO.lines[0]))).toBe(true);
    expect(lines.some((line) => line.includes(BRANDING_LOGO.tagline))).toBe(true);
  });

  it("renders plain-text startup branding when the full banner is unsafe to fit", () => {
    const lines = renderStartupBanner(60);

    expect(lines.some((line) => line.includes(BRANDING_LOGO.fallbackTitle))).toBe(true);
    expect(lines.some((line) => line.includes(BRANDING_LOGO.fallbackCopy))).toBe(true);
    expect(lines.some((line) => line.includes(BRANDING_LOGO.lines[0]))).toBe(false);
  });

  it("renders the shared banner on Home when the terminal can fit it", () => {
    const lines = renderHomeScreen(createNavigationState(), 120);

    expect(lines.some((line) => line.includes(BRANDING_LOGO.lines[0]))).toBe(true);
    expect(lines.some((line) => line.includes(BRANDING_LOGO.tagline))).toBe(true);
    expect(lines.some((line) => stripAnsi(line).includes("┌ Home"))).toBe(true);
  });

  it("renders the Home banner and selected route with additive teal styling while preserving text cues", () => {
    const lines = renderHomeScreen(createNavigationState(), 120);

    expect(lines.some((line) => line.includes("\u001b[38;5;6m") && line.includes(BRANDING_LOGO.lines[0]))).toBe(true);
    expect(lines.some((line) => line.includes("\u001b[38;5;6m") && line.includes(BRANDING_LOGO.lines.at(-1)))).toBe(true);
    expect(lines.some((line) => line.includes("\u001b[38;5;6m") && stripAnsi(line).includes("> Configuration"))).toBe(true);
    expect(lines.some((line) => line.includes("\u001b[38;5;6m") && line.includes(BRANDING_LOGO.tagline))).toBe(true);
    expect(lines.some((line) => line.includes("\u001b[38;5;6mC\u001b[0m") && stripAnsi(line).includes("Press (C)onfiguracion | (S)tatus | (M)odels"))).toBe(true);
    expect(lines.some((line) => stripAnsi(line).includes("Press Configuracion | Status | Models"))).toBe(false);
  });

  it("moves the navigation help into the frame footer and removes the redundant route label", () => {
    const lines = renderHomeScreen(createNavigationState(), 120);
    const strippedLines = lines.map(stripAnsi);

    expect(strippedLines).not.toContain("Current route: home");
    expect(strippedLines.at(-1)).toContain("└ ↑/↓ move ");
    expect(strippedLines.at(-1)).toContain(" Press q or Esc to exit ");
    expect(strippedLines.some((line) => line.includes("Press (C)onfiguracion | (S)tatus | (M)odels"))).toBe(true);
    expect(strippedLines.some((line) => line.includes("Press h to return Home from any section."))).toBe(false);
  });

  it("centers the Home banner and subtitle without leaving a blank separator row between them", () => {
    const lines = renderHomeScreen(createNavigationState(), 120).map(stripAnsi);
    const logoStartIndex = lines.findIndex((line) => line.includes(BRANDING_LOGO.lines[0]));
    const taglineIndex = lines.findIndex((line) => line.includes(BRANDING_LOGO.tagline));

    expect(logoStartIndex).toBeGreaterThanOrEqual(0);
    expect(taglineIndex).toBe(logoStartIndex + BRANDING_LOGO.lines.length);
    expect(lines[logoStartIndex + BRANDING_LOGO.lines.length - 1].includes(BRANDING_LOGO.lines.at(-1))).toBe(true);
    expect(lines[taglineIndex]).toMatch(/^│\s+debate  ·  specify  ·  implement  ·  review\s+$/);
    expect(lines[taglineIndex]).not.toBe(`│ ${BRANDING_LOGO.tagline}`);
  });

  it("falls back to plain-text branding when the full banner is unsafe to render", () => {
    const lines = renderHomeScreen(createNavigationState(), 60);
    const strippedLines = lines.map(stripAnsi);

    expect(strippedLines.some((line) => line.includes("AFERGON-AI"))).toBe(true);
    expect(strippedLines.some((line) => line.includes("debate · specify · implement · review"))).toBe(true);
    expect(lines.some((line) => line.includes(BRANDING_LOGO.lines[0]))).toBe(false);
    expect(strippedLines.at(-1)).toContain("Press q or Esc to exit");
  });
});
