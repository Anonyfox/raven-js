/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Attribution context for authorship and reference composition.
 *
 * Composes JSDoc @author and @see tags with package metadata for
 * documentation attribution. Optional rendering - no data, no output.
 */

/**
 * Attribution context composer for entities and modules with optional rendering.
 *
 * Extracts authorship from JSDoc tags and package metadata. Primary author = first @author tag,
 * contributors = subsequent @author tags. Optional rendering - no authors, no output.
 *
 * @example
 * // Basic entity attribution
 * const context = createEntityAttribution(entity, packageMeta);
 * const primary = context.getPrimaryAuthor();
 * const links = context.getSeeLinks();
 *
 * @example
 * // Module attribution aggregation
 * const context = createModuleAttribution(entities, packageMeta);
 * console.log(context.hasAttribution);
 */
export class AttributionContext {
	/**
	 * Create attribution context instance
	 * @param {Array<{tagType: string, authorInfo?: string, name?: string, email?: string}>} authorTags - Array of author tag instances from entity
	 * @param {Array<{tagType: string, referenceType?: string, reference?: string, description?: string, url?: string}>} seeTags - Array of see tag instances from entity
	 * @param {Object} [packageMetadata] - Optional package.json metadata
	 * @param {string} [packageMetadata.author] - Package author info
	 * @param {string} [packageMetadata.homepage] - Package homepage URL
	 * @param {Object} [packageMetadata.repository] - Repository info
	 * @param {string} [packageMetadata.repository.url] - Repository URL
	 * @param {Object} [packageMetadata.bugs] - Bug tracker URL
	 * @param {string} [packageMetadata.bugs.url] - Bug tracker URL
	 * @param {Object} [packageMetadata.funding] - Funding info
	 * @param {string} [packageMetadata.funding.url] - Funding URL
	 */
	constructor(authorTags, seeTags, packageMetadata) {
		// Extract author intelligence - primary vs contributors
		this.authorTags = Array.isArray(authorTags) ? authorTags : [];
		this.primaryAuthor = this.authorTags[0] || null;
		this.contributors = this.authorTags.slice(1) || [];

		// Extract see tag intelligence
		this.seeTags = Array.isArray(seeTags) ? seeTags : [];

		// Package metadata enrichment
		this.packageMeta = packageMetadata || null;

		// Computed attribution properties
		this.hasAttribution =
			this.authorTags.length > 0 ||
			this.seeTags.length > 0 ||
			Boolean(this.packageMeta);
		this.hasAuthors =
			this.authorTags.length > 0 || Boolean(this.packageMeta?.author);
		this.hasLinks = this.seeTags.length > 0;
		this.hasPackageMeta = Boolean(this.packageMeta);
	}

	/**
	 * Get primary author with proper attribution hierarchy
	 *
	 * Returns the primary author following the hierarchy:
	 * 1. Entity-specific author (from JSDoc tags) - highest priority
	 * 2. Package-level author (from package.json) - fallback when no entity authors
	 *
	 * @returns {{name: string, email: string, authorInfo: string, hasEmail: boolean}|null} Primary author or null
	 */
	getPrimaryAuthor() {
		// If we have entity-level authors, use the primary one
		if (this.primaryAuthor) {
			return {
				name: this.primaryAuthor.name || "",
				email: this.primaryAuthor.email || "",
				authorInfo: this.primaryAuthor.authorInfo || "",
				hasEmail: Boolean(this.primaryAuthor.email),
			};
		}

		// Fallback to package-level author if no entity authors
		if (this.packageMeta?.author) {
			const packageAuthor = this.packageMeta.author;

			// Handle both string and object formats from package.json
			if (typeof packageAuthor === "string") {
				// Parse "Name <email>" format
				const match = packageAuthor.match(/^(.+?)\s*<([^>]+)>$/);
				if (match) {
					return {
						name: match[1].trim(),
						email: match[2].trim(),
						authorInfo: packageAuthor,
						hasEmail: true,
					};
				}
				return {
					name: packageAuthor,
					email: "",
					authorInfo: packageAuthor,
					hasEmail: false,
				};
			} else if (
				packageAuthor &&
				typeof packageAuthor === "object" &&
				/** @type {any} */ (packageAuthor).name
			) {
				// Handle object format { name: "...", email: "...", url: "..." }
				/** @type {any} */
				const author = packageAuthor;
				return {
					name: author.name,
					email: author.email || "",
					authorInfo: author.email
						? `${author.name} <${author.email}>`
						: author.name,
					hasEmail: Boolean(author.email),
				};
			}
		}

		return null;
	}

	/**
	 * Get all contributors with parsed name/email
	 * @returns {Array<Object>} Contributor info array
	 */
	getContributors() {
		return this.contributors.map((contributor) => ({
			name: contributor.name || "",
			email: contributor.email || "",
			authorInfo: contributor.authorInfo || "",
			hasEmail: Boolean(contributor.email),
		}));
	}

