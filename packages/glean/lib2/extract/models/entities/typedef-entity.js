/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * @file Typedef entity model - surgical type definition documentation
 *
 * Ravens extract JSDoc @typedef constructs with precision.
 * Handles custom type definitions, object type schemas, and type aliases.
 * Essential for TypeScript-style documentation in JavaScript projects.
 * Zero external dependencies, pure extraction.
 */

import { EntityBase } from "./base.js";

/**
 * JSDoc typedef entity implementation
 *
 * **Supported Typedef Types:**
 * - Simple types: `@typedef {string} MyType`
 * - Object types: `@typedef {Object} MyObject`
 * - Complex types: `@typedef {Object.<string, number>} StringToNumberMap`
 * - Union types: `@typedef {string|number} StringOrNumber`
 * - Function types: `@typedef {function(string): boolean} Validator`
 *
 * **Valid JSDoc Tags:**
 * - `@property` - Object property definitions
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class TypedefEntity extends EntityBase {
	/**
	 * Create typedef entity instance
	 * @param {string} name - Type name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("typedef", name, location);

		/** @type {string} Type definition */
		this.type = "";
		/** @type {string} Type category: simple|object|function|union|complex */
		this.typeCategory = "simple";
		/** @type {boolean} Whether type is exported */
		this.isExported = false;
		/** @type {Array<Object>} Object properties (if object type) */
		this.properties = [];
		/** @type {Array<Object>} Function parameters (if function type) */
		this.parameters = [];
		/** @type {string|null} Return type (if function type) */
		this.returnType = null;
		/** @type {Array<string>} Union type members (if union type) */
		this.unionTypes = [];
		/** @type {string} Type signature */
		this.signature = "";
	}

	/**
	 * Parse typedef-specific content from source code
	 * @param {string} sourceCode - Source code to parse
	 */
	parseContent(sourceCode) {
		if (!sourceCode) return;

		this.setSource(sourceCode);

		// Extract type definition from JSDoc
		this._extractTypeDefinition(sourceCode);
		this._analyzeTypeCategory();
		this._extractSignature(sourceCode);
	}

	/**
	 * Extract type definition from JSDoc comments
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractTypeDefinition(sourceCode) {
		// Look for @typedef in JSDoc comments
		const typedefMatch = sourceCode.match(
			/@typedef\s*\{([^}]+)\}\s*([A-Za-z_$][A-Za-z0-9_$]*)/,
		);

		if (typedefMatch) {
			this.type = typedefMatch[1].trim();
			// Name should already be set, but verify it matches
			if (typedefMatch[2] && typedefMatch[2] !== this.name) {
				this.name = typedefMatch[2];
			}
		}

		// Check for export
		this.isExported = /export.*@typedef/.test(sourceCode);
	}

	/**
	 * Analyze type category based on type definition
	 * @private
	 */
	_analyzeTypeCategory() {
		if (!this.type) {
			this.typeCategory = "simple";
			return;
		}

		const type = this.type.toLowerCase();

		// Function type
		if (type.includes("function")) {
			this.typeCategory = "function";
			this._parseFunctionType();
		}
		// Union type
		else if (type.includes("|")) {
			this.typeCategory = "union";
			this._parseUnionType();
		}
		// Object type
		else if (type.includes("object") || type.includes("{")) {
			this.typeCategory = "object";
		}
		// Complex type (generics, etc.)
		else if (type.includes("<") && type.includes(">")) {
			this.typeCategory = "complex";
		}
		// Simple type
		else {
			this.typeCategory = "simple";
		}
	}

	/**
	 * Parse function type definition
	 * @private
	 */
	_parseFunctionType() {
		// Extract function signature: function(param1, param2): returnType
		const functionMatch = this.type.match(
			/function\s*\(([^)]*)\)(?:\s*:\s*([^,}]+))?/,
		);

		if (functionMatch) {
			// Parse parameters
			if (functionMatch[1]) {
				const paramStr = functionMatch[1].trim();
				if (paramStr) {
					this.parameters = paramStr
						.split(",")
						.map((param) => ({
							name: param.trim(),
							type: "unknown",
						}))
						.filter((param) => param.name);
				}
			}

			// Parse return type
			if (functionMatch[2]) {
				this.returnType = functionMatch[2].trim();
			}
		}
	}

	/**
	 * Parse union type definition
	 * @private
	 */
	_parseUnionType() {
		// Split union types by |
		this.unionTypes = this.type
			.split("|")
			.map((type) => type.trim())
			.filter(Boolean);
	}

	/**
	 * Extract typedef signature
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractSignature(sourceCode) {
		// Extract the @typedef line
		const lines = sourceCode.split("\n");
		const typedefLine = lines.find((line) => line.trim().includes("@typedef"));

		if (typedefLine) {
			this.signature = typedefLine.trim().replace(/^\s*\*\s*/, "");
		}
	}

	/**
	 * Add property to object typedef
	 * @param {Object} property - Property information
	 * @param {string} property.name - Property name
	 * @param {string} property.type - Property type
	 * @param {string} [property.description] - Property description
	 * @param {boolean} [property.optional] - Whether property is optional
	 */
	addProperty(property) {
		if (this.typeCategory === "object" && property && property.name) {
			this.properties.push({
				name: property.name,
				type: property.type || "unknown",
				description: property.description || "",
				optional: property.optional || false,
			});
		}
	}

	/**
	 * Validate typedef entity
	 */
	validate() {
		super.validate();

		// Typedef-specific validation
		const hasValidName = Boolean(this.name && this.name.length > 0);
		const hasValidType = Boolean(this.type && this.type.length > 0);

		this.isValidated = this.isValidated && hasValidName && hasValidType;
	}

	/**
	 * Check if JSDoc tag is valid for typedefs
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for typedefs
	 */
	isValidJSDocTag(tagType) {
		const typedefTags = [
			"property",
			"prop",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];

		return typedefTags.includes(tagType) || super.isValidJSDocTag(tagType);
	}

	/**
	 * Serialize typedef entity to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			...super.toObject(),
			type: this.type,
			typeCategory: this.typeCategory,
			isExported: this.isExported,
			properties: this.properties,
			parameters: this.parameters,
			returnType: this.returnType,
			unionTypes: this.unionTypes,
			signature: this.signature,
		};
	}
}
