/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Documentation graph entity - apex predator of documentation.
 *
 * Ravens orchestrate complete documentation ecosystems with surgical precision.
 * The ultimate container that assembles packages, modules, entities, content,
 * and assets into coherent, serializable documentation graphs.
 */

import { html } from "@raven-js/beak";

/**
 * Documentation graph implementation
 *
 * **Represents:** Complete documentation ecosystem for a package
 *
 * **Core Functionality:**
 * - Package-level metadata and configuration
 * - Module collection and organization
 * - Entity containment and cross-referencing
 * - Content management (READMEs, documentation)
 * - Asset tracking and embedding
 * - Graph-wide validation and integrity
 *
 * **Serialization:** Complete self-contained JSON representation
 */
export class DocumentationGraph {
	/**
	 * Create documentation graph instance
	 * @param {import('./package-entity.js').PackageEntity} packageEntity - Package entity
	 */
	constructor(packageEntity) {
		// Core containers
		this.package = packageEntity;

		/** @type {Map<string, import('./module-entity.js').ModuleEntity>} */
		this.modules = new Map();

		/** @type {Map<string, import('./entity-base.js').EntityBase>} */
		this.entities = new Map();

		/** @type {Map<string, import('./readme-content-entity.js').ReadmeContentEntity>} */
		this.content = new Map();

		/** @type {Map<string, import('./asset-entity.js').AssetEntity>} */
		this.assets = new Map();

		// Graph metadata
		this.generatedAt = new Date();
		this.version = "1.0.0"; // Graph format version
		this.totalSize = 0; // Total content size in bytes

		// Validation state
		this.isValidated = false;
		/** @type {Array<{type: string, message: string, entityId?: string, line?: number}>} */
		this.validationIssues = [];
	}

	/**
	 * Backward compatibility getter for references (simulates old Map interface)
	 * Cached for O(1) predatory strikes - V8 optimized
	 * @returns {Map<string, Set<string>>} Simulated references Map
	 */
	get references() {
		// Cache references map for O(1) access on repeated calls
		if (!this._referencesCache) {
			this._referencesCache = new Map();

			// Build cache with stable object shapes for JIT optimization
			for (const entity of this.entities.values()) {
				const entityId = entity.getId();
				const refs = new Set();

				// Optimized path for entities with getReferenceIds method
				if (typeof entity.getReferenceIds === "function") {
					const referenceIds = entity.getReferenceIds();
					for (let i = 0; i < referenceIds.length; i++) {
						refs.add(referenceIds[i]);
					}
				} else if (Array.isArray(entity.references)) {
					// Fallback path - use native iteration for JIT
					for (const ref of entity.references) {
						refs.add(
							typeof ref === "string" ? ref : /** @type {any} */ (ref).getId(),
						);
					}
				}

				this._referencesCache.set(entityId, refs);
			}

			// Merge pending references efficiently
			if (this._pendingReferences) {
				for (const [entityId, refs] of this._pendingReferences.entries()) {
					const existingRefs = this._referencesCache.get(entityId);
					if (existingRefs) {
						// Merge sets with native performance
						for (const ref of refs) {
							existingRefs.add(ref);
						}
					} else {
						this._referencesCache.set(entityId, new Set(refs));
					}
				}
			}
		}

		return this._referencesCache;
	}

	/**
	 * Backward compatibility getter for referencedBy (simulates old Map interface)
	 * Cached for O(1) predatory strikes - V8 optimized
	 * @returns {Map<string, Set<string>>} Simulated referencedBy Map
	 */
	get referencedBy() {
		// Cache referencedBy map for O(1) access on repeated calls
		if (!this._referencedByCache) {
			this._referencedByCache = new Map();

			// Build cache with stable object shapes for JIT optimization
			for (const entity of this.entities.values()) {
				const entityId = entity.getId();
				const refs = new Set();

				// Optimized path for entities with getReferencedByIds method
				if (typeof entity.getReferencedByIds === "function") {
					const referencedByIds = entity.getReferencedByIds();
					for (let i = 0; i < referencedByIds.length; i++) {
						refs.add(referencedByIds[i]);
					}
				} else if (Array.isArray(entity.referencedBy)) {
					// Fallback path - use native iteration for JIT
					for (const ref of entity.referencedBy) {
						refs.add(
							typeof ref === "string" ? ref : /** @type {any} */ (ref).getId(),
						);
					}
				}

				this._referencedByCache.set(entityId, refs);
			}

			// Merge pending referencedBy efficiently
			if (this._pendingReferencedBy) {
				for (const [entityId, refs] of this._pendingReferencedBy.entries()) {
					const existingRefs = this._referencedByCache.get(entityId);
					if (existingRefs) {
						// Merge sets with native performance
						for (const ref of refs) {
							existingRefs.add(ref);
						}
					} else {
						this._referencedByCache.set(entityId, new Set(refs));
					}
				}
			}
		}

		return this._referencedByCache;
	}

