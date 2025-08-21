/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc param tag model - surgical parameter documentation.
 *
 * Ravens dissect function parameters with predatory precision.
 * Parses complex parameter syntax including types, optional parameters,
 * default values, and comprehensive validation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc param tag implementation
 *
 * **Official JSDoc Tag:** Documents function parameters with comprehensive syntax support.
 *
 * **Syntax Variants:**
 * - Basic: `{Type} paramName Description of parameter`
 * - Optional: `{Type} [paramName] Optional parameter`
 * - With default: `{Type} [paramName=defaultValue] Parameter with default`
 * - Type only: `{Type} paramName`
 * - Name only: `paramName Description`
 *
 * **Type Support:**
 * - Simple types: string, number, boolean, Object
 * - Union types: (string|number|null)
 * - Array types: Array.<string> or string[]
 * - Generic types: Promise<Response>, Map<string, number>
 * - Function types: function(string, boolean): number
 * - Record types: {name: string, age: number}
 * - Nullable: ?string, Non-nullable: !Object
 * - Rest parameters: ...string (variable arguments)
 *
 * **Usage Status:** Very common - virtually every function with parameters should
 * document them with param tags. Essential for API documentation and IDE support.
 *
 * **Best Practices:**
 * - Always include type annotation for better tooling support
 * - Provide clear, concise descriptions explaining parameter purpose
 * - Use square brackets for optional parameters consistently
 * - Document default values to clarify behavior
 */
export class JSDocParamTag extends JSDocTagBase {
	/**
	 * Create @param tag instance
	 * @param {string} rawContent - Raw @param content
	 */
	constructor(rawContent) {
		super("param", rawContent);
	}

	/**
	 * Parse @param tag content into structured data
	 *
	 * Extracts type, name, optional status, default value, and description
	 * from various @param syntax forms with surgical precision.
	 */
	parseContent() {
		// Match pattern: @param {type} [name=default] description
		const paramRegex =
			/^\s*(?:\{([^}]+)\})?\s*(?:\[([^\]]+)\]|(\w+))?\s*(.*)?$/;
		const match = this.rawContent.match(paramRegex);

		if (!match) {
			this.type = "";
			this.name = "";
			this.optional = false;
			this.defaultValue = "";
			this.description = "";
			return;
		}

		const [, type, bracketedName, simpleName, description] = match;

		this.type = type || "";
		this.description = description ? description.trim() : "";

		// Handle bracketed parameters (optional with possible default)
		if (bracketedName) {
			this.optional = true;
			const defaultMatch = bracketedName.match(/^([^=]+)(?:=(.*))?$/);
			if (defaultMatch) {
				this.name = defaultMatch[1].trim();
				this.defaultValue = defaultMatch[2] ? defaultMatch[2].trim() : "";
			} else {
				this.name = bracketedName.trim();
				this.defaultValue = "";
			}
		} else {
			this.name = simpleName || "";
			this.optional = false;
			this.defaultValue = "";
		}
	}

	/**
	 * Validate @param tag content
	 *
	 * Ravens demand precision: valid @param tags must have
	 * at minimum a parameter name.
	 */
	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}/**
	 * Generate HTML representation
	 * @returns {string} HTML string for parameter documentation
	 */
	toHTML() {
		return html`
			<li class="param-item">
				${this.type ? html`<span class="param-type">{${this.type}}</span> ` : ""}
				<code class="param-name">${this.name}</code>
				${this.optional ? html` <em>(optional)</em>` : ""}
				${this.defaultValue ? html` <span class="param-default">= ${this.defaultValue}</span>` : ""}
				${this.description ? html` - ${this.description}` : ""}
			</li>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for parameter documentation
	 */
	toMarkdown() {
		const type = this.type ? `{${this.type}} ` : "";
		const name = `\`${this.name}\``;
		const optional = this.optional ? " *(optional)*" : "";
		const defaultVal = this.defaultValue ? ` = ${this.defaultValue}` : "";
		const desc = this.description ? ` - ${this.description}` : "";

		return `- ${type}${name}${optional}${defaultVal}${desc}`;
	}
}
