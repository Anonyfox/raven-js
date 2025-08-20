/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Entity extraction and graph building for documentation archaeology.
 *
 * Surgical extraction of JavaScript entities and JSDoc comments into
 * structured graph format. Builds comprehensive documentation database
 * with labeled references and serializable structure.
 */

import { readFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { extractCodeEntities, findPrecedingJSDoc } from "./validation.js";

/**
 * Extract complete documentation graph from package
 * @param {string} packagePath - Path to package directory
 * @param {{files: string[], readmes: string[], packageJson: any, entryPoints: string[]}} discovery - Discovery results
 * @returns {Promise<DocumentationGraph>} Complete documentation graph
 */
export async function extractDocumentationGraph(packagePath, discovery) {
	const graph = {
		package: buildPackageMetadata(discovery.packageJson),
		modules: /** @type {any} */ ({}),
		entities: /** @type {any} */ ({}),
		readmes: /** @type {any} */ ({}),
		assets: /** @type {any} */ ({}),
	};

	// Process each JavaScript file
	for (const filePath of discovery.files) {
		const moduleData = await extractModuleData(filePath, packagePath);
		const moduleId = generateModuleId(filePath, packagePath);

		graph.modules[moduleId] = moduleData.module;

		// Add entities to graph
		for (const entity of moduleData.entities) {
			graph.entities[entity.id] = entity;
		}
	}

	// Process README files
	for (const readmePath of discovery.readmes) {
		const readmeData = await extractReadmeData(readmePath, packagePath);
		const readmeId = generateReadmeId(readmePath, packagePath);
		graph.readmes[readmeId] = readmeData;
	}

	// Build cross-references between entities
	buildEntityReferences(graph);

	return graph;
}

/**
 * Build package metadata from package.json
 * @param {any} packageJson - Parsed package.json
 * @returns {PackageMetadata} Package metadata object
 */
export function buildPackageMetadata(packageJson) {
	if (!packageJson) {
		return {
			name: "unknown",
			version: "0.0.0",
			description: "",
			exports: {},
			main: undefined,
			module: undefined,
		};
	}

	return {
		name: packageJson.name || "unknown",
		version: packageJson.version || "0.0.0",
		description: packageJson.description || "",
		exports: packageJson.exports || {},
		main: packageJson.main,
		module: packageJson.module,
	};
}

/**
 * Extract module data and entities from a JavaScript file
 * @param {string} filePath - Path to JavaScript file
 * @param {string} packagePath - Package root path
 * @returns {Promise<{module: ModuleData, entities: EntityNode[]}>} Module and entity data
 */
export async function extractModuleData(filePath, packagePath) {
	const content = await readFile(filePath, "utf-8");
	const lines = content.split("\n");
	const relativePath = relative(packagePath, filePath);

	// Create module data
	const moduleId = generateModuleId(filePath, packagePath);
	const module = {
		id: moduleId,
		path: relativePath,
		exports: extractModuleExports(content),
		imports: extractModuleImports(content),
	};

	// Extract entities from the file
	const codeEntities = extractCodeEntities(content);
	const entities = [];

	for (const codeEntity of codeEntities) {
		const entity = await buildEntityNode(
			codeEntity,
			content,
			lines,
			filePath,
			packagePath,
			moduleId,
		);
		entities.push(entity);
	}

	return { module, entities };
}

/**
 * Build a complete entity node from code entity
 * @param {any} codeEntity - Basic code entity from validation
 * @param {string} content - Full file content
 * @param {string[]} lines - File lines array
 * @param {string} filePath - Absolute file path
 * @param {string} packagePath - Package root path
 * @param {string} moduleId - Module identifier
 * @returns {Promise<EntityNode>} Complete entity node
 */
export async function buildEntityNode(
	codeEntity,
	content,
	lines,
	filePath,
	packagePath,
	moduleId,
) {
	const relativePath = relative(packagePath, filePath);
	const entityId = `${moduleId}/${codeEntity.name}`;

	// Find JSDoc comment
	const jsDocComment = findPrecedingJSDoc(lines, codeEntity.line - 1);

	// Extract source code snippet
	const sourceSnippet = extractSourceSnippet(
		lines,
		codeEntity.line,
		codeEntity.type,
	);

	// Determine export type
	const exportType = determineExportType(codeEntity, content);

	const entity = {
		id: entityId,
		type: codeEntity.type,
		name: codeEntity.name,
		location: {
			file: relativePath,
			line: codeEntity.line,
			column: 0, // TODO: Extract column info in future enhancement
		},
		exports: exportType,
		jsdoc: jsDocComment ? parseJSDocToStructured(jsDocComment) : null,
		references: /** @type {string[]} */ ([]), // Will be populated by buildEntityReferences
		referencedBy: /** @type {string[]} */ ([]), // Will be populated by buildEntityReferences
		source: sourceSnippet,
		moduleId,
	};

	return entity;
}

/**
 * Extract module exports from content
 * @param {string} content - File content
 * @returns {string[]} Array of export names
 */
export function extractModuleExports(content) {
	const exports = [];
	const lines = content.split("\n");

	for (const line of lines) {
		const trimmed = line.trim();

		// Named exports with possible re-exports: export { name1, name2 } from "..."
		const namedExportMatch = trimmed.match(
			/^export\s*\{\s*([^}]+)\s*\}(?:\s+from\s+["'][^"']*["'])?/,
		);
		if (namedExportMatch) {
			const names = namedExportMatch[1]
				.split(",")
				.map((name) =>
					name
						.trim()
						.split(/\s+as\s+/)[0]
						.trim(),
				)
				.filter((name) => name.length > 0);
			exports.push(...names);
		}

		// Default export
		if (trimmed.startsWith("export default")) {
			exports.push("default");
		}

		// Direct exports: export const/function/class
		const directExportMatch = trimmed.match(
			/^export\s+(?:const|let|var|function|class)\s+(\w+)/,
		);
		if (directExportMatch) {
			exports.push(directExportMatch[1]);
		}
	}

	return [...new Set(exports)]; // Remove duplicates
}

