import { describe, expect, it } from "vitest";

import { renderFocusLine } from "../scripts/lib/tui/rendering.mjs";

describe("renderFocusLine", () => {
  it("renders a focused row with the cursor prefix", () => {
    expect(renderFocusLine("Configuration", true)).toBe("> Configuration");
  });

  it("reserves the cursor column for an unfocused row", () => {
    expect(renderFocusLine("Configuration", false)).toBe("  Configuration");
  });
});
