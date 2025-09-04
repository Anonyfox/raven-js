/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for binary configuration import functions.
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
			entry: "./src/server.js",
			output: "./dist/myapp",
			bundles: { "/app.js": "./src/client.js" }
		}`;

		const config = await importConfigFromString(configString);

		assert.strictEqual(config.entry, "./src/server.js");
		assert.strictEqual(config.output, "./dist/myapp");
		assert.deepStrictEqual(config.bundles, { "/app.js": "./src/client.js" });
	});

	it("imports configuration with named exports", async () => {
		const configString = `
			export const production = {
				entry: "./src/prod.js",
				signing: { enabled: false }
			};
			export default { entry: "./src/dev.js" };
		`;

		// Test default export
		const defaultConfig = await importConfigFromString(configString);
		assert.strictEqual(defaultConfig.entry, "./src/dev.js");

		// Test named export
		const namedConfig = await importConfigFromString(
			configString,
			"production",
		);
		assert.strictEqual(namedConfig.entry, "./src/prod.js");
		assert.deepStrictEqual(namedConfig.signing, { enabled: false });
	});

	it("imports complex configuration with all fields", async () => {
		const configString = `export default {
			entry: "./src/server.js",
			output: "./dist/myapp",
			bundles: {
				"/app.js": "./src/client.js",
				"/admin.js": "./src/admin.js"
			},
			sea: {
				useCodeCache: false,
				disableExperimentalSEAWarning: false
			},
			signing: {
				enabled: true,
				identity: "Developer ID Application: Company"
			},
			metadata: {
				name: "My Binary App",
				version: "1.0.0"
			}
		}`;

		const config = await importConfigFromString(configString);

		assert.strictEqual(config.entry, "./src/server.js");
		assert.strictEqual(config.output, "./dist/myapp");
		assert.deepStrictEqual(config.bundles, {
			"/app.js": "./src/client.js",
			"/admin.js": "./src/admin.js",
		});
		assert.deepStrictEqual(config.sea, {
			useCodeCache: false,
			disableExperimentalSEAWarning: false,
		});
		assert.deepStrictEqual(config.signing, {
			enabled: true,
			identity: "Developer ID Application: Company",
		});
		assert.deepStrictEqual(config.metadata, {
			name: "My Binary App",
			version: "1.0.0",
		});
	});

	it("throws error for missing named export", async () => {
		const configString = `export default { entry: "./src/app.js" }`;

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

	it("throws error for null string", async () => {
		await assert.rejects(async () => await importConfigFromString(null), {
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

	it("throws error for null export", async () => {
		await assert.rejects(
			async () => await importConfigFromString("export default null"),
			{
				name: "Error",
				message: "Configuration must export an object",
			},
		);
	});

	it("throws error for missing default export", async () => {
		await assert.rejects(
			async () => await importConfigFromString("export const notDefault = {}"),
			{
				name: "Error",
				message: "Configuration must export a default object",
			},
		);
	});
});

describe("importConfigFromFile", () => {
	// Create temporary config files for testing
	const testDir = mkdtempSync(
		join(tmpdir(), "fledge-binary-import-config-test-"),
	);
	const configPath = join(testDir, "test.config.mjs");
	const namedConfigPath = join(testDir, "named.config.mjs");

	writeFileSync(
		configPath,
		`export default {
			entry: "./src/server.js",
			output: "./dist/server",
			bundles: { "/app.js": "./src/client.js" },
			sea: { useCodeCache: true }
		}`,
	);

	writeFileSync(
		namedConfigPath,
		`export const productionConfig = {
			entry: "./src/prod.js",
			output: "./dist/prod",
			signing: { enabled: true, identity: "My Company" }
		};
		export default { entry: "./src/dev.js", output: "./dist/dev" };`,
	);

	it("imports valid configuration file", async () => {
		const config = await importConfigFromFile(configPath);

		assert.strictEqual(config.entry, "./src/server.js");
		assert.strictEqual(config.output, "./dist/server");
		assert.deepStrictEqual(config.bundles, { "/app.js": "./src/client.js" });
		assert.deepStrictEqual(config.sea, { useCodeCache: true });
	});

	it("imports named export from configuration file", async () => {
		const config = await importConfigFromFile(
			namedConfigPath,
			"productionConfig",
		);

		assert.strictEqual(config.entry, "./src/prod.js");
		assert.strictEqual(config.output, "./dist/prod");
		assert.deepStrictEqual(config.signing, {
			enabled: true,
			identity: "My Company",
		});
	});

	it("imports default export when no export name specified", async () => {
		const config = await importConfigFromFile(namedConfigPath);

		assert.strictEqual(config.entry, "./src/dev.js");
		assert.strictEqual(config.output, "./dist/dev");
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

	it("throws error for null path", async () => {
		await assert.rejects(async () => await importConfigFromFile(null), {
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

	it("throws error for missing default export in file", async () => {
		const noDefaultPath = join(testDir, "no-default.config.mjs");
		writeFileSync(
			noDefaultPath,
			"export const config = { entry: './test.js' }",
		);

		await assert.rejects(
			async () => await importConfigFromFile(noDefaultPath),
			{
				name: "Error",
				message: "Configuration must export a default object",
			},
		);
	});
});

describe("validateConfigObject", () => {
	it("validates valid minimal configuration", () => {
		const config = {
			entry: "./src/server.js",
		};

		assert.doesNotThrow(() => validateConfigObject(config));
	});

	it("validates configuration with all optional fields", () => {
		const config = {
			entry: "./src/server.js",
			output: "./dist/myapp",
			bundles: {
				"/app.js": "./src/client.js",
				"/admin.js": "./src/admin.js",
			},
			sea: {
				useCodeCache: true,
				disableExperimentalSEAWarning: false,
			},
			signing: {
				enabled: true,
				identity: "Developer ID Application: Company",
			},
			metadata: {
				name: "My App",
				version: "1.0.0",
			},
		};

		assert.doesNotThrow(() => validateConfigObject(config));
	});

	it("validates configuration with undefined optional fields", () => {
		const config = {
			entry: "./src/server.js",
			output: undefined,
			bundles: undefined,
			sea: undefined,
			signing: undefined,
			metadata: undefined,
		};

		assert.doesNotThrow(() => validateConfigObject(config));
	});

	// Basic object validation
	it("throws error for null config", () => {
		assert.throws(() => validateConfigObject(null), {
			name: "Error",
			message: "Configuration must be an object",
		});
	});

	it("throws error for undefined config", () => {
		assert.throws(() => validateConfigObject(undefined), {
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

	// Entry field validation
	it("throws error for missing entry field", () => {
		assert.throws(() => validateConfigObject({}), {
			name: "Error",
			message: "Configuration must specify 'entry' as a string",
		});
	});

	it("throws error for non-string entry field", () => {
		assert.throws(() => validateConfigObject({ entry: 123 }), {
			name: "Error",
			message: "Configuration must specify 'entry' as a string",
		});
	});

	it("throws error for null entry field", () => {
		assert.throws(() => validateConfigObject({ entry: null }), {
			name: "Error",
			message: "Configuration must specify 'entry' as a string",
		});
	});

	// Output field validation
	it("throws error for non-string output field", () => {
		assert.throws(
			() => validateConfigObject({ entry: "./src/app.js", output: 123 }),
			{
				name: "Error",
				message: "Configuration 'output' must be a string",
			},
		);
	});

	it("throws error for null output field", () => {
		assert.throws(
			() => validateConfigObject({ entry: "./src/app.js", output: null }),
			{
				name: "Error",
				message: "Configuration 'output' must be a string",
			},
		);
	});

	// Bundles field validation
	it("throws error for non-object bundles field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					bundles: "not-an-object",
				}),
			{
				name: "Error",
				message: "Configuration 'bundles' must be an object",
			},
		);
	});

	it("throws error for array bundles field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					bundles: [],
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
					bundles: { "/app.js": 123 },
				}),
			{
				name: "Error",
				message: "Configuration 'bundles' must map strings to strings",
			},
		);
	});

	it("throws error for invalid bundles values", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					bundles: { "/app.js": 123 },
				}),
			{
				name: "Error",
				message: "Configuration 'bundles' must map strings to strings",
			},
		);
	});

	// SEA field validation
	it("throws error for non-object sea field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					sea: "not-an-object",
				}),
			{
				name: "Error",
				message: "Configuration 'sea' must be an object",
			},
		);
	});

	it("throws error for array sea field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					sea: [],
				}),
			{
				name: "Error",
				message: "Configuration 'sea' must be an object",
			},
		);
	});

	// Signing field validation
	it("throws error for non-object signing field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					signing: "not-an-object",
				}),
			{
				name: "Error",
				message: "Configuration 'signing' must be an object",
			},
		);
	});

	it("throws error for array signing field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					signing: [],
				}),
			{
				name: "Error",
				message: "Configuration 'signing' must be an object",
			},
		);
	});

	it("throws error for non-boolean signing.enabled", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					signing: { enabled: "true" },
				}),
			{
				name: "Error",
				message: "Configuration 'signing.enabled' must be a boolean",
			},
		);
	});

	it("throws error for invalid signing.identity type", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					signing: { identity: 123 },
				}),
			{
				name: "Error",
				message:
					"Configuration 'signing.identity' must be a string or undefined",
			},
		);
	});

	it("allows undefined signing.identity", () => {
		assert.doesNotThrow(() =>
			validateConfigObject({
				entry: "./src/app.js",
				signing: { enabled: true, identity: undefined },
			}),
		);
	});

	// Metadata field validation
	it("throws error for non-object metadata field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					metadata: "not-an-object",
				}),
			{
				name: "Error",
				message: "Configuration 'metadata' must be an object",
			},
		);
	});

	it("throws error for array metadata field", () => {
		assert.throws(
			() =>
				validateConfigObject({
					entry: "./src/app.js",
					metadata: [],
				}),
			{
				name: "Error",
				message: "Configuration 'metadata' must be an object",
			},
		);
	});
});
