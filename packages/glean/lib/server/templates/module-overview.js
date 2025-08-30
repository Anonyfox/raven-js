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
import {
	cardGrid,
	contentSection,
	entityCard,
	moduleNavigation,
	pageHeader,
	quickActions,
	statsCard,
} from "../components/index.js";
import { baseTemplate } from "./base.js";

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
		hasDeprecatedEntities,
		hasExampleEntities,
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

		<!-- Module Statistics -->
		${
			hasEntities
				? (
						() => {
							const moduleStatsData = [
								{
									value: stats.totalEntities,
									label: `Total Entit${stats.totalEntities !== 1 ? "ies" : "y"}`,
									variant: "primary",
								},
								{
									value: Object.keys(stats.entitiesByType).length,
									label: `Entity Type${Object.keys(stats.entitiesByType).length !== 1 ? "s" : ""}`,
									variant: "info",
								},
							];
							if (hasDeprecatedEntities) {
								moduleStatsData.push({
									value: stats.deprecatedCount,
									label: "Deprecated",
									variant: "warning",
								});
							}
							if (hasExampleEntities) {
								moduleStatsData.push({
									value: stats.withExamplesCount,
									label: "With Examples",
									variant: "success",
								});
							}
							return statsCard({ stats: moduleStatsData });
						}
					)()
				: ""
		}

		<div class="row">
			<!-- Main Content -->
			<div class="${navigation.allModules.length > 1 ? "col-lg-8" : "col-12"} mb-4">
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
											const entityCards = entities.map((entity) =>
												entityCard({
													name: entity.name,
													type: entity.entityType || type,
													description: entity.description,
													link: entity.link,
													badges: [
														{
															text: entity.entityType || type,
															variant: "secondary",
														},
														...(entity.isDeprecated
															? [{ text: "deprecated", variant: "warning" }]
															: []),
														...(entity.hasExamples
															? [{ text: "examples", variant: "success" }]
															: []),
														...(entity.hasParams
															? [{ text: "params", variant: "info" }]
															: []),
														...(entity.hasReturns
															? [{ text: "returns", variant: "primary" }]
															: []),
													],
													location: entity.location,
												}),
											);
											return html`
								<div class="mb-4">
									<h4 class="h6 fw-bold text-uppercase text-muted mb-3">
										${type.toUpperCase()}${entities.length !== 1 ? "S" : ""} (${entities.length})
									</h4>
									${cardGrid({
										items: entityCards,
										columns: 2,
									})}
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

			<!-- Navigation Sidebar -->
			${
				navigation.allModules.length > 1
					? html`
				<div class="col-lg-4">
					${moduleNavigation({ modules: navigation.allModules })}
					${quickActions({
						actions: [
							{
								href: "/modules/",
								icon: "📦",
								text: "Browse All Modules",
								variant: "outline-primary",
							},
							...(hasEntities
								? [
										{
											href: `/api/?search=${encodeURIComponent(module.fullName)}`,
											icon: "🔍",
											text: "Search This Module",
											variant: "outline-secondary",
										},
									]
								: []),
							{
								href: "/",
								icon: "🏠",
								text: "Package Overview",
								variant: "outline-info",
							},
						],
					})}
				</div>
			`
					: ""
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
