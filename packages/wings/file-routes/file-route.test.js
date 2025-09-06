/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for FileRoute class
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { FileRoute } from "./file-route.js";

test("FileRoute class", async (t) => {
	await t.test("creates static route correctly", () => {
		const route = new FileRoute("/about", "/path/to/about/index.js", [], false);

		assert.strictEqual(route.pattern, "/about");
		assert.strictEqual(route.module, "/path/to/about/index.js");
		assert.deepStrictEqual(route.params, []);
		assert.strictEqual(route.catchAll, false);
		assert.strictEqual(route.priority, 0); // Static routes have priority 0
	});

	await t.test("creates dynamic route correctly", () => {
		const route = new FileRoute(
			"/blog/:slug",
			"/path/to/blog/[slug]/index.js",
			["slug"],
			false,
		);

		assert.strictEqual(route.pattern, "/blog/:slug");
		assert.strictEqual(route.module, "/path/to/blog/[slug]/index.js");
		assert.deepStrictEqual(route.params, ["slug"]);
		assert.strictEqual(route.catchAll, false);
		assert.strictEqual(route.priority, 1); // Dynamic routes have priority 1
	});

	await t.test("creates nested dynamic route correctly", () => {
		const route = new FileRoute(
			"/shop/:category/:item",
			"/path/to/shop/[category]/[item]/index.js",
			["category", "item"],
			false,
		);

		assert.strictEqual(route.pattern, "/shop/:category/:item");
		assert.strictEqual(
			route.module,
			"/path/to/shop/[category]/[item]/index.js",
		);
		assert.deepStrictEqual(route.params, ["category", "item"]);
		assert.strictEqual(route.catchAll, false);
		assert.strictEqual(route.priority, 1); // Dynamic routes have priority 1
	});

	await t.test("creates catch-all route correctly", () => {
		const route = new FileRoute(
			"/docs/*path",
			"/path/to/docs/[...path]/index.js",
			["*path"],
			true,
		);

		assert.strictEqual(route.pattern, "/docs/*path");
		assert.strictEqual(route.module, "/path/to/docs/[...path]/index.js");
		assert.deepStrictEqual(route.params, ["*path"]);
		assert.strictEqual(route.catchAll, true);
		assert.strictEqual(route.priority, 2); // Catch-all routes have priority 2
	});

	await t.test("compareTo sorts routes by priority", () => {
		const staticRoute = new FileRoute("/about", "/about/index.js", [], false);
		const dynamicRoute = new FileRoute(
			"/blog/:slug",
			"/blog/[slug]/index.js",
			["slug"],
			false,
		);
		const catchAllRoute = new FileRoute(
			"/docs/*path",
			"/docs/[...path]/index.js",
			["*path"],
			true,
		);

		// Static < Dynamic
		assert.ok(staticRoute.compareTo(dynamicRoute) < 0);
		// Dynamic < Catch-all
		assert.ok(dynamicRoute.compareTo(catchAllRoute) < 0);
		// Static < Catch-all
		assert.ok(staticRoute.compareTo(catchAllRoute) < 0);
	});

	await t.test("compareTo sorts by specificity within same priority", () => {
		const singleParam = new FileRoute(
			"/blog/:slug",
			"/blog/[slug]/index.js",
			["slug"],
			false,
		);
		const doubleParam = new FileRoute(
			"/shop/:category/:item",
			"/shop/[category]/[item]/index.js",
			["category", "item"],
			false,
		);

		// Fewer params = more specific = higher precedence
		assert.ok(singleParam.compareTo(doubleParam) < 0);
	});

	await t.test(
		"compareTo sorts alphabetically for same priority and param count",
		() => {
			const routeA = new FileRoute(
				"/blog/:slug",
				"/blog/[slug]/index.js",
				["slug"],
				false,
			);
			const routeB = new FileRoute(
				"/news/:slug",
				"/news/[slug]/index.js",
				["slug"],
				false,
			);

			// Alphabetical order: /blog < /news
			assert.ok(routeA.compareTo(routeB) < 0);
		},
	);

	await t.test("toString returns readable representation", () => {
		const route = new FileRoute(
			"/blog/:slug",
			"/path/to/blog/[slug]/index.js",
			["slug"],
			false,
		);
		const result = route.toString();

		assert.strictEqual(
			result,
			"FileRoute(/blog/:slug -> /path/to/blog/[slug]/index.js)",
		);
	});

	await t.test("toJSON returns serializable object", () => {
		const route = new FileRoute(
			"/blog/:slug",
			"/path/to/blog/[slug]/index.js",
			["slug"],
			false,
		);
		const json = route.toJSON();

		assert.deepStrictEqual(json, {
			pattern: "/blog/:slug",
			module: "/path/to/blog/[slug]/index.js",
			params: ["slug"],
			catchAll: false,
			priority: 1,
		});
	});

	await t.test("calculatePriority assigns correct values", () => {
		const staticRoute = new FileRoute("/about", "/about/index.js", [], false);
		const dynamicRoute = new FileRoute(
			"/blog/:slug",
			"/blog/[slug]/index.js",
			["slug"],
			false,
		);
		const catchAllRoute = new FileRoute(
			"/docs/*path",
			"/docs/[...path]/index.js",
			["*path"],
			true,
		);

		assert.strictEqual(staticRoute.priority, 0);
		assert.strictEqual(dynamicRoute.priority, 1);
		assert.strictEqual(catchAllRoute.priority, 2);
	});

	await t.test("handles empty params array", () => {
		const route = new FileRoute("/", "/index.js", [], false);

		assert.deepStrictEqual(route.params, []);
		assert.strictEqual(route.priority, 0);
	});

	await t.test("handles multiple catch-all params", () => {
		const route = new FileRoute(
			"/api/*path",
			"/api/[...path]/index.js",
			["*path"],
			true,
		);

		assert.strictEqual(route.catchAll, true);
		assert.strictEqual(route.priority, 2);
		assert.deepStrictEqual(route.params, ["*path"]);
	});
});
