/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { readFileSync } from "node:fs";

/**
 *
 * Validates that a JavaScript file has a proper JSDoc header with required metadata
 */
export const HasValidJSDocHeaders = (/** @type {string} */ filePath) => {
	if (typeof filePath !== "string" || filePath === "") {
		throw new Error("File path must be a non-empty string");
	}

	try {
		const fileContent = readFileSync(filePath, "utf8");
		const validationResult = validateJSDocHeader(fileContent, filePath);

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
 * @param {string} filePath - The file path to determine validation rules
 * @returns {{isValid: boolean, errors: string[]}} Validation result
 */
function validateJSDocHeader(content, filePath) {
	// All non-test JS files should use the new two-block format
	return validateTwoBlockFormat(content, filePath);
}

/**
 * Validates the new two-block format for all JS files
 * @param {string} content - The file content
 * @returns {{isValid: boolean, errors: string[]}} Validation result
 */
function validateTwoBlockFormat(
	/** @type {string} */ content,
	/** @type {string} */ _filePath,
) {
	const errors = [];

	// Extract all JSDoc comment blocks
	const jsdocBlocks = content.match(/\/\*\*\s*([\s\S]*?)\*\//g);

	if (!jsdocBlocks || jsdocBlocks.length < 2) {
		return {
			isValid: false,
			errors: [
				"Files must have exactly two JSDoc blocks: metadata block first, then documentation block",
			],
		};
	}

	// First block: metadata (@author, @license, @see)
	const firstBlockContent = jsdocBlocks[0].replace(/^\/\*\*\s*|\s*\*\/$/g, "");
	const firstBlockTags = parseJSDocTags(firstBlockContent);

	// Validate required metadata in first block
	const requiredMetadataChecks = [
		{
			tag: "@author",
			validate: /** @param {string[]} values */ (values) =>
				values.some((v) => v.includes("Anonyfox <max@anonyfox.com>")),
			errorMessage:
				"First JSDoc block missing required @author Anonyfox <max@anonyfox.com>",
		},
		{
			tag: "@license",
			validate: /** @param {string[]} values */ (values) =>
				values.some((v) => v.trim() === "MIT"),
			errorMessage:
				"First JSDoc block missing or incorrect @license (must be 'MIT')",
		},
		{
			tag: "@see",
			validate: /** @param {string[]} values */ (values) => {
				const requiredLinks = [
					"https://github.com/Anonyfox/ravenjs",
					"https://ravenjs.dev",
					"https://anonyfox.com",
				];
				return requiredLinks.every((link) =>
					values.some((v) => v.includes(link)),
				);
			},
			errorMessage:
				"First JSDoc block missing required @see links: https://github.com/Anonyfox/ravenjs, https://ravenjs.dev, https://anonyfox.com",
		},
	];

	for (const check of requiredMetadataChecks) {
		const tagValues = firstBlockTags[check.tag] || [];
		if (!check.validate(tagValues)) {
			errors.push(check.errorMessage);
		}
	}

	// First block should only contain metadata (no documentation tags)

	const secondBlockContent = jsdocBlocks[1].replace(/^\/\*\*\s*|\s*\*\/$/g, "");
	const secondBlockTags = parseJSDocTags(secondBlockContent);

	// Second block should NOT contain metadata tags (enforce clean separation)
	const metadataTags = ["@author", "@license", "@see"];
	for (const tag of metadataTags) {
		if (secondBlockTags[tag]) {
			errors.push(
				`Second JSDoc block should not contain ${tag} - metadata belongs in first block`,
			);
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
