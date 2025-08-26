/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc memberof tag model - membership documentation.
 *
 * Ravens establish territorial membership with hierarchical precision.
 * Essential for namespace and class structure intelligence.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc memberof tag implementation
 *
 * **Official JSDoc Tag:** Indicates that a symbol belongs to a parent symbol.
 *
 * **Syntax:**
 * - Class membership: `ClassName`
 * - Namespace membership: `NamespaceName`
 * - Nested membership: `Outer.Inner`
 * - Module membership: `module:moduleName`
 *
 * **Raven Design:**
 * - Clean parent reference extraction
 * - Zero hierarchy validation
 * - Essential for documentation structure
 */
export class JSDocMemberofTag extends JSDocTagBase {
	/**
	 * Create memberof tag instance
	 * @param {string} rawContent - Raw memberof tag content
	 */
	constructor(rawContent) {
		super("memberof", rawContent);
	}

	/**
	 * Parse memberof tag content
	 */
	parseContent() {
		/**
		 * @type {string} Parent symbol this belongs to
		 */
		this.parent = this.rawContent?.trim() || "";
	}

	/**
	 * Validate memberof tag structure
	 */
	validate() {
		this.isValidated = Boolean(this.parent && this.parent.length > 0);
	}
}
