import { expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createHash } from "node:crypto";
import { inspectArchitecture, type ArchitectureModule } from "./model-profiles-architecture-checker.js";

function module(id: string, layer: ArchitectureModule["layer"], dependencies: string[] = [], text = ""): ArchitectureModule {
  return { id, layer, dependencies, text };
}

it("S12 checker rejects domain to application despite compliant names", () => {
  const modules = [module("Policy.ts", "domain", ["Value.ts"]), module("Value.ts", "application")];
  expect(inspectArchitecture({ modules, compositionRoots: [] })).toContain("Policy.ts -> Value.ts");
});

it("S13 original wrappers delegate without owning policy or atomic persistence", () => {
  const directory = path.resolve("scripts/lib/model-profiles/infrastructure");
  for (const name of ["profile-store.ts", "document-validation.ts", "prepare-assignment.ts", "migration-snapshot.ts", "profile-read-composition.ts"]) {
    const text = fs.readFileSync(path.join(directory, name), "utf8");
    const ast = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true);
    const calls: string[] = [];
    function inspect(node: ts.Node) {
      expect(ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)).toBe(false);
      if (ts.isNewExpression(node)) expect(node.expression.getText(ast)).toMatch(/^(Error|ProfileReadComposition)$/);
      if (ts.isCallExpression(node)) calls.push(node.expression.getText(ast));
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        expect(node.left.getText(ast)).not.toMatch(/\.(version|document|models|profiles)\b/);
      }
      ts.forEachChild(node, inspect);
    }
    inspect(ast);
    expect(calls.some(call => /\.(atomicPersist|prepareContext|clone|requireSupportedVersion)$/.test(call))).toBe(false);
    expect(calls.some(call => /^(JSON\.|fs\.|process\.|getConfigPath$|saveConfig$|createDefaultConfig$)/.test(call))).toBe(false);
  }
  const application = fs.readFileSync(path.resolve("scripts/lib/model-profiles/application/update-profile-assignment-use-case.ts"), "utf8");
  expect(application).toContain("this.storage.atomicPersist(prepared.document, loaded.source)");
  const directoryFiles = fs.readdirSync(directory).filter(name => name.endsWith(".ts"));
  for (const name of directoryFiles) expect(fs.readFileSync(path.join(directory, name), "utf8")).not.toMatch(/\.atomicPersist\s*\(/);
});

it("S13 composition retains the exact legacy saver body", () => {
  const text = fs.readFileSync(path.resolve("scripts/lib/model-profiles-config.ts"), "utf8").replaceAll("\r\n", "\n");
  const ast = ts.createSourceFile("config.ts", text, ts.ScriptTarget.Latest, true);
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "saveConfig")!;
  const body = text.slice(text.indexOf("\n", declaration.getStart(ast)) + 1, declaration.end + 1);
  expect(createHash("sha256").update(body).digest("hex")).toBe("79c929fed059901b1bd8e0ac19db30d309f1c7c7d714ff7c4cac95218869343d");
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
      const id = path.join(vertical, layer, name).split(path.sep).join("/");
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
  expect(modules.filter(item => item.layer === "domain")).toHaveLength(8);
  expect(modules.filter(item => item.layer === "application")).toHaveLength(10);
  expect(modules.some(item => item.id.endsWith("update-profile-assignment-use-case.ts"))).toBe(true);
  expect(modules.some(item => item.id.endsWith("export-model-profiles-use-case.ts"))).toBe(true);
  expect(modules.some(item => item.id.endsWith("model-only-export-policy.ts"))).toBe(true);
   const roots = ["profile-read-composition.ts", "profile-composition.ts", "profile-store.ts", "document-validation.ts", "prepare-assignment.ts", "migration-snapshot.ts"]
     .map(name => path.join(vertical, "infrastructure", name).split(path.sep).join("/"));
   expect(roots.every(root => modules.some(item => item.id === root && item.layer === "infrastructure"))).toBe(true);
   expect(inspectArchitecture({ modules, compositionRoots: roots })).toEqual([]);
});
