/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Environment class.
 */

import assert from "node:assert";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { Environment } from "./environment.js";

describe("Environment", () => {
	describe("constructor", () => {
		it("creates environment with variables", () => {
			const variables = { NODE_ENV: "production", PORT: "3000" };
			const env = new Environment(variables);

			assert.deepStrictEqual(env.getVariables(), variables);
			assert.strictEqual(env.hasVariables(), true);
		});

		it("creates environment with empty variables", () => {
			const env = new Environment({});

			assert.deepStrictEqual(env.getVariables(), {});
			assert.strictEqual(env.hasVariables(), false);
		});

		it("handles null variables parameter", () => {
			const env = new Environment(null);

			assert.deepStrictEqual(env.getVariables(), {});
			assert.strictEqual(env.hasVariables(), false);
		});
	});

	describe("resolve", () => {
		it("resolves null input to empty environment", async () => {
			const env = await Environment.resolve(null);

			assert.deepStrictEqual(env.getVariables(), {});
			assert.strictEqual(env.hasVariables(), false);
		});

		it("resolves undefined input to empty environment", async () => {
			const env = await Environment.resolve(undefined);

			assert.deepStrictEqual(env.getVariables(), {});
			assert.strictEqual(env.hasVariables(), false);
		});

		it("resolves object input", async () => {
			const variables = {
				NODE_ENV: "production",
				API_KEY: "secret123",
				PORT: 3000, // Should be converted to string
			};

			const env = await Environment.resolve(variables);

			assert.strictEqual(env.getVariables().NODE_ENV, "production");
			assert.strictEqual(env.getVariables().API_KEY, "secret123");
			assert.strictEqual(env.getVariables().PORT, "3000");
		});

		it("filters out null values", async () => {
			const variables = {
				VALID: "value",
				NULL_VAL: null,
				UNDEFINED_VAL: undefined,
				EMPTY: "",
			};

			const env = await Environment.resolve(variables);
			const resolved = env.getVariables();

			assert.strictEqual(resolved.VALID, "value");
			assert.strictEqual(resolved.EMPTY, "");
			assert.ok(!("NULL_VAL" in resolved));
			assert.ok(!("UNDEFINED_VAL" in resolved));
		});

		it("resolves function returning object", async () => {
			const envFunction = async () => ({
				NODE_ENV: "test",
				TIMESTAMP: Date.now().toString(),
			});

			const env = await Environment.resolve(envFunction);
			const variables = env.getVariables();

			assert.strictEqual(variables.NODE_ENV, "test");
			assert.ok(variables.TIMESTAMP);
		});

		it("resolves function returning promise", async () => {
			const envFunction = () =>
				Promise.resolve({
					ASYNC_VAR: "async_value",
				});

			const env = await Environment.resolve(envFunction);

			assert.strictEqual(env.getVariables().ASYNC_VAR, "async_value");
		});

		it("throws error for invalid input type", async () => {
			await assert.rejects(async () => await Environment.resolve(123), {
				name: "Error",
				message:
					"Environment configuration must be a string, object, function, or null",
			});
		});

		it("throws error for array input", async () => {
			await assert.rejects(async () => await Environment.resolve(["invalid"]), {
				name: "Error",
				message:
					"Environment configuration must be a string, object, function, or null",
			});
		});
	});

	describe("file resolution", () => {
		const testDir = mkdtempSync(join(tmpdir(), "fledge-env-test-"));

		it("resolves valid .env file", async () => {
			const envFile = join(testDir, ".env");
			writeFileSync(
				envFile,
				`NODE_ENV=production
API_KEY=secret123
PORT=3000
# This is a comment
EMPTY_VAR=
QUOTED="quoted value"
SINGLE_QUOTED='single quoted'
`,
			);

			const env = await Environment.resolve(envFile);
			const variables = env.getVariables();

			assert.strictEqual(variables.NODE_ENV, "production");
			assert.strictEqual(variables.API_KEY, "secret123");
			assert.strictEqual(variables.PORT, "3000");
			assert.strictEqual(variables.EMPTY_VAR, "");
			assert.strictEqual(variables.QUOTED, "quoted value");
			assert.strictEqual(variables.SINGLE_QUOTED, "single quoted");
		});

		it("handles malformed .env lines gracefully", async () => {
			const envFile = join(testDir, ".env.malformed");
			writeFileSync(
				envFile,
				`VALID=value
MALFORMED_NO_EQUALS
=NO_KEY
# Comment
ANOTHER_VALID=another_value
`,
			);

			const env = await Environment.resolve(envFile);
			const variables = env.getVariables();

			assert.strictEqual(variables.VALID, "value");
			assert.strictEqual(variables.ANOTHER_VALID, "another_value");
			assert.ok(!("MALFORMED_NO_EQUALS" in variables));
			assert.ok(!("" in variables));
		});

		it("throws error for missing .env file", async () => {
			await assert.rejects(
				async () => await Environment.resolve("./nonexistent.env"),
				{
					name: "Error",
					message: /Environment file not found:/,
				},
			);
		});
	});

	describe("generateGlobalCode", () => {
		it("generates code for variables", () => {
			const env = new Environment({
				NODE_ENV: "production",
				API_KEY: "secret",
				PORT: "3000",
			});

			const code = env.generateGlobalCode();

			assert.ok(
				code.includes("globalThis.RavenJS = globalThis.RavenJS || {};"),
			);
			assert.ok(code.includes("globalThis.RavenJS.env = {"));
			assert.ok(code.includes('"NODE_ENV": "production"'));
			assert.ok(code.includes('"API_KEY": "secret"'));
			assert.ok(code.includes('"PORT": "3000"'));
			assert.ok(
				code.includes("Object.assign(process.env, globalThis.RavenJS.env);"),
			);
		});

		it("returns empty string for no variables", () => {
			const env = new Environment({});

			const code = env.generateGlobalCode();

			assert.strictEqual(code, "");
		});

		it("properly escapes values", () => {
			const env = new Environment({
				SPECIAL_CHARS: 'quotes"and\nnewlines',
			});

			const code = env.generateGlobalCode();

			assert.ok(code.includes('"SPECIAL_CHARS": "quotes\\"and\\nnewlines"'));
		});
	});

	describe("getters", () => {
		const variables = { NODE_ENV: "test", PORT: "8080" };
		const env = new Environment(variables);

		it("getVariables returns variables object", () => {
			assert.deepStrictEqual(env.getVariables(), variables);
		});

		it("hasVariables returns true for non-empty environment", () => {
			assert.strictEqual(env.hasVariables(), true);
		});

		it("hasVariables returns false for empty environment", () => {
			const emptyEnv = new Environment({});
			assert.strictEqual(emptyEnv.hasVariables(), false);
		});
	});
});
