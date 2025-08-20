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
 * serialization, and output generation. Child classes implement entity-specific
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
		/** @type {string[]} */
		this.references = [];
		/** @type {string[]} */
		this.referencedBy = [];
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
	 * Add entity reference
	 * @param {string} entityId - Referenced entity ID
	 */
	addReference(entityId) {
		if (!this.references.includes(entityId)) {
			this.references.push(entityId);
		}
	}

	/**
	 * Add back-reference (entity that references this one)
	 * @param {string} entityId - Referencing entity ID
	 */
	addReferencedBy(entityId) {
		if (!this.referencedBy.includes(entityId)) {
			this.referencedBy.push(entityId);
		}
	}

	/**
	 * Get serializable data for JSON export
	 *
	 * MAY be overridden by child classes to provide entity-specific
	 * serializable data. Default implementation includes all common properties.
	 *
	 * @protected
	 * @returns {Object} Serializable data object
	 */
	getSerializableData() {
		/** @type {Record<string, any>} */
		const jsdocData = {};
		for (const tag of this.jsdocTags) {
			// Group tags by type, storing multiple tags of same type as arrays
			if (jsdocData[tag.tagType]) {
				if (Array.isArray(jsdocData[tag.tagType])) {
					jsdocData[tag.tagType].push(tag.toJSON());
				} else {
					jsdocData[tag.tagType] = [jsdocData[tag.tagType], tag.toJSON()];
				}
			} else {
				jsdocData[tag.tagType] = tag.toJSON();
			}
		}

		return {
			entityType: this.entityType,
			name: this.name,
			location: this.location,
			jsdoc: jsdocData,
			references: this.references,
			referencedBy: this.referencedBy,
			source: this.source,
			moduleId: this.moduleId,
			exports: this.exports,
		};
	}

	/**
	 * Serialize entity to JSON format
	 * @returns {Object} JSON representation with type metadata
	 */
	toJSON() {
		return {
			__type: this.entityType,
			__data: this.getSerializableData(),
		};
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
