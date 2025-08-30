/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Class entity model - surgical ES6 class documentation
 *
 * Ravens dissect class constructs with architectural precision.
 * Handles ES6 class declarations with inheritance analysis,
 * constructor detection, and member discovery.
 * Zero external dependencies, pure extraction.
 */

import { EntityBase } from "./base.js";

/**
 * JavaScript ES6 class entity implementation
 *
 * **Supported Class Features:**
 * - Basic classes: `class Name {}`
 * - Inheritance: `class Child extends Parent {}`
 * - Export classes: `export class Name {}`
 * - Constructor detection
 * - Method and property discovery
 *
 * **Valid JSDoc Tags:**
 * - `@extends` - Inheritance documentation
 * - `@implements` - Interface implementation
 * - `@abstract` - Abstract class marker
 * - `@example` - Usage examples
 * - `@since` - Version information
 * - `@deprecated` - Deprecation notices
 * - `@see` - Related references
 * - `@author` - Authorship information
 */
export class ClassEntity extends EntityBase {
	/**
	 * Create class entity instance
	 * @param {string} name - Class name
	 * @param {{file: string, line: number, column: number}} location - Source location metadata
	 */
	constructor(name, location) {
		super("class", name, location);

		/** @type {string|null} Parent class name */
		this.extendsClass = null;
		/** @type {boolean} Whether class has constructor */
		this.hasConstructor = false;
		/** @type {number|null} Constructor line number */
		this.constructorLine = null;
		/** @type {boolean} Whether class is exported */
		this.isExported = false;
		/** @type {boolean} Whether class is abstract */
		this.isAbstract = false;
		/** @type {Array<string>} Interface names this class implements */
		this.implementsInterfaces = [];
		/** @type {Array<Object>} Method information */
		this.methods = [];
		/** @type {Array<Object>} Property information */
		this.properties = [];
		/** @type {string} Class signature */
		this.signature = "";
	}

	/**
	 * Parse class-specific content from source code
	 * @param {string} sourceCode - Source code to parse
	 */
	parseContent(sourceCode) {
		if (!sourceCode) return;

		this.setSource(sourceCode);

		// Analyze class declaration
		this._analyzeClassDeclaration(sourceCode);
		this._extractSignature(sourceCode);
		this._findConstructor(sourceCode);
		this._analyzeMembers(sourceCode);
	}