/**
 * Extract module imports from content
 * @param {string} content - File content
 * @returns {ModuleImport[]} Array of import data
 */
export function extractModuleImports(content) {
	const imports = [];
	const lines = content.split("\n");

	for (const line of lines) {
		const trimmed = line.trim();

		// ES6 imports: import ... from "path"
		const importMatch = trimmed.match(
			/^import\s+(.*?)\s+from\s+["']([^"']+)["']/,
		);
		if (importMatch) {
			const [, importClause, modulePath] = importMatch;
			const importedNames = parseImportClause(importClause);

			imports.push({
				path: modulePath,
				names: importedNames,
				type: "static",
			});
		}

		// Dynamic imports: import("path")
		const dynamicImportMatch = trimmed.match(
			/import\s*\(\s*["']([^"']+)["']\s*\)/,
		);
		if (dynamicImportMatch) {
			imports.push({
				path: dynamicImportMatch[1],
				names: [],
				type: "dynamic",
			});
		}
	}

	return imports;
}

/**
 * Parse import clause to extract imported names
 * @param {string} importClause - Import clause content
 * @returns {string[]} Array of imported names
 */
export function parseImportClause(importClause) {
	const names = [];
	const trimmed = importClause.trim();

	// Default import: import name from "..."
	const defaultMatch = trimmed.match(/^(\w+)(?:\s*,|$)/);
	if (defaultMatch) {
		names.push(defaultMatch[1]);
	}

	// Named imports: import { name1, name2 } from "..."
	const namedMatch = trimmed.match(/\{\s*([^}]+)\s*\}/);
	if (namedMatch) {
		const namedImports = namedMatch[1].split(",").map((name) =>
			name
				.trim()
				.split(/\s+as\s+/)[0]
				.trim(),
		);
		names.push(...namedImports);
	}

	// Namespace import: import * as name from "..."
	const namespaceMatch = trimmed.match(/\*\s+as\s+(\w+)/);
	if (namespaceMatch) {
		names.push(namespaceMatch[1]);
	}

	return names.filter((name) => name.length > 0);
}

/**
 * Extract source code snippet around entity
 * @param {string[]} lines - File lines
 * @param {number} entityLine - Entity line number (1-based)
 * @param {string} entityType - Entity type
 * @returns {string} Source code snippet
 */
