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
 * Assembles complete HTML pages from content rendering components.
 * Handles index pages, module pages, and individual entity pages
 * with proper navigation and structure.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { html } from "@raven-js/beak";
import {
	generateEntityDetails,
	generateEntityList,
	generateReadmeSection,
} from "./content-rendering.js";

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
																										${(
																											graph.modules instanceof
																											Map
																												? Array.from(
																														graph.modules.keys(),
																													)
																												: Object.keys(
																														graph.modules,
																													)
																										).map(
																											(moduleId) => html`
									<li><a href="./modules/${moduleId}.html">${moduleId}</a></li>
								`,
																										)}
																					.join("")}
					</ul>
				</nav>

				<main class="main-content">
					<section class="overview">
						<h2>Package Overview</h2>
						<div class="stats">
							<div class="stat">
																						<span class="stat-number">${graph.modules instanceof Map ? graph.modules.size : Object.keys(graph.modules).length}</span>
								<span class="stat-label">Modules</span>
							</div>
							<div class="stat">
																						<span class="stat-number">${graph.entities instanceof Map ? graph.entities.size : Object.keys(graph.entities).length}</span>
								<span class="stat-label">Entities</span>
							</div>
							<div class="stat">
																						<span class="stat-number">${graph.content instanceof Map ? graph.content.size : graph.content ? Object.keys(graph.content).length : 0}</span>
								<span class="stat-label">READMEs</span>
							</div>
						</div>
					</section>

					${graph.readmes.root ? generateReadmeSection(graph.readmes.root) : ""}
				</main>
			</body>
		</html>
	`;

	await mkdir(outputDir, { recursive: true });
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
	await mkdir(outputDir, { recursive: true });
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
	await mkdir(outputDir, { recursive: true });
	await mkdir(entitiesDir, { recursive: true });
	await writeFile(
		join(entitiesDir, `${entityId.replace(/\//g, "-")}.html`),
		content,
	);
}
