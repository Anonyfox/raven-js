/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc callback tag model - reusable function type documentation.
 *
 * Ravens define function signatures with predatory precision.
 * Parses callback function declarations that establish reusable
 * function type definitions for API parameter documentation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc callback tag implementation
 *
 * **Official JSDoc Tag:** Documents a callback function for reusable function signatures.
 * **Purpose:** Defines named function types that can be referenced in other tag documentation.
 *
 * **Syntax:**
 * - Standard: `CallbackName` (simple identifier)
 * - With description: `CallbackName Description of callback purpose`
 * - Combined: Often used with param, returns, and throws tags for complete signature
 *
 * **Callback Naming:**
 * - Descriptive names: requestCallback, responseHandler, errorCallback
 * - Event callbacks: onSuccess, onError, onComplete, onClick
 * - Generic patterns: iteratorCallback, filterFunction, mapFunction
 * - Domain-specific: authCallback, validationHandler, transformFunction
 *
 * **Usage Status:** Common when documenting APIs that accept callback functions.
 * Essential for defining expected callback signatures and improving IDE support.
 *
 * **Primary Use Cases:**
 * - API method callback parameter documentation
 * - Event handler function type definitions
 * - Async operation completion callbacks
 * - Iterator and functional programming callback signatures
 * - Custom hook and middleware function types
 * - Plugin system callback interface definitions
 *
 * **Best Practices:**
 * - Use descriptive names that convey callback purpose and timing
 * - Combine with param tags to document callback parameters
 * - Include returns tag if callback should return a value
 * - Document throws conditions for error-handling callbacks
 * - Reference callback types in API parameter documentation
 * - Group related callbacks logically in documentation
 * - Use consistent naming conventions across related callbacks
 * - Include usage examples showing callback implementation patterns
 */
export class JSDocCallbackTag extends JSDocTagBase {
	/**
	 * Create callback tag instance
	 * @param {string} rawContent - Raw callback tag content
	 */
	constructor(rawContent) {
		super("callback", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "callback";
	}

	/**
	 * Parse callback tag content
	 */
	parseContent() {
		if (!this.rawContent) {
			this.name = "";
			this.description = "";
			return;
		}

		// Match pattern: @callback CallbackName optional description
		const callbackRegex = /^\s*([^\s]+)(?:\s+(.*))?$/;
		const match = this.rawContent.trim().match(callbackRegex);

		if (!match) {
			this.name = "";
			this.description = "";
			return;
		}

		const [, name, description] = match;
		this.name = name || "";
		this.description = description?.trim() || "";
	}

	/**
	 * Validate callback tag structure
	 */
	validate() {
		// Callback tag should have a name
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}

	/**
	 * Get serializable data for this tag
	 * @returns {Object} Serializable data
	 */
	getSerializableData() {
		return {
			...super.getSerializableData(),
			name: this.name || "",
			description: this.description || "",
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.description) {
			return html`<div class="callback-info"><strong class="callback-label">Callback:</strong> <code class="callback-name">${this.name}</code> - ${this.description}</div>`;
		}
		return html`<div class="callback-info"><strong class="callback-label">Callback:</strong> <code class="callback-name">${this.name}</code></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		const desc = this.description ? ` - ${this.description}` : "";
		return `**Callback:** \`${this.name}\`${desc}`;
	}
}
