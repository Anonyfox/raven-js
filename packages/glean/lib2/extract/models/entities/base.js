/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Lean entity base class - predatory foundation for JavaScript construct models
 *
 * Ravens hunt JavaScript constructs with surgical precision. This abstract base
 * provides unified JSDoc tag composition, description management, and validation
 * contracts for all language entities. Zero external dependencies, pure extraction.
 */

/**
 * Abstract base class for all JavaScript entity types
 *
 * Provides lean functionality for entity composition, JSDoc tag management,
 * and description handling. Child classes implement entity-specific parsing
 * and validation logic.
 *
 * **Core Philosophy:** Entities "have" JSDoc tags and descriptions through composition.
 * Each entity type declares which JSDoc tags are valid and handles its own parsing.
 *
 * **Zero External Dependencies:** Pure V8 JavaScript only
 * **No Rendering:** Data extraction layer only, no HTML/Markdown output
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

		/** @type {string} Entity type identifier */
		this.entityType = entityType;
		/** @type {string} Entity name */
		this.name = name;
		/** @type {Object} Source location metadata */
		this.location = location;

		/** @type {string} General description from comment block (JSDoc tags stripped) */
		this.description = "";
		/** @type {Array} Collection of parsed JSDoc tags */
		this.jsdocTags = [];
		/** @type {string} Raw source code for this entity */
		this.source = "";
		/** @type {string} Module identifier this entity belongs to */
		this.moduleId = "";
		/** @type {boolean} Whether entity has been validated */
		this.isValidated = false;
	}

	/**
	 * Get unique entity identifier
	 * @returns {string} Unique ID in format moduleId/entityName
	 */
	getId() {
		return `${this.moduleId}/${this.name}`;
	}

	/**
	 * Add JSDoc tag to entity
	 * @param {Object} tag - JSDoc tag instance
	 */
	addJSDocTag(tag) {
		if (tag && typeof tag === "object") {
			this.jsdocTags.push(tag);
		}
	}

	/**
	 * Get all JSDoc tags
	 * @returns {Array} All JSDoc tags
	 */
	getAllJSDocTags() {
		return this.jsdocTags;
	}

	/**
	 * Get JSDoc tags by type
	 * @param {string} tagType - Tag type to filter by
	 * @returns {Array} Tags of specified type
	 */
	getJSDocTagsByType(tagType) {
		return this.jsdocTags.filter((tag) => tag.tagType === tagType);
	}

	/**
	 * Get first JSDoc tag of specified type
	 * @param {string} tagType - Tag type to find
	 * @returns {Object|null} First tag of type or null
	 */
	getJSDocTag(tagType) {
		return this.jsdocTags.find((tag) => tag.tagType === tagType) || null;
	}

	/**
	 * Check if entity has JSDoc tag of specified type
	 * @param {string} tagType - Tag type to check
	 * @returns {boolean} True if tag exists
	 */
	hasJSDocTag(tagType) {
		return this.jsdocTags.some((tag) => tag.tagType === tagType);
	}

	/**
	 * Set general description from comment block
	 * @param {string} description - Description text (JSDoc tags already stripped)
	 */
	setDescription(description) {
		this.description = description?.trim() || "";
	}

	/**
	 * Set source code for this entity
	 * @param {string} sourceCode - Raw source code
	 */
	setSource(sourceCode) {
		this.source = sourceCode?.trim() || "";
	}

	/**
	 * Set module identifier
	 * @param {string} moduleId - Module identifier
	 */
	setModuleId(moduleId) {
		this.moduleId = moduleId || "";
	}

	/**
	 * Parse entity-specific content from source code
	 *
	 * MUST be implemented by child classes to extract entity-specific
	 * information from source code.
	 *
	 * @param {string} _sourceCode - Source code to parse (unused in abstract base)
	 * @abstract
	 */
	parseContent(_sourceCode) {
		throw new Error("parseContent() must be implemented by child classes");
	}

	/**
	 * Validate entity data
	 *
	 * SHOULD be implemented by child classes for entity-specific validation.
	 * Default implementation validates basic required fields.
	 */
	validate() {
		this.isValidated = Boolean(
			this.entityType && this.name && this.location && this.location.file,
		);
	}

	/**
	 * Check if JSDoc tag is valid for this entity type
	 *
	 * SHOULD be implemented by child classes to declare which JSDoc tags
	 * are valid for their entity type.
	 *
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for this entity type
	 */
	isValidJSDocTag(tagType) {
		// Base implementation accepts common tags
		const commonTags = ["author", "since", "deprecated", "see", "example"];
		return commonTags.includes(tagType);
	}

	/**
	 * Serialize entity to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			entityType: this.entityType,
			name: this.name,
			location: this.location,
			description: this.description,
			jsdocTags: this.jsdocTags.map((tag) =>
				tag.toObject ? tag.toObject() : tag,
			),
			source: this.source,
			moduleId: this.moduleId,
			isValidated: this.isValidated,
		};
	}
}
