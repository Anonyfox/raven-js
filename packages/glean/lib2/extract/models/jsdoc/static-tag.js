/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc static tag model - class static member documentation.
 *
 * Ravens mark static territories for class-level intelligence.
 * Essential for object-oriented static method and property documentation.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc static tag implementation
 *
 * **Official JSDoc Tag:** Marks a symbol as static (belongs to class, not instance).
 *
 * **Syntax:**
 * - Standalone: `@static`
 * - With description: `@static Utility method available on class itself`
 *
 * **Raven Design:**
 * - Simple static marker
 * - Optional description support
 * - Critical for class architecture intelligence
 */
export class JSDocStaticTag extends JSDocTagBase {
	/**
	 * Create static tag instance
	 * @param {string} rawContent - Raw static tag content
	 */
	constructor(rawContent) {
		super("static", rawContent);
	}

	/**
	 * Parse static tag content
	 */
	parseContent() {
		/**
		 * @type {string} Optional description of static nature
		 */
		this.description = this.rawContent?.trim() || "";
	}

	/**
	 * Validate static tag structure
	 */
	validate() {
		// Static tag is always valid - it's a marker tag
		this.isValidated = true;
	}
}