	/**
	 * Compatibility getter for readmes (content) as Map
	 * @returns {Map<string, import('./readme-content-entity.js').ReadmeContentEntity>} Content Map
	 */
	get readmes() {
		return this.content;
	}

	/**
	 * Get graph identifier (package name)
	 * @returns {string} Graph identifier
	 */
	getId() {
		return this.package.getId();
	}

	/**
	 * Add module to graph
	 * @param {import('./module-entity.js').ModuleEntity} moduleEntity - Module entity
	 */
	addModule(moduleEntity) {
		this.modules.set(moduleEntity.getId(), moduleEntity);
	}

	/**
	 * Add entity to graph (raven-optimized)
	 * @param {import('./entity-base.js').EntityBase|import('../extraction/entity-construction.js').EntityNode} entity - Entity to add
	 */
	addEntity(entity) {
		// Handle both EntityBase instances (with getId() method) and EntityNode objects (with id property)
		const entityId =
			typeof (/** @type {any} */ (entity).getId) === "function"
				? /** @type {any} */ (entity).getId()
				: /** @type {any} */ (entity).id;
		this.entities.set(entityId, /** @type {any} */ (entity));

		// Invalidate caches when entities are modified - maintain cache consistency
		this._referencesCache = null;
		this._referencedByCache = null;
	}

	/**
	 * Add content to graph
	 * @param {import('./readme-content-entity.js').ReadmeContentEntity} contentEntity - Content entity
	 */
	addContent(contentEntity) {
		this.content.set(contentEntity.getId(), contentEntity);
	}

	/**
	 * Add asset to graph
	 * @param {import('./asset-entity.js').AssetEntity} assetEntity - Asset entity
	 */
	addAsset(assetEntity) {
		this.assets.set(assetEntity.getId(), assetEntity);
	}

	/**
	 * Add reference between entities (raven-optimized for O(1) access)
	 * @param {string} fromEntityId - Source entity ID
	 * @param {string} toEntityId - Target entity ID
	 */
	addReference(fromEntityId, toEntityId) {
		const fromEntity = this.entities.get(fromEntityId);
		const toEntity = this.entities.get(toEntityId);

		// Invalidate caches when references are modified - maintain cache consistency
		this._referencesCache = null;
		this._referencedByCache = null;

		// Initialize pending maps with stable object shapes for JIT
		if (!this._pendingReferences) {
			this._pendingReferences = new Map();
		}
		if (!this._pendingReferencedBy) {
			this._pendingReferencedBy = new Map();
		}

		// Handle entities that exist
		if (fromEntity && typeof fromEntity.addReference === "function") {
			fromEntity.addReference(toEntityId);
		} else {
			// Store in pending references with Set for O(1) operations
			if (!this._pendingReferences.has(fromEntityId)) {
				this._pendingReferences.set(fromEntityId, new Set());
			}
			this._pendingReferences.get(fromEntityId).add(toEntityId);
		}

		if (toEntity && typeof toEntity.addReferencedBy === "function") {
			toEntity.addReferencedBy(fromEntityId);
		} else {
			// Store in pending referencedBy with Set for O(1) operations
			if (!this._pendingReferencedBy.has(toEntityId)) {
				this._pendingReferencedBy.set(toEntityId, new Set());
			}
			this._pendingReferencedBy.get(toEntityId).add(fromEntityId);
		}
	}

	/**
	 * Get entity by ID
	 * @param {string} entityId - Entity identifier
	 * @returns {import('./entity-base.js').EntityBase|null} Entity or null
	 */
	getEntity(entityId) {
		return this.entities.get(entityId) || null;
	}

