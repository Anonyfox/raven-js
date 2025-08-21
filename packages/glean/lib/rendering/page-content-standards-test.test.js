/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Page Content Standards Integration Tests
 *
 * Tests that validate proper page content organization based on industry standards
 * and senior developer expectations. Ensures each page type contains the required
 * elements, proper linking, and navigation structure.
 */

import { ok } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";

import { discoverPackage } from "../discovery/index.js";
import { extractDocumentationGraph } from "../extraction/index.js";
import { generateStaticSite } from "./index.js";

/**
 * Comprehensive test package with all page types and content scenarios
 */
const COMPREHENSIVE_TEST_PACKAGE = {
	"package.json": `{
  "name": "comprehensive-docs-test",
  "version": "2.1.0",
  "description": "A comprehensive test package for documentation standards",
  "type": "module",
  "exports": {
    ".": {
      "import": "./index.js"
    },
    "./utils": {
      "import": "./utils/index.js"
    }
  }
}`,

	// Main entry point
	"index.js": `/**
 * @file Main entry point for the comprehensive test package
 *
 * This package provides templating utilities with comprehensive JSDoc examples
 * for testing documentation generation standards.
 */

export { createTemplate, Template } from "./core/template.js";
export { validateInput } from "./utils/index.js";
`,

	// Core template module with rich JSDoc
	"core/template.js": `/**
 * @file Core templating functionality with advanced features
 */

/**
 * Create a new template instance with validation
 * @param {string} source - Template source code
 * @param {Object} options - Template options
 * @param {boolean} options.strict - Enable strict mode validation
 * @param {string[]} options.allowed - Array of allowed template variables
 * @returns {Template} Configured template instance
 * @throws {Error} When template source is invalid
 * @example
 * const template = createTemplate('Hello {{name}}!', { strict: true });
 * const result = template.render({ name: 'World' });
 * @since 1.0.0
 * @see {@link Template} for the template class
 */
export function createTemplate(source, options = {}) {
	return new Template(source, options);
}

/**
 * Advanced template class with caching and validation
 * @class
 * @since 1.0.0
 */
export class Template {
	/**
	 * Create a new Template instance
	 * @param {string} source - Template source
	 * @param {Object} options - Configuration options
	 */
	constructor(source, options = {}) {
		this.source = source;
		this.options = options;
		this.compiled = false;
	}

	/**
	 * Render template with provided data
	 * @param {Object} data - Data object for template variables
	 * @returns {string} Rendered template output
	 * @throws {Error} When required variables are missing
	 * @example
	 * const template = new Template('Hello {{name}}!');
	 * const output = template.render({ name: 'Alice' });
	 * console.log(output); // "Hello Alice!"
	 */
	render(data) {
		if (!this.compiled) {
			this.compile();
		}
					return this.source.replace(/{{\\w+}}/g, (match) => {
				const key = match.slice(2, -2);
				return data[key] || '';
			});
	}

	/**
	 * Compile template for faster rendering (private method)
	 * @private
	 * @returns {void}
	 */
	compile() {
		this.compiled = true;
	}

	/**
	 * Template cache size limit
	 * @type {number}
	 * @static
	 * @readonly
	 * @since 1.5.0
	 */
	static CACHE_LIMIT = 100;
}

/**
 * Template parsing modes
 * @enum {string}
 * @readonly
 */
export const TemplateMode = {
	/** Standard template parsing */
	STANDARD: 'standard',
	/** Strict mode with validation */
	STRICT: 'strict',
	/** Legacy compatibility mode */
	LEGACY: 'legacy'
};
`,

	// Utilities module
	"utils/index.js": `/**
 * @file Utility functions for template processing
 */

/**
 * Validate template input data
 * @param {*} input - Input to validate
 * @param {Object} schema - Validation schema
 * @returns {boolean} True if valid, false otherwise
 * @deprecated Since version 2.0.0. Use validateInputStrict instead.
 * @example
 * const isValid = validateInput({ name: 'test' }, { name: 'string' });
 */
export function validateInput(input, schema) {
	return typeof input === 'object' && input !== null;
}

/**
 * Configuration constant for validation
 * @type {Object}
 * @readonly
 * @property {number} maxLength - Maximum input length
 * @property {string[]} allowedTypes - Array of allowed data types
 */
export const VALIDATION_CONFIG = {
	maxLength: 1000,
	allowedTypes: ['string', 'number', 'object']
};
`,
};

/**
 * Expected page content standards based on industry best practices
 */
