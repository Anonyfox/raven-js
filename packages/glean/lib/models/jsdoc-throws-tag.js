/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc throws tag model - surgical exception documentation.
 *
 * Ravens track error territories with predatory precision.
 * Parses exception types and conditions with clean validation
 * for robust error handling documentation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * JSDoc throws tag implementation
 *
 * **Official JSDoc Tag:** Documents exceptions or errors a function might throw.
 * **Alias:** exception tag (both `throws` and `exception` are valid)
 *
 * **Syntax:**
 * - Full: `{ErrorType} Description of when this error occurs`
 * - Type only: `{ErrorType}`
 * - Description only: `Description of error condition`
 *
 * **Common Error Types:**
 * - Built-in errors: Error, TypeError, ReferenceError, SyntaxError
 * - Range errors: RangeError (for out-of-bounds operations)
 * - Custom errors: ValidationError, NetworkError, AuthenticationError
 * - Async errors: Promise<Error> (for promise rejections)
 * - Union error types: (TypeError|ValidationError)
 *
 * **Usage Status:** Fairly common in robust APIs where error handling is critical.
 * Essential for functions that can fail and helps users handle errors properly.
 *
 * **Primary Use Cases:**
 * - Input validation failure documentation
 * - Network operation error conditions
 * - File system operation failures
 * - Authentication and authorization errors
 * - Resource availability issues
 * - Configuration or setup errors
 *
 * **Best Practices:**
 * - List error type and circumstances that trigger it
 * - Document multiple error conditions with separate throws tags
 * - Include error handling guidance in function description
 * - Specify async promise rejection conditions
 * - Use specific error types rather than generic Error when possible
 * - Mention error recovery strategies where applicable
 */
export class JSDocThrowsTag extends JSDocTagBase {
	/**
	 * Create throws tag instance
	 * @param {string} rawContent - Raw throws tag content
	 */
	constructor(rawContent) {
		super("throws", rawContent);
	}

	/**
	 * Parse throws tag content into structured data
	 *
	 * Extracts error type and description from throws syntax.
	 * Handles complex error types with surgical precision.
	 */
	parseContent() {
		// Handle nested braces in types like {TypeError}
		const content = this.rawContent.trim();
		let errorType = "";
		let description = content;

		// Extract error type if present
		if (content.startsWith("{")) {
			let braceCount = 0;
			let typeEnd = -1;

			for (let i = 0; i < content.length; i++) {
				if (content[i] === "{") {
					braceCount++;
				} else if (content[i] === "}") {
					braceCount--;
					if (braceCount === 0) {
						typeEnd = i;
						break;
					}
				}
			}

			if (typeEnd !== -1) {
				errorType = content.slice(1, typeEnd).trim();
				description = content.slice(typeEnd + 1).trim();
			}
		}

		this.errorType = errorType;
		this.description = description;
	}

	/**
	 * Validate throws tag content
	 *
	 * Ravens accept minimal exception documentation: either error type
	 * or description must be present for valid throws tag.
	 */
	validate() {
		this.isValidated = Boolean(
			(this.errorType && this.errorType.length > 0) ||
				(this.description && this.description.length > 0),
		);
	}/**
	 * Generate HTML representation
	 * @returns {string} HTML string for throws documentation
	 */
	toHTML() {
		return html`
			<div class="throws-info">
				${this.errorType ? html`<span class="error-type">{${this.errorType}}</span>` : ""}
				${this.errorType && this.description ? html` - ` : ""}
				${this.description || ""}
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for throws documentation
	 */
	toMarkdown() {
		const errorType = this.errorType ? `{${this.errorType}}` : "";
		const description = this.description || "";
		const separator = this.errorType && this.description ? " - " : "";

		return `**Throws:** ${errorType}${separator}${description}`;
	}
}
