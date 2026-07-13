import path from "node:path";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");
const distScripts = path.join(repoRoot, "dist", "scripts");

describe("TypeScript build output", () => {
  it("declares a package lifecycle build for the ignored dist runtime", () => {
    const packageMetadata = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));

    expect(packageMetadata.files).toContain("dist/");
    expect(packageMetadata.scripts.prepack).toBe("pnpm run build");
  });

  it("emits the dispatcher, models, and TUI as NodeNext JavaScript without copied runtime MJS", async () => {
    const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const result = spawnSync(pnpmCommand, ["run", "build"], { cwd: repoRoot, encoding: "utf8", timeout: 120000 });

    expect(result.status).toBe(0);
    for (const runtimePath of [
      "cli-dispatch.js",
      "models.js",
      "tui.js",
      "lib/cli-dispatch-core.js",
      "lib/model-profiles.js",
      "lib/tui/actions/forms.js",
      "lib/tui/modal-controller.js",
      "lib/tui/model-profiles-controller.js",
    ]) {
      expect(existsSync(path.join(distScripts, runtimePath))).toBe(true);
    }
    expect(existsSync(path.join(distScripts, "tui.mjs"))).toBe(false);
    expect(existsSync(path.join(distScripts, "lib/tui/modal-controller.mjs"))).toBe(false);
    expect(existsSync(path.join(distScripts, "lib/model-profiles.mjs"))).toBe(false);

    const tui = await import(`${pathToFileURL(path.join(distScripts, "tui.js")).href}?build-artifact`);
    expect(typeof tui.createTuiApp).toBe("function");
    expect(typeof tui.renderHomeScreen).toBe("function");
  }, 120000);

  it("keeps generated runtime launchers on emitted JavaScript", () => {
    const posixLauncher = readFileSync(path.join(repoRoot, "bin", "afergon-ai"), "utf8");
    const windowsLauncher = readFileSync(path.join(repoRoot, "bin", "afergon-ai.cmd"), "utf8");
    const dispatcher = readFileSync(path.join(repoRoot, "scripts", "cli-dispatch.ts"), "utf8");

    expect(posixLauncher).toContain("dist/scripts/cli-dispatch.js");
    expect(windowsLauncher).toContain("dist\\scripts\\cli-dispatch.js");
    expect(dispatcher).toContain('"scripts/tui.js"');
    expect(dispatcher).toContain('"scripts/models.js"');
  });

  it("packs a clean checkout with a standalone JavaScript TUI runtime", () => {
    const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const fixtureRoot = mkdtempSync(path.join(repoRoot, ".typescript-pack-"));
    const archiveDirectory = path.join(fixtureRoot, "archives");

    try {
      const packResult = spawnSync(pnpmCommand, ["pack", "--pack-destination", archiveDirectory], {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: 120000,
      });
      expect(packResult.status).toBe(0);
      const archive = readdirSync(archiveDirectory).find((entry) => entry.endsWith(".tgz"));
      expect(archive).toBeDefined();
      if (!archive) throw new Error("pnpm pack did not produce an archive");
      const archiveContents = spawnSync("tar", ["-tzf", path.join(archiveDirectory, archive)], { encoding: "utf8" });

      expect(archiveContents.status).toBe(0);
      expect(archiveContents.stdout).toContain("package/dist/scripts/tui.js");
      expect(archiveContents.stdout).not.toContain("package/dist/scripts/tui.mjs");
      expect(archiveContents.stdout).not.toContain("package/dist/scripts/lib/tui/modal-controller.mjs");
      expect(archiveContents.stdout).not.toMatch(/package\/(?:dist\/)?scripts\/lib\/.*\.mjs\n/);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  }, 120000);
});
