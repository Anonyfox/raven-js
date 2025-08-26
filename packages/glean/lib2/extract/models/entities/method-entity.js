/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * @file Method entity model - surgical class method documentation
 *
 * Ravens extract class methods with predatory precision.
 * Handles constructors, getters, setters, static methods, and private methods.
 * Reuses function parsing intelligence with class-specific context.
 * Zero external dependencies, pure extraction.
 */

import { EntityBase } from "./base.js";

/**
 * Class method entity implementation
 *
 * **Supported Method Types:**
 * - Constructor: `constructor(params) { ... }`
 * - Regular: `methodName(params) { ... }`
 * - Async: `async methodName(params) { ... }`
 * - Generator: `*methodName(params) { ... }`
 * - Async Generator: `async *methodName(params) { ... }`
 * - Getter: `get propertyName() { ... }`
 * - Setter: `set propertyName(value) { ... }`
 * - Static: `static methodName(params) { ... }`
 * - Private: `#methodName(params) { ... }`
 *
 * **Valid JSDoc Tags:**
 * - `@param` - Parameter definitions
 * - `@returns/@return` - Return value documentation
 * - `@throws/@exception` - Exception documentation
 * - `@override` - Method overrides parent
 * - `@abstract` - Abstract method declaration
 * - `@static` - Static method marker
 * - `@private` - Private method marker
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class MethodEntity extends EntityBase {
	/**
	 * Create method entity instance
	 * @param {string} name - Method name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("method", name, location);

		/** @type {string} Method type: constructor|method|getter|setter */
		this.methodType = "method";
		/** @type {boolean} Whether method is static */
		this.isStatic = false;
		/** @type {boolean} Whether method is private */
		this.isPrivate = false;
		/** @type {boolean} Whether method is async */
		this.isAsync = false;
		/** @type {boolean} Whether method is a generator */
		this.isGenerator = false;
		/** @type {boolean} Whether method is abstract */
		this.isAbstract = false;
		/** @type {string|null} Parent class name */
		this.parentClass = null;
		/** @type {Array<Object>} Method parameters */
		this.parameters = [];
		/** @type {string|null} Return type */
		this.returnType = null;
		/** @type {string} Method signature */
		this.signature = "";
		/** @type {string} Access modifier: public|private|protected */
		this.accessModifier = "public";
	}

	/**
	 * Parse method-specific content from source code
	 * @param {string} sourceCode - Source code to parse
	 */
	parseContent(sourceCode) {
		if (!sourceCode) return;

		this.setSource(sourceCode);

		// Analyze method signature
		this._analyzeMethodSignature(sourceCode);
		this._extractSignature(sourceCode);
		this._parseParameters(sourceCode);
	}

	/**
	 * Analyze method signature and characteristics
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_analyzeMethodSignature(sourceCode) {
		const trimmed = sourceCode.trim();

		// Check modifiers
		this.isStatic = /\bstatic\b/.test(trimmed);
		this.isAsync = /\basync\b/.test(trimmed);
		this.isGenerator = /\*/.test(trimmed);
		this.isPrivate = /#/.test(trimmed);

		// Determine access modifier
		if (this.isPrivate) {
			this.accessModifier = "private";
		} else if (trimmed.includes("protected")) {
			this.accessModifier = "protected";
		} else {
			this.accessModifier = "public";
		}

		// Determine method type
		if (this.name === "constructor") {
			this.methodType = "constructor";
		} else if (trimmed.includes("get ")) {
			this.methodType = "getter";
		} else if (trimmed.includes("set ")) {
			this.methodType = "setter";
		} else {
			this.methodType = "method";
		}
	}

	/**
	 * Extract method signature
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractSignature(sourceCode) {
		const lines = sourceCode.split("\n");
		const methodLine = lines.find((line) => {
			const trimmed = line.trim();
			return (
				trimmed.includes(this.name) &&
				(trimmed.includes("(") || this.methodType === "getter")
			);
		});

		if (methodLine) {
			// Extract up to opening brace or end of line
			const braceIndex = methodLine.indexOf("{");
			this.signature =
				braceIndex !== -1
					? methodLine.slice(0, braceIndex).trim()
					: methodLine.trim();
		}
	}

	/**
	 * Parse method parameters
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_parseParameters(sourceCode) {
		// For getters, no parameters
		if (this.methodType === "getter") {
			this.parameters = [];
			return;
		}

		// Extract parameters from signature
		const paramRegex = /\(([^)]*)\)/;
		const match = sourceCode.match(paramRegex);

		if (!match || !match[1].trim()) {
			this.parameters = [];
			return;
		}

		const paramStr = match[1].trim();
		const params = this._splitParameters(paramStr);

		this.parameters = params.map((param) => this._parseParameter(param.trim()));
	}

	/**
	 * Split parameter string into individual parameters
	 * @param {string} paramStr - Parameter string
	 * @returns {Array<string>} Individual parameter strings
	 * @private
	 */
	_splitParameters(paramStr) {
		const params = [];
		let current = "";
		let depth = 0;
		let inString = false;
		let stringChar = "";

		for (let i = 0; i < paramStr.length; i++) {
			const char = paramStr[i];

			if (inString) {
				current += char;
				if (char === stringChar && paramStr[i - 1] !== "\\") {
					inString = false;
				}
			} else {
				if (char === '"' || char === "'" || char === "`") {
					inString = true;
					stringChar = char;
					current += char;
				} else if (char === "(" || char === "[" || char === "{") {
					depth++;
					current += char;
				} else if (char === ")" || char === "]" || char === "}") {
					depth--;
					current += char;
				} else if (char === "," && depth === 0) {
					params.push(current);
					current = "";
				} else {
					current += char;
				}
			}
		}

		if (current.trim()) {
			params.push(current);
		}

		return params;
	}

	/**
	 * Parse individual parameter
	 * @param {string} paramStr - Parameter string
	 * @returns {Object} Parameter information
	 * @private
	 */
	_parseParameter(paramStr) {
		const param = {
			name: "",
			isRest: false,
			hasDefault: false,
			defaultValue: null,
			isDestructured: false,
			fullSignature: paramStr,
		};

		// Check for rest parameter
		if (paramStr.startsWith("...")) {
			param.isRest = true;
			paramStr = paramStr.slice(3);
		}

		// Check for default value
		const defaultMatch = paramStr.match(/^([^=]+)=(.+)$/);
		if (defaultMatch) {
			param.hasDefault = true;
			param.defaultValue = defaultMatch[2].trim();
			paramStr = defaultMatch[1].trim();
		}

		// Check for destructuring
		if (paramStr.startsWith("{") || paramStr.startsWith("[")) {
			param.isDestructured = true;
			param.name = paramStr; // Keep full destructuring pattern
		} else {
			// Extract simple parameter name
			param.name = paramStr.trim();
		}

		return param;
	}

	/**
	 * Set parent class reference
	 * @param {string} parentClass - Parent class name
	 */
	setParentClass(parentClass) {
		this.parentClass = parentClass;
	}

	/**
	 * Validate method entity
	 */
	validate() {
		super.validate();

		// Method-specific validation
		const hasValidName = Boolean(this.name && this.name.length > 0);
		const hasValidType = ["constructor", "method", "getter", "setter"].includes(
			this.methodType,
		);

		this.isValidated = this.isValidated && hasValidName && hasValidType;
	}

	/**
	 * Check if JSDoc tag is valid for methods
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for methods
	 */
	isValidJSDocTag(tagType) {
		const methodTags = [
			"param",
			"parameter",
			"arg",
			"argument",
			"returns",
			"return",
			"throws",
			"exception",
			"override",
			"abstract",
			"static",
			"private",
			"protected",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];

		return methodTags.includes(tagType) || super.isValidJSDocTag(tagType);
	}

	/**
	 * Serialize method entity to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			...super.toObject(),
			methodType: this.methodType,
			isStatic: this.isStatic,
			isPrivate: this.isPrivate,
			isAsync: this.isAsync,
			isGenerator: this.isGenerator,
			isAbstract: this.isAbstract,
			parentClass: this.parentClass,
			parameters: this.parameters,
			returnType: this.returnType,
			signature: this.signature,
			accessModifier: this.accessModifier,
		};
	}
}
