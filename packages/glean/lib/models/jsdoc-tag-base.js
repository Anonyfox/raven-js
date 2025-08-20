/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Base class for JSDoc tag models - foundation for tag-specific intelligence.
 *
 * Ravens hunt with systematic precision. This base class provides the
 * surgical foundation for all JSDoc tag classes: serialization, validation,
 * and output format generation with zero-waste efficiency.
 */

/**
 * Base class for all JSDoc tag implementations
 *
 * Provides common serialization, validation, and output formatting
 * capabilities. Child classes must implement tag-specific parsing
 * and validation logic through the required abstract methods.
 *
 * @abstract
 */
export class JSDocTagBase {
	/**
	 * Create a JSDoc tag instance
	 * @param {string} tagType - Unique tag identifier (e.g., 'param', 'returns')
	 * @param {string} rawContent - Original tag content from JSDoc comment
	 */
	constructor(tagType, rawContent) {
		if (new.target === JSDocTagBase) {
			throw new Error(
				"JSDocTagBase is abstract and cannot be instantiated directly",
			);
		}

		this.tagType = tagType;
		this.rawContent = rawContent;
		this.isValidated = false;

		// Initialize with parsed content
		this.parseContent();
		this.validate();
	}

	/**
	 * Parse raw tag content into structured data
	 *
	 * MUST be implemented by child classes to extract tag-specific
	 * data from the raw content string.
	 *
	 * @abstract
	 * @protected
	 */
	parseContent() {
		throw new Error("parseContent() must be implemented by child classes");
	}

	/**
	 * Validate parsed tag content
	 *
	 * MUST be implemented by child classes to perform tag-specific
	 * validation and set this.isValidated appropriately.
	 *
	 * @abstract
	 * @protected
	 */
	validate() {
		throw new Error("validate() must be implemented by child classes");
	}

	/**
	 * Check if tag content is valid
	 * @returns {boolean} True if tag content is valid
	 */
	isValid() {
		return this.isValidated;
	}

	/**
	 * Get serializable data for JSON export
	 *
	 * SHOULD be overridden by child classes to provide tag-specific
	 * serializable data. Default implementation returns all enumerable
	 * properties except internal state.
	 *
	 * @protected
	 * @returns {Object} Serializable data object
	 */
	getSerializableData() {
		/** @type {Record<string, any>} */
		const data = {};
		for (const [key, value] of Object.entries(this)) {
			if (!key.startsWith("_") && key !== "isValidated") {
				data[key] = value;
			}
		}
		return data;
	}

	/**
	 * Serialize tag to JSON format
	 * @returns {Object} JSON representation with type metadata
	 */
	toJSON() {
		return {
			__type: this.tagType,
			__data: this.getSerializableData(),
		};
	}

	/**
	 * Generate HTML representation
	 *
	 * SHOULD be overridden by child classes for tag-specific HTML output.
	 * Default implementation provides basic formatting.
	 *
	 * @returns {string} HTML string
	 */
	toHTML() {
		return `<span class="jsdoc-tag" data-type="${this.tagType}">${this.rawContent}</span>`;
	}

	/**
	 * Generate Markdown representation
	 *
	 * SHOULD be overridden by child classes for tag-specific Markdown output.
	 * Default implementation provides basic formatting.
	 *
	 * @returns {string} Markdown string
	 */
	toMarkdown() {
		return `\`@${this.tagType} ${this.rawContent}\``;
	}

	/**
	 * Create tag instance from JSON data
	 *
	 * Static factory method for deserialization. Uses the tag registry
	 * to instantiate the correct child class.
	 *
	 * @param {any} json - JSON data with __type and __data properties
	 * @returns {JSDocTagBase} Deserialized tag instance
	 */
	static fromJSON(json) {
		if (!json || typeof json !== "object" || !json.__type || !json.__data) {
			throw new Error("Invalid JSON format: missing __type or __data");
		}

		// Registry lookup will be implemented when we create the registry
		throw new Error(
			"fromJSON requires tag registry - implement in registry module",
		);
	}
}
