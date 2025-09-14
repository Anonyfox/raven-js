/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Assets class.
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { Assets } from "./assets.js";

describe("Assets", () => {
  describe("constructor", () => {
    it("creates assets with file array", () => {
      const files = ["./file1.js", "./file2.css"];
      const assets = new Assets(files);

      assert.deepStrictEqual(assets.getFiles(), files);
      assert.strictEqual(assets.hasAssets(), true);
    });

    it("creates assets with empty array", () => {
      const assets = new Assets([]);

      assert.deepStrictEqual(assets.getFiles(), []);
      assert.strictEqual(assets.hasAssets(), false);
    });

    it("handles null files parameter", () => {
      const assets = new Assets(null);

      assert.deepStrictEqual(assets.getFiles(), []);
      assert.strictEqual(assets.hasAssets(), false);
    });
  });

  describe("resolve", () => {
    // Create test directory structure
    const testDir = mkdtempSync(join(tmpdir(), "fledge-assets-test-"));
    const subDir = join(testDir, "subdir");
    const testFile1 = join(testDir, "test1.txt");
    const testFile2 = join(testDir, "test2.js");
    const subFile = join(subDir, "nested.css");

    // Setup test files
    mkdirSync(subDir);
    writeFileSync(testFile1, "test content 1");
    writeFileSync(testFile2, "test content 2");
    writeFileSync(subFile, "nested content");

    it("resolves null input to empty assets", async () => {
      const assets = await Assets.resolve(null);

      assert.deepStrictEqual(assets.getFiles(), []);
      assert.strictEqual(assets.hasAssets(), false);
    });

    it("resolves undefined input to empty assets", async () => {
      const assets = await Assets.resolve(undefined);

      assert.deepStrictEqual(assets.getFiles(), []);
      assert.strictEqual(assets.hasAssets(), false);
    });

    it("resolves string file path", async () => {
      const assets = await Assets.resolve(testFile1);

      assert.deepStrictEqual(assets.getFiles(), [testFile1]);
      assert.strictEqual(assets.hasAssets(), true);
    });

    it("resolves string directory path", async () => {
      const assets = await Assets.resolve(testDir);
      const files = assets.getFiles();

      assert.ok(files.includes(testFile1));
      assert.ok(files.includes(testFile2));
      assert.ok(files.includes(subFile));
      assert.strictEqual(assets.hasAssets(), true);
    });

    it("resolves array of paths", async () => {
      const assets = await Assets.resolve([testFile1, testFile2]);
      const files = assets.getFiles();

      assert.ok(files.includes(testFile1));
      assert.ok(files.includes(testFile2));
      assert.strictEqual(files.length, 2);
    });

    it("resolves mixed array with files and directories", async () => {
      const assets = await Assets.resolve([testFile1, subDir]);
      const files = assets.getFiles();

      assert.ok(files.includes(testFile1));
      assert.ok(files.includes(subFile));
    });

    it("removes duplicates from array input", async () => {
      const assets = await Assets.resolve([testFile1, testFile1, testFile2]);
      const files = assets.getFiles();

      assert.strictEqual(files.filter((f) => f === testFile1).length, 1);
      assert.ok(files.includes(testFile2));
    });

    it("resolves function returning string", async () => {
      const assetFunction = async () => testFile1;
      const assets = await Assets.resolve(assetFunction);

      assert.deepStrictEqual(assets.getFiles(), [testFile1]);
    });

    it("resolves function returning array", async () => {
      const assetFunction = async () => [testFile1, testFile2];
      const assets = await Assets.resolve(assetFunction);
      const files = assets.getFiles();

      assert.ok(files.includes(testFile1));
      assert.ok(files.includes(testFile2));
    });

    it("throws error for invalid input type", async () => {
      await assert.rejects(async () => await Assets.resolve(123), {
        name: "Error",
        message: "Assets configuration must be a string, array, function, or null",
      });
    });

    it("throws error for nonexistent path", async () => {
      await assert.rejects(async () => await Assets.resolve("./nonexistent/path"), {
        name: "Error",
        message: /Asset path not found:/,
      });
    });

    it("sorts resolved files", async () => {
      // Create files that would sort differently by name vs path
      const file1 = join(testDir, "z-file.txt");
      const file2 = join(testDir, "a-file.txt");
      writeFileSync(file1, "content");
      writeFileSync(file2, "content");

      const assets = await Assets.resolve([file1, file2]);
      const files = assets.getFiles();

      // Should be sorted alphabetically
      assert.ok(files.indexOf(file2) < files.indexOf(file1));
    });

    describe("mount path mapping", () => {
      const mountTestDir = mkdtempSync(join(tmpdir(), "fledge-assets-mount-test-"));
      const publicDir = join(mountTestDir, "public");
      const cssDir = join(publicDir, "css");
      const jsDir = join(publicDir, "js");

      // Setup test directory structure
      mkdirSync(publicDir);
      mkdirSync(cssDir);
      mkdirSync(jsDir);

      const faviconFile = join(publicDir, "favicon.ico");
      const styleFile = join(cssDir, "style.css");
      const appFile = join(jsDir, "app.js");
      const singleFile = join(mountTestDir, "single.txt");

      writeFileSync(faviconFile, "favicon content");
      writeFileSync(styleFile, "css content");
      writeFileSync(appFile, "js content");
      writeFileSync(singleFile, "single file content");

      it("creates correct mount paths for directory assets", async () => {
        const assets = await Assets.resolve(publicDir);
        const mountMap = assets.getMountMap();

        assert.strictEqual(mountMap.get("/favicon.ico"), faviconFile);
        assert.strictEqual(mountMap.get("/css/style.css"), styleFile);
        assert.strictEqual(mountMap.get("/js/app.js"), appFile);

        // Should have 3 entries in mount map
        assert.strictEqual(mountMap.size, 3);
      });

      it("creates correct mount path for single file assets", async () => {
        const assets = await Assets.resolve(singleFile);
        const mountMap = assets.getMountMap();

        assert.strictEqual(mountMap.get("/single.txt"), singleFile);
        assert.strictEqual(mountMap.size, 1);
      });

      it("handles mixed directory and file assets", async () => {
        const assets = await Assets.resolve([publicDir, singleFile]);
        const mountMap = assets.getMountMap();

        // Directory assets
        assert.strictEqual(mountMap.get("/favicon.ico"), faviconFile);
        assert.strictEqual(mountMap.get("/css/style.css"), styleFile);
        assert.strictEqual(mountMap.get("/js/app.js"), appFile);

        // Single file asset
        assert.strictEqual(mountMap.get("/single.txt"), singleFile);

        // Should have 4 entries total
        assert.strictEqual(mountMap.size, 4);
      });

      it("handles nested subdirectories correctly", async () => {
        // Create deeply nested structure
        const nestedDir = join(mountTestDir, "nested");
        const sub1Dir = join(nestedDir, "level1");
        const sub2Dir = join(sub1Dir, "level2");
        mkdirSync(nestedDir);
        mkdirSync(sub1Dir);
        mkdirSync(sub2Dir);

        const deepFile = join(sub2Dir, "deep.txt");
        writeFileSync(deepFile, "deep content");

        const assets = await Assets.resolve(nestedDir);
        const mountMap = assets.getMountMap();

        assert.strictEqual(mountMap.get("/level1/level2/deep.txt"), deepFile);
        assert.strictEqual(mountMap.size, 1);
      });

      it("normalizes path separators in mount paths", async () => {
        // This test ensures mount paths use forward slashes regardless of platform
        const assets = await Assets.resolve(publicDir);
        const mountMap = assets.getMountMap();

        // All mount paths should use forward slashes
        for (const mountPath of mountMap.keys()) {
          assert.ok(mountPath.startsWith("/"));
          assert.ok(!mountPath.includes("\\"));
        }
      });

      it("preserves file paths in getFiles() method", async () => {
        const assets = await Assets.resolve(publicDir);
        const files = assets.getFiles();

        // getFiles() should return the actual file paths, not mount paths
        assert.ok(files.includes(faviconFile));
        assert.ok(files.includes(styleFile));
        assert.ok(files.includes(appFile));
      });
    });
  });

  describe("validate", () => {
    const testDir = mkdtempSync(join(tmpdir(), "fledge-assets-validate-test-"));
    const existingFile = join(testDir, "exists.txt");
    writeFileSync(existingFile, "content");

    it("passes validation for existing files", () => {
      const assets = new Assets([existingFile]);

      assert.doesNotThrow(() => assets.validate());
    });

    it("throws error for missing files", () => {
      const missingFile = join(testDir, "missing.txt");
      const assets = new Assets([missingFile]);

      assert.throws(() => assets.validate(), {
        name: "Error",
        message: `Asset file not found: ${missingFile}`,
      });
    });

    it("passes validation for empty assets", () => {
      const assets = new Assets([]);

      assert.doesNotThrow(() => assets.validate());
    });
  });

  describe("getters", () => {
    const files = ["./file1.js", "./file2.css", "./file3.html"];
    const mountMap = new Map([
      ["/file1.js", "./file1.js"],
      ["/file2.css", "./file2.css"],
    ]);
    const assets = new Assets(files, mountMap);

    it("getFiles returns file array", () => {
      assert.deepStrictEqual(assets.getFiles(), files);
    });

    it("getMountMap returns mount path mapping", () => {
      const returnedMap = assets.getMountMap();
      assert.deepStrictEqual(returnedMap, mountMap);
      assert.strictEqual(returnedMap.get("/file1.js"), "./file1.js");
      assert.strictEqual(returnedMap.get("/file2.css"), "./file2.css");
    });

    it("getMountMap returns empty map when no mount map provided", () => {
      const assetsWithoutMap = new Assets(files);
      const returnedMap = assetsWithoutMap.getMountMap();
      assert.ok(returnedMap instanceof Map);
      assert.strictEqual(returnedMap.size, 0);
    });

    it("hasAssets returns true for non-empty assets", () => {
      assert.strictEqual(assets.hasAssets(), true);
    });

    it("hasAssets returns false for empty assets", () => {
      const emptyAssets = new Assets([]);
      assert.strictEqual(emptyAssets.hasAssets(), false);
    });
  });
});
