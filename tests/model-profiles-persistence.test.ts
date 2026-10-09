import fs from "node:fs";
import ts from "typescript";
import { expect, it, vi } from "vitest";
import { AgentTargetPolicy, SUPPORTED_AGENTS as DOMAIN_AGENTS, type SupportedAgent as DomainAgent } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { normalizeAgentName, SUPPORTED_AGENTS, type SupportedAgent } from "../scripts/lib/model-profiles-core.js";
import { StoredAssignment } from "../scripts/lib/model-profiles/domain/stored-assignment.js";
import { ProfileDocumentPolicy } from "../scripts/lib/model-profiles/domain/profile-document-policy.js";

const policy = new AgentTargetPolicy();
const documents = new ProfileDocumentPolicy(policy);
it("refuses future preparation with its original diagnostic", () => {
  expect(() => documents.requireSupportedVersion({ version: 3 }, "prepare"))
    .toThrow(new Error("Cannot prepare assignment for unsupported profile version 3."));
});
it("refuses future update with operation-specific punctuation", () => {
  expect(() => documents.requireSupportedVersion({ version: 3 }, "update"))
    .toThrow(new Error("Cannot update unsupported profile version 3"));
});
it("supported version two permits preparation", () => {
  expect(() => documents.requireSupportedVersion({ version: 2 }, "prepare")).not.toThrow();
});
it("omitted legacy version permits update without injecting version one", () => {
  expect(() => documents.requireSupportedVersion(Object.freeze({}), "update")).not.toThrow();
});
it("refuses future snapshot using the actual version and original text", () => {
  expect(() => documents.requireSupportedVersion({ version: 4 }, "snapshot"))
    .toThrow(new Error("Cannot snapshot unsupported profile version 4"));
});
it("refuses a mismatched recovery document before acquisition", () => {
  expect(() => documents.requireRecoveryMatch(false)).toThrow(new Error("Recovery document does not match captured source"));
});
it("permits a matching recovery document", () => {
  expect(() => documents.requireRecoveryMatch(true)).not.toThrow();
});
it.each([{}, { version: 1 }, { version: 2 }, { version: 3 }, { version: Number.MAX_SAFE_INTEGER }])("version eligibility matrix %j", (raw) => {
  for (const operation of ["prepare", "update", "snapshot"] as const) {
    const run = () => documents.requireSupportedVersion(raw, operation);
    if ("version" in raw && raw.version! > 2) expect(run).toThrow(new Error(operation === "prepare"
      ? `Cannot prepare assignment for unsupported profile version ${raw.version}.` : `Cannot ${operation} unsupported profile version ${raw.version}`));
    else expect(run).not.toThrow();
  }
});
const invalidDocuments: Array<[string, unknown, string]> = [
  ["root", [], "root value must be an object."],
  ["models", { models: null }, "models must be an object."],
  ["profiles", { models: { profiles: [] } }, "models.profiles must be an object."],
  ["profile", { models: { profiles: { ['bad.name"\\folder']: null } } }, `models.profiles[${JSON.stringify('bad.name"\\folder')}] must be an object.`],
  ["version type", { version: "1" }, "version must be a positive safe integer."],
  ["unsafe version", { version: Number.MAX_SAFE_INTEGER + 1 }, "version must be a positive safe integer."],
  ["nonpositive version", { version: 0 }, "version must be a positive safe integer."],
  ["active shape", { models: { activeProfile: [] } }, "models.activeProfile must be a string or null."],
  ["active reference", { models: { activeProfile: "constructor", profiles: {} } }, "models.activeProfile 'constructor' does not exist."],
];
it.each(invalidDocuments)("domain rejects malformed %s", (_name, raw, error) => {
  expect(() => documents.validate(raw, "source")).toThrow(new Error(`Could not read model profile config at source: ${error}`));
});
it("omitted containers remain absent without legacy default injection", () => {
  const raw = Object.freeze({ foreign: { retained: true } });
  expect(documents.validate(raw, "source")).toBe(raw);
});

it.each(["inherit", " custom/model ", {}, { model: " inherit " }, { reasoningEffort: " Unknown " }, { note: { keep: true } }])
  ("retained factory preserves valid raw %j", (raw) => {
    expect(StoredAssignment.create(raw, "slot").raw).toBe(raw);
  });
