/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Documentation module container - surgical entity organization
 *
 * Ravens group entities by module boundaries with predatory precision.
 * Organizes JavaScript entities within module context for documentation
 * renderers. Provides computed groupings and filtering for HTML docs,
 * JSON APIs, and SSG generation. Zero external dependencies.
 */

/**
 * Documentation module container
 *
 * Organizes entities within a module boundary for documentation generation.
 * Provides renderer-optimized computed properties for entity grouping,
 * filtering, and organization. Maintains module identity through import path
 * while providing flexible entity access patterns.
 *
 * **Design Philosophy:** Module as organizational unit that groups related
 * entities for documentation purposes. Provides computed views of entities
 * without duplicating data - filtering and grouping on demand.
 *
 * **Zero Dependencies:** Pure V8 JavaScript, no external packages
 * **Renderer Agnostic:** Data organization only, no output generation
 */
export class Module {
	/**
	 * Create documentation module instance
	 * @param {string} importPath - Module import path (e.g., "package" or "package/utils")
	 * @param {boolean} isDefault - Whether this is the default "." export module
	 * @param {string} readme - Module README content or inherited package README
	 * @param {Array<import('./entities/base.js').EntityBase>} entities - Array of entities in this module
	 * @param {string} [description] - Module description from @file JSDoc tag
	 * @param {Array<Object>} [reexports] - Array of re-export references
	 */
	constructor(importPath, isDefault, readme, entities, description, reexports) {
		/** @type {string} Module import path for import statements */
		this.importPath = importPath || "";
		/** @type {boolean} Whether this is the default "." export module */
		this.isDefault = Boolean(isDefault);
		/** @type {string} Module README content or inherited package README */
		this.readme = readme || "";
		/** @type {Array<import('./entities/base.js').EntityBase>} Array of entities in this module */
		this.entities = Array.isArray(entities) ? entities : [];
		/** @type {string} Module description from @file JSDoc tag */
		this.description = description || "";
		/** @type {Array<Object>} Array of re-export references */
		this.reexports = Array.isArray(reexports) ? reexports : [];
	}

	/**
	 * Add entity to module
	 * @param {import('./entities/base.js').EntityBase} entity - Entity to add
	 */
	addEntity(entity) {
		if (entity && typeof entity === "object") {
			this.entities.push(entity);
		}
	}

	/**
	 * Add re-export reference to module
	 * @param {Object} reexport - Re-export reference to add
	 * @param {string} reexport.name - Name of the re-exported entity
	 */
	addReexport(reexport) {
		if (
			reexport &&
			typeof reexport === "object" &&
			typeof reexport.name === "string"
		) {
			this.reexports.push(reexport);
		}
	}

	/**
	 * Remove entity from module
	 * @param {import('./entities/base.js').EntityBase} entity - Entity to remove
	 * @returns {boolean} True if entity was removed, false if not found
	 */
	removeEntity(entity) {
		const index = this.entities.indexOf(entity);
		if (index !== -1) {
			this.entities.splice(index, 1);
			return true;
		}
		return false;
	}

	/**
	 * Get public entities (non-private, excluding re-exports)
	 * @returns {Array<import('./entities/base.js').EntityBase>} Public entities only
	 */
	get publicEntities() {
		// Filter private entities (re-exports are handled separately)
		return this.entities.filter((entity) => {
			// Check for @private JSDoc tag or private naming convention
			const hasPrivateTag = entity.hasJSDocTag?.("private");
			const hasPrivateName = entity.name?.startsWith("_");
			return !hasPrivateTag && !hasPrivateName;
		});
	}

	/**
	 * Get entities grouped by type
	 * @returns {Object<string, Array<import('./entities/base.js').EntityBase>>} Entities grouped by type
	 */
	get entityGroups() {
		/** @type {Object<string, Array<import('./entities/base.js').EntityBase>>} */
		const groups = {};
		for (const entity of this.entities) {
			const type = entity.entityType || "unknown";
			if (!groups[type]) {
				groups[type] = [];
			}
			groups[type].push(entity);
		}
		return groups;
	}

	/**
	 * Get public entities grouped by type (excluding re-exports)
	 * @returns {Object<string, Array<import('./entities/base.js').EntityBase>>} Public entities grouped by type
	 */
	get publicEntityGroups() {
		/** @type {Object<string, Array<import('./entities/base.js').EntityBase>>} */
		const groups = {};
		for (const entity of this.publicEntities) {
			const type = entity.entityType || "unknown";
			if (!groups[type]) {
				groups[type] = [];
			}
			groups[type].push(entity);
		}
		return groups;
	}

	/**
	 * Find entity by name
	 * @param {string} name - Entity name to find
	 * @returns {import('./entities/base.js').EntityBase|null} Entity or null if not found
	 */
	findEntityByName(name) {
		return this.entities.find((entity) => entity.name === name) || null;
	}

	/**
	 * Get entities by type
	 * @param {string} entityType - Entity type to filter by
	 * @returns {Array<import('./entities/base.js').EntityBase>} Entities of specified type
	 */
	getEntitiesByType(entityType) {
		return this.entities.filter((entity) => entity.entityType === entityType);
	}

	/**
	 * Get entity count
	 * @returns {number} Total entity count
	 */
	get entityCount() {
		return this.entities.length;
	}

	/**
	 * Get public entity count
	 * @returns {number} Public entity count
	 */
	get publicEntityCount() {
		return this.publicEntities.length;
	}

	/**
	 * Check if module has entities
	 * @returns {boolean} True if module has at least one entity
	 */
	get hasEntities() {
		return this.entities.length > 0;
	}

	/**
	 * Check if module has public entities
	 * @returns {boolean} True if module has at least one public entity
	 */
	get hasPublicEntities() {
		return this.publicEntities.length > 0;
	}

	/**
	 * Get available entity types in this module
	 * @returns {Array<string>} Unique entity types present in module
	 */
	get availableEntityTypes() {
		const types = new Set(
			this.entities.map((entity) => entity.entityType || "unknown"),
		);
		return Array.from(types);
	}

	/**
	 * Serialize module to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			importPath: this.importPath,
			isDefault: this.isDefault,
			readme: this.readme,
			entities: this.entities.map((entity) =>
				entity.toObject ? entity.toObject() : entity,
			),
			entityCount: this.entityCount,
			publicEntityCount: this.publicEntityCount,
			availableEntityTypes: this.availableEntityTypes,
		};
	}
}
