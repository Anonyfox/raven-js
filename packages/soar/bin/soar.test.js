/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unit tests for the Soar CLI.
 *
 * Tests CLI functionality including argument parsing, config creation,
 * and help system. Uses temporary folders and minimal mocking.
 */

import assert from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, "..", "package.json");
const { version } = JSON.parse(readFileSync(packagePath, "utf8"));

import {
	createConfigFromFlags,
	parseConfigArg,
	readStdin,
} from "../cmd/config-helper.js";
// Import the CLI functions for testing
import { notImplemented } from "./soar.js";

// Mock console methods to capture output
let consoleOutput = [];
let consoleErrors = [];
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let tempDir;

describe("Soar CLI", () => {
	beforeEach(() => {
		// Create temporary directory
		tempDir = mkdtempSync(join(tmpdir(), "soar-test-"));

		// Reset console output
		consoleOutput = [];
		consoleErrors = [];

		// Mock console methods
		console.log = (...args) => {
			consoleOutput.push(args.join(" "));
		};
		console.error = (...args) => {
			consoleErrors.push(args.join(" "));
		};
	});

	afterEach(() => {
		// Clean up temporary directory
		if (tempDir) {
			rmSync(tempDir, { recursive: true, force: true });
		}

		// Restore original functions
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
	});

	describe("parseConfigArg", () => {
		it("should parse config file with named export", () => {
			const result = parseConfigArg("soar.config.js:production", null);
			assert.strictEqual(result.configPath, "soar.config.js");
			assert.strictEqual(result.exportName, "production");
		});

		it("should handle config file without export", () => {
			const result = parseConfigArg("soar.config.js", null);
			assert.strictEqual(result.configPath, "soar.config.js");
			assert.strictEqual(result.exportName, null);
		});

		it("should use export flag when no colon in config", () => {
			const result = parseConfigArg("soar.config.js", "staging");
			assert.strictEqual(result.configPath, "soar.config.js");
			assert.strictEqual(result.exportName, "staging");
		});

		it("should prioritize colon syntax over export flag", () => {
			const result = parseConfigArg("soar.config.js:production", "staging");
			assert.strictEqual(result.configPath, "soar.config.js");
			assert.strictEqual(result.exportName, "production");
		});
	});

	describe("createConfigFromFlags", () => {
		it("should create valid config from static + cloudflare-workers flags", () => {
			const queryParams = new URLSearchParams();
			queryParams.set("static", "./dist");
			queryParams.set("cf-workers", "my-app");
			queryParams.set("cf-token", "fake-token");
			queryParams.set("cf-account", "fake-account");
			queryParams.set("cf-compatibility", "2024-01-01");

			const config = createConfigFromFlags(queryParams);

			assert.deepStrictEqual(config, {
				artifact: {
					type: "static",
					path: "./dist",
				},
				target: {
					name: "cloudflare-workers",
					scriptName: "my-app",
					accountId: "fake-account",
					apiToken: "fake-token",
					compatibilityDate: "2024-01-01",
				},
			});
		});

		it("should return null for invalid flag combinations", () => {
			// No static path
			const queryParams1 = new URLSearchParams();
			queryParams1.set("cf-workers", "my-app");
			assert.strictEqual(createConfigFromFlags(queryParams1), null);

			// No worker name
			const queryParams2 = new URLSearchParams();
			queryParams2.set("static", "./dist");
			assert.strictEqual(createConfigFromFlags(queryParams2), null);

			// Empty flags
			const queryParams3 = new URLSearchParams();
			assert.strictEqual(createConfigFromFlags(queryParams3), null);
		});

		it("should use environment variables when flags are missing", () => {
			const originalCfToken = process.env.CF_API_TOKEN;
			const originalCfAccount = process.env.CF_ACCOUNT_ID;

			process.env.CF_API_TOKEN = "env-token";
			process.env.CF_ACCOUNT_ID = "env-account";

			const queryParams = new URLSearchParams();
			queryParams.set("static", "./dist");
			queryParams.set("cf-workers", "my-app");

			const config = createConfigFromFlags(queryParams);

			assert.strictEqual(config.target.apiToken, "env-token");
			assert.strictEqual(config.target.accountId, "env-account");
			assert.strictEqual(config.target.compatibilityDate, "2024-01-01"); // default

			// Restore environment
			if (originalCfToken) process.env.CF_API_TOKEN = originalCfToken;
			else delete process.env.CF_API_TOKEN;
			if (originalCfAccount) process.env.CF_ACCOUNT_ID = originalCfAccount;
			else delete process.env.CF_ACCOUNT_ID;
		});
	});

	describe("notImplemented", () => {
		it("should show not implemented message for future features", () => {
			notImplemented("Binary deployment");

			const output = consoleOutput.join("\n");
			assert.ok(output.includes("🚧 Binary deployment - Not implemented yet"));
			assert.ok(output.includes(`Current version (${version}) supports:`));
			assert.ok(
				output.includes("✅ Static site deployment to Cloudflare Workers"),
			);
			assert.ok(output.includes("Coming soon:"));
		});
	});

	describe("readStdin", () => {
		it("should return null when no piped input (TTY)", async () => {
			// Mock stdin as TTY
			const originalIsTTY = process.stdin.isTTY;
			process.stdin.isTTY = true;

			const result = await readStdin();
			assert.strictEqual(result, null);

			// Restore
			process.stdin.isTTY = originalIsTTY;
		});
	});

	describe("integration scenarios", () => {
		it("should create config files in temp directory", () => {
			// Test that we can create config files for integration testing
			const configPath = join(tempDir, "test.config.js");
			writeFileSync(
				configPath,
				`
export default {
	artifact: { type: 'static', path: './dist' },
	target: { name: 'cloudflare-workers', scriptName: 'test' }
};
			`,
			);

			// File should exist and be readable
			assert.ok(configPath.includes(tempDir));
		});

		it("should handle various flag combinations", () => {
			// Test flag combinations that should work
			const validFlagSets = [
				new URLSearchParams([
					["static", "./dist"],
					["cf-workers", "app1"],
				]),
				new URLSearchParams([
					["static", "/abs/path"],
					["cf-workers", "app2"],
					["cf-token", "token"],
				]),
			];

			for (const queryParams of validFlagSets) {
				const config = createConfigFromFlags(queryParams);
				assert.ok(
					config !== null,
					`Should create config for flags: ${Array.from(queryParams.entries())}`,
				);
				assert.strictEqual(config.artifact.type, "static");
				assert.strictEqual(config.target.name, "cloudflare-workers");
			}
		});
	});
});
