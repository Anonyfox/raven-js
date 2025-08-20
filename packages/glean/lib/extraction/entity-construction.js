/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Entity construction for documentation graphs.
 *
 * Surgical assembly of complete entity nodes from code structures,
 * JSDoc comments, and source analysis with precise metadata extraction.
 */

import { relative } from "node:path";
import { findPrecedingJSDoc } from "./jsdoc-parsing.js";
import { parseJSDocToStructured } from "./jsdoc-processing.js";
import { determineExportType } from "./module-relationships.js";
import { extractSourceSnippet } from "./source-analysis.js";

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
 * @typedef {import('./jsdoc-processing.js').StructuredJSDoc} StructuredJSDoc
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
