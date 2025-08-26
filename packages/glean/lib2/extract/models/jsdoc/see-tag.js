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
	 * @type {string} Type of reference: "link", "url", "symbol", "module", "text", "empty"
	 */
	referenceType = "";

	/**
	 * @type {string} The reference target (URL, symbol name, etc.)
	 */
	reference = "";

	/**
	 * @type {string} Optional description for the reference
	 */
	description = "";

	/**
	 * @type {string} URL if reference is a link
	 */
	url = "";

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
			this.referenceType = "empty";
			this.reference = "";
			this.description = "";
			this.url = "";
			return;
		}

		const content = this.rawContent.trim();

		// Check for link syntax: {@link URL} or {@link URL|Description}
		const linkMatch = content.match(/^\{@?link\s+([^}|]+)(?:\|([^}]+))?\}$/);
		if (linkMatch) {
			this.referenceType = "link";
			this.reference = linkMatch[1].trim();
			this.description = linkMatch[2]?.trim() || "";
			this.url = this.isUrl(this.reference) ? this.reference : "";
			return;
		}

		// Check for URL reference
		if (this.isUrl(content)) {
			this.referenceType = "url";
			this.reference = content;
			this.description = "";
			this.url = content;
			return;
		}

		// Check for quoted text reference
		const quotedMatch = content.match(/^["'](.+)["']$/);
		if (quotedMatch) {
			this.referenceType = "text";
			this.reference = quotedMatch[1];
			this.description = "";
			this.url = "";
			return;
		}

		// Check for module reference
		if (content.startsWith("module:")) {
			this.referenceType = "module";
			this.reference = content;
			this.description = "";
			this.url = "";
			return;
		}

		// Default to symbol reference
		this.referenceType = "symbol";
		this.reference = content;
		this.description = "";
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
