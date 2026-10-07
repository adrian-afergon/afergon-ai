import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadProfileDocument } from "../scripts/lib/model-profiles/infrastructure/profile-store.js";
import { validateProfileDocument } from "../scripts/lib/model-profiles/infrastructure/document-validation.js";

const tempRoots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function createConfig(document?: unknown, contents = JSON.stringify(document)) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "afergon-profile-store-"));
  tempRoots.push(root);
  const configPath = path.join(root, "config.json");
  if (contents !== undefined) fs.writeFileSync(configPath, contents);
  return { root, configPath };
}

function loadDocument(document: unknown) {
  const { root } = createConfig(document);
  return loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });
}

function expectInvalidRead(document: unknown, expectedPath: string) {
  expect(() => loadDocument(document)).toThrow(expectedPath);
}

const invalidReads: Array<[string, unknown, string]> = [
  ["non-object root", [], "root value must be an object"],
  ["models container", { version: 1, models: null }, "models must be an object"],
  ["profiles container", { models: { profiles: [] } }, "models.profiles must be an object"],
  ["profile value", { models: { profiles: { work: null } } }, "models.profiles.work must be an object"],
  ["active profile shape", { models: { activeProfile: [], profiles: {} } }, "models.activeProfile must be a string or null"],
  ["dangling active profile", { models: { activeProfile: "missing", profiles: {} } }, "models.activeProfile 'missing' does not exist"],
  ["invalid version", { version: 0, models: { profiles: {} } }, "version must be a positive safe integer"],
  ["unsafe version", { version: Number.MAX_SAFE_INTEGER + 1, models: { profiles: {} } }, "version must be a positive safe integer"],
  ["escaped quote/backslash keys", { models: { profiles: { ['bad.name"\\folder']: { " afg-review ": { model: 1 } } } } }, `models.profiles[${JSON.stringify('bad.name"\\folder')}][${JSON.stringify(" afg-review ")}].model`],
  ["empty model", { models: { profiles: { work: { "afg-review": "" } } } }, 'models.profiles.work["afg-review"]'],
  ["structured model", { models: { profiles: { work: { "afg-review": { model: 42 } } } } }, 'models.profiles.work["afg-review"].model'],
  ["legacy assignment", { models: { profiles: { work: { "afg-review": 42 } } } }, 'models.profiles.work["afg-review"]'],
  ["null assignment", { models: { profiles: { work: { "afg-review": null } } } }, 'models.profiles.work["afg-review"]'],
  ["array assignment", { models: { profiles: { work: { "afg-review": [] } } } }, 'models.profiles.work["afg-review"]'],
];

const readableDocuments: Array<[string, Record<string, unknown>]> = [
  ["structured inheritance", { version: 1, models: { activeProfile: "work", profiles: { work: { "afg-specify": {} } } } }],
  ["future schema", { version: 3, models: { activeProfile: null, profiles: {} }, futureField: true }],
  ["legacy omitted containers", { version: 1, foreign: { retain: true } }],
  ["prototype-like profile and opaque foreign agent", JSON.parse('{"version":9007199254740991,"models":{"activeProfile":"__proto__","profiles":{"__proto__":{"afg-review":"inherit","constructor":{"model":null}}}}}')],
  ["structured model only", { version: 1, models: { profiles: { work: { "afg-review": { model: "openai/gpt-5.5" } } } } }],
];

async function importBuiltReader() {
  const entry = path.resolve(import.meta.dirname, "../dist/scripts/lib/model-profiles/infrastructure/profile-store.js");
  expect(fs.existsSync(entry)).toBe(true);
  return import(pathToFileURL(entry).href);
}

