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
 * Renders responsive grid of module cards with metadata, sample entities,
 * and directory statistics using Bootstrap 5 components. Follows WEBAPP.md
 * specification for module directory presentation.
 */

import { html } from "@raven-js/beak";
import {
	cardGrid,
	contentSection,
	gettingStarted,
	moduleCard,
	pageHeader,
	statsCard,
} from "../components/index.js";
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

	// Generate directory statistics
	const directoryStatsData = [
		{
			value: directoryStats.totalModules,
			label: `Total Module${directoryStats.totalModules !== 1 ? "s" : ""}`,
			variant: "primary",
		},
		{
			value: directoryStats.totalPublicEntities,
			label: `Public API${directoryStats.totalPublicEntities !== 1 ? "s" : ""}`,
			variant: "success",
		},
		{
			value: Object.keys(directoryStats.entityTypeDistribution).length,
			label: `Entity Type${Object.keys(directoryStats.entityTypeDistribution).length !== 1 ? "s" : ""}`,
			variant: "info",
		},
		{
			value: `${Math.round((directoryStats.totalPublicEntities / Object.values(directoryStats.entityTypeDistribution).reduce((sum, count) => sum + count, 0)) * 100) || 0}%`,
			label: "Public Coverage",
			variant: "warning",
		},
	];

	// Generate main content
	const content = html`
		${pageHeader({
			title: "📦 Modules",
			subtitle: `Explore the ${directoryStats.totalModules} module${directoryStats.totalModules !== 1 ? "s" : ""} in ${packageName}`,
			badges,
		})}

		<!-- Directory Statistics -->
		${hasModules ? statsCard({ stats: directoryStatsData }) : ""}

		<!-- Module Grid -->
		${
			hasModules
				? contentSection({
						title: "Available Modules",
						icon: "📚",
						content: cardGrid({
							items: moduleList.map(
								/** @param {any} module */ (module) =>
									moduleCard({
										name: module.importPath.split("/").pop() || "index",
										importPath: module.importPath,
										isDefault: module.isDefault,
										description: module.hasDescription
											? module.description
											: undefined,
										readmePreview: module.hasReadme
											? module.readmePreview
											: undefined,
										publicEntityCount: module.publicEntityCount,
										entityTypes: module.entityTypes,
										sampleEntities: module.sampleEntities,
									}),
							),
							columns: 3,
						}),
					})
				: contentSection({
						title: "No Modules Available",
						icon: "📭",
						content: html`
				<div class="text-center py-5">
					<div class="display-1 mb-3">📭</div>
					<h3 class="text-muted mb-3">No Modules Available</h3>
					<p class="text-muted">
						This package doesn't contain any modules yet.
						${packageDescription ? html`<br/>Package: ${packageDescription}` : ""}
					</p>
				</div>
			`,
					})
		}

		<!-- Entity Type Distribution -->
		${
			hasModules &&
			Object.keys(directoryStats.entityTypeDistribution).length > 0
				? contentSection({
						title: "Entity Type Distribution",
						icon: "📊",
						content: html`
				<div class="row g-3">
					${Object.entries(directoryStats.entityTypeDistribution).map(
						/** @param {[string, number]} entry */ ([type, count]) => html`
					<div class="col-md-6 col-lg-4">
						<div class="d-flex align-items-center justify-content-between p-3 bg-light rounded">
							<div>
								<span class="badge bg-primary me-2">${type}</span>
								<span class="fw-medium">${count} entit${count !== 1 ? "ies" : "y"}</span>
							</div>
							<div class="text-muted">
								${Math.round((count / Object.values(directoryStats.entityTypeDistribution).reduce((sum, c) => sum + c, 0)) * 100)}%
							</div>
						</div>
					</div>
					`,
					)}
				</div>
			`,
					})
				: ""
		}

		<!-- Getting Started -->
		${
			hasModules
				? gettingStarted({
						packageName,
						actions: [
							{
								href: "/",
								text: "📋 Package Overview",
								variant: "outline-primary",
							},
							{
								href: "/sitemap.xml",
								text: "🗺️ Sitemap",
								variant: "outline-info",
							},
						],
					})
				: ""
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
	});
}
