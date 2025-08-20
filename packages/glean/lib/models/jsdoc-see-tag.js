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

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc see tag implementation
 *
 * **Official JSDoc Tag:** Documents cross-references to related information, functions, or external resources.
 * **Purpose:** Provides navigation links, related documentation, and reference connections for comprehensive understanding.
 *
 * **Syntax:**
 * - Simple reference: `FunctionName` - Direct reference to another symbol
 * - URL reference: `https://example.com` - External link reference
 * - Link syntax: `{link URL}` or `{link URL|Description}` - Structured link with optional description
 * - Module reference: `module:moduleName` - Reference to module documentation
 * - Namespaced reference: `Namespace.ClassName` - Reference to namespaced symbols
 * - Text reference: `"Text description"` - Descriptive text reference
 *
 * **Cross-Reference Types:**
 * - Function references: Links to related functions, methods, or procedures
 * - Class references: Links to related classes, constructors, or object types
 * - Module references: Links to module documentation and external packages
 * - External URLs: Links to specifications, documentation, or related resources
 * - API references: Links to related API endpoints, documentation, or examples
 * - Concept references: Links to related concepts, tutorials, or explanatory content
 *
 * **Usage Status:** Very common in comprehensive documentation systems
 * for creating navigation networks and related content discovery.
 *
 * **Primary Use Cases:**
 * - Related function and method cross-referencing
 * - External documentation and specification linking
 * - API reference and endpoint documentation
 * - Tutorial and concept navigation
 * - Module and package interdependency documentation
 * - See-also sections for comprehensive coverage
 *
 * **Best Practices:**
 * - Use specific and accurate references that actually exist
 * - Prefer structured link syntax for external URLs with descriptions
 * - Group related references logically for better navigation
 * - Verify that referenced symbols are accessible and documented
 * - Use consistent reference patterns across project documentation
 * - Include meaningful descriptions for external links when beneficial
 * - Avoid circular references that create navigation loops
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
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "see";
	}

	/**
	 * Parse see tag content
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

	/**
	 * Get serializable data for this tag
	 * @returns {Object} Serializable data
	 */
	getSerializableData() {
		return {
			...super.getSerializableData(),
			referenceType: this.referenceType || "symbol",
			reference: this.reference || "",
			description: this.description || "",
			url: this.url || "",
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		if (this.referenceType === "url" || this.url) {
			const displayText = this.description || this.reference;
			return html`<div class="see-info"><strong class="see-label">See:</strong> <a href="${this.url}" class="see-link">${displayText}</a></div>`;
		}

		const displayText = this.description || this.reference;
		return html`<div class="see-info"><strong class="see-label">See:</strong> <code class="see-reference">${displayText}</code></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		if (this.referenceType === "url" || this.url) {
			const displayText = this.description || this.reference;
			return `**See:** [${displayText}](${this.url})`;
		}

		const displayText = this.description || this.reference;
		return `**See:** \`${displayText}\``;
	}
}
