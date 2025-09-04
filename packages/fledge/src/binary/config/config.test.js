/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for BinaryConfig class.
 */

import assert from "node:assert";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { Assets } from "../../script/config/assets.js";
import { Environment } from "../../script/config/environment.js";
import { Metadata } from "../../script/config/metadata.js";
import { BinaryConfig } from "./config.js";

describe("BinaryConfig constructor", () => {
	it("creates config with minimal required fields", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
		});

		assert.strictEqual(config.getEntry(), "./src/server.js");
		assert.strictEqual(config.getOutput(), "server"); // Auto-derived from entry
		assert.deepStrictEqual(config.getBundles(), {});
		assert.ok(config.getAssets() instanceof Assets);
		assert.ok(config.getEnvironment() instanceof Environment);
		assert.ok(config.getMetadata() instanceof Metadata);
	});

	it("creates config with explicit output", () => {
		const config = new BinaryConfig({
			entry: "./src/app.js",
			output: "./dist/myapp",
		});

		assert.strictEqual(config.getEntry(), "./src/app.js");
		assert.strictEqual(config.getOutput(), "./dist/myapp");
	});

	it("creates config with all optional fields", () => {
		const assets = new Assets(["./public/style.css"]);
		const env = new Environment({ NODE_ENV: "production" });
		const metadata = new Metadata({ name: "Test App" });

		const config = new BinaryConfig({
			entry: "./src/server.js",
			output: "./dist/server",
			bundles: {
				"/app.js": "./src/client.js",
				"/admin.js": "./src/admin.js",
			},
			assets,
			env,
			metadata,
			sea: {
				useCodeCache: false,
				customOption: true,
			},
			signing: {
				enabled: false,
				identity: "My Company",
			},
		});

		assert.strictEqual(config.getEntry(), "./src/server.js");
		assert.strictEqual(config.getOutput(), "./dist/server");
		assert.deepStrictEqual(config.getBundles(), {
			"/app.js": "./src/client.js",
			"/admin.js": "./src/admin.js",
		});
		assert.strictEqual(config.getAssets(), assets);
		assert.strictEqual(config.getEnvironment(), env);
		assert.strictEqual(config.getMetadata(), metadata);
		assert.deepStrictEqual(config.getSea(), {
			useCodeCache: false,
			disableExperimentalSEAWarning: true, // Default merged
			customOption: true,
		});
		assert.deepStrictEqual(config.getSigning(), {
			enabled: false,
			identity: "My Company",
		});
	});

	it("auto-derives output from entry basename", () => {
		const testCases = [
			{ entry: "./src/server.js", expected: "server" },
			{ entry: "app.mjs", expected: "app" },
			{ entry: "/path/to/main.ts", expected: "main" },
			{ entry: "simple", expected: "simple" },
			{ entry: "./nested/file.min.js", expected: "file.min" }, // Only removes final extension
			{ entry: "no-extension", expected: "no-extension" },
		];

		for (const { entry, expected } of testCases) {
			const config = new BinaryConfig({ entry });
			assert.strictEqual(
				config.getOutput(),
				expected,
				`Entry "${entry}" should derive output "${expected}"`,
			);
		}
	});

	it("handles edge case entry paths", () => {
		const edgeCases = [
			{ entry: "./", expected: "app" }, // Empty basename fallback
			{ entry: ".", expected: "app" }, // Current dir fallback
			{ entry: ".hidden.js", expected: ".hidden" }, // Hidden file
		];

		for (const { entry, expected } of edgeCases) {
			const config = new BinaryConfig({ entry });
			assert.strictEqual(
				config.getOutput(),
				expected,
				`Entry "${entry}" should derive output "${expected}"`,
			);
		}
	});

	it("applies default SEA configuration", () => {
		const config = new BinaryConfig({ entry: "./test.js" });
		const seaConfig = config.getSea();

		assert.strictEqual(seaConfig.useCodeCache, true);
		assert.strictEqual(seaConfig.disableExperimentalSEAWarning, true);
	});

	it("merges custom SEA configuration with defaults", () => {
		const config = new BinaryConfig({
			entry: "./test.js",
			sea: {
				useCodeCache: false,
				customFlag: "value",
			},
		});

		const seaConfig = config.getSea();
		assert.strictEqual(seaConfig.useCodeCache, false); // Overridden
		assert.strictEqual(seaConfig.disableExperimentalSEAWarning, true); // Default preserved
		assert.strictEqual(seaConfig.customFlag, "value"); // Custom added
	});

	it("applies platform-aware signing defaults", () => {
		const config = new BinaryConfig({ entry: "./test.js" });
		const signingConfig = config.getSigning();

		// Should auto-enable on macOS (current platform in test environment)
		if (process.platform === "darwin") {
			assert.strictEqual(signingConfig.enabled, true);
		} else {
			assert.strictEqual(signingConfig.enabled, false);
		}
		assert.strictEqual(signingConfig.identity, undefined);
	});

	it("merges custom signing configuration", () => {
		const config = new BinaryConfig({
			entry: "./test.js",
			signing: {
				enabled: false,
				identity: "Custom Identity",
			},
		});

		const signingConfig = config.getSigning();
		assert.strictEqual(signingConfig.enabled, false); // Overridden
		assert.strictEqual(signingConfig.identity, "Custom Identity");
	});

	it("creates default Assets instance when not provided", () => {
		const config = new BinaryConfig({ entry: "./test.js" });
		const assets = config.getAssets();

		assert.ok(assets instanceof Assets);
		assert.deepStrictEqual(assets.getFiles(), []);
	});

	it("creates default Environment instance when not provided", () => {
		const config = new BinaryConfig({ entry: "./test.js" });
		const env = config.getEnvironment();

		assert.ok(env instanceof Environment);
		assert.deepStrictEqual(env.getVariables(), {});
	});

	it("creates default Metadata instance when not provided", () => {
		const config = new BinaryConfig({ entry: "./test.js" });
		const metadata = config.getMetadata();

		assert.ok(metadata instanceof Metadata);
	});

	it("throws error for invalid configuration", () => {
		assert.throws(() => new BinaryConfig({}), {
			name: "Error",
			message: /Configuration must specify 'entry'/,
		});
	});
});

