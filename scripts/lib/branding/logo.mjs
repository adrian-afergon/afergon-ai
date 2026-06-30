const CANONICAL_LOGO_LINES = Object.freeze([
  " █████╗  ███████╗ ███████╗ ██████╗   ██████╗   ██████╗  ███╗   ██╗  ·   █████╗  ██╗",
  "██╔══██╗ ██╔════╝ ██╔════╝ ██╔══██╗ ██╔════╝  ██╔═══██╗ ████╗  ██║     ██╔══██╗ ██║",
  "███████║ █████╗   █████╗   ██████╔╝ ██║  ███╗ ██║   ██║ ██╔██╗ ██║     ███████║ ██║",
  "██╔══██║ ██╔══╝   ██╔══╝   ██╔══██╗ ██║   ██║ ██║   ██║ ██║╚██╗██║     ██╔══██║ ██║",
  "██║  ██║ ██║      ███████╗ ██║  ██║ ╚██████╔╝ ╚██████╔╝ ██║ ╚████║     ██║  ██║ ██║",
  "╚═╝  ╚═╝ ╚═╝      ╚══════╝ ╚═╝  ╚═╝  ╚═════╝   ╚═════╝  ╚═╝  ╚═══╝     ╚═╝  ╚═╝ ╚═╝",
]);

export const BRANDING_LOGO = Object.freeze({
  lines: CANONICAL_LOGO_LINES,
  tagline: "debate  ·  specify  ·  implement  ·  review",
  fallbackTitle: "AFERGON-AI",
  fallbackCopy: "debate · specify · implement · review",
});

export function getBrandingLines(variant = "default") {
  if (variant === "default" || typeof variant === "undefined") {
    return [...BRANDING_LOGO.lines];
  }

  return undefined;
}

export function canRenderBrandingLogo(width, variant = "default") {
  const lines = getBrandingLines(variant);

  if (!lines) {
    return false;
  }

  const widestLine = lines.reduce((maxWidth, line) => Math.max(maxWidth, line.length), 0);

  return typeof width !== "number" || width >= widestLine;
}
