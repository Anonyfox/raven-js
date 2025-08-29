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
import {
	codeBlock,
	contentSection,
	deprecationAlert,
	entityCard,
	moduleNavigation,
	pageHeader,
	quickActions,
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

	// Generate metadata description
	const metadataItems = [];
	if (hasLocation) {
		metadataItems.push(`📍 ${ent.location.file}:${ent.location.line}`);
	}
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
			subtitle: ent.description ? md`${ent.description}` : undefined,
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
		${codeBlock({
			code: ent.importStatement,
			language: "javascript",
			title: "Import Statement",
		})}

		<div class="row">
			<!-- Main Documentation -->
			<div class="${navigation.allModules.length > 1 ? "col-lg-8" : "col-12"} mb-4">

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
											html`<code class="text-primary">${param.name}</code>${param.isOptional ? html`<span class="text-muted">?</span>` : ""}`,
											param.type
												? html`<code class="text-secondary">${param.type}</code>`
												: html`<span class="text-muted">any</span>`,
											param.description
												? md`${param.description}`
												: html`<em class="text-muted">No description</em>`,
											param.defaultValue
												? html`<code class="text-success">${param.defaultValue}</code>`
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
							<code class="text-secondary">${docs.returns.type}</code>
						</div>
						`
								: ""
						}
						${
							docs.returns.description
								? html`
						<div class="mb-0">${md`${docs.returns.description}`}</div>
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
											html`<code class="text-danger">${throwsInfo.type}</code>`,
											throwsInfo.description
												? md`${throwsInfo.description}`
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
											html`<a href="/modules/utils/${ref.entityName}/" class="text-decoration-none">
								<code class="bg-light px-2 py-1 rounded">${ref.entityName}</code>
							</a>`,
											html`<span class="badge ${ref.type === "see" ? "bg-info" : "bg-secondary"}">${ref.type}</span>`,
											html`<span class="text-muted small">${ref.context}</span>`,
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

			<!-- Navigation Sidebar -->
			${
				navigation.allModules.length > 1
					? html`
			<div class="col-lg-4">
				<!-- Module APIs Navigation -->
				<div class="mb-4">
					${moduleNavigation({
						modules: navigation.moduleEntities.map(
							/** @param {any} entity */ (entity) => ({
								name: entity.name,
								link: entity.link,
								entityCount: 1,
								fullImportPath: entity.type,
								isCurrent: entity.isCurrent,
							}),
						),
						title: `🗂️ ${moduleName} APIs`,
					})}
				</div>

				<!-- All Modules Navigation -->
				<div class="mb-4">
					${moduleNavigation({
						modules: navigation.allModules,
						title: "📦 All Modules",
					})}
				</div>

				<!-- Quick Actions -->
				${quickActions({
					actions: [
						{
							href: `/modules/${moduleName}/`,
							text: "📄 Module Overview",
							variant: "outline-primary",
						},
						{
							href: `/api/?search=${encodeURIComponent(ent.name)}`,
							text: "🔍 Search APIs",
							variant: "outline-secondary",
						},
						{
							href: "/modules/",
							text: "📦 Browse Modules",
							variant: "outline-info",
						},
						{ href: "/", text: "🏠 Package Home", variant: "outline-dark" },
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