	/**
	 * Resolve all string references to direct object references (raven optimization)
	 * Call this after all entities are loaded for maximum performance
	 */
	resolveEntityReferences() {
		for (const entity of this.entities.values()) {
			if (typeof entity._resolveReferences === "function") {
				entity._resolveReferences(this.entities);
			}
		}
	}

	/**
	 * Get module by ID
	 * @param {string} moduleId - Module identifier
	 * @returns {import('./module-entity.js').ModuleEntity|null} Module or null
	 */
	getModule(moduleId) {
		return this.modules.get(moduleId) || null;
	}

	/**
	 * Get content by ID
	 * @param {string} contentId - Content identifier
	 * @returns {import('./readme-content-entity.js').ReadmeContentEntity|null} Content or null
	 */
	getContent(contentId) {
		return this.content.get(contentId) || null;
	}

	/**
	 * Get asset by ID
	 * @param {string} assetId - Asset identifier
	 * @returns {import('./asset-entity.js').AssetEntity|null} Asset or null
	 */
	getAsset(assetId) {
		return this.assets.get(assetId) || null;
	}

	/**
	 * Get entities referenced by an entity (raven-optimized)
	 * @param {string} entityId - Entity identifier
	 * @returns {string[]} Array of referenced entity IDs
	 */
	getReferences(entityId) {
		const references = new Set();

		// Get references from existing entity
		const entity = this.entities.get(entityId);
		if (entity) {
			if (typeof entity.getReferenceIds === "function") {
				// Use getter method if available
				for (const ref of entity.getReferenceIds()) {
					references.add(ref);
				}
			} else if (Array.isArray(entity.references)) {
				// Fallback to direct property access for legacy compatibility
				for (const ref of entity.references) {
					references.add(
						typeof ref === "string" ? ref : /** @type {any} */ (ref).getId(),
					);
				}
			}
		}

		// Get pending references for non-existent entities
		if (this._pendingReferences?.has(entityId)) {
			for (const ref of this._pendingReferences.get(entityId)) {
				references.add(ref);
			}
		}

		return Array.from(references);
	}

	/**
	 * Get entities that reference an entity (raven-optimized)
	 * @param {string} entityId - Entity identifier
	 * @returns {string[]} Array of referencing entity IDs
	 */
	getReferencedBy(entityId) {
		const referencedBy = new Set();

		// Get referencedBy from existing entity
		const entity = this.entities.get(entityId);
		if (entity) {
			if (typeof entity.getReferencedByIds === "function") {
				// Use getter method if available
				for (const ref of entity.getReferencedByIds()) {
					referencedBy.add(ref);
				}
			} else if (Array.isArray(entity.referencedBy)) {
				// Fallback to direct property access for legacy compatibility
				for (const ref of entity.referencedBy) {
					referencedBy.add(
						typeof ref === "string" ? ref : /** @type {any} */ (ref).getId(),
					);
				}
			}
		}

		// Get pending referencedBy for non-existent entities
		if (this._pendingReferencedBy?.has(entityId)) {
			for (const ref of this._pendingReferencedBy.get(entityId)) {
				referencedBy.add(ref);
			}
		}

		return Array.from(referencedBy);
	}

	/**
	 * Get all entities of a specific type
	 * @param {string} entityType - Entity type filter
	 * @returns {import('./entity-base.js').EntityBase[]} Array of entities
	 */
	getEntitiesByType(entityType) {
		return Array.from(this.entities.values()).filter(
			(entity) => entity.entityType === entityType,
		);
	}

	/**
	 * Get entities in a specific module
	 * @param {string} moduleId - Module identifier
	 * @returns {import('./entity-base.js').EntityBase[]} Array of entities
	 */
	getEntitiesInModule(moduleId) {
		return Array.from(this.entities.values()).filter(
			(entity) => entity.moduleId === moduleId,
		);
	}

