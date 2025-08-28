/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Entity page template for /modules/{moduleName}/{entityName}/ route
 *
 * Renders individual entity documentation with comprehensive JSDoc processing,
 * code examples, cross-references, and navigation context using Bootstrap 5.
 * Follows WEBAPP.md specification for detailed API documentation pages.
 */

import { html, md } from "@raven-js/beak";
import { baseTemplate } from "./base.js";

/**
 * Generate entity documentation HTML page
 * @param {Object} data - Entity page data from extractor
 * @param {Object} data.entity - Core entity information
 * @param {string} data.entity.name - Entity name
 * @param {string} data.entity.type - Entity type
 * @param {string} data.entity.description - Entity description
 * @param {string} data.entity.source - Source code
 * @param {Object} data.entity.location - Source location
 * @param {string} data.entity.importPath - Module import path
 * @param {string} data.entity.importStatement - Generated import statement
 * @param {boolean} data.entity.isDefault - Whether from default module
 * @param {Object} data.documentation - JSDoc documentation
 * @param {Array<Object>} data.documentation.parameters - Parameter documentation
 * @param {Object} data.documentation.returns - Return documentation
 * @param {Array<Object>} data.documentation.examples - Code examples
 * @param {string} data.documentation.since - Since version
 * @param {Object} data.documentation.deprecated - Deprecation info
 * @param {Array<string>} data.documentation.author - Author information
 * @param {Array<Object>} data.documentation.see - See-also references
 * @param {Array<Object>} data.documentation.throws - Exception documentation
 * @param {Object} data.documentation.typeInfo - TypeScript type information
 * @param {Object} data.relatedEntities - Cross-reference information
 * @param {Array<Object>} data.relatedEntities.sameModule - Same module entities
 * @param {Array<Object>} data.relatedEntities.similar - Similar entities
 * @param {Object} data.navigation - Navigation context
 * @param {Array<Object>} data.navigation.allModules - All modules
 * @param {Array<Object>} data.navigation.moduleEntities - Module entities
 * @param {string} data.packageName - Package name
 * @param {string} data.moduleName - Module name
 * @param {boolean} data.hasParameters - Whether entity has parameters
 * @param {boolean} data.hasReturns - Whether entity has return documentation
 * @param {boolean} data.hasExamples - Whether entity has examples
 * @param {boolean} data.hasRelatedEntities - Whether entity has related entities
 * @param {boolean} data.hasTypeInfo - Whether entity has TypeScript info
 * @param {boolean} data.isDeprecated - Whether entity is deprecated
 * @param {boolean} data.hasSource - Whether entity has source code
 * @param {boolean} data.hasLocation - Whether entity has location info
 * @returns {string} Complete HTML page
 */
