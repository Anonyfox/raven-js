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
import { discoverDocumentationAssets } from "./asset-collection.js";
import { extractReadmeData } from "./content-integration.js";
import { extractModuleData } from "./module-processing.js";
import { buildEntityReferences as resolveEntityReferences } from "./reference-resolution.js";

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

	// Process all JavaScript files in parallel for predatory speed
	const modulePromises = discovery.files.map((filePath) =>
		extractModuleData(filePath, packagePath),
	);

	const moduleResults = await Promise.all(modulePromises);

	// Add all modules and entities to graph - batch operations
	for (const moduleData of moduleResults) {
		// Add module to graph
		graph.addModule(moduleData.module);

		// Add entities to graph
		for (const entity of moduleData.entities) {
			graph.addEntity(entity);
		}
	}

	// Process README files in parallel for predatory efficiency
	const readmePromises = discovery.readmes.map((readmePath) =>
		extractReadmeData(readmePath, packagePath),
	);

	const readmeResults = await Promise.all(readmePromises);

	// Add all content to graph - batch operations
	for (const readmeData of readmeResults) {
		graph.addContent(readmeData);
	}

	// Build cross-references between entities (Phase 3: Reference Resolution)
	resolveEntityReferences(graph);

	// Resolve all string references to direct object references (raven optimization)
	graph.resolveEntityReferences();

	// Discover and validate assets (Phase 4: Asset Collection)
	const discoveredAssets = await discoverDocumentationAssets(
		graph,
		packagePath,
	);
	for (const asset of discoveredAssets) {
		graph.addAsset(asset);
	}

	// Validate the complete graph
	graph.validate();

	return graph;
}

/**
 * Build cross-references between entities (legacy export - implementation moved to reference-resolution.js)
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @deprecated Use buildEntityReferences from reference-resolution.js instead
 */
export function buildEntityReferences(graph) {
	// Delegate to the new implementation
	resolveEntityReferences(graph);
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
