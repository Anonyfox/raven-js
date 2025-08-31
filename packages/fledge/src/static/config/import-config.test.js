/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";

import { importConfig } from "./import-config.js";

describe("importConfig", () => {
	const tempDir = join(process.cwd(), "test-config-temp");

	before(async () => {
		await mkdir(tempDir, { recursive: true });

		// Create test config files
		await writeFile(
			join(tempDir, "default-config.js"),
			`
			export default {
				server: "http://localhost:3000",
				routes: ["/"],
			};
		`,
		);

		await writeFile(
			join(tempDir, "named-config.js"),
			`
			export const production = {
				server: "https://api.example.com",
				basePath: "/app",
			};

			export const development = {
				server: "http://localhost:3000",
				discover: true,
			};
		`,
		);

		await writeFile(
			join(tempDir, "mixed-config.js"),
			`
			export default {
				server: "http://localhost:3000",
			};

			export const staging = {
				server: "https://staging.example.com",
			};
		`,
		);

		await writeFile(
			join(tempDir, "broken-config.js"),
			`
			export default {
				server: "http://localhost:3000"
				// Missing comma - syntax error
				routes: ["/"]
			};
		`,
		);
	});

	after(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	test("imports default export", async () => {
		const config = await importConfig(join(tempDir, "default-config.js"));

		assert.strictEqual(typeof config, "object");
		assert.strictEqual(config.server, "http://localhost:3000");
		assert.deepStrictEqual(config.routes, ["/"]);
	});

	test("imports named export", async () => {
		const config = await importConfig(
			join(tempDir, "named-config.js"),
			"production",
		);

		assert.strictEqual(typeof config, "object");
		assert.strictEqual(config.server, "https://api.example.com");
		assert.strictEqual(config.basePath, "/app");
	});

	test("imports different named export", async () => {
		const config = await importConfig(
			join(tempDir, "named-config.js"),
			"development",
		);

		assert.strictEqual(typeof config, "object");
		assert.strictEqual(config.server, "http://localhost:3000");
		assert.strictEqual(config.discover, true);
	});

	test("imports default when available with named exports", async () => {
		const config = await importConfig(join(tempDir, "mixed-config.js"));

		assert.strictEqual(typeof config, "object");
		assert.strictEqual(config.server, "http://localhost:3000");
	});

	test("throws clean error for missing file", async () => {
		await assert.rejects(
			async () => await importConfig(join(tempDir, "nonexistent.js")),
			/Config file not found:/,
		);
	});

	test("throws clean error for missing named export", async () => {
		await assert.rejects(
			async () =>
				await importConfig(join(tempDir, "named-config.js"), "nonexistent"),
			/Export 'nonexistent' not found/,
		);
	});

	test("throws clean error for missing default export", async () => {
		await assert.rejects(
			async () => await importConfig(join(tempDir, "named-config.js")),
			/No default export found/,
		);
	});

	test("throws clean error for syntax errors", async () => {
		await assert.rejects(
			async () => await importConfig(join(tempDir, "broken-config.js")),
			/Failed to import config from/,
		);
	});
});