export function entityPageTemplate(data) {
	const {
		entity,
		documentation,
		relatedEntities,
		navigation,
		packageName,
		moduleName,
		hasParameters,
		hasReturns,
		hasExamples,
		hasRelatedEntities,
		hasTypeInfo,
		isDeprecated,
		hasSource,
		hasLocation,
	} = data;

	// Type casts for object property access
	/** @type {any} */
	const ent = entity;
	/** @type {any} */
	const docs = documentation;

	// Generate entity type badge color
	const getTypeBadgeClass = (/** @type {string} */ type) => {
		/** @type {Record<string, string>} */
		const typeColors = {
			function: "bg-primary",
			class: "bg-success",
			typedef: "bg-info",
			interface: "bg-warning text-dark",
			enum: "bg-secondary",
			constant: "bg-dark",
			variable: "bg-light text-dark",
		};
		return typeColors[type] || "bg-secondary";
	};

	// Generate main content
	const content = html`
		<!-- Entity Header -->
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
						<li class="breadcrumb-item">
							<a href="/modules/${moduleName}/" class="text-decoration-none">${moduleName}</a>
						</li>
						<li class="breadcrumb-item active" aria-current="page">${entity.name}</li>
					</ol>
				</nav>

				${
					isDeprecated
						? html`
				<div class="alert alert-warning d-flex align-items-center mb-3" role="alert">
					<span class="fs-4 me-2">⚠️</span>
					<div>
						<h6 class="alert-heading mb-1">Deprecated API</h6>
						<p class="mb-0">${docs.deprecated.reason}</p>
						${
							docs.deprecated.since
								? html`<small class="text-muted">Since version ${docs.deprecated.since}</small>`
								: ""
						}
					</div>
				</div>
				`
						: ""
				}

				<div class="d-flex align-items-start justify-content-between flex-wrap gap-3">
					<div class="flex-grow-1">
						<div class="d-flex align-items-center gap-2 mb-2">
							<h1 class="display-5 fw-bold text-primary mb-0">${ent.name}</h1>
							<span class="badge ${getTypeBadgeClass(ent.type)} fs-6">${ent.type}</span>
							${
								ent.isDefault
									? html`<span class="badge bg-primary fs-6">default module</span>`
									: ""
							}
						</div>
						${
							ent.description
								? html`<div class="lead text-muted mb-3">${md`${ent.description}`}</div>`
								: ""
						}

						<!-- Import Statement -->
						<div class="card bg-light border-0 mb-3">
							<div class="card-body p-3">
								<div class="d-flex justify-content-between align-items-center">
									<code class="text-dark">${ent.importStatement}</code>
									<button class="btn btn-sm btn-outline-secondary" onclick="copyToClipboard('${ent.importStatement}')" title="Copy import statement">
										📋 Copy
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Entity Metadata -->
					<div class="text-end">
						${
							hasLocation
								? html`
						<div class="text-muted mb-2">
							<small>
								📍 ${ent.location.file}:${ent.location.line}
							</small>
						</div>
						`
								: ""
						}
						${
							docs.since
								? html`
						<div class="text-muted mb-2">
							<small>📅 Since ${docs.since}</small>
						</div>
						`
								: ""
						}
						${
							docs.author.length > 0
								? html`
						<div class="text-muted">
							<small>👤 ${docs.author.join(", ")}</small>
						</div>
						`
								: ""
						}
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<!-- Main Documentation -->
			<div class="${navigation.allModules.length > 1 ? "col-lg-8" : "col-12"} mb-4">

				<!-- TypeScript Signature -->
				${
					hasTypeInfo && docs.typeInfo.signature
						? html`
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">📝 Type Signature</h3>
					</div>
					<div class="card-body">
						<pre class="mb-0"><code class="language-typescript">${docs.typeInfo.signature}</code></pre>
					</div>
				</div>
				`
						: ""
				}

				<!-- Parameters -->
				${
					hasParameters
						? html`
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">⚙️ Parameters</h3>
					</div>
					<div class="card-body p-0">
						<div class="table-responsive">
							<table class="table table-striped mb-0">
								<thead class="table-light">
									<tr>
										<th>Name</th>
										<th>Type</th>
										<th>Description</th>
										<th>Default</th>
									</tr>
								</thead>
								<tbody>
									${docs.parameters.map(
										/** @param {any} param */
										(param) => html`
									<tr>
										<td>
											<code class="text-primary">${param.name}</code>
											${param.isOptional ? html`<span class="text-muted">?</span>` : ""}
										</td>
										<td>
											${
												param.type
													? html`<code class="text-secondary">${param.type}</code>`
													: html`<span class="text-muted">any</span>`
											}
										</td>
										<td>${param.description ? md`${param.description}` : html`<em class="text-muted">No description</em>`}</td>
										<td>
											${
												param.defaultValue
													? html`<code class="text-success">${param.defaultValue}</code>`
													: param.isOptional
														? html`<span class="text-muted">undefined</span>`
														: html`<span class="text-muted">required</span>`
											}
										</td>
									</tr>
									`,
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
				`
						: ""
				}

				<!-- Returns -->
				${
					hasReturns
						? html`
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">↩️ Returns</h3>
					</div>
					<div class="card-body">
						<div class="d-flex gap-3">
							${
								docs.returns.type
									? html`
							<div>
								<strong>Type:</strong>
								<code class="text-secondary">${docs.returns.type}</code>
							</div>
							`
									: ""
							}
						</div>
						${
							docs.returns.description
								? html`<div class="mt-2 mb-0">${md`${docs.returns.description}`}</div>`
								: ""
						}
					</div>
				</div>
				`
						: ""
				}

				<!-- Exceptions/Throws -->
				${
					docs.throws.length > 0
						? html`
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">🚨 Exceptions</h3>
					</div>
					<div class="card-body p-0">
						<div class="table-responsive">
							<table class="table table-striped mb-0">
								<thead class="table-light">
									<tr>
										<th>Type</th>
										<th>Description</th>
									</tr>
								</thead>
								<tbody>
									${docs.throws.map(
										/** @param {any} throwsInfo */
										(throwsInfo) => html`
									<tr>
										<td><code class="text-danger">${throwsInfo.type}</code></td>
										<td>${throwsInfo.description ? md`${throwsInfo.description}` : html`<em class="text-muted">No description</em>`}</td>
									</tr>
									`,
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
				`
						: ""
				}

				<!-- Examples -->
				${
					hasExamples
						? html`
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">💡 Examples</h3>
					</div>
					<div class="card-body p-0">
						${docs.examples.map(
							/** @param {any} example */
							(example) => html`
						<div class="border-bottom p-4">
							<h6 class="fw-bold mb-3">${example.title}</h6>
							<div class="position-relative">
								<pre class="bg-light border rounded p-3 mb-0"><code class="language-${example.language}">${example.code}</code></pre>
								<button class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2"
									onclick="copyToClipboard(\`${example.code.replace(/`/g, "\\`")}\`)" title="Copy example">
									📋
								</button>
							</div>
						</div>
						`,
						)}
					</div>
				</div>
				`
						: ""
				}

				<!-- Cross-references -->
				${
					ent.crossReferences && ent.crossReferences.length > 0
						? html`
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">🔗 Related Functions</h3>
					</div>
					<div class="card-body p-0">
						<div class="table-responsive">
							<table class="table table-striped mb-0">
								<thead class="table-light">
									<tr>
										<th>Function</th>
										<th>Type</th>
										<th>Context</th>
									</tr>
								</thead>
								<tbody>
									${ent.crossReferences.map(
										/** @param {any} ref */
										(ref) => html`
									<tr>
										<td>
											<a href="/modules/utils/${ref.entityName}/" class="text-decoration-none">
												<code class="bg-light px-2 py-1 rounded">${ref.entityName}</code>
											</a>
										</td>
										<td>
											<span class="badge ${ref.type === "see" ? "bg-info" : "bg-secondary"}">${ref.type}</span>
										</td>
										<td class="text-muted small">${ref.context}</td>
									</tr>
									`,
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
				`
						: ""
				}

				<!-- Source Code -->
				${
					hasSource
						? html`
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">📄 Source Code</h3>
					</div>
					<div class="card-body">
						<div class="position-relative">
							<pre class="bg-light border rounded p-3 mb-0"><code class="language-javascript">${ent.source}</code></pre>
							<button class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2"
								onclick="copyToClipboard(\`${ent.source.replace(/`/g, "\\`")}\`)" title="Copy source">
								📋
							</button>
						</div>
					</div>
				</div>
				`
						: ""
				}

				<!-- See Also -->
				${
					docs.see.length > 0
						? html`
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">🔗 See Also</h3>
					</div>
					<div class="card-body">
						<ul class="list-unstyled mb-0">
							${docs.see.map(
								/** @param {any} seeRef */
								(seeRef) => html`
							<li class="mb-2">
								${
									seeRef.link
										? html`
								<a href="${seeRef.link}" class="text-decoration-none ${seeRef.isExternal ? "link-primary" : ""}"
									${seeRef.isExternal ? 'target="_blank" rel="noopener noreferrer"' : ""}>
									${seeRef.text}
									${seeRef.isExternal ? html`<span class="ms-1">🔗</span>` : ""}
								</a>
								`
										: html`<span>${seeRef.text}</span>`
								}
							</li>
							`,
							)}
						</ul>
					</div>
				</div>
				`
						: ""
				}

				<!-- Related Entities -->
				${
					hasRelatedEntities
						? html`
				<div class="card">
					<div class="card-header bg-white border-bottom">
						<h3 class="h5 mb-0">🔄 Related APIs</h3>
					</div>
					<div class="card-body p-0">
						${
							relatedEntities.sameModule.length > 0
								? html`
						<div class="p-4 border-bottom">
							<h6 class="fw-bold mb-3">Same Module (${moduleName})</h6>
							<div class="row g-2">
								${relatedEntities.sameModule.map(
									/** @param {any} related */
									(related) => html`
								<div class="col-md-6">
									<div class="card border">
										<div class="card-body p-3">
											<div class="d-flex justify-content-between align-items-start mb-2">
												<h6 class="card-title mb-0">
													<a href="${related.link}" class="text-decoration-none">${related.name}</a>
												</h6>
												<span class="badge ${getTypeBadgeClass(related.type)}">${related.type}</span>
											</div>
																			${
																				related.description
																					? html`<div class="card-text text-muted small mb-0">${md`${related.description}`}</div>`
																					: ""
																			}
										</div>
									</div>
								</div>
								`,
								)}
							</div>
						</div>
						`
								: ""
						}

						${
							relatedEntities.similar.length > 0
								? html`
						<div class="p-4">
							<h6 class="fw-bold mb-3">Similar APIs (${ent.type})</h6>
							<div class="row g-2">
								${relatedEntities.similar.map(
									/** @param {any} similar */
									(similar) => html`
								<div class="col-md-6">
									<div class="card border">
										<div class="card-body p-3">
											<div class="d-flex justify-content-between align-items-start mb-2">
												<h6 class="card-title mb-0">
													<a href="${similar.link}" class="text-decoration-none">${similar.name}</a>
												</h6>
												<span class="badge bg-secondary">${similar.moduleName}</span>
											</div>
																			${
																				similar.description
																					? html`<div class="card-text text-muted small mb-0">${md`${similar.description}`}</div>`
																					: ""
																			}
										</div>
									</div>
								</div>
								`,
								)}
							</div>
						</div>
						`
								: ""
						}
					</div>
				</div>
				`
						: ""
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
						<h5 class="mb-0">🗂️ ${moduleName} APIs</h5>
					</div>
					<div class="card-body p-0">
						<div class="list-group list-group-flush">
							${navigation.moduleEntities.map(
								/** @param {any} navEntity */
								(navEntity) => html`
							<a href="${navEntity.link}"
								class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${navEntity.isCurrent ? "active" : ""}">
								<div>
									<div class="fw-medium">${navEntity.name}</div>
									<div class="small text-muted">${navEntity.type}</div>
								</div>
								${navEntity.isCurrent ? html`<span class="badge bg-light text-dark">current</span>` : ""}
							</a>
							`,
							)}
						</div>
					</div>
				</div>

				<!-- All Modules -->
				<div class="card mb-4">
					<div class="card-header bg-white border-bottom">
						<h5 class="mb-0">📦 All Modules</h5>
					</div>
					<div class="card-body p-0">
						<div class="list-group list-group-flush">
							${navigation.allModules.map(
								/** @param {any} navModule */
								(navModule) => html`
							<a href="${navModule.link}"
								class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${navModule.isCurrent ? "active" : ""}">
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
							<a href="/modules/${moduleName}/" class="btn btn-outline-primary">
								📄 Module Overview
							</a>
							<a href="/api/?search=${encodeURIComponent(ent.name)}" class="btn btn-outline-secondary">
								🔍 Search APIs
							</a>
							<a href="/modules/" class="btn btn-outline-info">
								📦 Browse Modules
							</a>
							<a href="/" class="btn btn-outline-dark">
								🏠 Package Home
							</a>
						</div>
					</div>
				</div>
			</div>
			`
					: ""
			}
		</div>

		<!-- Copy to Clipboard JavaScript -->
		<script>
			function copyToClipboard(text) {
				if (navigator.clipboard && window.isSecureContext) {
					navigator.clipboard.writeText(text).then(() => {
						showCopyFeedback();
					}).catch(() => {
						fallbackCopyTextToClipboard(text);
					});
				} else {
					fallbackCopyTextToClipboard(text);
				}
			}

			function fallbackCopyTextToClipboard(text) {
				const textArea = document.createElement("textarea");
				textArea.value = text;
				textArea.style.top = "0";
				textArea.style.left = "0";
				textArea.style.position = "fixed";
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				try {
					document.execCommand('copy');
					showCopyFeedback();
				} catch (err) {
					console.error('Fallback: Could not copy text');
				}
				document.body.removeChild(textArea);
			}

			function showCopyFeedback() {
				// Create temporary feedback element
				const feedback = document.createElement('div');
				feedback.textContent = 'Copied!';
				feedback.className = 'position-fixed top-50 start-50 translate-middle bg-success text-white px-3 py-2 rounded';
				feedback.style.zIndex = '9999';
				document.body.appendChild(feedback);

				setTimeout(() => {
					if (feedback.parentNode) {
						feedback.parentNode.removeChild(feedback);
					}
				}, 2000);
			}
		</script>
	`;

	// Return complete HTML page using base template
	return baseTemplate({
		title: `${ent.name} - ${moduleName}`,
		description: `API documentation for ${ent.name} ${ent.type} in ${packageName}/${moduleName}${ent.description ? ` - ${ent.description}` : ""}`,
		packageName,
		content,
		navigation: {
			current: "modules",
			sidebar:
				navigation.allModules.length > 1
					? html`
				<h6 class="fw-bold mb-3">Entity Navigation</h6>
				<ul class="nav nav-pills flex-column">
					${navigation.moduleEntities.map(
						/** @param {any} navEntity */
						(navEntity) => html`
					<li class="nav-item">
						<a href="${navEntity.link}"
							class="nav-link ${navEntity.isCurrent ? "active" : ""}">
							${getTypeIcon(navEntity.type)} ${navEntity.name}
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

/**
 * Get icon for entity type
 * @param {string} type - Entity type
 * @returns {string} Icon emoji
 */
function getTypeIcon(type) {
	/** @type {Record<string, string>} */
	const typeIcons = {
		function: "⚙️",
		class: "🏗️",
		typedef: "📋",
		interface: "🔌",
		enum: "📝",
		constant: "🔒",
		variable: "📊",
	};
	return typeIcons[type] || "📄";
}