describe("BinaryConfig platform information", () => {
	it("returns current platform", () => {
		const config = new BinaryConfig({ entry: "./test.js" });
		assert.strictEqual(config.getPlatform(), process.platform);
	});

	it("returns current architecture", () => {
		const config = new BinaryConfig({ entry: "./test.js" });
		assert.strictEqual(config.getArchitecture(), process.arch);
	});

	it("returns platform-architecture target", () => {
		const config = new BinaryConfig({ entry: "./test.js" });
		const expected = `${process.platform}-${process.arch}`;
		assert.strictEqual(config.getPlatformTarget(), expected);
	});
});

describe("BinaryConfig.fromString", () => {
	it("creates config from valid configuration string", async () => {
		const configString = `export default {
			entry: "./src/server.js",
			output: "./dist/myapp",
			bundles: { "/app.js": "./src/client.js" },
			sea: { useCodeCache: false }
		}`;

		const config = await BinaryConfig.fromString(configString);

		assert.strictEqual(config.getEntry(), "./src/server.js");
		assert.strictEqual(config.getOutput(), "./dist/myapp");
		assert.deepStrictEqual(config.getBundles(), {
			"/app.js": "./src/client.js",
		});
		assert.strictEqual(config.getSea().useCodeCache, false);
	});

	it("creates config from named export", async () => {
		const configString = `
			export const production = {
				entry: "./src/prod.js",
				signing: { enabled: false }
			};
			export default { entry: "./src/dev.js" };
		`;

		const config = await BinaryConfig.fromString(configString, "production");

		assert.strictEqual(config.getEntry(), "./src/prod.js");
		assert.strictEqual(config.getSigning().enabled, false);
	});

	it("resolves complex configuration objects", async () => {
		const configString = `export default {
			entry: "./src/server.js",
			assets: [], // Use empty array to avoid file system checks
			env: { NODE_ENV: "production", DEBUG: "false" },
			metadata: { name: "Test App", version: "1.0.0" }
		}`;

		const config = await BinaryConfig.fromString(configString);

		assert.strictEqual(config.getEntry(), "./src/server.js");
		assert.deepStrictEqual(config.getAssets().getFiles(), []);
		const envVars = config.getEnvironment().getVariables();
		assert.strictEqual(envVars.NODE_ENV, "production");
		assert.strictEqual(envVars.DEBUG, "false");
		assert.strictEqual(Object.keys(envVars).length, 2);
	});

	it("throws error for invalid configuration string", async () => {
		await assert.rejects(
			async () => await BinaryConfig.fromString("invalid javascript {"),
			{
				name: "Error",
				message: /Failed to parse configuration string/,
			},
		);
	});

	it("throws error for configuration validation failure", async () => {
		const configString = `export default { output: "./dist/app" }`; // Missing entry

		await assert.rejects(
			async () => await BinaryConfig.fromString(configString),
			{
				name: "Error",
				message: /Configuration must specify 'entry'/,
			},
		);
	});
});

