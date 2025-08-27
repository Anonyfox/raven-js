/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for sitemap data extraction
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { extractSitemapData } from "./sitemap.js";

describe("extractSitemapData", () => {
	/**
	 * Create mock package for testing
	 * @returns {Object} Mock package instance
	 */
	function createMockPackage() {
		return {
			modules: [
				{
					importPath: "test-package",
					isDefault: true,
					publicEntities: [{ name: "mainFunction" }, { name: "MainClass" }],
				},
				{
					importPath: "test-package/utils",
					isDefault: false,
					publicEntities: [
						{ name: "helperFunction" },
						{ name: "UtilityClass" },
					],
				},
				{
					importPath: "test-package/helpers",
					isDefault: false,
					publicEntities: [],
				},
			],
		};
	}

	test("generates sitemap data with all required URLs", () => {
		const mockPackage = createMockPackage();
		const baseUrl = "https://docs.example.com";
		const data = extractSitemapData(mockPackage, baseUrl);

		// Should include package overview
		assert(data.urls.some((url) => url.loc === "https://docs.example.com/"));

		// Should include module directory
		assert(
			data.urls.some((url) => url.loc === "https://docs.example.com/modules/"),
		);

		// Should include all module overview pages
		assert(
			data.urls.some(
				(url) => url.loc === "https://docs.example.com/modules/test-package/",
			),
		);
		assert(
			data.urls.some(
				(url) =>
					url.loc === "https://docs.example.com/modules/test-package%2Futils/",
			),
		);
		assert(
			data.urls.some(
				(url) =>
					url.loc ===
					"https://docs.example.com/modules/test-package%2Fhelpers/",
			),
		);

		// Should include all entity pages
		assert(
			data.urls.some(
				(url) =>
					url.loc ===
					"https://docs.example.com/modules/test-package/mainFunction/",
			),
		);
		assert(
			data.urls.some(
				(url) =>
					url.loc ===
					"https://docs.example.com/modules/test-package/MainClass/",
			),
		);
		assert(
			data.urls.some(
				(url) =>
					url.loc ===
					"https://docs.example.com/modules/test-package%2Futils/helperFunction/",
			),
		);
		assert(
			data.urls.some(
				(url) =>
					url.loc ===
					"https://docs.example.com/modules/test-package%2Futils/UtilityClass/",
			),
		);
	});

	test("sets appropriate priorities for different page types", () => {
		const mockPackage = createMockPackage();
		const data = extractSitemapData(mockPackage);

		// Package overview should have highest priority
		const packageUrl = data.urls.find((url) => url.loc.endsWith("/"));
		assert.strictEqual(packageUrl.priority, "1.0");

		// Module directory should have high priority
		const moduleDir = data.urls.find((url) => url.loc.endsWith("/modules/"));
		assert.strictEqual(moduleDir.priority, "0.9");

		// Default module should have higher priority than non-default
		const defaultModule = data.urls.find(
			(url) =>
				url.loc.includes("/modules/test-package/") && !url.loc.includes("%2F"),
		);
		const nonDefaultModule = data.urls.find(
			(url) =>
				url.loc.includes("/modules/test-package%2Futils/") &&
				!url.loc.includes("Function"),
		);
		assert.strictEqual(defaultModule.priority, "0.8");
		assert.strictEqual(nonDefaultModule.priority, "0.7");

		// Entity pages should have standard priority
		const entityUrl = data.urls.find((url) =>
			url.loc.endsWith("/mainFunction/"),
		);
		assert.strictEqual(entityUrl.priority, "0.6");
	});

	test("includes proper metadata for all URLs", () => {
		const mockPackage = createMockPackage();
		const data = extractSitemapData(mockPackage);

		// All URLs should have required fields
		for (const url of data.urls) {
			assert(url.loc, "URL should have location");
			assert(url.lastmod, "URL should have last modified date");
			assert(url.changefreq, "URL should have change frequency");
			assert(url.priority, "URL should have priority");

			// Validate date format (YYYY-MM-DD)
			assert(
				/^\d{4}-\d{2}-\d{2}$/.test(url.lastmod),
				"Last modified should be valid date",
			);

			// Validate change frequency
			assert(
				["weekly", "monthly"].includes(url.changefreq),
				"Change frequency should be valid",
			);

			// Validate priority range
			const priority = parseFloat(url.priority);
			assert(
				priority >= 0.1 && priority <= 1.0,
				"Priority should be between 0.1 and 1.0",
			);
		}
	});

	test("handles URL encoding correctly", () => {
		const mockPackage = {
			modules: [
				{
					importPath: "test/path with spaces",
					isDefault: false,
					publicEntities: [
						{ name: "function-with-dash" },
						{ name: "functionWith$pecial&chars" },
					],
				},
			],
		};

		const data = extractSitemapData(mockPackage);

		// Should properly encode module path
		assert(
			data.urls.some((url) => url.loc.includes("test%2Fpath%20with%20spaces")),
		);

		// Should properly encode entity names
		assert(data.urls.some((url) => url.loc.includes("function-with-dash")));
		assert(
			data.urls.some((url) =>
				url.loc.includes("functionWith%24pecial%26chars"),
			),
		);
	});

	test("returns proper metadata", () => {
		const mockPackage = createMockPackage();
		const data = extractSitemapData(mockPackage);

		// Should have total URL count
		assert.strictEqual(typeof data.totalUrls, "number");
		assert.strictEqual(data.totalUrls, data.urls.length);

		// Should have generation timestamp
		assert(data.generatedAt, "Should have generation timestamp");
		assert(
			new Date(data.generatedAt),
			"Generation timestamp should be valid date",
		);
	});

	test("handles empty package gracefully", () => {
		const emptyPackage = { modules: [] };
		const data = extractSitemapData(emptyPackage);

		// Should still include package overview and module directory
		assert.strictEqual(data.urls.length, 2);
		assert(data.urls.some((url) => url.loc.endsWith("/")));
		assert(data.urls.some((url) => url.loc.endsWith("/modules/")));
		assert.strictEqual(data.totalUrls, 2);
	});

	test("supports custom base URL", () => {
		const mockPackage = createMockPackage();
		const customBaseUrl = "https://custom.docs.com";
		const data = extractSitemapData(mockPackage, customBaseUrl);

		// All URLs should use custom base URL
		for (const url of data.urls) {
			assert(
				url.loc.startsWith(customBaseUrl),
				`URL should start with custom base: ${url.loc}`,
			);
		}
	});
});
