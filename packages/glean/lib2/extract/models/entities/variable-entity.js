/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Variable entity model - surgical variable documentation
 *
 * Ravens hunt variable declarations with lean precision.
 * Handles modern JavaScript variable constructs: const, let, var
 * with type annotations and initialization analysis.
 * Zero external dependencies, pure extraction.
 */

import { EntityBase } from "./base.js";

/**
 * JavaScript variable entity implementation
 *
 * **Supported Variable Types:**
 * - Constants: `const NAME = value`
 * - Variables: `let name = value`
 * - Legacy variables: `var name = value`
 * - Module exports: `export const NAME = value`
 * - Destructured: `const {a, b} = obj`
 *
 * **Valid JSDoc Tags:**
 * - `@type` - Variable type annotation
 * - `@readonly` - Read-only indicator
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 * - `@example` - Usage examples
 */
export class VariableEntity extends EntityBase {
	/**
	 * Create variable entity instance
	 * @param {string} name - Variable name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("variable", name, location);

		/** @type {string} Declaration type: const|let|var */
		this.declarationType = "const";
		/** @type {boolean} Whether variable has initializer */
		this.hasInitializer = false;
		/** @type {string|null} Initial value expression */
		this.initializer = null;
		/** @type {boolean} Whether variable is read-only */
		this.isReadonly = false;
		/** @type {boolean} Whether variable is exported */
		this.isExported = false;
		/** @type {boolean} Whether variable is destructured */
		this.isDestructured = false;
		/** @type {string|null} Inferred type from initializer */
		this.inferredType = null;
		/** @type {string} Variable signature */
		this.signature = "";
	}

	/**
	 * Parse variable-specific content from source code
	 * @param {string} sourceCode - Source code to parse
	 */
	parseContent(sourceCode) {
		if (!sourceCode) return;

		this.setSource(sourceCode);

		// Analyze variable declaration
		this._analyzeDeclaration(sourceCode);
		this._extractSignature(sourceCode);
		this._inferType();
	}

	/**
	 * Analyze variable declaration
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_analyzeDeclaration(sourceCode) {
		const trimmed = sourceCode.trim();

		// Check for export
		this.isExported = /^export\s+/.test(trimmed);

		// Extract declaration type
		const declarationMatch = trimmed.match(/(?:export\s+)?(const|let|var)\s+/);
		if (declarationMatch) {
			this.declarationType = declarationMatch[1];
		}

		// Set readonly for const
		this.isReadonly = this.declarationType === "const";

		// Check for destructuring
		this.isDestructured = /(?:const|let|var)\s+[{[]/.test(trimmed);

		// Check for initializer and extract value
		const initMatch = trimmed.match(/=\s*(.+?)(?:;|$)/);
		if (initMatch) {
			this.hasInitializer = true;
			this.initializer = initMatch[1].trim();
		}
	}

	/**
	 * Extract variable signature
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractSignature(sourceCode) {
		const lines = sourceCode.split("\n");
		const declarationLine = lines.find(
			(line) =>
				line.includes(this.name) &&
				(line.includes("const") ||
					line.includes("let") ||
					line.includes("var")),
		);

		if (declarationLine) {
			this.signature = declarationLine.trim();
		}
	}

	/**
	 * Infer type from initializer
	 * @private
	 */
	_inferType() {
		if (!this.initializer) {
			this.inferredType = "undefined";
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
	 * Validate variable entity
	 */
	validate() {
		super.validate();

		// Variable-specific validation
		const hasValidName = Boolean(this.name && this.name.length > 0);
		const hasValidDeclarationType = ["const", "let", "var"].includes(
			this.declarationType,
		);

		this.isValidated =
			this.isValidated && hasValidName && hasValidDeclarationType;
	}

	/**
	 * Check if JSDoc tag is valid for variables
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for variables
	 */
	isValidJSDocTag(tagType) {
		const variableTags = [
			"type",
			"readonly",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];

		return variableTags.includes(tagType) || super.isValidJSDocTag(tagType);
	}

	/**
	 * Serialize variable entity to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			...super.toObject(),
			declarationType: this.declarationType,
			hasInitializer: this.hasInitializer,
			initializer: this.initializer,
			isReadonly: this.isReadonly,
			isExported: this.isExported,
			isDestructured: this.isDestructured,
			inferredType: this.inferredType,
			signature: this.signature,
		};
	}
}
