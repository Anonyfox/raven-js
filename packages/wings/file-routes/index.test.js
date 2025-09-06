/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Integration test suite for file-routes module
 */

import { strict as assert } from "node:assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Context } from "../core/context.js";
import { Router } from "../core/router.js";
import { FileRoute, registerFileRoutes, scanRoutes } from "./index.js";

test("file-routes module integration", async (t) => {
	let testDir;

	t.beforeEach(async () => {
		// Create temporary directory for each test
		testDir = await mkdtemp(join(tmpdir(), "wings-integration-test-"));
		// Create package.json to make it an ESM module
		await writeFile(join(testDir, "package.json"), '{"type": "module"}');
	});

	t.afterEach(async () => {
		// Clean up temporary directory after each test
		if (testDir) {
			await rm(testDir, { recursive: true, force: true });
		}
	});

	await t.test("exports all required components", () => {
		assert.strictEqual(typeof FileRoute, "function");
		assert.strictEqual(typeof scanRoutes, "function");
		assert.strictEqual(typeof registerFileRoutes, "function");
	});

	await t.test("FileRoute is a proper class", () => {
		const route = new FileRoute("/test", "/test/index.js", [], false);
		assert.ok(route instanceof FileRoute);
		assert.strictEqual(route.pattern, "/test");
		assert.strictEqual(route.module, "/test/index.js");
	});

	await t.test("complete workflow: scan and register", async () => {
		// Create a realistic page structure
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "about"), { recursive: true });
		await mkdir(join(pagesDir, "blog", "[slug]"), { recursive: true });
		await mkdir(join(pagesDir, "shop", "[category]", "[item]"), {
			recursive: true,
		});
		await mkdir(join(pagesDir, "docs", "[...path]"), { recursive: true });

		// Create page modules
		await writeFile(
			join(pagesDir, "index.js"),
			`
			export default (ctx) => ctx.html('<h1>Home</h1>');
		`,
		);
		await writeFile(
			join(pagesDir, "about", "index.js"),
			`
			export default (ctx) => ctx.html('<h1>About</h1>');
		`,
		);
		await writeFile(
			join(pagesDir, "blog", "[slug]", "index.js"),
			`
			export default (ctx) => ctx.html(\`<h1>Blog: \${ctx.pathParams.slug}</h1>\`);
		`,
		);
		await writeFile(
			join(pagesDir, "shop", "[category]", "[item]", "index.js"),
			`
			export default (ctx) => ctx.html(\`<h1>Shop: \${ctx.pathParams.category}/\${ctx.pathParams.item}</h1>\`);
		`,
		);
		await writeFile(
			join(pagesDir, "docs", "[...path]", "index.js"),
			`
			export default (ctx) => ctx.html(\`<h1>Docs: \${ctx.pathParams["*path"]}</h1>\`);
		`,
		);

		// Step 1: Scan routes
		const routes = await scanRoutes(pagesDir);
		assert.strictEqual(routes.length, 5);

		// Verify route patterns
		const patterns = routes.map((r) => r.pattern).sort();
		assert.deepStrictEqual(patterns, [
			"/",
			"/about",
			"/blog/:slug",
			"/docs/*",
			"/shop/:category/:item",
		]);

		// Step 2: Register with router
		const router = new Router();
		const registeredRoutes = await registerFileRoutes(router, pagesDir);

		assert.strictEqual(registeredRoutes.length, 5);
		assert.deepStrictEqual(registeredRoutes, routes); // Should be the same routes

		// Step 3: Test actual routing
		const testCases = [
			{ url: "http://localhost/", expected: "<h1>Home</h1>" },
			{ url: "http://localhost/about", expected: "<h1>About</h1>" },
			{
				url: "http://localhost/blog/hello-world",
				expected: "<h1>Blog: hello-world</h1>",
			},
			{
				url: "http://localhost/shop/electronics/laptop",
				expected: "<h1>Shop: electronics/laptop</h1>",
			},
			{
				url: "http://localhost/docs/api/routing",
				expected: "<h1>Docs: api/routing</h1>",
			},
		];

		for (const testCase of testCases) {
			const url = new URL(testCase.url);
			const ctx = new Context("GET", url, new Headers());
			await router.handleRequest(ctx);
			assert.strictEqual(ctx.responseBody, testCase.expected);
		}
	});

	await t.test("end-to-end with custom handler", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "api", "[id]"), { recursive: true });

		await writeFile(
			join(pagesDir, "api", "[id]", "index.js"),
			`
			export const getData = (id) => ({ id, name: \`Item \${id}\` });
		`,
		);

		const router = new Router();
		await registerFileRoutes(router, pagesDir, {
			handler: async (ctx, route) => {
				const module = await import(route.module);
				if (module.getData) {
					const data = module.getData(ctx.pathParams.id);
					ctx.json(data);
				} else {
					ctx.json({ error: "No data handler" });
				}
			},
		});

		// Test the API endpoint
		const url = new URL("http://localhost/api/123");
		const ctx = new Context("GET", url, new Headers());
		await router.handleRequest(ctx);

		const response = JSON.parse(ctx.responseBody);
		assert.deepStrictEqual(response, { id: "123", name: "Item 123" });
	});

	await t.test("handles route priority correctly in real routing", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "blog"), { recursive: true });
		await mkdir(join(pagesDir, "blog", "[slug]"), { recursive: true });
		await mkdir(join(pagesDir, "blog", "special"), { recursive: true });

		// Create overlapping routes
		await writeFile(
			join(pagesDir, "blog", "index.js"),
			`
			export default (ctx) => ctx.text('Blog index');
		`,
		);
		await writeFile(
			join(pagesDir, "blog", "[slug]", "index.js"),
			`
			export default (ctx) => ctx.text(\`Dynamic: \${ctx.pathParams.slug}\`);
		`,
		);
		await writeFile(
			join(pagesDir, "blog", "special", "index.js"),
			`
			export default (ctx) => ctx.text('Special blog');
		`,
		);

		const router = new Router();
		await registerFileRoutes(router, pagesDir);

		// Test that static routes take precedence over dynamic ones
		const testCases = [
			{ url: "http://localhost/blog", expected: "Blog index" },
			{ url: "http://localhost/blog/special", expected: "Special blog" },
			{
				url: "http://localhost/blog/dynamic-post",
				expected: "Dynamic: dynamic-post",
			},
		];

		for (const testCase of testCases) {
			const url = new URL(testCase.url);
			const ctx = new Context("GET", url, new Headers());
			await router.handleRequest(ctx);
			assert.strictEqual(ctx.responseBody, testCase.expected);
		}
	});

	await t.test("works with different HTTP methods", async () => {
		const apiDir = join(testDir, "api");
		await mkdir(join(apiDir, "users"), { recursive: true });

		await writeFile(
			join(apiDir, "users", "index.js"),
			`
			export default (ctx) => ctx.json({ method: ctx.method, path: '/users' });
		`,
		);

		const router = new Router();

		// Register same routes for different methods
		await registerFileRoutes(router, apiDir, { method: "GET" });
		await registerFileRoutes(router, apiDir, { method: "POST" });
		await registerFileRoutes(router, apiDir, { method: "PUT" });

		// Test different methods
		const methods = ["GET", "POST", "PUT"];
		for (const method of methods) {
			const url = new URL("http://localhost/users");
			const ctx = new Context(method, url, new Headers());
			await router.handleRequest(ctx);

			const response = JSON.parse(ctx.responseBody);
			assert.deepStrictEqual(response, { method, path: "/users" });
		}
	});

	await t.test("handles errors gracefully", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });

		// Create a page that throws an error
		await writeFile(
			join(pagesDir, "index.js"),
			`
			export default (ctx) => {
				throw new Error("Page error");
			};
		`,
		);

		const router = new Router();
		await registerFileRoutes(router, pagesDir);

		const url = new URL("http://localhost/");
		const ctx = new Context("GET", url, new Headers());
		await router.handleRequest(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500);
		assert.strictEqual(ctx.responseBody, "Internal Server Error");
	});

	await t.test("supports complex nested dynamic routes", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(
			join(
				pagesDir,
				"api",
				"v1",
				"[version]",
				"users",
				"[id]",
				"posts",
				"[postId]",
			),
			{ recursive: true },
		);

		await writeFile(
			join(
				pagesDir,
				"api",
				"v1",
				"[version]",
				"users",
				"[id]",
				"posts",
				"[postId]",
				"index.js",
			),
			`
			export default (ctx) => {
				const { version, id, postId } = ctx.pathParams;
				ctx.json({ version, userId: id, postId, path: ctx.path });
			};
		`,
		);

		const router = new Router();
		await registerFileRoutes(router, pagesDir);

		const url = new URL("http://localhost/api/v1/2/users/123/posts/456");
		const ctx = new Context("GET", url, new Headers());
		await router.handleRequest(ctx);

		const response = JSON.parse(ctx.responseBody);
		assert.deepStrictEqual(response, {
			version: "2",
			userId: "123",
			postId: "456",
			path: "/api/v1/2/users/123/posts/456",
		});
	});
});
