/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc readonly tag model - immutability documentation.
 *
 * Ravens mark immutable territories with precision.
 * Essential for functional programming and data integrity.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc readonly tag implementation
 *
 * **Official JSDoc Tag:** Marks a symbol as read-only (immutable).
 *
 * **Syntax:**
 * - Standalone: `@readonly`
 * - With description: `@readonly Configuration is immutable after initialization`
 *
 * **Raven Design:**
 * - Simple immutability marker
 * - Optional description support
 * - Critical for data integrity intelligence
 */
export class JSDocReadonlyTag extends JSDocTagBase {
	/**
	 * @type {string} Optional description of readonly nature
	 */
	description = "";

	/**
	 * Create readonly tag instance
	 * @param {string} rawContent - Raw readonly tag content
	 */
	constructor(rawContent) {
		super("readonly", rawContent);
	}

	/**
	 * Parse readonly tag content
	 */
	parseContent() {
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate readonly tag structure
	 */
	validate() {
		// Readonly tag is always valid - it's a marker tag
		this.isValidated = true;
	}
}
