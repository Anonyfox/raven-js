/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Function entity model - surgical function documentation
 *
 * Ravens dissect function constructs with predatory precision.
 * Handles all JavaScript function variants: regular, arrow, async,
 * generators with comprehensive parameter and return type analysis.
 * Zero external dependencies, pure extraction.
 */

import { EntityBase } from "./base.js";

/**
 * JavaScript function entity implementation
 *
 * **Supported Function Types:**
 * - Regular functions: `function name() {}`
 * - Arrow functions: `const name = () => {}`
 * - Async functions: `async function name() {}`
 * - Generator functions: `function* name() {}`
 * - Async generators: `async function* name() {}`
 * - Method functions: object methods and class methods
 *
 * **Valid JSDoc Tags:**
 * - `@param` - Parameter documentation
 * - `@returns/@return` - Return value documentation
 * - `@throws/@exception` - Exception documentation
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 * - `@override` - Method override indicator
 */
export class FunctionEntity extends EntityBase {
	/**
	 * Create function entity instance
	 * @param {string} name - Function name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("function", name, location);

		/** @type {string} Function type: function|arrow|async|generator|async-generator */
		this.functionType = "function";
		/** @type {boolean} Whether function is async */
		this.isAsync = false;
		/** @type {boolean} Whether function is a generator */
		this.isGenerator = false;
		/** @type {boolean} Whether function is arrow function */
		this.isArrow = false;
		/** @type {boolean} Whether function is exported */
		this.isExported = false;
		/** @type {Array<Object>} Extracted parameter information */
		this.parameters = [];
		/** @type {string|null} Return type (from JSDoc or inference) */
		this.returnType = null;
		/** @type {string} Function signature */
		this.signature = "";
	}

	/**
	 * Parse function-specific content from source code
	 * @param {string} sourceCode - Source code to parse
	 */
	parseContent(sourceCode) {
		if (!sourceCode) return;

		this.setSource(sourceCode);

		// Detect function type and characteristics
		this._analyzeFunctionType(sourceCode);
		this._extractSignature(sourceCode);
		this._parseParameters(sourceCode);
	}

	/**
	 * Analyze function type and characteristics
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_analyzeFunctionType(sourceCode) {
		const trimmed = sourceCode.trim();

		// Check for export
		this.isExported = /^export\s+/.test(trimmed);

		// Check for async
		this.isAsync = /(?:^|\s)async\s+/.test(trimmed);

		// Check for generator
		this.isGenerator = /function\s*\*/.test(trimmed);

		// Check for arrow function
		this.isArrow = /=>\s*[{(]/.test(trimmed);

		// Determine function type
		if (this.isArrow) {
			this.functionType = this.isAsync ? "async-arrow" : "arrow";
		} else if (this.isGenerator) {
			this.functionType = this.isAsync ? "async-generator" : "generator";
		} else if (this.isAsync) {
			this.functionType = "async";
		} else {
			this.functionType = "function";
		}
	}

	/**
	 * Extract function signature
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractSignature(sourceCode) {
		// Extract the function declaration/expression line
		const lines = sourceCode.split("\n");
		const declarationLine = lines.find(
			(line) =>
				line.includes(this.name) &&
				(line.includes("function") || line.includes("=>")),
		);

		if (declarationLine) {
			this.signature = declarationLine.trim();
		}
	}

	/**
	 * Parse function parameters
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_parseParameters(sourceCode) {
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
			/** @type {any} */
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
	 * Validate function entity
	 */
	validate() {
		super.validate();

		// Function-specific validation
		const hasValidName = Boolean(this.name && this.name.length > 0);
		const hasValidType = [
			"function",
			"arrow",
			"async",
			"generator",
			"async-generator",
			"async-arrow",
		].includes(this.functionType);

		this.isValidated = this.isValidated && hasValidName && hasValidType;
	}

	/**
	 * Check if JSDoc tag is valid for functions
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for functions
	 */
	isValidJSDocTag(tagType) {
		const functionTags = [
			"param",
			"parameter",
			"arg",
			"argument",
			"returns",
			"return",
			"throws",
			"exception",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
			"override",
		];

		return functionTags.includes(tagType) || super.isValidJSDocTag(tagType);
	}

	/**
	 * Serialize function entity to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			...super.toObject(),
			functionType: this.functionType,
			isAsync: this.isAsync,
			isGenerator: this.isGenerator,
			isArrow: this.isArrow,
			isExported: this.isExported,
			parameters: this.parameters,
			returnType: this.returnType,
			signature: this.signature,
		};
	}
}
