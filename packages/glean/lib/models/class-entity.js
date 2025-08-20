/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Class entity model - surgical ES6 class documentation.
 *
 * Ravens dissect class constructs with architectural precision.
 * Handles ES6 class declarations with inheritance analysis,
 * constructor detection, and member discovery.
 */

import { html } from "@raven-js/beak";
import { EntityBase } from "./entity-base.js";

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

		// Class-specific properties
		this.extendsClass = null; // Parent class name
		this.hasConstructor = false;
		this.constructorLine = null;
		/** @type {Array<{type: string, name: string, line: number, isStatic: boolean, isPrivate: boolean, signature: string}>} */
		this.methods = []; // Method information (will be MethodEntity instances later)
		/** @type {Array<{name: string, line: number, isStatic: boolean, isPrivate: boolean, hasInitializer: boolean, signature: string}>} */
		this.properties = []; // Property information (will be PropertyEntity instances later)
		this.isAbstract = false;
		/** @type {string[]} */
		this.implementsInterfaces = []; // Interface names
	}

	/**
	 * Valid JSDoc tags for class entities
	 * @param {string} tagType - JSDoc tag type to validate
	 * @returns {boolean} True if tag is valid for classes
	 */
	isValidJSDocTag(tagType) {
		const validTags = [
			"extends",
			"implements",
			"abstract",
			"example",
			"since",
			"deprecated",
			"see",
			"author",
		];
		return validTags.includes(tagType);
	}

	/**
	 * Parse class-specific content from raw code entity
	 * @param {any} rawEntity - Raw code entity from validation
	 * @param {string} content - Full file content for context
	 */
	parseEntity(rawEntity, content) {
		// Extract class declaration from source
		const lines = content.split("\n");
		const classLine = lines[rawEntity.line - 1];

		this.parseClassDeclaration(classLine);
		this.parseClassBody(lines, rawEntity.line - 1);
		this.parseJSDocAnnotations();
	}

	/**
	 * Parse class declaration line to extract inheritance
	 * @param {string} classLine - Source line containing class declaration
	 */
	parseClassDeclaration(classLine) {
		const trimmed = classLine.trim();

		// Extract extends clause
		const extendsMatch = trimmed.match(/class\s+\w+\s+extends\s+(\w+)/);
		if (extendsMatch) {
			this.extendsClass = extendsMatch[1];
		}
	}

	/**
	 * Parse class body to discover methods and properties
	 * @param {string[]} lines - File lines
	 * @param {number} classStartLine - Class declaration line index (0-based)
	 */
	parseClassBody(lines, classStartLine) {
		// Find class body boundaries
		const { startLine, endLine } = this.findClassBodyBounds(
			lines,
			classStartLine,
		);

		if (startLine === -1 || endLine === -1) {
			return; // Could not parse class body
		}

		// Parse class members
		for (let i = startLine; i <= endLine; i++) {
			const line = lines[i].trim();
			const lineNumber = i + 1; // Convert to 1-based

			// Skip empty lines and comments
			if (!line || line.startsWith("//") || line.startsWith("/*")) {
				continue;
			}

			this.parseClassMember(line, lineNumber);
		}
	}

	/**
	 * Find class body boundaries (opening and closing braces)
	 * @param {string[]} lines - File lines
	 * @param {number} classStartLine - Class declaration line index
	 * @returns {{startLine: number, endLine: number}} Start and end line indices
	 */
	findClassBodyBounds(lines, classStartLine) {
		let braceDepth = 0;
		let startLine = -1;
		let endLine = -1;

		// Find opening brace
		for (
			let i = classStartLine;
			i < lines.length && i < classStartLine + 5;
			i++
		) {
			if (lines[i].includes("{")) {
				startLine = i + 1; // Start after opening brace
				braceDepth = 1;
				break;
			}
		}

		if (startLine === -1) {
			return { startLine: -1, endLine: -1 };
		}

		// Find closing brace
		for (let i = startLine; i < lines.length && i < classStartLine + 200; i++) {
			const line = lines[i];
			for (const char of line) {
				if (char === "{") braceDepth++;
				else if (char === "}") {
					braceDepth--;
					if (braceDepth === 0) {
						endLine = i - 1; // End before closing brace
						return { startLine, endLine };
					}
				}
			}
		}

		return {
			startLine,
			endLine: Math.min(lines.length - 1, classStartLine + 100),
		};
	}

	/**
	 * Parse individual class member (method, property, constructor)
	 * @param {string} line - Source line to parse
	 * @param {number} lineNumber - Line number (1-based)
	 */
	parseClassMember(line, lineNumber) {
		// Skip lines that are clearly not class member declarations
		// (inside method bodies, indented statements, etc.)
		if (line.match(/^\s{3,}/)) {
			// Lines with 3+ spaces of indentation are likely inside method bodies
			return;
		}

		// Constructor detection - must start at class member level
		if (line.match(/^\s*(constructor\s*\()/)) {
			this.hasConstructor = true;
			this.constructorLine = lineNumber;
			this.methods.push({
				type: "constructor",
				name: "constructor",
				line: lineNumber,
				isStatic: false,
				isPrivate: line.includes("#constructor"),
				signature: this.extractMethodSignature(line),
			});
			return;
		}

		// Method detection - must be at class member level (not inside other methods)
		const methodMatch = line.match(
			/^\s*(static\s+)?(#)?(\w+)\s*\([^)]*\)\s*\{?/,
		);
		if (methodMatch) {
			const [, staticModifier, privatePrefix, methodName] = methodMatch;
			// Skip common non-method patterns
			if (
				["super", "this", "return", "if", "for", "while"].includes(methodName)
			) {
				return;
			}
			this.methods.push({
				type: "method",
				name: methodName,
				line: lineNumber,
				isStatic: Boolean(staticModifier),
				isPrivate: Boolean(privatePrefix),
				signature: this.extractMethodSignature(line),
			});
			return;
		}

		// Getter detection
		const getterMatch = line.match(/^\s*(static\s+)?get\s+(\w+)\s*\(\s*\)/);
		if (getterMatch) {
			const [, staticModifier, getterName] = getterMatch;
			this.methods.push({
				type: "getter",
				name: getterName,
				line: lineNumber,
				isStatic: Boolean(staticModifier),
				isPrivate: false,
				signature: this.extractMethodSignature(line),
			});
			return;
		}

		// Setter detection
		const setterMatch = line.match(/^\s*(static\s+)?set\s+(\w+)\s*\([^)]*\)/);
		if (setterMatch) {
			const [, staticModifier, setterName] = setterMatch;
			this.methods.push({
				type: "setter",
				name: setterName,
				line: lineNumber,
				isStatic: Boolean(staticModifier),
				isPrivate: false,
				signature: this.extractMethodSignature(line),
			});
			return;
		}

		// Property detection (class fields) - must be at class member level
		const propertyMatch = line.match(/^\s*(static\s+)?(#)?(\w+)\s*[=;]/);
		if (propertyMatch) {
			const [, staticModifier, privatePrefix, propertyName] = propertyMatch;
			// Skip common non-property patterns
			if (
				["this", "super", "return", "const", "let", "var"].includes(
					propertyName,
				)
			) {
				return;
			}
			this.properties.push({
				name: propertyName,
				line: lineNumber,
				isStatic: Boolean(staticModifier),
				isPrivate: Boolean(privatePrefix),
				hasInitializer: line.includes("="),
				signature: line.split("=")[0].trim(),
			});
		}
	}

	/**
	 * Extract method signature from source line
	 * @param {string} line - Source line containing method
	 * @returns {string} Method signature
	 */
	extractMethodSignature(line) {
		// Extract everything up to the opening brace
		const braceIndex = line.indexOf("{");
		if (braceIndex !== -1) {
			return line.substring(0, braceIndex).trim();
		}
		return line.trim();
	}

	/**
	 * Parse JSDoc annotations to extract additional class information
	 */
	parseJSDocAnnotations() {
		// Check for @abstract tag
		const abstractTag = this.getJSDocTag("abstract");
		if (abstractTag) {
			this.isAbstract = true;
		}

		// Extract @implements interfaces
		const implementsTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "implements",
		);
		this.implementsInterfaces = implementsTags.map(
			(tag) => /** @type {any} */ (tag).name || /** @type {any} */ (tag).type,
		);
	}

	/**
	 * Validate class entity and its JSDoc documentation
	 */
	validate() {
		// Basic validation: must have a name
		if (!this.name || this.name.length === 0) {
			this.isValidated = false;
			return;
		}

		// Validate JSDoc consistency
		this.validateJSDocConsistency();

		this.isValidated = true;
	}

	/**
	 * Validate JSDoc tags are consistent with class characteristics
	 */
	validateJSDocConsistency() {
		/** @type {Array<{type: string, message: string, jsdocClass?: string, actualClass?: string}>} */
		this.validationIssues = [];

		// Check @extends consistency
		const extendsTag = this.getJSDocTag("extends");
		if (extendsTag && !this.extendsClass) {
			this.validationIssues.push({
				type: "missing_extends",
				message: "@extends tag present but class does not extend another class",
				jsdocClass:
					/** @type {any} */ (extendsTag).name ||
					/** @type {any} */ (extendsTag).type,
			});
		}

		if (this.extendsClass && !extendsTag) {
			this.validationIssues.push({
				type: "missing_extends_tag",
				message: `Class extends '${this.extendsClass}' but missing @extends tag`,
				actualClass: this.extendsClass,
			});
		}

		if (extendsTag && this.extendsClass) {
			const tagClass =
				/** @type {any} */ (extendsTag).name ||
				/** @type {any} */ (extendsTag).type;
			if (tagClass !== this.extendsClass) {
				this.validationIssues.push({
					type: "extends_mismatch",
					message: `@extends '${tagClass}' does not match actual extends '${this.extendsClass}'`,
					jsdocClass: tagClass,
					actualClass: this.extendsClass,
				});
			}
		}
	}

	/**
	 * Get class signature for display
	 * @returns {string} Human-readable class signature
	 */
	getSignature() {
		let signature = `class ${this.name}`;

		if (this.extendsClass) {
			signature += ` extends ${this.extendsClass}`;
		}

		return signature;
	}

	/**
	 * Get class summary information
	 * @returns {{hasConstructor: boolean, methodCount: number, propertyCount: number, isAbstract: boolean, hasInheritance: boolean, implementsCount: number}} Class summary
	 */
	getSummary() {
		return {
			hasConstructor: this.hasConstructor,
			methodCount: this.methods.length,
			propertyCount: this.properties.length,
			isAbstract: this.isAbstract,
			hasInheritance: Boolean(this.extendsClass),
			implementsCount: this.implementsInterfaces.length,
		};
	}

	/**
	 * Get serializable data for JSON export
	 * @returns {Object} Class-specific serializable data
	 */
	getSerializableData() {
		const baseData = super.getSerializableData();
		return {
			...baseData,
			extendsClass: this.extendsClass,
			hasConstructor: this.hasConstructor,
			constructorLine: this.constructorLine,
			methods: this.methods,
			properties: this.properties,
			isAbstract: this.isAbstract,
			implementsInterfaces: this.implementsInterfaces,
			signature: this.getSignature(),
			summary: this.getSummary(),
			validationIssues: this.validationIssues || [],
		};
	}

	/**
	 * Generate HTML representation
	 * @returns {string} HTML string for class documentation
	 */
	toHTML() {
		const implementsTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "implements",
		);
		const exampleTags = this.getAllJSDocTags().filter(
			(tag) => tag.tagType === "example",
		);

		return html`
			<div class="class-entity" data-abstract="${this.isAbstract}">
				<h3>${this.name}</h3>
				<div class="class-meta">
					<span class="class-type">class</span>
					${this.isAbstract ? html`<span class="abstract-indicator">abstract</span>` : ""}
					<span class="class-location">${this.location.file}:${this.location.line}</span>
				</div>
				<div class="class-signature">
					<code>${this.getSignature()}</code>
				</div>
				${
					this.extendsClass || implementsTags.length > 0
						? html`
					<div class="inheritance-info">
						${
							this.extendsClass
								? html`<div><strong>Extends:</strong> <code>${this.extendsClass}</code></div>`
								: ""
						}
						${
							implementsTags.length > 0
								? html`
							<div><strong>Implements:</strong>
								${implementsTags.map((tag) => html`<code>${/** @type {any} */ (tag).name || /** @type {any} */ (tag).type}</code>`).join(", ")}
							</div>`
								: ""
						}
					</div>
				`
						: ""
				}
				<div class="class-summary">
					<div class="summary-stats">
						${this.hasConstructor ? html`<span class="stat">Constructor</span>` : ""}
						${this.methods.length > 0 ? html`<span class="stat">${this.methods.length} Methods</span>` : ""}
						${this.properties.length > 0 ? html`<span class="stat">${this.properties.length} Properties</span>` : ""}
					</div>
				</div>
				${
					this.methods.length > 0
						? html`
					<div class="methods">
						<h4>Methods</h4>
						<ul class="method-list">
							${this.methods
								.map(
									(method) => html`
								<li class="method-item">
									<code class="method-signature">${method.signature}</code>
									<span class="method-meta">
										${method.isStatic ? html`<span class="static">static</span>` : ""}
										${method.isPrivate ? html`<span class="private">private</span>` : ""}
										<span class="method-type">${method.type}</span>
									</span>
								</li>
							`,
								)
								.join("\n")}
						</ul>
					</div>
				`
						: ""
				}
				${
					this.properties.length > 0
						? html`
					<div class="properties">
						<h4>Properties</h4>
						<ul class="property-list">
							${this.properties
								.map(
									(prop) => html`
								<li class="property-item">
									<code class="property-signature">${prop.signature}</code>
									<span class="property-meta">
										${prop.isStatic ? html`<span class="static">static</span>` : ""}
										${prop.isPrivate ? html`<span class="private">private</span>` : ""}
									</span>
								</li>
							`,
								)
								.join("\n")}
						</ul>
					</div>
				`
						: ""
				}
				${
					exampleTags.length > 0
						? html`
					<div class="examples">
						<h4>Examples</h4>
						${exampleTags.map((tag) => tag.toHTML()).join("\n")}
					</div>
				`
						: ""
				}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for class documentation
	 */
	toMarkdown() {
		let output = `### ${this.name}\n\n`;
		output += `**Type:** class`;
		if (this.isAbstract) output += " (abstract)";
		output += `\n`;
		output += `**Location:** ${this.location.file}:${this.location.line}\n\n`;
		output += `**Declaration:**\n\`\`\`javascript\n${this.getSignature()}\n\`\`\`\n\n`;

		if (this.extendsClass) {
			output += `**Extends:** \`${this.extendsClass}\`\n\n`;
		}

		if (this.implementsInterfaces.length > 0) {
			output += `**Implements:** ${this.implementsInterfaces.map((iface) => `\`${iface}\``).join(", ")}\n\n`;
		}

		const summary = this.getSummary();
		output += `**Summary:**\n`;
		output += `- Constructor: ${summary.hasConstructor ? "Yes" : "No"}\n`;
		output += `- Methods: ${summary.methodCount}\n`;
		output += `- Properties: ${summary.propertyCount}\n\n`;

		if (this.methods.length > 0) {
			output += `**Methods:**\n\n`;
			for (const method of this.methods) {
				output += `- \`${method.signature}\``;
				if (method.isStatic || method.isPrivate) {
					const modifiers = [];
					if (method.isStatic) modifiers.push("static");
					if (method.isPrivate) modifiers.push("private");
					output += ` *(${modifiers.join(", ")})*`;
				}
				output += `\n`;
			}
			output += `\n`;
		}

		if (this.properties.length > 0) {
			output += `**Properties:**\n\n`;
			for (const prop of this.properties) {
				output += `- \`${prop.signature}\``;
				if (prop.isStatic || prop.isPrivate) {
					const modifiers = [];
					if (prop.isStatic) modifiers.push("static");
					if (prop.isPrivate) modifiers.push("private");
					output += ` *(${modifiers.join(", ")})*`;
				}
				output += `\n`;
			}
			output += `\n`;
		}

		return output;
	}
}
