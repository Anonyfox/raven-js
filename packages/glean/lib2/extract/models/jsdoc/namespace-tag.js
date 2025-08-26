/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc namespace tag model - namespace documentation.
 *
 * Ravens establish namespace territories with organizational precision.
 * Essential for logical grouping and scope management.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc namespace tag implementation
 *
 * **Official JSDoc Tag:** Documents a namespace or logical grouping.
 *
 * **Syntax:**
 * - Name only: `NamespaceName`
 * - With description: `NamespaceName Description of namespace purpose`
 *
 * **Raven Design:**
 * - Simple namespace definition
 * - Optional description support
 * - Essential for organizational intelligence
 */
export class JSDocNamespaceTag extends JSDocTagBase {
	/**
	 * @type {string} Namespace name
	 */
	name = "";

	/**
	 * @type {string} Namespace description
	 */
	description = "";

	/**
	 * Create namespace tag instance
	 * @param {string} rawContent - Raw namespace tag content
	 */
	constructor(rawContent) {
		super("namespace", rawContent);
	}

	/**
	 * Parse namespace tag content
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
	 * Validate namespace tag structure
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}
}
