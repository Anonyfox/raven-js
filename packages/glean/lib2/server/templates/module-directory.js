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
		hasPublicEntities,
	} = data;

	// Generate main content
	const content = html`
		<!-- Page Header -->
		<div class="row mb-4">
			<div class="col-12">
				<div class="d-flex align-items-center justify-content-between">
					<div>
						<h1 class="display-5 fw-bold text-primary mb-2">📦 Modules</h1>
						<p class="lead text-muted mb-0">
							Explore the ${directoryStats.totalModules} module${directoryStats.totalModules !== 1 ? "s" : ""}
							in ${packageName}
						</p>
					</div>
					<div class="text-end">
						<div class="badge bg-primary fs-6 px-3 py-2">
							${directoryStats.totalPublicEntities} Public APIs
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Directory Statistics -->
		${
			hasModules
				? html`
		<div class="row mb-5">
			<div class="col-12">
				<div class="card bg-light border-0">
					<div class="card-body p-4">
						<div class="row text-center g-4">
							<div class="col-md-3">
								<div class="h4 fw-bold text-primary mb-1">${directoryStats.totalModules}</div>
								<div class="text-muted">Total Module${directoryStats.totalModules !== 1 ? "s" : ""}</div>
							</div>
							<div class="col-md-3">
								<div class="h4 fw-bold text-success mb-1">${directoryStats.totalPublicEntities}</div>
								<div class="text-muted">Public API${directoryStats.totalPublicEntities !== 1 ? "s" : ""}</div>
							</div>
							<div class="col-md-3">
								<div class="h4 fw-bold text-info mb-1">${Object.keys(directoryStats.entityTypeDistribution).length}</div>
								<div class="text-muted">Entity Type${Object.keys(directoryStats.entityTypeDistribution).length !== 1 ? "s" : ""}</div>
							</div>
							<div class="col-md-3">
								<div class="h4 fw-bold text-warning mb-1">
									${Math.round((directoryStats.totalPublicEntities / Object.values(directoryStats.entityTypeDistribution).reduce((sum, count) => sum + count, 0)) * 100) || 0}%
								</div>
								<div class="text-muted">Public Coverage</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		`
				: ""
		}

		<!-- Module Grid -->
		${
			hasModules
				? html`
		<div class="row">
			<div class="col-12">
				<h2 class="h4 fw-bold mb-4">📚 Available Modules</h2>
				<div class="row g-4">
					${moduleList.map(
						/** @param {any} module */
						(module) => html`
					<div class="col-lg-6 col-xl-4">
						<div class="card h-100 border-0 shadow-sm">
							<!-- Module Header -->
							<div class="card-header bg-white border-bottom-0 pb-0">
								<div class="d-flex align-items-center justify-content-between">
									<div>
										<h5 class="card-title mb-1">
											${module.isDefault ? html`<span class="badge bg-primary me-2">default</span>` : ""}
											<a href="/modules/${module.importPath.split("/").pop()}/" class="text-decoration-none">
												${module.importPath.split("/").pop() || "index"}
											</a>
										</h5>
										<div class="small text-muted">${module.importPath}</div>
									</div>
									<div class="text-end">
										<span class="badge bg-secondary">${module.publicEntityCount}</span>
										<div class="small text-muted">APIs</div>
									</div>
								</div>
							</div>

							<!-- Module Content -->
							<div class="card-body pt-3">
								${
									module.hasDescription
										? html`
								<!-- Module Description -->
								<div class="mb-3">
									<p class="text-muted mb-0">${module.description}</p>
								</div>
								`
										: ""
								}
								${
									module.hasReadme
										? html`
								<!-- README Preview -->
								<div class="mb-3">
									<div class="small text-muted bg-light p-2 rounded">
										${module.readmePreview}${module.readmePreview.length >= 200 ? "..." : ""}
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
									module.entityTypes.length > 0
										? html`
								<div class="mb-3">
									<div class="small text-muted mb-1">Available Types:</div>
									<div>
										${module.entityTypes.map(
											/** @param {string} type */
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
									module.sampleEntities.length > 0
										? html`
								<div class="mb-0">
									<div class="small text-muted mb-2">Featured APIs:</div>
									${module.sampleEntities.map(
										/** @param {any} entity */
										(entity) => html`
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
											${entity.description}${entity.description.length >= 100 ? "..." : ""}
										</div>
										`
												: ""
										}
									</div>
									`,
									)}
								</div>
								`
										: html`
								<div class="text-muted small fst-italic">No public entities available</div>
								`
								}
							</div>

							<!-- Module Footer -->
							<div class="card-footer bg-white border-top-0 pt-0">
								<div class="d-flex gap-2">
									<a href="/modules/${module.importPath.split("/").pop()}/" class="btn btn-primary btn-sm flex-fill">
										📖 Explore Module
									</a>
									${
										module.publicEntityCount > 0
											? html`
									<a href="/api/?search=${module.importPath}" class="btn btn-outline-secondary btn-sm">
										🔍 APIs
									</a>
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
		`
				: html`
		<!-- Empty State -->
		<div class="row">
			<div class="col-12">
				<div class="text-center py-5">
					<div class="display-1 mb-3">📭</div>
					<h3 class="text-muted mb-3">No Modules Available</h3>
					<p class="text-muted">
						This package doesn't contain any modules yet.
						${packageDescription ? html`<br/>Package: ${packageDescription}` : ""}
					</p>
				</div>
			</div>
		</div>
		`
		}

		<!-- Entity Type Distribution -->
		${
			hasModules &&
			Object.keys(directoryStats.entityTypeDistribution).length > 0
				? html`
		<div class="row mt-5">
			<div class="col-12">
				<h3 class="h5 fw-bold mb-3">📊 Entity Type Distribution</h3>
				<div class="card">
					<div class="card-body">
						<div class="row g-3">
							${Object.entries(directoryStats.entityTypeDistribution).map(
								/** @param {[string, number]} entry */
								([type, count]) => html`
							<div class="col-md-6 col-lg-4">
								<div class="d-flex align-items-center justify-content-between p-2 bg-light rounded">
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
					</div>
				</div>
			</div>
		</div>
		`
				: ""
		}

		<!-- Getting Started -->
		${
			hasModules
				? html`
		<div class="row mt-5">
			<div class="col-12">
				<div class="card border-primary">
					<div class="card-header bg-primary text-white">
						<h4 class="mb-0">🚀 Getting Started</h4>
					</div>
					<div class="card-body">
						<div class="row">
							<div class="col-md-6">
								<h6 class="fw-bold">Installation</h6>
								<div class="bg-dark text-light p-3 rounded mb-3">
									<code>npm install ${packageName}</code>
								</div>
							</div>
							<div class="col-md-6">
								<h6 class="fw-bold">Basic Usage</h6>
								<div class="bg-dark text-light p-3 rounded mb-3">
									<code>import { ... } from '${packageName}';</code>
								</div>
							</div>
						</div>
						<div class="row">
							<div class="col-12">
								<h6 class="fw-bold">Quick Navigation</h6>
								<div class="d-flex gap-2 flex-wrap">
									<a href="/" class="btn btn-outline-primary btn-sm">📋 Package Overview</a>
									${
										hasPublicEntities
											? html`
									<a href="/api/" class="btn btn-outline-secondary btn-sm">🔍 API Reference</a>
									`
											: ""
									}
									<a href="/sitemap.xml" class="btn btn-outline-info btn-sm">🗺️ Sitemap</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		`
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
