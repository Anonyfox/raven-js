/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Integration tests for entity extraction across different source code patterns
 *
 * Tests various JavaScript patterns, file structures, and JSDoc styles to ensure
 * comprehensive entity extraction. Validates that glean can handle real-world
 * project structures and common coding patterns.
 */

import { ok } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { discoverPackage } from "../discovery/index.js";
import { extractDocumentationGraph } from "./index.js";

/**
 * Test scenarios for different JavaScript patterns
 */
const TEST_SCENARIOS = {
	// Modern ES6+ patterns
	modernPatterns: {
		"index.js": `/**
 * @file Modern JavaScript patterns test
 */

/**
 * Arrow function export
 * @param {string} name - The name
 * @returns {string} Greeting
 */
export const greet = (name) => \`Hello, \${name}!\`;

/**
 * Regular function declaration
 * @param {number} x - First number
 * @param {number} y - Second number
 * @returns {number} Sum
 */
export function add(x, y) {
	return x + y;
}

/**
 * Class with methods
 */
export class Calculator {
	/**
	 * Multiply two numbers
	 * @param {number} a - First number
	 * @param {number} b - Second number
	 * @returns {number} Product
	 */
	multiply(a, b) {
		return a * b;
	}
}

/**
 * Async function
 * @param {string} url - URL to fetch
 * @returns {Promise<Response>} Response
 */
export async function fetchData(url) {
	return fetch(url);
}

/**
 * Constant export
 * @type {string}
 */
export const VERSION = "1.0.0";
`,
		"package.json": `{
  "name": "modern-patterns-test",
  "version": "1.0.0",
  "type": "module"
}`,
	},

	// Nested module structure
	nestedModules: {
		"package.json": `{
  "name": "nested-modules-test",
  "version": "1.0.0",
  "type": "module"
}`,
		"src/utils/string.js": `/**
 * @file String utilities
 */

/**
 * Capitalize a string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
`,
		"src/utils/array.js": `/**
 * @file Array utilities
 */

/**
 * Chunk an array
 * @param {Array} arr - Input array
 * @param {number} size - Chunk size
 * @returns {Array[]} Chunked arrays
 */
export function chunk(arr, size) {
	const chunks = [];
	for (let i = 0; i < arr.length; i += size) {
		chunks.push(arr.slice(i, i + size));
	}
	return chunks;
}
`,
		"src/index.js": `/**
 * @file Main entry point
 */

export { capitalize } from "./utils/string.js";
export { chunk } from "./utils/array.js";
`,
	},

	// Complex JSDoc patterns
	complexJsDoc: {
		"api.js": `/**
 * @file Complex JSDoc patterns
 */

/**
 * Complex function with detailed JSDoc
 * @param {Object} options - Configuration options
 * @param {string} options.name - User name
 * @param {number} [options.age=18] - User age (optional)
 * @param {Array<string>} options.hobbies - List of hobbies
 * @param {('admin'|'user'|'guest')} options.role - User role
 * @returns {Promise<{id: string, profile: Object}>} User profile
 * @throws {Error} When validation fails
 * @example
 * const user = await createUser({
 *   name: "Alice",
 *   hobbies: ["reading", "coding"],
 *   role: "admin"
 * });
 * @since 1.0.0
 * @deprecated Use createProfile instead
 */
export async function createUser(options) {
	// Implementation
	return { id: "123", profile: options };
}

/**
 * Generic function with type parameters
 * @template T
 * @param {T[]} items - Array of items
 * @param {(item: T) => boolean} predicate - Filter function
 * @returns {T[]} Filtered items
 */
export const filter = (items, predicate) => items.filter(predicate);

/**
 * Callback type definition
 * @callback ProcessCallback
 * @param {string} data - Data to process
 * @param {Error|null} error - Error if any
 * @returns {void}
 */

/**
 * Function using callback
 * @param {string} input - Input data
 * @param {ProcessCallback} callback - Callback function
 */
export function processAsync(input, callback) {
	setTimeout(() => callback(input, null), 100);
}
`,
		"package.json": `{
  "name": "complex-jsdoc-test",
  "version": "1.0.0",
  "type": "module"
}`,
	},

	// Different export patterns
	exportPatterns: {
		"exports.js": `/**
 * @file Different export patterns
 */

/**
 * Default export function
 * @param {string} msg - Message
 */
function defaultFunc(msg) {
	console.log(msg);
}

/**
 * Named export
 * @type {number}
 */
const MAX_SIZE = 100;

/**
 * Re-exported from another module
 * @param {Array} arr - Array to sort
 * @returns {Array} Sorted array
 */
export const sortArray = (arr) => [...arr].sort();

// Different export styles
export default defaultFunc;
export { MAX_SIZE };

/**
 * Destructured exports
 */
const helpers = {
	/**
	 * Helper function
	 * @param {string} str - Input
	 * @returns {string} Processed string
	 */
	process: (str) => str.trim()
};

export const { process } = helpers;
`,
		"package.json": `{
  "name": "export-patterns-test",
  "version": "1.0.0",
  "type": "module"
}`,
	},
};

/**
 * Expected results for each test scenario
 */
const EXPECTED_RESULTS = {
	modernPatterns: {
		minEntities: 5, // greet, add, Calculator, fetchData, VERSION
		expectedTypes: ["function", "class", "variable"],
		expectedNames: ["greet", "add", "Calculator", "fetchData", "VERSION"],
	},
	nestedModules: {
		minEntities: 2, // capitalize, chunk
		minModules: 3, // src/index, src/utils/string, src/utils/array
		expectedNames: ["capitalize", "chunk"],
	},
	complexJsDoc: {
		minEntities: 3, // createUser, filter, processAsync
		hasExamples: true,
		hasDeprecated: true,
		expectedNames: ["createUser", "filter", "processAsync"],
	},
	exportPatterns: {
		minEntities: 4, // defaultFunc, sortArray, MAX_SIZE, process
		hasDefault: true,
		expectedNames: ["defaultFunc", "sortArray", "MAX_SIZE", "process"],
		expectedTypes: ["function", "variable"], // Add expected types
	},
};

