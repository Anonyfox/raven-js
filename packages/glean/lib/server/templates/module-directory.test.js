/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for module directory template
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { moduleDirectoryTemplate } from "./module-directory.js";

describe("moduleDirectoryTemplate", () => {
	/**
	 * Create mock data for testing
	 * @param {Object} overrides - Override default data
	 * @returns {Object} Mock module directory data
	 */
	function createMockData(overrides = {}) {
		return {
			moduleList: [
				{
					importPath: "test-package",
					isDefault: true,
					hasReadme: true,
					readmePreview:
						"# Main Module\n\nThis is the main module documentation.",
					entityCount: 5,
					publicEntityCount: 3,
					entityTypes: ["function", "class"],
					sampleEntities: [
						{
							name: "mainFunction",
							type: "function",
							description: "Primary function for the module",
						},
						{
							name: "MainClass",
							type: "class",
							description: "Main class implementation",
						},
					],
				},
				{
					importPath: "test-package/utils",
					isDefault: false,
					hasReadme: true,
					readmePreview: "# Utils\n\nUtility functions for common tasks.",
					entityCount: 3,
					publicEntityCount: 3,
					entityTypes: ["function"],
					sampleEntities: [
						{
							name: "utilityFunction",
							type: "function",
							description: "Helpful utility function",
						},
					],
				},
			],
			directoryStats: {
				totalModules: 2,
				totalPublicEntities: 6,
				entityTypeDistribution: {
					function: 4,
					class: 1,
				},
			},
			packageName: "test-package",
			packageDescription: "A test package for documentation",
			hasModules: true,
			hasPublicEntities: true,
			...overrides,
		};
	}

	test("generates valid HTML with page header", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		// Basic HTML structure
		assert(html.includes("<!DOCTYPE html>"), "Contains DOCTYPE");
		assert(html.includes("<html"), "Contains html element");
		assert(html.includes("</html>"), "Closes html element");

		// Page header
		assert(html.includes("📦 Modules"), "Contains page title");
		assert(html.includes("Explore the 2 modules"), "Contains module count");
		assert(html.includes("in test-package"), "Contains package name");
		assert(html.includes("6 Public APIs"), "Contains API count badge");
	});

	test("displays directory statistics correctly", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		// Statistics section
		assert(
			html.includes("Directory Statistics") || html.includes("2"),
			"Contains total modules",
		);
		assert(html.includes("6"), "Contains public entities count");
		assert(html.includes("2"), "Contains entity types count");
		assert(html.includes("Public Coverage"), "Contains coverage label");
	});

	test("renders module cards with complete information", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		// Module cards
		assert(html.includes("test-package"), "Contains main module name");
		assert(html.includes("utils"), "Contains utils module name");
		assert(html.includes("default"), "Shows default module badge");

		// Module metadata
		assert(html.includes("3"), "Shows entity counts");
		assert(html.includes("APIs"), "Shows API label");

		// README previews
		assert(html.includes("Main Module"), "Contains main module README");
		assert(html.includes("Utils"), "Contains utils module README");

		// Entity types
		assert(html.includes("function"), "Shows function type");
		assert(html.includes("class"), "Shows class type");

		// Sample entities
		assert(html.includes("mainFunction"), "Contains sample entity name");
		assert(html.includes("Primary function"), "Contains entity description");
	});

	test("handles modules without README gracefully", () => {
		const data = createMockData({
			moduleList: [
				{
					importPath: "test-package",
					isDefault: true,
					hasReadme: false,
					readmePreview: "",
					entityCount: 2,
					publicEntityCount: 2,
					entityTypes: ["function"],
					sampleEntities: [],
				},
			],
		});
		const html = moduleDirectoryTemplate(data);

		assert(
			html.includes("No documentation available"),
			"Shows no documentation message",
		);
		assert(!html.includes("README Preview"), "Does not show README section");
	});

	test("handles modules without entities", () => {
		const data = createMockData({
			moduleList: [
				{
					importPath: "test-package",
					isDefault: true,
					hasReadme: true,
					readmePreview: "# Empty Module",
					entityCount: 0,
					publicEntityCount: 0,
					entityTypes: [],
					sampleEntities: [],
				},
			],
			directoryStats: {
				totalModules: 1,
				totalPublicEntities: 0,
				entityTypeDistribution: {},
			},
		});
		const html = moduleDirectoryTemplate(data);

		assert(
			html.includes("No public entities available"),
			"Shows no entities message",
		);
		assert(
			!html.includes("Featured APIs"),
			"Does not show sample entities section",
		);
	});

	test("handles empty package state", () => {
		const data = createMockData({
			moduleList: [],
			directoryStats: {
				totalModules: 0,
				totalPublicEntities: 0,
				entityTypeDistribution: {},
			},
			hasModules: false,
			hasPublicEntities: false,
		});
		const html = moduleDirectoryTemplate(data);

		assert(html.includes("📭"), "Shows empty state icon");
		assert(html.includes("No Modules Available"), "Shows empty state message");
		assert(
			!html.includes("Available Modules"),
			"Does not show modules section",
		);
	});

	test("includes entity type distribution", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		assert(
			html.includes("Entity Type Distribution"),
			"Contains distribution section",
		);
		assert(html.includes("function"), "Shows function type");
		assert(html.includes("4 entities"), "Shows function count");
		assert(html.includes("class"), "Shows class type");
		assert(html.includes("1 entity"), "Shows class count");
		assert(html.includes("80%"), "Shows function percentage");
		assert(html.includes("20%"), "Shows class percentage");
	});

	test("includes getting started section when modules exist", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		assert(html.includes("🚀 Getting Started"), "Contains getting started");
		assert(html.includes("Installation"), "Contains installation section");
		assert(
			html.includes("npm install test-package"),
			"Contains install command",
		);
		assert(html.includes("Basic Usage"), "Contains usage section");
		assert(
			html.includes("import { ... } from 'test-package'"),
			"Contains import example",
		);
	});

	test("omits getting started section when no modules", () => {
		const data = createMockData({
			moduleList: [],
			directoryStats: {
				totalModules: 0,
				totalPublicEntities: 0,
				entityTypeDistribution: {},
			},
			hasModules: false,
		});
		const html = moduleDirectoryTemplate(data);

		assert(
			!html.includes("🚀 Getting Started"),
			"Does not show getting started when no modules",
		);
	});

	test("handles singular vs plural labels correctly", () => {
		const dataSingular = createMockData({
			moduleList: [
				{
					importPath: "test-package",
					isDefault: true,
					hasReadme: true,
					readmePreview: "# Single Module",
					entityCount: 1,
					publicEntityCount: 1,
					entityTypes: ["function"],
					sampleEntities: [],
				},
			],
			directoryStats: {
				totalModules: 1,
				totalPublicEntities: 1,
				entityTypeDistribution: {
					function: 1,
				},
			},
		});
		const htmlSingular = moduleDirectoryTemplate(dataSingular);

		// Check singular labels
		assert(htmlSingular.includes("1 module"), "Uses singular module label");
		assert(htmlSingular.includes("1 Public API"), "Uses singular API label");

		const dataPlural = createMockData();
		const htmlPlural = moduleDirectoryTemplate(dataPlural);

		// Check plural labels
		assert(htmlPlural.includes("2 modules"), "Uses plural module label");
		assert(htmlPlural.includes("6 Public APIs"), "Uses plural API label");
	});

	test("includes module action buttons", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		// Module exploration buttons
		assert(
			html.includes('href="/modules/test-package/"'),
			"Contains main module link",
		);
		assert(
			html.includes('href="/modules/utils/"'),
			"Contains utils module link",
		);
		assert(html.includes("📖 Explore Module"), "Contains explore button text");

		// API search buttons
		assert(
			html.includes('href="/api/?search=test-package"'),
			"Contains API search link",
		);
		assert(html.includes("🔍 APIs"), "Contains API button text");
	});

	test("omits API buttons when no public entities", () => {
		const data = createMockData({
			moduleList: [
				{
					importPath: "test-package",
					isDefault: true,
					hasReadme: true,
					readmePreview: "# Module",
					entityCount: 0,
					publicEntityCount: 0,
					entityTypes: [],
					sampleEntities: [],
				},
			],
		});
		const html = moduleDirectoryTemplate(data);

		assert(
			!html.includes("🔍 APIs"),
			"Does not show API button when no entities",
		);
	});

	test("includes navigation links", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		assert(html.includes('href="/"'), "Contains package overview link");
		assert(html.includes('href="/api/"'), "Contains API reference link");
		assert(html.includes('href="/sitemap.xml"'), "Contains sitemap link");
	});

	test("handles long README preview with truncation", () => {
		const longReadme = "A".repeat(250);
		const data = createMockData({
			moduleList: [
				{
					importPath: "test-package",
					isDefault: true,
					hasReadme: true,
					readmePreview: longReadme,
					entityCount: 1,
					publicEntityCount: 1,
					entityTypes: ["function"],
					sampleEntities: [],
				},
			],
		});
		const html = moduleDirectoryTemplate(data);

		assert(html.includes("..."), "Shows truncation indicator for long README");
	});

	test("handles long entity descriptions with truncation", () => {
		const data = createMockData({
			moduleList: [
				{
					importPath: "test-package",
					isDefault: true,
					hasReadme: true,
					readmePreview: "# Module",
					entityCount: 1,
					publicEntityCount: 1,
					entityTypes: ["function"],
					sampleEntities: [
						{
							name: "longFunction",
							type: "function",
							description: "A".repeat(150), // Long description
						},
					],
				},
			],
		});
		const html = moduleDirectoryTemplate(data);

		assert(
			html.includes("..."),
			"Shows truncation indicator for long entity description",
		);
	});

	test("calculates coverage percentage correctly", () => {
		const data = createMockData({
			directoryStats: {
				totalModules: 2,
				totalPublicEntities: 8,
				entityTypeDistribution: {
					function: 6,
					class: 4,
				},
			},
		});
		const html = moduleDirectoryTemplate(data);

		// 8 public / 10 total * 100 = 80%
		assert(html.includes("80%"), "Shows correct coverage percentage");
	});

	test("handles zero coverage calculation", () => {
		const data = createMockData({
			directoryStats: {
				totalModules: 1,
				totalPublicEntities: 0,
				entityTypeDistribution: {},
			},
		});
		const html = moduleDirectoryTemplate(data);

		assert(html.includes("0%"), "Shows 0% for no public entities");
	});

	test("includes proper meta tags via base template", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		// Should include base template structure
		assert(html.includes("<!DOCTYPE html>"), "Contains proper DOCTYPE");
		assert(
			html.includes("Modules - test-package Documentation"),
			"Contains proper title",
		);
		assert(
			html.includes("Browse 2 modules in test-package"),
			"Contains description",
		);
	});

	test("sets active navigation state", () => {
		const data = createMockData();
		const html = moduleDirectoryTemplate(data);

		// Should mark modules navigation as active
		assert(html.includes("nav-link active"), "Marks modules nav as active");
	});

	test("handles entities without descriptions", () => {
		const data = createMockData({
			moduleList: [
				{
					importPath: "test-package",
					isDefault: true,
					hasReadme: true,
					readmePreview: "# Module",
					entityCount: 1,
					publicEntityCount: 1,
					entityTypes: ["function"],
					sampleEntities: [
						{
							name: "functionWithoutDesc",
							type: "function",
							description: "", // Empty description
						},
					],
				},
			],
		});
		const html = moduleDirectoryTemplate(data);

		assert(
			html.includes("functionWithoutDesc"),
			"Shows entity name even without description",
		);
		assert(
			!html.includes('class="small text-muted mt-1"'),
			"Does not show description section when empty",
		);
	});

	test("handles missing optional data gracefully", () => {
		const data = createMockData({
			packageDescription: "",
		});
		const html = moduleDirectoryTemplate(data);

		// Should still render without errors
		assert(html.includes("test-package"), "Still contains package name");
		assert(html.includes("<!DOCTYPE html>"), "Still valid HTML");
	});

	test("should use correct responsive grid classes", () => {
		const data = {
			moduleList: [
				{
					importPath: "test-module-1",
					isDefault: false,
					hasReadme: false,
					readmePreview: "",
					hasDescription: false,
					description: "",
					entityCount: 5,
					publicEntityCount: 3,
					entityTypes: ["function", "class"],
					sampleEntities: [],
				},
				{
					importPath: "test-module-2",
					isDefault: false,
					hasReadme: false,
					readmePreview: "",
					hasDescription: false,
					description: "",
					entityCount: 3,
					publicEntityCount: 2,
					entityTypes: ["function"],
					sampleEntities: [],
				},
				{
					importPath: "test-module-3",
					isDefault: false,
					hasReadme: false,
					readmePreview: "",
					hasDescription: false,
					description: "",
					entityCount: 7,
					publicEntityCount: 4,
					entityTypes: ["function", "class", "typedef"],
					sampleEntities: [],
				},
			],
			directoryStats: {
				totalModules: 3,
				totalPublicEntities: 9,
				entityTypeDistribution: { function: 6, class: 2, typedef: 1 },
			},
			packageName: "test-package",
			packageDescription: "Test package description",
			hasModules: true,
			hasPublicEntities: true,
		};

		const html = moduleDirectoryTemplate(data);

		// Should use responsive grid classes
		assert(
			html.includes('class="col-md-6 col-lg-3 col-xl-3"'),
			"Should use responsive grid classes",
		);
		assert(
			html.includes('class="row g-4"'),
			"Should use grid with proper spacing",
		);
		assert(
			html.includes('class="card border-0 shadow-sm h-100"'),
			"Should use full-height cards",
		);
	});
});
