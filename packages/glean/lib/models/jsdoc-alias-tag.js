/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc alias tag model - alternative naming documentation.
 *
 * Ravens establish territorial aliases with naming precision.
 * Parses alias declarations that specify alternative names, symbolic
 * references, and documentation identifiers for code elements.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc alias tag implementation
 *
 * **Official JSDoc Tag:** Documents an alternative name or identifier for a symbol.
 * **Purpose:** Provides alternative naming, symbolic references, and documentation identifiers for symbols.
 *
 * **Syntax:**
 * - Simple alias: `aliasName` - Basic alternative name
 * - Namespaced alias: `Namespace.aliasName` - Alias within namespace context
 * - Module alias: `module:path/to/module~aliasName` - Module-scoped alias reference
 * - Dot notation: `Parent.Child.aliasName` - Hierarchical alias structure
 * - Complex path: `@scope/package.Module.aliasName` - Full path alias specification
 *
 * **Alias Name Types:**
 * - Simple identifiers: Basic alternative names for symbols and functions
 * - Namespace aliases: Alternative names within specific namespace contexts
 * - Module aliases: Alternative references for module-scoped symbols
 * - Hierarchical aliases: Multi-level naming structures and path references
 * - Scoped aliases: Package-scoped and organization-level alternative names
 * - Documentation aliases: Alternative names for documentation generation purposes
 *
 * **Usage Status:** Moderately common in complex codebases and libraries
 * where symbols need alternative documentation names or reference paths.
 *
 * **Primary Use Cases:**
 * - Documentation symbol renaming and alternative reference creation
 * - Legacy name support and backward compatibility documentation
 * - Module export alias documentation and reference management
 * - Namespace organization and hierarchical symbol documentation
 * - Complex inheritance and mixin alias documentation
 * - API documentation with multiple access patterns
 *
 * **Best Practices:**
 * - Use clear and descriptive alias names that enhance understanding
 * - Maintain consistency with existing naming conventions and patterns
 * - Document the relationship between original and alias names when beneficial
 * - Consider namespace context when creating hierarchical aliases
 * - Avoid creating aliases that conflict with existing symbol names
 * - Use aliases to simplify complex or verbose symbol references
 * - Group related aliases logically for better documentation organization
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
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "alias";
	}

	/**
	 * Parse alias tag content
	 */
	parseContent() {
		if (!this.rawContent?.trim()) {
			this.aliasName = "";
			this.namespace = "";
			this.isModuleAlias = false;
			this.isNamespaced = false;
			return;
		}

		const alias = this.rawContent.trim();
		this.aliasName = alias;

		// Check if it's a module alias (contains module: prefix)
		this.isModuleAlias = alias.startsWith("module:");

		// Check if it's namespaced (contains dots but not module prefix)
		this.isNamespaced = !this.isModuleAlias && alias.includes(".");

		// Extract namespace if present
		if (this.isNamespaced) {
			const lastDotIndex = alias.lastIndexOf(".");
			this.namespace = alias.substring(0, lastDotIndex);
		} else {
			this.namespace = "";
		}
	}

	/**
	 * Validate alias tag structure
	 */
	validate() {
		// Alias tag should have a name
		this.isValidated = Boolean(this.aliasName?.trim());
	}

	/**
	 * Get serializable data for this tag
	 * @returns {Object} Serializable data
	 */
	getSerializableData() {
		return {
			...super.getSerializableData(),
			aliasName: this.aliasName || "",
			namespace: this.namespace || "",
			isModuleAlias: this.isModuleAlias || false,
			isNamespaced: this.isNamespaced || false,
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML output
	 */
	toHTML() {
		return html`<div class="alias-info"><strong class="alias-label">Alias:</strong> <code class="alias-name">${this.aliasName}</code></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		return `**Alias:** \`${this.aliasName}\``;
	}
}
