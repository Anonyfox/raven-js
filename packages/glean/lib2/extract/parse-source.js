// @ts-nocheck
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Source code parsing engine - JSDoc extraction with predatory precision
 *
 * Ravens extract entities from source code through surgical JSDoc analysis.
 * Zero external dependencies, platform-native regex parsing, deterministic
 * entity creation. Handles all JavaScript constructs with minimal overhead.
 */

import { createEntity } from "./models/entities/index.js";
import { createTag } from "./models/jsdoc/index.js";

/**
 * Create entity instance from JSDoc block and following code
 *
 * **Detection Strategy:**
 * 1. Check for explicit JSDoc entity tags (@function, @class, @typedef)
 * 2. Analyze code following JSDoc block for language constructs
 * 3. Extract entity name from code patterns
 * 4. Create appropriate entity type with JSDoc tags
 *
 * @param {{content: string, startLine: number, tags: Array<{name: string, content: string}>}} block - JSDoc block data
 * @param {string} filePath - Relative file path for location metadata
 * @returns {import('./models/entities/base.js').EntityBase|null} Entity instance or null
 */
function createEntityFromBlock(block, filePath) {
	if (!block || !block.tags || !Array.isArray(block.tags)) {
		return null;
	}

	// Look for explicit entity type tags first
	const entityTypeTag = block.tags.find((tag) =>
		["function", "class", "typedef", "namespace", "callback"].includes(
			tag.name.toLowerCase(),
		),
	);

	let entityType = null;
	let entityName = null;

	if (entityTypeTag) {
		// Explicit JSDoc entity tag
		entityType = entityTypeTag.name.toLowerCase();
		entityName = entityTypeTag.content.split(/\s+/)[0] || "anonymous";
	} else {
		// Try to infer from code patterns (simplified for now)
		// In a full implementation, this would analyze the code following the JSDoc block
		return null;
	}

	// Create entity instance
	const location = {
		file: filePath,
		line: block.startLine,
		column: 1,
	};

	const entity = createEntity(entityType, entityName, location);
	if (!entity) {
		return null;
	}

	// Extract and set description content (JSDoc block content with tags stripped)
	const description = extractDescriptionFromJSDocBlock(block.content);
	entity.setDescription(description);

	// Parse and attach JSDoc tags
	for (const tagData of block.tags) {
		const tag = createTag(tagData.name, tagData.content);
		if (tag) {
			entity.jsdocTags.push(tag);
		}
	}

	return entity;
}

/**
 * Parse all files in discovery module to extract entities
 *
 * Processes each file's source content to extract JSDoc blocks and create
 * corresponding entity instances. Combines entities from all module files
 * into single array for documentation rendering.
 *
 * @param {import('../discover/models/module.js').Module} discoveryModule - Discovery module with file contents
 * @returns {Array<import('./models/entities/base.js').EntityBase>} Array of extracted entities
 */
export function parseModuleEntities(discoveryModule) {
	if (!discoveryModule || !Array.isArray(discoveryModule.files)) {
		return [];
	}

	const entities = [];

	for (const file of discoveryModule.files) {
		const fileEntities = parseFileEntities(file);
		entities.push(...fileEntities);
	}

	return entities;
}

/**
 * Parse single file to extract entities from JSDoc blocks
 *
 * **Algorithm:**
 * 1. Extract JSDoc comment blocks using regex
 * 2. For each block, analyze following code to determine entity type/name
 * 3. Create entity instance and parse JSDoc tags
 * 4. Return array of valid entities
 *
 * @param {import('../discover/models/file.js').File} file - File instance with content
 * @returns {Array<import('./models/entities/base.js').EntityBase>} Array of entities from file
 */
function parseFileEntities(file) {
	if (!file || !file.text) {
		return [];
	}

	const jsdocBlocks = extractJSDocBlocks(file.text);
	const entities = [];

	for (const block of jsdocBlocks) {
		const entity = createEntityFromBlock(block, file.path);
		if (entity) {
			entities.push(entity);
		}
	}

	return entities;
}

