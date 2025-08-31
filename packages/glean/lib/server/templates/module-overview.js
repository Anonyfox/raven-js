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
 * Renders individual module documentation with optimized content flow:
 * module description as lead text, API reference first, then README,
 * and attribution at the bottom. Uses Bootstrap 5 components.
 * Follows WEBAPP.md specification for module overview presentation.
 */

import { html, markdownToHTML, safeHtml } from "@raven-js/beak";
import { createModuleAttribution } from "../../extract/models/attribution.js";
import {
	applySyntaxHighlighting,
	attributionBar,
	contentSection,
	pageHeader,
	seeAlsoLinks,
} from "../components/index.js";
import { baseTemplate } from "./base.js";

/**
 * Properly pluralize entity type names
 * @param {string} type - Entity type
 * @param {number} count - Entity count
 * @returns {string} Properly pluralized type name
 */
function pluralizeType(type, count) {
	if (count === 1) return type;

	// Handle special cases
	/** @type {{[key: string]: string}} */
	const pluralMap = {
		class: "classes",
		function: "functions",
		variable: "variables",
		typedef: "typedefs",
		callback: "callbacks",
	};

	return pluralMap[type] || `${type}s`;
}

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
 * @returns {string} Complete HTML page
 */
export function moduleOverviewTemplate(data) {
	const { module, organizedEntities, stats, packageName, hasEntities } =
		/** @type {any} */ (data);

	// Process README content through beak markdown processor and apply syntax highlighting
	const readmeHTML = module.hasReadme
		? applySyntaxHighlighting(markdownToHTML(module.readme))
		: "";

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

	// Create module-level attribution context
	let moduleAttributionContext = null;
	try {
		const moduleEntities = /** @type {any} */ (data).moduleEntities || [];
		const packageMetadata = /** @type {any} */ (data).packageMetadata;
		if (moduleEntities.length > 0) {
			moduleAttributionContext = createModuleAttribution(
				moduleEntities,
				packageMetadata,
				/** @type {any} */ (data).allModules, // Pass all modules for re-export tracing
			);
		}
	} catch (_error) {
		// Silently fail if attribution creation fails
		moduleAttributionContext = null;
	}

	// Generate main content
	const content = html`
		${pageHeader({
			title: module.name,
			breadcrumbs,
			badges,
		})}

		<!-- Module Description -->
		${
			module.description
				? html`
		<div class="lead text-muted mb-4">
			${markdownToHTML(module.description)}
		</div>
		`
				: ""
		}

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

		<!-- API Reference Section -->
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
									${pluralizeType(type, entities.length).toUpperCase()} (${entities.length})
								</h4>
								<div class="list-group list-group-flush">
									${entities.map(
										(entity) => html`
										<div class="list-group-item d-flex justify-content-between align-items-start">
											<div class="flex-grow-1 me-3">
												<div class="d-flex align-items-center mb-2">
													<h5 class="mb-0 me-2">
														<a href="${safeHtml`${entity.link}`}" class="text-decoration-none">${safeHtml`${entity.name}`}</a>
													</h5>
													<span class="badge bg-${getTypeVariant(entity.entityType || type)} me-2">${safeHtml`${entity.entityType || type}`}</span>
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
												<a href="${safeHtml`${entity.link}`}" class="btn btn-outline-primary btn-sm">
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

		<!-- README Section -->
		${
			module.hasReadme
				? contentSection({
						title: "📚 Documentation",
						content: readmeHTML,
					})
				: ""
		}

		<!-- Module Attribution -->
		${
			moduleAttributionContext?.hasAttribution
				? html`
		<div class="card border-info mb-4">
			<div class="card-body py-2">
				${attributionBar(moduleAttributionContext)}
				${seeAlsoLinks(moduleAttributionContext)}
			</div>
		</div>
		`
				: ""
		}


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
				/** @type {any} */ (data).navigation.allModules.length > 1
					? html`
				<h6 class="fw-bold mb-3">Module Navigation</h6>
				<ul class="nav nav-pills flex-column">
					${
						/** @type {any} */ (data).navigation.allModules.map(
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
						)
					}
				</ul>
				`
					: "",
		},
		seo: {
			url: "", // Will be filled by route handler
		},
		packageMetadata: /** @type {any} */ (data).packageMetadata,
		generationTimestamp: /** @type {any} */ (data).generationTimestamp,
	});
}