describe("BinaryConfig.fromFile", () => {
	// Create temporary config files for testing
	const testDir = mkdtempSync(join(tmpdir(), "fledge-binary-config-test-"));
	const configPath = join(testDir, "test.config.mjs");
	const namedConfigPath = join(testDir, "named.config.mjs");
	const complexConfigPath = join(testDir, "complex.config.mjs");

	writeFileSync(
		configPath,
		`export default {
			entry: "./src/server.js",
			output: "./dist/server",
			bundles: { "/app.js": "./src/client.js" }
		}`,
	);

	writeFileSync(
		namedConfigPath,
		`export const productionConfig = {
			entry: "./src/prod.js",
			signing: { enabled: true }
		};
		export default { entry: "./src/dev.js" };`,
	);

	writeFileSync(
		complexConfigPath,
		`export default {
			entry: "./src/server.js",
			assets: [], // Empty array to avoid file system checks
			env: { NODE_ENV: "production" },
			metadata: { name: "Complex App" },
			sea: { useCodeCache: false },
			signing: { enabled: false, identity: "Test Identity" }
		}`,
	);

	it("creates config from valid configuration file", async () => {
		const config = await BinaryConfig.fromFile(configPath);

		assert.strictEqual(config.getEntry(), "./src/server.js");
		assert.strictEqual(config.getOutput(), "./dist/server");
		assert.deepStrictEqual(config.getBundles(), {
			"/app.js": "./src/client.js",
		});
	});

	it("creates config from named export", async () => {
		const config = await BinaryConfig.fromFile(
			namedConfigPath,
			"productionConfig",
		);

		assert.strictEqual(config.getEntry(), "./src/prod.js");
		assert.strictEqual(config.getSigning().enabled, true);
	});

	it("resolves complex configuration with all fields", async () => {
		const config = await BinaryConfig.fromFile(complexConfigPath);

		assert.strictEqual(config.getEntry(), "./src/server.js");
		assert.deepStrictEqual(config.getAssets().getFiles(), []);
		const envVars = config.getEnvironment().getVariables();
		assert.strictEqual(envVars.NODE_ENV, "production");
		assert.strictEqual(Object.keys(envVars).length, 1);
		assert.strictEqual(config.getSea().useCodeCache, false);
		assert.deepStrictEqual(config.getSigning(), {
			enabled: false,
			identity: "Test Identity",
		});
	});

	it("throws error for missing file", async () => {
		await assert.rejects(
			async () => await BinaryConfig.fromFile("./nonexistent.config.js"),
			{
				name: "Error",
				message: /Configuration file not found/,
			},
		);
	});

	it("throws error for invalid configuration file", async () => {
		const invalidPath = join(testDir, "invalid.config.mjs");
		writeFileSync(invalidPath, `export default { output: "./dist/app" }`); // Missing entry

		await assert.rejects(async () => await BinaryConfig.fromFile(invalidPath), {
			name: "Error",
			message: /Configuration must specify 'entry'/,
		});
	});
});

