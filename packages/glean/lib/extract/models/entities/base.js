/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Abstract base class for JavaScript entity models (functions, classes, variables).
 *
 * Provides unified JSDoc tag composition, description management, and validation
 * for all JavaScript language constructs with zero external dependencies.
 */

/**
 * Abstract base class for JavaScript entity types with JSDoc tag composition.
 *
 * Child classes implement entity-specific parsing and validation logic for functions,
 * classes, variables, and other JavaScript constructs. Pure data extraction only.
 *
 * @example
 * // Custom entity implementation
 * class FunctionEntity extends EntityBase {
 *   constructor(name, location) {
 *     super('function', name, location);
 *   }
 *   parseContent(source) {
 *     // parse function signature
 *   }
 * }
 *
 * @example
 * // Usage with JSDoc tags
 * const entity = new FunctionEntity('myFunc', {file: 'app.js', line: 10});
 * entity.addJSDocTag(paramTag);
 * entity.setDescription('Function description');
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
		/** @type {Array<{tagType: string, toObject?: Function}>} Collection of parsed JSDoc tags */
		this.jsdocTags = [];
		/** @type {string} Raw source code for this entity */
		this.source = "";
		/** @type {string} Module identifier this entity belongs to */
		this.moduleId = "";
		/** @type {boolean} Whether entity has been validated */
		this.isValidated = false;
		/** @type {Array<Object>} Cross-references to other entities */
		this.crossReferences = [];
	}

	/**
	 * Add JSDoc tag to entity
	 * @param {{tagType: string, toObject?: Function}} tag - JSDoc tag instance
	 */
	addJSDocTag(tag) {
		if (tag && typeof tag === "object" && "tagType" in tag) {
			this.jsdocTags.push(tag);
		}
	}

	/**
	 * Get JSDoc tags by type
	 * @param {string} tagType - Tag type to filter by
	 * @returns {Array<{tagType: string, toObject?: Function}>} Tags of specified type
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
	 * Get all JSDoc tags for this entity
	 * @returns {Array<{tagType: string, toObject?: Function}>} All JSDoc tags
	 */
	getAllJSDocTags() {
		return this.jsdocTags;
	}

	/**
	 * Generate unique identifier for this entity
	 * @returns {string} Entity identifier in format "moduleId/entityName"
	 */
	getId() {
		return this.moduleId ? `${this.moduleId}/${this.name}` : this.name;
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
	 * Add cross-reference to another entity
	 * @param {string} entityName - Name of referenced entity
	 * @param {string} type - Type of reference (see, calls, etc.)
	 * @param {string} [context] - Additional context about the reference
	 */
	addCrossReference(entityName, type, context) {
		if (entityName && type) {
			this.crossReferences.push({
				entityName,
				type,
				context: context || "",
			});
		}
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
			this.entityType &&
				this.name &&
				this.location &&
				typeof this.location === "object" &&
				"file" in this.location,
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
