/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Base class for all JavaScript entity models - predatory foundation.
 *
 * Ravens hunt JavaScript constructs with systematic precision. This abstract
 * base provides unified composition of JSDoc tags, serialization capabilities,
 * and validation contracts for all language entities.
 */

import { html } from "@raven-js/beak";

/**
 * Abstract base class for all JavaScript entity types
 *
 * Provides common functionality for entity composition, JSDoc tag management,
 * and output generation. Child classes implement entity-specific
 * parsing, validation, and rendering logic.
 *
 * **Core Philosophy:** Entities "have" JSDoc tags through composition, not inheritance.
 * Each entity type declares which JSDoc tags are valid and how to validate them.
 *
 * @abstract
 */
export class EntityBase {
	/**
	 * Create a JavaScript entity instance
	 * @param {string} entityType - Type identifier (function, class, variable, etc.)
	 * @param {string} name - Entity name
	 * @param {Object} location - Source location metadata
	 * @param {string} location.file - Relative file path
	 * @param {number} location.line - Line number
	 * @param {number} location.column - Column number
	 */
	constructor(entityType, name, location) {
		if (new.target === EntityBase) {
			throw new Error(
				"EntityBase is abstract and cannot be instantiated directly",
			);
		}

		this.entityType = entityType;
		this.name = name;
		this.location = location;
		/** @type {import('./jsdoc-tag-base.js').JSDocTagBase[]} */
		this.jsdocTags = [];

		// Direct object references for O(1) access (raven-optimized) - stored separately from compatibility layer
		/** @type {EntityBase[]} */
		this._objectReferences = [];
		/** @type {EntityBase[]} */
		this._objectReferencedBy = [];

		// String references for backward compatibility during serialization
		/** @type {string[]} */
		this._referenceIds = [];
		/** @type {string[]} */
		this._referencedByIds = [];

		this.source = "";
		this.moduleId = "";
		/** @type {string[]} */
		this.exports = [];
		this.isValidated = false;
	}

	/**
	 * Get unique entity identifier
	 * @returns {string} Unique ID in format moduleId/entityName
	 */
	getId() {
		return this.moduleId ? `${this.moduleId}/${this.name}` : this.name;
	}

	/**
	 * Attach JSDoc tag to this entity
	 * @param {import('./jsdoc-tag-base.js').JSDocTagBase} tag - JSDoc tag instance
	 */
	addJSDocTag(tag) {
		if (!tag || typeof tag.tagType !== "string") {
			throw new Error("Invalid JSDoc tag: missing tagType");
		}

		// Validate tag is allowed for this entity type
		if (!this.isValidJSDocTag(tag.tagType)) {
			throw new Error(
				`JSDoc tag '@${tag.tagType}' is not valid for ${this.entityType} entities`,
			);
		}

		this.jsdocTags.push(tag);
	}

	/**
	 * Get JSDoc tag by type (returns first matching tag)
	 * @param {string} tagType - Tag type to retrieve
	 * @returns {import('./jsdoc-tag-base.js').JSDocTagBase|null} JSDoc tag or null
	 */
	getJSDocTag(tagType) {
		return this.jsdocTags.find((tag) => tag.tagType === tagType) || null;
	}

	/**
	 * Get all JSDoc tags
	 * @returns {import('./jsdoc-tag-base.js').JSDocTagBase[]} Array of JSDoc tags
	 */
	getAllJSDocTags() {
		return this.jsdocTags;
	}

	/**
	 * Check if JSDoc tag type is valid for this entity
	 *
	 * MUST be implemented by child classes to declare which JSDoc tags
	 * are valid for their specific entity type.
	 *
	 * @abstract
	 * @param {string} _tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for this entity type
	 */
	isValidJSDocTag(_tagType) {
		throw new Error("isValidJSDocTag() must be implemented by child classes");
	}

	/**
	 * Parse entity-specific content from raw code data
	 *
	 * MUST be implemented by child classes to extract entity-specific
	 * information from the raw code entity and content.
	 *
	 * @abstract
	 * @param {any} _rawEntity - Raw code entity from validation
	 * @param {string} _content - Full file content for context
	 */
	parseEntity(_rawEntity, _content) {
		throw new Error("parseEntity() must be implemented by child classes");
	}

	/**
	 * Validate entity and its JSDoc documentation
	 *
	 * MUST be implemented by child classes to perform entity-specific
	 * validation and set this.isValidated appropriately.
	 *
	 * @abstract
	 */
	validate() {
		throw new Error("validate() must be implemented by child classes");
	}

	/**
	 * Check if entity is valid
	 * @returns {boolean} True if entity is valid
	 */
	isValid() {
		return this.isValidated;
	}

	/**
	 * Set source code snippet
	 * @param {string} sourceCode - Source code snippet
	 */
	setSource(sourceCode) {
		this.source = sourceCode;
	}

	/**
	 * Set module context
	 * @param {string} moduleId - Module identifier
	 * @param {string[]} exportTypes - Export types
	 */
	setModuleContext(moduleId, exportTypes = []) {
		this.moduleId = moduleId;
		this.exports = exportTypes;
	}

