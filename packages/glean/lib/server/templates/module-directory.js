/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Module directory template for /modules/ route
 *
 * Renders responsive grid of simplified module cards with clean metadata
 * using Bootstrap 5 components. Follows WEBAPP.md specification for
 * module directory presentation.
 */

import { html } from "@raven-js/beak";
import { cardGrid, moduleCard, pageHeader } from "../components/index.js";
import { baseTemplate } from "./base.js";

/**
 * Generate module directory HTML page
 * @param {Object} data - Module directory data from extractor
 * @param {Array<Object>} data.moduleList - Array of module information
 * @param {Object} data.directoryStats - Directory statistics
 * @param {number} data.directoryStats.totalModules - Total number of modules
 * @param {number} data.directoryStats.totalPublicEntities - Total public entities
 * @param {Object<string, number>} data.directoryStats.entityTypeDistribution - Entity type counts
 * @param {string} data.packageName - Package name
 * @param {string} data.packageDescription - Package description
 * @param {boolean} data.hasModules - Whether modules exist
 * @param {boolean} data.hasPublicEntities - Whether public entities exist
 * @returns {string} Complete HTML page
 */
export function moduleDirectoryTemplate(data) {
	const {
		moduleList,
		directoryStats,
		packageName,
		packageDescription,
		hasModules,
	} = data;

	// Generate header badges
	const badges = [
		{
			text: `${directoryStats.totalPublicEntities} Public APIs`,
			variant: "primary",
		},
	];

	// Generate main content
	const content = html`
		${pageHeader({
			title: "📦 Modules",
			subtitle: `Explore the ${directoryStats.totalModules} module${directoryStats.totalModules !== 1 ? "s" : ""} in ${packageName}`,
			badges,
		})}



		<!-- Module Grid -->
		${
			hasModules
				? cardGrid({
						items: moduleList.map(
							/** @param {any} module */ (module) =>
								moduleCard({
									importPath: module.importPath,
									isDefault: module.isDefault,
									description: module.hasDescription
										? module.description
										: undefined,
									publicEntityCount: module.publicEntityCount,
								}),
						),
						columns: 3,
					})
				: html`
				<div class="text-center py-5">
					<div class="display-1 mb-3">📭</div>
					<h3 class="text-muted mb-3">No Modules Available</h3>
					<p class="text-muted">
						This package doesn't contain any modules yet.
						${packageDescription ? html`<br/>Package: ${packageDescription}` : ""}
					</p>
				</div>
				`
		}




	`;

	// Return complete HTML page using base template
	return baseTemplate({
		title: "Modules",
		description: `Browse ${directoryStats.totalModules} modules in ${packageName} with ${directoryStats.totalPublicEntities} public APIs`,
		packageName,
		content,
		navigation: {
			current: "modules",
		},
		seo: {
			url: "", // Will be filled by route handler
		},
		packageMetadata: /** @type {any} */ (data).packageMetadata,
		generationTimestamp: /** @type {any} */ (data).generationTimestamp,
	});
}
