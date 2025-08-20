/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc namespace tag model - organizational namespace documentation.
 *
 * Ravens establish hierarchical territories with territorial precision.
 * Parses namespace declarations that group related functions,
 * constants, and utilities under common organizational structures.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc namespace tag implementation
 *
 * **Official JSDoc Tag:** Marks an object as a namespace container for related symbols.
 * **Purpose:** Creates organizational structure for grouping functions, constants, and utilities.
 *
 * **Syntax:**
 * - Standard: `NamespaceName` (simple identifier)
 * - Nested: `ParentNamespace.ChildNamespace` (hierarchical structure)
 * - Descriptive: `NamespaceName Description of namespace purpose`
 *
 * **Namespace Naming:**
 * - Simple names: Utils, Constants, API
 * - Hierarchical paths: MyApp.Utils, Company.Product.Core
 * - Object paths: window.MyLibrary, global.MyNamespace
 * - Module-style: my-module/utils, @company/utils
 *
 * **Usage Status:** Fairly common in older JavaScript codebases and libraries that use
 * global namespace patterns. Less common in modern ES modules but still valuable for organization.
 *
 * **Primary Use Cases:**
 * - Global namespace organization in legacy codebases
 * - Library API structure definition
 * - Utility function grouping and categorization
 * - Configuration object namespace definition
 * - Plugin and extension namespace organization
 * - Legacy code documentation and migration planning
 *
 * **Best Practices:**
 * - Use descriptive, hierarchical names that reflect code organization
 * - Group related functionality logically under common namespaces
 * - Avoid deeply nested namespace hierarchies (prefer 2-3 levels max)
 * - Include description when namespace purpose isn't obvious from name
 * - Combine with memberof tags to properly associate contained symbols
 * - Document namespace structure consistently across codebase
 * - Consider migration to ES modules for new development
 */
export class JSDocNamespaceTag extends JSDocTagBase {
	/**
	 * Create namespace tag instance
	 * @param {string} rawContent - Raw namespace tag content
	 */
	constructor(rawContent) {
		super("namespace", rawContent);
	}

	/**
	 * Get unique class identifier for serialization
	 * @returns {string} Class identifier
	 */
	static getClassId() {
		return "namespace";
	}

	/**
	 * Parse namespace tag content
	 */
	parseContent() {
		if (!this.rawContent) {
			this.name = "";
			this.description = "";
			return;
		}

		// Match pattern: @namespace Name optional description
		const namespaceRegex = /^\s*([^\s]+)(?:\s+(.*))?$/;
		const match = this.rawContent.trim().match(namespaceRegex);

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
	 * Validate namespace tag structure
	 */
	validate() {
		// Namespace tag should have a name
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
			return html`<div class="namespace-info"><strong class="namespace-label">Namespace:</strong> <code class="namespace-name">${this.name}</code> - ${this.description}</div>`;
		}
		return html`<div class="namespace-info"><strong class="namespace-label">Namespace:</strong> <code class="namespace-name">${this.name}</code></div>`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown output
	 */
	toMarkdown() {
		const desc = this.description ? ` - ${this.description}` : "";
		return `**Namespace:** \`${this.name}\`${desc}`;
	}
}
