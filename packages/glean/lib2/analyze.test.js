/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for lib2 analyze CLI replacement - Surgical precision testing
 */

import { strictEqual } from "node:assert";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { describe, test } from "node:test";
import { runAnalyzeCommand } from "./analyze.js";

// Mock console to capture output
let consoleOutput = [];
const originalConsoleLog = console.log;

function mockConsole() {
	consoleOutput = [];
	console.log = (...args) => {
		consoleOutput.push(args.join(" "));
	};
}

function restoreConsole() {
	console.log = originalConsoleLog;
}

// Test workspace directory
const TEST_DIR = "/tmp/raven-analyze-test";

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
		const fullPath = `${TEST_DIR}/${filePath}`;
		const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
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

describe("runAnalyzeCommand functionality", () => {
	test("should handle basic command structure and output format", async () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "test-package",
				exports: { ".": "./index.js" },
			}),
			"index.js": `
/**
 * Well documented function
 * @param {string} input - Input parameter
 * @returns {string} Processed output
 */
export function process(input) {
	return input.toUpperCase();
}
			`,
		});

		mockConsole();

		// Change to test directory and run command
		const originalCwd = process.cwd();
		process.chdir(TEST_DIR);

		try {
			await runAnalyzeCommand([]);

			const output = consoleOutput.join("\n");
			// Basic check that some output was produced
			strictEqual(output.length > 0, true);
			strictEqual(output.includes("📊 Analyzing JSDoc quality"), true);
		} catch (error) {
			console.error("Test failed with error:", error);
			throw error;
		} finally {
			process.chdir(originalCwd);
			restoreConsole();
			cleanupTestWorkspace();
		}
	});

	test("should handle verbose flag", async () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "test-package",
				exports: { ".": "./index.js" },
			}),
			"index.js": `
export function undocumented() {
	return "test";
}
			`,
		});

		mockConsole();

		const originalCwd = process.cwd();
		process.chdir(TEST_DIR);

		try {
			await runAnalyzeCommand(["--verbose"]);

			const output = consoleOutput.join("\n");
			strictEqual(output.length > 0, true);
			strictEqual(output.includes("📊 Analyzing JSDoc quality"), true);
		} catch (error) {
			console.error("Verbose test failed with error:", error);
			throw error;
		} finally {
			process.chdir(originalCwd);
			restoreConsole();
			cleanupTestWorkspace();
		}
	});

	test("should handle -v short flag", async () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "test-package",
				exports: { ".": "./index.js" },
			}),
			"index.js": `export const test = "value";`,
		});

		mockConsole();

		const originalCwd = process.cwd();
		process.chdir(TEST_DIR);

		try {
			await runAnalyzeCommand(["-v"]);

			const output = consoleOutput.join("\n");
			strictEqual(output.includes("📊 Analyzing JSDoc quality in: ."), true);
		} finally {
			process.chdir(originalCwd);
			restoreConsole();
			cleanupTestWorkspace();
		}
	});

	test("should handle custom target directory", async () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "test-package",
				exports: { ".": "./index.js" },
			}),
			"index.js": `export const test = "value";`,
			"src/package.json": JSON.stringify({
				name: "sub-package",
				exports: { ".": "./lib.js" },
			}),
			"src/lib.js": `export const lib = "value";`,
		});

		mockConsole();

		const originalCwd = process.cwd();
		process.chdir(TEST_DIR);

		try {
			await runAnalyzeCommand(["./src"]);

			const output = consoleOutput.join("\n");
			strictEqual(
				output.includes("📊 Analyzing JSDoc quality in: ./src"),
				true,
			);
		} finally {
			process.chdir(originalCwd);
			restoreConsole();
			cleanupTestWorkspace();
		}
	});

	test("should handle no JavaScript files found", async () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "empty-package",
				// No exports = no modules = no files
			}),
		});

		mockConsole();

		const originalCwd = process.cwd();
		process.chdir(TEST_DIR);

		try {
			await runAnalyzeCommand([]);

			const output = consoleOutput.join("\n");
			strictEqual(
				output.includes("⚠️  No JavaScript files found in target directory"),
				true,
			);
		} finally {
			process.chdir(originalCwd);
			restoreConsole();
			cleanupTestWorkspace();
		}
	});

	test("should handle error conditions gracefully", async () => {
		// Test with a path that definitely doesn't exist
		let errorThrown = false;

		try {
			await runAnalyzeCommand([
				"/path/that/definitely/does/not/exist/anywhere",
			]);
		} catch (error) {
			errorThrown = true;
			strictEqual(error.message.includes("Analysis failed"), true);
		}

		strictEqual(errorThrown, true);
	});
});
