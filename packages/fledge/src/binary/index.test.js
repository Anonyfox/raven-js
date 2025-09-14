/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for binary mode orchestration functions.
 */

import assert from "node:assert";
import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { BinaryConfig } from "./config/config.js";
import { createBinaryConfigFromFlags, generateBinaryExecutable } from "./index.js";

describe("generateBinaryExecutable", () => {
  it("validates configuration in validation mode", async () => {
    const config = {
      entry: "./src/server.js",
      assets: [],
    };

    const result = await generateBinaryExecutable(config, { validate: true });

    assert.strictEqual(result.executable, "");
    assert.strictEqual(result.statistics.message, "Configuration validation successful");
    assert.strictEqual(result.statistics.assetCount, 0);
    assert.strictEqual(result.statistics.startTime, 0);
    assert.strictEqual(result.statistics.endTime, 0);
    assert.strictEqual(result.statistics.totalTime, 0);
    assert.strictEqual(result.statistics.executableSize, 0);
  });

  it("handles string configuration input (file path)", async () => {
    // Create temporary config file
    const testDir = mkdtempSync(join(tmpdir(), "fledge-binary-index-test-"));
    const configPath = join(testDir, "test.config.mjs");

    writeFileSync(
      configPath,
      `export default {
				entry: "./src/server.js",
				output: "./dist/myapp",
				assets: []
			}`
    );

    const result = await generateBinaryExecutable(configPath, {
      validate: true,
    });

    assert.strictEqual(result.executable, "");
    assert.strictEqual(result.statistics.message, "Configuration validation successful");
    assert.ok(result.outputDir.endsWith("dist"));
  });

  it("handles string configuration input (JavaScript code)", async () => {
    const configString = `export default {
			entry: "./src/server.js",
			output: "./dist/myapp",
			assets: []
		}`;

    const result = await generateBinaryExecutable(configString, {
      validate: true,
    });

    assert.strictEqual(result.executable, "");
    assert.strictEqual(result.statistics.message, "Configuration validation successful");
    assert.ok(result.outputDir.endsWith("dist"));
  });

  it("handles named export from string configuration", async () => {
    const configString = `
			export const production = {
				entry: "./src/prod.js",
				output: "./dist/prod",
				assets: []
			};
			export default { entry: "./src/dev.js", assets: [] };
		`;

    const result = await generateBinaryExecutable(configString, {
      validate: true,
      exportName: "production",
    });

    assert.strictEqual(result.executable, "");
    assert.strictEqual(result.statistics.message, "Configuration validation successful");
    assert.ok(result.outputDir.endsWith("dist"));
  });

  it("handles object configuration input", async () => {
    const config = {
      entry: "./src/server.js",
      output: "./dist/myapp",
      bundles: { "/app.js": "./src/client.js" },
      assets: [],
    };

    const result = await generateBinaryExecutable(config, { validate: true });

    assert.strictEqual(result.executable, "");
    assert.strictEqual(result.statistics.message, "Configuration validation successful");
    assert.ok(result.outputDir.endsWith("dist"));
  });

  it("handles BinaryConfig instance input", async () => {
    const config = new BinaryConfig({
      entry: "./src/server.js",
      output: "./dist/myapp",
    });

    const result = await generateBinaryExecutable(config, { validate: true });

    assert.strictEqual(result.executable, "");
    assert.strictEqual(result.statistics.message, "Configuration validation successful");
    assert.ok(result.outputDir.endsWith("dist"));
  });

  it("handles function configuration input", async () => {
    const configFunction = async () => ({
      entry: "./src/server.js",
      output: "./dist/myapp",
      assets: [],
    });

    const result = await generateBinaryExecutable(configFunction, {
      validate: true,
    });

    assert.strictEqual(result.executable, "");
    assert.strictEqual(result.statistics.message, "Configuration validation successful");
    assert.ok(result.outputDir.endsWith("dist"));
  });

  it("uses custom output directory when provided", async () => {
    const config = {
      entry: "./src/server.js",
      assets: [],
    };

    const customOutputDir = "/custom/output";
    const result = await generateBinaryExecutable(config, {
      validate: true,
      outputDir: customOutputDir,
    });

    assert.strictEqual(result.outputDir, customOutputDir);
  });

  it("derives output directory from config when not provided", async () => {
    const config = {
      entry: "./src/server.js",
      output: "./build/myapp",
      assets: [],
    };

    const result = await generateBinaryExecutable(config, { validate: true });

    assert.ok(result.outputDir.endsWith("build"));
  });

  it("creates output directory if it doesn't exist (mkdirp behavior)", async () => {
    // Create temporary test directory structure
    const testDir = mkdtempSync(join(tmpdir(), "fledge-binary-mkdirp-test-"));
    const missingDir = join(testDir, "missing", "nested", "dirs");
    const outputPath = join(missingDir, "myapp");

    const config = {
      entry: "./src/server.js",
      output: outputPath,
      assets: [],
    };

    // Directory should not exist initially
    assert.throws(() => {
      statSync(missingDir);
    }, /ENOENT/);

    // In validation mode, should still create the directory
    const result = await generateBinaryExecutable(config, { validate: true });

    // Should have created directory
    assert.strictEqual(result.executable, "");
    assert.ok(result.outputDir.includes("missing/nested/dirs"));
  });

  it("throws error for invalid configuration input type", async () => {
    await assert.rejects(async () => await generateBinaryExecutable(null), {
      name: "Error",
      message: /Failed to parse configuration/,
    });
  });

  it("throws error for invalid configuration content", async () => {
    const invalidConfig = {
      // Missing required 'entry' field
      output: "./dist/app",
    };

    await assert.rejects(async () => await generateBinaryExecutable(invalidConfig, { validate: true }), {
      name: "Error",
      message: /Failed to parse configuration/,
    });
  });
});