it.each([undefined, null, [], 4, "", " \t"])("retained factory rejects invalid assignment %j", (raw) => {
  expect(() => StoredAssignment.create(raw, "slot")).toThrow("slot must be");
});
it.each([undefined, null, [], 4, "", " \t"])("retained factory rejects own invalid fields %j", (value) => {
  expect(() => StoredAssignment.create({ model: value }, "slot")).toThrow("slot.model must be a nonempty model string.");
  expect(() => StoredAssignment.create({ reasoningEffort: value }, "slot")).toThrow("slot.reasoningEffort must be a nonempty explicit effort string.");
});
it.each(["inherit", " InHerit ", "\tINHERIT\n"])("retained factory rejects effort inheritance %j", (reasoningEffort) => {
  expect(() => StoredAssignment.create({ reasoningEffort }, "slot")).toThrow("slot.reasoningEffort must be a nonempty explicit effort string.");
});

it("validates malformed recognized assignments in inactive profiles", () => {
  const raw = { models: { activeProfile: "active", profiles: { active: {}, archived: { "afg-review": { model: " " } } } } };
  expect(() => documents.validate(raw, "source")).toThrow('models.profiles.archived["afg-review"].model must be a nonempty model string.');
});
it("escaped stored profile and alias spelling retain the original error path", () => {
  const name = 'bad.name"\\folder';
  const raw = { models: { profiles: { [name]: { " ReVieW ": { model: 1 } } } } };
  expect(() => documents.validate(raw, "source")).toThrow(`models.profiles[${JSON.stringify(name)}][" ReVieW "].model must be a nonempty model string.`);
});
it("returns the original object and leaves opaque foreign fields untouched", () => {
  const raw = { version: 3, foreign: { keep: true }, models: { profiles: { work: { foreign: { reasoningEffort: null }, "afg-review": "inherit" } } } };
  expect(documents.validate(raw, "source")).toBe(raw);
});
it("rejects own undefined recognized fields before cloning", () => {
  expect(() => documents.validate({ models: { profiles: { work: { "afg-review": { reasoningEffort: undefined } } } } }, "source"))
    .toThrow('models.profiles.work["afg-review"].reasoningEffort');
});
it.each([undefined, null, [], 4, "", " \t"])("domain preserves container diagnostics for %j", (value) => {
  for (const [raw, field] of [[value, "root value"], [{ models: value }, "models"],
    [{ models: { profiles: value } }, "models.profiles"], [{ models: { profiles: { work: value } } }, "models.profiles.work"]]) {
    expect(() => documents.validate(raw, "identity")).toThrow(`Could not read model profile config at identity: ${field} must be an object.`);
  }
});
it.each([undefined, null, -1, 1.5, NaN, Infinity, "2"])("domain rejects unsafe version value %j", (version) => {
  expect(() => documents.validate({ version }, "source")).toThrow("version must be a positive safe integer.");
});
it.each([undefined, [], 4, false, {}])("domain rejects active selection value %j", (activeProfile) => {
  expect(() => documents.validate({ models: { activeProfile } }, "source")).toThrow("models.activeProfile must be a string or null.");
});
it.each([undefined, null, [], 4, "", " \t", " InHerit "])("domain validates all nontarget recognized fields %j", (value) => {
  const slot = (assignment: unknown) => ({ models: { profiles: { work: { main: "inherit", " ReVieW ": assignment } } } });
  if (value !== " InHerit ") {
    expect(() => documents.validate(slot(value), "source")).toThrow('models.profiles.work[" ReVieW "]');
    expect(() => documents.validate(slot({ model: value }), "source")).toThrow('models.profiles.work[" ReVieW "].model');
  }
  expect(() => documents.validate(slot({ reasoningEffort: value }), "source")).toThrow('models.profiles.work[" ReVieW "].reasoningEffort');
});
it.each([{}, { models: {} }, { models: { activeProfile: null } }, { models: { profiles: {} } },
  JSON.parse('{"version":9007199254740991,"models":{"activeProfile":"__proto__","profiles":{"__proto__":{"afg-review":"inherit","constructor":{"model":null}}}}}'),
  { version: 2, foreign: [], models: { memo: { keep: true }, profiles: { constructor: { main: {}, review: { model: " inherit ", reasoningEffort: " Custom ", note: [] } } } } }])
  ("domain preserves optional and foreign raw shape %j", (raw) => {
    const before = Object.getOwnPropertyDescriptors(raw);
    expect(documents.validate(raw, "source")).toBe(raw);
    expect(Object.getOwnPropertyDescriptors(raw)).toEqual(before);
  });

