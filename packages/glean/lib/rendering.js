/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Static documentation site generation using Beak templating.
 *
 * Transform JSON documentation graphs into beautiful HTML documentation
 * sites. Uses Beak for templating and generates complete static sites
 * with navigation, cross-references, and embedded assets.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { html } from "@raven-js/beak";

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
	for (const [moduleId, moduleData] of Object.entries(graph.modules)) {
		await generateModulePage(graph, moduleId, moduleData, outputDir);
	}

	// Generate entity pages
	for (const [entityId, entityData] of Object.entries(graph.entities)) {
		await generateEntityPage(graph, entityId, entityData, outputDir);
	}

	// Copy assets and styles
	await generateAssets(outputDir);
}

/**
 * Generate main index page
 * @param {any} graph - Documentation graph
 * @param {string} outputDir - Output directory
 * @returns {Promise<void>}
 */
export async function generateIndexPage(graph, outputDir) {
	const content = html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>${graph.package.name} Documentation</title>
				<link rel="stylesheet" href="./assets/styles.css" />
			</head>
			<body>
				<header class="header">
					<h1>${graph.package.name}</h1>
					<p class="version">v${graph.package.version}</p>
					${graph.package.description ? html`<p class="description">${graph.package.description}</p>` : ""}
				</header>

				<nav class="navigation">
					<h2>Modules</h2>
					<ul class="module-list">
						${Object.keys(graph.modules)
							.map(
								(moduleId) => html`
									<li><a href="./modules/${moduleId}.html">${moduleId}</a></li>
								`,
							)
							.join("")}
					</ul>
				</nav>

				<main class="main-content">
					<section class="overview">
						<h2>Package Overview</h2>
						<div class="stats">
							<div class="stat">
								<span class="stat-number">${Object.keys(graph.modules).length}</span>
								<span class="stat-label">Modules</span>
							</div>
							<div class="stat">
								<span class="stat-number">${Object.keys(graph.entities).length}</span>
								<span class="stat-label">Entities</span>
							</div>
							<div class="stat">
								<span class="stat-number">${Object.keys(graph.readmes).length}</span>
								<span class="stat-label">READMEs</span>
							</div>
						</div>
					</section>

					${graph.readmes.root ? generateReadmeSection(graph.readmes.root) : ""}
				</main>
			</body>
		</html>
	`;

	await writeFile(join(outputDir, "index.html"), content);
}

/**
 * Generate module documentation page
 * @param {any} graph - Documentation graph
 * @param {string} moduleId - Module identifier
 * @param {any} moduleData - Module data
 * @param {string} outputDir - Output directory
 * @returns {Promise<void>}
 */
export async function generateModulePage(
	graph,
	moduleId,
	moduleData,
	outputDir,
) {
	const moduleEntities = Object.values(graph.entities).filter(
		(entity) => entity.moduleId === moduleId,
	);

	const content = html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>${moduleId} - ${graph.package.name}</title>
				<link rel="stylesheet" href="../assets/styles.css" />
			</head>
			<body>
				<header class="header">
					<h1><a href="../index.html">${graph.package.name}</a></h1>
					<h2>${moduleId}</h2>
				</header>

				<nav class="navigation">
					<a href="../index.html">← Back to Overview</a>
				</nav>

				<main class="main-content">
					<section class="module-info">
						<h3>Module Information</h3>
						<p><strong>Path:</strong> ${moduleData.path}</p>
						${moduleData.exports.length > 0 ? html`<p><strong>Exports:</strong> ${moduleData.exports.join(", ")}</p>` : ""}
						${moduleData.imports.length > 0 ? html`<p><strong>Imports:</strong> ${moduleData.imports.length} dependencies</p>` : ""}
					</section>

					<section class="entities">
						<h3>Entities</h3>
						${moduleEntities.length > 0 ? generateEntityList(moduleEntities) : html`<p>No documented entities found.</p>`}
					</section>
				</main>
			</body>
		</html>
	`;

	const modulesDir = join(outputDir, "modules");
	await mkdir(modulesDir, { recursive: true });
	await writeFile(
		join(modulesDir, `${moduleId.replace(/\//g, "-")}.html`),
		content,
	);
}

