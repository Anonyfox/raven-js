/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for scanner.js with real filesystem operations
 */

import { strict as assert } from "node:assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { FileRoute } from "./file-route.js";
import { scanRoutes } from "./scanner.js";

test("scanRoutes function", async (t) => {
	let testDir;

	t.beforeEach(async () => {
		// Create temporary directory for each test
		testDir = await mkdtemp(join(tmpdir(), "wings-file-routes-test-"));
		// Create package.json to make it an ESM module
		await writeFile(join(testDir, "package.json"), '{"type": "module"}');
	});

	t.afterEach(async () => {
		// Clean up temporary directory after each test
		if (testDir) {
			await rm(testDir, { recursive: true, force: true });
		}
	});

	await t.test("scans empty directory", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });

		const routes = await scanRoutes(pagesDir);

		assert.strictEqual(routes.length, 0);
		assert.ok(Array.isArray(routes));
	});

	await t.test("scans single static route", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "index.mjs"),
			'export default () => "Home";',
		);

		const routes = await scanRoutes(pagesDir, { indexFile: "index.mjs" });

		assert.strictEqual(routes.length, 1);
		assert.ok(routes[0] instanceof FileRoute);
		assert.strictEqual(routes[0].pattern, "/");
		assert.strictEqual(routes[0].params.length, 0);
		assert.strictEqual(routes[0].catchAll, false);
		assert.ok(routes[0].module.endsWith("index.mjs"));
	});

	await t.test("scans nested static routes", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "about"), { recursive: true });
		await writeFile(join(pagesDir, "index.js"), 'export default () => "Home";');
		await writeFile(
			join(pagesDir, "about", "index.js"),
			'export default () => "About";',
		);

		const routes = await scanRoutes(pagesDir);

		assert.strictEqual(routes.length, 2);

		// Find routes by pattern
		const homeRoute = routes.find((r) => r.pattern === "/");
		const aboutRoute = routes.find((r) => r.pattern === "/about");

		assert.ok(homeRoute, "Home route should exist");
		assert.ok(aboutRoute, "About route should exist");
		assert.strictEqual(homeRoute.priority, 0);
		assert.strictEqual(aboutRoute.priority, 0);
	});

	await t.test("scans dynamic routes", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "blog", "[slug]"), { recursive: true });
		await writeFile(
			join(pagesDir, "blog", "[slug]", "index.js"),
			'export default () => "Blog Post";',
		);

		const routes = await scanRoutes(pagesDir);

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/blog/:slug");
		assert.deepStrictEqual(routes[0].params, ["slug"]);
		assert.strictEqual(routes[0].catchAll, false);
		assert.strictEqual(routes[0].priority, 1);
	});

	await t.test("scans nested dynamic routes", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "shop", "[category]", "[item]"), {
			recursive: true,
		});
		await writeFile(
			join(pagesDir, "shop", "[category]", "[item]", "index.js"),
			'export default () => "Product";',
		);

		const routes = await scanRoutes(pagesDir);

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/shop/:category/:item");
		assert.deepStrictEqual(routes[0].params, ["category", "item"]);
		assert.strictEqual(routes[0].catchAll, false);
		assert.strictEqual(routes[0].priority, 1);
	});

	await t.test("scans catch-all routes", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "docs", "[...path]"), { recursive: true });
		await writeFile(
			join(pagesDir, "docs", "[...path]", "index.js"),
			'export default () => "Docs";',
		);

		const routes = await scanRoutes(pagesDir);

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/docs/*");
		assert.deepStrictEqual(routes[0].params, ["*path"]);
		assert.strictEqual(routes[0].catchAll, true);
		assert.strictEqual(routes[0].priority, 2);
	});

	await t.test("sorts routes by priority", async () => {
		const pagesDir = join(testDir, "pages");

		// Create routes in mixed order
		await mkdir(join(pagesDir, "docs", "[...path]"), { recursive: true });
		await mkdir(join(pagesDir, "blog", "[slug]"), { recursive: true });
		await mkdir(join(pagesDir, "about"), { recursive: true });

		await writeFile(
			join(pagesDir, "docs", "[...path]", "index.js"),
			'export default () => "Docs";',
		);
		await writeFile(
			join(pagesDir, "blog", "[slug]", "index.js"),
			'export default () => "Blog";',
		);
		await writeFile(
			join(pagesDir, "about", "index.js"),
			'export default () => "About";',
		);

		const routes = await scanRoutes(pagesDir);

		assert.strictEqual(routes.length, 3);

		// Should be sorted: static (0), dynamic (1), catch-all (2)
		assert.strictEqual(routes[0].priority, 0); // /about
		assert.strictEqual(routes[1].priority, 1); // /blog/:slug
		assert.strictEqual(routes[2].priority, 2); // /docs/*path
	});

	await t.test("handles custom index file name", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(
			join(pagesDir, "page.js"),
			'export default () => "Custom";',
		);

		const routes = await scanRoutes(pagesDir, { indexFile: "page.js" });

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/");
		assert.ok(routes[0].module.endsWith("page.js"));
	});

	await t.test("handles includeNested option", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(join(pagesDir, "about"), { recursive: true });
		await writeFile(join(pagesDir, "index.js"), 'export default () => "Home";');
		await writeFile(
			join(pagesDir, "about", "index.js"),
			'export default () => "About";',
		);

		const routes = await scanRoutes(pagesDir, { includeNested: false });

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/");
	});

	await t.test("handles custom baseDir", async () => {
		const pagesDir = join(testDir, "src", "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(join(pagesDir, "index.js"), 'export default () => "Home";');

		const routes = await scanRoutes("src/pages", { baseDir: testDir });

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/");
		assert.ok(routes[0].module.includes(join("src", "pages", "index.js")));
	});

	await t.test("handles options object as first parameter", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(join(pagesDir, "index.js"), 'export default () => "Home";');

		const routes = await scanRoutes({
			pagesDir: "pages",
			baseDir: testDir,
			indexFile: "index.js",
			includeNested: true,
		});

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/");
	});

	await t.test("throws error for non-existent base directory", async () => {
		const nonExistentDir = join(testDir, "non-existent");

		await assert.rejects(
			async () => await scanRoutes(nonExistentDir),
			/Failed to scan routes/,
		);
	});

	await t.test("ignores non-index files", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(join(pagesDir, "index.js"), 'export default () => "Home";');
		await writeFile(
			join(pagesDir, "helper.js"),
			"export const helper = () => {};",
		);
		await writeFile(join(pagesDir, "README.md"), "# Pages");

		const routes = await scanRoutes(pagesDir);

		assert.strictEqual(routes.length, 1);
		assert.strictEqual(routes[0].pattern, "/");
	});

	await t.test("creates absolute module paths", async () => {
		const pagesDir = join(testDir, "pages");
		await mkdir(pagesDir, { recursive: true });
		await writeFile(join(pagesDir, "index.js"), 'export default () => "Home";');

		const routes = await scanRoutes(pagesDir);

		assert.strictEqual(routes.length, 1);
		assert.ok(
			routes[0].module.startsWith("/") || routes[0].module.match(/^[A-Z]:/),
		); // Unix or Windows absolute path
		assert.ok(routes[0].module.endsWith("index.js"));
	});

	await t.test("handles complex nested structure", async () => {
		const pagesDir = join(testDir, "pages");

		// Create complex structure
		await mkdir(join(pagesDir, "api", "v1", "[version]"), { recursive: true });
		await mkdir(join(pagesDir, "blog", "[slug]"), { recursive: true });
		await mkdir(join(pagesDir, "docs", "[...path]"), { recursive: true });
		await mkdir(join(pagesDir, "shop", "[category]", "[item]"), {
			recursive: true,
		});

		await writeFile(join(pagesDir, "index.js"), 'export default () => "Home";');
		await writeFile(
			join(pagesDir, "api", "v1", "[version]", "index.js"),
			'export default () => "API";',
		);
		await writeFile(
			join(pagesDir, "blog", "[slug]", "index.js"),
			'export default () => "Blog";',
		);
		await writeFile(
			join(pagesDir, "docs", "[...path]", "index.js"),
			'export default () => "Docs";',
		);
		await writeFile(
			join(pagesDir, "shop", "[category]", "[item]", "index.js"),
			'export default () => "Shop";',
		);

		const routes = await scanRoutes(pagesDir);

		assert.strictEqual(routes.length, 5);

		// Verify patterns
		const patterns = routes.map((r) => r.pattern).sort();
		assert.deepStrictEqual(patterns, [
			"/",
			"/api/v1/:version",
			"/blog/:slug",
			"/docs/*",
			"/shop/:category/:item",
		]);
	});
});
