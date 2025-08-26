/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc see tag model - cross-reference documentation.
 *
 * Ravens navigate cross-reference territories with link precision.
 * Parses see declarations that specify related documentation, external
 * links, and cross-referenced symbols for comprehensive navigation.
 */

import { JSDocTagBase } from "./base.js";

/**
 * JSDoc see tag implementation
 *
 * **Official JSDoc Tag:** Documents cross-references to related information, functions, or external resources.
 *
 * **Syntax:**
 * - Simple reference: `FunctionName` - Direct reference to another symbol
 * - URL reference: `https://example.com` - External link reference
 * - Link syntax: `{@link URL}` or `{@link URL|Description}` - Structured link with optional description
 * - Module reference: `module:moduleName` - Reference to module documentation
 *
 * **Raven Design:**
 * - Single-pass reference type detection
 * - Clean URL vs symbol separation
 * - Zero external dependencies
 */
export class JSDocSeeTag extends JSDocTagBase {
	/**
	 * Create see tag instance
	 * @param {string} rawContent - Raw see tag content
	 */
	constructor(rawContent) {
		super("see", rawContent);
	}

	/**
	 * Parse see tag content with surgical precision
	 */
	parseContent() {
		if (!this.rawContent?.trim()) {
			/**
			 * @type {string} Type of reference: "link", "url", "symbol", "module", "text", "empty"
			 */
			this.referenceType = "empty";
			/**
			 * @type {string} The reference target (URL, symbol name, etc.)
			 */
			this.reference = "";
			/**
			 * @type {string} Optional description for the reference
			 */
			this.description = "";
			/**
			 * @type {string} URL if reference is a link
			 */
			this.url = "";
			return;
		}

		const content = this.rawContent.trim();

		// Check for link syntax: {@link URL} or {@link URL|Description}
		const linkMatch = content.match(/^\{@?link\s+([^}|]+)(?:\|([^}]+))?\}$/);
		if (linkMatch) {
			/**
			 * @type {string} Type of reference: "link", "url", "symbol", "module", "text", "empty"
			 */
			this.referenceType = "link";
			/**
			 * @type {string} The reference target (URL, symbol name, etc.)
			 */
			this.reference = linkMatch[1].trim();
			/**
			 * @type {string} Optional description for the reference
			 */
			this.description = linkMatch[2]?.trim() || "";
			/**
			 * @type {string} URL if reference is a link
			 */
			this.url = this.isUrl(this.reference) ? this.reference : "";
			return;
		}

		// Check for URL reference
		if (this.isUrl(content)) {
			/**
			 * @type {string} Type of reference: "link", "url", "symbol", "module", "text", "empty"
			 */
			this.referenceType = "url";
			/**
			 * @type {string} The reference target (URL, symbol name, etc.)
			 */
			this.reference = content;
			/**
			 * @type {string} Optional description for the reference
			 */
			this.description = "";
			/**
			 * @type {string} URL if reference is a link
			 */
			this.url = content;
			return;
		}

		// Check for quoted text reference
		const quotedMatch = content.match(/^["'](.+)["']$/);
		if (quotedMatch) {
			/**
			 * @type {string} Type of reference: "link", "url", "symbol", "module", "text", "empty"
			 */
			this.referenceType = "text";
			/**
			 * @type {string} The reference target (URL, symbol name, etc.)
			 */
			this.reference = quotedMatch[1];
			/**
			 * @type {string} Optional description for the reference
			 */
			this.description = "";
			/**
			 * @type {string} URL if reference is a link
			 */
			this.url = "";
			return;
		}

		// Check for module reference
		if (content.startsWith("module:")) {
			/**
			 * @type {string} Type of reference: "link", "url", "symbol", "module", "text", "empty"
			 */
			this.referenceType = "module";
			/**
			 * @type {string} The reference target (URL, symbol name, etc.)
			 */
			this.reference = content;
			/**
			 * @type {string} Optional description for the reference
			 */
			this.description = "";
			/**
			 * @type {string} URL if reference is a link
			 */
			this.url = "";
			return;
		}

		// Default to symbol reference
		/**
		 * @type {string} Type of reference: "link", "url", "symbol", "module", "text", "empty"
		 */
		this.referenceType = "symbol";
		/**
		 * @type {string} The reference target (URL, symbol name, etc.)
		 */
		this.reference = content;
		/**
		 * @type {string} Optional description for the reference
		 */
		this.description = "";
		/**
		 * @type {string} URL if reference is a link
		 */
		this.url = "";
	}

	/**
	 * Check if string is a URL
	 * @param {string} str - String to check
	 * @returns {boolean} True if string is URL
	 */
	isUrl(str) {
		return /^https?:\/\//.test(str);
	}

	/**
	 * Validate see tag structure
	 */
	validate() {
		// See tag should have some reference content
		this.isValidated = Boolean(this.reference?.trim());
	}
}
