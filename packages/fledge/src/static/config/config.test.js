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

import { Config } from "./config.js";
import { Discover } from "./discover.js";

describe("Config", () => {
	const tempDir = "/tmp/fledge-config-test";

	before(async () => {
		await mkdir(tempDir, { recursive: true });

		// Create test config files
		await writeFile(
			join(tempDir, "simple-config.mjs"),
			`
			export default {
				server: "http://localhost:3000",
				routes: ["/", "/about"],
			};
		`,
		);

		await writeFile(
			join(tempDir, "resolver-config.mjs"),
			`
			export default {
				resolver: async (path) => {
					return new Response("Test content", {
						status: 200,
						headers: { "content-type": "text/html" }
					});
				},
				routes: ["/", "/about"],
			};
		`,
		);

		await writeFile(
			join(tempDir, "complex-config.mjs"),
			`
			export default {
				server: "https://api.example.com",
				routes: ["/api", "/docs"],
				discover: { depth: 3, ignore: ["*.pdf"] },
				bundles: { "/app.js": "./src/app.js" },
				basePath: "/my-app",
			};

			export const production = {
				server: "https://prod.example.com",
				discover: false,
			};
		`,
		);

		await writeFile(
			join(tempDir, "invalid-config.mjs"),
			`
			export default {
				server: 123, // Invalid server type
			};
		`,
		);
	});

	after(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});
	test("creates instance with defaults", () => {
		const config = new Config();

		assert.strictEqual(config.server, null);
		assert.strictEqual(config.routes, null);
		assert.strictEqual(config.discover, null);
		assert.strictEqual(config.bundles, null);
		assert.strictEqual(config.basePath, null);
		assert.strictEqual(config.assets, null);
		assert.strictEqual(config.output, null);
	});

	test("creates instance with options", () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/", "/about"],
			discover: false,
		});

		assert.strictEqual(config.server, "http://localhost:3000");
		assert.deepStrictEqual(config.routes, ["/", "/about"]);
		assert.strictEqual(config.discover, false);
	});

	test("transforms plain object to Discover instance", () => {
		const config = new Config({
			server: "http://localhost:3000",
			discover: { depth: 2, ignore: ["*.log"] },
		});

		assert(config.discover instanceof Discover);
		assert.strictEqual(config.discover.depth, 2);
		assert.deepStrictEqual(config.discover.ignore, ["*.log"]);
	});

	test("getServer returns configured server", () => {
		const config = new Config({ server: "http://localhost:3000" });
		assert.strictEqual(config.getServer(), "http://localhost:3000");
	});

	test("getServer throws when not configured", () => {
		const config = new Config();
		assert.throws(() => config.getServer(), /Server configuration is required/);
	});

	test("getResolver returns configured resolver", () => {
		const resolver = async (_path) => new Response("test");
		const config = new Config({ resolver });
		assert.strictEqual(config.getResolver(), resolver);
	});

	test("getResolver returns null when not configured", () => {
		const config = new Config({ server: "http://localhost:3000" });
		assert.strictEqual(config.getResolver(), null);
	});

	test("getRoutes returns configured routes", () => {
		const config = new Config({ routes: ["/api", "/docs"] });
		assert.deepStrictEqual(config.getRoutes(), ["/api", "/docs"]);
	});

	test("getRoutes returns default when not configured", () => {
		const config = new Config();
		assert.deepStrictEqual(config.getRoutes(), ["/"]);
	});

	test("getDiscover returns configured discover", () => {
		const config = new Config({ discover: false });
		assert.strictEqual(config.getDiscover(), false);
	});

	test("getDiscover returns default when not configured", () => {
		const config = new Config();
		assert.strictEqual(config.getDiscover(), true);
	});

	test("getBundles returns configured bundles", () => {
		const bundles = { "/app.js": "./src/app.js" };
		const config = new Config({ bundles });
		assert.deepStrictEqual(config.getBundles(), bundles);
	});

	test("getBundles returns empty object when not configured", () => {
		const config = new Config();
		assert.deepStrictEqual(config.getBundles(), {});
	});

	test("getBasePath returns configured base path", () => {
		const config = new Config({ basePath: "/my-app" });
		assert.strictEqual(config.getBasePath(), "/my-app");
	});

	test("getBasePath returns '/' when not configured", () => {
		const config = new Config();
		assert.strictEqual(config.getBasePath(), "/");
	});

	test("getAssets returns configured assets", () => {
		const config = new Config({ assets: "./public" });
		assert.strictEqual(config.getAssets(), "./public");
	});

	test("getAssets returns null when not configured", () => {
		const config = new Config();
		assert.strictEqual(config.getAssets(), null);
	});

	test("getOutput returns configured output", () => {
		const config = new Config({ output: "./dist" });
		assert.strictEqual(config.getOutput(), "./dist");
	});

	test("getOutput returns default when not configured", () => {
		const config = new Config();
		assert.strictEqual(config.getOutput(), "_site");
	});

	test("validate passes with valid string server", () => {
		const config = new Config({ server: "http://localhost:3000" });
		assert.doesNotThrow(() => config.validate());
	});

	test("validate passes with valid https server", () => {
		const config = new Config({ server: "https://api.example.com" });
		assert.doesNotThrow(() => config.validate());
	});

	test("validate passes with function server", () => {
		const config = new Config({
			server: async ({ _port }) => {
				// Mock server boot function
			},
		});
		assert.doesNotThrow(() => config.validate());
	});

	test("validate throws when server missing", () => {
		const config = new Config();
		assert.throws(
			() => config.validate(),
			/Either server or resolver configuration is required/,
		);
	});

	test("validate throws when both server and resolver provided", () => {
		const config = new Config({
			server: "http://localhost:3000",
			resolver: async () => new Response("test"),
		});
		assert.throws(
			() => config.validate(),
			/Cannot specify both server and resolver - choose exactly one/,
		);
	});

	test("validate accepts resolver configuration", () => {
		const config = new Config({
			resolver: async (_path) => new Response("test"),
		});
		assert.doesNotThrow(() => config.validate());
	});

	test("validate throws when resolver is not a function", () => {
		const config = new Config({
			resolver: "not-a-function",
		});
		assert.throws(
			() => config.validate(),
			/Resolver must be an async function/,
		);
	});

	test("validate throws when server invalid type", () => {
		const config = new Config({ server: 123 });
		assert.throws(
			() => config.validate(),
			/Server must be origin URL string or async boot function/,
		);
	});

	test("validate throws when server invalid URL", () => {
		const config = new Config({ server: "not-a-url" });
		assert.throws(() => config.validate(), /Server must be valid origin URL/);
	});

	test("validate throws when server invalid protocol", () => {
		const config = new Config({ server: "ftp://example.com" });
		assert.throws(
			() => config.validate(),
			/Server URL must use http or https protocol/,
		);
	});

	test("validate throws when routes invalid type", () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: "invalid",
		});
		assert.throws(
			() => config.validate(),
			/Routes must be array of strings or async generator function/,
		);
	});

	test("validate throws when discover invalid type", () => {
		const config = new Config({
			server: "http://localhost:3000",
			discover: "invalid",
		});
		assert.throws(
			() => config.validate(),
			/Discover must be boolean or Discover instance/,
		);
	});

	test("validate passes with Discover instance", () => {
		const config = new Config({
			server: "http://localhost:3000",
			discover: new Discover({ depth: 3, ignore: ["*.pdf"] }),
		});
		assert.doesNotThrow(() => config.validate());
	});

	test("validate throws when Discover instance is invalid", () => {
		const config = new Config({
			server: "http://localhost:3000",
			discover: new Discover({ depth: -1 }),
		});
		assert.throws(
			() => config.validate(),
			/Discover depth must be positive integer if specified/,
		);
	});

	test("validate throws when bundles invalid type", () => {
		const config = new Config({
			server: "http://localhost:3000",
			bundles: "invalid",
		});
		assert.throws(
			() => config.validate(),
			/Bundles must be object mapping mount paths to source files/,
		);
	});

	test("validate throws when string field invalid type", () => {
		const config = new Config({
			server: "http://localhost:3000",
			basePath: 123,
		});
		assert.throws(
			() => config.validate(),
			/basePath must be string if specified/,
		);
	});

	test("fromFile loads default export", async () => {
		const config = await Config.fromFile(join(tempDir, "simple-config.mjs"));

		assert.strictEqual(config.server, "http://localhost:3000");
		assert.deepStrictEqual(config.routes, ["/", "/about"]);
		assert.strictEqual(config.discover, null);
		assert.strictEqual(config.bundles, null);
	});

	test("fromFile loads named export", async () => {
		const config = await Config.fromFile(
			join(tempDir, "complex-config.mjs"),
			"production",
		);

		assert.strictEqual(config.server, "https://prod.example.com");
		assert.strictEqual(config.discover, false);
	});

	test("fromFile loads complex configuration", async () => {
		const config = await Config.fromFile(join(tempDir, "complex-config.mjs"));

		assert.strictEqual(config.server, "https://api.example.com");
		assert.deepStrictEqual(config.routes, ["/api", "/docs"]);
		assert(config.discover instanceof Discover);
		assert.strictEqual(config.discover.depth, 3);
		assert.deepStrictEqual(config.discover.ignore, ["*.pdf"]);
		assert.deepStrictEqual(config.bundles, { "/app.js": "./src/app.js" });
		assert.strictEqual(config.basePath, "/my-app");
	});

	test("fromFile loads resolver configuration", async () => {
		const config = await Config.fromFile(join(tempDir, "resolver-config.mjs"));

		assert.strictEqual(config.server, null);
		assert.strictEqual(typeof config.resolver, "function");
		assert.deepStrictEqual(config.routes, ["/", "/about"]);

		// Test resolver function works
		const response = await config.resolver("/test");
		assert.strictEqual(response.status, 200);
		assert.strictEqual(response.headers.get("content-type"), "text/html");
	});

	test("fromFile validates loaded configuration", async () => {
		await assert.rejects(
			async () => await Config.fromFile(join(tempDir, "invalid-config.mjs")),
			/Server must be origin URL string or async boot function/,
		);
	});

	test("fromFile throws for missing file", async () => {
		await assert.rejects(
			async () => await Config.fromFile(join(tempDir, "nonexistent.mjs")),
			/Config file not found:/,
		);
	});

	test("fromFile throws for missing export", async () => {
		await assert.rejects(
			async () =>
				await Config.fromFile(
					join(tempDir, "simple-config.mjs"),
					"nonexistent",
				),
			/Export 'nonexistent' not found/,
		);
	});

	test("fromString loads default export", async () => {
		const jsCode = `
			export default {
				server: "http://localhost:4000",
				routes: ["/api", "/docs"],
				discover: true
			};
		`;

		const config = await Config.fromString(jsCode);

		assert.strictEqual(config.server, "http://localhost:4000");
		assert.deepStrictEqual(config.routes, ["/api", "/docs"]);
		assert.strictEqual(config.discover, true);
	});

	test("fromString loads named export", async () => {
		const jsCode = `
			export default {
				server: "http://localhost:3000"
			};

			export const staging = {
				server: "https://staging.example.com",
				discover: false
			};
		`;

		const config = await Config.fromString(jsCode, "staging");

		assert.strictEqual(config.server, "https://staging.example.com");
		assert.strictEqual(config.discover, false);
	});

	test("fromString works with ESM imports", async () => {
		const jsCode = `
			import { readFileSync } from 'node:fs';

			// Can use imports in config code
			const packageInfo = "fledge";

			export default {
				server: "http://localhost:3000",
				routes: [\`/\${packageInfo}\`],
				discover: { depth: 2 }
			};
		`;

		const config = await Config.fromString(jsCode);

		assert.strictEqual(config.server, "http://localhost:3000");
		assert.deepStrictEqual(config.routes, ["/fledge"]);
		assert(config.discover instanceof Discover);
		assert.strictEqual(config.discover.depth, 2);
	});

	test("fromString validates loaded configuration", async () => {
		const jsCode = `
			export default {
				server: 123 // Invalid server type
			};
		`;

		await assert.rejects(
			async () => await Config.fromString(jsCode),
			/Server must be origin URL string or async boot function/,
		);
	});

	test("fromString throws for syntax errors", async () => {
		const jsCode = `
			export default {
				server: "http://localhost:3000"
				// Missing comma - syntax error
				routes: ["/"]
			};
		`;

		await assert.rejects(
			async () => await Config.fromString(jsCode),
			/Failed to import config from code string/,
		);
	});

	test("fromString throws for missing default export", async () => {
		const jsCode = `
			export const notDefault = {
				server: "http://localhost:3000"
			};
		`;

		await assert.rejects(
			async () => await Config.fromString(jsCode),
			/No default export found in code string/,
		);
	});

	test("fromString throws for missing named export", async () => {
		const jsCode = `
			export default {
				server: "http://localhost:3000"
			};
		`;

		await assert.rejects(
			async () => await Config.fromString(jsCode, "nonexistent"),
			/Export 'nonexistent' not found in code string/,
		);
	});
});
