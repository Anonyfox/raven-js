/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for script mode main function.
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { createConfigFromFlags, generateScriptBundle } from "./index.js";

describe("generateScriptBundle", () => {
	// Create test directory structure
	const testDir = mkdtempSync(join(tmpdir(), "fledge-script-index-test-"));
	const srcDir = join(testDir, "src");
	const outputDir = join(testDir, "dist");

	mkdirSync(srcDir);
	mkdirSync(outputDir);

	// Test entry file
	const entryFile = join(srcDir, "app.js");
	writeFileSync(
		entryFile,
		`
		console.log("Hello from script bundle!");
		export default function main() {
			return "Script running";
		}
	`,
	);

	// Test config file
	const configFile = join(testDir, "script.config.mjs");
	writeFileSync(
		configFile,
		`
		export default {
			entry: "${entryFile.replace(/\\/g, "/")}",
			output: "${join(outputDir, "app.js").replace(/\\/g, "/")}",
			format: "cjs"
		};
	`,
	);

	// Test asset file
	const assetFile = join(testDir, "data.json");
	writeFileSync(assetFile, JSON.stringify({ test: "data" }));

	describe("config input handling", () => {
		it("generates from config file path", async () => {
			const result = await generateScriptBundle(configFile, { write: false });

			assert.ok(typeof result.executable === "string");
			assert.ok(result.executable.length > 0);
			assert.ok(result.executable.startsWith("#!/usr/bin/env node"));
			assert.ok(result.executable.includes("Hello from script bundle!"));
			assert.ok(typeof result.statistics === "object");
			assert.ok(result.statistics.bundleSize > 0);
			assert.strictEqual(result.outputPath, undefined);
		});

		it("generates from config string", async () => {
			const configString = `
				export default {
					entry: "${entryFile.replace(/\\/g, "/")}",
					output: "${join(outputDir, "string-app.js").replace(/\\/g, "/")}",
					format: "esm"
				};
			`;

			const result = await generateScriptBundle(configString, { write: false });

			assert.ok(result.executable.includes("Hello from script bundle!"));
			assert.ok(result.statistics.bundleSize > 0);
		});

		it("generates from config object", async () => {
			const configObject = {
				entry: entryFile,
				output: join(outputDir, "object-app.js"),
				format: "cjs",
			};

			const result = await generateScriptBundle(configObject, { write: false });

			assert.ok(result.executable.includes("Hello from script bundle!"));
			assert.ok(result.statistics.bundleSize > 0);
		});

		it("generates from config function", async () => {
			const configFunction = async () => ({
				entry: entryFile,
				output: join(outputDir, "function-app.js"),
				format: "cjs",
			});

			const result = await generateScriptBundle(configFunction, {
				write: false,
			});

			assert.ok(result.executable.includes("Hello from script bundle!"));
			assert.ok(result.statistics.bundleSize > 0);
		});

		it("handles named exports", async () => {
			const namedConfigFile = join(testDir, "named.config.mjs");
			writeFileSync(
				namedConfigFile,
				`
				export const production = {
					entry: "${entryFile.replace(/\\/g, "/")}",
					output: "${join(outputDir, "named-app.js").replace(/\\/g, "/")}",
					format: "cjs"
				};
			`,
			);

			const result = await generateScriptBundle(namedConfigFile, {
				exportName: "production",
				write: false,
			});

			assert.ok(result.executable.includes("Hello from script bundle!"));
		});

		it("throws error for invalid config input", async () => {
			await assert.rejects(async () => await generateScriptBundle(123), {
				name: "Error",
				message: /Failed to parse configuration/,
			});
		});

		it("throws error for missing config file", async () => {
			await assert.rejects(
				async () => await generateScriptBundle("./nonexistent.js"),
				{
					name: "Error",
					message: /Failed to parse configuration/,
				},
			);
		});
	});

	describe("validation mode", () => {
		it("validates config without bundling", async () => {
			const result = await generateScriptBundle(configFile, {
				validate: true,
			});

			assert.strictEqual(result.executable, "");
			assert.strictEqual(result.statistics.bundleSize, 0);
			assert.strictEqual(result.statistics.assetCount, 0);
			assert.ok(result.statistics.message.includes("validation successful"));
		});

		it("validates config with assets", async () => {
			const configWithAssets = {
				entry: entryFile,
				output: join(outputDir, "validated-app.js"),
				assets: [assetFile],
			};

			const result = await generateScriptBundle(configWithAssets, {
				validate: true,
			});

			assert.strictEqual(result.executable, "");
			assert.strictEqual(result.statistics.assetCount, 1);
		});
	});

	describe("file writing", () => {
		it("writes executable file by default", async () => {
			const outputPath = join(outputDir, "written-app.js");
			const configObject = {
				entry: entryFile,
				output: outputPath,
			};

			const result = await generateScriptBundle(configObject);

			assert.strictEqual(result.outputPath, outputPath);
			assert.ok(
				readFileSync(outputPath, "utf8").includes("Hello from script bundle!"),
			);
		});

		it("skips writing when write=false", async () => {
			const result = await generateScriptBundle(configFile, { write: false });

			assert.strictEqual(result.outputPath, undefined);
		});
	});

	describe("error handling", () => {
		it("throws error for missing entry file", async () => {
			const badConfig = {
				entry: "./nonexistent.js",
				output: "./output.js",
			};

			await assert.rejects(async () => await generateScriptBundle(badConfig), {
				name: "Error",
				message: /Script bundling failed/,
			});
		});

		it("throws error for invalid config object", async () => {
			const badConfig = {
				// Missing required fields
				format: "cjs",
			};

			await assert.rejects(async () => await generateScriptBundle(badConfig), {
				name: "Error",
				message: /Failed to parse configuration/,
			});
		});
	});
});

