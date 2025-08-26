/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc protected tag model - inheritance access documentation.
 *
 * Ravens mark protected territories for inheritance intelligence.
 * Essential for object-oriented API design and encapsulation.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc protected tag implementation
 *
 * **Official JSDoc Tag:** Marks a symbol as protected (accessible to subclasses).
 *
 * **Syntax:**
 * - Standalone: `@protected`
 * - With description: `@protected Intended for subclass use only`
 *
 * **Raven Design:**
 * - Simple access level marker
 * - Optional description support
 * - Critical for inheritance boundaries
 */
export class JSDocProtectedTag extends JSDocTagBase {
	/**
	 * @type {string} Optional description of protection reason
	 */
	description = "";

	/**
	 * Create protected tag instance
	 * @param {string} rawContent - Raw protected tag content
	 */
	constructor(rawContent) {
		super("protected", rawContent);
	}

	/**
	 * Parse protected tag content
	 */
	parseContent() {
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate protected tag structure
	 */
	validate() {
		// Protected tag is always valid - it's a marker tag
		this.isValidated = true;
	}
}