describe("mixed profile storage reads", () => {
  it("captures exact UTF-8 bytes and original formatting", () => {
    const contents = '{\n  "version": 1,\n  "memo": "café ☕",\n  "models": {"profiles": {}}\n}\n';
    const { root } = createConfig({}, contents);
    const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });

    expect(loaded.sourceBytes).toEqual(Buffer.from(contents, "utf8"));
    expect(loaded.originalBytes).toBe(contents);
  });

  it("propagates a permission read fault instead of returning missing-file defaults", () => {
    const { root, configPath } = createConfig({ models: { profiles: {} } });
    const failure = Object.assign(new Error("permission denied"), { code: "EACCES" });
    const readFileSync = fs.readFileSync.bind(fs);
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    vi.spyOn(fs, "readFileSync").mockImplementation((filePath, ...args) => {
      if (filePath === configPath) throw failure;
      return readFileSync(filePath, ...args);
    });

    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow(failure);
  });

  it("retains mixed raw assignments and does not rewrite or migrate", () => {
    const document = {
      version: 1,
      models: { activeProfile: "work", profiles: { work: {
        "afergon-ai": "openai/gpt-5.5",
        "afg-review": { reasoningEffort: "medium", note: { keep: true } },
        "afg-specify": {},
        "afg-implement": { model: " inherit ", reasoningEffort: " Medium " },
        "foreign-agent": { model: null, reasoningEffort: "inherit" },
      } } },
    };
    const originalBytes = `${JSON.stringify(document, null, 2)}\n`;
    const { root, configPath } = createConfig(document, originalBytes);
    const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });

    expect(loaded).toEqual({ document, configPath, exists: true, originalBytes, sourceBytes: Buffer.from(originalBytes) });
    expect(fs.readFileSync(configPath, "utf8")).toBe(originalBytes);
    expect(fs.existsSync(path.join(root, "config.json.pre-v2.bak"))).toBe(false);
  });

  it.each([null, "", "  ", " InHerit ", 4, []])("rejects invalid effort %j at its source path", (reasoningEffort) => {
    const { root } = createConfig({ models: { profiles: { work: { "afg-review": { reasoningEffort } } } } });
    expect(() => loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root })).toThrow(
      'models.profiles.work["afg-review"].reasoningEffort',
    );
  });

  it.each(readableDocuments)("preserves %s on read", (_name, document) => {
    expect(loadDocument(document).document).toEqual(document);
  });

  it.each(invalidReads)("rejects %s with the original path", (_name, document, expectedPath) => {
    expectInvalidRead(document, expectedPath);
  });

  it("returns absent-source defaults without creating a file", () => {
    const { root, configPath } = createConfig();
    const loaded = loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root });

    expect(loaded.document).toEqual({ version: 1, models: { activeProfile: null, profiles: {} } });
    expect(loaded).toMatchObject({ configPath, exists: false });
    expect(fs.existsSync(configPath)).toBe(false);
  });
});

describe("pure document validation", () => {
  it("rejects own undefined recognized fields before cloning", () => {
    const ownUndefined = { models: { profiles: { work: { "afg-review": { reasoningEffort: undefined } } } } };
    expect(() => validateProfileDocument(ownUndefined, "/tmp/config.json")).toThrow(
      'models.profiles.work["afg-review"].reasoningEffort',
    );
  });

  it("validates malformed recognized assignments in inactive profiles", () => {
    const inactiveInvalid = { models: { activeProfile: "active", profiles: { active: {}, archived: { "afg-review": { model: " " } } } } };
    expect(() => validateProfileDocument(inactiveInvalid, "/tmp/config.json")).toThrow(
      'models.profiles.archived["afg-review"].model',
    );
  });

  it("returns the original object and leaves opaque foreign fields untouched", () => {
    const document = { version: 3, models: { profiles: { work: { foreign: { reasoningEffort: null }, "afg-review": "inherit" } } } };
    expect(validateProfileDocument(document, "/tmp/config.json")).toBe(document);
  });
});

describe("compiled inactive boundary", () => {
  it("emits a directly importable reader module", async () => {
    const built = await importBuiltReader();
    expect(typeof built.loadProfileDocument).toBe("function");
  });

  it("keeps a built missing-file read side-effect free", async () => {
    const built = await importBuiltReader();
    const { root, configPath } = createConfig();

    expect(built.loadProfileDocument({ AFERGON_AI_CONFIG_DIR: root }).exists).toBe(false);
    expect(fs.existsSync(configPath)).toBe(false);
  });

  it("does not export the standalone reader through the live facade", async () => {
    const live = await import("../scripts/lib/model-profiles.js");
    expect(Object.hasOwn(live, "loadProfileDocument")).toBe(false);
  });
});
