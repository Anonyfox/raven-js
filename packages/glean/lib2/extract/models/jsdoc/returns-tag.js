/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc returns tag model - surgical return value documentation.
 *
 * Ravens track function outputs with predatory focus.
 * Parses return value types and descriptions with clean validation.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc return value tag implementation
 *
 * **Official JSDoc Tag:** Documents function return values with type and description.
 * **Aliases:** return tag (both `returns` and `return` are valid)
 *
 * **Syntax Variants:**
 * - Full: `{Type} Description of return value`
 * - Type only: `{Type}`
 * - Description only: `Description of what is returned`
 *
 * **Raven Design:**
 * - V8-optimized single regex parse
 * - Clean type/description separation
 * - Zero dependencies on rendering layers
 */
export class JSDocReturnsTag extends JSDocTagBase {
	/**
	 * Create returns tag instance
	 * @param {string} rawContent - Raw returns tag content
	 */
	constructor(rawContent) {
		super("returns", rawContent);
	}

	/**
	 * Parse @returns tag content into structured data
	 *
	 * Extracts optional type and description with surgical precision.
	 * Handles both typed and untyped return documentation.
	 */
	parseContent() {
		// Match pattern: @returns {type} description or @returns description
		const returnsRegex = /^\s*(?:\{([^}]*)\})?\s*(.*)$/;
		const match = this.rawContent.match(returnsRegex);

		if (!match) {
			/**
			 * @type {string} Return value type annotation
			 */
			this.type = "";
			/**
			 * @type {string} Return value description
			 */
			this.description = "";
			return;
		}

		const [, type, description] = match;

		// Handle empty or whitespace-only types
		this.type = type?.trim() || "";
		this.description = description ? description.trim() : "";
	}

	/**
	 * Validate returns tag content
	 *
	 * Ravens accept minimal return documentation: either type or description
	 * must be present for valid returns tag.
	 */
	validate() {
		this.isValidated = Boolean(
			(this.type && this.type.length > 0) ||
				(this.description && this.description.length > 0),
		);
	}
}
