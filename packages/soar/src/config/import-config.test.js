/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for configuration import utilities.
 */

import assert from "node:assert";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
	importConfigFromFile,
	importConfigFromString,
	parseConfigInput,
} from "./import-config.js";

describe("importConfigFromString", () => {
	const validConfigString = `
		export default {
			resource: { name: 'test-app' },
			artifact: { type: 'static', path: './dist' },
			target: { provider: 'cloudflare', type: 'pages', config: {} }
		};
	`;

	const namedExportString = `
		export default {
			resource: { name: 'default-app' }
		};

		export const production = {
			resource: { name: 'prod-app' },
			artifact: { type: 'static', path: './dist' },
			target: { provider: 'cloudflare', type: 'pages', config: {} }
		};

		export const staging = {
			resource: { name: 'staging-app' }
		};
	`;

	describe("successful imports", () => {
		it("should import default export", async () => {
			const config = await importConfigFromString(validConfigString);

			assert.strictEqual(config.resource.name, "test-app");
			assert.strictEqual(config.artifact.type, "static");
			assert.strictEqual(config.target.provider, "cloudflare");
		});

		it("should import named export", async () => {
			const config = await importConfigFromString(
				namedExportString,
				"production",
			);

			assert.strictEqual(config.resource.name, "prod-app");
			assert.strictEqual(config.artifact.type, "static");
		});

		it("should import different named exports", async () => {
			const prodConfig = await importConfigFromString(
				namedExportString,
				"production",
			);
			const stagingConfig = await importConfigFromString(
				namedExportString,
				"staging",
			);

			assert.strictEqual(prodConfig.resource.name, "prod-app");
			assert.strictEqual(stagingConfig.resource.name, "staging-app");
		});
	});

	describe("validation errors", () => {
		it("should throw for empty string", async () => {
			await assert.rejects(() => importConfigFromString(""), {
				message: /Configuration string cannot be empty/,
			});
		});

		it("should throw for whitespace only", async () => {
			await assert.rejects(() => importConfigFromString("   \n\t  "), {
				message: /Configuration string cannot be whitespace only/,
			});
		});

		it("should throw for null/undefined", async () => {
			await assert.rejects(() => importConfigFromString(null), {
				message: /Configuration string cannot be empty/,
			});
		});

		it("should throw for non-object export", async () => {
			const invalidString = "export default 'not an object';";

			await assert.rejects(() => importConfigFromString(invalidString), {
				message: /Configuration must export an object/,
			});
		});

		it("should throw for missing default export", async () => {
			const noDefaultString =
				"export const named = { resource: { name: 'test' } };";

			await assert.rejects(() => importConfigFromString(noDefaultString), {
				message: /Configuration must export a default object/,
			});
		});

		it("should throw for missing named export", async () => {
			await assert.rejects(
				() => importConfigFromString(validConfigString, "nonexistent"),
				{ message: /Export 'nonexistent' not found in configuration string/ },
			);
		});

		it("should throw for invalid JavaScript", async () => {
			const invalidJs = "export default { invalid: syntax: error }";

			await assert.rejects(() => importConfigFromString(invalidJs), {
				message: /Failed to parse configuration string/,
			});
		});
	});
});

