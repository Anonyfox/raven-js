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
 * @param {{content: string, startLine: number, tags: Array<{name: string, content: string}>, followingCode?: string}} block - JSDoc block data
 * @param {string} filePath - Relative file path for location metadata
 * @param {string} fileContent - Complete file content for export checking
 * @param {boolean} enforceExports - Whether to enforce export checking (default: true)
 * @returns {import('./models/entities/base.js').EntityBase|Array<import('./models/entities/base.js').EntityBase>|null} Entity instance, array of entities (for re-exports), or null
 */
function createEntityFromBlock(
	block,
	filePath,
	fileContent = "",
	enforceExports = true,
) {
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

		// Special handling for @typedef tags which have format: @typedef {Type} Name
		if (entityType === "typedef") {
			entityName = extractTypedefName(entityTypeTag.content);
		} else {
			entityName = entityTypeTag.content.split(/\s+/)[0] || "anonymous";
		}

		// For @callback and @typedef, check if they're explicitly exported (if enforcing exports)
		if (
			enforceExports &&
			(entityType === "callback" || entityType === "typedef")
		) {
			if (!isTypedefOrCallbackExported(entityName, fileContent)) {
				// Not exported - don't create entity
				return null;
			}
		}
		// For other entity types, we must verify the entity is exported (if enforcing exports)
		else if (enforceExports && block.followingCode) {
			const codeAnalysis = analyzeFollowingCode(block.followingCode);
			if (!codeAnalysis) {
				// Not exported - don't create entity
				return null;
			}
		}
	} else if (block.followingCode) {
		// Analyze code following JSDoc to infer entity type and name
		const codeAnalysis = analyzeFollowingCode(block.followingCode);
		if (codeAnalysis) {
			if (codeAnalysis.type === "reexport") {
				// Handle re-exports: create multiple entities for each exported name
				return createReexportEntities(codeAnalysis, block, filePath);
			} else {
				entityType = codeAnalysis.type;
				entityName = codeAnalysis.name;
			}
		} else {
			return null;
		}
	} else {
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

		// Extract cross-references from @see tags
		if (tagData.name.toLowerCase() === "see") {
			const linkMatches = tagData.content.match(/{@link\s+(\w+)}/g);
			if (linkMatches) {
				for (const linkMatch of linkMatches) {
					const entityName = linkMatch.match(/{@link\s+(\w+)}/)?.[1];
					if (entityName) {
						entity.addCrossReference(entityName, "see", tagData.content);
					}
				}
			}
		}
	}

	// Set the source code if available and extract function call references
	if (block.followingCode) {
		entity.setSource(block.followingCode);

		// Extract cross-references from function calls in the source code
		const functionCallMatches = block.followingCode.match(/\b(\w+)\s*\(/g);
		if (functionCallMatches) {
			for (const callMatch of functionCallMatches) {
				const functionName = callMatch.replace(/\s*\($/, "");
				// Skip common keywords and the entity's own name
				if (
					functionName !== entity.name &&
					![
						"if",
						"for",
						"while",
						"switch",
						"try",
						"catch",
						"function",
						"return",
						"throw",
						"new",
						"typeof",
						"instanceof",
					].includes(functionName)
				) {
					entity.addCrossReference(
						functionName,
						"calls",
						"Function call in code",
					);
				}
			}
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
		const result = parseFileEntities(file);
		entities.push(...result.entities);
		// Note: reexports are handled separately in parseModuleReexports
	}

	return entities;
}

/**
 * Parse module re-exports separately
 * @param {import('../discover/models/module.js').Module} discoveryModule - Discovery module with file contents
 * @returns {Array<Object>} Array of re-export references
 */
export function parseModuleReexports(discoveryModule) {
	if (!discoveryModule || !Array.isArray(discoveryModule.files)) {
		return [];
	}

	const reexports = [];

	for (const file of discoveryModule.files) {
		const result = parseFileEntities(file);
		reexports.push(...result.reexports);
	}

	return reexports;
}

/**
 * Extract module description from @file JSDoc tags across all files in module
 *
 * Searches all files in the module for @file JSDoc tags and returns the first
 * description found. Gives preference to the main module file if multiple @file
 * tags exist.
 *
 * @param {import('../discover/models/module.js').Module} discoveryModule - Discovery module with file contents
 * @returns {string} Module description from @file tag, or empty string
 */
export function parseModuleDescription(discoveryModule) {
	if (!discoveryModule || !Array.isArray(discoveryModule.files)) {
		return "";
	}

	// Look for @file descriptions in all files, preferring main files
	const descriptions = [];

	for (const file of discoveryModule.files) {
		const fileDescription = parseFileDescription(file);
		if (fileDescription) {
			// Prefer main/index files for module description
			const isMainFile =
				file.path.includes("index.") ||
				file.path === `${discoveryModule.importPath}.js`;
			descriptions.push({ description: fileDescription, isMain: isMainFile });
		}
	}

	// Return first main file description, or first description found
	const mainDescription = descriptions.find((d) => d.isMain);
	const firstDescription = descriptions[0];

	return (mainDescription || firstDescription)?.description || "";
}

/**
 * Extract @file description from a single file's JSDoc blocks
 *
 * @param {import('../discover/models/file.js').File} file - File instance with content
 * @returns {string} File description from @file tag, or empty string
 */
function parseFileDescription(file) {
	if (!file || !file.text) {
		return "";
	}

	const jsdocBlocks = extractJSDocBlocks(file.text);

	for (const block of jsdocBlocks) {
		// Look for @file tag in this block
		const fileTag = block.tags.find((tag) => tag.name.toLowerCase() === "file");
		if (fileTag?.content) {
			// Return the content of the @file tag as the description
			return fileTag.content.trim();
		}
	}

	return "";
}

/**
 * Create re-export references for statements
 *
 * Handles `export { name1, name2 } from './module'` statements by creating
 * reference objects that link to original entities instead of duplicating them.
 *
 * @param {Object} codeAnalysis - Re-export analysis result
 * @param {Object} block - JSDoc block data
 * @param {string} filePath - Current file path
 * @returns {Array<Object>} Array of re-export reference objects
 */
function createReexportEntities(codeAnalysis, block, filePath) {
	const reexportRefs = [];
	const { exportedNames, sourceModule } = codeAnalysis;

	for (const exportedName of exportedNames) {
		// Create re-export reference instead of duplicate entity
		const reexportRef = {
			type: "reexport",
			name: exportedName,
			originalName: exportedName,
			sourceModule: sourceModule,
			location: {
				file: filePath,
				line: block.startLine,
				column: 1,
			},
			// JSDoc from the re-export statement (usually minimal)
			description: extractDescriptionFromJSDocBlock(block.content),
			jsdocTags: block.tags
				.map((tagData) => {
					const tag = createTag(tagData.name, tagData.content);
					return tag;
				})
				.filter((tag) => tag !== null),
		};

		reexportRefs.push(reexportRef);
	}

	return reexportRefs;
}

/**
 * Check if a typedef or callback entity is explicitly exported
 * @param {string} entityName - Name of the entity to check
 * @param {string} fileContent - Complete file content to search
 * @returns {boolean} True if the entity is explicitly exported
 */
function isTypedefOrCallbackExported(entityName, fileContent) {
	// Check for various export patterns:
	// export { EntityName }
	// export { EntityName as SomeName }
	// export { EntityName } from './somewhere'
	const namedExportPattern = new RegExp(
		`export\\s*\\{[^}]*\\b${entityName}\\b[^}]*\\}`,
		"g",
	);
	if (namedExportPattern.test(fileContent)) {
		return true;
	}

	// Check for: export default EntityName
	const defaultExportPattern = new RegExp(
		`export\\s+default\\s+${entityName}\\b`,
		"g",
	);
	if (defaultExportPattern.test(fileContent)) {
		return true;
	}

	// Check for: export EntityName (less common but possible)
	const directExportPattern = new RegExp(`export\\s+${entityName}\\b`, "g");
	if (directExportPattern.test(fileContent)) {
		return true;
	}

	// Check for: export const EntityName = ... or export let EntityName = ... or export var EntityName = ...
	// This handles cases where typedef is followed by an export assignment
	const exportAssignmentPattern = new RegExp(
		`export\\s+(const|let|var)\\s+${entityName}\\b`,
		"g",
	);
	if (exportAssignmentPattern.test(fileContent)) {
		return true;
	}

	return false;
}

/**
 * Extract type names referenced in JSDoc tags of an entity
 * @param {import('./models/entities/base.js').EntityBase} entity - Entity to analyze
 * @returns {Set<string>} Set of referenced type names
 */
function extractReferencedTypes(entity) {
	const referencedTypes = new Set();

	if (!entity.jsdocTags) return referencedTypes;

	for (const tag of entity.jsdocTags) {
		if (
			tag.tagType === "param" ||
			tag.tagType === "returns" ||
			tag.tagType === "throws"
		) {
			// Extract type from JSDoc content like "{UserConfig}" or "{Array<UserConfig>}"
			const typeMatches = tag.rawContent.match(/\{([^}]+)\}/g);
			if (typeMatches) {
				for (const match of typeMatches) {
					// Remove braces and extract type names, handling generics and unions
					const typeContent = match.slice(1, -1);
					// Split on | for union types, < > for generics, , for multiple types
					const typeNames = typeContent.split(/[|<>,\s]+/).filter(
						(name) =>
							name &&
							name.length > 0 &&
							// Exclude primitive types and common patterns
							![
								"string",
								"number",
								"boolean",
								"object",
								"function",
								"Array",
								"Object",
								"Promise",
								"Map",
								"Set",
								"undefined",
								"null",
								"void",
								"*",
								"...",
							].includes(name.toLowerCase()),
					);
					for (const typeName of typeNames) {
						if (typeName.trim()) {
							referencedTypes.add(typeName.trim());
						}
					}
				}
			}
		}
	}

	return referencedTypes;
}

/**
 * Parse single file to extract entities and re-exports from JSDoc blocks
 *
 * **Algorithm:**
 * 1. Extract JSDoc comment blocks using regex
 * 2. First pass: Extract directly exported entities
 * 3. Second pass: Include typedef/callback entities referenced by exported entities
 * 4. Return object with entities and re-exports arrays
 *
 * @param {import('../discover/models/file.js').File} file - File instance with content
 * @returns {{entities: Array<import('./models/entities/base.js').EntityBase>, reexports: Array<Object>}} Entities and re-exports from file
 */
function parseFileEntities(file) {
	if (!file || !file.text) {
		return { entities: [], reexports: [] };
	}

	const jsdocBlocks = extractJSDocBlocks(file.text);
	const entities = [];
	const reexports = [];

	// First pass: Extract directly exported entities (with normal export enforcement)
	for (const block of jsdocBlocks) {
		const result = createEntityFromBlock(block, file.path, file.text, true);
		if (result) {
			// Handle different return types
			if (Array.isArray(result)) {
				// Check if array contains entities or re-exports
				for (const item of result) {
					if (item.type === "reexport") {
						reexports.push(item);
					} else {
						entities.push(item);
					}
				}
			} else if (result.type === "reexport") {
				reexports.push(result);
			} else {
				entities.push(result);
			}
		}
	}

	// Second pass: Check for typedef/callback entities referenced by exported entities
	const allReferencedTypes = new Set();
	for (const entity of entities) {
		const referencedTypes = extractReferencedTypes(entity);
		for (const type of referencedTypes) {
			allReferencedTypes.add(type);
		}
	}

	// Third pass: Add referenced typedef/callback entities that aren't exported but are referenced
	if (allReferencedTypes.size > 0) {
		for (const block of jsdocBlocks) {
			// Skip export enforcement to get all typedef/callback entities
			const result = createEntityFromBlock(block, file.path, file.text, false);
			if (result && !Array.isArray(result) && result.type !== "reexport") {
				if (
					(result.entityType === "typedef" ||
						result.entityType === "callback") &&
					allReferencedTypes.has(result.name) &&
					!entities.find((e) => e.name === result.name)
				) {
					entities.push(result);
				}
			}
		}
	}

	return { entities, reexports };
}

/**
 * Extract JSDoc comment blocks from source code with following code analysis
 *
 * Uses platform-native regex to find JSDoc blocks with content.
 * Returns structured block data with line position, parsed tag content,
 * and the JavaScript code that follows each JSDoc block.
 *
 * @param {string} sourceCode - Source file content
 * @returns {Array<{content: string, startLine: number, tags: Array<{name: string, content: string}>, followingCode: string}>} JSDoc blocks
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
		const endPos = match.index + match[0].length;

		// Calculate line number by counting newlines before match
		const beforeMatch = sourceCode.substring(0, startPos);
		const startLine = (beforeMatch.match(/\n/g) || []).length + 1;

		// Extract the code following this JSDoc block (up to next JSDoc or reasonable limit)
		const afterJSDoc = sourceCode.substring(endPos);
		const followingCode = extractFollowingCode(afterJSDoc);

		// Parse JSDoc tags from block content
		const tags = parseJSDocTags(content);

		blocks.push({
			content: content.trim(),
			startLine,
			tags,
			followingCode,
		});

		match = jsdocRegex.exec(sourceCode);
	}

	return blocks;
}

/**
 * Extract JavaScript code following a JSDoc block
 *
 * Captures the relevant code section that follows a JSDoc comment,
 * stopping at logical boundaries like other JSDoc blocks or export statements.
 *
 * @param {string} codeAfterJSDoc - Source code after JSDoc block
 * @returns {string} Relevant following code (first few meaningful lines)
 */
function extractFollowingCode(codeAfterJSDoc) {
	if (typeof codeAfterJSDoc !== "string") {
		return "";
	}

	// Split into lines and process
	const lines = codeAfterJSDoc.split(/\r?\n/);
	const codeLines = [];
	let braceCount = 0;
	let parenCount = 0;
	let inExportBlock = false;
	let inArrowFunction = false;

	for (const line of lines) {
		const trimmedLine = line.trim();

		// Skip empty lines at the beginning
		if (trimmedLine === "" && codeLines.length === 0) {
			continue;
		}

		// Stop if we hit another JSDoc block
		if (trimmedLine.startsWith("/**")) {
			break;
		}

		// Add this line
		codeLines.push(line);

		// Check if we're starting an export block
		if (
			trimmedLine.startsWith("export") &&
			trimmedLine.includes("{") &&
			!trimmedLine.includes("=")
		) {
			inExportBlock = true;
		}

		// Check if this looks like an arrow function definition
		if (
			trimmedLine.startsWith("export") &&
			trimmedLine.includes("=") &&
			trimmedLine.includes("(")
		) {
			inArrowFunction = true;
		}

		// Count braces and parentheses
		braceCount += (trimmedLine.match(/\{/g) || []).length;
		braceCount -= (trimmedLine.match(/\}/g) || []).length;
		parenCount += (trimmedLine.match(/\(/g) || []).length;
		parenCount -= (trimmedLine.match(/\)/g) || []).length;

		// Stop conditions
		if (inExportBlock && braceCount === 0) {
			// End of export block
			break;
		} else if (inArrowFunction) {
			// For arrow functions, continue until we have the complete definition
			if (
				parenCount === 0 &&
				braceCount === 0 &&
				(trimmedLine.endsWith(";") || trimmedLine.endsWith("};"))
			) {
				// Complete arrow function
				break;
			} else if (
				parenCount === 0 &&
				braceCount === 0 &&
				trimmedLine.endsWith("`") &&
				codeLines.length > 5
			) {
				// Likely end of tagged template literal return
				break;
			}
			// Otherwise continue collecting the arrow function body
		} else if (
			!inExportBlock &&
			!inArrowFunction &&
			(trimmedLine.includes("{") || trimmedLine.endsWith(";"))
		) {
			// Simple statement or function/class declaration
			break;
		}

		// Safety limit - increase significantly for arrow functions
		if (codeLines.length >= (inArrowFunction ? 60 : 10)) {
			break;
		}
	}

	return codeLines.join("\n").trim();
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

/**
 * Analyze JavaScript code following JSDoc block to detect entity type and name
 *
 * **Patterns detected (PUBLIC EXPORTS ONLY):**
 * - `export function name()` → function entity
 * - `export class Name` → class entity
 * - `export const name = value` → variable entity (unless value is a function)
 * - `export const name = () => {}` → function entity (arrow function)
 * - `export const name = (strings, ...values) => {}` → function entity (tagged template)
 * - `export const name = function() {}` → function entity (function expression)
 * - `export default function` / `export default class` → default export
 * - `export { name1, name2 } from './module'` → re-export
 *
 * @param {string} code - JavaScript code following JSDoc block
 * @returns {{type: string, name: string}|null} Entity type and name, or null if not detected
 */
function analyzeFollowingCode(code) {
	if (typeof code !== "string" || !code.trim()) {
		return null;
	}

	// Clean the code - preserve structure but normalize whitespace within lines
	const cleanCode = code.trim();

	// Function patterns - ONLY exported functions
	const functionPatterns = [
		/^export\s+function\s+(\w+)/,
		/^export\s+async\s+function\s+(\w+)/,
	];

	for (const pattern of functionPatterns) {
		const match = cleanCode.match(pattern);
		if (match) {
			return { type: "function", name: match[1] };
		}
	}

	// Class patterns - ONLY exported classes
	const classPatterns = [/^export\s+class\s+(\w+)/];

	for (const pattern of classPatterns) {
		const match = cleanCode.match(pattern);
		if (match) {
			return { type: "class", name: match[1] };
		}
	}

	// Variable/constant patterns - but check if it's actually a function (multiline-aware)
	const variablePatterns = [
		/^export\s+const\s+(\w+)\s*=\s*([\s\S]+)/,
		/^export\s+let\s+(\w+)\s*=\s*([\s\S]+)/,
		/^export\s+var\s+(\w+)\s*=\s*([\s\S]+)/,
	];

	for (const pattern of variablePatterns) {
		const match = cleanCode.match(pattern);
		if (match) {
			const name = match[1];
			const initializer = match[2];

			// Check if the initializer is a function (arrow function or regular function)
			// Tagged template literal pattern: (strings, ...values) => {}
			const taggedTemplatePattern =
				/^\s*\(\s*strings\s*,\s*\.\.\.[\w]+\s*\)\s*=>/;
			// General arrow function pattern (handle multiline parameters)
			const arrowFunctionPattern = /^\s*\([\s\S]*?\)\s*=>/;
			// Function expression pattern
			const functionExpressionPattern = /^\s*function\s*\(/;

			if (
				taggedTemplatePattern.test(initializer) ||
				functionExpressionPattern.test(initializer)
			) {
				return { type: "function", name };
			}

			// Check for arrow functions - need special handling for tagged template detection
			if (arrowFunctionPattern.test(initializer)) {
				// Look for tagged template literals in the function body
				// Pattern: ({ params }) => { ... html`...` ... } or ({ params }) => html`...`
				const bodyMatch = initializer.match(/=>\s*([\s\S]+)$/);
				if (bodyMatch) {
					const functionBody = bodyMatch[1].trim();
					// Check for common tagged template patterns: html`, md`, css`, js`, etc.
					// Also check for return statements with tagged templates
					if (
						/\b(?:html|md|css|js|code|template|render|sql)\s*`/.test(
							functionBody,
						) ||
						/return\s+\w+\s*`/.test(functionBody)
					) {
						return { type: "function", name };
					}
				}
				// Default: classify arrow functions as functions
				return { type: "function", name };
			}

			return { type: "variable", name };
		}
	}

	// Default export patterns
	if (cleanCode.match(/^export\s+default\s+function/)) {
		return { type: "function", name: "default" };
	}

	if (cleanCode.match(/^export\s+default\s+class/)) {
		return { type: "class", name: "default" };
	}

	// Arrow function patterns - ONLY exported arrow functions
	const arrowMatch = cleanCode.match(
		/^export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/,
	);
	if (arrowMatch) {
		return { type: "function", name: arrowMatch[1] };
	}

	// Re-export patterns (export { name1, name2 } from './module')
	// Handle both single-line and multi-line re-exports
	const reexportMatch = cleanCode.match(
		/^export\s*\{\s*([\s\S]*?)\s*\}\s*from\s*['"]([^'"]+)['"]/m,
	);
	if (reexportMatch) {
		const exportedNames = reexportMatch[1]
			.split(",")
			.map((name) => name.trim())
			.filter((name) => name.length > 0);
		const sourceModule = reexportMatch[2];

		// For re-exports, we'll return info about the first exported name
		// The consumer can handle multiple names if needed
		if (exportedNames.length > 0) {
			return {
				type: "reexport",
				name: exportedNames[0],
				exportedNames,
				sourceModule,
			};
		}
	}

	return null;
}

/**
 * Extract typedef name from JSDoc typedef tag content
 *
 * Handles formats like:
 * - @typedef {string} MyType
 * - @typedef {Object} MyObject
 * - @typedef {Array<Map<string, number>>} ComplexType
 * - @typedef {string|number|boolean} UnionType
 *
 * @param {string} content - The content of the @typedef tag
 * @returns {string} The typedef name, or "anonymous" if not found
 */
function extractTypedefName(content) {
	if (typeof content !== "string" || !content.trim()) {
		return "anonymous";
	}

	// Pattern to match: {Type} Name
	// This handles complex types like {Array<Map<string, number>>} TestType
	const typedefPattern = /^\s*\{[^}]*\}\s+(\w+)/;
	const match = content.match(typedefPattern);

	if (match) {
		return match[1];
	}

	// Fallback: if no braces, try to get the last word as the name
	const words = content.trim().split(/\s+/);
	if (words.length > 0) {
		return words[words.length - 1];
	}

	return "anonymous";
}
