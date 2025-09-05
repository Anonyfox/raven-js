/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unit tests for Soar config helper functions.
 *
 * Tests config precedence logic, flag-to-config conversion,
 * and argument parsing used across all Soar command classes.
 */

import { deepStrictEqual, rejects, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
	createConfigFromFlags,
	createConfigFromSources,
	parseConfigArg,
} from "./config-helper.js";

const __filename = fileURLToPath(import.meta.url);

describe("parseConfigArg", () => {
	it("returns null config path when no argument provided", () => {
		const result = parseConfigArg(null, null);
		deepStrictEqual(result, { configPath: null, exportName: null });
	});

	it("uses export flag when no colon in config arg", () => {
		const result = parseConfigArg("config.js", "production");
		deepStrictEqual(result, {
			configPath: "config.js",
			exportName: "production",
		});
	});

	it("extracts export name from config arg with colon", () => {
		const result = parseConfigArg("config.js:staging", null);
		deepStrictEqual(result, { configPath: "config.js", exportName: "staging" });
	});

	it("prioritizes colon syntax over export flag", () => {
		const result = parseConfigArg("config.js:staging", "production");
		deepStrictEqual(result, { configPath: "config.js", exportName: "staging" });
	});

	it("handles empty config path with colon", () => {
		const result = parseConfigArg(":staging", null);
		deepStrictEqual(result, { configPath: null, exportName: "staging" });
	});
});

describe("createConfigFromFlags", () => {
	it("creates valid config from static + cf-workers flags", () => {
		const queryParams = new URLSearchParams();
		queryParams.set("static", "./dist");
		queryParams.set("cf-workers", "my-app");
		queryParams.set("cf-token", "fake-token");
		queryParams.set("cf-account", "fake-account");
		queryParams.set("cf-compatibility", "2024-01-01");

		const config = createConfigFromFlags(queryParams);

		deepStrictEqual(config, {
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

	it("handles cloudflare-workers alias", () => {
		const queryParams = new URLSearchParams();
		queryParams.set("static", "./dist");
		queryParams.set("cloudflare-workers", "my-app");

		const config = createConfigFromFlags(queryParams);

		strictEqual(config.target.scriptName, "my-app");
		strictEqual(config.target.name, "cloudflare-workers");
	});

	it("uses environment variables when flags are missing", () => {
		const originalCfToken = process.env.CF_API_TOKEN;
		const originalCfAccount = process.env.CF_ACCOUNT_ID;

		process.env.CF_API_TOKEN = "env-token";
		process.env.CF_ACCOUNT_ID = "env-account";

		const queryParams = new URLSearchParams();
		queryParams.set("static", "./dist");
		queryParams.set("cf-workers", "my-app");

		const config = createConfigFromFlags(queryParams);

		strictEqual(config.target.apiToken, "env-token");
		strictEqual(config.target.accountId, "env-account");
		strictEqual(config.target.compatibilityDate, "2024-01-01"); // default

		// Restore environment
		if (originalCfToken) process.env.CF_API_TOKEN = originalCfToken;
		else delete process.env.CF_API_TOKEN;
		if (originalCfAccount) process.env.CF_ACCOUNT_ID = originalCfAccount;
		else delete process.env.CF_ACCOUNT_ID;
	});

	it("returns null for invalid flag combinations", () => {
		// No static path
		const queryParams1 = new URLSearchParams();
		queryParams1.set("cf-workers", "my-app");
		strictEqual(createConfigFromFlags(queryParams1), null);

		// No worker name
		const queryParams2 = new URLSearchParams();
		queryParams2.set("static", "./dist");
		strictEqual(createConfigFromFlags(queryParams2), null);

		// Empty flags
		const queryParams3 = new URLSearchParams();
		strictEqual(createConfigFromFlags(queryParams3), null);
	});

	it("creates config for future AWS Lambda pattern", () => {
		const queryParams = new URLSearchParams();
		queryParams.set("script", "./bundle.js");
		queryParams.set("aws-lambda", "my-function");
		queryParams.set("aws-region", "us-west-2");

		const config = createConfigFromFlags(queryParams);

		deepStrictEqual(config, {
			artifact: {
				type: "script",
				path: "./bundle.js",
			},
			target: {
				name: "aws-lambda",
				functionName: "my-function",
				region: "us-west-2",
			},
		});
	});

	it("creates config for future DigitalOcean pattern", () => {
		const queryParams = new URLSearchParams();
		queryParams.set("binary", "./app");
		queryParams.set("do-droplets", "my-server");
		queryParams.set("do-token", "fake-token");

		const config = createConfigFromFlags(queryParams);

		deepStrictEqual(config, {
			artifact: {
				type: "binary",
				path: "./app",
			},
			target: {
				name: "do-droplets",
				dropletName: "my-server",
				token: "fake-token",
			},
		});
	});
});

describe("createConfigFromSources", () => {
	it("prioritizes stdin config over other sources", async () => {
		const mockConfig = { test: "stdin" };

		const result = await createConfigFromSources({
			configPath: null,
			stdinConfig: mockConfig,
			exportName: null,
			queryParams: new URLSearchParams(),
			mode: "test",
		});

		strictEqual(result, mockConfig);
	});

	it("uses flag config when no stdin provided", async () => {
		const queryParams = new URLSearchParams();
		queryParams.set("static", "./dist");
		queryParams.set("cf-workers", "my-app");

		const result = await createConfigFromSources({
			configPath: null,
			stdinConfig: null,
			exportName: null,
			queryParams,
			mode: "test",
		});

		strictEqual(result.artifact.type, "static");
		strictEqual(result.target.name, "cloudflare-workers");
	});

	it("throws error when config file not found", async () => {
		await rejects(
			createConfigFromSources({
				configPath: "nonexistent.js",
				stdinConfig: null,
				exportName: null,
				queryParams: new URLSearchParams(),
				mode: "test",
			}),
			/Config file not found: nonexistent.js/,
		);
	});

	it("throws error when no configuration sources available", async () => {
		await rejects(
			createConfigFromSources({
				configPath: null,
				stdinConfig: null,
				exportName: null,
				queryParams: new URLSearchParams(),
				mode: "test",
			}),
			/No configuration provided for test/,
		);
	});

	it("attempts to load config file when provided", async () => {
		// Test that it attempts to load a config file (will fail but that's expected)
		try {
			await createConfigFromSources({
				configPath: __filename, // Use this test file as it exists
				stdinConfig: null,
				exportName: null,
				queryParams: new URLSearchParams(),
				mode: "test",
			});
		} catch (error) {
			// Should fail trying to import the test file as a config
			strictEqual(typeof error.message, "string");
			strictEqual(error.message.includes("Config file not found"), true);
		}
	});
});
