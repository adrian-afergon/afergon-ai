export interface BrandingLogo {
  readonly lines: readonly string[];
  readonly tagline: string;
  readonly fallbackTitle: string;
  readonly fallbackCopy: string;
}

export type BrandingVariant = "default";

const CANONICAL_LOGO_LINES = Object.freeze([
  " █████╗  ███████╗ ███████╗ ██████╗   ██████╗   ██████╗  ███╗   ██╗  ·   █████╗  ██╗",
  "██╔══██╗ ██╔════╝ ██╔════╝ ██╔══██╗ ██╔════╝  ██╔═══██╗ ████╗  ██║     ██╔══██╗ ██║",
  "███████║ █████╗   █████╗   ██████╔╝ ██║  ███╗ ██║   ██║ ██╔██╗ ██║     ███████║ ██║",
  "██╔══██║ ██╔══╝   ██╔══╝   ██╔══██╗ ██║   ██║ ██║   ██║ ██║╚██╗██║     ██╔══██║ ██║",
  "██║  ██║ ██║      ███████╗ ██║  ██║ ╚██████╔╝ ╚██████╔╝ ██║ ╚████║     ██║  ██║ ██║",
  "╚═╝  ╚═╝ ╚═╝      ╚══════╝ ╚═╝  ╚═╝  ╚═════╝   ╚═════╝  ╚═╝  ╚═══╝     ╚═╝  ╚═╝ ╚═╝",
]) as readonly string[];

export const BRANDING_LOGO: Readonly<BrandingLogo> = Object.freeze({
  lines: CANONICAL_LOGO_LINES,
  tagline: "debate  ·  specify  ·  implement  ·  review",
  fallbackTitle: "AFERGON-AI",
  fallbackCopy: "debate · specify · implement · review",
});

export function getBrandingLines(variant: string = "default"): string[] | undefined {
  if (variant === "default") {
    return [...BRANDING_LOGO.lines];
  }

  return undefined;
}

export function canRenderBrandingLogo(width: number | undefined, variant: string = "default"): boolean {
  const lines = getBrandingLines(variant);

  if (!lines) {
    return false;
  }

  const widestLine = lines.reduce((maxWidth, line) => Math.max(maxWidth, line.length), 0);

  return typeof width !== "number" || width >= widestLine;
}
