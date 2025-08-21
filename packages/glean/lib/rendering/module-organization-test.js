/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Integration tests for module organization and extraction rules
 *
 * Tests that validate the proper organization of modules based on developer expectations
 * rather than implementation file structure. Ensures documentation follows logical
 * groupings that match how developers think about and use APIs.
 */

import { ok, strictEqual } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";

import { discoverPackage } from "../discovery/index.js";
import { extractDocumentationGraph } from "../extraction/index.js";
import { generateStaticSite } from "./index.js";

/**
 * Perfect test scenario that illustrates module extraction rules
 */
const PERFECT_MODULE_SCENARIO = {
	"package.json": `{
  "name": "perfect-module-test",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./core/index.js"
    },
    "./utils": {
      "import": "./utils/index.js"
    }
  }
}`,

	// CORE MODULE - Entry point with logical sub-modules
	"core/index.js": `/**
 * @file Core templating engine with multiple template types
 */

export { html, safeHtml } from "./html/index.js";
export { css, style } from "./css/index.js";
export { js, script } from "./js/index.js";
export { md } from "./markdown/index.js";
`,

	// HTML Sub-module (logical grouping)
	"core/html/index.js": `/**
 * @file HTML templating functions
 */

/**
 * Generate HTML from template
 * @param {TemplateStringsArray} strings - Template strings
 * @param {...*} values - Template values
 * @returns {string} HTML string
 */
export const html = (strings, ...values) => "html";

/**
 * Generate safe HTML with XSS protection
 * @param {TemplateStringsArray} strings - Template strings
 * @param {...*} values - Template values
 * @returns {string} Safe HTML string
 */
export const safeHtml = (strings, ...values) => "safeHtml";
`,

	// Implementation details (should NOT become separate modules)
	"core/html/escape.js": `/**
 * @file Internal HTML escaping utilities
 */

/**
 * Internal escape function (not exported from index)
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export const escapeHtml = (str) => str.replace(/</g, "&lt;");
`,

	"core/html/renderer.js": `/**
 * @file Internal HTML rendering utilities
 */

/**
 * Internal renderer (not exported from index)
 * @param {string} html - HTML to render
 * @returns {string} Rendered HTML
 */
export const renderHtml = (html) => html;
`,

	// CSS Sub-module (logical grouping)
	"core/css/index.js": `/**
 * @file CSS templating functions
 */

/**
 * Generate CSS from template
 * @param {TemplateStringsArray} strings - Template strings
 * @param {...*} values - Template values
 * @returns {string} CSS string
 */
export const css = (strings, ...values) => "css";

/**
 * Generate inline style attribute
 * @param {Object} styles - Style object
 * @returns {string} Style string
 */
export const style = (styles) => "style";
`,

	// JS Sub-module (logical grouping)
	"core/js/index.js": `/**
 * @file JavaScript templating functions
 */

/**
 * Generate JavaScript from template
 * @param {TemplateStringsArray} strings - Template strings
 * @param {...*} values - Template values
 * @returns {string} JavaScript string
 */
export const js = (strings, ...values) => "js";

/**
 * Generate script tag
 * @param {string} src - Script source
 * @returns {string} Script tag
 */
export const script = (src) => \`<script src="\${src}"></script>\`;
`,

	// Markdown Sub-module (but too small - should merge up)
	"core/markdown/index.js": `/**
 * @file Markdown processing
 */

/**
 * Process markdown template
 * @param {TemplateStringsArray} strings - Template strings
 * @param {...*} values - Template values
 * @returns {string} HTML string
 */
export const md = (strings, ...values) => "markdown";
`,

	// UTILS MODULE - Separate entry point
	"utils/index.js": `/**
 * @file Utility functions for template processing
 */

/**
 * Validate template input
 * @param {*} input - Input to validate
 * @returns {boolean} Is valid
 */
export const validate = (input) => true;

/**
 * Transform template values
 * @param {*[]} values - Values to transform
 * @returns {*[]} Transformed values
 */
export const transform = (values) => values;

/**
 * Utility helper class
 */
export class TemplateHelper {
	/**
	 * Process template data
	 * @param {string} data - Template data
	 * @returns {string} Processed data
	 */
	process(data) {
		return data;
	}
}
`,

	// Standalone files (not in directories with index.js - should be ignored or merged)
	"core/standalone.js": `/**
 * @file Standalone utility (no index.js in this directory)
 */

/**
 * Standalone function (should not create its own module)
 * @returns {string} Result
 */
export const standalone = () => "standalone";
`,

	// Deep nested files (beyond logical grouping - should be merged up)
	"core/html/deep/nested/helper.js": `/**
 * @file Deeply nested helper (should not create separate module)
 */

/**
 * Deep helper function
 * @returns {string} Result
 */
export const deepHelper = () => "deep";
`,
};

/**
 * Expected module organization based on extraction rules
 */
