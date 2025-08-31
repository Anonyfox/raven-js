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
 * JSDoc returns tag implementation for function return value documentation.
 *
 * Parses return value types and descriptions from @returns/@return tags.
 * Single-regex parsing with clean type/description separation.
 *
 * @example
 * // Basic usage with type and description
 * const tag = new JSDocReturnsTag('{Promise<string>} Resolved user data');
 * console.log(tag.type, tag.description);
 *
 * @example
 * // Type only
 * const tag = new JSDocReturnsTag('{boolean}');
 * console.log(tag.type); // 'boolean'
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
			this.type = "";
			this.description = "";
			return;
		}

		const [, type, description] = match;

		// Handle empty or whitespace-only types
		this.type = type?.trim() || "";
		this.description = description ? description.trim() : "";
	}

	/**
	 * Validate returns tag content - requires type or description
	 */
	validate() {
		this.isValidated = Boolean(
			(this.type && this.type.length > 0) ||
				(this.description && this.description.length > 0),
		);
	}
}
