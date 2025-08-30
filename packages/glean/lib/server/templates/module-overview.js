/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Module overview template for /modules/{moduleName}/ route
 *
 * Renders individual module documentation with entity organization,
 * metadata badges, and navigation context using Bootstrap 5 components.
 * Follows WEBAPP.md specification for module overview presentation.
 */

import { html, markdownToHTML } from "@raven-js/beak";
import { contentSection, pageHeader } from "../components/index.js";
import { baseTemplate } from "./base.js";

/**
 * Get Bootstrap variant class for entity type badge
 * @param {string} entityType - The entity type (function, class, etc.)
 * @returns {string} Bootstrap variant class
 */
function getTypeVariant(entityType) {
	/** @type {Record<string, string>} */
	const typeVariantMap = {
		function: "primary",
		class: "success",
		typedef: "info",
		interface: "warning",
		enum: "secondary",
		constant: "dark",
		variable: "light",
	};
	return typeVariantMap[entityType] || "secondary";
}

/**
 * Generate module overview HTML page
 * @param {Object} data - Module overview data from extractor
 * @param {Object} data.module - Module metadata
 * @param {string} data.module.name - Module name
 * @param {string} data.module.fullName - Full import path
 * @param {boolean} data.module.isDefault - Whether module is default
 * @param {string} data.module.readme - README markdown content
 * @param {boolean} data.module.hasReadme - Whether README exists
 * @param {number} data.module.entityCount - Number of entities
 * @param {Array<string>} data.module.availableTypes - Available entity types
 * @param {Object<string, Array<Object>>} data.organizedEntities - Entities organized by type
 * @param {Object} data.navigation - Navigation context
 * @param {Array<Object>} data.navigation.allModules - All modules for navigation
 * @param {Object} data.stats - Module statistics
 * @param {number} data.stats.totalEntities - Total entity count
 * @param {Object<string, number>} data.stats.entitiesByType - Entity counts by type
 * @param {number} data.stats.deprecatedCount - Deprecated entity count
 * @param {number} data.stats.withExamplesCount - Entity count with examples
 * @param {string} data.packageName - Package name
 * @param {boolean} data.hasEntities - Whether module has entities
 * @param {boolean} data.hasDeprecatedEntities - Whether module has deprecated entities
 * @param {boolean} data.hasExampleEntities - Whether module has entities with examples
 * @returns {string} Complete HTML page
 */
export function moduleOverviewTemplate(data) {
	const {
		module,
		organizedEntities,
		navigation,
		stats,
		packageName,
		hasEntities,
	} = data;

	// Process README content through beak markdown processor
	const readmeHTML = module.hasReadme ? markdownToHTML(module.readme) : "";

	// Generate breadcrumbs
	const breadcrumbs = [
		{ href: "/", text: `📦 ${packageName}` },
		{ href: "/modules/", text: "Modules" },
		{ text: module.name, active: true },
	];

	// Generate header badges
	const badges = [
		{
			text: `${stats.totalEntities} Entit${stats.totalEntities !== 1 ? "ies" : "y"}`,
			variant: "secondary",
		},
	];
	if (module.isDefault) {
		badges.unshift({ text: "default", variant: "primary" });
	}

	// Generate main content
	const content = html`
		${pageHeader({
			title: module.name,
			subtitle: html`<code class="bg-light px-2 py-1 rounded">${module.fullName}</code>`,
			breadcrumbs,
			badges,
		})}

		<!-- Import Statement -->
		<div class="card border-primary mb-4">
			<div class="card-header bg-primary text-white">
				<h5 class="mb-0">📦 Import</h5>
			</div>
			<div class="card-body">
				<div class="d-flex align-items-center gap-3">
					<div class="flex-grow-1">
						<div class="input-group">
							<input type="text" class="form-control font-monospace" value="import { /* ... */ } from '${module.fullName}';" readonly id="import-${module.name}">
							<button class="btn btn-outline-primary" type="button" onclick="copyImportStatement('import-${module.name}')" title="Copy import statement">
								📋 Copy
							</button>
						</div>
					</div>
					${
						hasEntities
							? html`
					<div class="text-center">
						<div class="fw-bold text-primary">${stats.totalEntities}</div>
						<small class="text-muted">Export${stats.totalEntities !== 1 ? "s" : ""}</small>
					</div>
					`
							: ""
					}
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="mb-4">
				<!-- README Section -->
				${
					module.hasReadme
						? contentSection({
								title: "📚 Documentation",
								content: readmeHTML,
							})
						: ""
				}

				<!-- Entity Sections -->
				${
					hasEntities
						? contentSection({
								title: "🔧 API Reference",
								content: Object.entries(organizedEntities)
									.map(
										/** @param {[string, Array<any>]} entry */
										([type, entities]) => {
											return html`
								<div class="mb-4">
									<h4 class="h6 fw-bold text-uppercase text-muted mb-3">
										${type.toUpperCase()}${entities.length !== 1 ? "S" : ""} (${entities.length})
									</h4>
									<div class="list-group list-group-flush">
										${entities.map(
											(entity) => html`
											<div class="list-group-item d-flex justify-content-between align-items-start">
												<div class="flex-grow-1 me-3">
													<div class="d-flex align-items-center mb-2">
														<h5 class="mb-0 me-2">
															<a href="${entity.link}" class="text-decoration-none">${entity.name}</a>
														</h5>
														<span class="badge bg-${getTypeVariant(entity.entityType || type)} me-2">${entity.entityType || type}</span>
														${entity.isDeprecated ? html`<span class="badge bg-warning">deprecated</span>` : ""}
														${entity.hasExamples ? html`<span class="badge bg-success">examples</span>` : ""}
													</div>
													${
														entity.description
															? html`
														<div class="text-muted mb-2">
															${markdownToHTML(entity.description)}
														</div>
													`
															: html`
														<div class="text-muted fst-italic mb-2">No description available</div>
													`
													}
												</div>
												<div class="flex-shrink-0">
													<a href="${entity.link}" class="btn btn-outline-primary btn-sm">
														📖 View
													</a>
												</div>
											</div>
										`,
										)}
									</div>
								</div>
							`;
										},
									)
									.join(""),
							})
						: html`
					<div class="text-center py-5">
						<div class="display-1 mb-3">📭</div>
						<h3 class="text-muted mb-3">No Public Entities</h3>
						<p class="text-muted">
							This module doesn't export any public APIs.
							${module.hasReadme ? "Check the documentation above for usage information." : ""}
						</p>
					</div>
				`
				}
		</div>


	`;

	// Return complete HTML page using base template
	return baseTemplate({
		title: module.name,
		description: `Documentation for ${module.fullName} module in ${packageName}${module.hasReadme ? "" : ` - ${stats.totalEntities} entities`}`,
		packageName,
		content,
		navigation: {
			current: "modules",
			sidebar:
				navigation.allModules.length > 1
					? html`
				<h6 class="fw-bold mb-3">Module Navigation</h6>
				<ul class="nav nav-pills flex-column">
					${navigation.allModules.map(
						/** @param {any} navModule */
						(navModule) => html`
					<li class="nav-item">
						<a
							href="${navModule.link}"
							class="nav-link ${navModule.isCurrent ? "active" : ""}"
						>
							${navModule.isDefault ? "📦 " : "📄 "}${navModule.name}
						</a>
					</li>
					`,
					)}
				</ul>
				`
					: "",
		},
		seo: {
			url: "", // Will be filled by route handler
		},
	});
}
