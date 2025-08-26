/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc private tag model - internal API documentation.
 *
 * Ravens mark internal territories with precision.
 * Critical for API surface management and encapsulation.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc private tag implementation
 *
 * **Official JSDoc Tag:** Marks a symbol as private (internal use only).
 *
 * **Syntax:**
 * - Standalone: `@private`
 * - With description: `@private Internal helper function`
 *
 * **Raven Design:**
 * - Simple marker tag
 * - Optional description support
 * - Critical for API boundary enforcement
 */
export class JSDocPrivateTag extends JSDocTagBase {
	/**
	 * @type {string} Optional description of privacy reason
	 */
	description = "";

	/**
	 * Create private tag instance
	 * @param {string} rawContent - Raw private tag content
	 */
	constructor(rawContent) {
		super("private", rawContent);
	}

	/**
	 * Parse private tag content
	 */
	parseContent() {
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate private tag structure
	 */
	validate() {
		// Private tag is always valid - it's a marker tag
		this.isValidated = true;
	}
}
