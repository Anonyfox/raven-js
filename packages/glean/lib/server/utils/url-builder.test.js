/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for URL building utilities.
 */

import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { createUrlBuilder } from "./url-builder.js";

describe("createUrlBuilder", () => {
	test("creates URL builder with default root base path", () => {
		const builder = createUrlBuilder();

		assert.equal(builder.buildUrl("/test"), "/test");
		assert.equal(builder.moduleUrl("core"), "/modules/core/");
		assert.equal(
			builder.entityUrl("core", "MyClass"),
			"/modules/core/MyClass/",
		);
		assert.equal(builder.assetUrl("logo.png"), "/assets/logo.png");
		assert.equal(builder.sitemapUrl(), "/sitemap.xml");
		assert.equal(builder.modulesUrl(), "/modules/");
		assert.equal(builder.homeUrl(), "/");
	});

	test("creates URL builder with custom base path", () => {
		const builder = createUrlBuilder("/beak");

		assert.equal(builder.buildUrl("/test"), "/beak/test");
		assert.equal(builder.moduleUrl("core"), "/beak/modules/core/");
		assert.equal(
			builder.entityUrl("core", "MyClass"),
			"/beak/modules/core/MyClass/",
		);
		assert.equal(builder.assetUrl("logo.png"), "/beak/assets/logo.png");
		assert.equal(
			builder.staticUrl("bootstrap.min.css"),
			"/beak/bootstrap.min.css",
		);
		assert.equal(builder.sitemapUrl(), "/beak/sitemap.xml");
		assert.equal(builder.modulesUrl(), "/beak/modules/");
		assert.equal(builder.homeUrl(), "/beak/");
	});

	test("normalizes base paths with leading and trailing slashes", () => {
		const testCases = [
			{ input: "beak", expected: "/beak" },
			{ input: "/beak", expected: "/beak" },
			{ input: "beak/", expected: "/beak" },
			{ input: "/beak/", expected: "/beak" },
			{ input: "///beak///", expected: "/beak" },
			{ input: "/", expected: "/" },
		];

		for (const { input, expected } of testCases) {
			const builder = createUrlBuilder(input);
			const result = builder.buildUrl("/test");
			const expectedUrl = expected === "/" ? "/test" : `${expected}/test`;
			assert.equal(result, expectedUrl, `Input: "${input}"`);
		}
	});

	test("handles complex module and entity names", () => {
		const builder = createUrlBuilder("/wings");

		assert.equal(
			builder.moduleUrl("core/middleware"),
			"/wings/modules/core/middleware/",
		);
		assert.equal(
			builder.entityUrl("utils/helpers", "validateConfig"),
			"/wings/modules/utils/helpers/validateConfig/",
		);
	});

	test("builds URLs consistently without double slashes", () => {
		const builder = createUrlBuilder("/cortex/");

		// All these should produce clean URLs without double slashes
		assert.equal(builder.buildUrl("/test"), "/cortex/test");
		assert.equal(builder.buildUrl("test"), "/cortex/test");
		assert.equal(builder.buildUrl("/test/"), "/cortex/test/");
		assert.equal(builder.buildUrl("test/"), "/cortex/test/");
	});

	test("works with deep base paths", () => {
		const builder = createUrlBuilder("/docs/packages/glean");

		assert.equal(builder.homeUrl(), "/docs/packages/glean/");
		assert.equal(
			builder.moduleUrl("index"),
			"/docs/packages/glean/modules/index/",
		);
		assert.equal(
			builder.entityUrl("server", "createHandler"),
			"/docs/packages/glean/modules/server/createHandler/",
		);
	});
});
