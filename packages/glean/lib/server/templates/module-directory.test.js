/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for module directory template - simplified for optimized design
 */

import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { moduleDirectoryTemplate } from "./module-directory.js";

/**
 * Create mock data for testing
 * @param {Object} overrides - Override values
 * @returns {Object} Mock data
 */
function createMockData(overrides = {}) {
	return {
		moduleList: [
			{
				importPath: "test-package",
				isDefault: true,
				hasDescription: true,
				description: "Main module description",
				publicEntityCount: 3,
			},
			{
				importPath: "test-package/utils",
				isDefault: false,
				hasDescription: true,
				description: "Utils module description",
				publicEntityCount: 2,
			},
		],
		directoryStats: {
			totalModules: 2,
			totalPublicEntities: 5,
			entityTypeDistribution: { function: 3, class: 2 },
		},
		packageName: "test-package",
		packageDescription: "A test package",
		hasModules: true,
		hasPublicEntities: true,
		packageMetadata: {
			author: "Test Author",
			homepage: "https://example.com",
		},
		generationTimestamp: new Date().toISOString(),
		...overrides,
	};
}

describe("moduleDirectoryTemplate", () => {
	test("renders basic page structure", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		assert(html.includes("<html"), "Contains HTML structure");
		assert(html.includes("📦 Modules"), "Contains page title");
		assert(html.includes("Explore the 2 modules"), "Contains module count");
		assert(html.includes("in test-package"), "Contains package name");
		assert(html.includes("5 Public APIs"), "Contains API count badge");
	});

	test("renders module cards with simplified information", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		// Module cards
		assert(html.includes("test-package"), "Contains main module name");
		assert(html.includes("utils"), "Contains utils module name");
		assert(html.includes("default"), "Shows default module badge");

		// Module metadata
		assert(html.includes("3"), "Shows entity counts");
		assert(html.includes("APIs"), "Shows API label");

		// Module descriptions (should be full descriptions, not truncated)
		assert(
			html.includes("Main module description"),
			"Contains main module description",
		);
		assert(
			html.includes("Utils module description"),
			"Contains utils module description",
		);
	});

	test("handles empty module list gracefully", () => {
		const data = createMockData({
			hasModules: false,
			moduleList: [],
			directoryStats: {
				totalModules: 0,
				totalPublicEntities: 0,
				entityTypeDistribution: {},
			},
		});
		const html = moduleDirectoryTemplate(data);

		assert(html.includes("No Modules Available"), "Shows empty state");
		assert(
			html.includes("This package doesn't contain any modules yet"),
			"Shows empty message",
		);
	});

	test("handles long descriptions correctly", () => {
		const longDescription = "A".repeat(1200); // Over 1000 characters
		const data = createMockData({
			moduleList: [
				{
					importPath: "test-package",
					isDefault: true,
					hasDescription: true,
					description: longDescription,
					publicEntityCount: 1,
				},
			],
		});
		const html = moduleDirectoryTemplate(data);

		assert(
			html.includes("..."),
			"Shows truncation indicator for long description",
		);
		assert(
			html.includes(longDescription.slice(0, 100)),
			"Contains start of description",
		);
	});

	test("includes proper meta tags and footer", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		assert(html.includes("Powered by Glean"), "Contains Glean attribution");
		assert(html.includes("Test Author"), "Contains package author");
	});
});
