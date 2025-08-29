/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Navigation sidebar components for documentation
 *
 * Bootstrap-based navigation components using list groups and cards.
 * Clean design eliminating custom CSS through proper semantic markup.
 */

import { html } from "@raven-js/beak";

/**
 * Generate module navigation sidebar
 * @param {Object} options - Navigation configuration
 * @param {Array<Object>} options.modules - Module list
 * @param {string} [options.currentModule] - Current module name
 * @param {string} [options.title] - Sidebar title
 * @returns {string} Module navigation HTML
 */
export function moduleNavigation({
	modules,
	currentModule,
	title = "🗂️ All Modules",
}) {
	return html`
		<div class="card">
			<div class="card-header bg-white border-bottom">
				<h5 class="mb-0">${title}</h5>
			</div>
			<div class="card-body p-0">
				<div class="list-group list-group-flush">
					${modules.map(
						/** @param {any} module */ (module) => html`
					<a href="${module.link}"
						class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${module.isCurrent || module.name === currentModule ? "active" : ""}">
						<div>
							<div class="fw-medium">
								${module.isDefault ? html`<span class="badge bg-primary me-2">default</span>` : ""}
								${module.name}
							</div>
							<div class="small text-muted">${module.fullImportPath || module.importPath}</div>
						</div>
						<div class="text-end">
							<span class="badge ${module.isCurrent || module.name === currentModule ? "bg-light text-dark" : "bg-secondary"}">${module.entityCount}</span>
							<div class="small text-muted">APIs</div>
						</div>
					</a>
					`,
					)}
				</div>
			</div>
		</div>
	`;
}

/**
 * Generate entity navigation sidebar
 * @param {Object} options - Navigation configuration
 * @param {Array<Object>} options.entities - Entity list
 * @param {string} [options.currentEntity] - Current entity name
 * @param {string} [options.title] - Sidebar title
 * @returns {string} Entity navigation HTML
 */
export function entityNavigation({
	entities,
	currentEntity,
	title = "🗂️ Module APIs",
}) {
	return html`
		<div class="card">
			<div class="card-header bg-white border-bottom">
				<h5 class="mb-0">${title}</h5>
			</div>
			<div class="card-body p-0">
				<div class="list-group list-group-flush">
					${entities.map(
						/** @param {any} entity */ (entity) => html`
					<a href="${entity.link}"
						class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${entity.isCurrent || entity.name === currentEntity ? "active" : ""}">
						<div>
							<div class="fw-medium">${entity.name}</div>
							<div class="small text-muted">${entity.type}</div>
						</div>
						${entity.isCurrent || entity.name === currentEntity ? html`<span class="badge bg-light text-dark">current</span>` : ""}
					</a>
					`,
					)}
				</div>
			</div>
		</div>
	`;
}

/**
 * Generate quick actions sidebar
 * @param {Object} options - Actions configuration
 * @param {Array<{href: string, text: string, icon?: string, variant?: string}>} options.actions - Action buttons
 * @param {string} [options.title] - Sidebar title
 * @returns {string} Quick actions HTML
 */
export function quickActions({ actions, title = "🚀 Quick Actions" }) {
	return html`
		<div class="card">
			<div class="card-header bg-white border-bottom">
				<h5 class="mb-0">${title}</h5>
			</div>
			<div class="card-body">
				<div class="d-grid gap-2">
					${actions.map(
						(action) => html`
					<a href="${action.href}" class="btn btn-${action.variant || "outline-primary"}">
						${action.icon || ""} ${action.text}
					</a>
					`,
					)}
				</div>
			</div>
		</div>
	`;
}

/**
 * Generate statistics sidebar
 * @param {Object} options - Stats configuration
 * @param {Array<{value: string|number, label: string, variant?: string}>} options.stats - Statistics
 * @param {string} [options.title] - Sidebar title
 * @returns {string} Statistics sidebar HTML
 */
export function statsSidebar({ stats, title = "📊 Statistics" }) {
	return html`
		<div class="card">
			<div class="card-header bg-white border-bottom">
				<h6 class="mb-0">${title}</h6>
			</div>
			<div class="card-body">
				<div class="row g-3 text-center">
					${stats.map(
						(stat) => html`
					<div class="col-6">
						<div class="border rounded p-2">
							<div class="fw-bold text-${stat.variant || "primary"}">${stat.value}</div>
							<div class="small text-muted">${stat.label}</div>
						</div>
					</div>
					`,
					)}
				</div>
			</div>
		</div>
	`;
}
