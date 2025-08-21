/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 *
 * Validates that a JavaScript file has an accompanying test file
 */
export const HasValidTestFile = (/** @type {string} */ filePath) => {
	if (typeof filePath !== "string" || filePath === "") {
		throw new Error("File path must be a non-empty string");
	}

	// Get the directory and filename
	const fileDir = dirname(filePath);
	const fileName = filePath.split("/").pop() || "";

	// Generate expected test file path
	const testFileName = fileName.replace(/\.js$/, ".test.js");
	const testFilePath = join(fileDir, testFileName);

	if (!existsSync(testFilePath)) {
		throw new Error(`Missing test file: expected ${testFilePath}`);
	}

	return true;
};

/**
 * Check if a file path represents a JavaScript file that should have a test file
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if file is a .js file that should have a corresponding .test.js file
 */
export const shouldHaveTestFile = (filePath) => {
	// Skip test files themselves
	if (!filePath.endsWith(".js") || filePath.endsWith(".test.js")) {
		return false;
	}

	// Skip files in bin folders (CLI tools don't need tests)
	if (filePath.includes("/bin/") || filePath.startsWith("bin/")) {
		return false;
	}

	// Skip files in static folders (third-party assets don't need tests)
	if (filePath.includes("/static/") || filePath.startsWith("static/")) {
		return false;
	}

	return true;
};
