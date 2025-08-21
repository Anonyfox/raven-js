/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Page generation for complete HTML documentation pages.
 *
 * Assembles complete HTML pages with proper SEO, navigation, and structure.
 * Uses beak/seo for meta tags and beak/html for templating.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { html } from "@raven-js/beak";
import { general, openGraph, twitter } from "@raven-js/beak/seo";
import {
	generateEntityDetails,
	generateEntityList,
	generateReadmeSection,
} from "./content-rendering.js";

/**
 * Determine correct README ID for a module using strict association rules
 * @param {string} moduleId - Module identifier
 * @param {Map<string, any>|Object} availableContent - Available content collection
 * @returns {string|null} Correct README ID or null
 */
function getCorrectReadmeId(moduleId, availableContent) {
	// Get available README IDs
	const availableReadmeIds =
		availableContent instanceof Map
			? Array.from(availableContent.keys())
			: Object.keys(availableContent);

	// Rule 1: Try exact match first
	if (availableReadmeIds.includes(moduleId)) {
		return moduleId;
	}

	// Rule 2: For main module of a directory, try directory README
	// Only if this is the main index file of that directory
	if (moduleId.endsWith("/index")) {
		const dirPath = moduleId.slice(0, -6); // Remove '/index'
		if (availableReadmeIds.includes(dirPath)) {
			return dirPath;
		}
	}

	// Rule 3: No other fallbacks - return null
	return null;
}

/**
 * Extract domain from package.json or provide fallback
 * @param {Object} packageInfo - Package information
 * @param {string} [packageInfo.homepage] - Homepage URL from package.json
 * @param {Object} [packageInfo.repository] - Repository information
 * @param {string} [packageInfo.repository.url] - Repository URL
 * @returns {string} Domain for SEO tags
 */
function extractDomainFromPackage(packageInfo) {
	// Try to extract domain from homepage URL
	if (packageInfo.homepage) {
		try {
			const url = new URL(packageInfo.homepage);
			return url.hostname;
		} catch {
			// Invalid URL, continue to fallback
		}
	}

	// Try to extract from repository URL (for GitHub Pages, etc.)
	if (
		packageInfo.repository &&
		typeof packageInfo.repository === "object" &&
		packageInfo.repository.url
	) {
		const repoUrl = packageInfo.repository.url;
		if (repoUrl.includes("github.com")) {
			// Extract GitHub username/repo for potential GitHub Pages
			const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
			if (match) {
				const [, username, repo] = match;
				return `${username}.github.io/${repo}`;
			}
		}
	}

	// Fallback to localhost for development
	return "localhost:3000";
}

/**
 * Generate SEO meta tags for documentation pages
 * @param {Object} config - SEO configuration
 * @param {string} config.title - Page title
 * @param {string} config.description - Page description
 * @param {string} config.packageName - Package name for suffix
 * @param {Object} [config.packageInfo] - Package information for domain extraction
 * @param {string} [config.domain] - Domain override for canonical URLs
 * @param {string} [config.path] - Page path
 * @returns {string} HTML meta tags
 */
function generateSEOTags({
	title,
	description,
	packageName,
	packageInfo,
	domain,
	path,
}) {
	// Domain precedence: CLI flag > package.json extraction > fallback
	const finalDomain = domain || extractDomainFromPackage(packageInfo || {});

	const seoConfig = {
		title,
		description,
		suffix: `${packageName} Documentation`,
		domain: finalDomain,
		path,
	};

	const ogConfig = {
		title: `${title} | ${packageName} Documentation`,
		description,
		type: "website",
		domain: finalDomain,
		path,
	};

	const twitterConfig = {
		title: `${title} | ${packageName} Documentation`,
		description,
		card: "summary",
		domain: finalDomain,
		path,
	};

	return html`
		${general(seoConfig)}
		${openGraph(ogConfig)}
		${twitter(twitterConfig)}
		<link rel="icon" type="image/x-icon" href="${path ? "../assets/favicon.ico" : "./assets/favicon.ico"}">
	`;
}