	/**
	 * Get see links grouped by type
	 * @returns {{links: Array<Object>, urls: Array<Object>, symbols: Array<Object>, modules: Array<Object>, text: Array<Object>}} See links grouped by reference type
	 */
	getSeeLinks() {
		const grouped = {
			/** @type {Array<{reference: string, description: string, url: string, type: string}>} */
			links: [],
			/** @type {Array<{reference: string, description: string, url: string, type: string}>} */
			urls: [],
			/** @type {Array<{reference: string, description: string, url: string, type: string}>} */
			symbols: [],
			/** @type {Array<{reference: string, description: string, url: string, type: string}>} */
			modules: [],
			/** @type {Array<{reference: string, description: string, url: string, type: string}>} */
			text: [],
		};

		for (const seeTag of this.seeTags) {
			const linkData = {
				reference: seeTag.reference || "",
				description: seeTag.description || "",
				url: seeTag.url || "",
				type: seeTag.referenceType || "text",
			};

			switch (seeTag.referenceType) {
				case "link":
					grouped.links.push(linkData);
					break;
				case "url":
					grouped.urls.push(linkData);
					break;
				case "symbol":
					grouped.symbols.push(linkData);
					break;
				case "module":
					grouped.modules.push(linkData);
					break;
				default:
					grouped.text.push(linkData);
			}
		}

		return grouped;
	}

	/**
	 * Get package metadata for footer rendering
	 * @returns {Object|null} Package metadata or null
	 */
	getPackageMetadata() {
		if (!this.packageMeta) return null;

		return {
			homepage: this.packageMeta.homepage || "",
			repository: this.packageMeta.repository?.url || "",
			bugs: this.packageMeta.bugs?.url || "",
			funding: this.packageMeta.funding?.url || "",
			hasHomepage: Boolean(this.packageMeta.homepage),
			hasRepository: Boolean(this.packageMeta.repository?.url),
			hasBugs: Boolean(this.packageMeta.bugs?.url),
			hasFunding: Boolean(this.packageMeta.funding?.url),
			hasAnyLink: Boolean(
				this.packageMeta.homepage ||
					this.packageMeta.repository?.url ||
					this.packageMeta.bugs?.url ||
					this.packageMeta.funding?.url,
			),
		};
	}
}

/**
 * Create attribution context from entity JSDoc tags
 * @param {import('./entities/base.js').EntityBase} entity - Entity with JSDoc tags
 * @param {Object} [packageMetadata] - Optional package metadata
 * @param {string} [packageMetadata.homepage] - Package homepage URL
 * @param {Object} [packageMetadata.repository] - Repository info
 * @param {string} [packageMetadata.repository.url] - Repository URL
 * @param {Object} [packageMetadata.bugs] - Bug tracker info
 * @param {string} [packageMetadata.bugs.url] - Bug tracker URL
 * @param {Object} [packageMetadata.funding] - Funding info
 * @param {string} [packageMetadata.funding.url] - Funding URL
 * @param {Array<import('./module.js').Module>} [allModules] - All modules for re-export tracing
 * @returns {AttributionContext} Attribution context instance
 */
export function createEntityAttribution(entity, packageMetadata, allModules) {
	// Check if this entity is a re-export and trace to original source
	const originalEntity = allModules
		? traceReexportToSource(entity, allModules)
		: null;

	// Use original entity for attribution if found, otherwise use current entity
	const sourceEntity = originalEntity || entity;
	const authorTags = sourceEntity.getJSDocTagsByType("author") || [];
	const seeTags = sourceEntity.getJSDocTagsByType("see") || [];

	return new AttributionContext(authorTags, seeTags, packageMetadata);
}

/**
 * Aggregate unique authors from multiple entities for module attribution
 * @param {Array<import('./entities/base.js').EntityBase>} entities - Array of entities with JSDoc tags
 * @param {Object} [packageMetadata] - Optional package metadata
 * @param {string} [packageMetadata.homepage] - Package homepage URL
 * @param {Object} [packageMetadata.repository] - Repository info
 * @param {string} [packageMetadata.repository.url] - Repository URL
 * @param {Object} [packageMetadata.bugs] - Bug tracker info
 * @param {string} [packageMetadata.bugs.url] - Bug tracker URL
 * @param {Object} [packageMetadata.funding] - Funding info
 * @param {string} [packageMetadata.funding.url] - Funding URL
 * @param {Array<import('./module.js').Module>} [allModules] - All modules for re-export tracing
 * @returns {AttributionContext} Aggregated attribution context
 */
