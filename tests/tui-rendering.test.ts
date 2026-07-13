// This parity suite retains imports of the authoritative MJS runtime during Phase 2.
// @ts-nocheck
import { describe, expect, it } from "vitest";

import * as renderingTypeScript from "../scripts/lib/tui/rendering.ts";
import { renderFocusLine } from "../scripts/lib/tui/rendering.mjs";

describe("renderFocusLine", () => {
  it("keeps the TypeScript public surface in parity with the runtime MJS helper", () => {
    expect(Object.keys(renderingTypeScript).sort()).toEqual(["renderFocusLine"]);
  });

  it("renders focused and unfocused content in MJS and TypeScript parity", () => {
    for (const [content, isFocused, expected] of [
      ["Configuration", true, "> Configuration"],
      ["Status", false, "  Status"],
      ["", false, "  "],
    ]) {
      expect(renderFocusLine(content, isFocused)).toBe(expected);
      expect(renderingTypeScript.renderFocusLine(content, isFocused)).toBe(expected);
      expect(renderingTypeScript.renderFocusLine(content, isFocused)).toBe(renderFocusLine(content, isFocused));
    }
  });
});
