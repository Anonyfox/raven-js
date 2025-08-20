/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Module processing for comprehensive documentation extraction.
 *
 * Surgical processing of JavaScript modules to extract complete module data
 * and entity collections with precise metadata and relationship mapping.
 */

import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import { extractCodeEntities } from "../validation.js";
import { buildEntityNode } from "./entity-construction.js";
import { generateModuleId } from "./id-generators.js";
import {
	extractModuleExports,
	extractModuleImports,
} from "./module-relationships.js";

/**
 * Extract module data and entities from a JavaScript file
 * @param {string} filePath - Path to JavaScript file
 * @param {string} packagePath - Package root path
 * @returns {Promise<{module: ModuleData, entities: import('./entity-construction.js').EntityNode[]}>} Module and entity data
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
 * @typedef {import('./module-relationships.js').ModuleImport} ModuleImport
 */

/**
 * @typedef {Object} ModuleData
 * @property {string} id - Module ID
 * @property {string} path - Relative path to module file
 * @property {string[]} exports - Exported names
 * @property {ModuleImport[]} imports - Import data
 */