/**
 * Generate entity documentation page
 * @param {any} graph - Documentation graph
 * @param {string} entityId - Entity identifier
 * @param {any} entityData - Entity data
 * @param {string} outputDir - Output directory
 * @returns {Promise<void>}
 */
export async function generateEntityPage(
	graph,
	entityId,
	entityData,
	outputDir,
) {
	const content = html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>${entityData.name} - ${graph.package.name}</title>
				<link rel="stylesheet" href="../assets/styles.css" />
			</head>
			<body>
				<header class="header">
					<h1><a href="../index.html">${graph.package.name}</a></h1>
					<h2>${entityData.name}</h2>
					<span class="entity-type">${entityData.type}</span>
				</header>

				<nav class="navigation">
					<a href="../index.html">← Back to Overview</a>
					<a href="../modules/${entityData.moduleId.replace(/\//g, "-")}.html">← Back to Module</a>
				</nav>

				<main class="main-content">
					${generateEntityDetails(entityData)}
				</main>
			</body>
		</html>
	`;

	const entitiesDir = join(outputDir, "entities");
	await mkdir(entitiesDir, { recursive: true });
	await writeFile(
		join(entitiesDir, `${entityId.replace(/\//g, "-")}.html`),
		content,
	);
}

/**
 * Generate entity list HTML
 * @param {any[]} entities - Array of entities
 * @returns {string} HTML string
 */
export function generateEntityList(entities) {
	return html`
		<div class="entity-grid">
			${entities
				.map(
					(entity) => html`
						<div class="entity-card">
							<h4><a href="../entities/${entity.id.replace(/\//g, "-")}.html">${entity.name}</a></h4>
							<span class="entity-type">${entity.type}</span>
							${entity.jsdoc?.description ? html`<p class="entity-description">${entity.jsdoc.description}</p>` : ""}
						</div>
					`,
				)
				.join("")}
		</div>
	`;
}

/**
 * Generate entity details HTML
 * @param {any} entityData - Entity data
 * @returns {string} HTML string
 */
export function generateEntityDetails(entityData) {
	return html`
		<section class="entity-details">
			<div class="entity-meta">
				<p><strong>File:</strong> ${entityData.location.file}</p>
				<p><strong>Line:</strong> ${entityData.location.line}</p>
				${entityData.exports.length > 0 ? html`<p><strong>Export:</strong> ${entityData.exports.join(", ")}</p>` : ""}
			</div>

			${entityData.jsdoc ? generateJSDocSection(entityData.jsdoc) : ""}

			<section class="source-code">
				<h3>Source Code</h3>
				<pre><code>${entityData.source}</code></pre>
			</section>
		</section>
	`;
}

/**
 * Generate JSDoc documentation section
 * @param {any} jsdoc - JSDoc data
 * @returns {string} HTML string
 */
export function generateJSDocSection(jsdoc) {
	return html`
		<section class="jsdoc">
			<h3>Documentation</h3>
			${jsdoc.description ? html`<p class="description">${jsdoc.description}</p>` : ""}

			${
				jsdoc.tags?.param
					? html`
						<div class="parameters">
							<h4>Parameters</h4>
							<ul>
								${jsdoc.tags.param
									.map(
										/** @param {any} param */ (param) => html`
											<li>
												<code>${param.name}</code> <span class="type">{${param.type}}</span>
												${param.description ? html` - ${param.description}` : ""}
											</li>
										`,
									)
									.join("")}
							</ul>
						</div>
					`
					: ""
			}

			${
				jsdoc.tags?.returns
					? html`
						<div class="returns">
							<h4>Returns</h4>
							<p><span class="type">{${jsdoc.tags.returns.type}}</span> ${jsdoc.tags.returns.description}</p>
						</div>
					`
					: ""
			}
		</section>
	`;
}

/**
 * Generate README section HTML
 * @param {any} readmeData - README data
 * @returns {string} HTML string
 */
export function generateReadmeSection(readmeData) {
	// Simple markdown-to-HTML conversion (basic implementation)
	const htmlContent = readmeData.content
		.replace(/^# (.+)$/gm, "<h2>$1</h2>")
		.replace(/^## (.+)$/gm, "<h3>$1</h3>")
		.replace(/^### (.+)$/gm, "<h4>$1</h4>")
		.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
		.replace(/\*(.+?)\*/g, "<em>$1</em>")
		.replace(/`(.+?)`/g, "<code>$1</code>")
		.replace(/\n\n/g, "</p><p>")
		.replace(/^(.+)$/gm, "<p>$1</p>")
		.replace(/<p><h/g, "<h")
		.replace(
			/h[2-4]><\/p>/g,
			/** @param {string} match */ (match) => match.replace("></p>", ">"),
		);

	return html`
		<section class="readme">
			<h2>README</h2>
			<div class="readme-content">${htmlContent}</div>
		</section>
	`;
}

/**
 * Generate CSS styles and assets
 * @param {string} outputDir - Output directory
 * @returns {Promise<void>}
 */
export async function generateAssets(outputDir) {
	const assetsDir = join(outputDir, "assets");
	await mkdir(assetsDir, { recursive: true });

	const css = `
/* Glean Documentation Styles */
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	line-height: 1.6;
	color: #333;
	background: #fafafa;
}

.header {
	background: #2c3e50;
	color: white;
	padding: 2rem;
	border-bottom: 3px solid #34495e;
}

.header h1 {
	font-size: 2.5rem;
	margin-bottom: 0.5rem;
}

.header h1 a {
	color: white;
	text-decoration: none;
}

.header .version {
	color: #bdc3c7;
	font-size: 1.1rem;
}

.header .description {
	color: #ecf0f1;
	margin-top: 1rem;
}

.navigation {
	background: white;
	padding: 1rem 2rem;
	border-bottom: 1px solid #e1e8ed;
}

.navigation a {
	color: #3498db;
	text-decoration: none;
	margin-right: 1rem;
}

.navigation a:hover {
	text-decoration: underline;
}

.module-list {
	list-style: none;
	margin-top: 1rem;
}

.module-list li {
	margin-bottom: 0.5rem;
}

.main-content {
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
}

.stats {
	display: flex;
	gap: 2rem;
	margin: 2rem 0;
}

.stat {
	text-align: center;
	padding: 1rem;
	background: white;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-number {
	display: block;
	font-size: 2rem;
	font-weight: bold;
	color: #3498db;
}

.stat-label {
	display: block;
	color: #7f8c8d;
	margin-top: 0.5rem;
}

.entity-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
}

.entity-card {
	background: white;
	padding: 1.5rem;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.entity-card h4 {
	margin-bottom: 0.5rem;
}

.entity-card a {
	color: #2c3e50;
	text-decoration: none;
}

.entity-card a:hover {
	color: #3498db;
}

.entity-type {
	background: #3498db;
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.8rem;
	text-transform: uppercase;
}

.entity-description {
	margin-top: 1rem;
	color: #7f8c8d;
}

.jsdoc {
	background: white;
	padding: 2rem;
	border-radius: 8px;
	margin-bottom: 2rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.jsdoc .description {
	font-size: 1.1rem;
	margin-bottom: 1.5rem;
}

.parameters ul, .returns {
	margin-top: 1rem;
}

.parameters li {
	margin-bottom: 0.5rem;
}

.type {
	color: #27ae60;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.9rem;
}

.source-code {
	background: white;
	padding: 2rem;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.source-code pre {
	background: #2c3e50;
	color: #ecf0f1;
	padding: 1rem;
	border-radius: 4px;
	overflow-x: auto;
}

.source-code code {
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.9rem;
}

.readme {
	background: white;
	padding: 2rem;
	border-radius: 8px;
	margin-top: 2rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.readme-content h2, .readme-content h3, .readme-content h4 {
	margin: 1.5rem 0 1rem 0;
	color: #2c3e50;
}

.readme-content p {
	margin-bottom: 1rem;
}

.readme-content code {
	background: #f8f9fa;
	padding: 0.2rem 0.4rem;
	border-radius: 3px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.9rem;
}
`;

	await writeFile(join(assetsDir, "styles.css"), css);
}