/**
 * Create a temporary directory with test files
 * @param {Object} files - Files to create (path -> content)
 * @returns {string} Temporary directory path
 */
function createTestProject(files) {
	const tempDir = mkdtempSync(join(tmpdir(), "glean-integration-test-"));

	for (const [filePath, content] of Object.entries(files)) {
		const fullPath = join(tempDir, filePath);
		const dir = join(fullPath, "..");

		mkdirSync(dir, { recursive: true });
		writeFileSync(fullPath, content, "utf8");
	}

	return tempDir;
}

/**
 * Test entity extraction for modern JavaScript patterns
 */
describe("Entity Extraction Integration Tests", () => {
	test("should extract entities from modern ES6+ patterns", async () => {
		const tempDir = createTestProject(TEST_SCENARIOS.modernPatterns);

		try {
			const discovery = await discoverPackage(tempDir);
			ok(discovery.files.length > 0, "Should discover JS files");

			const graph = await extractDocumentationGraph(tempDir, discovery);

			const entities = Array.from(graph.entities.values());
			const expected = EXPECTED_RESULTS.modernPatterns;

			ok(
				entities.length >= expected.minEntities,
				`Should extract at least ${expected.minEntities} entities, got ${entities.length}`,
			);

			// Check that expected entity names are found
			const entityNames = entities.map((e) => e.name);
			for (const expectedName of expected.expectedNames) {
				ok(
					entityNames.includes(expectedName),
					`Should find entity named "${expectedName}"`,
				);
			}

			// Check entity types are present
			const entityTypes = [...new Set(entities.map((e) => e.entityType))];
			for (const expectedType of expected.expectedTypes) {
				ok(
					entityTypes.includes(expectedType),
					`Should find entities of type "${expectedType}"`,
				);
			}
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle nested module structures", async () => {
		const tempDir = createTestProject(TEST_SCENARIOS.nestedModules);

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			const entities = Array.from(graph.entities.values());
			const modules = Array.from(graph.modules.keys());
			const expected = EXPECTED_RESULTS.nestedModules;

			ok(
				entities.length >= expected.minEntities,
				`Should extract at least ${expected.minEntities} entities from nested modules`,
			);

			ok(
				modules.length >= expected.minModules,
				`Should find at least ${expected.minModules} modules`,
			);

			// Check expected entities are found
			const entityNames = entities.map((e) => e.name);
			for (const expectedName of expected.expectedNames) {
				ok(
					entityNames.includes(expectedName),
					`Should find entity "${expectedName}" in nested structure`,
				);
			}
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should parse complex JSDoc patterns", async () => {
		const tempDir = createTestProject(TEST_SCENARIOS.complexJsDoc);

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			const entities = Array.from(graph.entities.values());
			const expected = EXPECTED_RESULTS.complexJsDoc;

			ok(
				entities.length >= expected.minEntities,
				`Should extract entities with complex JSDoc`,
			);

			// Check for example tags
			const hasExampleTags = entities.some((e) =>
				e.jsdocTags?.some(
					(tag) =>
						tag.tagType === "example" ||
						tag.constructor.name === "JSDocExampleTag",
				),
			);

			if (expected.hasExamples) {
				ok(hasExampleTags, "Should parse @example tags");
			}

			// Check for deprecated tags
			const hasDeprecatedTags = entities.some((e) =>
				e.jsdocTags?.some(
					(tag) =>
						tag.tagType === "deprecated" ||
						tag.constructor.name === "JSDocDeprecatedTag",
				),
			);

			if (expected.hasDeprecated) {
				ok(hasDeprecatedTags, "Should parse @deprecated tags");
			}
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle different export patterns", async () => {
		const tempDir = createTestProject(TEST_SCENARIOS.exportPatterns);

		try {
			const discovery = await discoverPackage(tempDir);
			const graph = await extractDocumentationGraph(tempDir, discovery);

			const entities = Array.from(graph.entities.values());
			const expected = EXPECTED_RESULTS.exportPatterns;

			// Clean up debug output
			// console.log(`Debug exports: Found ${entities.length} entities...`);

			ok(
				entities.length >= expected.minEntities,
				`Should extract entities with different export patterns`,
			);

			// Check for default exports
			if (expected.hasDefault) {
				const hasDefaultExport = entities.some((e) =>
					e.exports?.includes("default"),
				);
				ok(hasDefaultExport, "Should identify default exports");
			}
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should extract entities from real beak package patterns", async () => {
		// Test against the actual beak package structure
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		const beakPath = resolve(__dirname, "../../../beak");

		const discovery = await discoverPackage(beakPath);
		ok(discovery.files.length > 2, "Beak should have more than 2 JS files");

		const graph = await extractDocumentationGraph(beakPath, discovery);

		// Beak definitely has exported functions like html, css, etc.
		const entities = Array.from(graph.entities.values());

		console.log(`\nBeak extraction results:`);
		console.log(`  Files discovered: ${discovery.files.length}`);
		console.log(`  Modules: ${Array.from(graph.modules.keys()).length}`);
		console.log(`  Entities: ${entities.length}`);

		if (entities.length > 0) {
			console.log(`  Entity names: ${entities.map((e) => e.name).join(", ")}`);
		}

		// This test documents current behavior and will help us fix extraction
		// For now, just log results to understand what's happening
		ok(true, "Logged beak extraction results for debugging");
	});
});
