/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc enum tag model - enumeration documentation.
 *
 * Ravens catalog enumeration territories with type precision.
 * Essential for constant value sets and type safety.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc enum tag implementation for enumeration value documentation.
 *
 * Parses enum tag content with structured data extraction.
 *
 * @example
 * // Basic usage
 * const tag = new JSDocEnumTag('{string} STATUS');
 * // Access parsed properties
 */
export class JSDocEnumTag extends JSDocTagBase {
	/**
	 * @type {string} Parsed tag content
	 */
	content = "";

	/**
	 * Create enum tag instance
	 * @param {string} rawContent - Raw enum tag content
	 */
	constructor(rawContent) {
		super("enum", rawContent);
	}

	/**
	 * Parse enum tag content
	 */
	parseContent() {
		const content = this.rawContent?.trim() || "";

		if (!content) {
			this.type = "";
			this.description = "";
			return;
		}

		// Check for type in braces
		const typeMatch = content.match(/^\{([^}]+)\}\s*(.*)$/);
		if (typeMatch) {
			this.type = typeMatch[1].trim();
			this.description = typeMatch[2].trim();
		} else {
			this.type = "";
			this.description = content;
		}
	}

	/**
	 * Validate enum tag structure
	 */
	validate() {
		// Enum tag is valid if it has either type or description
		this.isValidated = Boolean(
			(this.type && this.type.length > 0) ||
				(this.description && this.description.length > 0),
		);
	}
}