	/**
	 * Add entity reference (raven-optimized with O(1) access)
	 * @param {EntityBase|string} entityOrId - Referenced entity object or ID
	 */
	addReference(entityOrId) {
		if (typeof entityOrId === "string") {
			// String ID - store for later resolution
			if (!this._referenceIds.includes(entityOrId)) {
				this._referenceIds.push(entityOrId);
			}
		} else {
			// Direct object reference - O(1) predatory strike
			if (!this._objectReferences.includes(entityOrId)) {
				this._objectReferences.push(entityOrId);
				const entityId = entityOrId.getId();
				if (!this._referenceIds.includes(entityId)) {
					this._referenceIds.push(entityId);
				}
			}
		}
	}

	/**
	 * Add back-reference (entity that references this one)
	 * @param {EntityBase|string} entityOrId - Referencing entity object or ID
	 */
	addReferencedBy(entityOrId) {
		if (typeof entityOrId === "string") {
			// String ID - store for later resolution
			if (!this._referencedByIds.includes(entityOrId)) {
				this._referencedByIds.push(entityOrId);
			}
		} else {
			// Direct object reference - O(1) predatory strike
			if (!this._objectReferencedBy.includes(entityOrId)) {
				this._objectReferencedBy.push(entityOrId);
				const entityId = entityOrId.getId();
				if (!this._referencedByIds.includes(entityId)) {
					this._referencedByIds.push(entityId);
				}
			}
		}
	}

	/**
	 * Resolve string references to object references (internal raven optimization)
	 * @param {Map<string, EntityBase>} entityPool - Pool of all entities for resolution
	 */
	_resolveReferences(entityPool) {
		// Resolve references
		for (const refId of this._referenceIds) {
			const entity = entityPool.get(refId);
			if (entity && !this._objectReferences.includes(entity)) {
				this._objectReferences.push(entity);
			}
		}

		// Resolve back-references
		for (const refId of this._referencedByIds) {
			const entity = entityPool.get(refId);
			if (entity && !this._objectReferencedBy.includes(entity)) {
				this._objectReferencedBy.push(entity);
			}
		}
	}

	/**
	 * Get reference IDs (for serialization)
	 * @returns {string[]} Array of referenced entity IDs
	 */
	getReferenceIds() {
		return this._referenceIds.slice();
	}

	/**
	 * Get referenced-by IDs (for serialization)
	 * @returns {string[]} Array of referencing entity IDs
	 */
	getReferencedByIds() {
		return this._referencedByIds.slice();
	}

	/**
	 * Backward compatibility getter for references (test compatibility)
	 * @returns {string[]} Array of referenced entity IDs
	 */
	get references() {
		// Return direct object references for runtime, but provide string fallback for tests
		if (this._referenceIds.length > 0) {
			return this._referenceIds.slice();
		}
		return [];
	}

	/**
	 * Backward compatibility setter for references (test compatibility)
	 * @param {string[]} refs - Array of reference IDs
	 */
	set references(refs) {
		this._referenceIds = refs.slice();
	}

	/**
	 * Backward compatibility getter for referencedBy (test compatibility)
	 * @returns {string[]} Array of referencing entity IDs
	 */
	get referencedBy() {
		// Return direct object references for runtime, but provide string fallback for tests
		if (this._referencedByIds.length > 0) {
			return this._referencedByIds.slice();
		}
		return [];
	}

	/**
	 * Backward compatibility setter for referencedBy (test compatibility)
	 * @param {string[]} refs - Array of referencing entity IDs
	 */
	set referencedBy(refs) {
		this._referencedByIds = refs.slice();
	}

	/**
	 * Generate HTML representation
	 *
	 * SHOULD be overridden by child classes for entity-specific HTML output.
	 * Default implementation provides basic entity information.
	 *
	 * @returns {string} HTML string
	 */
	toHTML() {
		return html`
			<div class="entity" data-type="${this.entityType}">
				<h3>${this.name}</h3>
				<div class="entity-meta">
					<span class="entity-type">${this.entityType}</span>
					<span class="entity-location">${this.location.file}:${this.location.line}</span>
				</div>
				${
					this.getAllJSDocTags().length > 0
						? html`
					<div class="jsdoc-tags">
						${this.getAllJSDocTags()
							.map((tag) => tag.toHTML())
							.join("\n")}
					</div>
				`
						: ""
				}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 *
	 * SHOULD be overridden by child classes for entity-specific Markdown output.
	 * Default implementation provides basic entity information.
	 *
	 * @returns {string} Markdown string
	 */
	toMarkdown() {
		const jsdocOutput = this.getAllJSDocTags()
			.map((tag) => tag.toMarkdown())
			.join("\n");

		return `### ${this.name}\n\n**Type:** ${this.entityType}\n**Location:** ${this.location.file}:${this.location.line}\n\n${jsdocOutput}`;
	}
}
