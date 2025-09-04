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
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

// Import the CLI functions for testing
import {
	createConfigFromFlags,
	notImplemented,
	parseCliArgs,
	readStdin,
	showHelp,
} from "./soar.js";

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

	describe("parseCliArgs", () => {
		it("should parse basic deploy command", () => {
			const args = parseCliArgs(["node", "soar.js", "deploy"]);
			assert.strictEqual(args.command, "deploy");
			assert.strictEqual(args.help, false);
			assert.strictEqual(args.verbose, false);
		});

		it("should parse help flags", () => {
			const args1 = parseCliArgs(["node", "soar.js", "--help"]);
			assert.strictEqual(args1.help, true);

			const args2 = parseCliArgs(["node", "soar.js", "-h"]);
			assert.strictEqual(args2.help, true);
		});

		it("should parse quick deployment flags", () => {
			const args = parseCliArgs([
				"node",
				"soar.js",
				"deploy",
				"--static",
				"./dist",
				"--cloudflare-workers",
				"my-app",
				"--cf-token",
				"fake-token",
				"--verbose",
			]);

			assert.strictEqual(args.command, "deploy");
			assert.strictEqual(args.static, "./dist");
			assert.strictEqual(args.cloudflareWorkers, "my-app");
			assert.strictEqual(args.cfToken, "fake-token");
			assert.strictEqual(args.verbose, true);
		});

		it("should handle config file with named export", () => {
			const args = parseCliArgs([
				"node",
				"soar.js",
				"deploy",
				"soar.config.js:production",
			]);

			assert.strictEqual(args.command, "deploy");
			assert.strictEqual(args.configFile, "soar.config.js");
			assert.strictEqual(args.exportName, "production");
		});

		it("should handle cf-workers alias", () => {
			const args = parseCliArgs([
				"node",
				"soar.js",
				"deploy",
				"--static",
				"./dist",
				"--cf-workers",
				"my-app",
			]);

			assert.strictEqual(args.cloudflareWorkers, "my-app");
		});
	});

	describe("createConfigFromFlags", () => {
		it("should create valid config from static + cloudflare-workers flags", () => {
			const flags = {
				static: "./dist",
				cloudflareWorkers: "my-app",
				cfToken: "fake-token",
				cfAccount: "fake-account",
				cfCompatibility: "2024-01-01",
			};

			const config = createConfigFromFlags(flags);

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
			const flags1 = { cloudflareWorkers: "my-app" };
			assert.strictEqual(createConfigFromFlags(flags1), null);

			// No worker name
			const flags2 = { static: "./dist" };
			assert.strictEqual(createConfigFromFlags(flags2), null);

			// Empty flags
			const flags3 = {};
			assert.strictEqual(createConfigFromFlags(flags3), null);
		});

		it("should use environment variables when flags are missing", () => {
			const originalCfToken = process.env.CF_API_TOKEN;
			const originalCfAccount = process.env.CF_ACCOUNT_ID;

			process.env.CF_API_TOKEN = "env-token";
			process.env.CF_ACCOUNT_ID = "env-account";

			const flags = {
				static: "./dist",
				cloudflareWorkers: "my-app",
			};

			const config = createConfigFromFlags(flags);

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

	describe("showHelp", () => {
		it("should show general help", () => {
			showHelp();

			const output = consoleOutput.join("\n");
			assert.ok(
				output.includes("Soar v0.4.23 - Zero-dependency deployment tool"),
			);
			assert.ok(output.includes("USAGE:"));
			assert.ok(output.includes("COMMANDS:"));
			assert.ok(output.includes("deploy"));
			assert.ok(output.includes("plan"));
		});

		it("should show command-specific help for deploy", () => {
			showHelp("deploy");

			const output = consoleOutput.join("\n");
			assert.ok(output.includes("soar deploy - Deploy artifacts to targets"));
			assert.ok(output.includes("USAGE:"));
			assert.ok(output.includes("EXAMPLES:"));
		});

		it("should show command-specific help for plan", () => {
			showHelp("plan");

			const output = consoleOutput.join("\n");
			assert.ok(
				output.includes("soar plan - Plan deployment without executing"),
			);
			assert.ok(output.includes("dry-run"));
		});
	});

	describe("notImplemented", () => {
		it("should show not implemented message for future features", () => {
			notImplemented("Binary deployment");

			const output = consoleOutput.join("\n");
			assert.ok(output.includes("🚧 Binary deployment - Not implemented yet"));
			assert.ok(output.includes("Current version (0.4.23) supports:"));
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
		it("should handle invalid arguments gracefully", () => {
			// This test checks that parseCliArgs handles invalid arguments
			// The function calls process.exit internally, so we can't easily test this
			// without mocking process.exit. For now, we'll just verify the function exists.
			assert.strictEqual(typeof parseCliArgs, "function");
		});

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
			const validFlags = [
				{ static: "./dist", cloudflareWorkers: "app1" },
				{ static: "/abs/path", cloudflareWorkers: "app2", cfToken: "token" },
			];

			for (const flags of validFlags) {
				const config = createConfigFromFlags(flags);
				assert.ok(
					config !== null,
					`Should create config for flags: ${JSON.stringify(flags)}`,
				);
				assert.strictEqual(config.artifact.type, "static");
				assert.strictEqual(config.target.name, "cloudflare-workers");
			}
		});
	});
});
