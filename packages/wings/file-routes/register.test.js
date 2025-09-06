/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for register.js with real Context and Router classes
 */

import { strict as assert } from "node:assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Context } from "../core/context.js";
import { Router } from "../core/router.js";
import { registerFileRoutes } from "./register.js";

test("registerFileRoutes function", async (t) => {
	let testDir;

	t.beforeEach(async () => {
		// Create temporary directory for each test
		testDir = await mkdtemp(join(tmpdir(), "wings-register-test-"));
		// Create package.json to make it an ESM module
		await writeFile(join(testDir, "package.json"), '{"type": "module"}');
	});

	t.afterEach(async () => {
		// Clean up temporary directory after each test
		if (testDir) {
			await rm(testDir, { recursive: true, force: true });
		}
	});

	await t.test("registers routes with default handler", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "index.js"),
			'export default (ctx) => ctx.text("Home");',
		);

		const router = new Router();
		const routes = await registerFileRoutes(router, pagesDir);

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/");

		// Verify route was registered
		const registeredRoutes = router.listRoutes();
		assert.strictEqual(registeredRoutes.length, 1);
		assert.strictEqual(registeredRoutes[0].path, "/");
		assert.strictEqual(registeredRoutes[0].method, "GET");
	});

	await t.test("registers multiple routes", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "about"), { recursive: true });
		await mkdir(join(pagesDir, "blog", "[slug]"), { recursive: true });

		await writeFile(
			join(pagesDir, "index.js"),
			'export default (ctx) => ctx.text("Home");',
		);
		await writeFile(
			join(pagesDir, "about", "index.js"),
			'export default (ctx) => ctx.text("About");',
		);
		await writeFile(
			join(pagesDir, "blog", "[slug]", "index.js"),
			'export default (ctx) => ctx.text("Blog");',
		);

		const router = new Router();
		const routes = await registerFileRoutes(router, pagesDir);

		assert.strictEqual(routes.length, 3);

		// Verify all routes were registered
		const registeredRoutes = router.listRoutes();
		assert.strictEqual(registeredRoutes.length, 3);

		const patterns = registeredRoutes.map((r) => r.path).sort();
		assert.deepStrictEqual(patterns, ["/", "/about", "/blog/:slug"]);
	});

	await t.test("uses custom handler", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "index.js"),
			'export const data = "test-data";',
		);

		let handlerCalled = false;
		let receivedContext = null;
		let receivedRoute = null;

		const customHandler = async (ctx, route) => {
			handlerCalled = true;
			receivedContext = ctx;
			receivedRoute = route;
			ctx.text("Custom handler response");
		};

		const router = new Router();
		await registerFileRoutes(router, pagesDir, { handler: customHandler });

		// Simulate a request
		const url = new URL("http://localhost/");
		const ctx = new Context("GET", url, new Headers());
		await router.handleRequest(ctx);

		assert.strictEqual(handlerCalled, true);
		assert.ok(receivedContext instanceof Context);
		assert.strictEqual(receivedRoute.pattern, "/");
		assert.strictEqual(ctx.responseBody, "Custom handler response");
	});

	await t.test("registers with different HTTP methods", async () => {
		const pagesDir = join(testDir, "api");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "index.js"),
			'export default (ctx) => ctx.json({message: "API"});',
		);

		const router = new Router();
		await registerFileRoutes(router, pagesDir, { method: "POST" });

		const registeredRoutes = router.listRoutes();
		assert.strictEqual(registeredRoutes.length, 1);
		assert.strictEqual(registeredRoutes[0].method, "POST");
	});

	await t.test("supports all HTTP methods", async () => {
		const methods = [
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"PATCH",
			"HEAD",
			"OPTIONS",
		];

		for (const method of methods) {
			const pagesDir = join(testDir, `api-${method.toLowerCase()}`);
			await mkdir(pagesDir, { recursive: true });
			await writeFile(
				join(pagesDir, "index.js"),
				`export default (ctx) => ctx.text("${method}");`,
			);

			const router = new Router();
			await registerFileRoutes(router, pagesDir, { method });

			const registeredRoutes = router.listRoutes();
			assert.strictEqual(registeredRoutes.length, 1);
			assert.strictEqual(registeredRoutes[0].method, method);
		}
	});

	await t.test("throws error for unsupported HTTP method", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "index.js"),
			'export default (ctx) => ctx.text("Home");',
		);

		const router = new Router();

		await assert.rejects(
			async () =>
				await registerFileRoutes(router, pagesDir, { method: "INVALID" }),
			/Unsupported HTTP method: INVALID/,
		);
	});

	await t.test("default handler calls module default export", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "index.js"),
			'export default (ctx) => ctx.text("Module default");',
		);

		const router = new Router();
		await registerFileRoutes(router, pagesDir);

		// Simulate a request
		const url = new URL("http://localhost/");
		const ctx = new Context("GET", url, new Headers());
		await router.handleRequest(ctx);

		assert.strictEqual(ctx.responseBody, "Module default");
	});

	await t.test(
		"default handler handles module without default export",
		async () => {
			const pagesDir = join(testDir, "pages");
			await mkdir(pagesDir, { recursive: true });
			await writeFile(
				join(pagesDir, "index.js"),
				'export const data = "no default";',
			);

			const router = new Router();
			await registerFileRoutes(router, pagesDir);

			// Simulate a request
			const url = new URL("http://localhost/");
			const ctx = new Context("GET", url, new Headers());
			await router.handleRequest(ctx);

			// Should send basic response with route info
			assert.ok(ctx.responseBody.includes("Route: /"));
			assert.ok(ctx.responseBody.includes("Module:"));
		},
	);

	await t.test("default handler handles module import errors", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "index.js"),
			'throw new Error("Module error");',
		);

		const router = new Router();
		await registerFileRoutes(router, pagesDir);

		// Simulate a request
		const url = new URL("http://localhost/");
		const ctx = new Context("GET", url, new Headers());
		await router.handleRequest(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500);
		assert.strictEqual(ctx.responseBody, "Internal Server Error");
	});

	await t.test("passes scan options through", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "page.js"),
			'export default (ctx) => ctx.text("Custom index");',
		);

		const router = new Router();
		const routes = await registerFileRoutes(router, pagesDir, {
			indexFile: "page.js",
			includeNested: false,
		});

		assert.strictEqual(routes.length, 1);
		assert.ok(routes[0].module.endsWith("page.js"));
	});

	await t.test("handles dynamic routes with parameters", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "blog", "[slug]"), { recursive: true });
		await writeFile(
			join(pagesDir, "blog", "[slug]", "index.js"),
			'export default (ctx) => ctx.text("Blog post: " + ctx.pathParams.slug);',
		);

		const router = new Router();
		await registerFileRoutes(router, pagesDir);

		// Simulate a request with parameters
		const url = new URL("http://localhost/blog/hello-world");
		const ctx = new Context("GET", url, new Headers());
		await router.handleRequest(ctx);

		assert.strictEqual(ctx.responseBody, "Blog post: hello-world");
	});

	await t.test("handles catch-all routes", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "docs", "[...path]"), { recursive: true });
		await writeFile(
			join(pagesDir, "docs", "[...path]", "index.js"),
			'export default (ctx) => ctx.text("Docs path: " + ctx.pathParams["*path"]);',
		);

		const router = new Router();
		await registerFileRoutes(router, pagesDir);

		// Simulate a request with catch-all path
		const url = new URL("http://localhost/docs/api/routing/advanced");
		const ctx = new Context("GET", url, new Headers());
		await router.handleRequest(ctx);

		assert.strictEqual(ctx.responseBody, "Docs path: api/routing/advanced");
	});

	await t.test("returns registered routes in correct order", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "docs", "[...path]"), { recursive: true });
		await mkdir(join(pagesDir, "blog", "[slug]"), { recursive: true });
		await mkdir(join(pagesDir, "about"), { recursive: true });

		await writeFile(
			join(pagesDir, "docs", "[...path]", "index.js"),
			"export default () => {};",
		);
		await writeFile(
			join(pagesDir, "blog", "[slug]", "index.js"),
			"export default () => {};",
		);
		await writeFile(
			join(pagesDir, "about", "index.js"),
			"export default () => {};",
		);

		const router = new Router();
		const routes = await registerFileRoutes(router, pagesDir);

		// Should be sorted by priority: static, dynamic, catch-all
		assert.strictEqual(routes[0].priority, 0); // /about
		assert.strictEqual(routes[1].priority, 1); // /blog/:slug
		assert.strictEqual(routes[2].priority, 2); // /docs/*path
	});

	await t.test("works with options object as first parameter", async () => {
		const pagesDir = join(testDir, "src", "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "index.js"),
			'export default (ctx) => ctx.text("Home");',
		);

		const router = new Router();
		const routes = await registerFileRoutes(router, {
			pagesDir: "src/pages",
			baseDir: testDir,
		});

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/");
	});
});