describe("createConfigFromFlags", () => {
	// Create test files
	const testDir = mkdtempSync(join(tmpdir(), "fledge-script-flags-test-"));
	const entryFile = join(testDir, "main.js");
	const assetFile = join(testDir, "asset.txt");

	writeFileSync(entryFile, "console.log('test');");
	writeFileSync(assetFile, "test asset");

	describe("minimal flags", () => {
		it("creates config from required flags", async () => {
			const flags = {
				entry: entryFile,
				output: "./dist/app.js",
			};

			const config = await createConfigFromFlags(flags);

			assert.strictEqual(config.getEntry(), entryFile);
			assert.strictEqual(config.getOutput(), "./dist/app.js");
			assert.strictEqual(config.getFormat(), "cjs");
			assert.strictEqual(config.getAssets().getFiles().length, 0);
		});

		it("throws error for missing entry", async () => {
			const flags = {
				output: "./dist/app.js",
			};

			await assert.rejects(async () => await createConfigFromFlags(flags), {
				name: "Error",
				message: /Entry point is required/,
			});
		});

		it("throws error for missing output", async () => {
			const flags = {
				entry: entryFile,
			};

			await assert.rejects(async () => await createConfigFromFlags(flags), {
				name: "Error",
				message: /Output path is required/,
			});
		});
	});

	describe("optional flags", () => {
		it("creates config with all optional flags", async () => {
			const flags = {
				entry: entryFile,
				output: "./dist/app.js",
				format: "esm",
				assets: [assetFile],
				nodeFlags: ["--max-old-space-size=4096"],
				env: { NODE_ENV: "production" },
				bundles: { "/client.js": "./src/client.js" },
			};

			const config = await createConfigFromFlags(flags);

			assert.strictEqual(config.getFormat(), "esm");
			assert.strictEqual(config.getAssets().getFiles().length, 1);
			assert.ok(config.getNodeFlags().includes("--max-old-space-size=4096"));
			const envVars = config.getEnvironment().getVariables();
			assert.strictEqual(envVars.NODE_ENV, "production");
			assert.deepStrictEqual(config.getBundles(), {
				"/client.js": "./src/client.js",
			});
		});

		it("applies default values for optional flags", async () => {
			const flags = {
				entry: entryFile,
				output: "./dist/app.js",
			};

			const config = await createConfigFromFlags(flags);

			assert.strictEqual(config.getFormat(), "cjs");
			assert.deepStrictEqual(config.getAssets().getFiles(), []);
			const envVars = config.getEnvironment().getVariables();
			assert.strictEqual(Object.keys(envVars).length, 0);
			assert.deepStrictEqual(config.getBundles(), {});
		});
	});
});
