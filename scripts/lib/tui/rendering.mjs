export function renderFocusLine(content, isFocused) {
  return `${isFocused ? ">" : " "} ${content}`;
}
