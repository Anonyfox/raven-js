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

import { html, markdownToHTML, safeHtml } from "@raven-js/beak";
import {
	codeBlock,
	contentSection,
	deprecationAlert,
	entityCard,
	pageHeader,
	tableSection,
} from "../components/index.js";
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

	// Helper function to link type names to entity pages if they exist
	const linkTypeIfEntity = (
		/** @type {string} */ typeString,
		/** @type {string} */ colorClass = "text-secondary",
	) => {
		if (!typeString) return html`<span class="text-muted">any</span>`;

		// Check if this type matches an entity in the same module
		/** @type {any} */
		const matchingEntity = relatedEntities.sameModule.find(
			/** @param {any} entity */ (entity) => entity.name === typeString,
		);

		if (matchingEntity) {
			return html`<a href="${safeHtml`${matchingEntity.link}`}" class="text-decoration-none"><code class="${colorClass}">${safeHtml`${typeString}`}</code></a>`;
		}

		// No matching entity, return as plain text
		return html`<code class="${colorClass}">${safeHtml`${typeString}`}</code>`;
	};

	// Generate breadcrumbs
	const breadcrumbs = [
		{ href: "/", text: `📦 ${packageName}` },
		{ href: "/modules/", text: "Modules" },
		{ href: `/modules/${moduleName}/`, text: moduleName },
		{ text: entity.name, active: true },
	];

	// Generate header badges
	const badges = [
		{ text: ent.type, variant: getTypeBadgeClass(ent.type).replace("bg-", "") },
	];
	if (ent.isDefault) {
		badges.push({ text: "default module", variant: "primary" });
	}

	// Generate metadata description (removed file location to save space)
	const metadataItems = [];
	if (docs.since) {
		metadataItems.push(`📅 Since ${docs.since}`);
	}
	if (docs.author.length > 0) {
		metadataItems.push(`👤 ${docs.author.join(", ")}`);
	}

	// Generate main content
	const content = html`
		${pageHeader({
			title: ent.name,
			subtitle: ent.description,
			breadcrumbs,
			badges,
			description:
				metadataItems.length > 0 ? metadataItems.join(" • ") : undefined,
		})}

		${
			isDeprecated
				? deprecationAlert({
						reason: docs.deprecated.reason,
						since: docs.deprecated.since,
					})
				: ""
		}

		<!-- Import Statement -->
		<div class="card border-primary mb-4">
			<div class="card-header bg-primary text-white">
				<h5 class="mb-0">📦 Import</h5>
			</div>
			<div class="card-body">
				<div class="input-group">
					<input type="text" class="form-control font-monospace" value="${safeHtml`${ent.importStatement}`}" readonly id="import-${ent.name}">
					<button class="btn btn-outline-primary" type="button" onclick="copyImportStatement('import-${ent.name}')" title="Copy import statement">
						📋 Copy
					</button>
				</div>
			</div>
		</div>

		<!-- Main Documentation -->
		<div class="mb-4">

				<!-- TypeScript Signature -->
				${
					hasTypeInfo && docs.typeInfo.signature
						? contentSection({
								title: "Type Signature",
								icon: "📝",
								content: codeBlock({
									code: docs.typeInfo.signature,
									language: "typescript",
									showCopy: false,
								}),
							})
						: ""
				}

				<!-- Parameters -->
				${
					hasParameters
						? contentSection({
								title: "Parameters",
								icon: "⚙️",
								noPadding: true,
								content: tableSection({
									headers: ["Name", "Type", "Description", "Default"],
									rows: docs.parameters.map(
										/** @param {any} param */ (param) => [
											html`<code class="text-primary">${safeHtml`${param.name}`}</code>${param.isOptional ? html`<span class="text-muted">?</span>` : ""}`,
											linkTypeIfEntity(param.type),
											param.description
												? markdownToHTML(param.description)
												: html`<em class="text-muted">No description</em>`,
											param.defaultValue
												? html`<code class="text-success">${safeHtml`${param.defaultValue}`}</code>`
												: param.isOptional
													? html`<span class="text-muted">undefined</span>`
													: html`<span class="text-muted">required</span>`,
										],
									),
								}),
							})
						: ""
				}

				<!-- Returns -->
				${
					hasReturns
						? contentSection({
								title: "Returns",
								icon: "↩️",
								content: html`
						${
							docs.returns.type
								? html`
						<div class="mb-2">
							<strong>Type:</strong>
							${linkTypeIfEntity(docs.returns.type)}
						</div>
						`
								: ""
						}
						${
							docs.returns.description
								? html`
						<div class="mb-0">${markdownToHTML(docs.returns.description)}</div>
						`
								: ""
						}
					`,
							})
						: ""
				}

				<!-- Exceptions/Throws -->
				${
					docs.throws.length > 0
						? contentSection({
								title: "Exceptions",
								icon: "🚨",
								noPadding: true,
								content: tableSection({
									headers: ["Type", "Description"],
									rows: docs.throws.map(
										/** @param {any} throwsInfo */ (throwsInfo) => [
											linkTypeIfEntity(throwsInfo.type, "text-danger"),
											throwsInfo.description
												? markdownToHTML(throwsInfo.description)
												: html`<em class="text-muted">No description</em>`,
										],
									),
								}),
							})
						: ""
				}

				<!-- Examples -->
				${
					hasExamples
						? contentSection({
								title: "Examples",
								icon: "💡",
								noPadding: true,
								content: html`
						${docs.examples.map(
							/** @param {any} example */ (example) => html`
						<div class="border-bottom p-4">
							${codeBlock({
								code: example.code,
								language: example.language,
								title: example.title,
							})}
						</div>
						`,
						)}
					`,
							})
						: ""
				}

				<!-- Cross-references -->
				${
					ent.crossReferences && ent.crossReferences.length > 0
						? contentSection({
								title: "Related Functions",
								icon: "🔗",
								noPadding: true,
								content: tableSection({
									headers: ["Function", "Type", "Context"],
									rows: ent.crossReferences.map(
										/** @param {any} ref */ (ref) => [
											html`<a href="/modules/utils/${safeHtml`${ref.entityName}`}/" class="text-decoration-none">
								<code class="bg-light px-2 py-1 rounded">${safeHtml`${ref.entityName}`}</code>
							</a>`,
											html`<span class="badge ${ref.type === "see" ? "bg-info" : "bg-secondary"}">${safeHtml`${ref.type}`}</span>`,
											html`<span class="text-muted small">${safeHtml`${ref.context}`}</span>`,
										],
									),
								}),
							})
						: ""
				}

				<!-- Source Code -->
				${
					hasSource
						? contentSection({
								title: "Source Code",
								icon: "📄",
								content: codeBlock({
									code: ent.source,
									language: "javascript",
								}),
							})
						: ""
				}

				<!-- See Also -->
				${
					docs.see.length > 0
						? contentSection({
								title: "See Also",
								icon: "🔗",
								content: html`
						<ul class="list-unstyled mb-0">
							${docs.see.map(
								/** @param {any} seeRef */ (seeRef) => html`
							<li class="mb-2">
								${
									seeRef.link
										? html`
								<a href="${safeHtml`${seeRef.link}`}" class="text-decoration-none ${seeRef.isExternal ? "link-primary" : ""}"
									${seeRef.isExternal ? 'target="_blank" rel="noopener noreferrer"' : ""}>
									${safeHtml`${seeRef.text}`}
									${seeRef.isExternal ? html`<span class="ms-1">🔗</span>` : ""}
								</a>
								`
										: html`<span>${safeHtml`${seeRef.text}`}</span>`
								}
							</li>
							`,
							)}
						</ul>
					`,
							})
						: ""
				}

				<!-- Related Entities -->
				${
					hasRelatedEntities
						? contentSection({
								title: "Related APIs",
								icon: "🔄",
								content: html`
						${
							relatedEntities.sameModule.length > 0
								? html`
						<div class="mb-4">
							<h6 class="fw-bold mb-3">Same Module (${moduleName})</h6>
							<div class="row g-3">
								${relatedEntities.sameModule.map(
									/** @param {any} related */ (related) => html`
								<div class="col-md-6">
									${entityCard({
										name: related.name,
										type: related.type,
										description: related.description,
										link: related.link,
										showFooter: false,
									})}
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
						<div class="mb-0">
							<h6 class="fw-bold mb-3">Similar APIs (${ent.type})</h6>
							<div class="row g-3">
								${relatedEntities.similar.map(
									/** @param {any} similar */ (similar) => html`
								<div class="col-md-6">
									${entityCard({
										name: similar.name,
										type: ent.type,
										description: similar.description,
										link: similar.link,
										badges: [
											{ text: similar.moduleName, variant: "secondary" },
										],
										showFooter: false,
									})}
								</div>
								`,
								)}
							</div>
						</div>
						`
								: ""
						}
					`,
							})
						: ""
				}
		</div>
	`;

	// Generate sidebar navigation (matching module-overview.js exactly)
	const sidebar =
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
			: "";

	// Return complete HTML page using base template
	return baseTemplate({
		title: `${ent.name} - ${moduleName}`,
		description: `API documentation for ${ent.name} ${ent.type} in ${packageName}/${moduleName}${ent.description ? ` - ${ent.description}` : ""}`,
		packageName,
		content,
		navigation: {
			current: "modules",
			sidebar,
		},
		seo: {
			url: "", // Will be filled by route handler
		},
	});
}
