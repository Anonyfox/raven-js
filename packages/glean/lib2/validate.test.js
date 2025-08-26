/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for lib2 validation orchestrator - Predatory precision testing
 */

import { strictEqual, throws } from "node:assert";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { validate } from "./validate.js";

// Test workspace directory
const TEST_DIR = "/tmp/raven-validate-test";

/**
 * Helper to create a test workspace with specified files
 * @param {Object<string, string>} files - Map of relative paths to file contents
 */
function createTestWorkspace(files) {
	// Clean up any existing test directory
	if (existsSync(TEST_DIR)) {
		rmSync(TEST_DIR, { recursive: true, force: true });
	}

	mkdirSync(TEST_DIR, { recursive: true });

	for (const [filePath, content] of Object.entries(files)) {
		const fullPath = join(TEST_DIR, filePath);
		const dir = join(fullPath, "..");
		mkdirSync(dir, { recursive: true });
		writeFileSync(fullPath, content, "utf-8");
	}
}

/**
 * Helper to clean up test workspace
 */
function cleanupTestWorkspace() {
	if (existsSync(TEST_DIR)) {
		rmSync(TEST_DIR, { recursive: true, force: true });
	}
}

describe("core validation functionality", () => {
	test("should validate basic package structure", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				exports: { ".": "./index.js" },
			}),
			"index.js": `
/**
 * Calculate the sum of two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum of a and b
 */
export function add(a, b) {
	return a + b;
}
			`,
		});

		const report = validate(TEST_DIR);

		// Validate basic report structure
		strictEqual(typeof report, "object");
		strictEqual(typeof report.summary, "object");
		strictEqual(Array.isArray(report.files), true);

		// Validate summary properties exist
		strictEqual(typeof report.summary.filesAnalyzed, "number");
		strictEqual(typeof report.summary.totalIssues, "number");
		strictEqual(typeof report.summary.overallScore, "number");
		strictEqual(typeof report.summary.filesWithIssues, "number");

		cleanupTestWorkspace();
	});

	test("should handle empty packages gracefully", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "empty-package",
				// No exports = no modules = no files
			}),
		});

		const report = validate(TEST_DIR);

		strictEqual(report.summary.filesAnalyzed, 0);
		strictEqual(report.summary.totalIssues, 0);
		strictEqual(report.summary.overallScore, 100); // Perfect when no files
		strictEqual(report.summary.filesWithIssues, 0);
		strictEqual(report.files.length, 0);

		cleanupTestWorkspace();
	});

	test("should handle packages with undocumented code", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "undocumented-package",
				exports: { ".": "./index.js" },
			}),
			"index.js": `
export function undocumentedFunction(param1, param2) {
	return param1 + param2;
}

export const undocumentedVariable = "test";
			`,
		});

		const report = validate(TEST_DIR);

		// Should still produce a valid report even with poor documentation
		strictEqual(typeof report, "object");
		strictEqual(typeof report.summary, "object");
		strictEqual(Array.isArray(report.files), true);

		// Summary should be valid
		strictEqual(typeof report.summary.filesAnalyzed, "number");
		strictEqual(typeof report.summary.totalIssues, "number");
		strictEqual(typeof report.summary.overallScore, "number");
		strictEqual(typeof report.summary.filesWithIssues, "number");

		cleanupTestWorkspace();
	});

	test("should handle complex package structures", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "complex-package",
				exports: {
					".": "./index.js",
					"./utils": "./lib/utils.js",
				},
			}),
			"index.js": `
/**
 * Main entry point
 * @param {string} config - Configuration
 * @returns {object} Application instance
 */
export function createApp(config) {
	return { config };
}
			`,
			"lib/utils.js": `
export function undocumentedUtility() {
	return "utility";
}

/**
 * Documented utility function
 * @param {Array} items - Items to process
 * @returns {number} Count of items
 */
export function documentedUtility(items) {
	return items.length;
}
			`,
		});

		const report = validate(TEST_DIR);

		// Should handle multiple files
		strictEqual(typeof report, "object");
		strictEqual(Array.isArray(report.files), true);

		cleanupTestWorkspace();
	});
});

describe("error handling and edge cases", () => {
	test("should throw error for invalid package path", () => {
		throws(
			() => {
				validate("");
			},
			{
				name: "Error",
				message: "validate() requires a valid package path",
			},
		);

		throws(
			() => {
				validate(null);
			},
			{
				name: "Error",
				message: "validate() requires a valid package path",
			},
		);

		throws(
			() => {
				validate(123);
			},
			{
				name: "Error",
				message: "validate() requires a valid package path",
			},
		);
	});

	test("should handle nonexistent directories", () => {
		throws(
			() => {
				validate("/nonexistent/path/that/does/not/exist");
			},
			{
				name: "Error",
			},
		);
	});

	test("should handle directories without package.json", () => {
		createTestWorkspace({
			"index.js": `export const test = "value";`,
		});

		throws(
			() => {
				validate(TEST_DIR);
			},
			{
				name: "Error",
			},
		);

		cleanupTestWorkspace();
	});
});

describe("integration scenarios", () => {
	test("should provide comprehensive validation report structure", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "comprehensive-test",
				exports: { ".": "./index.js" },
			}),
			"index.js": `
/**
 * Mixed quality documentation example
 * @param {string} good - Well documented parameter
 * @param bad - Missing type
 * @returns {boolean} Return type specified
 */
export function mixedQuality(good, bad) {
	return true;
}
			`,
		});

		const report = validate(TEST_DIR);

		// Verify report structure
		strictEqual(typeof report, "object");
		strictEqual(Array.isArray(report.files), true);
		strictEqual(typeof report.summary, "object");

		// Verify summary properties
		strictEqual(typeof report.summary.filesAnalyzed, "number");
		strictEqual(typeof report.summary.totalIssues, "number");
		strictEqual(typeof report.summary.overallScore, "number");
		strictEqual(typeof report.summary.filesWithIssues, "number");

		// Verify score bounds
		strictEqual(report.summary.overallScore >= 0, true);
		strictEqual(report.summary.overallScore <= 100, true);

		// Verify file structures when present
		for (const file of report.files) {
			strictEqual(typeof file.file, "string");
			strictEqual(Array.isArray(file.issues), true);
			strictEqual(typeof file.score, "number");
			strictEqual(file.score >= 0, true);
			strictEqual(file.score <= 100, true);

			// Verify issue structures when present
			for (const issue of file.issues) {
				strictEqual(typeof issue.type, "string");
				strictEqual(typeof issue.message, "string");
				strictEqual(typeof issue.line, "number");
				strictEqual(typeof issue.severity, "string");
				strictEqual(typeof issue.entity, "string");
				strictEqual(typeof issue.file, "string");
			}
		}

		cleanupTestWorkspace();
	});
});