export function extractSourceSnippet(lines, entityLine, entityType) {
	const lineIndex = entityLine - 1; // Convert to 0-based
	const startIndex = Math.max(0, lineIndex);

	// Determine how many lines to include based on entity type
	let endIndex;
	if (entityType === "class") {
		// For classes, try to find the closing brace
		endIndex = findClosingBrace(lines, startIndex) || startIndex + 10;
	} else if (entityType === "function") {
		// For functions, try to find the closing brace or reasonable limit
		endIndex = findClosingBrace(lines, startIndex) || startIndex + 5;
	} else {
		// For variables/constants, just a few lines
		endIndex = startIndex + 2;
	}

	endIndex = Math.min(lines.length - 1, endIndex);

	return lines.slice(startIndex, endIndex + 1).join("\n");
}

/**
 * Find closing brace for code block
 * @param {string[]} lines - File lines
 * @param {number} startIndex - Starting line index
 * @returns {number|null} Closing brace line index or null
 */
export function findClosingBrace(lines, startIndex) {
	let braceCount = 0;
	let foundOpenBrace = false;

	for (let i = startIndex; i < lines.length && i < startIndex + 50; i++) {
		const line = lines[i];

		for (const char of line) {
			if (char === "{") {
				braceCount++;
				foundOpenBrace = true;
			} else if (char === "}") {
				braceCount--;
				if (foundOpenBrace && braceCount === 0) {
					return i;
				}
			}
		}
	}

	return null; // Could not find closing brace
}

/**
 * Determine export type for entity
 * @param {any} codeEntity - Code entity
 * @param {string} content - File content
 * @returns {string[]} Export types array
 */
export function determineExportType(codeEntity, content) {
	const exports = [];

	if (codeEntity.exported) {
		// Check if it's a default export - look for different patterns
		const defaultPatterns = [
			new RegExp(`export\\s+default\\s+function\\s+${codeEntity.name}`),
			new RegExp(`export\\s+default\\s+class\\s+${codeEntity.name}`),
			new RegExp(`export\\s+default\\s+${codeEntity.name}`),
		];

		const isDefault = defaultPatterns.some((pattern) => pattern.test(content));

		if (isDefault) {
			exports.push("default");
		} else {
			exports.push("named");
		}
	}

	return exports;
}

/**
 * Parse JSDoc comment to structured format
 * @param {any} jsDocComment - JSDoc comment object
 * @returns {StructuredJSDoc} Structured JSDoc data
 */
export function parseJSDocToStructured(jsDocComment) {
	const structured = {
		description: jsDocComment.description,
		tags: /** @type {any} */ ({}),
	};

	// Process tags into structured format
	for (const [tagName, tagValues] of Object.entries(jsDocComment.tags)) {
		if (tagName === "param") {
			structured.tags.param = tagValues.map(parseParamTag);
		} else if (tagName === "returns" || tagName === "return") {
			structured.tags.returns = parseReturnTag(tagValues[0]);
		} else {
			structured.tags[tagName] = tagValues;
		}
	}

	return structured;
}

/**
 * Parse @param tag content
 * @param {string} paramTag - @param tag content
 * @returns {ParamTag} Parsed param tag
 */
export function parseParamTag(paramTag) {
	// Match: {type} name - description
	const match = paramTag.match(/^\{([^}]+)\}\s*(\w+)\s*-?\s*(.*)/);

	if (match) {
		return {
			type: match[1],
			name: match[2],
			description: match[3].trim(),
		};
	}

	// Fallback for malformed param tags
	return {
		type: "any",
		name: "unknown",
		description: paramTag,
	};
}

/**
 * Parse return tag content
 * @param {string} returnTag - Return tag content
 * @returns {ReturnTag} Parsed return tag
 */
export function parseReturnTag(returnTag) {
	// Match: {type} description
	const match = returnTag.match(/^\{([^}]+)\}\s*(.*)/);

	if (match) {
		return {
			type: match[1],
			description: match[2].trim(),
		};
	}

	// Fallback
	return {
		type: "any",
		description: returnTag,
	};
}

