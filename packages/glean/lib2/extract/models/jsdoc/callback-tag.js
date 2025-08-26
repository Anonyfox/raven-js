/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc callback tag model - callback function documentation.
 *
 * Ravens define callback territories with functional precision.
 * Essential for async patterns and event-driven architecture.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc callback tag implementation
 *
 * **Official JSDoc Tag:** Defines a callback function type.
 *
 * **Syntax:**
 * - Named callback: `CallbackName`
 * - With description: `CallbackName Description of callback purpose`
 *
 * **Raven Design:**
 * - Simple callback type definition
 * - Optional description support
 * - Essential for async intelligence
 */
export class JSDocCallbackTag extends JSDocTagBase {
	/**
	 * @type {string} Callback name/identifier
	 */
	name = "";

	/**
	 * @type {string} Callback description
	 */
	description = "";

	/**
	 * Create callback tag instance
	 * @param {string} rawContent - Raw callback tag content
	 */
	constructor(rawContent) {
		super("callback", rawContent);
	}

	/**
	 * Parse callback tag content
	 */
	parseContent() {
		const content = this.rawContent?.trim() || "";

		if (!content) {
			this.name = "";
			this.description = "";
			return;
		}

		// Split on first whitespace to separate name from description
		const spaceIndex = content.indexOf(" ");
		if (spaceIndex !== -1) {
			this.name = content.slice(0, spaceIndex).trim();
			this.description = content.slice(spaceIndex + 1).trim();
		} else {
			this.name = content;
			this.description = "";
		}
	}

	/**
	 * Validate callback tag structure
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}
}