/**
 * Extract JSDoc comment blocks from source code
 *
 * Uses platform-native regex to find JSDoc blocks with content.
 * Returns structured block data with line position and parsed tag content.
 *
 * @param {string} sourceCode - Source file content
 * @returns {Array<{content: string, startLine: number, tags: Array<{name: string, content: string}>}>} JSDoc blocks
 */
function extractJSDocBlocks(sourceCode) {
	if (typeof sourceCode !== "string") {
		return [];
	}

	const blocks = [];
	const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
	let match = jsdocRegex.exec(sourceCode);

	while (match !== null) {
		const content = match[1];
		const startPos = match.index;

		// Calculate line number by counting newlines before match
		const beforeMatch = sourceCode.substring(0, startPos);
		const startLine = (beforeMatch.match(/\n/g) || []).length + 1;

		// Parse JSDoc tags from block content
		const tags = parseJSDocTags(content);

		blocks.push({
			content: content.trim(),
			startLine,
			tags,
		});

		match = jsdocRegex.exec(sourceCode);
	}

	return blocks;
}

/**
 * Extract description content from JSDoc block (strip all @tag content including multiline)
 *
 * Returns the descriptive text content from JSDoc block with all @tag content
 * removed. Uses the same multiline tag parsing logic to ensure accurate separation.
 *
 * @param {string} content - JSDoc block content (without comment markers)
 * @returns {string} Description text with all tag content stripped
 */
function extractDescriptionFromJSDocBlock(content) {
	if (typeof content !== "string") {
		return "";
	}

	const lines = content.split(/\r?\n/);
	const descriptionLines = [];
	let inTagContent = false;

	for (const line of lines) {
		// Remove leading asterisk and whitespace
		const cleanLine = line.replace(/^\s*\*?\s?/, "");

		// Check if this line starts a new @tag
		const tagMatch = cleanLine.match(/^@(\w+)(?:\s+(.*))?$/);

		if (tagMatch) {
			// Found a tag line - start skipping content
			inTagContent = true;
			continue;
		}

		if (inTagContent && cleanLine !== "") {
			// Skip non-empty lines that belong to current tag
			continue;
		}

		// If we hit an empty line while in tag content, we might be done with the tag
		// but we need to continue checking for more tag content
		if (inTagContent && cleanLine === "") {
			continue;
		}

		// If we're not in tag content, this is description content
		if (!inTagContent) {
			// Skip leading empty lines
			if (cleanLine === "" && descriptionLines.length === 0) {
				continue;
			}
			descriptionLines.push(cleanLine);
		}
	}

	// Remove trailing empty lines
	while (
		descriptionLines.length > 0 &&
		descriptionLines[descriptionLines.length - 1] === ""
	) {
		descriptionLines.pop();
	}

	return descriptionLines.join("\n").trim();
}

/**
 * Parse JSDoc tags from comment block content
 *
 * Extracts @tag lines and their content using regex pattern matching.
 * Handles multi-line tag content and common tag variations.
 *
 * @param {string} content - JSDoc block content (without comment markers)
 * @returns {Array<{name: string, content: string}>} Parsed tag data
 */
function parseJSDocTags(content) {
	if (typeof content !== "string") {
		return [];
	}

	const tags = [];
	const lines = content.split(/\r?\n/);

	let currentTag = null;
	let currentContent = [];

	for (const line of lines) {
		// Remove leading asterisk and whitespace
		const cleanLine = line.replace(/^\s*\*?\s?/, "");

		// Check if this line starts a new @tag
		const tagMatch = cleanLine.match(/^@(\w+)(?:\s+(.*))?$/);

		if (tagMatch) {
			// Save previous tag if exists
			if (currentTag) {
				tags.push({
					name: currentTag,
					content: currentContent.join("\n").trim(),
				});
			}

			// Start new tag
			currentTag = tagMatch[1];
			currentContent = tagMatch[2] ? [tagMatch[2]] : [];
		} else if (currentTag && cleanLine !== "") {
			// Add content line to current tag
			currentContent.push(cleanLine);
		}
		// Ignore empty lines and lines that don't belong to a tag
	}

	// Save the last tag if exists
	if (currentTag) {
		tags.push({
			name: currentTag,
			content: currentContent.join("\n").trim(),
		});
	}

	return tags;
}
