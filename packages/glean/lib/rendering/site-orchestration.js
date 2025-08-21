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
 * page creation, SEO optimization, and complete static site assembly.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sitemap } from "@raven-js/beak/seo";
import { generateAssets } from "./asset-management.js";
import {
	generateEntityPage,
	generateIndexPage,
	generateModulePage,
} from "./page-generation.js";

/**
 * Generate static documentation site from documentation graph
 * @param {any} graph - Documentation graph object
 * @param {string} outputDir - Output directory path
 * @param {Object} [options] - Generation options
 * @param {string} [options.domain] - Custom domain for SEO tags
 * @returns {Promise<void>}
 */
export async function generateStaticSite(graph, outputDir, options = {}) {
	// Create output directory
	await mkdir(outputDir, { recursive: true });

	// Generate assets (CSS, favicon, etc.)
	await generateAssets(outputDir);

	// Generate main index page
	await generateIndexPage(graph, outputDir, options);

	// Generate module pages
	const modules =
		graph.modules instanceof Map
			? graph.modules
			: new Map(Object.entries(graph.modules || {}));
	for (const [moduleId, moduleData] of modules) {
		await generateModulePage(graph, moduleId, moduleData, outputDir, options);
	}

	// Generate entity pages
	const entities =
		graph.entities instanceof Map
			? graph.entities
			: new Map(Object.entries(graph.entities || {}));
	for (const [entityId, entityData] of entities) {
		await generateEntityPage(graph, entityId, entityData, outputDir, options);
	}

	// TODO: Generate sitemap.xml (temporarily disabled due to URL processing issues)
	// await generateSitemap(graph, outputDir);
	// Generate search index
	await generateSearchIndex(graph, outputDir);

	// TODO: Generate module and entity index pages
}

/**
 * Generate sitemap.xml for the documentation site
 * @param {any} graph - Documentation graph object
 * @param {string} outputDir - Output directory path
 * @returns {Promise<void>}
 */
async function _generateSitemap(graph, outputDir) {
	// Collect all pages as proper objects
	const pages = [
		{ url: "/", lastmod: new Date(), changefreq: "weekly", priority: 1.0 },
	];

	// Add module pages
	const modules =
		graph.modules instanceof Map
			? graph.modules
			: new Map(Object.entries(graph.modules || {}));
	for (const [moduleId] of modules) {
		pages.push({
			url: `/modules/${moduleId.replace(/\//g, "-")}.html`,
			lastmod: new Date(),
			changefreq: "weekly",
			priority: 0.8,
		});
	}

	// Add entity pages
	const entities =
		graph.entities instanceof Map
			? graph.entities
			: new Map(Object.entries(graph.entities || {}));
	for (const [entityId] of entities) {
		pages.push({
			url: `/entities/${entityId.replace(/\//g, "-")}.html`,
			lastmod: new Date(),
			changefreq: "monthly",
			priority: 0.6,
		});
	}

	// Generate sitemap XML with no domain to avoid URL issues
	const sitemapXml = sitemap({
		pages,
	});

	await writeFile(join(outputDir, "sitemap.xml"), sitemapXml, "utf8");
}

/**
 * Generate search index JSON for client-side search
 * @param {any} graph - Documentation graph object
 * @param {string} outputDir - Output directory path
 * @returns {Promise<void>}
 */
async function generateSearchIndex(graph, outputDir) {
	const searchIndex = [];

	// Add package info
	const packageInfo = graph.package || {};
	if (packageInfo.name) {
		searchIndex.push({
			id: "package",
			title: packageInfo.name,
			description: packageInfo.description || "",
			type: "package",
			url: "/",
			keywords: [packageInfo.name],
		});
	}

	// Add modules
	const modules =
		graph.modules instanceof Map
			? graph.modules
			: new Map(Object.entries(graph.modules || {}));
	for (const [moduleId, moduleData] of modules) {
		const moduleName = moduleData.name || moduleId;
		searchIndex.push({
			id: moduleId,
			title: moduleName,
			description: moduleData.description || `${moduleName} module`,
			type: "module",
			url: `/modules/${moduleId.replace(/\//g, "-")}.html`,
			keywords: [moduleName, moduleId, "module"],
		});
	}

	// Add entities
	const entities =
		graph.entities instanceof Map
			? graph.entities
			: new Map(Object.entries(graph.entities || {}));
	for (const [entityId, entityData] of entities) {
		const entityName = entityData.name || entityId;
		const entityType = entityData.type || entityData.entityType || "entity";
		const description =
			entityData.jsdoc?.description || `${entityType} ${entityName}`;

		searchIndex.push({
			id: entityId,
			title: entityName,
			description,
			type: entityType,
			url: `/entities/${entityId.replace(/\//g, "-")}.html`,
			keywords: [entityName, entityType, entityData.moduleId].filter(Boolean),
		});
	}

	await writeFile(
		join(outputDir, "search-index.json"),
		JSON.stringify(searchIndex, null, 2),
		"utf8",
	);
}
