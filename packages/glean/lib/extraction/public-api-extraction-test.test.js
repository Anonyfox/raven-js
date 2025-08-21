/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Integration tests for public API extraction rules
 *
 * Tests that documentation extraction follows package.json exports and only
 * includes publicly exported entities, not internal implementation details.
 */

import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import { discoverPackage } from "../discovery/index.js";
import { extractDocumentationGraph } from "./graph-orchestration.js";

/**
 * Senior dev expectations for public API documentation:
 *
 * 1. START FROM PACKAGE.JSON EXPORTS - Only documented modules should be those defined in exports
 * 2. FOLLOW EXPORTS ONLY - Only entities actually exported should appear in docs
 * 3. HIDE INTERNALS - Helper functions, utilities, internal parsers should be hidden
 * 4. LOGICAL GROUPING - Sub-modules should be part of parent modules, not separate
 * 5. CLEAN API SURFACE - Documentation should match what developers actually import
 */

describe("Public API Extraction Rules", () => {
	/**
	 * Test scenario: Simple package with main entry point
	 * Expected: Only 1 module, only exported entities
	 */
	it("should extract only from package.json entry points - simple scenario", async () => {
		const testDir = join(process.cwd(), "test-temp-simple");

		try {
			await rm(testDir, { recursive: true, force: true });
			await mkdir(testDir, { recursive: true });

			// Package.json with single entry point
			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify(
					{
						name: "test-simple",
						version: "1.0.0",
						type: "module",
						exports: {
							".": {
								import: "./index.js",
							},
						},
					},
					null,
					2,
				),
			);

			// Main entry point - only exports 2 functions
			await writeFile(
				join(testDir, "index.js"),
				`
/**
 * Main entry point for test package
 */

export { createThing } from "./lib/creator.js";
export { processThing } from "./lib/processor.js";
`,
			);

			// Internal module 1 - has exported + internal functions
			await mkdir(join(testDir, "lib"), { recursive: true });
			await writeFile(
				join(testDir, "lib", "creator.js"),
				`
/**
 * Creates things
 */

/**
 * Public API function - should appear in docs
 * @param {string} name The name
 * @returns {object} The thing
 */
export function createThing(name) {
	return { name: normalize(name) };
}

/**
 * Internal helper - should NOT appear in docs
 * @param {string} str Input string
 * @returns {string} Normalized string
 */
function normalize(str) {
	return str.trim().toLowerCase();
}

/**
 * Another internal helper - should NOT appear in docs
 */
const DEFAULTS = { type: "generic" };
`,
			);

			// Internal module 2 - has exported + internal functions
			await writeFile(
				join(testDir, "lib", "processor.js"),
				`
/**
 * Processes things
 */

/**
 * Public API function - should appear in docs
 * @param {object} thing The thing to process
 * @returns {object} Processed thing
 */
export function processThing(thing) {
	return enhance(thing);
}

/**
 * Internal helper - should NOT appear in docs
 */
function enhance(thing) {
	return { ...thing, processed: true };
}
`,
			);

			// Extract documentation graph
			const discovery = await discoverPackage(testDir);
			const graph = await extractDocumentationGraph(testDir, discovery);

			// ASSERTION 1: Only 1 module (the entry point)
			const modules = Array.from(graph.modules.values());
			strictEqual(
				modules.length,
				1,
				`Expected 1 module, got ${modules.length}: ${modules.map((m) => m.getId()).join(", ")}`,
			);

			const mainModule = modules[0];
			strictEqual(
				mainModule.getId(),
				"index",
				"Main module should have ID 'index'",
			);

			// ASSERTION 2: Only 2 entities (the exported functions)
			const entities = Array.from(graph.entities.values());
			strictEqual(
				entities.length,
				2,
				`Expected 2 entities, got ${entities.length}: ${entities.map((e) => e.name).join(", ")}`,
			);

			// ASSERTION 3: Entities should be the exported functions
			const entityNames = entities.map((e) => e.name).sort();
			deepStrictEqual(
				entityNames,
				["createThing", "processThing"],
				"Should only include exported functions",
			);

			// ASSERTION 4: Internal functions should NOT be present
			const hasNormalize = entities.some((e) => e.name === "normalize");
			const hasEnhance = entities.some((e) => e.name === "enhance");
			const hasDEFAULTS = entities.some((e) => e.name === "DEFAULTS");

			ok(!hasNormalize, "Internal function 'normalize' should not be in docs");
			ok(!hasEnhance, "Internal function 'enhance' should not be in docs");
			ok(!hasDEFAULTS, "Internal constant 'DEFAULTS' should not be in docs");
		} finally {
			await rm(testDir, { recursive: true, force: true });
		}
	});

	/**
	 * Test scenario: Package with multiple exports (like beak)
	 * Expected: Only modules defined in exports, only their public APIs
	 */
	it("should extract only from package.json multiple entry points", async () => {
		const testDir = join(process.cwd(), "test-temp-multi");

		try {
			await rm(testDir, { recursive: true, force: true });
			await mkdir(testDir, { recursive: true });

			// Package.json with multiple entry points (like beak)
			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify(
					{
						name: "test-multi",
						version: "1.0.0",
						type: "module",
						exports: {
							".": {
								import: "./core/index.js",
							},
							"./tools": {
								import: "./tools/index.js",
							},
						},
					},
					null,
					2,
				),
			);

			// Core entry point
			await mkdir(join(testDir, "core"), { recursive: true });
			await writeFile(
				join(testDir, "core", "index.js"),
				`
/**
 * Core functionality
 */
export { render } from "./renderer.js";
export { parse } from "./parser.js";
`,
			);

			// Tools entry point
			await mkdir(join(testDir, "tools"), { recursive: true });
			await writeFile(
				join(testDir, "tools", "index.js"),
				`
/**
 * Tools functionality
 */
export { validate } from "./validator.js";
export { transform } from "./transformer.js";
`,
			);

			// Core implementation files
			await writeFile(
				join(testDir, "core", "renderer.js"),
				`
/**
 * @param {string} input Input to render
 * @returns {string} Rendered output
 */
export function render(input) {
	return sanitize(input);
}

// Internal helper - should not appear in docs
function sanitize(str) {
	return str.replace(/[<>]/g, '');
}
`,
			);

			await writeFile(
				join(testDir, "core", "parser.js"),
				`
/**
 * @param {string} code Code to parse
 * @returns {object} Parsed AST
 */
export function parse(code) {
	return tokenize(code);
}

// Internal helper - should not appear in docs
function tokenize(code) {
	return { tokens: code.split(' ') };
}
`,
			);

			// Tools implementation files
			await writeFile(
				join(testDir, "tools", "validator.js"),
				`
/**
 * @param {object} data Data to validate
 * @returns {boolean} Is valid
 */
export function validate(data) {
	return checkRules(data);
}

// Internal helper
function checkRules(data) {
	return data && typeof data === 'object';
}
`,
			);

			await writeFile(
				join(testDir, "tools", "transformer.js"),
				`
/**
 * @param {object} input Input to transform
 * @returns {object} Transformed output
 */
export function transform(input) {
	return applyRules(input);
}

// Internal helper
function applyRules(input) {
	return { ...input, transformed: true };
}
`,
			);

			// Some completely internal module that should be ignored
			await mkdir(join(testDir, "internal"), { recursive: true });
			await writeFile(
				join(testDir, "internal", "helpers.js"),
				`
// This entire module should be ignored since it's not in exports
export function internalHelper() {
	return "should not appear";
}

export const INTERNAL_CONSTANT = "should not appear";
`,
			);

			// Extract documentation graph
			const discovery = await discoverPackage(testDir);
			const graph = await extractDocumentationGraph(testDir, discovery);

			// ASSERTION 1: Only 2 modules (the entry points)
			const modules = Array.from(graph.modules.values());
			strictEqual(
				modules.length,
				2,
				`Expected 2 modules, got ${modules.length}: ${modules.map((m) => m.getId()).join(", ")}`,
			);

			const moduleIds = modules.map((m) => m.getId()).sort();
			deepStrictEqual(
				moduleIds,
				["core-index", "tools-index"],
				"Should have modules for both entry points",
			);

			// ASSERTION 2: Only 4 entities (the exported functions)
			const entities = Array.from(graph.entities.values());
			strictEqual(
				entities.length,
				4,
				`Expected 4 entities, got ${entities.length}: ${entities.map((e) => e.name).join(", ")}`,
			);

			// ASSERTION 3: Entities should be the exported functions
			const entityNames = entities.map((e) => e.name).sort();
			deepStrictEqual(
				entityNames,
				["parse", "render", "transform", "validate"],
				"Should only include exported functions",
			);

			// ASSERTION 4: Internal functions should NOT be present
			const internalNames = [
				"sanitize",
				"tokenize",
				"checkRules",
				"applyRules",
				"internalHelper",
				"INTERNAL_CONSTANT",
			];
			for (const name of internalNames) {
				const hasInternal = entities.some((e) => e.name === name);
				ok(
					!hasInternal,
					`Internal function/constant '${name}' should not be in docs`,
				);
			}
		} finally {
			await rm(testDir, { recursive: true, force: true });
		}
	});

	/**
	 * Test scenario: Package with re-exports from submodules
	 * Expected: Re-exported entities should appear under the main module
	 */
	it("should handle re-exports correctly - entities belong to exporting module", async () => {
		const testDir = join(process.cwd(), "test-temp-reexport");

		try {
			await rm(testDir, { recursive: true, force: true });
			await mkdir(testDir, { recursive: true });

			// Package.json with single entry point that re-exports from submodules
			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify(
					{
						name: "test-reexport",
						version: "1.0.0",
						type: "module",
						exports: {
							".": {
								import: "./index.js",
							},
						},
					},
					null,
					2,
				),
			);

			// Main entry point that re-exports from submodules
			await writeFile(
				join(testDir, "index.js"),
				`
/**
 * Main entry - re-exports from submodules
 */
export { createWidget } from "./widgets/creator.js";
export { validateData } from "./validation/validator.js";
export { formatOutput } from "./formatting/formatter.js";
`,
			);

			// Submodule implementations
			await mkdir(join(testDir, "widgets"), { recursive: true });
			await writeFile(
				join(testDir, "widgets", "creator.js"),
				`
/**
 * @param {string} type Widget type
 * @returns {object} Widget
 */
export function createWidget(type) {
	return buildWidget(type);
}

// Internal helper
function buildWidget(type) {
	return { type, id: Math.random() };
}
`,
			);

			await mkdir(join(testDir, "validation"), { recursive: true });
			await writeFile(
				join(testDir, "validation", "validator.js"),
				`
/**
 * @param {any} data Data to validate
 * @returns {boolean} Is valid
 */
export function validateData(data) {
	return runChecks(data);
}

// Internal helper
function runChecks(data) {
	return data !== null && data !== undefined;
}
`,
			);

			await mkdir(join(testDir, "formatting"), { recursive: true });
			await writeFile(
				join(testDir, "formatting", "formatter.js"),
				`
/**
 * @param {any} data Data to format
 * @returns {string} Formatted output
 */
export function formatOutput(data) {
	return applyFormatting(data);
}

// Internal helper
function applyFormatting(data) {
	return JSON.stringify(data, null, 2);
}
`,
			);

			// Extract documentation graph
			const discovery = await discoverPackage(testDir);
			const graph = await extractDocumentationGraph(testDir, discovery);

			// ASSERTION 1: Only 1 module (the main entry point)
			const modules = Array.from(graph.modules.values());
			strictEqual(
				modules.length,
				1,
				`Expected 1 module, got ${modules.length}`,
			);

			const mainModule = modules[0];
			strictEqual(
				mainModule.getId(),
				"index",
				"Main module should have ID 'index'",
			);

			// ASSERTION 2: Only 3 entities (the re-exported functions)
			const entities = Array.from(graph.entities.values());
			strictEqual(
				entities.length,
				3,
				`Expected 3 entities, got ${entities.length}: ${entities.map((e) => e.name).join(", ")}`,
			);

			// ASSERTION 3: All entities should belong to the main module
			for (const entity of entities) {
				strictEqual(
					entity.moduleId,
					"index",
					`Entity '${entity.name}' should belong to main module 'index', not '${entity.moduleId}'`,
				);
			}

			// ASSERTION 4: Entities should be the re-exported functions
			const entityNames = entities.map((e) => e.name).sort();
			deepStrictEqual(
				entityNames,
				["createWidget", "formatOutput", "validateData"],
				"Should only include re-exported functions",
			);
		} finally {
			await rm(testDir, { recursive: true, force: true });
		}
	});
});