	/**
	 * Analyze class declaration for inheritance and export
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_analyzeClassDeclaration(sourceCode) {
		const lines = sourceCode.split("\n");
		const classLine = lines.find(
			(line) => line.includes("class") && line.includes(this.name),
		);

		if (!classLine) return;

		// Check for export
		this.isExported = /^export\s+/.test(classLine.trim());

		// Check for inheritance
		const extendsMatch = classLine.match(
			/extends\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
		);
		if (extendsMatch) {
			this.extendsClass = extendsMatch[1];
		}

		// Extract implements (TypeScript-style, but also common in JSDoc)
		const implementsMatch = classLine.match(
			/implements\s+([A-Za-z_$][A-Za-z0-9_$,\s]*)/,
		);
		if (implementsMatch) {
			this.implementsInterfaces = implementsMatch[1]
				.split(",")
				.map((name) => name.trim())
				.filter(Boolean);
		}
	}

	/**
	 * Extract class signature
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_extractSignature(sourceCode) {
		const lines = sourceCode.split("\n");
		const classLine = lines.find(
			(line) => line.includes("class") && line.includes(this.name),
		);

		if (classLine) {
			// Extract up to opening brace
			const braceIndex = classLine.indexOf("{");
			this.signature =
				braceIndex !== -1
					? classLine.slice(0, braceIndex).trim()
					: classLine.trim();
		}
	}

	/**
	 * Find constructor in class body
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_findConstructor(sourceCode) {
		const lines = sourceCode.split("\n");

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (line.startsWith("constructor(") || line.includes(" constructor(")) {
				this.hasConstructor = true;
				this.constructorLine = i + 1; // 1-based line number
				break;
			}
		}
	}

	/**
	 * Analyze class members (methods and properties)
	 * @param {string} sourceCode - Source code to analyze
	 * @private
	 */
	_analyzeMembers(sourceCode) {
		const lines = sourceCode.split("\n");
		let inClassBody = false;
		let braceDepth = 0;
		let inConstructor = false;
		let constructorBraceDepth = 0;
		let currentJSDocBlock = null;
		let inJSDocBlock = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmed = line.trim();

			// Track class body boundaries
			if (trimmed.includes("class") && trimmed.includes(this.name)) {
				inClassBody = true;
				// Count braces on class declaration line
				for (const char of line) {
					if (char === "{") braceDepth++;
					if (char === "}") braceDepth--;
				}
				continue;
			}

			if (!inClassBody) continue;

			// Track JSDoc blocks
			if (trimmed.startsWith("/**")) {
				inJSDocBlock = true;
				currentJSDocBlock = [trimmed];
			} else if (inJSDocBlock) {
				currentJSDocBlock.push(trimmed);
				if (trimmed.endsWith("*/")) {
					inJSDocBlock = false;
				}
			} else if (!trimmed || trimmed.startsWith("//")) {
				// Skip empty lines and single-line comments but don't reset JSDoc
			} else if (braceDepth === 1) {
				// We're at class level - check for methods/properties
				if (this._isMethod(trimmed)) {
					const method = this._parseMethod(trimmed, i + 1);
					if (method) {
						// Associate JSDoc block with method if available
						if (currentJSDocBlock) {
							method.jsDocBlock = currentJSDocBlock.join("\n");
							method.documentation = this._parseJSDocBlock(currentJSDocBlock);
						}
						this.methods.push(method);
					}
				} else if (this._isProperty(trimmed)) {
					const property = this._parseProperty(trimmed, i + 1);
					if (property) {
						// Associate JSDoc block with property if available
						if (currentJSDocBlock) {
							property.jsDocBlock = currentJSDocBlock.join("\n");
							property.documentation = this._parseJSDocBlock(currentJSDocBlock);
						}
						this.properties.push(property);
					}
				}
				// Reset JSDoc block after processing a member
				currentJSDocBlock = null;
			}

			// Track constructor boundaries for instance property detection
			if (braceDepth === 1 && trimmed.includes("constructor(")) {
				inConstructor = true;
				constructorBraceDepth = 0;
			}

			// Detect instance properties within constructor
			if (inConstructor && braceDepth > 1) {
				this._analyzeConstructorProperty(trimmed, i + 1);
			}

			// Track brace depth
			for (const char of line) {
				if (char === "{") {
					braceDepth++;
					if (inConstructor) constructorBraceDepth++;
				}
				if (char === "}") {
					braceDepth--;
					if (inConstructor) {
						constructorBraceDepth--;
						// Exit constructor when we return to class level
						if (constructorBraceDepth === 0 && braceDepth === 1) {
							inConstructor = false;
						}
					}
				}
			}

			// Exit class body
			if (braceDepth === 0 && trimmed === "}") {
				break;
			}
		}
	}

	/**
	 * Analyze individual class member
	 * @param {string} line - Line of code
	 * @param {number} lineNumber - Line number
	 * @private
	 */
	_analyzeMember(line, lineNumber) {
		// Method detection
		if (this._isMethod(line)) {
			const method = this._parseMethod(line, lineNumber);
			if (method) {
				this.methods.push(method);
			}
		}
		// Property detection
		else if (this._isProperty(line)) {
			const property = this._parseProperty(line, lineNumber);
			if (property) {
				this.properties.push(property);
			}
		}
	}

	/**
	 * Check if line represents a method
	 * @param {string} line - Line of code
	 * @returns {boolean} True if line is a method
	 * @private
	 */
	_isMethod(line) {
		// Method patterns: name(), async name(), static name(), get name(), set name(), *name()
		return (
			/(?:(?:static|async|get|set)\s+)?(?:\*\s*)?[A-Za-z_$][A-Za-z0-9_$]*\s*\([^)]*\)\s*\{?/.test(
				line,
			) || line.includes("constructor(")
		);
	}

	/**
	 * Check if line represents a property
	 * @param {string} line - Line of code
	 * @returns {boolean} True if line is a property
	 * @private
	 */
	_isProperty(line) {
		// Property patterns: name = value, static name = value, #name = value
		return (
			/(?:static\s+)?(?:#)?[A-Za-z_$][A-Za-z0-9_$]*\s*[=;]/.test(line) &&
			!line.includes("(") &&
			!line.includes("function")
		);
	}

	/**
	 * Parse method information
	 * @param {string} line - Line of code
	 * @param {number} lineNumber - Line number
	 * @returns {{type: string, name: string, line: number, isStatic: boolean, isPrivate: boolean, isAsync: boolean, isGenerator: boolean, methodType: string, signature: string, jsDocBlock?: string, documentation?: any}|null} Method information
	 * @private
	 */
	_parseMethod(line, lineNumber) {
		const method = {
			type: "method",
			name: "",
			line: lineNumber,
			isStatic: false,
			isPrivate: false,
			isAsync: false,
			isGenerator: false,
			methodType: "method", // method|constructor|getter|setter
			signature: line,
		};

		// Check modifiers
		method.isStatic = line.includes("static");
		method.isAsync = line.includes("async");
		method.isGenerator = line.includes("*");
		method.isPrivate = line.includes("#");

		// Determine method type
		if (line.includes("constructor")) {
			method.methodType = "constructor";
			method.name = "constructor";
		} else if (line.includes("get ")) {
			method.methodType = "getter";
		} else if (line.includes("set ")) {
			method.methodType = "setter";
		}

		// Extract method name if not already set
		if (!method.name) {
			const nameMatch = line.match(
				/(?:(?:static|async|get|set)\s+)?(?:\*\s*)?([A-Za-z_$#][A-Za-z0-9_$]*)/,
			);
			if (nameMatch) {
				method.name = nameMatch[1];
			}
		}

		return method.name ? method : null;
	}

	/**
	 * Parse property information
	 * @param {string} line - Line of code
	 * @param {number} lineNumber - Line number
	 * @returns {{name: string, line: number, isStatic: boolean, isPrivate: boolean, signature?: string, jsDocBlock?: string, documentation?: any}|null} Property information
	 * @private
	 */
	_parseProperty(line, lineNumber) {
		const property = {
			name: "",
			line: lineNumber,
			isStatic: false,
			isPrivate: false,
			hasInitializer: false,
			signature: line,
		};

		// Check modifiers
		property.isStatic = line.includes("static");
		property.isPrivate = line.includes("#");
		property.hasInitializer = line.includes("=") && !line.endsWith(";");

		// Extract property name
		const nameMatch = line.match(/(?:static\s+)?([A-Za-z_$#][A-Za-z0-9_$]*)/);
		if (nameMatch) {
			property.name = nameMatch[1];
		}

		return property.name ? property : null;
	}

	/**
	 * Parse JSDoc block to extract documentation
	 * @param {Array<string>} jsDocLines - Lines of JSDoc block
	 * @returns {Object} Parsed documentation
	 * @private
	 */
	_parseJSDocBlock(jsDocLines) {
		/** @type {{description: string, parameters: any[], returns: any, throws: any[], deprecated: boolean, since: string, see: any[], example: string, private?: boolean}} */
		const documentation = {
			description: "",
			parameters: [],
			returns: null,
			throws: [],
			deprecated: false,
			since: "",
			see: [],
			example: "",
		};

		const currentDescription = [];
		let inDescription = true;

		for (const line of jsDocLines) {
			const trimmed = line
				.replace(/^\s*\*\s?/, "")
				.replace(/^\s*\/\*\*\s?/, "")
				.replace(/\s*\*\/\s*$/, "");

			if (trimmed.startsWith("@param")) {
				inDescription = false;
				const paramMatch = trimmed.match(
					/@param\s+\{([^}]+)\}\s+(\[?([^\]\s-]+)\]?)\s*-?\s*(.*)/,
				);
				if (paramMatch) {
					documentation.parameters.push({
						name: paramMatch[3] || paramMatch[2],
						type: paramMatch[1],
						optional: paramMatch[2].includes("["),
						description: paramMatch[4] || "",
					});
				}
			} else if (
				trimmed.startsWith("@returns") ||
				trimmed.startsWith("@return")
			) {
				inDescription = false;
				const returnMatch = trimmed.match(
					/@returns?\s+\{([^}]+)\}\s*-?\s*(.*)/,
				);
				if (returnMatch) {
					documentation.returns = {
						type: returnMatch[1],
						description: returnMatch[2] || "",
					};
				}
			} else if (trimmed.startsWith("@throws")) {
				inDescription = false;
				const throwMatch = trimmed.match(/@throws\s+\{([^}]+)\}\s*-?\s*(.*)/);
				if (throwMatch) {
					documentation.throws.push({
						type: throwMatch[1],
						description: throwMatch[2] || "",
					});
				}
			} else if (trimmed.startsWith("@deprecated")) {
				documentation.deprecated = true;
			} else if (trimmed.startsWith("@since")) {
				const sinceMatch = trimmed.match(/@since\s+(.*)/);
				if (sinceMatch) {
					documentation.since = sinceMatch[1];
				}
			} else if (trimmed.startsWith("@see")) {
				const seeMatch = trimmed.match(/@see\s+(.*)/);
				if (seeMatch) {
					documentation.see.push(seeMatch[1]);
				}
			} else if (trimmed.startsWith("@example")) {
				inDescription = false;
				// Example content will be on following lines
			} else if (trimmed.startsWith("@private")) {
				documentation.private = true;
			} else if (inDescription && trimmed && !trimmed.startsWith("@")) {
				currentDescription.push(trimmed);
			}
		}

		documentation.description = currentDescription.join(" ").trim();
		return documentation;
	}

	/**
	 * Analyze constructor line for instance property assignments
	 * @param {string} line - Line of code
	 * @param {number} lineNumber - Line number
	 * @private
	 */
	_analyzeConstructorProperty(line, lineNumber) {
		// Look for this.propertyName = value patterns
		const instancePropertyPattern =
			/this\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(.+)/;
		const match = line.match(instancePropertyPattern);

		if (match) {
			const propertyName = match[1];
			const initializer = match[2].trim();

			// Check if this property is already tracked (avoid duplicates)
			const existingProperty = this.properties.find(
				/** @param {{name: string}} p */ (p) => p.name === propertyName,
			);
			if (!existingProperty) {
				const property = {
					name: propertyName,
					line: lineNumber,
					isStatic: false,
					isPrivate: false,
					hasInitializer: true,
					signature: `${propertyName} = ${initializer}`,
					isInstance: true, // Mark as instance property
				};

				this.properties.push(property);
			}
		}
	}

	/**
	 * Validate class entity
	 */
	validate() {
		super.validate();

		// Class-specific validation
		const hasValidName = Boolean(this.name && this.name.length > 0);

		this.isValidated = this.isValidated && hasValidName;
	}

	/**
	 * Check if JSDoc tag is valid for classes
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for classes
	 */
	isValidJSDocTag(tagType) {
		const classTags = [
			"extends",
			"implements",
			"abstract",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];

		return classTags.includes(tagType) || super.isValidJSDocTag(tagType);
	}

	/**
	 * Serialize class entity to plain object
	 * @returns {Object} Plain object representation
	 */
	toObject() {
		return {
			...super.toObject(),
			extendsClass: this.extendsClass,
			hasConstructor: this.hasConstructor,
			constructorLine: this.constructorLine,
			isExported: this.isExported,
			isAbstract: this.isAbstract,
			implementsInterfaces: this.implementsInterfaces,
			methods: this.methods,
			properties: this.properties,
			signature: this.signature,
		};
	}
}