it("domain constructor is ambient-free and uses its concrete classification collaborator", () => {
  const normalize = vi.spyOn(policy, "normalize");
  const spies = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(process, "cwd")];
  try {
    const instance = new ProfileDocumentPolicy(policy);
    expect(normalize).not.toHaveBeenCalled();
    const raw = { models: { profiles: { work: { " ReVieW ": {}, foreign: null } } } };
    expect(instance.validate(raw, "diagnostic-only")).toBe(raw);
    instance.requireSupportedVersion(raw, "snapshot");
    instance.requireRecoveryMatch(true);
    expect(normalize.mock.calls).toEqual([[" ReVieW "], ["foreign"]]);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  } finally { normalize.mockRestore(); for (const spy of spies) spy.mockRestore(); }
});
it("resolved application and document domain graph obey inward boundaries", () => {
  const pending = [import.meta.resolve("../scripts/lib/model-profiles/application/read-profile-document-use-case.ts")];
  const visited = new Set<string>();
  while (pending.length) {
    const url = pending.pop()!;
    if (visited.has(url)) continue;
    visited.add(url);
    const source = fs.readFileSync(new URL(url), "utf8");
    expect(source).not.toMatch(/\b(process|globalThis|Buffer|ProcessEnv|require)\b/);
    const ast = ts.createSourceFile(url, source, ts.ScriptTarget.Latest);
    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node) && !(ts.isExportDeclaration(node) && node.moduleSpecifier)) continue;
      const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
      if (url.includes("/domain/")) expect(specifier).toMatch(/^\.\/[\w-]+\.js$/);
      else expect(specifier).toMatch(/^(\.\/|\.\.\/domain\/)[\w-]+\.js$/);
      const dependency = new URL(specifier.replace(/\.js$/, ".ts"), url).href;
      expect(dependency).toMatch(/\/model-profiles\/(domain|application)\/[\w-]+\.ts$/);
      pending.push(dependency);
    }
    if (url.endsWith("/stored-assignment.ts")) {
      const declaration = ast.statements.find(ts.isClassDeclaration)!;
      const constructor = declaration.members.find(ts.isConstructorDeclaration)!;
      expect(constructor.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword)).toBe(true);
      expect(constructor.body?.statements.length).toBe(0);
    }
  }
  const vertical = "../scripts/lib/model-profiles/";
  expect([...visited].sort()).toEqual([
    "application/read-profile-document-use-case.ts", "application/profile-observation-port.ts", "application/profile-document-observation.ts",
    "domain/profile-document-policy.ts", "domain/profile-document.ts", "domain/agent-target-policy.ts", "domain/stored-assignment.ts",
  ].map((path) => import.meta.resolve(vertical + path)).sort());
});

it("exact supplied key wins among equivalent aliases", () => {
  expect(policy.select({ review: "a", "afg-review": "b" }, "review")).toBe("review");
});

it("ambiguous aliases without exact key are refused", () => {
  expect(() => policy.select({ review: "a", "afg-review": "b" }, " REVIEW "))
    .toThrow("Ambiguous assignment aliases");
});

it("sole padded case-varied alias retains actual spelling", () => {
  expect(policy.select({ " ReVieW ": "a" }, "afg-review")).toBe(" ReVieW ");
});

it("missing supported target uses canonical new key", () => {
  expect(policy.select({}, " DESIGN ")).toBe("afg-design");
});

it("different missing target uses its own canonical key", () => {
  expect(policy.select({}, "main")).toBe("afergon-ai");
});

