import ts from "typescript";

export interface ArchitectureModule {
  id: string;
  layer: "domain" | "application" | "infrastructure" | "legacy";
  text: string;
  dependencies: string[];
}

export interface ArchitectureGraph {
  modules: ArchitectureModule[];
  compositionRoots: string[];
}

// Test-owned analysis only. The caller supplies texts and resolved edges;
// this helper has no filesystem, environment or host-process authority.
export function inspectArchitecture(graph: ArchitectureGraph): string[] {
  const errors: string[] = [];
  for (const root of graph.compositionRoots) {
    if (graph.modules.find(item => item.id === root)?.layer !== "infrastructure") errors.push(`${root}: invalid composition root`);
  }
  for (const source of graph.modules) {
    function visit(current: ArchitectureModule, path: string[]): void {
      for (const target of current.dependencies) {
        const dependency = graph.modules.find(item => item.id === target);
        const chain = [...path, target];
        const forbidden = source.layer === "domain" ? dependency?.layer !== "domain"
          : source.layer === "application" && !["domain", "application"].includes(dependency?.layer ?? "");
        if (forbidden) errors.push(chain.join(" -> "));
        else if (dependency && !path.includes(target)) visit(dependency, chain);
      }
    }
    visit(source, [source.id]);
    if (source.layer !== "domain" && source.layer !== "application") continue;
    // Graph identities can be Windows paths or opaque tokens. Binding uses a
    // fixed virtual filename; it must never interpret an identity as I/O authority.
    const fileName = "module.ts";
    const ast = ts.createSourceFile(fileName, source.text, ts.ScriptTarget.Latest, true);
    const host: ts.CompilerHost = {
      getSourceFile: name => name === fileName ? ast : undefined,
      getDefaultLibFileName: () => "", writeFile: () => {}, getCurrentDirectory: () => "",
      getDirectories: () => [], fileExists: name => name === fileName,
      readFile: name => name === fileName ? source.text : undefined,
      getCanonicalFileName: name => name, useCaseSensitiveFileNames: () => true, getNewLine: () => "\n",
    };
    const program = ts.createProgram([fileName], { noLib: true, noResolve: true }, host);
    const checker = program.getTypeChecker();
    for (const node of ast.statements) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) && (node.moduleSpecifier.text.startsWith("node:") ||
          ["fs", "child_process", "path", "os"].includes(node.moduleSpecifier.text.split("/")[0]))) {
        errors.push(`${source.id}: Node import ${node.moduleSpecifier.text}`);
      }
    }
    function ambientPath(node: ts.Node, seen = new Set<ts.Node>()): string {
      if (seen.has(node)) return "";
      seen.add(node);
      if (ts.isIdentifier(node)) {
        const declaration = checker.getSymbolAtLocation(node)?.declarations?.[0];
        if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer) {
          return ambientPath(declaration.initializer, seen);
        }
        if (declaration && ts.isBindingElement(declaration) && ts.isObjectBindingPattern(declaration.parent)) {
          const owner = declaration.parent.parent;
          if (ts.isVariableDeclaration(owner) && owner.initializer) {
            const base = ambientPath(owner.initializer, seen);
            const key = declaration.propertyName ?? declaration.name;
            if (base && (ts.isIdentifier(key) || ts.isStringLiteral(key))) return `${base}.${key.text}`;
          }
        }
        return declaration ? "" : node.text;
      }
      if (ts.isPropertyAccessExpression(node)) {
        const base = ambientPath(node.expression, seen);
        return base ? `${base}.${node.name.text}` : "";
      }
      if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)) {
        const base = ambientPath(node.expression, seen);
        return base ? `${base}.${node.argumentExpression.text}` : "";
      }
      return "";
    }
    function inspect(node: ts.Node): void {
      const authority = ambientPath(node);
      if (authority.startsWith("process.") || authority.startsWith("globalThis.process")) {
        errors.push(`${source.id}: ambient process`);
      }
      if (ts.isCallExpression(node)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] &&
          ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text.startsWith("node:")) {
          errors.push(`${source.id}: Node import ${node.arguments[0].text}`);
        }
        const call = ambientPath(node.expression);
        const name = call.replace(/^globalThis\./, "");
        if (["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"].includes(name)) {
          errors.push(`${source.id}: host call ${call}`);
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(ast);
  }
  return errors;
}