	/**
	 * Calculate graph statistics (raven-optimized)
	 * @returns {{entityCount: number, moduleCount: number, contentCount: number, assetCount: number, referenceCount: number}} Graph statistics
	 */
	getStatistics() {
		let referenceCount = 0;
		for (const entity of this.entities.values()) {
			if (typeof entity.getReferenceIds === "function") {
				referenceCount += entity.getReferenceIds().length;
			}
		}

		return {
			entityCount: this.entities.size,
			moduleCount: this.modules.size,
			contentCount: this.content.size,
			assetCount: this.assets.size,
			referenceCount,
		};
	}

	/**
	 * Get entity types distribution
	 * @returns {Record<string, number>} Entity count by type
	 */
	getEntityTypeDistribution() {
		/** @type {Record<string, number>} */
		const distribution = {};
		for (const entity of this.entities.values()) {
			const type = entity.entityType;
			distribution[type] = (distribution[type] || 0) + 1;
		}
		return distribution;
	}

	/**
	 * Calculate total graph size
	 * @returns {number} Total size in bytes
	 */
	calculateSize() {
		let totalSize = 0;

		// Add content sizes
		for (const content of this.content.values()) {
			totalSize += content.content.length;
		}

		// Add asset sizes
		for (const asset of this.assets.values()) {
			totalSize += asset.size || 0;
		}

		this.totalSize = totalSize;
		return totalSize;
	}

	/**
	 * Validate entire graph
	 */
	validate() {
		this.validationIssues = [];

		// Validate package
		this.package.validate();
		if (!this.package.isValid()) {
			this.validationIssues.push({
				type: "invalid_package",
				message: "Package entity validation failed",
				line: 1, // Package-level issue, use line 1
			});
		}

		// Validate all modules
		for (const module of this.modules.values()) {
			module.validate();
			if (!module.isValid()) {
				this.validationIssues.push({
					type: "invalid_module",
					message: `Module '${module.getId()}' validation failed`,
					entityId: module.getId(),
					line: 1, // Module-level issue, use line 1
				});
			}
		}

		// Validate all entities
		for (const entity of this.entities.values()) {
			// Handle both EntityBase instances (with validate() method) and EntityNode objects
			if (typeof entity.validate === "function") {
				entity.validate();
				if (typeof entity.isValid === "function" && !entity.isValid()) {
					const entityId =
						typeof (/** @type {any} */ (entity).getId) === "function"
							? /** @type {any} */ (entity).getId()
							: /** @type {any} */ (entity).id;
					this.validationIssues.push({
						type: "invalid_entity",
						message: `Entity '${entityId}' validation failed`,
						entityId: entityId,
						line: entity.location?.line || 1,
					});
				}
			}
			// EntityNode objects don't have validation methods, so we assume they're valid
		}

		// Validate all content
		for (const content of this.content.values()) {
			content.validate();
			if (!content.isValid()) {
				this.validationIssues.push({
					type: "invalid_content",
					message: `Content '${content.getId()}' validation failed`,
					entityId: content.getId(),
					line: 1, // Content-level issue, use line 1
				});
			}
		}

		// Validate all assets
		for (const asset of this.assets.values()) {
			asset.validate();
			if (!asset.isValid()) {
				this.validationIssues.push({
					type: "invalid_asset",
					message: `Asset '${asset.getId()}' validation failed`,
					entityId: asset.getId(),
					line: 1, // Asset-level issue, use line 1
				});
			}
		}

		// Validate references
		this.validateReferences();

		this.isValidated = this.validationIssues.length === 0;
	}

