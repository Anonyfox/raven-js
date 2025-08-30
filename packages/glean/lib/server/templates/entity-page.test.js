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
				properties: [],
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
			hasProperties: false,
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
			html.includes("Array&lt;Object&gt;, options?: ProcessOptions"),
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
		assert(html.includes("Array&lt;Object&gt;"), "Shows parameter type");
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
		assert(html.includes("Array&lt;ProcessedItem&gt;"), "Shows return type");
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

		// Location information is no longer shown to save space
		assert(!html.includes("📍 utils.js:42"), "Does not show source location");

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

	test("does not display navigation sidebar for clean layout", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Navigation sidebar was removed for full-width content
		assert(!html.includes("🗂️ utils APIs"), "No duplicate module navigation");
		assert(
			!html.includes("📦 All Modules"),
			"No duplicate all modules navigation",
		);
		assert(!html.includes("col-lg-8"), "Uses full width layout");
		assert(!html.includes("col-lg-4"), "No sidebar column");
	});

	test("does not include quick actions for clean layout", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Quick actions were removed for cleaner UI
		assert(!html.includes("🚀 Quick Actions"), "No quick actions section");
		assert(
			!html.includes("📄 Module Overview"),
			"No duplicate module overview link",
		);
		assert(!html.includes("🔍 Search APIs"), "No broken search API links");
		assert(!html.includes("search=processData"), "No API search links");
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
		assert(html.includes("📋 Copy"), "Has copy buttons");
		assert(html.includes("Basic Usage"), "Has example sections");
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

		// Should preserve backticks in code content
		assert(
			html.includes("`"),
			"Preserves backticks in JavaScript string literals",
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
		assert(
			html.includes("Promise&lt;Result&lt;T&gt;&gt;"),
			"Shows generic return types",
		);
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

	test("shows navigation sidebar when multiple modules exist", () => {
		const data = createMockData();
		const html = entityPageTemplate(data);

		// Navigation sidebar should be present for module navigation
		assert(html.includes("nav nav-pills"), "Has sidebar navigation pills");
		assert(html.includes("Module Navigation"), "Has module navigation section");
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

	test("should render entity description with markdown formatting", () => {
		const data = {
			entity: {
				name: "testFunction",
				type: "function",
				description:
					"This is a **bold** function with `inline code` and a [link](https://example.com).",
				importPath: "test-module",
				importStatement: "import { testFunction } from 'test-module';",
				isDefault: false,
				location: { file: "test.js", line: 10 },
			},
			documentation: {
				parameters: [],
				returns: { type: "string", description: "" },
				examples: [],
				since: "",
				deprecated: null,
				author: [],
				see: [],
				throws: [],
				typeInfo: { signature: "" },
			},
			relatedEntities: {
				sameModule: [],
				similar: [],
			},
			navigation: {
				allModules: [],
				moduleEntities: [],
			},
			packageName: "test-package",
			moduleName: "test-module",
			hasParameters: false,
			hasReturns: false,
			hasExamples: false,
			hasRelatedEntities: false,
			hasTypeInfo: false,
			isDeprecated: false,
			hasSource: false,
			hasLocation: true,
		};

		const html = entityPageTemplate(data);

		// Description is now rendered as plain text in page header
		assert(
			html.includes(
				"This is a **bold** function with `inline code` and a [link](https://example.com).",
			),
			"Should render description as plain text without markdown processing",
		);

		// Should not process markdown in the header description
		assert(
			!html.includes("<strong>bold</strong>"),
			"Should not render bold HTML in header",
		);
		assert(
			!html.includes("<code>inline code</code>"),
			"Should not render code HTML in header",
		);
	});

	test("links typedef names in parameters and returns to their entity pages", () => {
		const data = createMockData({
			documentation: {
				...createMockData().documentation,
				parameters: [
					{
						name: "config",
						type: "TestConfig",
						description: "Configuration object with test options",
						isOptional: false,
						defaultValue: null,
					},
				],
				returns: {
					type: "TestResult",
					description: "Result of the test operation",
				},
			},
			relatedEntities: {
				sameModule: [
					{
						name: "TestConfig",
						type: "typedef",
						description: "Configuration options for testing",
						link: "/modules/utils/TestConfig/",
					},
					{
						name: "TestResult",
						type: "typedef",
						description: "Result of a test operation",
						link: "/modules/utils/TestResult/",
					},
				],
				similar: [],
			},
		});
		const html = entityPageTemplate(data);

		// Parameter type should be linked
		assert(
			html.includes('<a href="/modules/utils/TestConfig/"'),
			"Links TestConfig parameter type",
		);
		assert(
			html.includes('<code class="text-secondary">TestConfig</code>'),
			"Shows TestConfig in code style",
		);

		// Return type should be linked
		assert(
			html.includes('<a href="/modules/utils/TestResult/"'),
			"Links TestResult return type",
		);
		assert(
			html.includes('<code class="text-secondary">TestResult</code>'),
			"Shows TestResult in code style",
		);

		// Links should be properly formatted
		assert(
			html.includes('class="text-decoration-none"'),
			"Uses proper link styling",
		);
	});

	test("does not link parameter types that are not entities in the same module", () => {
		const data = createMockData({
			documentation: {
				...createMockData().documentation,
				parameters: [
					{
						name: "data",
						type: "string",
						description: "A simple string parameter",
						isOptional: false,
						defaultValue: null,
					},
				],
				returns: {
					type: "number",
					description: "A numeric result",
				},
			},
		});
		const html = entityPageTemplate(data);

		// Built-in types should not be linked
		assert(
			!html.includes('<a href="/modules/utils/string/"'),
			"Does not link string type",
		);
		assert(
			!html.includes('<a href="/modules/utils/number/"'),
			"Does not link number type",
		);

		// Should still show the types in code style
		assert(
			html.includes('<code class="text-secondary">string</code>'),
			"Shows string in code style",
		);
		assert(
			html.includes('<code class="text-secondary">number</code>'),
			"Shows number in code style",
		);
	});

	test("displays typedef properties with correct formatting", () => {
		const data = createMockData({
			entity: {
				...createMockData().entity,
				type: "typedef",
			},
			documentation: {
				...createMockData().documentation,
				properties: [
					{
						name: "title",
						type: "string",
						description: "The title of the item",
						isOptional: false,
						defaultValue: null,
					},
					{
						name: "url",
						type: "string",
						description: "Optional URL for the item",
						isOptional: true,
						defaultValue: null,
					},
				],
			},
			hasProperties: true,
		});
		const html = entityPageTemplate(data);

		// Properties section should be present
		assert(html.includes("📝 Properties"), "Contains Properties section");
		assert(html.includes("Property</th>"), "Contains Property column header");
		assert(html.includes("Type</th>"), "Contains Type column header");
		assert(
			html.includes("Description</th>"),
			"Contains Description column header",
		);
		assert(html.includes("Required</th>"), "Contains Required column header");

		// Required property formatting
		assert(
			html.includes('<code class="text-primary">title</code>'),
			"Shows title property name",
		);
		assert(
			html.includes('<code class="text-secondary">string</code>'),
			"Shows property type",
		);
		assert(
			html.includes("The title of the item"),
			"Shows property description",
		);
		assert(
			html.includes('<span class="badge bg-primary">required</span>'),
			"Shows required badge",
		);

		// Optional property formatting
		assert(
			html.includes('<code class="text-primary">url</code>'),
			"Shows url property name",
		);
		assert(
			html.includes('<span class="text-muted">?</span>'),
			"Shows optional indicator",
		);
		assert(
			html.includes('<span class="badge bg-secondary">optional</span>'),
			"Shows optional badge",
		);
		assert(
			html.includes("Optional URL for the item"),
			"Shows optional property description",
		);
	});

	test("does not display properties section when hasProperties is false", () => {
		const data = createMockData({
			hasProperties: false,
		});
		const html = entityPageTemplate(data);

		assert(!html.includes("📝 Properties"), "Does not show Properties section");
	});
});