describe("BinaryConfig.fromObject", () => {
	it("creates config from valid object", async () => {
		const configObject = {
			entry: "./src/server.js",
			output: "./dist/myapp",
			bundles: { "/app.js": "./src/client.js" },
		};

		const config = await BinaryConfig.fromObject(configObject);

		assert.strictEqual(config.getEntry(), "./src/server.js");
		assert.strictEqual(config.getOutput(), "./dist/myapp");
		assert.deepStrictEqual(config.getBundles(), {
			"/app.js": "./src/client.js",
		});
	});

	it("resolves assets from array", async () => {
		const configObject = {
			entry: "./src/server.js",
			assets: [], // Empty array to avoid file system checks
		};

		const config = await BinaryConfig.fromObject(configObject);

		assert.deepStrictEqual(config.getAssets().getFiles(), []);
	});

	it("resolves environment from object", async () => {
		const configObject = {
			entry: "./src/server.js",
			env: { NODE_ENV: "production", DEBUG: "true" },
		};

		const config = await BinaryConfig.fromObject(configObject);

		const envVars = config.getEnvironment().getVariables();
		assert.strictEqual(envVars.NODE_ENV, "production");
		assert.strictEqual(envVars.DEBUG, "true");
		assert.strictEqual(Object.keys(envVars).length, 2);
	});

	it("resolves metadata from object", async () => {
		const configObject = {
			entry: "./src/server.js",
			metadata: { name: "Test App", version: "2.0.0" },
		};

		const config = await BinaryConfig.fromObject(configObject);

		// Metadata resolution creates new instance, check it exists
		assert.ok(config.getMetadata() instanceof Metadata);
	});

	it("handles pre-resolved instances", async () => {
		const assets = new Assets([]);
		const env = new Environment({ TEST: "value" });
		const metadata = new Metadata({ name: "Pre-resolved" });

		const configObject = {
			entry: "./src/server.js",
			assets,
			env,
			metadata,
		};

		const config = await BinaryConfig.fromObject(configObject);

		// fromObject should preserve existing instances
		assert.strictEqual(config.getAssets(), assets);
		assert.strictEqual(config.getEnvironment(), env);
		assert.strictEqual(config.getMetadata(), metadata);
	});

	it("throws error for invalid object", async () => {
		await assert.rejects(
			async () => await BinaryConfig.fromObject({ output: "./dist/app" }), // Missing entry
			{
				name: "Error",
				message: /Configuration must specify 'entry'/,
			},
		);
	});
});

describe("BinaryConfig immutability", () => {
	it("returns immutable copies of configuration objects", () => {
		const config = new BinaryConfig({
			entry: "./src/server.js",
			bundles: { "/app.js": "./src/client.js" },
			sea: { useCodeCache: true },
			signing: { enabled: true },
		});

		// Get configuration objects
		const bundles1 = config.getBundles();
		const bundles2 = config.getBundles();
		const sea1 = config.getSea();
		const sea2 = config.getSea();
		const signing1 = config.getSigning();
		const signing2 = config.getSigning();

		// Should be different object instances (immutable copies)
		assert.notStrictEqual(bundles1, bundles2);
		assert.notStrictEqual(sea1, sea2);
		assert.notStrictEqual(signing1, signing2);

		// But should have same content
		assert.deepStrictEqual(bundles1, bundles2);
		assert.deepStrictEqual(sea1, sea2);
		assert.deepStrictEqual(signing1, signing2);

		// Modifying returned objects should not affect config
		bundles1["/new.js"] = "./src/new.js";
		sea1.newOption = true;
		signing1.newProperty = "value";

		// Original config should be unchanged
		assert.deepStrictEqual(config.getBundles(), {
			"/app.js": "./src/client.js",
		});
		assert.strictEqual(config.getSea().newOption, undefined);
		assert.strictEqual(config.getSigning().newProperty, undefined);
	});
});
