/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc alias tag model - symbol aliasing documentation.
 *
 * Ravens establish territorial aliases with precision mapping.
 * Essential for symbol renaming and reference redirection.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc alias tag implementation
 *
 * **Official JSDoc Tag:** Creates an alias to another symbol.
 *
 * **Syntax:**
 * - Symbol reference: `OriginalSymbol`
 * - Namespaced: `Namespace.OriginalSymbol`
 * - Module reference: `module:moduleName.SymbolName`
 *
 * **Raven Design:**
 * - Clean symbol reference extraction
 * - Zero validation complexity
 * - Essential for refactoring intelligence
 */
export class JSDocAliasTag extends JSDocTagBase {
	/**
	 * Create alias tag instance
	 * @param {string} rawContent - Raw alias tag content
	 */
	constructor(rawContent) {
		super("alias", rawContent);
	}

	/**
	 * Parse alias tag content
	 */
	parseContent() {
		/**
		 * @type {string} The symbol this is an alias for
		 */
		this.aliasFor = this.rawContent?.trim() || "";
	}

	/**
	 * Validate alias tag structure
	 */
	validate() {
		this.isValidated = Boolean(this.aliasFor && this.aliasFor.length > 0);
	}
}
