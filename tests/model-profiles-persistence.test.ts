import fs from "node:fs";
import ts from "typescript";
import { expect, it, vi } from "vitest";
import { AgentTargetPolicy, SUPPORTED_AGENTS as DOMAIN_AGENTS, type SupportedAgent as DomainAgent } from "../scripts/lib/model-profiles/domain/agent-target-policy.js";
import { normalizeAgentName, SUPPORTED_AGENTS, type SupportedAgent } from "../scripts/lib/model-profiles-core.js";

const policy = new AgentTargetPolicy();

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
