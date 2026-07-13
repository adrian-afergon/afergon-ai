import { describe, expect, it } from "vitest";
import { createGitCommandArgs } from "../extensions/startup-banner.js";

describe("startup banner git commands", () => {
  it("keeps an untrusted working directory as one git argv value", () => {
    const cwd = '/tmp/project"; touch injected';

    expect(createGitCommandArgs(cwd, ["status", "--porcelain"])).toEqual([
      "-C",
      cwd,
      "status",
      "--porcelain",
    ]);
  });
});
