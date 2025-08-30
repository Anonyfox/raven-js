/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Validates package.json files field has proper patterns
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Canonical files field patterns that all packages must include
 * @type {string[]}
 */
const CANONICAL_FILES_PATTERNS = [
	"**/*.js",
	"*.d.ts",
	"types.*.d.ts",
	"**/README.md",
	"LICENSE",
	"media/**/*",
	"static/**/*",
	"!**/*.test.js",
];

/**
 * @typedef {Object} PackageJsonData
 * @property {string[]} [files] - Files field array
 */

/**
 * Validates that package.json has proper files field with canonical patterns
 * @param {string} packagePath - Path to the package directory
 * @throws {Error} If package.json is missing, invalid, or files field is improper
 */
export function HasProperFilesField(packagePath) {
	if (!packagePath || typeof packagePath !== "string") {
		throw new Error("Package path must be a non-empty string");
	}

	const packageJsonPath = join(packagePath, "package.json");

	if (!existsSync(packageJsonPath)) {
		throw new Error(`package.json not found at: ${packageJsonPath}`);
	}

	let packageData;
	try {
		const content = readFileSync(packageJsonPath, "utf-8");
		packageData = JSON.parse(content);
	} catch (error) {
		throw new Error(`Failed to parse package.json: ${error.message}`);
	}

	// Skip validation for private packages (like nest itself)
	if (packageData.private === true) {
		return;
	}

	// Check if files field exists
	if (!packageData.files || !Array.isArray(packageData.files)) {
		throw new Error("Missing or invalid files field (must be an array)");
	}

	// Validate canonical patterns are present
	const violations = validateFilesField(packageData.files, packagePath);

	if (violations.length > 0) {
		throw new Error(
			`package.json files field violations:\n${violations.join("\n")}`,
		);
	}
}

/**
 * Validates files field against canonical patterns
 * @param {string[]} actualFiles - Actual files patterns from package.json
 * @param {string} _packagePath - Package path (unused but kept for consistency)
 * @returns {string[]} Array of violation messages
 */
function validateFilesField(actualFiles, _packagePath) {
	const violations = [];

	// Check that all canonical patterns are present
	if (!arrayContainsAll(actualFiles, CANONICAL_FILES_PATTERNS)) {
		const missingPatterns = CANONICAL_FILES_PATTERNS.filter(
			(pattern) => !actualFiles.includes(pattern),
		);
		violations.push(
			`  files: missing required patterns ${JSON.stringify(missingPatterns)}`,
		);
	}

	return violations;
}

/**
 * Helper function to check if array contains all required items
 * @param {string[]} actual - Actual array
 * @param {string[]} required - Required items that must be present
 * @returns {boolean} True if actual contains all required items
 */
function arrayContainsAll(actual, required) {
	return required.every((item) => actual.includes(item));
}
