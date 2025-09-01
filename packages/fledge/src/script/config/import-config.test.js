/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for configuration import functions.
 */

import assert from "node:assert";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
	importConfigFromFile,
	importConfigFromString,
	validateConfigObject,
} from "./import-config.js";

describe("importConfigFromString", () => {
	it("imports valid configuration from string", async () => {
		const configString = `export default {
			entry: "./src/app.js",
			output: "./dist/app.js",
			format: "esm"
		}`;

		const config = await importConfigFromString(configString);

		assert.strictEqual(config.entry, "./src/app.js");
		assert.strictEqual(config.output, "./dist/app.js");
		assert.strictEqual(config.format, "esm");
	});

	it("imports configuration with named exports", async () => {
		const configString = `
			export const myConfig = {
				entry: "./src/main.js",
				output: "./dist/main.js"
			};
			export default { other: "config" };
		`;

		// Test default export
		const defaultConfig = await importConfigFromString(configString);
		assert.strictEqual(defaultConfig.other, "config");

		// Test named export
		const namedConfig = await importConfigFromString(configString, "myConfig");
		assert.strictEqual(namedConfig.entry, "./src/main.js");
		assert.strictEqual(namedConfig.output, "./dist/main.js");
	});

	it("throws error for missing named export", async () => {
		const configString = `export default { entry: "./src/app.js", output: "./dist/app.js" }`;

		await assert.rejects(
			async () => await importConfigFromString(configString, "missingExport"),
			{
				name: "Error",
				message: /Export 'missingExport' not found in configuration string/,
			},
		);
	});

	it("throws error for empty string", async () => {
		await assert.rejects(async () => await importConfigFromString(""), {
			name: "Error",
			message: "Configuration string cannot be empty",
		});
	});

	it("throws error for whitespace-only string", async () => {
		await assert.rejects(
			async () => await importConfigFromString("   \n\t  "),
			{
				name: "Error",
				message: "Configuration string cannot be whitespace only",
			},
		);
	});

	it("throws error for invalid JavaScript", async () => {
		await assert.rejects(
			async () => await importConfigFromString("invalid javascript syntax {"),
			{
				name: "Error",
				message: /Failed to parse configuration string/,
			},
		);
	});

	it("throws error for non-object export", async () => {
		await assert.rejects(
			async () =>
				await importConfigFromString("export default 'not an object'"),
			{
				name: "Error",
				message: "Configuration must export an object",
			},
		);
	});
});

describe("importConfigFromFile", () => {
	// Create temporary config file for testing
	const testDir = mkdtempSync(join(tmpdir(), "fledge-import-config-test-"));
	const configPath = join(testDir, "test.config.mjs");
	const namedConfigPath = join(testDir, "named.config.mjs");

	writeFileSync(
		configPath,
		`export default {
			entry: "./src/server.js",
			output: "./dist/server.js",
			nodeFlags: ["--experimental-modules"]
		}`,
	);

	writeFileSync(
		namedConfigPath,
		`export const productionConfig = {
			entry: "./src/prod.js",
			output: "./dist/prod.js",
			format: "cjs"
		};
		export default { entry: "./src/dev.js", output: "./dist/dev.js" };`,
	);

	it("imports valid configuration file", async () => {
		const config = await importConfigFromFile(configPath);

		assert.strictEqual(config.entry, "./src/server.js");
		assert.strictEqual(config.output, "./dist/server.js");
		assert.deepStrictEqual(config.nodeFlags, ["--experimental-modules"]);
	});

	it("imports named export from configuration file", async () => {
		const config = await importConfigFromFile(
			namedConfigPath,
			"productionConfig",
		);

		assert.strictEqual(config.entry, "./src/prod.js");
		assert.strictEqual(config.output, "./dist/prod.js");
		assert.strictEqual(config.format, "cjs");
	});

	it("throws error for missing named export in file", async () => {
		await assert.rejects(
			async () => await importConfigFromFile(configPath, "missingExport"),
			{
				name: "Error",
				message: /Export 'missingExport' not found in/,
			},
		);
	});

	it("throws error for missing file", async () => {
		await assert.rejects(
			async () => await importConfigFromFile("./nonexistent.config.js"),
			{
				name: "Error",
				message: "Configuration file not found: ./nonexistent.config.js",
			},
		);
	});

	it("throws error for empty path", async () => {
		await assert.rejects(async () => await importConfigFromFile(""), {
			name: "Error",
			message: "Configuration file path cannot be empty",
		});
	});

	it("throws error for whitespace-only path", async () => {
		await assert.rejects(async () => await importConfigFromFile("   "), {
			name: "Error",
			message: "Configuration file path cannot be whitespace only",
		});
	});

	it("throws error for invalid JavaScript file", async () => {
		const invalidPath = join(testDir, "invalid.config.mjs");
		writeFileSync(invalidPath, "invalid javascript syntax {");

		await assert.rejects(async () => await importConfigFromFile(invalidPath), {
			name: "Error",
			message: /Failed to import configuration file/,
		});
	});

	it("throws error for non-object export file", async () => {
		const nonObjectPath = join(testDir, "non-object.config.mjs");
		writeFileSync(nonObjectPath, "export default 'not an object'");

		await assert.rejects(
			async () => await importConfigFromFile(nonObjectPath),
			{
				name: "Error",
				message: "Configuration must export an object",
			},
		);
	});
});