describe("createBinaryConfigFromFlags", () => {
  it("creates config from minimal flags", async () => {
    const flags = {
      entry: "./src/server.js",
    };

    const config = await createBinaryConfigFromFlags(flags);

    assert.strictEqual(config.getEntry(), "./src/server.js");
    assert.strictEqual(config.getOutput(), "server"); // Auto-derived
    assert.deepStrictEqual(config.getBundles(), {});
    assert.deepStrictEqual(config.getAssets().getFiles(), []);
    const envVars = config.getEnvironment().getVariables();
    assert.strictEqual(Object.keys(envVars).length, 0);
  });

  it("creates config with explicit output", async () => {
    const flags = {
      entry: "./src/server.js",
      output: "./dist/myapp",
    };

    const config = await createBinaryConfigFromFlags(flags);

    assert.strictEqual(config.getEntry(), "./src/server.js");
    assert.strictEqual(config.getOutput(), "./dist/myapp");
  });

  it("creates config with all optional flags", async () => {
    const flags = {
      entry: "./src/server.js",
      output: "./dist/myapp",
      bundles: {
        "/app.js": "./src/client.js",
        "/admin.js": "./src/admin.js",
      },
      assets: [], // Empty array to avoid filesystem checks
      env: {
        NODE_ENV: "production",
        DEBUG: "false",
      },
      sea: {
        useCodeCache: false,
        disableExperimentalSEAWarning: true,
      },
      signing: {
        enabled: false,
        identity: "Test Identity",
      },
    };

    const config = await createBinaryConfigFromFlags(flags);

    assert.strictEqual(config.getEntry(), "./src/server.js");
    assert.strictEqual(config.getOutput(), "./dist/myapp");
    assert.deepStrictEqual(config.getBundles(), {
      "/app.js": "./src/client.js",
      "/admin.js": "./src/admin.js",
    });
    assert.deepStrictEqual(config.getAssets().getFiles(), []);

    const envVars = config.getEnvironment().getVariables();
    assert.strictEqual(envVars.NODE_ENV, "production");
    assert.strictEqual(envVars.DEBUG, "false");

    assert.deepStrictEqual(config.getSea(), {
      useCodeCache: false,
      disableExperimentalSEAWarning: true,
    });
    assert.deepStrictEqual(config.getSigning(), {
      enabled: false,
      identity: "Test Identity",
    });
  });

  it("applies default values for optional flags", async () => {
    const flags = {
      entry: "./src/server.js",
      // All other flags undefined
    };

    const config = await createBinaryConfigFromFlags(flags);

    assert.strictEqual(config.getEntry(), "./src/server.js");
    assert.deepStrictEqual(config.getBundles(), {});
    assert.deepStrictEqual(config.getAssets().getFiles(), []);
    const envVars = config.getEnvironment().getVariables();
    assert.strictEqual(Object.keys(envVars).length, 0);
    assert.deepStrictEqual(config.getSea(), {
      useCodeCache: true, // BinaryConfig default
      disableExperimentalSEAWarning: true, // BinaryConfig default
    });

    // Platform-specific signing default
    const signingConfig = config.getSigning();
    if (process.platform === "darwin") {
      assert.strictEqual(signingConfig.enabled, true);
    } else {
      assert.strictEqual(signingConfig.enabled, false);
    }
  });

  it("throws error for missing entry flag", async () => {
    const flags = {
      output: "./dist/app",
      // Missing required 'entry' field
    };

    await assert.rejects(async () => await createBinaryConfigFromFlags(flags), {
      name: "Error",
      message: "Entry point is required (--entry)",
    });
  });

  it("throws error for null flags", async () => {
    await assert.rejects(async () => await createBinaryConfigFromFlags(null), {
      name: "Error",
      message: "Entry point is required (--entry)",
    });
  });

  it("throws error for empty flags object", async () => {
    await assert.rejects(async () => await createBinaryConfigFromFlags({}), {
      name: "Error",
      message: "Entry point is required (--entry)",
    });
  });
});

describe("parseConfigInput integration", () => {
  it("handles edge case configuration inputs", async () => {
    // Test empty string (should be treated as file path)
    await assert.rejects(async () => await generateBinaryExecutable("", { validate: true }), {
      name: "Error",
      message: /Failed to parse configuration/,
    });

    // Test invalid object structure
    await assert.rejects(async () => await generateBinaryExecutable({ invalid: true }, { validate: true }), {
      name: "Error",
      message: /Failed to parse configuration/,
    });

    // Test function that returns invalid config
    const invalidConfigFunction = async () => ({
      output: "./dist/app", // Missing entry
    });

    await assert.rejects(
      async () =>
        await generateBinaryExecutable(invalidConfigFunction, {
          validate: true,
        }),
      {
        name: "Error",
        message: /Failed to parse configuration/,
      }
    );
  });

  it("preserves BinaryConfig instances without re-parsing", async () => {
    const originalConfig = new BinaryConfig({
      entry: "./src/server.js",
      output: "./dist/myapp",
    });

    const result = await generateBinaryExecutable(originalConfig, {
      validate: true,
    });

    assert.strictEqual(result.executable, "");
    assert.strictEqual(result.statistics.message, "Configuration validation successful");
    assert.ok(result.outputDir.endsWith("dist"));
  });
});
