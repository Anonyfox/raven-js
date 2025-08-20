/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Graph orchestration for complete documentation extraction.
 *
 * Surgical coordination of the entire documentation extraction pipeline,
 * assembling all modules into comprehensive documentation graphs with
 * predatory precision and zero-waste efficiency.
 */

import { extractReadmeData } from "./content-integration.js";
import { generateReadmeId } from "./id-generators.js";
import { extractModuleData } from "./module-processing.js";
import { buildPackageMetadata } from "./package-metadata.js";

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
		const moduleId = moduleData.module.id;

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
 * @typedef {import('./package-metadata.js').PackageMetadata} PackageMetadata
 */

/**
 * @typedef {import('./module-processing.js').ModuleData} ModuleData
 */

/**
 * @typedef {import('./entity-construction.js').EntityNode} EntityNode
 */

/**
 * @typedef {import('./content-integration.js').ReadmeData} ReadmeData
 */

/**
 * @typedef {Object} DocumentationGraph
 * @property {PackageMetadata} package - Package metadata
 * @property {Object<string, ModuleData>} modules - Module data by ID
 * @property {Object<string, EntityNode>} entities - Entity nodes by ID
 * @property {Object<string, ReadmeData>} readmes - README data by directory
 * @property {Object<string, AssetData>} assets - Asset data by ID
 */

/**
 * @typedef {Object} AssetData
 * @property {string} path - Asset file path
 * @property {string} content - Base64 encoded content
 * @property {string} type - MIME type
 */