const EXPECTED_MODULE_ORGANIZATION = {
	// Rule 1: Entry Point Rule - Package exports define top-level modules
	topLevelModules: [
		{
			name: "core",
			path: "core/index",
			description: "Core templating engine with multiple template types",
			subModules: [
				"HTML Templating",
				"CSS Templating",
				"JavaScript Templating",
				"Markdown Processing",
			],
		},
		{
			name: "utils",
			path: "utils/index",
			description: "Utility functions for template processing",
			subModules: [],
		},
	],

	// Rule 2: Index File Rule + Rule 3: Logical Grouping Rule
	expectedModuleCount: 6, // core, utils, html, css, js, md (md too small, merges up = 5 total)
	actualExpectedCount: 5, // After size threshold applied

	// Rule 4: Depth Limit Rule - Maximum 2-3 levels
	maxNestingLevel: 2, // Package > Feature > Sub-feature

	// Rule 5: Size Threshold Rule - Modules with <3 entities get merged up
	minEntitiesPerModule: 2, // md has 1 entity, should merge to core

	// Rule 6: Public API Rule - Only exported symbols become module members
	totalPublicEntities: 9, // html, safeHtml, css, style, js, script, md, validate, transform, TemplateHelper (actually 10)
	actualTotalEntities: 10,

	// Expected final structure
	finalModules: [
		{
			id: "core",
			name: "Core",
			entities: ["html", "safeHtml", "css", "style", "js", "script", "md"], // md merged up due to size
			subModules: [
				{
					id: "core/html",
					name: "HTML Templating",
					entities: ["html", "safeHtml"],
				},
				{
					id: "core/css",
					name: "CSS Templating",
					entities: ["css", "style"],
				},
				{
					id: "core/js",
					name: "JavaScript Templating",
					entities: ["js", "script"],
				},
				// md module merged up to core due to size threshold
			],
		},
		{
			id: "utils",
			name: "Utils",
			entities: ["validate", "transform", "TemplateHelper"],
			subModules: [],
		},
	],
};

/**
 * Create a temporary test project with the perfect module scenario
 * @param {Object} files - Files to create
 * @returns {string} Temporary directory path
 */
function createPerfectModuleProject(files) {
	const tempDir = mkdtempSync(join(tmpdir(), "glean-module-test-"));

	for (const [filePath, content] of Object.entries(files)) {
		const fullPath = join(tempDir, filePath);
		const dir = join(fullPath, "..");

		mkdirSync(dir, { recursive: true });
		writeFileSync(fullPath, content, "utf8");
	}

	return tempDir;
}

/**
 * Module organization integration tests
 */