it("unsupported requested own slot is refused before selection", () => {
  expect(() => policy.select({ stranger: "opaque" }, "stranger"))
    .toThrow(new Error(`Unsupported agent 'stranger'. Supported agents: ${canonical.join(", ")}`));
});

it("another exact supplied key wins among equivalent aliases", () => {
  expect(policy.select({ design: "a", "afg-design": "b" }, "afg-design")).toBe("afg-design");
});

it("inherited aliases cannot become targets and foreign slots stay opaque", () => {
  const profile = Object.assign(Object.create({ " ReVieW ": "inherited" }), { stranger: "opaque" });
  expect(policy.select(profile, "review")).toBe("afg-review");
});

it("nonenumerable exact own key wins over sole equivalent alias", () => {
  const profile = Object.defineProperty({ "afg-review": "a" }, "review", { value: "b" });
  expect(policy.select(profile, "review")).toBe("review");
});

const canonical: SupportedAgent[] = [
  "afergon-ai", "afg-debate", "afg-breakdown", "afg-specify",
  "afg-plannify", "afg-implement", "afg-review", "afg-design",
];
const aliases = ["orchestrator", "main", "debate", "breakdown", "specify", "plannify", "implement", "review", "design"];
it("preserves supported export order", () => {
  expect(SUPPORTED_AGENTS).toEqual(canonical);
  expect(SUPPORTED_AGENTS).toBe(DOMAIN_AGENTS);
  const typed: DomainAgent[] = canonical;
  expect(typed).toEqual(canonical);
});
it.each([...canonical, ...aliases])("normalizes supported vocabulary %s", (alias) => {
  const expected = canonical.find((name) => name === alias || name === `afg-${alias}`) ?? "afergon-ai";
  for (const input of [alias, ` ${alias.toUpperCase()} `, `\t${alias}\n`]) {
    expect(normalizeAgentName(input)).toBe(expected);
    expect(policy.normalize(input)).toBe(expected);
    expect(policy.select({}, input)).toBe(expected);
  }
});
it.each([undefined, null, 0, false, {}, [], "", " \t", "unknown", " REVIEWER ", "__proto__", "constructor"])
  ("preserves unsupported diagnostic for %j", (input) => {
    const shown = typeof input === "string" && input.trim() ? input : "";
    const message = `Unsupported agent '${shown}'. Supported agents: ${canonical.join(", ")}`;
    expect(() => normalizeAgentName(input)).toThrow(new Error(message));
    expect(() => policy.normalize(input)).toThrow(new Error(message));
    if (typeof input === "string") expect(() => policy.select({}, input)).toThrow(new Error(message));
  });

it("selection preserves frozen source own prototype-like fields without reading values", () => {
  const profile = Object.freeze({ ["__proto__"]: "opaque", constructor: "opaque", " ReVieW ": "a",
    get stranger(): never { throw new Error("Opaque value must not be read"); } });
  const before = Object.getOwnPropertyDescriptors(profile);
  const prototype = Object.getPrototypeOf(profile);
  expect(policy.select(profile, "afg-review")).toBe(" ReVieW ");
  expect(Object.getOwnPropertyDescriptors(profile)).toEqual(before);
  expect(Object.getPrototypeOf(profile)).toBe(prototype);
  expect(Object.hasOwn(profile, "__proto__")).toBe(true);
  expect(policy.select(Object.create({ review: "inherited" }), "review")).toBe("afg-review");
});

it("resolved domain is self-contained and construction performs no ambient I/O", () => {
  const resolved = import.meta.resolve("../scripts/lib/model-profiles/domain/agent-target-policy.ts");
  const source = fs.readFileSync(new URL(resolved), "utf8");
  const ast = ts.createSourceFile(resolved, source, ts.ScriptTarget.Latest);
  expect(ast.statements.filter((node) => ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier))).toEqual([]);
  expect(source).not.toMatch(/\b(process|globalThis|Buffer|require|import)\b/);
  const spies = [vi.spyOn(fs, "readFileSync"), vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs, "mkdirSync"), vi.spyOn(process, "cwd")];
  try {
    expect(new AgentTargetPolicy().select({}, "main")).toBe("afergon-ai");
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  } finally { for (const spy of spies) spy.mockRestore(); }
});
