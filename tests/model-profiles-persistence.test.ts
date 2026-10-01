import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { loadProfileDocument } from "../scripts/lib/model-profiles/infrastructure/profile-store.js";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function createConfig(document: unknown, contents = JSON.stringify(document)) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-profile-store-"));
  tempRoots.push(root);
  const configPath = path.join(root, "config.json");
  fs.writeFileSync(configPath, contents);
  return { root, configPath };
}

function createConfigDirectory() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-profile-store-"));
  tempRoots.push(root);
  return { root, configPath: path.join(root, "config.json") };
}

describe("mixed profile storage reads", () => {
  it("reads mixed assignments without rewriting the document or its version", () => {
    const document = {
      version: 1,
      models: {
        activeProfile: "work",
        profiles: {
          work: {
          "afergon-ai": "openai/gpt-5.5",
            "afg-review": { reasoningEffort: "medium", note: { keep: true } },
            "afg-specify": {},
            "afg-implement": { model: " inherit ", reasoningEffort: " Medium " },
            "foreign-agent": { model: null, reasoningEffort: "inherit" },
          },
        },
      },
    };
    const originalBytes = `${JSON.stringify(document, null, 2)}\n`;
    const { root, configPath } = createConfig(document, originalBytes);

    const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });

    expect(loaded).toEqual({ document, configPath, exists: true, originalBytes });
    expect(fs.readFileSync(configPath, "utf8")).toBe(originalBytes);
    expect(fs.existsSync(path.join(root, "config.json.pre-v2.bak"))).toBe(false);
  });

  it("accepts structured assignments with neither a model nor an effort override", () => {
    const document = { version: 1, models: { activeProfile: "work", profiles: { work: { "afg-specify": {} } } } };
    const { root } = createConfig(document);

    expect(loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root }).document).toEqual(document);
  });

  it.each(["", " InHerit ", 4, []])("rejects invalid effort representations %j", (reasoningEffort) => {
    const { root } = createConfig({ models: { profiles: { work: { "afg-review": { reasoningEffort } } } } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow(
      'models.profiles.work["afg-review"].reasoningEffort',
    );
  });

  it("preserves an unknown future schema version on read", () => {
    const document = { version: 3, models: { activeProfile: null, profiles: {} }, futureField: true };
    const { root } = createConfig(document);

    expect(loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root }).document).toEqual(document);
  });

  it("rejects a non-object config root with a repairable path error", () => {
    const { root } = createConfig([], "[]");

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow("root value must be an object");
  });

  it("rejects a malformed models container with its document path", () => {
    const { root } = createConfig({ version: 1, models: null });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow("models must be an object");
  });

  it("preserves an existing document with omitted optional model containers", () => {
    const document = { version: 1, foreign: { retain: true } };
    const { root } = createConfig(document);

    expect(loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root }).document).toEqual(document);
  });

  it("rejects a malformed profiles container instead of treating it as empty", () => {
    const { root } = createConfig({ models: { profiles: [] } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow("models.profiles must be an object");
  });

  it("rejects a non-object profile at that profile's path", () => {
    const { root } = createConfig({ models: { profiles: { work: null } } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow("models.profiles.work must be an object");
  });

  it("rejects an invalid active profile shape", () => {
    const { root } = createConfig({ models: { activeProfile: [], profiles: {} } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow("models.activeProfile must be a string or null");
  });

  it("rejects an active profile reference that is not present in the document", () => {
    const { root } = createConfig({ models: { activeProfile: "missing", profiles: {} } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow("models.activeProfile 'missing' does not exist");
  });

  it("rejects an invalid schema version with its document path", () => {
    const { root } = createConfig({ version: 0, models: { profiles: {} } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow("version must be a positive safe integer");
  });

  it("quotes original profile keys in malformed assignment paths", () => {
    const { root } = createConfig({ models: { profiles: { "bad.name": { "afg-review": { model: 1 } } } } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow(
      'models.profiles["bad.name"]["afg-review"].model',
    );
  });

  it("rejects a null effort override with its profile assignment path", () => {
    const { root } = createConfig({ version: 1, models: { activeProfile: "work", profiles: { work: { "afg-review": { reasoningEffort: null } } } } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow(
      'models.profiles.work["afg-review"].reasoningEffort',
    );
  });

  it("rejects a malformed model with its profile assignment path", () => {
    const { root } = createConfig({ version: 1, models: { activeProfile: "work", profiles: { work: { "afg-review": { model: 42 } } } } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow(
      'models.profiles.work["afg-review"].model',
    );
  });

  it("rejects a non-string legacy assignment with its original path", () => {
    const { root } = createConfig({ models: { profiles: { work: { "afg-review": 42 } } } });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow(
      'models.profiles.work["afg-review"]',
    );
  });

  it("returns the in-memory default for a missing config without creating the file", () => {
    const { root, configPath } = createConfigDirectory();

    const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });

    expect(loaded).toEqual({
      document: { version: 1, models: { activeProfile: null, profiles: {} } },
      configPath,
      exists: false,
    });
    expect(fs.existsSync(configPath)).toBe(false);
  });
});
