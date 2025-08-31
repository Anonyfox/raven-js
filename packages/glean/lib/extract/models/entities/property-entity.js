/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Property entity model - surgical class property documentation
 *
 * Ravens extract class properties with territorial precision.
 * Handles class fields, static properties, private properties, and initializers.
 * Combines variable-like parsing with class-specific context awareness.
 * Zero external dependencies, pure extraction.
 */

import { EntityBase } from "./base.js";

/**
 * Class property entity implementation
 *
 * **Supported Property Types:**
 * - Instance fields: `propertyName = value;`
 * - Static fields: `static propertyName = value;`
 * - Private fields: `#propertyName = value;`
 * - Static private: `static #propertyName = value;`
 * - Declared fields: `propertyName;` (no initializer)
 * - Computed properties: `[computed] = value;`
 *
 * **Valid JSDoc Tags:**
 * - `@type` - Property type annotation
 * - `@readonly` - Read-only property marker
 * - `@static` - Static property marker
 * - `@private` - Private property marker
 * - `@abstract` - Abstract property declaration
 * - `@override` - Property overrides parent
 * - `@default` - Default value documentation
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class PropertyEntity extends EntityBase {
	/**
	 * Create property entity instance
	 * @param {string} name - Property name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("property", name, location);

		/** @type {boolean} Whether property is static */
		this.isStatic = false;
		/** @type {boolean} Whether property is private */
		this.isPrivate = false;
		/** @type {boolean} Whether property is read-only */
		this.isReadonly = false;
		/** @type {boolean} Whether property is abstract */
		this.isAbstract = false;
		/** @type {boolean} Whether property has initializer */
		this.hasInitializer = false;
		/** @type {string|null} Property initializer value */
		this.initializer = null;
		/** @type {string} Inferred type from initializer */
		this.inferredType = "unknown";
		/** @type {string|null} Parent class name */
		this.parentClass = null;
		/** @type {string} Property signature */
		this.signature = "";
		/** @type {string} Access modifier: public|private|protected */
		this.accessModifier = "public";
		/** @type {boolean} Whether property is computed */
		this.isComputed = false;
	}

	/**
	 * Parse property-specific content from source code
	 * @param {string} sourceCode - Source code to parse
	 */
	parseContent(sourceCode) {
		if (!sourceCode) return;

		this.setSource(sourceCode);

		// Analyze property declaration
		this._analyzePropertyDeclaration(sourceCode);
		this._extractSignature(sourceCode);
		this._inferType();
	}

	/**
	 * Analyze property declaration and characteristics
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_analyzePropertyDeclaration(sourceCode) {
		const trimmed = sourceCode.trim();

		// Check modifiers
		this.isStatic = /\bstatic\b/.test(trimmed);
		this.isPrivate = /#/.test(trimmed);
		this.isReadonly = /\breadonly\b/.test(trimmed);
		this.isAbstract = /\babstract\b/.test(trimmed);

		// Determine access modifier
		if (this.isPrivate) {
			this.accessModifier = "private";
		} else if (trimmed.includes("protected")) {
			this.accessModifier = "protected";
		} else {
			this.accessModifier = "public";
		}

		// Check for computed property
		this.isComputed = /\[.*\]/.test(trimmed);

		// Check for initializer and extract value
		const initMatch = trimmed.match(/=\s*(.+?)(?:;|$)/);
		if (initMatch) {
			this.hasInitializer = true;
			this.initializer = initMatch[1].trim();
		}
	}

	/**
	 * Extract property signature
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractSignature(sourceCode) {
		const lines = sourceCode.split("\n");
		const propertyLine = lines.find((line) => {
			const trimmed = line.trim();
			return (
				(trimmed.includes(this.name) || this.isComputed) &&
				(trimmed.includes("=") || trimmed.endsWith(";"))
			);
		});

		if (propertyLine) {
			this.signature = propertyLine.trim();
		}
	}

	/**
	 * Infer property type from initializer
	 * @private
	 */
	_inferType() {
		if (!this.initializer) {
			this.inferredType = "unknown";
			return;
		}

		const init = this.initializer;

		// Basic type inference
		if (init === "null") {
			this.inferredType = "null";
		} else if (init === "undefined") {
			this.inferredType = "undefined";
		} else if (init === "true" || init === "false") {
			this.inferredType = "boolean";
		} else if (/^-?\d+$/.test(init)) {
			this.inferredType = "number";
		} else if (/^-?\d*\.\d+$/.test(init)) {
			this.inferredType = "number";
		} else if (/^["'`].*["'`]$/.test(init)) {
			this.inferredType = "string";
		} else if (init.startsWith("[") && init.endsWith("]")) {
			this.inferredType = "Array";
		} else if (init.startsWith("{") && init.endsWith("}")) {
			this.inferredType = "Object";
		} else if (init.includes("=>")) {
			this.inferredType = "Function";
		} else if (init.startsWith("new ")) {
			// Extract constructor name
			const constructorMatch = init.match(/new\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
			this.inferredType = constructorMatch ? constructorMatch[1] : "Object";
		} else if (/^[A-Za-z_$][A-Za-z0-9_$]*\(/.test(init)) {
			this.inferredType = "unknown"; // Function call result
		} else {
			this.inferredType = "unknown";
		}
	}

	/**
	 * Set parent class reference
	 * @param {string} parentClass - Parent class name
	 */
	setParentClass(parentClass) {
		this.parentClass = parentClass;
	}

	/**
	 * Validate property entity
	 */
	validate() {
		super.validate();

		// Property-specific validation
		const hasValidName = Boolean(this.name && this.name.length > 0);

		this.isValidated = this.isValidated && hasValidName;
	}

	/**
	 * Check if JSDoc tag is valid for properties
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for properties
	 */
	isValidJSDocTag(tagType) {
		const propertyTags = [
			"type",
			"readonly",
			"static",
			"private",
			"protected",
			"abstract",
			"override",
			"default",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];

		return propertyTags.includes(tagType) || super.isValidJSDocTag(tagType);
	}

	/**
	 * Serialize property entity to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			...super.toObject(),
			isStatic: this.isStatic,
			isPrivate: this.isPrivate,
			isReadonly: this.isReadonly,
			isAbstract: this.isAbstract,
			hasInitializer: this.hasInitializer,
			initializer: this.initializer,
			inferredType: this.inferredType,
			parentClass: this.parentClass,
			signature: this.signature,
			accessModifier: this.accessModifier,
			isComputed: this.isComputed,
		};
	}
}
