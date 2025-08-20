/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc type tag model - surgical type documentation.
 *
 * Ravens mark territorial type boundaries with predatory precision.
 * Parses type annotations for variables, properties, and constants
 * with clean validation and output formatting.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc type tag implementation
 *
 * **Official JSDoc Tag:** Documents the type of variables, properties, or constants.
 *
 * **Syntax:**
 * - Standard: `{TypeExpression}`
 * - Type only format, no name or description needed
 *
 * **Type Support:**
 * - Simple types: string, number, boolean, Object, Array
 * - Complex types: MyNamespace.MyClass, HTMLElement
 * - Union types: (string|number|null)
 * - Array notation: Array.<string> or string[]
 * - Object mapping: Object.<string, number>
 * - Generic types: Promise<Response>, Map<K, V>
 * - Function types: function(string): boolean
 * - Record types: {name: string, age: number}
 * - Special types: *, ? (any/unknown), null, undefined
 * - Nullable: ?string, Non-nullable: !Object
 *
 * **Usage Status:** Very common for global variables, constants, class fields,
 * and in typedef definitions. Essential for type checking and IDE support.
 *
 * **Use Cases:**
 * - Standalone variable declarations
 * - Class property type annotation
 * - Global constant type specification
 * - Module-level variable typing
 * - Configuration object typing
 *
 * **Best Practices:**
 * - Use specific types rather than generic Object when possible
 * - Prefer union types over any (*) for better type safety
 * - Reference custom types defined with typedef tags
 * - Use nullable (?) prefix when null is a valid value
 */
export class JSDocTypeTag extends JSDocTagBase {
	/**
	 * Create type tag instance
	 * @param {string} rawContent - Raw type tag content
	 */
	constructor(rawContent) {
		super("type", rawContent);
	}

	/**
	 * Parse type tag content into structured data
	 *
	 * Extracts type annotation from curly braces with surgical precision.
	 * Handles complex type expressions and validates syntax.
	 */
	parseContent() {
		// Match pattern: @type {TypeExpression} - handle nested braces
		const content = this.rawContent.trim();

		if (content.startsWith("{") && content.endsWith("}")) {
			// Extract content inside the outermost braces
			this.type = content.slice(1, -1).trim();
		} else {
			// Handle cases without braces (malformed)
			this.type = content;
		}
	}

	/**
	 * Validate type tag content
	 *
	 * Ravens demand type precision: valid type tags must have
	 * a non-empty type annotation.
	 */
	validate() {
		this.isValidated = Boolean(this.type && this.type.length > 0);
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Type-specific serializable data
	 */
	getSerializableData() {
		return {
			tagType: this.tagType,
			rawContent: this.rawContent,
			type: this.type,
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for type documentation
	 */
	toHTML() {
		return html`
			<div class="type-info">
				${this.type ? html`<span class="type-annotation">{${this.type}}</span>` : ""}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for type documentation
	 */
	toMarkdown() {
		return this.type ? `**Type:** {${this.type}}` : "**Type:** ";
	}
}
