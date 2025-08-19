/**
 * @file Validates that a JavaScript file has proper JSDoc headers with required metadata
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { readFileSync } from "node:fs";

/**
 * Validates that a JavaScript file has a proper JSDoc header with required metadata
 * @param {string} filePath - The path to the JavaScript file
 * @returns {boolean} True if the file has valid JSDoc headers, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidJSDocHeaders = (filePath) => {
	if (typeof filePath !== "string" || filePath === "") {
		throw new Error("File path must be a non-empty string");
	}

	try {
		const fileContent = readFileSync(filePath, "utf8");
		const validationResult = validateJSDocHeader(fileContent);

		if (!validationResult.isValid) {
			throw new Error(
				`Invalid JSDoc header: ${validationResult.errors.join(", ")}`,
			);
		}

		return true;
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.startsWith("Invalid JSDoc header:")
		) {
			throw error;
		}
		throw new Error(
			`Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
};

/**
 * Check if a file path represents a JavaScript file that should have a JSDoc header
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if file is a .js file that should have a JSDoc header
 */
export const shouldHaveJSDocHeader = (filePath) => {
	// Skip test files themselves
	if (!filePath.endsWith(".js") || filePath.endsWith(".test.js")) {
		return false;
	}

	// Skip files in bin folders (CLI tools may have different header requirements)
	if (filePath.includes("/bin/") || filePath.startsWith("bin/")) {
		return false;
	}

	return true;
};

/**
 * Validates the JSDoc header content of a file
 * @param {string} content - The file content
 * @returns {{isValid: boolean, errors: string[]}} Validation result
 */
function validateJSDocHeader(content) {
	const errors = [];

	// Extract the first JSDoc comment block
	const jsdocMatch = content.match(/^\/\*\*\s*([\s\S]*?)\*\//);

	if (!jsdocMatch) {
		return {
			isValid: false,
			errors: ["Missing JSDoc header comment block at the beginning of file"],
		};
	}

	const jsdocContent = jsdocMatch[1];

	// Required tags and their expected values
	const requiredChecks = [
		{
			tag: "@file",
			required: true,
			validate: /** @param {string[]} values */ (values) =>
				values.length > 0 && values[0].trim().length > 0,
			errorMessage: "Missing or empty @file description",
		},
		{
			tag: "@author",
			required: true,
			validate: /** @param {string[]} values */ (values) =>
				values.some(
					/** @param {string} v */ (v) =>
						v.includes("Anonyfox <max@anonyfox.com>"),
				),
			errorMessage: "Missing required @author Anonyfox <max@anonyfox.com>",
		},
		{
			tag: "@license",
			required: true,
			validate: /** @param {string[]} values */ (values) =>
				values.some(/** @param {string} v */ (v) => v.trim() === "MIT"),
			errorMessage: "Missing or incorrect @license (must be 'MIT')",
		},
		{
			tag: "@see",
			required: true,
			validate: /** @param {string[]} values */ (values) => {
				const requiredLinks = [
					"https://github.com/Anonyfox/ravenjs",
					"https://ravenjs.dev",
					"https://anonyfox.com",
				];
				return requiredLinks.every((link) =>
					values.some(/** @param {string} v */ (v) => v.includes(link)),
				);
			},
			errorMessage:
				"Missing required @see links: https://github.com/Anonyfox/ravenjs, https://ravenjs.dev, https://anonyfox.com",
		},
	];

	// Parse all JSDoc tags
	const tags = parseJSDocTags(jsdocContent);

	// Validate each required check
	for (const check of requiredChecks) {
		const tagValues = tags[check.tag] || [];

		if (check.required && !check.validate(tagValues)) {
			errors.push(check.errorMessage);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Parses JSDoc tags from JSDoc content
 * @param {string} content - The JSDoc content (without comment markers)
 * @returns {Record<string, string[]>} Object mapping tag names to their values
 */
function parseJSDocTags(content) {
	/** @type {Record<string, string[]>} */
	const tags = {};

	// Clean up content by removing asterisks and extra whitespace
	const lines = content.split("\n");
	const cleanLines = lines.map((line) => line.replace(/^\s*\*\s?/, "").trim());

	// Process line by line to extract tags
	let currentTag = null;
	let currentValue = "";

	for (const line of cleanLines) {
		// Check if line starts with @tag
		const tagMatch = line.match(/^@(\w+)\s*(.*)/);

		if (tagMatch) {
			// Save previous tag if exists
			if (currentTag && currentValue.trim()) {
				if (!tags[currentTag]) {
					tags[currentTag] = [];
				}
				tags[currentTag].push(currentValue.trim().replace(/\s+/g, " "));
			}

			// Start new tag
			currentTag = `@${tagMatch[1]}`;
			currentValue = tagMatch[2] || "";
		} else if (currentTag && line.trim()) {
			// Continue current tag value on next line
			currentValue += ` ${line}`;
		}
	}

	// Save the last tag
	if (currentTag && currentValue.trim()) {
		if (!tags[currentTag]) {
			tags[currentTag] = [];
		}
		tags[currentTag].push(currentValue.trim().replace(/\s+/g, " "));
	}

	return tags;
}
