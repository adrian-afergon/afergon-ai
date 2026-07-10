import { describe, expect, it } from "vitest";

import * as commandManifestTypeScript from "../scripts/lib/tui/command-manifest.ts";
import {
  COMMAND_MANIFEST,
  getCommandManifest,
  getCommandManifestEntry,
} from "../scripts/lib/tui/command-manifest.mjs";

describe("COMMAND_MANIFEST", () => {
  it("keeps the TypeScript command manifest in parity with the runtime .mjs module", () => {
    expect(commandManifestTypeScript.COMMAND_MANIFEST).toEqual(COMMAND_MANIFEST);
    expect(commandManifestTypeScript.getCommandManifest()).toEqual(getCommandManifest());
    expect(commandManifestTypeScript.getCommandManifestEntry("doctor")).toEqual(getCommandManifestEntry("doctor"));
    expect(commandManifestTypeScript.getCommandManifestEntry("configuration")).toEqual(getCommandManifestEntry("configuration"));
    expect(commandManifestTypeScript.buildCommandArgv("models", ["profile", "list"])).toEqual(
      getCommandManifestEntry("models").argv.concat(["profile", "list"]),
    );
  });

  it("exposes only the stable CLI-equivalent commands for this MVP slice", () => {
    expect(COMMAND_MANIFEST).toEqual([
      { id: "init", label: "afergon-ai init", argv: ["init"] },
      { id: "doctor", label: "afergon-ai doctor", argv: ["doctor"] },
      { id: "update", label: "afergon-ai update", argv: ["update"] },
      { id: "models", label: "afergon-ai models", argv: ["models"] },
    ]);
  });

  it("does not fabricate commands outside the explicit dispatcher contract", () => {
    const manifestIds = COMMAND_MANIFEST.map((entry) => entry.id);

    expect(manifestIds).toEqual(["init", "doctor", "update", "models"]);
    expect(manifestIds).not.toContain("configuration");
    expect(manifestIds).not.toContain("status");
    expect(manifestIds).not.toContain("model-profiles");
    expect(manifestIds).not.toContain("telemetry");
  });

  it("deep-freezes exported entries so nested argv cannot mutate the shared manifest", () => {
    expect(() => COMMAND_MANIFEST[0].argv.push("--mutated")).toThrow(TypeError);

    expect(COMMAND_MANIFEST[0]).toEqual({
      id: "init",
      label: "afergon-ai init",
      argv: ["init"],
    });
  });
});

describe("command manifest accessors", () => {
  it("returns a copy of the manifest so callers cannot mutate the shared contract", () => {
    const manifest = getCommandManifest();

    expect(() => {
      manifest[0].label = "mutated";
    }).toThrow(TypeError);
    expect(() => {
      manifest.push({ id: "fake", label: "fake", argv: ["fake"] });
    }).toThrow(TypeError);

    expect(getCommandManifest()).toEqual(COMMAND_MANIFEST);
  });

  it("returns deep-frozen manifest copies so nested argv mutation cannot poison later reads", () => {
    const manifest = getCommandManifest();

    expect(() => manifest[0].argv.push("--mutated")).toThrow(TypeError);
    expect(() => {
      manifest[0].label = "mutated";
    }).toThrow(TypeError);

    expect(getCommandManifest()).toEqual(COMMAND_MANIFEST);
  });

  it("looks up stable entries by id and returns undefined for unknown actions", () => {
    expect(getCommandManifestEntry("doctor")).toEqual({
      id: "doctor",
      label: "afergon-ai doctor",
      argv: ["doctor"],
    });

    expect(getCommandManifestEntry("configuration")).toBeUndefined();
  });

  it("returns deep-frozen entry copies so nested argv mutation cannot poison shared state", () => {
    const entry = getCommandManifestEntry("doctor");

    expect(() => entry.argv.push("--mutated")).toThrow(TypeError);
    expect(() => {
      entry.label = "mutated";
    }).toThrow(TypeError);

    expect(getCommandManifestEntry("doctor")).toEqual({
      id: "doctor",
      label: "afergon-ai doctor",
      argv: ["doctor"],
    });
  });
});