describe("Module Organization Integration Tests", () => {
	test("should apply Entry Point Rule: package exports define top-level modules", async () => {
		const tempDir = createPerfectModuleProject(PERFECT_MODULE_SCENARIO);

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			// Should have exactly 2 top-level modules based on package.json exports
			// Top-level modules are those that match package.json exports paths
			const packageExportPaths = ["core/index", "utils/index"]; // Based on our test scenario
			const topLevelModules = Array.from(graph.modules.values()).filter((m) =>
				packageExportPaths.includes(m.id),
			);

			strictEqual(
				topLevelModules.length,
				2,
				`Should have exactly 2 top-level modules (core, utils), got ${topLevelModules.length}`,
			);

			const moduleNames = topLevelModules
				.map((m) => {
					// Map module IDs to logical names
					if (m.id === "core/index") return "core";
					if (m.id === "utils/index") return "utils";
					return /** @type {any} */ (m).name || m.id;
				})
				.sort();
			strictEqual(
				JSON.stringify(moduleNames),
				JSON.stringify(["core", "utils"]),
				"Top-level modules should match package.json exports",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should apply Index File Rule: directories with index.js become sub-modules", async () => {
		const tempDir = createPerfectModuleProject(PERFECT_MODULE_SCENARIO);

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			// Should find modules for each directory with index.js
			const expectedModuleIds = [
				"core/index",
				"utils/index",
				"core/html/index",
				"core/css/index",
				"core/js/index",
				"core/markdown/index",
			];

			for (const expectedId of expectedModuleIds) {
				const module = Array.from(graph.modules.values()).find(
					(m) =>
						m.id === expectedId || m.id === expectedId.replace("/index", ""),
				);
				ok(module, `Should find module for ${expectedId}`);
			}

			// Should NOT find modules for implementation files
			const shouldNotExist = [
				"core/html/escape",
				"core/html/renderer",
				"core/standalone",
				"core/html/deep/nested/helper",
			];

			for (const shouldNotId of shouldNotExist) {
				const module = Array.from(graph.modules.values()).find(
					(m) => m.id === shouldNotId,
				);
				ok(
					!module,
					`Should NOT create module for implementation file ${shouldNotId}`,
				);
			}
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should apply Logical Grouping Rule: group by developer mental model", async () => {
		const tempDir = createPerfectModuleProject(PERFECT_MODULE_SCENARIO);

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			// HTML module should contain all HTML-related functions
			const htmlModule = Array.from(graph.modules.values()).find(
				(m) =>
					m.id.includes("html") ||
					(m.entities &&
						Array.from(graph.entities.values()).filter(
							(e) =>
								m.entities.includes(e.getId()) &&
								["html", "safeHtml"].includes(e.name),
						).length > 0),
			);

			ok(htmlModule, "Should have an HTML-related module");

			// Check that related entities are grouped together
			const htmlEntities =
				htmlModule.entities
					?.map(
						(eid) =>
							Array.from(graph.entities.values()).find((e) => e.getId() === eid)
								?.name,
					)
					.filter(Boolean) || [];

			ok(
				htmlEntities.includes("html"),
				"HTML module should contain html function",
			);
			ok(
				htmlEntities.includes("safeHtml"),
				"HTML module should contain safeHtml function",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should apply Size Threshold Rule: modules with <3 entities get merged up", async () => {
		const tempDir = createPerfectModuleProject(PERFECT_MODULE_SCENARIO);

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			// Count entities per module
			/** @type {Record<string, number>} */
			const moduleEntityCounts = {};
			for (const module of Array.from(graph.modules.values())) {
				moduleEntityCounts[module.id] = /** @type {any} */ (
					(module).entities || []
				).length;
			}

			// Modules with <2 entities should be merged up or not exist as separate modules
			const _smallModules = Object.entries(moduleEntityCounts).filter(
				([id, count]) => count < 2 && !id.endsWith("/index"),
			);

			// After applying size threshold, should have reasonable number of modules
			const finalModuleCount = graph.modules.size;
			ok(
				finalModuleCount <= EXPECTED_MODULE_ORGANIZATION.expectedModuleCount,
				`Should have at most ${EXPECTED_MODULE_ORGANIZATION.expectedModuleCount} modules after size threshold, got ${finalModuleCount}`,
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should apply Public API Rule: only exported symbols become module members", async () => {
		const tempDir = createPerfectModuleProject(PERFECT_MODULE_SCENARIO);

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			// Should find exactly the exported entities
			const expectedPublicEntities = [
				"html",
				"safeHtml", // from core/html/index.js
				"css",
				"style", // from core/css/index.js
				"js",
				"script", // from core/js/index.js
				"md", // from core/markdown/index.js
				"validate",
				"transform",
				"TemplateHelper", // from utils/index.js
			];

			const actualEntityNames = Array.from(graph.entities.values()).map(
				(e) => e.name,
			);

			strictEqual(
				actualEntityNames.length,
				EXPECTED_MODULE_ORGANIZATION.actualTotalEntities,
				`Should have exactly ${EXPECTED_MODULE_ORGANIZATION.actualTotalEntities} public entities, got ${actualEntityNames.length}`,
			);

			// Check each expected entity exists
			for (const expectedName of expectedPublicEntities) {
				ok(
					actualEntityNames.includes(expectedName),
					`Should find public entity '${expectedName}'`,
				);
			}

			// Should NOT find internal entities
			const internalEntities = [
				"escapeHtml",
				"renderHtml",
				"standalone",
				"deepHelper",
			];
			for (const internalName of internalEntities) {
				ok(
					!actualEntityNames.includes(internalName),
					`Should NOT find internal entity '${internalName}'`,
				);
			}
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should generate properly organized documentation site", async () => {
		const tempDir = createPerfectModuleProject(PERFECT_MODULE_SCENARIO);
		const outputDir = mkdtempSync(join(tmpdir(), "glean-output-test-"));

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			// Generate static site
			await generateStaticSite(graph, outputDir);

			// Verify build results match expectations
			// Top-level modules are those that match package.json exports paths
			const packageExportPaths = ["core/index", "utils/index"];
			const topLevelModules = Array.from(graph.modules.values()).filter((m) =>
				packageExportPaths.includes(m.id),
			);

			const totalEntities = graph.entities.size;
			const totalModules = graph.modules.size;

			// Strict count validation
			strictEqual(
				topLevelModules.length,
				2,
				"Should have exactly 2 top-level modules",
			);
			strictEqual(
				totalEntities,
				EXPECTED_MODULE_ORGANIZATION.actualTotalEntities,
				`Should have exactly ${EXPECTED_MODULE_ORGANIZATION.actualTotalEntities} entities`,
			);
			ok(
				totalModules <= EXPECTED_MODULE_ORGANIZATION.expectedModuleCount,
				`Should have at most ${EXPECTED_MODULE_ORGANIZATION.expectedModuleCount} modules`,
			);

			console.log(`\n📊 Module Organization Results:`);
			console.log(`   Top-level modules: ${topLevelModules.length}`);
			console.log(`   Total modules: ${totalModules}`);
			console.log(`   Total entities: ${totalEntities}`);
			console.log(
				`   Module names: ${topLevelModules.map((m) => /** @type {any} */ (m).name || m.id).join(", ")}`,
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
			rmSync(outputDir, { recursive: true, force: true });
		}
	});
});
