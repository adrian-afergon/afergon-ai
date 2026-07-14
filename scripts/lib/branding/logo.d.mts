export interface BrandingLogo {
  readonly lines: readonly string[];
  readonly tagline: string;
  readonly fallbackTitle: string;
  readonly fallbackCopy: string;
}

export type BrandingVariant = "default";

export const BRANDING_LOGO: Readonly<BrandingLogo>;

export function getBrandingLines(variant?: string): string[] | undefined;

export function canRenderBrandingLogo(width: number | undefined, variant?: string): boolean;
