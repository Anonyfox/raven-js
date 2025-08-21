/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Site orchestration for complete documentation generation.
 *
 * Main pipeline coordination that orchestrates asset generation,
 * page creation, and complete static site assembly. Depends on
 * all other rendering modules to create complete documentation sites.
 */

import { mkdir } from "node:fs/promises";
import { generateAssets } from "./asset-management.js";
import {
	generateEntityPage,
	generateIndexPage,
	generateModulePage,
} from "./page-generation.js";

/**
 * Generate static documentation site from JSON graph
 * @param {any} graph - Documentation graph object
 * @param {string} outputDir - Output directory path
 * @returns {Promise<void>}
 */
export async function generateStaticSite(graph, outputDir) {
	// Create output directory
	await mkdir(outputDir, { recursive: true });

	// Generate main index page
	await generateIndexPage(graph, outputDir);

	// Generate module pages
	const moduleEntries =
		graph.modules instanceof Map
			? graph.modules.entries()
			: Object.entries(graph.modules || {});
	for (const [moduleId, moduleData] of moduleEntries) {
		await generateModulePage(graph, moduleId, moduleData, outputDir);
	}

	// Generate entity pages
	const entityEntries =
		graph.entities instanceof Map
			? graph.entities.entries()
			: Object.entries(graph.entities || {});
	for (const [entityId, entityData] of entityEntries) {
		await generateEntityPage(graph, entityId, entityData, outputDir);
	}

	// Copy assets and styles
	await generateAssets(outputDir);
}