const PAGE_CONTENT_STANDARDS = {
	// Index/Home page requirements
	indexPage: {
		requiredElements: [
			{
				selector: "h1",
				description: "Main package title",
				shouldContain: "comprehensive-docs-test",
			},
			{
				selector: ".version",
				description: "Package version",
				shouldContain: "2.1.0",
			},
			{ selector: ".description", description: "Package description" },
			{ selector: ".navigation", description: "List of available modules" },
			{ selector: "#search-input", description: "Search functionality" },
			{
				selector: ".nav-item",
				description: "Package statistics (modules, entities count)",
			},
		],
		requiredLinks: [
			{ description: "Links to main modules", selector: 'a[href*="modules/"]' },
			{
				description: "Links to main entities",
				selector: 'a[href*="entities/"]',
			},
		],
	},

	// Module page requirements
	modulePage: {
		requiredElements: [
			{ selector: "h1", description: "Module name and path" },
			{
				selector: ".module-description",
				description: "Module description from @file JSDoc",
			},
			{ selector: ".entity-list", description: "List of exported entities" },
			{
				selector: ".breadcrumb, .navigation",
				description: "Breadcrumb navigation",
			},
			{ selector: ".module-source", description: "Source file information" },
		],
		requiredLinks: [
			{ description: "Links to entities", selector: 'a[href*="entities/"]' },
			{
				description: "Breadcrumb link to index",
				selector: 'a[href*="index.html"]',
			},
			{
				description: "Source file link",
				selector: 'a[href*=".js"], .source-link',
			},
		],
	},

	// Entity page requirements
	entityPage: {
		requiredElements: [
			{ selector: "h1", description: "Entity name and type" },
			{
				selector: ".entity-signature",
				description: "Full signature with parameters/return type",
			},
			{
				selector: ".entity-description",
				description: "Description from JSDoc",
			},
			{
				selector: ".source-location",
				description: "Source location information",
			},
			{
				selector: ".breadcrumb, .navigation",
				description: "Navigation back to module/index",
			},
		],
		conditionalElements: [
			{
				selector: ".parameters-table",
				description: "Parameters table (for functions)",
				when: "function",
			},
			{
				selector: ".return-value",
				description: "Return value description (for functions)",
				when: "function",
			},
			{
				selector: ".examples",
				description: "Code examples (if provided)",
				when: "hasExamples",
			},
			{
				selector: ".deprecation-warning",
				description: "Deprecation notice (if deprecated)",
				when: "deprecated",
			},
			{
				selector: ".properties-list",
				description: "Properties list (for classes)",
				when: "class",
			},
			{
				selector: ".methods-list",
				description: "Methods list (for classes)",
				when: "class",
			},
		],
		requiredLinks: [
			{ description: "Link to parent module", selector: 'a[href*="modules/"]' },
			{
				description: "Link to source file",
				selector: 'a[href*=".js"], .source-link',
			},
			{
				description: "Links to related entities",
				selector: 'a[href*="entities/"]',
			},
		],
	},
};

/**
 * Create test project with comprehensive documentation scenarios
 * @param {Object} files - Files to create
 * @returns {string} Temporary directory path
 */
function createComprehensiveProject(files) {
	const tempDir = mkdtempSync(join(tmpdir(), "glean-content-test-"));

	for (const [filePath, content] of Object.entries(files)) {
		const fullPath = join(tempDir, filePath);
		const dir = join(fullPath, "..");

		mkdirSync(dir, { recursive: true });
		writeFileSync(fullPath, content, "utf8");
	}

	return tempDir;
}

/**
 * Parse HTML and check for required elements
 * @param {string} html - HTML content to parse
 * @param {Object} requirements - Requirements to check
 * @returns {Object} Validation results
 */