export function createModuleAttribution(entities, packageMetadata, allModules) {
	const authorMap = new Map();
	const seeTagMap = new Map();

	// Aggregate unique authors by contribution count and unique see tags
	for (const entity of entities) {
		// Trace re-exports to original source for attribution
		const originalEntity = allModules
			? traceReexportToSource(entity, allModules)
			: null;
		const sourceEntity = originalEntity || entity;

		const authorTags = sourceEntity.getJSDocTagsByType("author") || [];
		const seeTags = sourceEntity.getJSDocTagsByType("see") || [];

		// Track author contributions
		for (const authorTag of authorTags) {
			/** @type {{authorInfo?: string}} */
			const tag = /** @type {any} */ (authorTag);
			const key = tag.authorInfo || "";
			if (key) {
				if (!authorMap.has(key)) {
					authorMap.set(key, { tag: authorTag, count: 0 });
				}
				authorMap.get(key).count++;
			}
		}

		// Collect unique see tags by reference
		for (const seeTag of seeTags) {
			/** @type {{reference?: string}} */
			const tag = /** @type {any} */ (seeTag);
			const key = tag.reference || "";
			if (key && !seeTagMap.has(key)) {
				seeTagMap.set(key, seeTag);
			}
		}
	}

	// Sort authors by contribution count (descending)
	const sortedAuthors = Array.from(authorMap.values())
		.sort((a, b) => b.count - a.count)
		.map((entry) => entry.tag);

	// Get unique see tags
	const uniqueSeeTags = Array.from(seeTagMap.values());

	return new AttributionContext(sortedAuthors, uniqueSeeTags, packageMetadata);
}

/**
 * Trace a re-exported entity back to its original source definition
 *
 * When an entity is a re-export (export { something } from './other-file'),
 * this function finds the original entity definition to get proper attribution
 * from where it was actually defined, not where it was re-exported from.
 *
 * @param {import('./entities/base.js').EntityBase} entity - Entity to trace
 * @param {Array<import('./module.js').Module>} allModules - All modules in the package
 * @returns {import('./entities/base.js').EntityBase|null} Original entity or null if not found
 */
function traceReexportToSource(entity, allModules) {
	if (!entity || !allModules) {
		return null;
	}

	// Check if this entity has re-export metadata indicating it came from another module
	/** @type {any} */
	const ent = entity;

	// Look for re-export indicators in the entity
	// This could be stored differently depending on how re-exports are processed
	if (ent.sourceModule || ent.reexportFrom || ent.originalModule) {
		const sourceModulePath =
			ent.sourceModule || ent.reexportFrom || ent.originalModule;
		const entityName = ent.originalName || ent.name;

		// Find the source module
		const sourceModule = findModuleByPath(
			sourceModulePath,
			allModules,
			ent.moduleId,
		);

		if (sourceModule) {
			// Find the original entity in the source module
			const originalEntity = sourceModule.entities.find(
				(e) => e.name === entityName,
			);

			if (originalEntity) {
				// Recursively trace in case of chained re-exports
				return (
					traceReexportToSource(originalEntity, allModules) || originalEntity
				);
			}
		}
	}

	return null;
}

/**
 * Find a module by resolving a relative path from the current module
 *
 * @param {string} targetPath - Target module path (e.g., './other-file', '../utils')
 * @param {Array<import('./module.js').Module>} allModules - All modules in the package
 * @param {string} currentModulePath - Current module's path for relative resolution
 * @returns {import('./module.js').Module|null} Found module or null
 */
function findModuleByPath(targetPath, allModules, currentModulePath) {
	if (!targetPath || !allModules || !currentModulePath) {
		return null;
	}

	// Handle different path formats
	if (targetPath.startsWith("./") || targetPath.startsWith("../")) {
		// Relative path - need to resolve against current module path
		const resolvedPath = resolveRelativePath(currentModulePath, targetPath);

		// Find module by resolved path
		return allModules.find((module) => {
			// Check various possible matches
			const modulePath = module.importPath || "";
			const fileBaseName =
				modulePath
					.split("/")
					.pop()
					?.replace(/\.(js|ts)$/, "") || "";
			const resolvedBaseName =
				resolvedPath
					.split("/")
					.pop()
					?.replace(/\.(js|ts)$/, "") || "";

			return (
				modulePath.includes(resolvedBaseName) ||
				fileBaseName === resolvedBaseName ||
				modulePath.endsWith(resolvedPath) ||
				modulePath.endsWith(`${resolvedPath}.js`)
			);
		});
	} else {
		// Absolute import path
		return allModules.find(
			(module) =>
				module.importPath === targetPath ||
				module.importPath.endsWith(`/${targetPath}`),
		);
	}
}

/**
 * Resolve a relative path against a base path
 *
 * @param {string} basePath - Base path (e.g., '@package/module/submodule')
 * @param {string} relativePath - Relative path (e.g., './other', '../utils')
 * @returns {string} Resolved path
 */
function resolveRelativePath(basePath, relativePath) {
	if (!basePath || !relativePath) {
		return relativePath;
	}

	// Split paths into segments
	const baseSegments = basePath.split("/");
	const relativeSegments = relativePath.split("/");

	// Remove empty segments and current directory references
	const cleanedRelativeSegments = relativeSegments.filter(
		(segment) => segment && segment !== ".",
	);

	const result = [...baseSegments];

	for (const segment of cleanedRelativeSegments) {
		if (segment === "..") {
			// Go up one directory
			result.pop();
		} else {
			// Add directory or file
			result.push(segment);
		}
	}

	return result.join("/");
}