/**
 * Extract README data and content
 * @param {string} readmePath - Path to README file
 * @param {string} packagePath - Package root path
 * @returns {Promise<ReadmeData>} README data
 */
export async function extractReadmeData(readmePath, packagePath) {
	const content = await readFile(readmePath, "utf-8");
	const relativePath = relative(packagePath, readmePath);
	const dirPath = dirname(relativePath);

	return {
		path: relativePath,
		content,
		assets: [], // TODO: Extract asset references in future enhancement
		directory: dirPath,
	};
}

/**
 * Build cross-references between entities
 * @param {DocumentationGraph} _graph - Documentation graph (unused for now)
 */
export function buildEntityReferences(_graph) {
	// TODO: Implement reference resolution in future enhancement
	// For now, this is a placeholder that could analyze:
	// - Function calls between entities
	// - Class inheritance
	// - Import/export relationships
	// - JSDoc @see references
	// This would require more sophisticated analysis of the code
	// For Phase 2, we'll leave references empty and implement in Phase 3
}

/**
 * Generate module ID from file path
 * @param {string} filePath - Absolute file path
 * @param {string} packagePath - Package root path
 * @returns {string} Module ID
 */
export function generateModuleId(filePath, packagePath) {
	const relativePath = relative(packagePath, filePath);
	return relativePath.replace(/\.(js|mjs)$/, "").replace(/[/\\]/g, "/");
}

/**
 * Generate README ID from file path
 * @param {string} readmePath - Absolute README path
 * @param {string} packagePath - Package root path
 * @returns {string} README ID
 */
export function generateReadmeId(readmePath, packagePath) {
	const relativePath = relative(packagePath, readmePath);
	const dirPath = dirname(relativePath);
	return dirPath === "." ? "root" : dirPath;
}

/**
 * @typedef {Object} DocumentationGraph
 * @property {PackageMetadata} package - Package metadata
 * @property {Object<string, ModuleData>} modules - Module data by ID
 * @property {Object<string, EntityNode>} entities - Entity nodes by ID
 * @property {Object<string, ReadmeData>} readmes - README data by directory
 * @property {Object<string, AssetData>} assets - Asset data by ID
 */

/**
 * @typedef {Object} PackageMetadata
 * @property {string} name - Package name
 * @property {string} version - Package version
 * @property {string} description - Package description
 * @property {any} exports - Package exports configuration
 * @property {string|undefined} main - Main entry point
 * @property {string|undefined} module - Module entry point
 */

/**
 * @typedef {Object} ModuleData
 * @property {string} id - Module ID
 * @property {string} path - Relative path to module file
 * @property {string[]} exports - Exported names
 * @property {ModuleImport[]} imports - Import data
 */

/**
 * @typedef {Object} ModuleImport
 * @property {string} path - Import path
 * @property {string[]} names - Imported names
 * @property {string} type - Import type (static|dynamic)
 */

/**
 * @typedef {Object} EntityNode
 * @property {string} id - Unique entity ID
 * @property {string} type - Entity type (function|class|variable|type)
 * @property {string} name - Entity name
 * @property {Object} location - Source location
 * @property {string[]} exports - Export types
 * @property {StructuredJSDoc|null} jsdoc - JSDoc data
 * @property {string[]} references - Referenced entity IDs
 * @property {string[]} referencedBy - Entities referencing this one
 * @property {string} source - Source code snippet
 * @property {string} moduleId - Parent module ID
 */

/**
 * @typedef {Object} StructuredJSDoc
 * @property {string} description - Main description
 * @property {Object} tags - Structured JSDoc tags
 */

/**
 * @typedef {Object} ParamTag
 * @property {string} type - Parameter type
 * @property {string} name - Parameter name
 * @property {string} description - Parameter description
 */

/**
 * @typedef {Object} ReturnTag
 * @property {string} type - Return type
 * @property {string} description - Return description
 */

/**
 * @typedef {Object} ReadmeData
 * @property {string} path - Relative path to README
 * @property {string} content - README content
 * @property {string[]} assets - Referenced asset IDs
 * @property {string} directory - Directory containing README
 */

/**
 * @typedef {Object} AssetData
 * @property {string} path - Asset file path
 * @property {string} content - Base64 encoded content
 * @property {string} type - MIME type
 */