describe("validateConfigObject", () => {
	it("validates valid minimal configuration", () => {
		const config = {
			entry: "./src/app.js",
			output: "./dist/app.js",
		};

		assert.doesNotThrow(() => validateConfigObject(config));
	});

	it("validates configuration with all optional fields", () => {
		const config = {
			entry: "./src/app.js",
			output: "./dist/app.js",
			format: "esm",
			nodeFlags: ["--experimental-modules"],
			bundles: {
				"/app.js": "./src/frontend.js",
			},
			metadata: {
				name: "My App",
			},
		};

		assert.doesNotThrow(() => validateConfigObject(config));
	});

	it("throws error for null config", () => {
		assert.throws(() => validateConfigObject(null), {
			name: "Error",
			message: "Configuration must be an object",
		});
	});

	it("throws error for array config", () => {
		assert.throws(() => validateConfigObject([]), {
			name: "Error",
			message: "Configuration must be an object",
		});
	});

	it("throws error for primitive config", () => {
		assert.throws(() => validateConfigObject("string"), {
			name: "Error",
			message: "Configuration must be an object",
		});
	});

	it("throws error for missing entry field", () => {
		assert.throws(() => validateConfigObject({ output: "./dist/app.js" }), {
			name: "Error",
			message: "Configuration must specify 'entry' as a string",
		});
	});

	it("throws error for non-string entry field", () => {
		assert.throws(
			() => validateConfigObject({ entry: 123, output: "./dist/app.js" }),
			{
				name: "Error",
				message: "Configuration must specify 'entry' as a string",
			},
		);
	});

	it("throws error for missing output field", () => {
		assert.throws(() => validateConfigObject({ entry: "./src/app.js" }), {
			name: "Error",
			message: "Configuration must specify 'output' as a string",
		});
	});

	it("throws error for non-string output field", () => {
		assert.throws(
			() => validateConfigObject({ entry: "./src/app.js", output: 123 }),
			{
				name: "Error",
				message: "Configuration must specify 'output' as a string",
			},
		);
	});

	it("throws error for invalid format field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					output: "./dist/app.js",
					format: "invalid",
				}),
			{
				name: "Error",
				message: "Configuration 'format' must be 'cjs' or 'esm'",
			},
		);
	});

	it("throws error for non-array nodeFlags field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					output: "./dist/app.js",
					nodeFlags: "not-an-array",
				}),
			{
				name: "Error",
				message: "Configuration 'nodeFlags' must be an array",
			},
		);
	});

	it("throws error for non-string nodeFlags entries", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					output: "./dist/app.js",
					nodeFlags: [123],
				}),
			{
				name: "Error",
				message: "Configuration 'nodeFlags' must contain only strings",
			},
		);
	});

	it("throws error for non-object bundles field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					output: "./dist/app.js",
					bundles: "not-an-object",
				}),
			{
				name: "Error",
				message: "Configuration 'bundles' must be an object",
			},
		);
	});

	it("throws error for invalid bundles entries", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					output: "./dist/app.js",
					bundles: { "/app.js": 123 },
				}),
			{
				name: "Error",
				message: "Configuration 'bundles' must map strings to strings",
			},
		);
	});

	it("throws error for non-object metadata field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					output: "./dist/app.js",
					metadata: "not-an-object",
				}),
			{
				name: "Error",
				message: "Configuration 'metadata' must be an object",
			},
		);
	});
});
