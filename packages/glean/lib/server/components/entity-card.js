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

import { html, markdownToHTML, safeHtml } from "@raven-js/beak";

/**
 * Generate entity card for grid display
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
 * @returns {string} Entity card HTML
 */
export function entityCard({
	name,
	type,
	description,
	link,
	badges = [],
	location,
	showFooter = true,
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
 * @param {string} module.name - Module name
 * @param {string} module.importPath - Module import path
 * @param {boolean} [module.isDefault] - Whether module is default export
 * @param {string} [module.description] - Module description
 * @param {string} [module.readmePreview] - README preview text
 * @param {number} module.publicEntityCount - Number of public entities
 * @param {Array<string>} module.entityTypes - Available entity types
 * @param {Array<Object>} [module.sampleEntities] - Sample entities
 * @returns {string} Module card HTML
 */
export function moduleCard({
	importPath,
	isDefault = false,
	description,
	readmePreview,
	publicEntityCount,
	entityTypes = [],
	sampleEntities = [],
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
				<div class="mb-3">
					<div class="text-muted mb-0" style="max-height: 3rem; overflow: hidden;">
						${safeHtml`${description}`}
					</div>
				</div>
				`
						: ""
				}

				${
					readmePreview
						? html`
				<div class="mb-3">
					<div class="small text-muted bg-light p-2 rounded">
						<div style="max-height: 4rem; overflow: hidden;">
							${safeHtml`${readmePreview}`}
						</div>
						${readmePreview.length >= 200 ? html`<small class="text-muted">...</small>` : ""}
					</div>
				</div>
				`
						: html`
				<div class="mb-3">
					<div class="small text-muted fst-italic">No documentation available</div>
				</div>
				`
				}

				<!-- Entity Types -->
				${
					entityTypes.length > 0
						? html`
				<div class="mb-3">
					<div class="small text-muted mb-1">Available Types:</div>
					<div>
						${entityTypes.map(
							(type) => html`
						<span class="badge bg-light text-dark me-1 mb-1">${type}</span>
						`,
						)}
					</div>
				</div>
				`
						: ""
				}

				<!-- Sample Entities -->
				${
					sampleEntities.length > 0
						? html`
				<div class="mb-0 flex-grow-1">
					<div class="small text-muted mb-2">Featured APIs:</div>
					<div style="max-height: 12rem; overflow-y: auto;">
										${sampleEntities.map(
											/** @param {any} entity */ (entity) => html`
				<div class="border rounded p-2 mb-2 bg-light">
					<div class="d-flex align-items-center justify-content-between">
						<div>
							<strong class="text-primary">${entity.name}</strong>
							<span class="badge bg-secondary ms-1">${entity.type}</span>
						</div>
					</div>
					${
						entity.description
							? html`
					<div class="small text-muted mt-1">
						<div style="max-height: 2.5rem; overflow: hidden;">
							${markdownToHTML(entity.description)}
						</div>
						${entity.description.length >= 100 ? html`<small class="text-muted">...</small>` : ""}
					</div>
					`
							: ""
					}
				</div>
				`,
										)}
					</div>
				</div>
				`
						: html`
				<div class="text-muted small fst-italic flex-grow-1">No public entities available</div>
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
