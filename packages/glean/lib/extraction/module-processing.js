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
import { ModuleEntity } from "../models/module-entity.js";
import { buildEnhancedEntity } from "./entity-construction-enhanced.js";
import { extractCodeEntities } from "./entity-extraction.js";
import { generateModuleId } from "./id-generators.js";
import {
	extractModuleExports,
	extractModuleImports,
} from "./module-relationships.js";

/**
 * Extract module data and entities from a JavaScript file
 * @param {string} filePath - Path to JavaScript file
 * @param {string} packagePath - Package root path
 * @returns {Promise<{module: import('../models/module-entity.js').ModuleEntity, entities: import('../models/entity-base.js').EntityBase[]}>} Module and enhanced entity instances
 */
export async function extractModuleData(filePath, packagePath) {
	const content = await readFile(filePath, "utf-8");
	const lines = content.split("\n");
	const relativePath = relative(packagePath, filePath);

	// Create module entity
	const moduleId = generateModuleId(filePath, packagePath);
	const module = new ModuleEntity(moduleId, relativePath);

	// Set module metadata
	module.setMetadata({
		size: Buffer.byteLength(content, "utf8"),
		lineCount: lines.length,
		lastModified: new Date(),
	});

	// Add exports and imports
	const exports = extractModuleExports(content);
	for (const exportName of exports) {
		module.addExport(exportName);
	}

	const imports = extractModuleImports(content);
	for (const imp of imports) {
		module.addImport({
			type: imp.type === "default" ? "default" : "named",
			source: imp.path,
			specifiers: imp.names.map((name) => ({
				type: "named",
				imported: name,
				local: name,
			})),
		});
	}

	// Extract entities from the file
	const codeEntities = extractCodeEntities(content);
	const entities = [];

	for (const codeEntity of codeEntities) {
		const entity = await buildEnhancedEntity(
			codeEntity,
			content,
			lines,
			filePath,
			packagePath,
			moduleId,
		);
		entities.push(entity);

		// Add entity to module
		module.addEntity(entity.getId());
	}

	// Validate module
	module.validate();

	return { module, entities };
}

/**
 * @typedef {import('./module-relationships.js').ModuleImport} ModuleImport
 */
