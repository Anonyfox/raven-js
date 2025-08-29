/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for package overview template
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { packageOverviewTemplate } from "./package-overview.js";

describe("packageOverviewTemplate", () => {
	/**
	 * Create mock data for testing
	 * @param {Object} overrides - Override default values
	 * @returns {Object} Mock package overview data
	 */
	function createMockData(overrides = {}) {
		return {
			name: "test-package",
			version: "1.0.0",
			description: "A test package for documentation",
			readmeMarkdown:
				"# Test Package\n\nThis is a test package with **markdown** content.",
			modules: [
				{
					name: "test-package",
					isDefault: true,
					publicEntityCount: 5,
					availableTypes: ["function", "class"],
				},
				{
					name: "test-package/utils",
					isDefault: false,
					publicEntityCount: 3,
					availableTypes: ["function"],
				},
			],
			stats: {
				moduleCount: 2,
				entityCount: 10,
				publicEntityCount: 8,
			},
			hasReadme: true,
			hasModules: true,
			hasPublicEntities: true,
			...overrides,
		};
	}

	test("includes package header information", () => {
		const data = createMockData();
		const html = packageOverviewTemplate(data);

		// Package name
		assert(html.includes("test-package"), "Contains package name");

		// Version
		assert(html.includes("v1.0.0"), "Contains package version");

		// Description
		assert(
			html.includes("A test package for documentation"),
			"Contains package description",
		);
	});

	test("renders README content as markdown", () => {
		const data = createMockData({
			readmeMarkdown: "# Hello World\n\nThis is **bold** text with `code`.",
		});
		const html = packageOverviewTemplate(data);

		// Check that markdown is processed to HTML
		assert(html.includes("<h1>"), "Converts markdown headers to HTML");
		assert(html.includes("<strong>"), "Converts markdown bold to HTML");
		assert(html.includes("Hello World"), "Contains README content");
	});

	test("handles missing README gracefully", () => {
		const data = createMockData({
			readmeMarkdown: "",
			hasReadme: false,
		});
		const html = packageOverviewTemplate(data);

		assert(html.includes("No README Available"), "Shows no README message");
		assert(!html.includes("<h1>"), "Does not render empty markdown");
	});

	test("displays package statistics correctly", () => {
		const data = createMockData({
			stats: {
				moduleCount: 3,
				entityCount: 15,
				publicEntityCount: 12,
			},
		});
		const html = packageOverviewTemplate(data);

		// Module count
		assert(html.includes("3"), "Contains module count");
		assert(html.includes("Module"), "Contains module label");

		// Public entity count
		assert(html.includes("12"), "Contains public entity count");
		assert(html.includes("Public"), "Contains public label");

		// Total entity count
		assert(html.includes("15"), "Contains total entity count");
		assert(html.includes("Total"), "Contains total label");
	});

	test("renders module navigation correctly", () => {
		const data = createMockData();
		const html = packageOverviewTemplate(data);

		// Module names
		assert(html.includes("test-package"), "Contains default module name");
		assert(html.includes("utils"), "Contains utils module name");

		// Default module badge
		assert(html.includes("default"), "Shows default module badge");

		// Entity counts
		assert(html.includes("5"), "Shows module entity count");
		assert(html.includes("3"), "Shows utils entity count");

		// Entity types
		assert(html.includes("function"), "Shows function type");
		assert(html.includes("class"), "Shows class type");

		// Module links
		assert(
			html.includes('href="/modules/test-package/"'),
			"Contains default module link",
		);
		assert(
			html.includes('href="/modules/utils/"'),
			"Contains utils module link",
		);
	});

	test("handles package without modules", () => {
		const data = createMockData({
			modules: [],
			hasModules: false,
			stats: {
				moduleCount: 0,
				entityCount: 0,
				publicEntityCount: 0,
			},
		});
		const html = packageOverviewTemplate(data);

		// Should use full width layout for README
		assert(html.includes("col-12"), "Uses full width layout");

		// Should not show module navigation
		assert(!html.includes("🗂️ Modules"), "Does not show module navigation");

		// Should still show statistics (zeros)
		assert(html.includes("0"), "Shows zero statistics");
	});

	test("includes navigation links", () => {
		const data = createMockData();
		const html = packageOverviewTemplate(data);

		// Quick navigation
		assert(html.includes('href="/modules/"'), "Contains modules link");
		assert(html.includes('href="/api/"'), "Contains API reference link");
		assert(html.includes("Browse Modules"), "Contains module browse text");
		assert(html.includes("API Reference"), "Contains API reference text");
	});

	test("includes getting started section when modules exist", () => {
		const data = createMockData();
		const html = packageOverviewTemplate(data);

		assert(
			html.includes("Getting Started"),
			"Contains getting started section",
		);
		assert(
			html.includes("npm install test-package"),
			"Contains install command",
		);
		assert(
			html.includes("import { ... } from 'test-package'"),
			"Contains import example",
		);
	});

	test("omits getting started section when no modules", () => {
		const data = createMockData({
			modules: [],
			hasModules: false,
		});
		const html = packageOverviewTemplate(data);

		assert(
			!html.includes("🚀 Getting Started"),
			"Does not show getting started section",
		);
	});

	test("handles singular vs plural labels correctly", () => {
		const dataSingular = createMockData({
			stats: {
				moduleCount: 1,
				entityCount: 1,
				publicEntityCount: 1,
			},
		});
		const htmlSingular = packageOverviewTemplate(dataSingular);

		// Check singular in statistics display
		assert(htmlSingular.includes("1"), "Contains module count");
		assert(htmlSingular.includes("Module"), "Uses singular module label");

		const dataPlural = createMockData({
			stats: {
				moduleCount: 2,
				entityCount: 5,
				publicEntityCount: 3,
			},
		});
		const htmlPlural = packageOverviewTemplate(dataPlural);

		assert(
			htmlPlural.includes("Modules"),
			"Uses plural module label for multiple",
		);
	});

	test("calculates coverage percentage correctly", () => {
		const data = createMockData({
			stats: {
				moduleCount: 2,
				entityCount: 10,
				publicEntityCount: 8,
			},
		});
		const html = packageOverviewTemplate(data);

		// 8/10 * 100 = 80%
		assert(html.includes("80%"), "Shows correct coverage percentage");
	});

	test("handles zero entities coverage calculation", () => {
		const data = createMockData({
			stats: {
				moduleCount: 1,
				entityCount: 0,
				publicEntityCount: 0,
			},
		});
		const html = packageOverviewTemplate(data);

		assert(html.includes("0%"), "Shows 0% for no entities");
	});

	test("includes proper meta tags via base template", () => {
		const data = createMockData();
		const html = packageOverviewTemplate(data);

		// Should include base template structure
		assert(html.includes("<!DOCTYPE html>"), "Contains proper DOCTYPE");
		assert(
			html.includes("test-package Documentation"),
			"Contains proper title",
		);
		assert(
			html.includes("A test package for documentation"),
			"Contains description in meta",
		);
	});

	test("includes CSS styles for README formatting", () => {
		const data = createMockData();
		const html = packageOverviewTemplate(data);

		assert(html.includes(".readme-content"), "Contains README styling classes");
		assert(html.includes("margin-top"), "Contains CSS rules");
		assert(html.includes("code {"), "Contains code block styling");
		assert(html.includes("table {"), "Contains table styling");
	});

	test("handles missing optional data gracefully", () => {
		const data = createMockData({
			version: "",
			description: "",
			availableTypes: [],
		});
		const html = packageOverviewTemplate(data);

		// Should still render without errors
		assert(html.includes("test-package"), "Still contains package name");
		assert(html.includes("<!DOCTYPE html>"), "Still valid HTML");
	});

	test("includes search functionality when entities exist", () => {
		const data = createMockData({
			hasPublicEntities: true,
		});
		const html = packageOverviewTemplate(data);

		assert(
			html.includes("Search APIs"),
			"Contains search link when entities exist",
		);
	});

	test("omits search functionality when no entities", () => {
		const data = createMockData({
			hasPublicEntities: false,
		});
		const html = packageOverviewTemplate(data);

		assert(
			!html.includes("Search APIs"),
			"Does not show search when no entities",
		);
	});
});
