/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for module overview template
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { moduleOverviewTemplate } from "./module-overview.js";

describe("moduleOverviewTemplate", () => {
	/**
	 * Create mock data for testing
	 * @param {Object} overrides - Override default data
	 * @returns {Object} Mock module overview data
	 */
	function createMockData(overrides = {}) {
		return {
			module: {
				name: "utils",
				fullName: "test-package/utils",
				isDefault: false,
				readme: "# Utils Module\n\nUtility functions for the test package.",
				hasReadme: true,
				entityCount: 5,
				availableTypes: ["function", "class"],
			},
			organizedEntities: {
				function: [
					{
						name: "utilFunction",
						type: "function",
						description: "A helpful utility function",
						hasParams: true,
						hasReturns: true,
						hasExamples: false,
						isDeprecated: false,
						link: "/modules/utils/utilFunction/",
						location: { file: "utils.js", line: 10, column: 0 },
					},
					{
						name: "deprecatedFunction",
						type: "function",
						description: "An old utility function",
						hasParams: false,
						hasReturns: false,
						hasExamples: false,
						isDeprecated: true,
						link: "/modules/utils/deprecatedFunction/",
						location: { file: "utils.js", line: 50, column: 0 },
					},
				],
				class: [
					{
						name: "UtilClass",
						type: "class",
						description: "A utility class for common operations",
						hasParams: true,
						hasReturns: false,
						hasExamples: true,
						isDeprecated: false,
						link: "/modules/utils/UtilClass/",
						location: { file: "utils.js", line: 30, column: 0 },
					},
				],
			},
			navigation: {
				packageName: "test-package",
				currentModule: "utils",
				allModules: [
					{
						name: "test-package",
						fullImportPath: "test-package",
						isCurrent: false,
						isDefault: true,
						link: "/modules/test-package/",
						entityCount: 3,
					},
					{
						name: "utils",
						fullImportPath: "test-package/utils",
						isCurrent: true,
						isDefault: false,
						link: "/modules/utils/",
						entityCount: 5,
					},
					{
						name: "helpers",
						fullImportPath: "test-package/helpers",
						isCurrent: false,
						isDefault: false,
						link: "/modules/helpers/",
						entityCount: 2,
					},
				],
			},
			stats: {
				totalEntities: 5,
				entitiesByType: {
					function: 2,
					class: 1,
				},
				deprecatedCount: 1,
				withExamplesCount: 1,
			},
			packageName: "test-package",
			hasEntities: true,
			hasMultipleTypes: true,
			hasDeprecatedEntities: true,
			hasExampleEntities: true,
			...overrides,
		};
	}

	test("generates valid HTML with module header", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// Basic HTML structure
		assert(html.includes("<!DOCTYPE html>"), "Contains DOCTYPE");
		assert(html.includes("<html"), "Contains html element");
		assert(html.includes("</html>"), "Closes html element");

		// Module header
		assert(html.includes("utils"), "Contains module name");
		assert(html.includes("test-package/utils"), "Contains full import path");
		assert(
			!html.includes('badge bg-primary me-3">default'),
			"Does not show default badge for non-default module",
		);
		assert(html.includes("5 Entities"), "Contains entity count");
	});

	test("displays breadcrumb navigation", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// Breadcrumb structure
		assert(html.includes("breadcrumb"), "Contains breadcrumb navigation");
		assert(html.includes("📦 test-package"), "Contains package breadcrumb");
		assert(html.includes('href="/"'), "Contains package link");
		assert(html.includes('href="/modules/"'), "Contains modules link");
		assert(html.includes('aria-current="page"'), "Marks current page");
	});

	test("shows default module badge when appropriate", () => {
		const data = createMockData({
			module: {
				...createMockData().module,
				name: "test-package",
				fullName: "test-package",
				isDefault: true,
			},
		});
		const html = moduleOverviewTemplate(data);

		assert(html.includes("default"), "Shows default badge for default module");
		assert(html.includes("badge bg-primary"), "Uses primary badge styling");
	});

	test("displays module statistics when entities exist", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// Statistics section
		assert(html.includes("5"), "Shows total entity count");
		assert(html.includes("Total Entities"), "Shows total entity label");
		assert(html.includes("2"), "Shows entity type count");
		assert(html.includes("Entity Types"), "Shows entity type label");
		assert(html.includes("1"), "Shows deprecated count");
		assert(html.includes("Deprecated"), "Shows deprecated label");
		assert(html.includes("With Examples"), "Shows examples label");
	});

	test("omits statistics section when no entities", () => {
		const data = createMockData({
			hasEntities: false,
			stats: {
				totalEntities: 0,
				entitiesByType: {},
				deprecatedCount: 0,
				withExamplesCount: 0,
			},
		});
		const html = moduleOverviewTemplate(data);

		assert(
			!html.includes("Total Entities"),
			"Does not show statistics section",
		);
	});

	test("renders README content as markdown", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// README section
		assert(html.includes("📚 Documentation"), "Contains documentation header");
		assert(html.includes("<h1>"), "Converts markdown headers to HTML");
		assert(html.includes("Utils Module"), "Contains README content");
		assert(html.includes("Utility functions"), "Contains README description");
	});

	test("handles missing README gracefully", () => {
		const data = createMockData({
			module: {
				...createMockData().module,
				readme: "",
				hasReadme: false,
			},
		});
		const html = moduleOverviewTemplate(data);

		assert(
			!html.includes("📚 Documentation"),
			"Does not show documentation section",
		);
		assert(!html.includes("Utils Module"), "Does not show README content");
	});

	test("renders entity sections organized by type", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// API Reference section
		assert(html.includes("🔧 API Reference"), "Contains API reference header");
		assert(html.includes("FUNCTIONS (2)"), "Shows function section header");
		assert(html.includes("CLASS (1)"), "Shows class section header");

		// Function entities
		assert(html.includes("utilFunction"), "Contains function name");
		assert(
			html.includes("A helpful utility function"),
			"Contains function description",
		);
		assert(html.includes("deprecatedFunction"), "Contains deprecated function");

		// Class entities
		assert(html.includes("UtilClass"), "Contains class name");
		assert(html.includes("A utility class"), "Contains class description");
	});

	test("displays entity metadata badges correctly", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// Function with params and returns
		assert(html.includes('badge bg-info">params'), "Shows params badge");
		assert(html.includes('badge bg-primary">returns'), "Shows returns badge");

		// Class with examples
		assert(html.includes('badge bg-success">examples'), "Shows examples badge");

		// Deprecated function
		assert(
			html.includes('badge bg-warning">deprecated'),
			"Shows deprecated badge",
		);
	});

	test("includes entity links and location information", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// Entity links
		assert(
			html.includes('href="/modules/utils/utilFunction/"'),
			"Contains function link",
		);
		assert(
			html.includes('href="/modules/utils/UtilClass/"'),
			"Contains class link",
		);
		assert(html.includes("📖 View Details"), "Contains view details button");

		// Location information
		assert(html.includes("utils.js:10"), "Shows function location");
		assert(html.includes("utils.js:30"), "Shows class location");
	});

	test("handles entities without descriptions", () => {
		const data = createMockData({
			organizedEntities: {
				function: [
					{
						name: "noDescFunction",
						type: "function",
						description: "",
						hasParams: false,
						hasReturns: false,
						hasExamples: false,
						isDeprecated: false,
						link: "/modules/utils/noDescFunction/",
						location: null,
					},
				],
			},
		});
		const html = moduleOverviewTemplate(data);

		assert(
			html.includes("No description available"),
			"Shows no description message",
		);
		assert(
			html.includes("fst-italic"),
			"Uses italic styling for missing description",
		);
	});

	test("displays navigation sidebar with all modules", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// Module navigation
		assert(html.includes("🗂️ All Modules"), "Contains module navigation header");
		assert(html.includes("test-package"), "Contains package module");
		assert(html.includes("utils"), "Contains utils module");
		assert(html.includes("helpers"), "Contains helpers module");

		// Current module styling
		assert(html.includes("active"), "Marks current module as active");

		// Default module badge in navigation
		assert(
			html.includes('badge bg-primary me-2">default'),
			"Shows default badge in navigation",
		);

		// Entity counts in navigation
		assert(html.includes("3"), "Shows package module entity count");
		assert(html.includes("5"), "Shows utils module entity count");
		assert(html.includes("2"), "Shows helpers module entity count");
	});

	test("includes quick actions sidebar", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// Quick actions
		assert(html.includes("🚀 Quick Actions"), "Contains quick actions header");
		assert(
			html.includes("📦 Browse All Modules"),
			"Contains browse modules link",
		);
		assert(
			html.includes("🔍 Search This Module"),
			"Contains search module link",
		);
		assert(
			html.includes("🏠 Package Overview"),
			"Contains package overview link",
		);

		// Search link with encoded module name
		assert(
			html.includes("search=test-package%2Futils"),
			"Contains encoded module name in search",
		);
	});

	test("handles single module layout correctly", () => {
		const data = createMockData({
			navigation: {
				...createMockData().navigation,
				allModules: [
					{
						name: "test-package",
						fullImportPath: "test-package",
						isCurrent: true,
						isDefault: true,
						link: "/modules/test-package/",
						entityCount: 5,
					},
				],
			},
		});
		const html = moduleOverviewTemplate(data);

		// Should use full width layout
		assert(html.includes("col-12"), "Uses full width layout");
		assert(!html.includes("🗂️ All Modules"), "Does not show module navigation");
		assert(!html.includes("🚀 Quick Actions"), "Does not show quick actions");
	});

	test("handles empty entity state", () => {
		const data = createMockData({
			organizedEntities: {},
			hasEntities: false,
			stats: {
				totalEntities: 0,
				entitiesByType: {},
				deprecatedCount: 0,
				withExamplesCount: 0,
			},
		});
		const html = moduleOverviewTemplate(data);

		assert(html.includes("📭"), "Shows empty state icon");
		assert(html.includes("No Public Entities"), "Shows empty state message");
		assert(
			html.includes("doesn't export any public APIs"),
			"Shows empty state description",
		);
	});

	test("omits search action when no entities", () => {
		const data = createMockData({
			hasEntities: false,
			organizedEntities: {},
		});
		const html = moduleOverviewTemplate(data);

		assert(
			!html.includes("🔍 Search This Module"),
			"Does not show search when no entities",
		);
	});

	test("includes CSS styles for README formatting", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		assert(html.includes(".readme-content"), "Contains README styling classes");
		assert(html.includes("margin-top"), "Contains CSS rules");
		assert(html.includes("code {"), "Contains code block styling");
		assert(html.includes("table {"), "Contains table styling");
	});

	test("handles complex entity type organization", () => {
		const data = createMockData({
			organizedEntities: {
				function: [
					{
						name: "func1",
						type: "function",
						description: "Function 1",
						hasParams: false,
						hasReturns: false,
						hasExamples: false,
						isDeprecated: false,
						link: "/modules/utils/func1/",
						location: null,
					},
				],
				class: [
					{
						name: "Class1",
						type: "class",
						description: "Class 1",
						hasParams: false,
						hasReturns: false,
						hasExamples: false,
						isDeprecated: false,
						link: "/modules/utils/Class1/",
						location: null,
					},
				],
				typedef: [
					{
						name: "Type1",
						type: "typedef",
						description: "Type definition 1",
						hasParams: false,
						hasReturns: false,
						hasExamples: false,
						isDeprecated: false,
						link: "/modules/utils/Type1/",
						location: null,
					},
				],
			},
		});
		const html = moduleOverviewTemplate(data);

		assert(html.includes("FUNCTION (1)"), "Shows function section");
		assert(html.includes("CLASS (1)"), "Shows class section");
		assert(html.includes("TYPEDEF (1)"), "Shows typedef section");
	});

	test("includes proper meta tags via base template", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// Should include base template structure
		assert(html.includes("<!DOCTYPE html>"), "Contains proper DOCTYPE");
		assert(
			html.includes("utils - test-package Documentation"),
			"Contains proper title",
		);
		assert(
			html.includes("Documentation for test-package/utils module"),
			"Contains description",
		);
	});

	test("sets active navigation state", () => {
		const data = createMockData();
		const html = moduleOverviewTemplate(data);

		// Should mark modules navigation as active
		assert(html.includes("nav-link active"), "Marks modules nav as active");
	});

	test("handles entity locations gracefully when missing", () => {
		const data = createMockData({
			organizedEntities: {
				function: [
					{
						name: "noLocationFunc",
						type: "function",
						description: "Function without location",
						hasParams: false,
						hasReturns: false,
						hasExamples: false,
						isDeprecated: false,
						link: "/modules/utils/noLocationFunc/",
						location: null,
					},
				],
			},
		});
		const html = moduleOverviewTemplate(data);

		assert(
			html.includes("noLocationFunc"),
			"Shows function name even without location",
		);
		assert(!html.includes(".js:"), "Does not show location colon when missing");
	});

	test("handles singular vs plural entity labels correctly", () => {
		const dataSingular = createMockData({
			stats: {
				totalEntities: 1,
				entitiesByType: { function: 1 },
				deprecatedCount: 0,
				withExamplesCount: 0,
			},
			organizedEntities: {
				function: [
					{
						name: "singleFunc",
						type: "function",
						description: "Single function",
						hasParams: false,
						hasReturns: false,
						hasExamples: false,
						isDeprecated: false,
						link: "/modules/utils/singleFunc/",
						location: null,
					},
				],
			},
		});
		const htmlSingular = moduleOverviewTemplate(dataSingular);

		// Check singular labels
		assert(htmlSingular.includes("1 Entity"), "Uses singular entity label");
		assert(
			htmlSingular.includes("FUNCTION (1)"),
			"Shows singular function count",
		);

		const dataPlural = createMockData();
		const htmlPlural = moduleOverviewTemplate(dataPlural);

		// Check plural labels
		assert(htmlPlural.includes("5 Entities"), "Uses plural entity label");
		assert(htmlPlural.includes("FUNCTIONS (2)"), "Shows plural function count");
	});
});
