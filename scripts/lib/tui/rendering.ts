/** Typed mirror of the authoritative runtime rendering helper. */
export function renderFocusLine(content: string, isFocused: boolean | undefined): string {
  return `${isFocused ? ">" : " "} ${content}`;
}
