/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Bundler class.
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { Bundler } from "./bundler.js";
import { ScriptConfig } from "./config/config.js";

describe("Bundler", () => {
  // Create test directory structure
  const testDir = mkdtempSync(join(tmpdir(), "fledge-bundler-test-"));
  const srcDir = join(testDir, "src");
  const assetsDir = join(testDir, "assets");

  mkdirSync(srcDir);
  mkdirSync(assetsDir);

  // Test entry file
  const entryFile = join(srcDir, "app.js");
  writeFileSync(
    entryFile,
    `
		console.log("Hello from bundled app!");
		export default function main() {
			return "App running";
		}
	`
  );

  // Test client bundle
  const clientFile = join(srcDir, "client.js");
  writeFileSync(
    clientFile,
    `
		console.log("Client bundle loaded");
		window.app = { ready: true };
	`
  );

  // Test assets
  const textAsset = join(assetsDir, "config.json");
  const binaryAsset = join(assetsDir, "icon.png");
  writeFileSync(textAsset, JSON.stringify({ name: "test", version: "1.0" }));
  writeFileSync(binaryAsset, Buffer.from("fake-png-data", "utf8")); // Fake binary

  describe("constructor", () => {
    it("creates bundler with config", () => {
      const config = new ScriptConfig({
        entry: entryFile,
        output: "./dist/app.js",
      });

      const bundler = new Bundler(config);

      assert.ok(bundler);
      assert.strictEqual(bundler.isBundled(), false);
    });
  });

  describe("generate", () => {
    it("generates executable with minimal config", async () => {
      const config = new ScriptConfig({
        entry: entryFile,
        output: "./dist/app.js",
      });

      const bundler = new Bundler(config);
      const executable = await bundler.generate();

      assert.ok(typeof executable === "string");
      assert.ok(executable.length > 0);
      assert.ok(executable.startsWith("#!/usr/bin/env node"));
      assert.ok(executable.includes("--experimental-sqlite"));
      assert.ok(executable.includes("Hello from bundled app!"));
      assert.strictEqual(bundler.isBundled(), true);
    });

    it("generates executable with assets", async () => {
      const config = await ScriptConfig.fromObject({
        entry: entryFile,
        output: "./dist/app.js",
        assets: [textAsset, binaryAsset],
      });

      const bundler = new Bundler(config);
      const executable = await bundler.generate();

      assert.ok(executable.includes("globalThis.RavenJS.assets"));
      // Assets should be mounted with proper paths, not full file paths
      assert.ok(executable.includes('"/config.json"'));
      assert.ok(executable.includes('"/icon.png"'));
      assert.ok(executable.includes("test"));
      // Binary data should be base64 encoded, not raw
      const expectedBase64 = Buffer.from("fake-png-data", "utf8").toString("base64");
      assert.ok(executable.includes(expectedBase64));
    });

    it("generates executable with client bundles", async () => {
      const config = await ScriptConfig.fromObject({
        entry: entryFile,
        output: "./dist/app.js",
        bundles: {
          "/client.js": clientFile,
        },
      });

      const bundler = new Bundler(config);
      const executable = await bundler.generate();

      assert.ok(executable.includes("Client bundle loaded"));
      assert.ok(executable.includes('"/client.js"'));
      assert.ok(executable.includes("window.app"));
    });

    it("generates executable with environment variables", async () => {
      const config = await ScriptConfig.fromObject({
        entry: entryFile,
        output: "./dist/app.js",
        env: {
          NODE_ENV: "production",
          API_KEY: "secret123",
        },
      });

      const bundler = new Bundler(config);
      const executable = await bundler.generate();

      assert.ok(executable.includes("globalThis.RavenJS.env"));
      assert.ok(executable.includes('"NODE_ENV": "production"'));
      assert.ok(executable.includes('"API_KEY": "secret123"'));
      assert.ok(executable.includes("Object.assign(process.env"));
    });

    it("generates executable with custom metadata", async () => {
      const config = await ScriptConfig.fromObject({
        entry: entryFile,
        output: "./dist/app.js",
        metadata: {
          name: "TestApp",
          version: "2.0.0",
          banner: true,
        },
      });

      const bundler = new Bundler(config);
      const executable = await bundler.generate();

      assert.ok(executable.includes("TestApp v2.0.0"));
      assert.ok(executable.includes("build timestamp:"));
      assert.ok(executable.includes("**********"));
    });

    it("generates executable with custom Node flags", async () => {
      const config = await ScriptConfig.fromObject({
        entry: entryFile,
        output: "./dist/app.js",
        nodeFlags: ["--max-old-space-size=4096", "--trace-warnings"],
      });

      const bundler = new Bundler(config);
      const executable = await bundler.generate();

      assert.ok(
        executable.startsWith("#!/usr/bin/env node --experimental-sqlite --max-old-space-size=4096 --trace-warnings")
      );
    });

    it("generates executable with ESM format", async () => {
      const config = await ScriptConfig.fromObject({
        entry: entryFile,
        output: "./dist/app.js",
        format: "esm",
      });

      const bundler = new Bundler(config);
      const executable = await bundler.generate();

      assert.ok(executable.includes("Hello from bundled app!"));
      // ESM format should still work even though the test is simple
      assert.ok(typeof executable === "string");
    });

    it("throws error when called twice", async () => {
      const config = new ScriptConfig({
        entry: entryFile,
        output: "./dist/app.js",
      });

      const bundler = new Bundler(config);
      await bundler.generate();

      await assert.rejects(async () => await bundler.generate(), {
        name: "Error",
        message: "Bundler has already generated executable",
      });
    });

    it("throws error for missing entry file", async () => {
      const config = new ScriptConfig({
        entry: "./nonexistent.js",
        output: "./dist/app.js",
      });

      const bundler = new Bundler(config);

      await assert.rejects(async () => await bundler.generate(), {
        name: "Error",
        message: /Script bundling failed/,
      });
    });

    it("throws error for missing asset file", async () => {
      // Create config with fake asset that exists during config creation
      const fakeAsset = join(testDir, "temp.txt");
      writeFileSync(fakeAsset, "temp");

      const config = await ScriptConfig.fromObject({
        entry: entryFile,
        output: "./dist/app.js",
        assets: [fakeAsset],
      });

      // Delete the asset after config creation but before bundling
      const fs = await import("node:fs");
      fs.unlinkSync(fakeAsset);

      const bundler = new Bundler(config);

      await assert.rejects(async () => await bundler.generate(), {
        name: "Error",
        message: /Failed to read asset/,
      });
    });
  });

  describe("getStatistics", () => {
    it("returns initial statistics", () => {
      const config = new ScriptConfig({
        entry: entryFile,
        output: "./dist/app.js",
      });

      const bundler = new Bundler(config);
      const stats = bundler.getStatistics();

      assert.strictEqual(stats.startTime, 0);
      assert.strictEqual(stats.endTime, 0);
      assert.strictEqual(stats.totalTime, 0);
      assert.strictEqual(stats.bundleSize, 0);
      assert.strictEqual(stats.assetCount, 0);
    });

    it("returns statistics after bundling", async () => {
      const config = await ScriptConfig.fromObject({
        entry: entryFile,
        output: "./dist/app.js",
        assets: [textAsset],
      });

      const bundler = new Bundler(config);
      await bundler.generate();
      const stats = bundler.getStatistics();

      assert.ok(stats.startTime > 0);
      assert.ok(stats.endTime > 0);
      assert.ok(stats.totalTime > 0);
      assert.ok(stats.bundleSize > 0);
      assert.strictEqual(stats.assetCount, 1);
    });
  });

  describe("isBundled", () => {
    it("returns false initially", () => {
      const config = new ScriptConfig({
        entry: entryFile,
        output: "./dist/app.js",
      });

      const bundler = new Bundler(config);

      assert.strictEqual(bundler.isBundled(), false);
    });

    it("returns true after bundling", async () => {
      const config = new ScriptConfig({
        entry: entryFile,
        output: "./dist/app.js",
      });

      const bundler = new Bundler(config);
      await bundler.generate();

      assert.strictEqual(bundler.isBundled(), true);
    });
  });
});
