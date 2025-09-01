/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for ScriptConfig class.
 */

import assert from "node:assert";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { ScriptConfig } from "./config.js";

describe("ScriptConfig", () => {
	describe("constructor", () => {
		it("creates config with minimal required fields", () => {
			const config = new ScriptConfig({
				entry: "./src/app.js",
				output: "./dist/app.js",
			});

			assert.strictEqual(config.getEntry(), "./src/app.js");
			assert.strictEqual(config.getOutput(), "./dist/app.js");
			assert.strictEqual(config.getFormat(), "cjs");
			assert.deepStrictEqual(config.getNodeFlags(), ["--experimental-sqlite"]);
			assert.deepStrictEqual(config.getBundles(), {});
		});

		it("creates config with all optional fields", () => {
			const config = new ScriptConfig({
				entry: "./src/server.js",
				output: "./dist/bundle.js",
				format: "esm",
				nodeFlags: ["--max-old-space-size=4096"],
				bundles: {
					"/app.js": "./src/frontend.js",
				},
			});

			assert.strictEqual(config.getEntry(), "./src/server.js");
			assert.strictEqual(config.getOutput(), "./dist/bundle.js");
			assert.strictEqual(config.getFormat(), "esm");
			assert.deepStrictEqual(config.getNodeFlags(), [
				"--experimental-sqlite",
				"--max-old-space-size=4096",
			]);
			assert.deepStrictEqual(config.getBundles(), {
				"/app.js": "./src/frontend.js",
			});
		});

		it("throws error for missing entry field", () => {
			assert.throws(() => new ScriptConfig({ output: "./dist/app.js" }), {
				name: "Error",
				message: "Configuration must specify 'entry' as a string",
			});
		});

		it("throws error for missing output field", () => {
			assert.throws(() => new ScriptConfig({ entry: "./src/app.js" }), {
				name: "Error",
				message: "Configuration must specify 'output' as a string",
			});
		});

		it("throws error for invalid format", () => {
			assert.throws(
				() =>
					new ScriptConfig({
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
	});

	describe("fromString", () => {
		it("creates config from valid configuration string", async () => {
			const configString = `export default {
				entry: "./src/app.js",
				output: "./dist/app.js",
				format: "esm"
			}`;

			const config = await ScriptConfig.fromString(configString);

			assert.strictEqual(config.getEntry(), "./src/app.js");
			assert.strictEqual(config.getOutput(), "./dist/app.js");
			assert.strictEqual(config.getFormat(), "esm");
		});

		it("creates config from named export in string", async () => {
			const configString = `
				export const buildConfig = {
					entry: "./src/build.js",
					output: "./dist/build.js",
					format: "cjs"
				};
			`;

			const config = await ScriptConfig.fromString(configString, "buildConfig");

			assert.strictEqual(config.getEntry(), "./src/build.js");
			assert.strictEqual(config.getOutput(), "./dist/build.js");
			assert.strictEqual(config.getFormat(), "cjs");
		});

		it("throws error for invalid configuration string", async () => {
			await assert.rejects(
				async () => await ScriptConfig.fromString("invalid javascript"),
				{
					name: "Error",
					message: /Failed to parse configuration string/,
				},
			);
		});
	});

	describe("fromFile", () => {
		// Create temporary config file for testing
		const testDir = mkdtempSync(join(tmpdir(), "fledge-script-config-test-"));
		const configPath = join(testDir, "script.config.mjs");
		const namedConfigPath = join(testDir, "named.config.mjs");

		// Valid config file
		writeFileSync(
			configPath,
			`export default {
				entry: "./src/server.js",
				output: "./dist/server.js",
				nodeFlags: ["--trace-warnings"]
			}`,
		);

		// Config file with named exports
		writeFileSync(
			namedConfigPath,
			`export const devConfig = {
				entry: "./src/dev.js",
				output: "./dist/dev.js",
				format: "esm"
			};`,
		);

		it("creates config from valid file", async () => {
			const config = await ScriptConfig.fromFile(configPath);

			assert.strictEqual(config.getEntry(), "./src/server.js");
			assert.strictEqual(config.getOutput(), "./dist/server.js");
			const flags = config.getNodeFlags();
			assert.ok(flags.includes("--experimental-sqlite"));
			assert.ok(flags.includes("--trace-warnings"));
		});

		it("creates config from named export in file", async () => {
			const config = await ScriptConfig.fromFile(namedConfigPath, "devConfig");

			assert.strictEqual(config.getEntry(), "./src/dev.js");
			assert.strictEqual(config.getOutput(), "./dist/dev.js");
			assert.strictEqual(config.getFormat(), "esm");
		});

		it("throws error for missing file", async () => {
			await assert.rejects(
				async () => await ScriptConfig.fromFile("./nonexistent.config.js"),
				{
					name: "Error",
					message: "Configuration file not found: ./nonexistent.config.js",
				},
			);
		});
	});

	describe("fromObject", () => {
		it("creates config from object", async () => {
			const configObject = {
				entry: "./src/app.js",
				output: "./dist/app.js",
				format: "cjs",
			};

			const config = await ScriptConfig.fromObject(configObject);

			assert.strictEqual(config.getEntry(), "./src/app.js");
			assert.strictEqual(config.getOutput(), "./dist/app.js");
			assert.strictEqual(config.getFormat(), "cjs");
		});
	});

	describe("getters", () => {
		const config = new ScriptConfig({
			entry: "./src/main.js",
			output: "./dist/main.js",
			format: "esm",
			nodeFlags: ["--trace-warnings"],
			bundles: { "/client.js": "./src/client.js" },
		});

		it("returns entry point", () => {
			assert.strictEqual(config.getEntry(), "./src/main.js");
		});

		it("returns output path", () => {
			assert.strictEqual(config.getOutput(), "./dist/main.js");
		});

		it("returns format", () => {
			assert.strictEqual(config.getFormat(), "esm");
		});

		it("returns node flags with defaults", () => {
			const flags = config.getNodeFlags();
			assert.ok(flags.includes("--experimental-sqlite"));
			assert.ok(flags.includes("--trace-warnings"));
		});

		it("returns bundles", () => {
			assert.deepStrictEqual(config.getBundles(), {
				"/client.js": "./src/client.js",
			});
		});

		it("returns assets instance", () => {
			const assets = config.getAssets();
			assert.ok(assets);
			assert.strictEqual(typeof assets.getFiles, "function");
		});

		it("returns environment instance", () => {
			const env = config.getEnvironment();
			assert.ok(env);
			assert.strictEqual(typeof env.getVariables, "function");
		});

		it("returns metadata instance", () => {
			const metadata = config.getMetadata();
			assert.ok(metadata);
			assert.strictEqual(typeof metadata.getName, "function");
		});
	});
});
