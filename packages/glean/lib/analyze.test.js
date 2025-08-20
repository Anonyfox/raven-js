/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for analysis module - JSDoc validation and quality assessment.
 *
 * Comprehensive tests for the analyze command functionality including
 * documentation quality scoring, validation reporting, and CLI integration.
 */

import { strict as assert } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runAnalyzeCommand } from "./analyze.js";

test("runAnalyzeCommand handles empty directories", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Test with empty directory - should not throw
		await assert.doesNotReject(async () => {
			await runAnalyzeCommand([tempDir]);
		});
	} finally {
		await rm(tempDir, { recursive: true });
	}
});

test("runAnalyzeCommand analyzes JavaScript files", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Create test files
		const testFile = join(tempDir, "test.js");
		await writeFile(
			testFile,
			`
/**
 * Well documented function
 * @param {string} input - Input parameter
 * @returns {string} Processed output
 */
export function goodFunc(input) {
	return input.toUpperCase();
}

function undocumented() {
	return "no docs";
}
		`,
		);

		// Test basic analyze command
		await assert.doesNotReject(async () => {
			await runAnalyzeCommand([tempDir]);
		});

		// Test verbose mode
		await assert.doesNotReject(async () => {
			await runAnalyzeCommand([tempDir, "--verbose"]);
		});

		// Test with -v flag
		await assert.doesNotReject(async () => {
			await runAnalyzeCommand(["-v", tempDir]);
		});
	} finally {
		await rm(tempDir, { recursive: true });
	}
});

test("runAnalyzeCommand handles analysis errors gracefully", async () => {
	// Test with inaccessible path - should throw informative error
	await assert.rejects(async () => {
		await runAnalyzeCommand(["/nonexistent/deeply/nested/path"]);
	}, /Analysis failed/);
});

test("runAnalyzeCommand defaults to current directory", async () => {
	// Test without arguments - should default to current directory
	await assert.doesNotReject(async () => {
		await runAnalyzeCommand([]);
	});
});

test("runAnalyzeCommand handles verbose flag variations", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Create a simple test file
		const testFile = join(tempDir, "simple.js");
		await writeFile(testFile, "export const test = 'value';");

		// Test --verbose flag
		await assert.doesNotReject(async () => {
			await runAnalyzeCommand([tempDir, "--verbose"]);
		});

		// Test -v flag
		await assert.doesNotReject(async () => {
			await runAnalyzeCommand([tempDir, "-v"]);
		});

		// Test flag order independence
		await assert.doesNotReject(async () => {
			await runAnalyzeCommand(["--verbose", tempDir]);
		});
	} finally {
		await rm(tempDir, { recursive: true });
	}
});

test("runAnalyzeCommand processes complex codebase", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Create multiple test files with different documentation quality
		const files = [
			{
				name: "well-documented.js",
				content: `
/**
 * A well-documented utility function
 * @param {string} input - The input string
 * @param {boolean} uppercase - Whether to convert to uppercase
 * @returns {string} The processed string
 */
export function processString(input, uppercase = false) {
	return uppercase ? input.toUpperCase() : input.toLowerCase();
}

/**
 * A documented class
 */
export class DocumentedClass {
	/**
	 * Constructor
	 * @param {string} name - The name
	 */
	constructor(name) {
		this.name = name;
	}
}
				`,
			},
			{
				name: "partially-documented.js",
				content: `
/**
 * This function has some documentation
 */
export function someFunction(param1, param2) {
	return param1 + param2;
}

// This function has no JSDoc
export function undocumentedFunction() {
	return "result";
}
				`,
			},
			{
				name: "minimal.js",
				content: `
export const CONSTANT = "value";
export function basicFunction() {
	return true;
}
				`,
			},
		];

		for (const file of files) {
			await writeFile(join(tempDir, file.name), file.content);
		}

		// Test analysis of complex codebase
		await assert.doesNotReject(async () => {
			await runAnalyzeCommand([tempDir, "--verbose"]);
		});
	} finally {
		await rm(tempDir, { recursive: true });
	}
});
