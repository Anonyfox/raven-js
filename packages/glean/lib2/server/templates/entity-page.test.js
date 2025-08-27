/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for entity page template
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { entityPageTemplate } from "./entity-page.js";

describe("entityPageTemplate", () => {
	/**
	 * Create mock entity page data
	 * @param {Object} overrides - Override default data
	 * @returns {Object} Mock entity page data
	 */
	function createMockData(overrides = {}) {
		return {
			entity: {
				name: "processData",
				type: "function",
				description: "Processes input data with advanced options",
				source:
					"function processData(data, options = {}) {\n  return data.map(item => transform(item, options));\n}",
				location: { file: "utils.js", line: 42, column: 0 },
				importPath: "test-package/utils",
				importStatement: "import { processData } from 'test-package/utils';",
				isDefault: false,
			},
			documentation: {
				parameters: [
					{
						name: "data",
						type: "Array<Object>",
						description: "Input data array to process",
						isOptional: false,
						defaultValue: null,
					},
					{
						name: "options",
						type: "ProcessOptions",
						description: "Configuration options for processing",
						isOptional: true,
						defaultValue: "{}",
					},
				],
				returns: {
					type: "Array<ProcessedItem>",
					description: "Array of processed data items",
				},
				examples: [
					{
						title: "Basic Usage",
						code: "const result = processData([{id: 1}], {transform: true});",
						language: "javascript",
					},
					{
						title: "Advanced Processing",
						code: "const advanced = processData(data, {\n  transform: true,\n  validate: true\n});",
						language: "javascript",
					},
				],
				since: "1.2.0",
				deprecated: {
					isDeprecated: false,
					reason: "",
					since: "",
				},
				author: ["John Doe <john@example.com>"],
				see: [
					{
						text: "Related function",
						link: "/modules/utils/relatedFunction/",
						isExternal: false,
					},
					{
						text: "External documentation",
						link: "https://example.com/docs",
						isExternal: true,
					},
				],
				throws: [
					{
						type: "TypeError",
						description: "When data is not an array",
					},
					{
						type: "ValidationError",
						description: "When validation fails",
					},
				],
				typeInfo: {
					signature:
						"(data: Array<Object>, options?: ProcessOptions) => Array<ProcessedItem>",
					typeParameters: [],
					namespace: "",
				},
			},
			relatedEntities: {
				sameModule: [
					{
						name: "transformData",
						type: "function",
						description: "Transforms data with custom logic",
						link: "/modules/utils/transformData/",
					},
					{
						name: "ValidatorClass",
						type: "class",
						description: "Data validation utility class",
						link: "/modules/utils/ValidatorClass/",
					},
				],
				similar: [
					{
						name: "processItems",
						type: "function",
						description: "Similar processing function",
						moduleName: "processor",
						link: "/modules/processor/processItems/",
					},
				],
			},
			navigation: {
				allModules: [
					{
						name: "test-package",
						fullImportPath: "test-package",
						isCurrent: false,
						isDefault: true,
						link: "/modules/test-package/",
						entityCount: 5,
					},
					{
						name: "utils",
						fullImportPath: "test-package/utils",
						isCurrent: true,
						isDefault: false,
						link: "/modules/utils/",
						entityCount: 10,
					},
				],
				moduleEntities: [
					{
						name: "processData",
						type: "function",
						isCurrent: true,
						link: "/modules/utils/processData/",
					},
					{
						name: "transformData",
						type: "function",
						isCurrent: false,
						link: "/modules/utils/transformData/",
					},
					{
						name: "ValidatorClass",
						type: "class",
						isCurrent: false,
						link: "/modules/utils/ValidatorClass/",
					},
				],
			},
			packageName: "test-package",
			moduleName: "utils",
			hasParameters: true,
			hasReturns: true,
			hasExamples: true,
			hasRelatedEntities: true,
			hasTypeInfo: true,
			isDeprecated: false,
			hasSource: true,
			hasLocation: true,
			...overrides,
		};
	}

	test("generates valid HTML with entity header", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Basic HTML structure
		assert(html.includes("<!DOCTYPE html>"), "Contains DOCTYPE");
		assert(html.includes("<html"), "Contains html element");
		assert(html.includes("</html>"), "Closes html element");

		// Entity header
		assert(html.includes("processData"), "Contains entity name");
		assert(html.includes("badge bg-primary"), "Contains function type badge");
		assert(html.includes("Processes input data"), "Contains description");
		assert(
			html.includes("import { processData }"),
			"Contains import statement",
		);
	});

	test("displays breadcrumb navigation", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Breadcrumb structure
		assert(html.includes("breadcrumb"), "Contains breadcrumb navigation");
		assert(html.includes("📦 test-package"), "Contains package breadcrumb");
		assert(html.includes('href="/"'), "Contains package link");
		assert(html.includes('href="/modules/"'), "Contains modules link");
		assert(html.includes('href="/modules/utils/"'), "Contains module link");
		assert(html.includes('aria-current="page"'), "Marks current page");
	});

	test("shows deprecation warning when entity is deprecated", () => {
		const data = createMockData({
			isDeprecated: true,
			documentation: {
				...createMockData().documentation,
				deprecated: {
					isDeprecated: true,
					reason: "Use newFunction instead",
					since: "2.0.0",
				},
			},
		});
		const html = entityPageTemplate(data);

		assert(html.includes("alert-warning"), "Shows warning alert");
		assert(html.includes("Deprecated API"), "Shows deprecation header");
		assert(
			html.includes("Use newFunction instead"),
			"Shows deprecation reason",
		);
		assert(html.includes("Since version 2.0.0"), "Shows deprecation version");
	});

	test("displays different entity type badges correctly", () => {
		const types = [
			{ type: "function", expectedClass: "bg-primary" },
			{ type: "class", expectedClass: "bg-success" },
			{ type: "typedef", expectedClass: "bg-info" },
			{ type: "interface", expectedClass: "bg-warning" },
			{ type: "enum", expectedClass: "bg-secondary" },
		];

		for (const { type, expectedClass } of types) {
			const data = createMockData({
				entity: { ...createMockData().entity, type },
			});
			const html = entityPageTemplate(data);

			assert(
				html.includes(`badge ${expectedClass}`),
				`Shows correct badge class for ${type}`,
			);
		}
	});

	test("displays default module badge when appropriate", () => {
		const data = createMockData({
			entity: {
				...createMockData().entity,
				isDefault: true,
			},
		});
		const html = entityPageTemplate(data);

		assert(html.includes("badge bg-primary"), "Shows default module badge");
		assert(html.includes("default module"), "Contains default module text");
	});

	test("displays TypeScript signature when available", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		assert(html.includes("📝 Type Signature"), "Shows signature header");
		assert(
			html.includes("language-typescript"),
			"Uses TypeScript syntax highlighting",
		);
		assert(
			html.includes("Array<Object>, options?: ProcessOptions"),
			"Contains signature content",
		);
	});

	test("renders parameters table correctly", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Parameters section
		assert(html.includes("⚙️ Parameters"), "Shows parameters header");
		assert(html.includes("table-responsive"), "Uses responsive table");

		// Parameter details
		assert(html.includes("data"), "Shows first parameter name");
		assert(html.includes("Array<Object>"), "Shows parameter type");
		assert(html.includes("Input data array"), "Shows parameter description");
		assert(html.includes("required"), "Shows required status");

		// Optional parameter
		assert(html.includes("options?"), "Shows optional parameter with ?");
		assert(html.includes("ProcessOptions"), "Shows optional parameter type");
		assert(html.includes("{}"), "Shows default value");
	});

	test("displays returns information", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		assert(html.includes("↩️ Returns"), "Shows returns header");
		assert(html.includes("Array<ProcessedItem>"), "Shows return type");
		assert(
			html.includes("Array of processed data"),
			"Shows return description",
		);
	});

	test("renders code examples with syntax highlighting", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Examples section
		assert(html.includes("💡 Examples"), "Shows examples header");
		assert(html.includes("Basic Usage"), "Shows first example title");
		assert(html.includes("Advanced Processing"), "Shows second example title");

		// Code content
		assert(
			html.includes("const result = processData"),
			"Shows example code content",
		);
		assert(
			html.includes("language-javascript"),
			"Uses JavaScript syntax highlighting",
		);

		// Copy buttons
		assert(html.includes("📋"), "Shows copy buttons");
		assert(html.includes("copyToClipboard"), "Has copy functionality");
	});

	test("displays source code when available", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		assert(html.includes("📄 Source Code"), "Shows source code header");
		assert(
			html.includes("function processData(data, options"),
			"Shows source code content",
		);
		assert(
			html.includes("return data.map"),
			"Shows source code implementation",
		);
	});

	test("shows exceptions/throws table", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		assert(html.includes("🚨 Exceptions"), "Shows exceptions header");
		assert(html.includes("TypeError"), "Shows first exception type");
		assert(html.includes("ValidationError"), "Shows second exception type");
		assert(
			html.includes("When data is not an array"),
			"Shows exception description",
		);
	});

	test("displays see-also references", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		assert(html.includes("🔗 See Also"), "Shows see also header");
		assert(html.includes("Related function"), "Shows internal reference");
		assert(html.includes("External documentation"), "Shows external reference");
		assert(html.includes('target="_blank"'), "Opens external links in new tab");
		assert(html.includes("🔗"), "Shows external link icon");
	});

	test("shows entity metadata correctly", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Location information
		assert(html.includes("📍 utils.js:42"), "Shows source location");

		// Since version
		assert(html.includes("📅 Since 1.2.0"), "Shows since version");

		// Author information
		assert(html.includes("👤 John Doe"), "Shows author information");
	});

	test("renders related entities sections", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Related entities header
		assert(html.includes("🔄 Related APIs"), "Shows related APIs header");

		// Same module section
		assert(html.includes("Same Module (utils)"), "Shows same module section");
		assert(html.includes("transformData"), "Shows related function");
		assert(html.includes("ValidatorClass"), "Shows related class");

		// Similar entities section
		assert(
			html.includes("Similar APIs (function)"),
			"Shows similar APIs section",
		);
		assert(html.includes("processItems"), "Shows similar function");
		assert(html.includes("processor"), "Shows module name for similar entity");
	});

	test("displays navigation sidebar with module entities", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Module entities navigation
		assert(html.includes("🗂️ utils APIs"), "Shows module APIs header");
		assert(html.includes("processData"), "Shows current entity");
		assert(html.includes("transformData"), "Shows other entity");
		assert(html.includes("active"), "Marks current entity as active");

		// All modules navigation
		assert(html.includes("📦 All Modules"), "Shows all modules header");
		assert(html.includes("test-package"), "Shows package module");
		assert(html.includes("utils"), "Shows utils module");
	});

	test("includes quick actions sidebar", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		assert(html.includes("🚀 Quick Actions"), "Shows quick actions header");
		assert(html.includes("📄 Module Overview"), "Shows module overview link");
		assert(html.includes("🔍 Search APIs"), "Shows search link");
		assert(html.includes("📦 Browse Modules"), "Shows browse modules link");
		assert(html.includes("🏠 Package Home"), "Shows package home link");

		// Check search link encoding
		assert(
			html.includes("search=processData"),
			"Includes encoded entity name in search",
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
		const html = entityPageTemplate(data);

		// Should use full width layout
		assert(html.includes("col-12"), "Uses full width layout");
		assert(!html.includes("🗂️"), "Does not show module navigation");
		assert(!html.includes("🚀 Quick Actions"), "Does not show quick actions");
	});

	test("omits sections when data is not available", () => {
		const data = createMockData({
			hasParameters: false,
			hasReturns: false,
			hasExamples: false,
			hasSource: false,
			hasLocation: false,
			hasTypeInfo: false,
			hasRelatedEntities: false,
			isDeprecated: false,
			documentation: {
				...createMockData().documentation,
				parameters: [],
				returns: { type: "", description: "" },
				examples: [],
				throws: [],
				see: [],
				author: [],
				since: "",
				typeInfo: { signature: "", typeParameters: [], namespace: "" },
			},
			relatedEntities: {
				sameModule: [],
				similar: [],
			},
		});
		const html = entityPageTemplate(data);

		assert(!html.includes("⚙️ Parameters"), "Does not show parameters section");
		assert(!html.includes("↩️ Returns"), "Does not show returns section");
		assert(!html.includes("💡 Examples"), "Does not show examples section");
		assert(!html.includes("📄 Source Code"), "Does not show source section");
		assert(
			!html.includes("📝 Type Signature"),
			"Does not show signature section",
		);
		assert(!html.includes("🔄 Related APIs"), "Does not show related entities");
		assert(!html.includes("📍"), "Does not show location");
		assert(!html.includes("📅"), "Does not show since version");
		assert(!html.includes("👤"), "Does not show author");
	});

	test("handles entity without description", () => {
		const data = createMockData({
			entity: {
				...createMockData().entity,
				description: "",
			},
		});
		const html = entityPageTemplate(data);

		assert(html.includes("processData"), "Shows entity name");
		assert(
			!html.includes("lead text-muted"),
			"Does not show description paragraph",
		);
	});

	test("handles parameters without descriptions or types", () => {
		const data = createMockData({
			documentation: {
				...createMockData().documentation,
				parameters: [
					{
						name: "param1",
						type: "",
						description: "",
						isOptional: false,
						defaultValue: null,
					},
				],
			},
		});
		const html = entityPageTemplate(data);

		assert(html.includes("param1"), "Shows parameter name");
		assert(html.includes("any"), "Shows 'any' for missing type");
		assert(html.includes("No description"), "Shows no description message");
	});

	test("includes copy to clipboard functionality", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Copy functionality
		assert(html.includes("copyToClipboard"), "Includes copy function");
		assert(html.includes("navigator.clipboard"), "Uses modern clipboard API");
		assert(html.includes("fallbackCopyTextToClipboard"), "Includes fallback");
		assert(html.includes("showCopyFeedback"), "Shows copy feedback");

		// Copy buttons for different sections
		assert(html.includes("Copy import statement"), "Has import copy button");
		assert(html.includes("Copy example"), "Has example copy buttons");
		assert(html.includes("Copy source"), "Has source copy button");
	});

	test("escapes code content properly for JavaScript", () => {
		const data = createMockData({
			documentation: {
				...createMockData().documentation,
				examples: [
					{
						title: "Template Literal Example",
						code: `const msg = \`Hello \${name}!\`;`,
						language: "javascript",
					},
				],
			},
		});
		const html = entityPageTemplate(data);

		// Should escape backticks in onclick handlers
		assert(
			html.includes("\\`"),
			"Escapes backticks in JavaScript string literals",
		);
	});

	test("handles complex TypeScript signatures", () => {
		const data = createMockData({
			documentation: {
				...createMockData().documentation,
				typeInfo: {
					signature:
						"<T extends BaseType>(data: T[], options?: Options<T>) => Promise<Result<T>>",
					typeParameters: ["T"],
					namespace: "Utils",
				},
			},
		});
		const html = entityPageTemplate(data);

		assert(
			html.includes("T extends BaseType"),
			"Shows complex TypeScript signature",
		);
		assert(html.includes("Promise<Result<T>>"), "Shows generic return types");
	});

	test("displays different language examples correctly", () => {
		const data = createMockData({
			documentation: {
				...createMockData().documentation,
				examples: [
					{
						title: "TypeScript Usage",
						code: "const result: ProcessedItem[] = processData(data);",
						language: "typescript",
					},
					{
						title: "Python Equivalent",
						code: "result = process_data(data)",
						language: "python",
					},
				],
			},
		});
		const html = entityPageTemplate(data);

		assert(
			html.includes("language-typescript"),
			"Uses TypeScript syntax highlighting",
		);
		assert(html.includes("language-python"), "Uses Python syntax highlighting");
		assert(html.includes("TypeScript Usage"), "Shows TypeScript example title");
		assert(html.includes("Python Equivalent"), "Shows Python example title");
	});

	test("includes proper meta tags via base template", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Should include base template structure
		assert(html.includes("<!DOCTYPE html>"), "Contains proper DOCTYPE");
		assert(
			html.includes("processData - utils"),
			"Contains proper title format",
		);
		assert(
			html.includes("API documentation for processData function"),
			"Contains description with entity info",
		);
	});

	test("handles entity types with proper icons in navigation", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Should include type icons in sidebar navigation
		assert(html.includes("⚙️"), "Shows function icon");
		assert(html.includes("🏗️"), "Shows class icon");
	});

	test("shows external link indicators correctly", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// External link should have target="_blank" and icon
		assert(
			html.includes('target="_blank" rel="noopener noreferrer"'),
			"Opens external links safely",
		);
		assert(html.includes("🔗"), "Shows external link icon");
	});

	test("handles empty related entities gracefully", () => {
		const data = createMockData({
			hasRelatedEntities: false,
			relatedEntities: {
				sameModule: [],
				similar: [],
			},
		});
		const html = entityPageTemplate(data);

		assert(
			!html.includes("🔄 Related APIs"),
			"Does not show related APIs section",
		);
		assert(!html.includes("Same Module"), "Does not show same module section");
		assert(
			!html.includes("Similar APIs"),
			"Does not show similar APIs section",
		);
	});

	test("renders entity with minimal data correctly", () => {
		const data = createMockData({
			entity: {
				name: "simpleVar",
				type: "variable",
				description: "",
				source: "",
				location: null,
				importPath: "test-package",
				importStatement: "import { simpleVar } from 'test-package';",
				isDefault: true,
			},
			hasParameters: false,
			hasReturns: false,
			hasExamples: false,
			hasSource: false,
			hasLocation: false,
			hasTypeInfo: false,
			hasRelatedEntities: false,
			isDeprecated: false,
		});
		const html = entityPageTemplate(data);

		// Should still render basic structure
		assert(html.includes("simpleVar"), "Shows entity name");
		assert(html.includes("variable"), "Shows entity type");
		assert(html.includes("default module"), "Shows default module badge");
		assert(html.includes("import { simpleVar }"), "Shows import statement");
	});
});
