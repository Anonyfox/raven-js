/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Lean JSDoc tag base class - surgical intelligence foundation.
 *
 * Ravens hunt with systematic precision. This base class provides the
 * essential foundation for all JSDoc tag classes: validation and structured
 * data extraction with zero-waste efficiency.
 */

/**
 * Base class for all JSDoc tag implementations with validation foundation.
 *
 * Child classes implement tag-specific parsing and validation through abstract methods.
 * Parse-once design with zero rendering logic - data extraction only.
 *
 * @example
 * // Custom tag implementation
 * class ParamTag extends JSDocTagBase {
 *   parseContent() {
 *     // extract param data
 *   }
 *   validate() {
 *     // validate param syntax
 *   }
 * }
 *
 * @abstract
 */
export class JSDocTagBase {
	/**
	 * @type {string} Unique tag identifier (e.g., 'param', 'returns')
	 */
	tagType = "";

	/**
	 * @type {string} Original tag content from JSDoc comment
	 */
	rawContent = "";

	/**
	 * @type {boolean} Whether tag content has been validated
	 */
	isValidated = false;

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
		this.rawContent = rawContent || "";

		// Initialize with parsed content - raven efficiency
		this.parseContent();
		this.validate();
	}

	/**
	 * Parse raw tag content into structured data
	 *
	 * MUST be implemented by child classes to extract tag-specific
	 * data from the raw content string with surgical precision.
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
}
