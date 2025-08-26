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
 * JSDoc enum tag implementation
 *
 * **Official JSDoc Tag:** Documents an enumeration of values.
 *
 * **Syntax:**
 * - Type only: `{Type}`
 * - With description: `{Type} Description of enumeration`
 * - Untyped: `Description of values`
 *
 * **Raven Design:**
 * - Clean type extraction
 * - Optional description support
 * - Essential for value set intelligence
 */
export class JSDocEnumTag extends JSDocTagBase {
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
			/**
			 * @type {string} Enumeration type
			 */
			this.type = "";
			/**
			 * @type {string} Enumeration description
			 */
			this.description = "";
			return;
		}

		// Check for type in braces
		const typeMatch = content.match(/^\{([^}]+)\}\s*(.*)$/);
		if (typeMatch) {
			/**
			 * @type {string} Enumeration type
			 */
			this.type = typeMatch[1].trim();
			/**
			 * @type {string} Enumeration description
			 */
			this.description = typeMatch[2].trim();
		} else {
			/**
			 * @type {string} Enumeration type
			 */
			this.type = "";
			/**
			 * @type {string} Enumeration description
			 */
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
