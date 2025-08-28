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

import { html, md } from "@raven-js/beak";
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

	// Process README content through beak markdown processor
	const readmeHTML = readmeMarkdown ? md`${readmeMarkdown}` : "";

	// Generate main content
	const content = html`
		<!-- Package Header -->
		<div class="row mb-5">
			<div class="col-12">
				<div class="d-flex justify-content-between align-items-start flex-wrap">
					<div>
						<h1 class="display-4 fw-bold text-primary mb-2">${name}</h1>
						${version ? html`<span class="badge bg-secondary fs-6 mb-3">v${version}</span>` : ""}
						${description ? html`<div class="lead text-muted mb-0">${md`${description}`}</div>` : ""}
					</div>
					<div class="text-end">
						<div class="row g-3">
							<div class="col-auto">
								<div class="card border-0 bg-light">
									<div class="card-body text-center p-3">
										<div class="fs-3 fw-bold text-primary">${stats.moduleCount}</div>
										<div class="small text-muted">Module${stats.moduleCount !== 1 ? "s" : ""}</div>
									</div>
								</div>
							</div>
							<div class="col-auto">
								<div class="card border-0 bg-light">
									<div class="card-body text-center p-3">
										<div class="fs-3 fw-bold text-success">${stats.publicEntityCount}</div>
										<div class="small text-muted">Public API${stats.publicEntityCount !== 1 ? "s" : ""}</div>
									</div>
								</div>
							</div>
							<div class="col-auto">
								<div class="card border-0 bg-light">
									<div class="card-body text-center p-3">
										<div class="fs-3 fw-bold text-info">${stats.entityCount}</div>
										<div class="small text-muted">Total Entit${stats.entityCount !== 1 ? "ies" : "y"}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Quick Navigation -->
		${
			hasModules
				? html`
		<div class="row mb-4">
			<div class="col-12">
				<div class="card border-0 bg-light">
					<div class="card-body">
						<h5 class="card-title mb-3">📚 Quick Navigation</h5>
						<div class="row g-2">
							<div class="col-auto">
								<a href="/modules/" class="btn btn-outline-primary btn-sm">
									📖 Browse Modules
								</a>
							</div>
							<div class="col-auto">
								<a href="/api/" class="btn btn-outline-success btn-sm">
									🔍 API Reference
								</a>
							</div>
							${
								hasPublicEntities
									? html`
							<div class="col-auto">
								<a href="/api/?search=" class="btn btn-outline-info btn-sm">
									🚀 Search APIs
								</a>
							</div>
							`
									: ""
							}
						</div>
					</div>
				</div>
			</div>
		</div>
		`
				: ""
		}

		<!-- Main Content Area -->
		<div class="row">
			<!-- README Content -->
			<div class="${hasModules ? "col-lg-8" : "col-12"} mb-4">
				${
					hasReadme
						? html`
				<div class="card">
					<div class="card-header bg-white border-bottom">
						<h5 class="mb-0">📄 Documentation</h5>
					</div>
					<div class="card-body">
						<div class="readme-content">
							${readmeHTML}
						</div>
					</div>
				</div>
				`
						: html`
				<div class="card">
					<div class="card-body text-center py-5">
						<div class="text-muted">
							<i class="bi bi-file-text" style="font-size: 3rem;"></i>
							<h5 class="mt-3">No README Available</h5>
							<p>This package doesn't have README documentation.</p>
						</div>
					</div>
				</div>
				`
				}
			</div>

			<!-- Module Navigation Sidebar -->
			${
				hasModules
					? html`
			<div class="col-lg-4">
				<div class="card">
					<div class="card-header bg-white border-bottom">
						<h5 class="mb-0">🗂️ Modules</h5>
					</div>
					<div class="card-body p-0">
						<div class="list-group list-group-flush">
							${modules.map(
								/** @param {any} module */
								(module) => html`
							<a href="/modules/${module.name.split("/").pop()}/" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
								<div>
									<div class="fw-medium">
										${module.isDefault ? html`<span class="badge bg-primary me-2">default</span>` : ""}
										${module.name.split("/").pop() || "index"}
									</div>
									<div class="small text-muted">${module.name}</div>
									${
										module.availableTypes.length > 0
											? html`
									<div class="mt-1">
										${module.availableTypes.map(
											/** @param {string} type */
											(type) => html`
											<span class="badge bg-light text-dark me-1">${type}</span>
										`,
										)}
									</div>
									`
											: ""
									}
								</div>
								<div class="text-end">
									<span class="badge bg-secondary">${module.publicEntityCount}</span>
									<div class="small text-muted">APIs</div>
								</div>
							</a>
							`,
							)}
						</div>
					</div>
				</div>

				<!-- Package Statistics -->
				<div class="card mt-3">
					<div class="card-header bg-white border-bottom">
						<h6 class="mb-0">📊 Package Statistics</h6>
					</div>
					<div class="card-body">
						<div class="row g-3 text-center">
							<div class="col-6">
								<div class="border rounded p-2">
									<div class="fw-bold text-primary">${stats.moduleCount}</div>
									<div class="small text-muted">Modules</div>
								</div>
							</div>
							<div class="col-6">
								<div class="border rounded p-2">
									<div class="fw-bold text-success">${stats.publicEntityCount}</div>
									<div class="small text-muted">Public</div>
								</div>
							</div>
							<div class="col-6">
								<div class="border rounded p-2">
									<div class="fw-bold text-info">${stats.entityCount}</div>
									<div class="small text-muted">Total</div>
								</div>
							</div>
							<div class="col-6">
								<div class="border rounded p-2">
									<div class="fw-bold text-warning">${Math.round((stats.publicEntityCount / stats.entityCount) * 100) || 0}%</div>
									<div class="small text-muted">Coverage</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			`
					: ""
			}
		</div>

		${
			hasModules
				? html`
		<!-- Getting Started Section -->
		<div class="row mt-5">
			<div class="col-12">
				<div class="card bg-light border-0">
					<div class="card-body">
						<h5 class="card-title">🚀 Getting Started</h5>
						<div class="row">
							<div class="col-md-6">
								<h6>Installation</h6>
								<div class="code-block">npm install ${name}</div>
							</div>
							<div class="col-md-6">
								<h6>Basic Usage</h6>
								<div class="code-block">import { ... } from '${name}';</div>
							</div>
						</div>
						<div class="mt-3">
							<a href="/modules/" class="btn btn-primary btn-sm me-2">Explore Modules</a>
							<a href="/api/" class="btn btn-outline-primary btn-sm">Browse API</a>
						</div>
					</div>
				</div>
			</div>
		</div>
		`
				: ""
		}

		<!-- Custom Styles for README content -->
		<style>
			.readme-content h1, .readme-content h2, .readme-content h3,
			.readme-content h4, .readme-content h5, .readme-content h6 {
				margin-top: 1.5rem;
				margin-bottom: 1rem;
			}

			.readme-content h1:first-child,
			.readme-content h2:first-child,
			.readme-content h3:first-child {
				margin-top: 0;
			}

			.readme-content p {
				margin-bottom: 1rem;
			}

			.readme-content pre {
				background-color: #f8f9fa;
				border: 1px solid #e9ecef;
				border-radius: 0.375rem;
				padding: 1rem;
				overflow-x: auto;
			}

			.readme-content code {
				background-color: #f8f9fa;
				color: #e83e8c;
				padding: 0.125rem 0.25rem;
				border-radius: 0.25rem;
				font-size: 0.875em;
			}

			.readme-content pre code {
				background-color: transparent;
				color: inherit;
				padding: 0;
			}

			.readme-content blockquote {
				border-left: 4px solid #6366f1;
				padding-left: 1rem;
				margin: 1rem 0;
				color: #64748b;
			}

			.readme-content table {
				width: 100%;
				margin-bottom: 1rem;
				border-collapse: collapse;
			}

			.readme-content th,
			.readme-content td {
				padding: 0.5rem;
				border: 1px solid #dee2e6;
			}

			.readme-content th {
				background-color: #f8f9fa;
				font-weight: 600;
			}
		</style>
	`;

	// Generate complete page using base template
	return baseTemplate({
		title: `${name} Documentation`,
		description: description || `Documentation for ${name} package`,
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