describe("importConfigFromFile", () => {
	let tempDir;
	let configPath;
	let namedExportPath;

	const validConfig = {
		resource: { name: "file-app" },
		artifact: { type: "static", path: "./dist" },
		target: { provider: "cloudflare", type: "pages", config: {} },
	};

	beforeEach(async () => {
		tempDir = join(tmpdir(), `soar-test-${Date.now()}`);
		await mkdir(tempDir, { recursive: true });

		configPath = join(tempDir, "soar.config.mjs");
		namedExportPath = join(tempDir, "named.config.mjs");

		// Create test config file
		await writeFile(
			configPath,
			`export default ${JSON.stringify(validConfig)};`,
		);

		// Create named export config file
		await writeFile(
			namedExportPath,
			`
			export default { resource: { name: 'default' } };

			export const production = ${JSON.stringify({
				...validConfig,
				resource: { name: "prod-file-app" },
			})};

			export const staging = ${JSON.stringify({
				...validConfig,
				resource: { name: "staging-file-app" },
			})};
		`,
		);
	});

	afterEach(async () => {
		// Cleanup temp files
		try {
			await unlink(configPath);
			await unlink(namedExportPath);
		} catch {
			// Ignore cleanup errors
		}
	});

	describe("successful imports", () => {
		it("should import default export from file", async () => {
			const config = await importConfigFromFile(configPath);

			assert.deepStrictEqual(config, validConfig);
		});

		it("should import named export from file", async () => {
			const config = await importConfigFromFile(namedExportPath, "production");

			assert.strictEqual(config.resource.name, "prod-file-app");
			assert.strictEqual(config.artifact.type, "static");
		});

		it("should import different named exports", async () => {
			const prodConfig = await importConfigFromFile(
				namedExportPath,
				"production",
			);
			const stagingConfig = await importConfigFromFile(
				namedExportPath,
				"staging",
			);

			assert.strictEqual(prodConfig.resource.name, "prod-file-app");
			assert.strictEqual(stagingConfig.resource.name, "staging-file-app");
		});

		it("should handle relative paths", async () => {
			const relativeConfig = await importConfigFromFile(configPath);
			assert.deepStrictEqual(relativeConfig, validConfig);
		});
	});

	describe("validation errors", () => {
		it("should throw for empty path", async () => {
			await assert.rejects(() => importConfigFromFile(""), {
				message: /Configuration file path cannot be empty/,
			});
		});

		it("should throw for whitespace path", async () => {
			await assert.rejects(() => importConfigFromFile("   "), {
				message: /Configuration file path cannot be whitespace only/,
			});
		});

		it("should throw for nonexistent file", async () => {
			await assert.rejects(
				() => importConfigFromFile("/nonexistent/config.mjs"),
				{ message: /Configuration file not found/ },
			);
		});

		it("should throw for missing named export", async () => {
			await assert.rejects(
				() => importConfigFromFile(namedExportPath, "nonexistent"),
				{ message: /Export 'nonexistent' not found/ },
			);
		});

		it("should throw for file with no default export", async () => {
			const noDefaultPath = join(tempDir, "no-default.config.mjs");
			await writeFile(
				noDefaultPath,
				"export const named = { resource: { name: 'test' } };",
			);

			await assert.rejects(() => importConfigFromFile(noDefaultPath), {
				message: /No default export found/,
			});

			await unlink(noDefaultPath);
		});

		it("should throw for non-object export", async () => {
			const invalidPath = join(tempDir, "invalid.config.mjs");
			await writeFile(invalidPath, "export default 'not an object';");

			await assert.rejects(() => importConfigFromFile(invalidPath), {
				message: /Configuration must export an object/,
			});

			await unlink(invalidPath);
		});
	});
});

describe("parseConfigInput", () => {
	let tempDir;
	let configPath;

	beforeEach(async () => {
		tempDir = join(tmpdir(), `soar-test-${Date.now()}`);
		await mkdir(tempDir, { recursive: true });

		configPath = join(tempDir, "parse.config.mjs");
		await writeFile(
			configPath,
			`
			export default {
				resource: { name: 'parse-app' },
				artifact: { type: 'static', path: './dist' },
				target: { provider: 'cloudflare', type: 'pages', config: {} }
			};
		`,
		);
	});

	afterEach(async () => {
		try {
			await unlink(configPath);
		} catch {
			// Ignore cleanup errors
		}
	});

	describe("input type detection", () => {
		it("should handle direct object input", async () => {
			const configObj = { resource: { name: "direct-obj" } };
			const config = await parseConfigInput(configObj);

			assert.strictEqual(config, configObj);
		});

		it("should detect and parse JavaScript code strings", async () => {
			const codeString =
				"export default { resource: { name: 'code-string' } };";
			const config = await parseConfigInput(codeString);

			assert.strictEqual(config.resource.name, "code-string");
		});

		it("should detect and import file paths", async () => {
			const config = await parseConfigInput(configPath);

			assert.strictEqual(config.resource.name, "parse-app");
		});

		it("should handle named exports from files", async () => {
			const namedPath = join(tempDir, "named-parse.config.mjs");
			await writeFile(
				namedPath,
				`
				export default { resource: { name: 'default' } };
				export const prod = { resource: { name: 'named-prod' } };
			`,
			);

			const config = await parseConfigInput(namedPath, "prod");
			assert.strictEqual(config.resource.name, "named-prod");

			await unlink(namedPath);
		});
	});

	describe("code detection patterns", () => {
		it("should detect export keyword", async () => {
			const config = await parseConfigInput(
				"export default { resource: { name: 'export-test' } };",
			);
			assert.strictEqual(config.resource.name, "export-test");
		});

		it("should detect import keyword", async () => {
			const config = await parseConfigInput(
				"export default { resource: { name: 'import-test' } };",
			);
			assert.strictEqual(config.resource.name, "import-test");
		});

		it("should detect const keyword", async () => {
			const config = await parseConfigInput(
				"const cfg = { resource: { name: 'const-test' } }; export default cfg;",
			);
			assert.strictEqual(config.resource.name, "const-test");
		});
	});

	describe("error handling", () => {
		it("should throw for invalid input types", async () => {
			await assert.rejects(() => parseConfigInput(123), {
				message: /Configuration input must be/,
			});

			await assert.rejects(() => parseConfigInput(null), {
				message: /Configuration input must be/,
			});
		});
	});
});
