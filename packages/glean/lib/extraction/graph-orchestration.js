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

import { DocumentationGraph } from "../models/documentation-graph.js";
import { PackageEntity } from "../models/package-entity.js";
import { extractReadmeData } from "./content-integration.js";
import { extractModuleData } from "./module-processing.js";

/**
 * Extract complete documentation graph from package
 * @param {string} packagePath - Path to package directory
 * @param {{files: string[], readmes: string[], packageJson: any, entryPoints: string[]}} discovery - Discovery results
 * @returns {Promise<import('../models/documentation-graph.js').DocumentationGraph>} Complete documentation graph
 */
export async function extractDocumentationGraph(packagePath, discovery) {
	const packageEntity = new PackageEntity(discovery.packageJson);
	packageEntity.validate();

	// Create documentation graph with package entity
	const graph = new DocumentationGraph(packageEntity);

	// Process each JavaScript file
	for (const filePath of discovery.files) {
		const moduleData = await extractModuleData(filePath, packagePath);

		// Add module to graph
		graph.addModule(moduleData.module);

		// Add entities to graph
		for (const entity of moduleData.entities) {
			graph.addEntity(entity);
		}
	}

	// Process README files
	for (const readmePath of discovery.readmes) {
		const readmeData = await extractReadmeData(readmePath, packagePath);
		graph.addContent(readmeData);
	}

	// Build cross-references between entities
	buildEntityReferences(graph);

	// Validate the complete graph
	graph.validate();

	return graph;
}

/**
 * Build cross-references between entities
 * @param {import('../models/documentation-graph.js').DocumentationGraph} _graph - Documentation graph (unused for now)
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
 * @typedef {import('./entity-construction.js').EntityNode} EntityNode
 */

/**
 * @typedef {Object} AssetData
 * @property {string} path - Asset file path
 * @property {string} content - Base64 encoded content
 * @property {string} type - MIME type
 */