	/**
	 * Validate reference integrity (raven-optimized)
	 */
	validateReferences() {
		// Check for dangling references
		for (const entity of this.entities.values()) {
			const entityId = entity.getId();
			/** @type {string[]} */
			let references = [];

			if (typeof entity.getReferenceIds === "function") {
				references = entity.getReferenceIds();
			} else if (Array.isArray(entity.references)) {
				references = entity.references.map((ref) =>
					typeof ref === "string" ? ref : /** @type {any} */ (ref).getId(),
				);
			}

			for (const refId of references) {
				if (!this.entities.has(refId)) {
					const line = entity.location?.line || 1;
					this.validationIssues.push({
						type: "dangling_reference",
						message: `Entity '${entityId}' references non-existent entity '${refId}'`,
						entityId,
						line,
					});
				}
			}
		}

		// Check for inconsistent backward references
		for (const entity of this.entities.values()) {
			const entityId = entity.getId();
			/** @type {string[]} */
			let referencedBy = [];

			if (typeof entity.getReferencedByIds === "function") {
				referencedBy = entity.getReferencedByIds();
			} else if (Array.isArray(entity.referencedBy)) {
				referencedBy = entity.referencedBy.map((ref) =>
					typeof ref === "string" ? ref : /** @type {any} */ (ref).getId(),
				);
			}

			for (const refId of referencedBy) {
				const refEntity = this.entities.get(refId);
				if (!refEntity) {
					continue; // Entity doesn't exist, will be caught by dangling reference check
				}

				// Check if refEntity actually references this entity
				/** @type {string[]} */
				let refEntityReferences = [];
				if (typeof refEntity.getReferenceIds === "function") {
					refEntityReferences = refEntity.getReferenceIds();
				} else if (Array.isArray(refEntity.references)) {
					refEntityReferences = refEntity.references.map((ref) =>
						typeof ref === "string" ? ref : /** @type {any} */ (ref).getId(),
					);
				}

				if (!refEntityReferences.includes(entityId)) {
					const line = entity.location?.line || 1;
					this.validationIssues.push({
						type: "inconsistent_reference",
						message: `Inconsistent reference between '${refId}' and '${entityId}'`,
						entityId,
						line,
					});
				}
			}
		}
	}

	/**
	 * Check if graph is valid
	 * @returns {boolean} True if graph is valid
	 */
	isValid() {
		return this.isValidated;
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for graph overview
	 */
	toHTML() {
		const stats = this.getStatistics();
		const typeDistribution = this.getEntityTypeDistribution();

		return html`
			<div class="documentation-graph">
				<h1>Documentation Graph: ${this.package.name}</h1>
				<div class="graph-meta">
					<span class="graph-version">v${this.package.version}</span>
					<span class="graph-generated">Generated: ${this.generatedAt.toISOString()}</span>
				</div>

				<div class="graph-stats">
					<div class="stat"><strong>Modules:</strong> ${stats.moduleCount}</div>
					<div class="stat"><strong>Entities:</strong> ${stats.entityCount}</div>
					<div class="stat"><strong>Content:</strong> ${stats.contentCount}</div>
					<div class="stat"><strong>Assets:</strong> ${stats.assetCount}</div>
					<div class="stat"><strong>References:</strong> ${stats.referenceCount}</div>
				</div>

				<div class="entity-distribution">
					<h2>Entity Distribution</h2>
					<ul class="distribution-list">
						${Object.entries(typeDistribution)
							.map(
								([type, count]) => html`
							<li><strong>${type}:</strong> ${count}</li>
						`,
							)
							.join("\n")}
					</ul>
				</div>

				${
					this.validationIssues.length > 0
						? html`
					<div class="validation-issues">
						<h2>Validation Issues</h2>
						<ul class="issue-list">
							${this.validationIssues
								.map(
									(issue) => html`
								<li class="issue-${issue.type}">
									<strong>${issue.type}:</strong> ${issue.message}
									${issue.entityId ? html` (${issue.entityId})` : ""}
								</li>
							`,
								)
								.join("\n")}
						</ul>
					</div>
				`
						: ""
				}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for graph overview
	 */
	toMarkdown() {
		const stats = this.getStatistics();

		let output = `# Documentation Graph: ${this.package.name}\n\n`;
		output += `**Version:** ${this.package.version}\n`;
		output += `**Generated:** ${this.generatedAt.toISOString()}\n\n`;

		output += `## Statistics\n\n`;
		output += `- **Modules:** ${stats.moduleCount}\n`;
		output += `- **Entities:** ${stats.entityCount}\n`;
		output += `- **Content:** ${stats.contentCount}\n`;
		output += `- **Assets:** ${stats.assetCount}\n`;
		output += `- **References:** ${stats.referenceCount}\n\n`;

		const typeDistribution = this.getEntityTypeDistribution();
		if (Object.keys(typeDistribution).length > 0) {
			output += `## Entity Distribution\n\n`;
			for (const [type, count] of Object.entries(typeDistribution)) {
				output += `- **${type}:** ${count}\n`;
			}
			output += `\n`;
		}

		return output;
	}
}
