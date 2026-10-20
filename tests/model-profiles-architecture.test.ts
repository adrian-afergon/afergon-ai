import { expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { inspectArchitecture, type ArchitectureModule } from "./model-profiles-architecture-checker.js";

function module(id: string, layer: ArchitectureModule["layer"], dependencies: string[] = [], text = ""): ArchitectureModule {
  return { id, layer, dependencies, text };
}

it("S12 checker rejects domain to application despite compliant names", () => {
  const modules = [module("Policy.ts", "domain", ["Value.ts"]), module("Value.ts", "application")];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("Policy.ts -> Value.ts");
});
it("S12 checker T1 rejects infrastructure with different identities", () => {
  const modules = [module("A.ts", "domain", ["B.ts"]), module("B.ts", "infrastructure")];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("A.ts -> B.ts");
});
it("S12 checker T2 traces indirect legacy dependency", () => {
  const modules = [module("A.ts", "domain", ["Bridge.ts"]), module("Bridge.ts", "domain", ["Core.ts"]), module("Core.ts", "legacy")];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("A.ts -> Bridge.ts -> Core.ts");
});
it("S12 checker prevents application escaping through another application", () => {
  const modules = [module("App.ts", "application", ["Bridge.ts"]), module("Bridge.ts", "application", ["Fs.ts"]), module("Fs.ts", "infrastructure")];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("App.ts -> Bridge.ts -> Fs.ts");
});
it("S12 checker rejects inner node fs syntax without resolved local edge", () => {
  const modules = [module("CleanPolicy.ts", "domain", [], 'import fs from "node:fs";')];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("CleanPolicy.ts: Node import node:fs");
});
it("S12 checker rejects other Node import and re-export syntax", () => {
  const modules = [module("UseCase.ts", "application", [], 'export { homedir } from "node:os";')];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("UseCase.ts: Node import node:os");
});
it("S12 checker rejects bare Node builtin subpaths", () => {
  const modules = [module("UseCase.ts", "application", [], 'import type { FileHandle } from "fs/promises";')];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("UseCase.ts: Node import fs/promises");
});
it("S12 checker rejects ambient process environment access", () => {
  const modules = [module("Pure.ts", "domain", [], "export const value = process.env.HOME;")];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("Pure.ts: ambient process");
});
it("S12 checker accepts local process shadow and harmless strings", () => {
  const text = 'export function pure(process: { env: { HOME: string } }) { const hint = "node:fs process.env spawnSync"; return process.env.HOME + hint; }';
  expect(inspectArchitecture({ modules: [module("InfrastructureNode.ts", "domain", [], text)], compositionRoots: [] })).toEqual([]);
});
it("S12 checker rejects globalThis process authority", () => {
  const modules = [module("Pure.ts", "domain", [], "const home = globalThis.process.env.HOME;")];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("Pure.ts: ambient process");
});
it("S12 checker follows aliased globals through local bindings", () => {
  const text = "const host = globalThis; const runtime = host.process; const environment = runtime.env; export const value = environment.HOME;";
  expect(inspectArchitecture({ modules: [module("Pure.ts", "domain", [], text)], compositionRoots: [] })).toContain("Pure.ts: ambient process");
});
it("S12 checker rejects host spawn through a global alias", () => {
  const text = 'const host = globalThis; host.spawnSync("tool");';
  expect(inspectArchitecture({ modules: [module("Pure.ts", "domain", [], text)], compositionRoots: [] })).toContain("Pure.ts: host call globalThis.spawnSync");
});
it("S12 checker rejects a different unbound host call", () => {
  const text = 'execFileSync("tool");';
  expect(inspectArchitecture({ modules: [module("Pure.ts", "application", [], text)], compositionRoots: [] })).toContain("Pure.ts: host call execFileSync");
});
it("S12 checker rejects bracketed host call aliases", () => {
  const text = 'const run = globalThis["spawnSync"]; run("tool");';
  expect(inspectArchitecture({ modules: [module("Pure.ts", "domain", [], text)], compositionRoots: [] })).toContain("Pure.ts: host call globalThis.spawnSync");
});
it("S12 checker rejects destructured global process aliases", () => {
  const text = 'const { process: runtime } = globalThis; const { env } = runtime; export const value = env.HOME;';
  expect(inspectArchitecture({ modules: [module("Pure.ts", "domain", [], text)], compositionRoots: [] })).toContain("Pure.ts: ambient process");
});
it("S12 checker rejects dynamic Node imports", () => {
  const text = 'export const load = () => import("node:worker_threads");';
  expect(inspectArchitecture({ modules: [module("Pure.ts", "domain", [], text)], compositionRoots: [] })).toContain("Pure.ts: Node import node:worker_threads");
});
it("S12 checker rejects bare host and path builtins", () => {
  const text = 'import cp from "child_process"; import path from "path"; import os from "os";';
  const errors = inspectArchitecture({ modules: [module("Pure.ts", "domain", [], text)], compositionRoots: [] });
  expect(errors).toEqual(["Pure.ts: Node import child_process", "Pure.ts: Node import path", "Pure.ts: Node import os"]);
});
it("S12 checker requires composition roots outside inner layers", () => {
  expect(inspectArchitecture({ modules: [module("Domain.ts", "domain")], compositionRoots: ["Domain.ts"] })).toContain("Domain.ts: invalid composition root");
});

it.each(["application", "infrastructure", "legacy"] as const)("S12 graph matrix refuses direct domain to %s", layer => {
  const modules = [module("domain/Compliant.ts", "domain", ["domain/AlsoCompliant.ts"]), module("domain/AlsoCompliant.ts", layer)];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("domain/Compliant.ts -> domain/AlsoCompliant.ts");
});
it.each(["application", "infrastructure", "legacy"] as const)("S12 graph matrix refuses indirect domain to %s", layer => {
  const modules = [module("A.ts", "domain", ["B.ts"]), module("B.ts", "domain", ["C.ts"]), module("C.ts", layer)];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("A.ts -> B.ts -> C.ts");
});
it.each([
  'function f(globalThis: { process: { env: {} } }) { return globalThis.process.env; }',
  'const process = { env: {} }; const local = process; export const value = local.env;',
  'function f(spawnSync: () => void) { spawnSync(); } const hint = "process.env node:fs";',
])("S12 scope positives accept local bindings %s", text => {
  expect(inspectArchitecture({ modules: [module("NodeProcess.ts", "domain", [], text)], compositionRoots: [] })).toEqual([]);
});
it("S12 checker accepts a clean transitive graph with cycles and real composition root", () => {
  const modules = [module("root.ts", "infrastructure", ["app.ts", "core.ts"], 'import fs from "node:fs";'),
    module("app.ts", "application", ["domain.ts"]), module("domain.ts", "domain", ["value.ts"]),
    module("value.ts", "domain", ["domain.ts"], 'export const label = "process.env node:fs";'), module("core.ts", "legacy")];
  expect(inspectArchitecture({ modules, compositionRoots: ["root.ts"] })).toEqual([]);
});

// Filesystem and TypeScript resolution are confined to this test loader. The
// analyzer above receives only immutable text, explicit layers and graph edges.
it("S12 actual repository graph retains all domain and application boundaries", () => {
  const vertical = path.resolve("scripts/lib/model-profiles");
  const modules: ArchitectureModule[] = [];
  const options = { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext };
  for (const layer of ["domain", "application", "infrastructure"] as const) {
    for (const name of fs.readdirSync(path.join(vertical, layer)).filter(name => name.endsWith(".ts"))) {
      const id = path.join(vertical, layer, name);
      const text = fs.readFileSync(id, "utf8");
      const ast = ts.createSourceFile(id, text, ts.ScriptTarget.Latest, true);
      const dependencies: string[] = [];
      for (const node of ast.statements) {
        if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) || !node.moduleSpecifier) continue;
        const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
        const resolved = ts.resolveModuleName(specifier, id, options, ts.sys).resolvedModule;
        dependencies.push(resolved?.resolvedFileName ?? specifier);
        if (layer === "domain") expect(specifier).toMatch(/^\.\/[\w-]+\.js$/);
        if (layer === "application") expect(specifier).toMatch(/^(\.\/|\.\.\/domain\/)[\w-]+\.js$/);
      }
      modules.push(module(id, layer, dependencies, text));
    }
  }
  expect(modules.filter(item => item.layer === "domain")).toHaveLength(7);
  expect(modules.filter(item => item.layer === "application")).toHaveLength(8);
  expect(modules.some(item => item.id.endsWith("update-profile-assignment-use-case.ts"))).toBe(true);
  expect(inspectArchitecture({ modules, compositionRoots: [path.join(vertical, "infrastructure/profile-read-composition.ts")] })).toEqual([]);
});
