/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Namespace entity model - surgical namespace documentation
 *
 * Ravens extract JSDoc @namespace constructs with organizational precision.
 * Handles namespace declarations for grouping related functions, classes,
 * and other entities in logical hierarchies.
 * Zero external dependencies, pure extraction.
 */

import { EntityBase } from "./base.js";

/**
 * JSDoc namespace entity implementation
 *
 * **Supported Namespace Types:**
 * - Simple namespaces: `@namespace MyNamespace`
 * - Nested namespaces: `@namespace MyApp.Utils`
 * - Module namespaces: `@namespace module:myModule`
 * - Global namespaces: `@namespace window.MyGlobal`
 *
 * **Valid JSDoc Tags:**
 * - `@memberof` - Parent namespace
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class NamespaceEntity extends EntityBase {
	/**
	 * Create namespace entity instance
	 * @param {string} name - Namespace name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("namespace", name, location);

		/** @type {boolean} Whether namespace is exported */
		this.isExported = false;
		/** @type {boolean} Whether namespace is global */
		this.isGlobal = false;
		/** @type {boolean} Whether namespace is module-based */
		this.isModule = false;
		/** @type {string|null} Parent namespace */
		this.parentNamespace = null;
		/** @type {Array<string>} Child namespaces */
		this.childNamespaces = [];
		/** @type {Array<{name: string, type: string}>} Member entities (functions, classes, etc.) */
		this.members = [];
		/** @type {string} Namespace signature */
		this.signature = "";
		/** @type {string} Full qualified name including parent hierarchy */
		this.qualifiedName = "";
		/** @type {number} Nesting level (0 = root, 1 = first level, etc.) */
		this.nestingLevel = 0;
	}

	/**
	 * Parse namespace-specific content from source code
	 * @param {string} sourceCode - Source code to parse
	 */
	parseContent(sourceCode) {
		if (!sourceCode) return;

		this.setSource(sourceCode);

		// Extract namespace definition from JSDoc
		this._extractNamespaceDefinition(sourceCode);
		this._analyzeNamespaceType();
		this._extractSignature(sourceCode);
		this._calculateNestingLevel();
	}

	/**
	 * Extract namespace definition from JSDoc comments
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractNamespaceDefinition(sourceCode) {
		// Look for @namespace in JSDoc comments
		const namespaceMatch = sourceCode.match(
			/@namespace\s+([A-Za-z_$][A-Za-z0-9_$.:]*)/,
		);

		if (namespaceMatch) {
			const fullName = namespaceMatch[1];
			this.qualifiedName = fullName;

			// Extract parent namespace if nested
			const lastDotIndex = fullName.lastIndexOf(".");
			if (lastDotIndex !== -1) {
				this.parentNamespace = fullName.slice(0, lastDotIndex);
				// Update name to be just the last part
				if (!this.name || this.name === fullName) {
					this.name = fullName.slice(lastDotIndex + 1);
				}
			} else {
				this.qualifiedName = this.name;
			}
		}

		// Check for export
		this.isExported = /export.*@namespace/.test(sourceCode);
	}

	/**
	 * Analyze namespace type and characteristics
	 * @private
	 */
	_analyzeNamespaceType() {
		// Check if module namespace
		if (this.qualifiedName.startsWith("module:")) {
			this.isModule = true;
		}

		// Check if global namespace
		if (
			this.qualifiedName.startsWith("window.") ||
			this.qualifiedName.startsWith("global.") ||
			this.qualifiedName === "global"
		) {
			this.isGlobal = true;
		}
	}

	/**
	 * Extract namespace signature
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractSignature(sourceCode) {
		// Extract the @namespace line
		const lines = sourceCode.split("\n");
		const namespaceLine = lines.find((line) =>
			line.trim().includes("@namespace"),
		);

		if (namespaceLine) {
			this.signature = namespaceLine.trim().replace(/^\s*\*\s*/, "");
		}
	}

	/**
	 * Calculate nesting level based on qualified name
	 * @private
	 */
	_calculateNestingLevel() {
		if (!this.qualifiedName) {
			this.nestingLevel = 0;
			return;
		}

		// Count dots to determine nesting level
		const dots = (this.qualifiedName.match(/\./g) || []).length;
		this.nestingLevel = dots;

		// Module namespaces don't count the "module:" prefix
		if (this.isModule && this.qualifiedName.startsWith("module:")) {
			this.nestingLevel = Math.max(0, dots - 1);
		}
	}

	/**
	 * Add child namespace
	 * @param {string} childNamespace - Child namespace name
	 */
	addChildNamespace(childNamespace) {
		if (childNamespace && !this.childNamespaces.includes(childNamespace)) {
			this.childNamespaces.push(childNamespace);
		}
	}

	/**
	 * Add member entity to namespace
	 * @param {string} memberName - Member entity name
	 * @param {string} [memberType] - Member entity type (function, class, etc.)
	 */
	addMember(memberName, memberType = "unknown") {
		if (memberName) {
			// Check if member already exists
			const existingMember = this.members.find(
				(member) => member.name === memberName,
			);

			if (!existingMember) {
				this.members.push({
					name: memberName,
					type: memberType,
				});
			}
		}
	}

	/**
	 * Set parent namespace
	 * @param {string} parentNamespace - Parent namespace name
	 */
	setParentNamespace(parentNamespace) {
		this.parentNamespace = parentNamespace;
		this._calculateNestingLevel();
	}

	/**
	 * Get full hierarchy path
	 * @returns {Array<string>} Namespace hierarchy from root to this namespace
	 */
	getHierarchy() {
		if (!this.qualifiedName) {
			return [this.name];
		}

		// Split by dots and filter out module prefix
		const parts = this.qualifiedName.split(".");
		if (this.isModule && parts[0].startsWith("module:")) {
			parts[0] = parts[0].replace("module:", "");
		}

		return parts.filter(Boolean);
	}

	/**
	 * Validate namespace entity
	 */
	validate() {
		super.validate();

		// Namespace-specific validation
		const hasValidName = Boolean(this.name && this.name.length > 0);

		this.isValidated = this.isValidated && hasValidName;
	}

	/**
	 * Check if JSDoc tag is valid for namespaces
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for namespaces
	 */
	isValidJSDocTag(tagType) {
		const namespaceTags = [
			"memberof",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];

		return namespaceTags.includes(tagType) || super.isValidJSDocTag(tagType);
	}

	/**
	 * Serialize namespace entity to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			...super.toObject(),
			isExported: this.isExported,
			isGlobal: this.isGlobal,
			isModule: this.isModule,
			parentNamespace: this.parentNamespace,
			childNamespaces: this.childNamespaces,
			members: this.members,
			signature: this.signature,
			qualifiedName: this.qualifiedName,
			nestingLevel: this.nestingLevel,
		};
	}
}
