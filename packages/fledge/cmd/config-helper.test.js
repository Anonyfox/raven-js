/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for shared configuration helper functions
 *
 * Validates config precedence logic and argument parsing used across
 * all Fledge command classes.
 */

import { deepStrictEqual, rejects, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createConfigFromSources, parseConfigArg } from "./config-helper.js";

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

describe("createConfigFromSources", () => {
	it("prioritizes stdin config over other sources", async () => {
		const mockConfig = { test: "stdin" };
		const MockConfigClass = {
			fromString: (config, exportName) => {
				strictEqual(config, "stdin-config");
				strictEqual(exportName, "test");
				return mockConfig;
			},
		};

		const result = await createConfigFromSources({
			configPath: "should-be-ignored.js",
			stdinConfig: "stdin-config",
			exportName: "test",
			ConfigClass: MockConfigClass,
			createFromFlags: () => ({ test: "flags" }),
			queryParams: new URLSearchParams(),
			mode: "test",
		});

		strictEqual(result, mockConfig);
	});

	it("uses config file when no stdin provided", async () => {
		const mockConfig = { test: "file" };
		const MockConfigClass = {
			fromFile: (path, exportName) => {
				strictEqual(path.endsWith("config-helper.test.js"), true);
				strictEqual(exportName, "test");
				return mockConfig;
			},
		};

		const result = await createConfigFromSources({
			configPath: __filename, // Use this test file as it exists
			stdinConfig: null,
			exportName: "test",
			ConfigClass: MockConfigClass,
			createFromFlags: () => ({ test: "flags" }),
			queryParams: new URLSearchParams(),
			mode: "test",
		});

		strictEqual(result, mockConfig);
	});

	it("falls back to CLI flags when no config file", async () => {
		const mockConfig = { test: "flags" };
		const createFromFlags = (queryParams) => {
			strictEqual(queryParams instanceof URLSearchParams, true);
			return mockConfig;
		};

		const result = await createConfigFromSources({
			configPath: null,
			stdinConfig: null,
			exportName: null,
			ConfigClass: null,
			createFromFlags,
			queryParams: new URLSearchParams(),
			mode: "test",
		});

		strictEqual(result, mockConfig);
	});

	it("throws error when config file not found", async () => {
		await rejects(
			createConfigFromSources({
				configPath: "nonexistent.js",
				stdinConfig: null,
				exportName: null,
				ConfigClass: null,
				createFromFlags: null,
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
				ConfigClass: null,
				createFromFlags: null,
				queryParams: new URLSearchParams(),
				mode: "test",
			}),
			/No configuration provided for test/,
		);
	});
});
