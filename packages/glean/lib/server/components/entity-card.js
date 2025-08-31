/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Entity card component for API documentation
 *
 * Bootstrap-based entity cards using utility classes and proper grid.
 * Surgical design eliminating custom CSS through semantic Bootstrap patterns.
 */

import { html, markdownToHTML, markdownToText, safeHtml } from "@raven-js/beak";
import { createEntityAttribution } from "../../extract/models/attribution.js";
import { attributionBar } from "./attribution-bar.js";
import { seeAlsoLinks } from "./see-links.js";

/**
 * Generate entity card for grid display with attribution and location information.
 *
 * @param {Object} options - Entity card options
 * @param {string} options.name - Entity name
 * @param {string} options.type - Entity type
 * @param {string} [options.description] - Entity description
 * @param {string} options.link - Link to entity page
 * @param {Array<{text: string, variant: string}>} [options.badges] - Entity badges
 * @param {Object} [options.location] - Source location
 * @param {string} [options.location.file] - Source file
 * @param {number} [options.location.line] - Source line
 * @param {boolean} [options.showFooter] - Whether to show card footer
 * @param {Object} [options.entity] - Full entity object with JSDoc tags for attribution
 * @param {Object} [options.packageMetadata] - Package metadata for attribution
 * @param {Array<Object>} [options.allModules] - All modules for re-export tracing
 * @returns {string} Entity card HTML
 *
 * @example
 * // Basic entity card
 * entityCard({
 *   name: 'myFunction',
 *   type: 'function',
 *   description: 'A utility function',
 *   link: '/api/myFunction'
 * });
 */
export function entityCard({
	name,
	type,
	description,
	link,
	badges = [],
	location,
	showFooter = true,
	entity = null,
	packageMetadata = null,
	allModules = null,
}) {
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

	const typeVariant = typeVariantMap[type] || "secondary";
	const typeBadge = { text: type, variant: typeVariant };
	const allBadges = [typeBadge, ...badges];

	// Create attribution context if entity data is provided
	const attributionContext = entity
		? createEntityAttribution(
				/** @type {any} */ (entity),
				packageMetadata,
				/** @type {any} */ (allModules),
			)
		: null;

	return html`
		<div class="card border h-100">
			<div class="card-body p-3 d-flex flex-column">
				<div class="d-flex align-items-start justify-content-between mb-2">
					<h5 class="card-title mb-0">
						<a href="${link}" class="text-decoration-none">${name}</a>
					</h5>
					<div class="d-flex gap-1 flex-wrap">
						${allBadges.map(
							(badge) => html`
						<span class="badge bg-${badge.variant}${badge.variant === "light" ? " text-dark" : ""}">${badge.text}</span>
						`,
						)}
					</div>
				</div>
				${
					description
						? html`
				<div class="card-text text-muted small mb-0 flex-grow-1">
					${markdownToHTML(description)}
				</div>
				`
						: html`
				<p class="card-text text-muted small fst-italic mb-0 flex-grow-1">
					No description available
				</p>
				`
				}
				${attributionContext ? attributionBar(attributionContext) : ""}
				${attributionContext ? seeAlsoLinks(attributionContext, true) : ""}
			</div>
			${
				showFooter
					? html`
			<div class="card-footer bg-light border-top-0 p-2">
				<div class="d-flex gap-2 align-items-center">
					<a href="${link}" class="btn btn-primary btn-sm flex-fill">
						📖 View Details
					</a>
					${
						location
							? html`
					<small class="text-muted">
						${location.file}:${location.line}
					</small>
					`
							: ""
					}
				</div>
			</div>
			`
					: ""
			}
		</div>
	`;
}

/**
 * Generate module card for module directory
 * @param {Object} module - Module information
 * @param {string} module.importPath - Module import path
 * @param {boolean} [module.isDefault] - Whether module is default export
 * @param {string} [module.description] - Module description
 * @param {number} module.publicEntityCount - Number of public entities
 * @returns {string} Module card HTML
 */
export function moduleCard({
	importPath,
	isDefault = false,
	description,
	publicEntityCount,
}) {
	const moduleName = importPath.split("/").pop() || "index";

	return html`
		<div class="card border-0 shadow-sm h-100">
			<!-- Module Header -->
			<div class="card-header bg-white border-bottom-0 pb-0">
				<div class="d-flex align-items-center justify-content-between">
					<div>
						<h5 class="card-title mb-1">
							${isDefault ? html`<span class="badge bg-primary me-2">default</span>` : ""}
							<a href="/modules/${moduleName}/" class="text-decoration-none">
								${moduleName}
							</a>
						</h5>
						<div class="small text-muted">${importPath}</div>
					</div>
					<div class="text-end">
						<span class="badge bg-secondary">${publicEntityCount}</span>
						<div class="small text-muted">APIs</div>
					</div>
				</div>
			</div>

			<!-- Module Content -->
			<div class="card-body pt-3 d-flex flex-column">
				${
					description
						? html`
				<div class="mb-3 flex-grow-1">
					<div class="text-muted mb-0">
						${(() => {
							const descText = markdownToText(description);
							return descText.length > 1000
								? safeHtml`${descText.slice(0, 1000).trim()}...`
								: safeHtml`${descText}`;
						})()}
					</div>
				</div>
				`
						: html`
				<div class="mb-3 flex-grow-1">
					<div class="small text-muted fst-italic">No description available</div>
				</div>
				`
				}
			</div>

			<!-- Module Footer -->
			<div class="card-footer bg-white border-top-0 pt-0 mt-auto">
				<div class="d-flex gap-2">
					<a href="/modules/${moduleName}/" class="btn btn-primary btn-sm flex-fill">
						📖 Explore Module
					</a>
				</div>
			</div>
		</div>
	`;
}