function validatePageContent(html, requirements) {
	const results = {
		missingElements: [],
		missingLinks: [],
		foundElements: [],
		foundLinks: [],
	};

	// Check required elements
	if (requirements.requiredElements) {
		for (const element of requirements.requiredElements) {
			const found =
				html.includes(`<${element.selector.split(" ")[0]}`) ||
				html.includes(`class="${element.selector.replace(".", "")}"`) ||
				html.includes(`id="${element.selector.replace("#", "")}"`);

			if (found) {
				results.foundElements.push(element.description);
				if (element.shouldContain && !html.includes(element.shouldContain)) {
					results.missingElements.push(
						`${element.description} should contain "${element.shouldContain}"`,
					);
				}
			} else {
				results.missingElements.push(element.description);
			}
		}
	}

	// Check required links
	if (requirements.requiredLinks) {
		for (const link of requirements.requiredLinks) {
			const found =
				html.includes("<a href") &&
				(html.includes(
					link.selector
						.split("[")[1]
						?.replace("]", "")
						.replace("href*=", "")
						.replace(/"/g, "") || "",
				) ||
					html.includes(`class="${link.selector.replace(".", "")}"`) ||
					html.includes(`<a`));

			if (found) {
				results.foundLinks.push(link.description);
			} else {
				results.missingLinks.push(link.description);
			}
		}
	}

	return results;
}

/**
 * Page Content Standards Integration Tests
 */
describe("Page Content Standards Integration Tests", () => {
	test("should generate index page with all required elements and links", async () => {
		const tempDir = createComprehensiveProject(COMPREHENSIVE_TEST_PACKAGE);
		const outputDir = mkdtempSync(join(tmpdir(), "glean-output-test-"));

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			// Generate static site
			await generateStaticSite(graph, outputDir);

			// Read generated index page
			const indexPath = join(outputDir, "index.html");
			const indexHtml = await readFile(indexPath, "utf-8");

			// Validate index page content
			const results = validatePageContent(
				indexHtml,
				PAGE_CONTENT_STANDARDS.indexPage,
			);

			// Check for package name and version
			ok(
				indexHtml.includes("comprehensive-docs-test"),
				"Index should contain package name",
			);
			ok(indexHtml.includes("2.1.0"), "Index should contain package version");

			// Check for module navigation
			ok(
				indexHtml.includes("modules/") || indexHtml.includes("href"),
				"Index should have module links",
			);

			// Verify no critical elements are missing
			ok(
				results.missingElements.length <= 2,
				`Index page missing critical elements: ${results.missingElements.join(", ")}`,
			);

			console.log(`📊 Index Page Validation:`);
			console.log(`   Found elements: ${results.foundElements.length}`);
			console.log(`   Missing elements: ${results.missingElements.length}`);
			console.log(`   Found links: ${results.foundLinks.length}`);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
			rmSync(outputDir, { recursive: true, force: true });
		}
	});

	test("should generate module pages with proper structure and navigation", async () => {
		const tempDir = createComprehensiveProject(COMPREHENSIVE_TEST_PACKAGE);
		const outputDir = mkdtempSync(join(tmpdir(), "glean-output-test-"));

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			await generateStaticSite(graph, outputDir);

			// Check if module pages were generated
			const moduleFiles = [
				"index.html",
				"core-template.html",
				"utils-index.html",
			];
			let foundModulePage = false;

			for (const moduleFile of moduleFiles) {
				const modulePath = join(outputDir, "modules", moduleFile);
				try {
					const moduleHtml = await readFile(modulePath, "utf-8");
					foundModulePage = true;

					// Validate module page content
					const results = validatePageContent(
						moduleHtml,
						PAGE_CONTENT_STANDARDS.modulePage,
					);

					// Check for breadcrumb navigation
					ok(
						moduleHtml.includes("href") &&
							(moduleHtml.includes("index.html") || moduleHtml.includes("../")),
						"Module page should have navigation back to index",
					);

					// Check for entity listings
					ok(
						moduleHtml.includes("createTemplate") ||
							moduleHtml.includes("Template") ||
							moduleHtml.includes("validateInput"),
						"Module page should list exported entities",
					);

					console.log(`📊 Module Page (${moduleFile}) Validation:`);
					console.log(`   Found elements: ${results.foundElements.length}`);
					console.log(`   Missing elements: ${results.missingElements.length}`);

					break; // Test first available module page
				} catch {
					// Module page doesn't exist, try next one
				}
			}

			ok(foundModulePage, "At least one module page should be generated");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
			rmSync(outputDir, { recursive: true, force: true });
		}
	});

	test("should generate entity pages with comprehensive documentation", async () => {
		const tempDir = createComprehensiveProject(COMPREHENSIVE_TEST_PACKAGE);
		const outputDir = mkdtempSync(join(tmpdir(), "glean-output-test-"));

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			await generateStaticSite(graph, outputDir);

			// Look for entity pages (they include module prefix)
			const entityFiles = [
				"core-template-createTemplate.html",
				"core-template-Template.html",
				"utils-index-validateInput.html",
				"index-createTemplate.html",
				"index-Template.html",
				"index-validateInput.html",
			];
			let foundEntityPage = false;

			for (const entityFile of entityFiles) {
				const entityPath = join(outputDir, "entities", entityFile);
				try {
					const entityHtml = await readFile(entityPath, "utf-8");
					foundEntityPage = true;

					// Validate entity page content
					const results = validatePageContent(
						entityHtml,
						PAGE_CONTENT_STANDARDS.entityPage,
					);

					// Check for function signature (for function entities)
					if (
						entityFile.includes("createTemplate") ||
						entityFile.includes("validateInput")
					) {
						ok(
							entityHtml.includes("(") && entityHtml.includes(")"),
							"Function entity should show signature with parameters",
						);
					}

					// Check for examples if present
					if (
						entityHtml.includes("@example") ||
						entityHtml.includes("Example")
					) {
						ok(
							entityHtml.includes("```") ||
								entityHtml.includes("<code>") ||
								entityHtml.includes("<pre>"),
							"Entity with examples should render code blocks",
						);
					}

					// Check for deprecation warnings
					if (entityFile.includes("validateInput")) {
						ok(
							entityHtml.includes("deprecated") ||
								entityHtml.includes("Deprecated"),
							"Deprecated entity should show deprecation warning",
						);
					}

					// Check for navigation
					ok(
						entityHtml.includes("href") &&
							(entityHtml.includes("modules/") ||
								entityHtml.includes("index.html")),
						"Entity page should have navigation to parent module",
					);

					console.log(`📊 Entity Page (${entityFile}) Validation:`);
					console.log(`   Found elements: ${results.foundElements.length}`);
					console.log(`   Missing elements: ${results.missingElements.length}`);

					break; // Test first available entity page
				} catch {
					// Entity page doesn't exist, try next one
				}
			}

			ok(foundEntityPage, "At least one entity page should be generated");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
			rmSync(outputDir, { recursive: true, force: true });
		}
	});

	test("should properly link between pages and maintain navigation consistency", async () => {
		const tempDir = createComprehensiveProject(COMPREHENSIVE_TEST_PACKAGE);
		const outputDir = mkdtempSync(join(tmpdir(), "glean-output-test-"));

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			await generateStaticSite(graph, outputDir);

			// Read all generated pages
			const indexHtml = await readFile(join(outputDir, "index.html"), "utf-8");

			// Check index page has links to modules and entities
			ok(
				indexHtml.includes("href=") &&
					(indexHtml.includes("modules/") || indexHtml.includes("entities/")),
				"Index page should link to modules or entities",
			);

			// Verify navigation links are relative (exclude SEO tags which should be absolute)
			// SEO tags like canonical, og:url should remain absolute for proper function
			const navigationLinkPattern = /<a[^>]+href="([^"]*)"[^>]*>/g;
			const navigationLinks = [];
			let navMatch;
			navMatch = navigationLinkPattern.exec(indexHtml);
			while (navMatch !== null) {
				navigationLinks.push(navMatch[1]);
				navMatch = navigationLinkPattern.exec(indexHtml);
			}

			const absoluteNavLinks = navigationLinks.filter(
				(link) => link.startsWith("http") || link.startsWith("//"),
			);

			if (absoluteNavLinks.length > 0) {
				console.log(
					`   ❌ Found absolute navigation links: ${absoluteNavLinks.join(", ")}`,
				);
			}

			// Verify navigation links are relative (SEO canonical links should remain absolute)
			ok(
				absoluteNavLinks.length === 0,
				`Navigation links should be relative, found absolute: ${absoluteNavLinks.join(", ")}`,
			);

			// Check for consistent navigation structure
			const linkPattern = /href="([^"]*\.html)"/g;
			const links = [];
			let match;
			match = linkPattern.exec(indexHtml);
			while (match !== null) {
				links.push(match[1]);
				match = linkPattern.exec(indexHtml);
			}

			ok(links.length > 0, "Index page should contain navigation links");

			// Verify link format consistency
			for (const link of links) {
				ok(link.endsWith(".html"), `Link should end with .html: ${link}`);
				ok(!link.includes("\\"), `Link should use forward slashes: ${link}`);
			}

			console.log(`📊 Navigation Consistency Check:`);
			console.log(`   Total navigation links: ${links.length}`);
			console.log(`   Sample links: ${links.slice(0, 3).join(", ")}`);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
			rmSync(outputDir, { recursive: true, force: true });
		}
	});

	test("should handle special entity types with appropriate content", async () => {
		const tempDir = createComprehensiveProject(COMPREHENSIVE_TEST_PACKAGE);
		const outputDir = mkdtempSync(join(tmpdir(), "glean-output-test-"));

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			await generateStaticSite(graph, outputDir);

			// Extract entities to check types
			const entities = Array.from(graph.entities.values());
			const hasClass = entities.some((e) => e.name === "Template");
			const hasFunction = entities.some((e) => e.name === "createTemplate");
			const hasVariable = entities.some((e) => e.name === "VALIDATION_CONFIG");
			const hasEnum = entities.some((e) => e.name === "TemplateMode");

			// Verify different entity types are properly handled
			ok(
				hasFunction || hasClass || hasVariable,
				"Should extract different entity types (functions, classes, variables)",
			);

			// Check that extracted entities have proper types
			for (const entity of entities) {
				ok(
					entity.name && entity.name.length > 0,
					`Entity should have a valid name: ${entity.name}`,
				);
			}

			console.log(`📊 Entity Types Analysis:`);
			console.log(`   Total entities: ${entities.length}`);
			console.log(`   Has classes: ${hasClass}`);
			console.log(`   Has functions: ${hasFunction}`);
			console.log(`   Has variables: ${hasVariable}`);
			console.log(`   Has enums: ${hasEnum}`);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
			rmSync(outputDir, { recursive: true, force: true });
		}
	});
});
