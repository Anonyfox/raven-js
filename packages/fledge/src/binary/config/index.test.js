/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for binary configuration module exports.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
	Assets,
	BinaryConfig,
	Environment,
	importConfigFromFile,
	importConfigFromString,
	Metadata,
	validateConfigObject,
} from "./index.js";

describe("Binary config module exports", () => {
	it("exports BinaryConfig class", () => {
		assert.strictEqual(typeof BinaryConfig, "function");
		assert.strictEqual(BinaryConfig.name, "BinaryConfig");

		// Verify it's a proper constructor
		const config = new BinaryConfig({ entry: "./test.js" });
		assert.ok(config instanceof BinaryConfig);
	});

	it("exports Assets class from script config", () => {
		assert.strictEqual(typeof Assets, "function");
		assert.strictEqual(Assets.name, "Assets");

		// Verify it's a proper constructor
		const assets = new Assets([]);
		assert.ok(assets instanceof Assets);
	});

	it("exports Environment class from script config", () => {
		assert.strictEqual(typeof Environment, "function");
		assert.strictEqual(Environment.name, "Environment");

		// Verify it's a proper constructor
		const env = new Environment({});
		assert.ok(env instanceof Environment);
	});

	it("exports Metadata class from script config", () => {
		assert.strictEqual(typeof Metadata, "function");
		assert.strictEqual(Metadata.name, "Metadata");

		// Verify it's a proper constructor/factory
		const metadata = new Metadata({ name: "test" });
		assert.ok(metadata instanceof Metadata);
	});

	it("exports importConfigFromString function", () => {
		assert.strictEqual(typeof importConfigFromString, "function");
		assert.strictEqual(importConfigFromString.name, "importConfigFromString");
	});

	it("exports importConfigFromFile function", () => {
		assert.strictEqual(typeof importConfigFromFile, "function");
		assert.strictEqual(importConfigFromFile.name, "importConfigFromFile");
	});

	it("exports validateConfigObject function", () => {
		assert.strictEqual(typeof validateConfigObject, "function");
		assert.strictEqual(validateConfigObject.name, "validateConfigObject");
	});
});

describe("Binary config module integration", () => {
	it("BinaryConfig integrates with imported utility functions", async () => {
		// Test that BinaryConfig can use the imported functions
		const configString = `export default {
			entry: "./src/server.js",
			output: "./dist/myapp"
		}`;

		// This should work without errors if imports are correct
		const config = await BinaryConfig.fromString(configString);

		assert.strictEqual(config.getEntry(), "./src/server.js");
		assert.strictEqual(config.getOutput(), "./dist/myapp");
	});

	it("BinaryConfig integrates with imported config classes", () => {
		const assets = new Assets(["./public/style.css"]);
		const env = new Environment({ NODE_ENV: "production" });
		const metadata = new Metadata({ name: "Test App" });

		const config = new BinaryConfig({
			entry: "./src/server.js",
			assets,
			env,
			metadata,
		});

		// Verify the instances are properly integrated
		assert.strictEqual(config.getAssets(), assets);
		assert.strictEqual(config.getEnvironment(), env);
		assert.strictEqual(config.getMetadata(), metadata);
	});

	it("validateConfigObject function works with BinaryConfig requirements", () => {
		// Valid config should not throw
		assert.doesNotThrow(() =>
			validateConfigObject({
				entry: "./src/server.js",
				output: "./dist/myapp",
				bundles: { "/app.js": "./src/client.js" },
				sea: { useCodeCache: true },
				signing: { enabled: true },
			}),
		);

		// Invalid config should throw
		assert.throws(
			() => validateConfigObject({ output: "./dist/myapp" }), // Missing entry
			{
				name: "Error",
				message: /Configuration must specify 'entry'/,
			},
		);
	});
});

describe("Binary config module re-exports", () => {
	it("Assets re-export has same interface as script config", async () => {
		// Test that re-exported Assets works the same as direct import
		const directAssets = await import("../../script/config/assets.js");

		// Should be the same class
		assert.strictEqual(Assets, directAssets.Assets);

		// Should work identically
		const assets1 = new Assets(["./test.css"]);
		const assets2 = new directAssets.Assets(["./test.css"]);

		assert.deepStrictEqual(assets1.getFiles(), assets2.getFiles());
	});

	it("Environment re-export has same interface as script config", async () => {
		// Test that re-exported Environment works the same as direct import
		const directEnv = await import("../../script/config/environment.js");

		// Should be the same class
		assert.strictEqual(Environment, directEnv.Environment);

		// Should work identically
		const env1 = new Environment({ TEST: "value" });
		const env2 = new directEnv.Environment({ TEST: "value" });

		assert.deepStrictEqual(env1.getVariables(), env2.getVariables());
	});

	it("Metadata re-export has same interface as script config", async () => {
		// Test that re-exported Metadata works the same as direct import
		const directMetadata = await import("../../script/config/metadata.js");

		// Should be the same class
		assert.strictEqual(Metadata, directMetadata.Metadata);

		// Should work identically
		const meta1 = new Metadata({ name: "test" });
		const meta2 = new directMetadata.Metadata({ name: "test" });

		// Both should be Metadata instances
		assert.ok(meta1 instanceof Metadata);
		assert.ok(meta2 instanceof directMetadata.Metadata);
	});
});

describe("Binary config module completeness", () => {
	it("exports all required classes and functions", async () => {
		const expectedExports = [
			"Assets",
			"BinaryConfig",
			"Environment",
			"Metadata",
			"importConfigFromFile",
			"importConfigFromString",
			"validateConfigObject",
		];

		const moduleExports = await import("./index.js");

		for (const exportName of expectedExports) {
			assert.ok(exportName in moduleExports, `Missing export: ${exportName}`);
			assert.ok(
				moduleExports[exportName] !== undefined,
				`Export ${exportName} is undefined`,
			);
		}
	});

	it("does not export unexpected symbols", async () => {
		const moduleExports = await import("./index.js");
		const exportNames = Object.keys(moduleExports);

		const expectedExports = [
			"Assets",
			"BinaryConfig",
			"Environment",
			"Metadata",
			"importConfigFromFile",
			"importConfigFromString",
			"validateConfigObject",
		];

		// Check that we don't have extra exports
		for (const exportName of exportNames) {
			assert.ok(
				expectedExports.includes(exportName),
				`Unexpected export: ${exportName}`,
			);
		}

		// Should have exactly the expected number of exports
		assert.strictEqual(
			exportNames.length,
			expectedExports.length,
			`Expected ${expectedExports.length} exports, got ${exportNames.length}`,
		);
	});
});
