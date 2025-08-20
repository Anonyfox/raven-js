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

		// Cross-reference tracking
		/** @type {Map<string, Set<string>>} */
		this.references = new Map(); // entity -> [referenced entities]
		/** @type {Map<string, Set<string>>} */
		this.referencedBy = new Map(); // entity -> [entities referencing this]

		// Validation state
		this.isValidated = false;
		/** @type {Array<{type: string, message: string, entityId?: string}>} */
		this.validationIssues = [];
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
	 * Add entity to graph
	 * @param {import('./entity-base.js').EntityBase} entity - Entity to add
	 */
	addEntity(entity) {
		this.entities.set(entity.getId(), entity);

		// Initialize reference tracking
		if (!this.references.has(entity.getId())) {
			this.references.set(entity.getId(), new Set());
		}
		if (!this.referencedBy.has(entity.getId())) {
			this.referencedBy.set(entity.getId(), new Set());
		}
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
	 * Add reference between entities
	 * @param {string} fromEntityId - Source entity ID
	 * @param {string} toEntityId - Target entity ID
	 */
	addReference(fromEntityId, toEntityId) {
		// Add forward reference
		if (!this.references.has(fromEntityId)) {
			this.references.set(fromEntityId, new Set());
		}
		this.references.get(fromEntityId).add(toEntityId);

		// Add backward reference
		if (!this.referencedBy.has(toEntityId)) {
			this.referencedBy.set(toEntityId, new Set());
		}
		this.referencedBy.get(toEntityId).add(fromEntityId);

		// Update entity objects if they exist
		const fromEntity = this.entities.get(fromEntityId);
		const toEntity = this.entities.get(toEntityId);

		if (fromEntity && typeof fromEntity.addReference === "function") {
			fromEntity.addReference(toEntityId);
		}
		if (toEntity && typeof toEntity.addReferencedBy === "function") {
			toEntity.addReferencedBy(fromEntityId);
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
	 * Get entities referenced by an entity
	 * @param {string} entityId - Entity identifier
	 * @returns {string[]} Array of referenced entity IDs
	 */
	getReferences(entityId) {
		const refs = this.references.get(entityId);
		return refs ? Array.from(refs) : [];
	}

	/**
	 * Get entities that reference an entity
	 * @param {string} entityId - Entity identifier
	 * @returns {string[]} Array of referencing entity IDs
	 */
	getReferencedBy(entityId) {
		const refs = this.referencedBy.get(entityId);
		return refs ? Array.from(refs) : [];
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
	 * Calculate graph statistics
	 * @returns {{entityCount: number, moduleCount: number, contentCount: number, assetCount: number, referenceCount: number}} Graph statistics
	 */
	getStatistics() {
		let referenceCount = 0;
		for (const refs of this.references.values()) {
			referenceCount += refs.size;
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
			totalSize += asset.fileSize || 0;
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
				});
			}
		}

		// Validate all entities
		for (const entity of this.entities.values()) {
			entity.validate();
			if (!entity.isValid()) {
				this.validationIssues.push({
					type: "invalid_entity",
					message: `Entity '${entity.getId()}' validation failed`,
					entityId: entity.getId(),
				});
			}
		}

		// Validate all content
		for (const content of this.content.values()) {
			content.validate();
			if (!content.isValid()) {
				this.validationIssues.push({
					type: "invalid_content",
					message: `Content '${content.getId()}' validation failed`,
					entityId: content.getId(),
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
				});
			}
		}

		// Validate references
		this.validateReferences();

		this.isValidated = this.validationIssues.length === 0;
	}

	/**
	 * Validate reference integrity
	 */
	validateReferences() {
		// Check for dangling references
		for (const [entityId, refs] of this.references.entries()) {
			for (const refId of refs) {
				if (!this.entities.has(refId)) {
					this.validationIssues.push({
						type: "dangling_reference",
						message: `Entity '${entityId}' references non-existent entity '${refId}'`,
						entityId,
					});
				}
			}
		}

		// Check for inconsistent backward references
		for (const [entityId, refs] of this.referencedBy.entries()) {
			for (const refId of refs) {
				if (
					!this.references.has(refId) ||
					!this.references.get(refId).has(entityId)
				) {
					this.validationIssues.push({
						type: "inconsistent_reference",
						message: `Inconsistent reference between '${refId}' and '${entityId}'`,
						entityId,
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
	 * Get serializable data for JSON export
	 * @returns {Object} Graph-specific serializable data
	 */
	getSerializableData() {
		// Convert Maps to plain objects for serialization
		const moduleData = {};
		for (const [id, module] of this.modules.entries()) {
			moduleData[id] = module.getSerializableData();
		}

		const entityData = {};
		for (const [id, entity] of this.entities.entries()) {
			entityData[id] = entity.getSerializableData();
		}

		const contentData = {};
		for (const [id, content] of this.content.entries()) {
			contentData[id] = content.getSerializableData();
		}

		const assetData = {};
		for (const [id, asset] of this.assets.entries()) {
			assetData[id] = asset.getSerializableData();
		}

		// Convert reference Maps to plain objects
		const referenceData = {};
		for (const [id, refs] of this.references.entries()) {
			referenceData[id] = Array.from(refs);
		}

		const referencedByData = {};
		for (const [id, refs] of this.referencedBy.entries()) {
			referencedByData[id] = Array.from(refs);
		}

		return {
			package: this.package.getSerializableData(),
			modules: moduleData,
			entities: entityData,
			content: contentData,
			assets: assetData,
			references: referenceData,
			referencedBy: referencedByData,
			generatedAt: this.generatedAt,
			version: this.version,
			totalSize: this.calculateSize(),
			statistics: this.getStatistics(),
			entityTypeDistribution: this.getEntityTypeDistribution(),
			validationIssues: this.validationIssues,
		};
	}

	/**
	 * Serialize graph to JSON format
	 * @returns {Object} JSON representation
	 */
	toJSON() {
		return {
			__type: "documentation-graph",
			__data: this.getSerializableData(),
		};
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
