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

import { html, md } from "@raven-js/beak";
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
	const readmeHTML = module.hasReadme ? md`${module.readme}` : "";

	// Generate main content
	const content = html`
		<!-- Module Header -->
		<div class="row mb-4">
			<div class="col-12">
				<nav aria-label="breadcrumb" class="mb-3">
					<ol class="breadcrumb">
						<li class="breadcrumb-item">
							<a href="/" class="text-decoration-none">📦 ${packageName}</a>
						</li>
						<li class="breadcrumb-item">
							<a href="/modules/" class="text-decoration-none">Modules</a>
						</li>
						<li class="breadcrumb-item active" aria-current="page">${module.name}</li>
					</ol>
				</nav>

				<div class="d-flex align-items-center justify-content-between">
					<div>
						<h1 class="display-5 fw-bold text-primary mb-2">
							${module.isDefault ? html`<span class="badge bg-primary me-3">default</span>` : ""}
							${module.name}
						</h1>
						<p class="lead text-muted mb-0">
							<code class="bg-light px-2 py-1 rounded">${module.fullName}</code>
						</p>
					</div>
					<div class="text-end">
						<div class="badge bg-secondary fs-6 px-3 py-2">
							${stats.totalEntities} Entit${stats.totalEntities !== 1 ? "ies" : "y"}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Module Statistics -->
		${
			hasEntities
				? html`
		<div class="row mb-4">
			<div class="col-12">
				<div class="card bg-light border-0">
					<div class="card-body p-4">
						<div class="row text-center g-4">
							<div class="col-md-3">
								<div class="h4 fw-bold text-primary mb-1">${stats.totalEntities}</div>
								<div class="text-muted">Total Entit${stats.totalEntities !== 1 ? "ies" : "y"}</div>
							</div>
							<div class="col-md-3">
								<div class="h4 fw-bold text-info mb-1">${Object.keys(stats.entitiesByType).length}</div>
								<div class="text-muted">Entity Type${Object.keys(stats.entitiesByType).length !== 1 ? "s" : ""}</div>
							</div>
							${
								hasDeprecatedEntities
									? html`
							<div class="col-md-3">
								<div class="h4 fw-bold text-warning mb-1">${stats.deprecatedCount}</div>
								<div class="text-muted">Deprecated</div>
							</div>
							`
									: ""
							}
							${
								hasExampleEntities
									? html`
							<div class="col-md-3">
								<div class="h4 fw-bold text-success mb-1">${stats.withExamplesCount}</div>
								<div class="text-muted">With Examples</div>
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

		<div class="row">
			<!-- Main Content -->
			<div class="${navigation.allModules.length > 1 ? "col-lg-8" : "col-12"} mb-4">
				<!-- README Section -->
				${
					module.hasReadme
						? html`
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">📚 Documentation</h3>
					</div>
					<div class="card-body">
						<div class="readme-content">
							${readmeHTML}
						</div>
					</div>
				</div>
				`
						: ""
				}

				<!-- Entity Sections -->
				${
					hasEntities
						? html`
				<div class="card">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">🔧 API Reference</h3>
					</div>
					<div class="card-body p-0">
						${Object.entries(organizedEntities).map(
							/** @param {[string, Array<any>]} entry */
							([type, entities]) => html`
						<div class="border-bottom">
							<div class="p-4 pb-3">
								<h4 class="h6 fw-bold text-uppercase text-muted mb-3">
									${type.toUpperCase()}${entities.length !== 1 ? "S" : ""} (${entities.length})
								</h4>
								<div class="row g-3">
									${entities.map(
										/** @param {any} entity */
										(entity) => html`
									<div class="col-lg-6">
										<div class="card border h-100">
											<div class="card-body p-3">
												<div class="d-flex align-items-start justify-content-between mb-2">
													<h5 class="card-title mb-0">
														<a href="${entity.link}" class="text-decoration-none">
															${entity.name}
														</a>
													</h5>
													<div class="d-flex gap-1 flex-wrap">
														<span class="badge bg-secondary">${entity.entityType || type}</span>
														${
															entity.isDeprecated
																? html`<span class="badge bg-warning">deprecated</span>`
																: ""
														}
														${
															entity.hasExamples
																? html`<span class="badge bg-success">examples</span>`
																: ""
														}
														${
															entity.hasParams
																? html`<span class="badge bg-info">params</span>`
																: ""
														}
														${
															entity.hasReturns
																? html`<span class="badge bg-primary">returns</span>`
																: ""
														}
													</div>
												</div>
												${
													entity.description
														? html`
												<div class="card-text text-muted small mb-0">
													${md`${entity.description}`}
												</div>
												`
														: html`
												<p class="card-text text-muted small fst-italic mb-0">
													No description available
												</p>
												`
												}
											</div>
											<div class="card-footer bg-light border-top-0 p-2">
												<div class="d-flex gap-2">
													<a href="${entity.link}" class="btn btn-primary btn-sm flex-fill">
														📖 View Details
													</a>
													${
														entity.location
															? html`
													<small class="text-muted align-self-center">
														${entity.location.file}:${entity.location.line}
													</small>
													`
															: ""
													}
												</div>
											</div>
										</div>
									</div>
									`,
									)}
								</div>
							</div>
						</div>
						`,
						)}
					</div>
				</div>
				`
						: html`
				<div class="card">
					<div class="card-body text-center py-5">
						<div class="display-1 mb-3">📭</div>
						<h3 class="text-muted mb-3">No Public Entities</h3>
						<p class="text-muted">
							This module doesn't export any public APIs.
							${module.hasReadme ? "Check the documentation above for usage information." : ""}
						</p>
					</div>
				</div>
				`
				}
			</div>

			<!-- Navigation Sidebar -->
			${
				navigation.allModules.length > 1
					? html`
			<div class="col-lg-4">
				<!-- Module Navigation -->
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h5 class="mb-0">🗂️ All Modules</h5>
					</div>
					<div class="card-body p-0">
						<div class="list-group list-group-flush">
							${navigation.allModules.map(
								/** @param {any} navModule */
								(navModule) => html`
							<a
								href="${navModule.link}"
								class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${navModule.isCurrent ? "active" : ""}"
							>
								<div>
									<div class="fw-medium">
										${navModule.isDefault ? html`<span class="badge bg-primary me-2">default</span>` : ""}
										${navModule.name}
									</div>
									<div class="small text-muted">${navModule.fullImportPath}</div>
								</div>
								<div class="text-end">
									<span class="badge ${navModule.isCurrent ? "bg-light text-dark" : "bg-secondary"}">${navModule.entityCount}</span>
									<div class="small text-muted">APIs</div>
								</div>
							</a>
							`,
							)}
						</div>
					</div>
				</div>

				<!-- Quick Actions -->
				<div class="card">
					<div class="card-header bg-white border-bottom">
						<h5 class="mb-0">🚀 Quick Actions</h5>
					</div>
					<div class="card-body">
						<div class="d-grid gap-2">
							<a href="/modules/" class="btn btn-outline-primary">
								📦 Browse All Modules
							</a>
							${
								hasEntities
									? html`
							<a href="/api/?search=${encodeURIComponent(module.fullName)}" class="btn btn-outline-secondary">
								🔍 Search This Module
							</a>
							`
									: ""
							}
							<a href="/" class="btn btn-outline-info">
								🏠 Package Overview
							</a>
						</div>
					</div>
				</div>
			</div>
			`
					: ""
			}
		</div>

		<!-- Custom Styles for README content -->
		<style>
			.readme-content h1,
			.readme-content h2,
			.readme-content h3,
			.readme-content h4,
			.readme-content h5,
			.readme-content h6 {
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
				border: 1px solid #dee2e6;
				border-radius: 0.375rem;
				padding: 1rem;
				overflow-x: auto;
			}

			.readme-content code {
				background-color: #f8f9fa;
				color: #d63384;
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
