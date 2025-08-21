/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc returns tag model - surgical return value documentation.
 *
 * Ravens track function outputs with predatory focus.
 * Parses return value types and descriptions with clean validation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc return value tag implementation
 *
 * **Official JSDoc Tag:** Documents function return values with type and description.
 * **Aliases:** return tag (both `returns` and `return` are valid)
 *
 * **Syntax Variants:**
 * - Full: `{Type} Description of return value`
 * - Type only: `{Type}`
 * - Description only: `Description of what is returned`
 * - Empty: (valid but not recommended)
 *
 * **Type Support:**
 * - Simple types: string, number, boolean, void, undefined
 * - Complex types: Promise<Response>, Array.<User>, Object.<string, number>
 * - Union types: (string|number|null)
 * - Function returns: function(): boolean
 * - Async returns: Promise<ResultType>
 * - Nullable: ?string, Non-nullable: !Object
 *
 * **Usage Status:** Very common - every function that returns a value should
 * have a returns tag describing what is returned. Critical for API documentation.
 *
 * **Best Practices:**
 * - Always specify return type for better IDE support and type checking
 * - Describe what the returned value represents, not just its type
 * - For async functions, document Promise resolution value
 * - Use void for functions that don't return meaningful values
 * - Document null/undefined returns explicitly when relevant
 */
export class JSDocReturnsTag extends JSDocTagBase {
	/**
	 * Create returns tag instance
	 * @param {string} rawContent - Raw returns tag content
	 */
	constructor(rawContent) {
		super("returns", rawContent);
	}

	/**
	 * Parse @returns tag content into structured data
	 *
	 * Extracts optional type and description with surgical precision.
	 * Handles both typed and untyped return documentation.
	 */
	parseContent() {
		// Match pattern: @returns {type} description or @returns description
		const returnsRegex = /^\s*(?:\{([^}]*)\})?\s*(.*)$/;
		const match = this.rawContent.match(returnsRegex);

		if (!match) {
			this.type = "";
			this.description = "";
			return;
		}

		const [, type, description] = match;

		// Handle empty or whitespace-only types
		this.type = type?.trim() || "";
		this.description = description ? description.trim() : "";
	}

	/**
	 * Validate returns tag content
	 *
	 * Ravens accept minimal return documentation: either type or description
	 * must be present for valid returns tag.
	 */
	validate() {
		this.isValidated = Boolean(
			(this.type && this.type.length > 0) ||
				(this.description && this.description.length > 0),
		);
	}/**
	 * Generate HTML representation
	 * @returns {string} HTML string for return value documentation
	 */
	toHTML() {
		return html`
			<div class="return-info">
				${this.type ? html`<span class="return-type">{${this.type}}</span>` : ""}
				${this.type && this.description ? html` - ` : ""}
				${this.description || ""}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for return value documentation
	 */
	toMarkdown() {
		const type = this.type ? `{${this.type}}` : "";
		const desc = this.description ? this.description : "";
		const separator = this.type && this.description ? " - " : "";

		return `**Returns:** ${type}${separator}${desc}`;
	}
}
