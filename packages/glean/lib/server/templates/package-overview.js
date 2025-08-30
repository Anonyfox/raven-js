/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Package overview template for documentation homepage
 *
 * Renders package information, README content, module navigation,
 * and statistics using Bootstrap 5 components. Follows WEBAPP.md
 * content specification for package overview pages.
 */

import { html, markdownToHTML } from "@raven-js/beak";
import {
	contentSection,
	gettingStarted,
	moduleNavigation,
	pageHeader,
	statsSidebar,
} from "../components/index.js";
import { baseTemplate } from "./base.js";

/**
 * Generate package overview HTML page
 * @param {Object} data - Package overview data from extractor
 * @param {string} data.name - Package name
 * @param {string} data.version - Package version
 * @param {string} data.description - Package description
 * @param {string} data.readmeMarkdown - README markdown content
 * @param {Array<Object>} data.modules - Module information array
 * @param {Object} data.stats - Package statistics
 * @param {number} data.stats.moduleCount - Number of modules
 * @param {number} data.stats.entityCount - Number of entities
 * @param {number} data.stats.publicEntityCount - Number of public entities
 * @param {boolean} data.hasReadme - Whether README content exists
 * @param {boolean} data.hasModules - Whether modules exist
 * @param {boolean} data.hasPublicEntities - Whether public entities exist
 * @returns {string} Complete HTML page
 */
export function packageOverviewTemplate(data) {
	const {
		name,
		version,
		description,
		readmeMarkdown,
		modules,
		stats,
		hasReadme,
		hasModules,
		hasPublicEntities,
	} = data;

	// Generate header badges
	const badges = [];
	if (version) {
		badges.push({ text: `v${version}`, variant: "secondary" });
	}

	// Generate package statistics for inline display
	const packageStatsDisplay = html`
		<div class="d-flex gap-3 flex-wrap">
			<div class="text-center">
				<div class="fs-4 fw-bold text-primary">${stats.moduleCount}</div>
				<div class="small text-muted">Module${stats.moduleCount !== 1 ? "s" : ""}</div>
			</div>
			<div class="text-center">
				<div class="fs-4 fw-bold text-success">${stats.publicEntityCount}</div>
				<div class="small text-muted">Public API${stats.publicEntityCount !== 1 ? "s" : ""}</div>
			</div>
			<div class="text-center">
				<div class="fs-4 fw-bold text-info">${stats.entityCount}</div>
				<div class="small text-muted">Total Entit${stats.entityCount !== 1 ? "ies" : "y"}</div>
			</div>
		</div>
	`;

	// Generate main content
	const content = html`
		${pageHeader({
			title: name,
			subtitle: description ? markdownToHTML(description) : undefined,
			badges,
			description: packageStatsDisplay,
		})}

		<!-- Quick Navigation -->
		${
			hasModules
				? contentSection({
						title: "Documentation",
						icon: "📚",
						headerVariant: "light",
						content: html`
				<div class="d-flex gap-2 flex-wrap">
					<a href="/modules/" class="btn btn-primary btn-sm">📖 Browse All Modules</a>
					${hasPublicEntities ? html`<a href="/sitemap.xml" class="btn btn-outline-secondary btn-sm">🗺️ Sitemap</a>` : ""}
				</div>
			`,
					})
				: ""
		}

		<!-- Main Content Area -->
		<div class="row">
			<!-- README Content -->
			<div class="${hasModules ? "col-lg-8" : "col-12"} mb-4">
				${
					hasReadme
						? contentSection({
								title: "Documentation",
								icon: "📄",
								content: html`<div class="readme-content">${markdownToHTML(readmeMarkdown)}</div>`,
							})
						: contentSection({
								title: "No README Available",
								icon: "📄",
								content: html`
						<div class="text-center py-5">
							<div class="display-1 mb-3">📄</div>
							<h5 class="mt-3">No README Available</h5>
							<p class="text-muted">This package doesn't have README documentation.</p>
						</div>
					`,
							})
				}
			</div>

			<!-- Module Navigation Sidebar -->
			${
				hasModules
					? html`
			<div class="col-lg-4">
				<div class="mb-4">
					${moduleNavigation({
						modules: modules.map(
							/** @param {any} module */ (module) => ({
								name: module.name.split("/").pop() || "index",
								link: `/modules/${module.name.split("/").pop()}/`,
								entityCount: module.publicEntityCount,
								fullImportPath: module.name,
								isDefault: module.isDefault,
								availableTypes: module.availableTypes,
							}),
						),
						title: "🗂️ Modules",
					})}
				</div>

				<!-- Package Statistics -->
				<div class="mb-4">
					${statsSidebar({
						stats: [
							{
								value: stats.moduleCount,
								label: "Modules",
								variant: "primary",
							},
							{
								value: stats.publicEntityCount,
								label: "Public",
								variant: "success",
							},
							{ value: stats.entityCount, label: "Total", variant: "info" },
							{
								value: `${Math.round((stats.publicEntityCount / stats.entityCount) * 100) || 0}%`,
								label: "Coverage",
								variant: "warning",
							},
						],
						title: "📊 Package Statistics",
					})}
				</div>
			</div>
			`
					: ""
			}
		</div>

		<!-- Getting Started Section -->
		${
			hasModules
				? gettingStarted({
						packageName: name,
						actions: [
							{
								href: "/modules/",
								text: "Explore Modules",
								variant: "primary",
							},
						],
					})
				: ""
		}
	`;

	// Generate complete page using base template
	return baseTemplate({
		title: `${name} Documentation`,
		description: description || `Documentation for ${name}`,
		packageName: name,
		content,
		navigation: {
			current: "overview",
		},
		seo: {
			url: "", // Will be filled by route handler
		},
	});
}