/**
 * Generate main index page
 * @param {any} graph - Documentation graph
 * @param {string} outputDir - Output directory
 * @param {Object} [options] - Generation options
 * @param {string} [options.domain] - Custom domain for SEO tags
 * @returns {Promise<void>}
 */
export async function generateIndexPage(graph, outputDir, options = {}) {
	const packageInfo = graph.package || {};
	const packageName = packageInfo.name || "Documentation";
	const packageVersion = packageInfo.version || "1.0.0";
	const packageDescription = packageInfo.description || "";

	// Get README content if available
	let readme = null;
	if (graph.readmes) {
		// Try different ways to access the root README
		readme = graph.readmes.get
			? graph.readmes.get("root")
			: graph.readmes.root || graph.readmes.root;
	}
	// Fallback for older formats
	readme = readme || graph.readme;
	const readmeContent = readme ? generateReadmeSection(readme) : "";

	// Generate navigation to modules and entities
	const modulesData = graph.modules || {};
	const modules =
		modulesData instanceof Map
			? Array.from(modulesData.entries())
			: Object.entries(modulesData);
	const entitiesData = graph.entities || {};
	const entities =
		entitiesData instanceof Map
			? Array.from(entitiesData.values())
			: Object.values(entitiesData);

	const seoTags = generateSEOTags({
		title: packageName,
		description:
			packageDescription || `Complete documentation for ${packageName}`,
		packageName,
		packageInfo,
		domain: options.domain, // CLI domain takes precedence
		path: "/",
	});

	const pageContent = html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
						${seoTags}
		<link rel="stylesheet" href="./assets/bootstrap.min.css">
		<link rel="stylesheet" href="./assets/styles.css">
			</head>
			<body>
				<div class="container">
					<header class="header">
						<h1>${packageName}</h1>
						<span class="version">v${packageVersion}</span>
						${packageDescription ? html`<p class="description">${packageDescription}</p>` : ""}

						<div class="search-container">
							<input type="text" class="search-input" placeholder="Search documentation..." id="search-input">
							<div class="search-results" id="search-results"></div>
						</div>
					</header>

					<nav class="navigation">
						<h2>Quick Navigation</h2>
						<div class="nav-grid">
							${
								modules.length > 0
									? html`
								<a href="./modules/" class="nav-item">
									<h3>Modules (${modules.length})</h3>
									<p>Browse by module organization</p>
								</a>
							`
									: ""
							}
							${
								entities.length > 0
									? html`
								<a href="./entities/" class="nav-item">
									<h3>Entities (${entities.length})</h3>
									<p>Functions, classes, and variables</p>
								</a>
							`
									: ""
							}
						</div>

						${
							modules.length > 0
								? html`
							<section>
								<h3>Modules</h3>
								<div class="nav-grid">
									${modules
										.map(
											([moduleId, moduleData]) => html`
										<a href="./modules/${moduleId.replace(/\//g, "-")}.html" class="nav-item">
											<h4>${moduleData.name || moduleId}</h4>
											<p>${moduleData.description || "Module documentation"}</p>
										</a>
									`,
										)
										.join("")}
								</div>
							</section>
						`
								: ""
						}
					</nav>

					${readmeContent}
				</div>
				<script>
					// Simple client-side search implementation
					let searchIndex = [];

					async function loadSearchIndex() {
						try {
							const response = await fetch('./search-index.json');
							searchIndex = await response.json();
						} catch (error) {
							console.warn('Could not load search index:', error);
						}
					}

					function performSearch(query) {
						if (!query.trim()) return [];

						const lowercaseQuery = query.toLowerCase();
						return searchIndex.filter(item => {
							return item.title.toLowerCase().includes(lowercaseQuery) ||
								   item.description.toLowerCase().includes(lowercaseQuery) ||
								   item.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery));
						}).slice(0, 8);
					}

					function displaySearchResults(results) {
						const container = document.getElementById('search-results');
						if (results.length === 0) {
							container.style.display = 'none';
							return;
						}

						container.innerHTML = results.map(item =>
							\`<a href="\${item.url}" class="search-result-item">
								<div class="search-result-title">\${item.title}</div>
								<div class="search-result-description">\${item.description}</div>
								<div class="search-result-type">\${item.type}</div>
							</a>\`
						).join('');
						container.style.display = 'block';
					}

					document.addEventListener('DOMContentLoaded', () => {
						loadSearchIndex();

						const searchInput = document.getElementById('search-input');
						const searchResults = document.getElementById('search-results');

						if (searchInput) {
							searchInput.addEventListener('input', (e) => {
								const results = performSearch(e.target.value);
								displaySearchResults(results);
							});

							searchInput.addEventListener('focus', (e) => {
								if (e.target.value.trim()) {
									const results = performSearch(e.target.value);
									displaySearchResults(results);
								}
							});

							// Hide results when clicking outside
							document.addEventListener('click', (e) => {
								if (!e.target.closest('.search-container')) {
									searchResults.style.display = 'none';
								}
							});
						}
					});
				</script>
				<script src="./assets/popper.js"></script>
				<script src="./assets/bootstrap.esm.js" type="module"></script>
			</body>
		</html>
	`;

	// Ensure output directory exists and write index.html file
	await mkdir(outputDir, { recursive: true });
	await writeFile(join(outputDir, "index.html"), pageContent, "utf8");
}

/**
 * Generate module page
 * @param {any} graph - Documentation graph
 * @param {string} moduleId - Module identifier
 * @param {any} moduleData - Module data
 * @param {string} outputDir - Output directory
 * @param {Object} [options] - Generation options
 * @param {string} [options.domain] - Custom domain for SEO tags
 * @returns {Promise<void>}
 */
export async function generateModulePage(
	graph,
	moduleId,
	moduleData,
	outputDir,
	options = {},
) {
	const packageInfo = graph.package || {};
	const packageName = packageInfo.name || "Documentation";
	const moduleName = moduleData.name || moduleId;
	const modulePath = moduleData.path || "";
	const moduleExports = moduleData.exports || [];
	const moduleImports = moduleData.imports || [];

	// Get entities for this module from the main entities collection
	const allEntities =
		graph.entities instanceof Map
			? Array.from(graph.entities.values())
			: Object.values(graph.entities || {});

	// For re-export modules (like 'core/index'), also include entities from sub-modules
	let moduleEntities = allEntities.filter(
		(entity) => entity.moduleId === moduleId,
	);

	// If this is a re-export module with no direct entities, find entities from sub-modules
	if (
		moduleEntities.length === 0 &&
		moduleData.exports &&
		moduleData.exports.length > 0
	) {
		// For modules like 'core/index', include entities from 'core/*' sub-modules
		const modulePrefix = `${moduleId}/`;
		const subModuleEntities = allEntities.filter((entity) =>
			entity.moduleId?.startsWith(modulePrefix),
		);

		// Also check if any entities are from modules that start with the directory part
		if (subModuleEntities.length === 0 && moduleId.includes("/")) {
			const dirPart = `${moduleId.split("/")[0]}/`;
			const dirEntities = allEntities.filter(
				(entity) =>
					entity.moduleId?.startsWith(dirPart) &&
					// Only include entities that are actually exported by this module
					moduleData.exports.includes(entity.name),
			);
			moduleEntities = dirEntities;
		} else {
			moduleEntities = subModuleEntities;
		}
	}
	const entityListHtml = generateEntityList(moduleEntities);

	// Get module README if available - using strict association rules
	let moduleReadme = moduleData.readme;

	// If no README on module, apply strict README association rules
	if (!moduleReadme && graph.content) {
		const readmeId = getCorrectReadmeId(moduleId, graph.content);
		if (readmeId) {
			moduleReadme = graph.content.get
				? graph.content.get(readmeId)
				: graph.content[readmeId];
		}
	}

	const readmeContent = moduleReadme ? generateReadmeSection(moduleReadme) : "";

	const seoTags = generateSEOTags({
		title: `${moduleName} - ${packageName}`,
		description: `Documentation for ${moduleName} module`,
		packageName,
		packageInfo: graph.package,
		domain: options.domain, // CLI domain takes precedence
		path: `/modules/${moduleId.replace(/\//g, "-")}.html`,
	});

	const pageContent = html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
						${seoTags}
		<link rel="stylesheet" href="../assets/bootstrap.min.css">
		<link rel="stylesheet" href="../assets/styles.css">
			</head>
			<body>
				<div class="container">
					<header class="header">
						<h1>${moduleName}</h1>
						<nav>
							<a href="../index.html">← Back to ${packageName}</a> |
							<a href="../modules/">All Modules</a> |
							<a href="../entities/">All Entities</a>
						</nav>
					</header>

					<section>
						<h2>Module Information</h2>
						${modulePath ? html`<p><strong>Source:</strong> ${modulePath}</p>` : ""}
						${moduleExports.length > 0 ? html`<p><strong>Exports:</strong> ${moduleExports.join(", ")}</p>` : ""}
						${moduleImports.length > 0 ? html`<p><strong>Imports:</strong> ${moduleImports.length} dependencies</p>` : ""}
					</section>

					${readmeContent}

					${
						moduleEntities.length > 0
							? html`
						<section>
							<h2>Entities in this module</h2>
							${entityListHtml}
						</section>
					`
							: html`
						<section>
							<p class="text-muted">No documented entities found.</p>
						</section>
					`
					}
				</div>
				<script src="../assets/popper.js"></script>
				<script src="../assets/bootstrap.esm.js" type="module"></script>
			</body>
		</html>
	`;

	// Create modules directory and write file
	const modulesDir = join(outputDir, "modules");
	await mkdir(modulesDir, { recursive: true });
	await writeFile(
		join(modulesDir, `${moduleId.replace(/\//g, "-")}.html`),
		pageContent,
		"utf8",
	);
}

/**
 * Generate entity page
 * @param {any} graph - Documentation graph
 * @param {string} entityId - Entity identifier
 * @param {any} entityData - Entity data
 * @param {string} outputDir - Output directory
 * @param {Object} [options] - Generation options
 * @param {string} [options.domain] - Custom domain for SEO tags
 * @returns {Promise<void>}
 */
export async function generateEntityPage(
	graph,
	entityId,
	entityData,
	outputDir,
	options = {},
) {
	const packageInfo = graph.package || {};
	const packageName = packageInfo.name || "Documentation";
	const entityName = entityData.name || entityId;
	const moduleId = entityData.moduleId || "";

	// Generate entity details content
	const entityDetailsHtml = generateEntityDetails(entityData);

	const entityType = entityData.type || entityData.entityType || "entity";
	const entityDescription =
		entityData.jsdoc?.description ||
		`${entityType} documentation for ${entityName}`;

	const seoTags = generateSEOTags({
		title: `${entityName} - ${packageName}`,
		description: entityDescription,
		packageName,
		packageInfo: graph.package,
		domain: options.domain, // CLI domain takes precedence
		path: `/entities/${entityId.replace(/\//g, "-")}.html`,
	});

	const pageContent = html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
						${seoTags}
		<link rel="stylesheet" href="../assets/bootstrap.min.css">
		<link rel="stylesheet" href="../assets/styles.css">
			</head>
			<body>
				<div class="container">
					<header class="header">
						<nav>
							<a href="../index.html">← Back to ${packageName}</a> |
							<a href="../modules/">All Modules</a> |
							<a href="../entities/">All Entities</a>
							${moduleId ? html` | <a href="../modules/${moduleId.replace(/\//g, "-")}.html">${moduleId}</a>` : ""}
						</nav>
					</header>

					${entityDetailsHtml}
				</div>
				<script src="../assets/popper.js"></script>
				<script src="../assets/bootstrap.esm.js" type="module"></script>
			</body>
		</html>
	`;

	// Create entities directory and write file
	const entitiesDir = join(outputDir, "entities");
	await mkdir(entitiesDir, { recursive: true });
	await writeFile(
		join(entitiesDir, `${entityId.replace(/\//g, "-")}.html`),
		pageContent,
		"utf8",
	);
}
