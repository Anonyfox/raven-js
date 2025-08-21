/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc example tag model - surgical usage demonstration.
 *
 * Ravens demonstrate code territories with predatory precision.
 * Parses example code blocks with optional captions for clean
 * usage documentation and validation.
 */

import { html } from "@raven-js/beak";
import { JSDocTagBase } from "./jsdoc-tag-base.js";

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * JSDoc example tag implementation
 *
 * **Official JSDoc Tag:** Provides code examples demonstrating usage of documented items.
 * **Purpose:** Shows practical implementation to help users understand how to use the API.
 *
 * **Syntax:**
 * - Basic: `Code example content`
 * - With caption: `<caption>Example title</caption> Code content`
 * - Multi-line: Code blocks with preserved formatting and indentation
 *
 * **Caption Format:**
 * - Optional caption syntax: `<caption>Descriptive title</caption>`
 * - Caption appears before code in generated documentation
 * - Useful for organizing multiple examples with different scenarios
 *
 * **Content Handling:**
 * - Preserves exact formatting, indentation, and line breaks
 * - Supports any programming language syntax
 * - Maintains code comments and special characters
 * - No syntax highlighting or validation performed
 *
 * **Usage Status:** Very common and considered best practice. Including usage
 * examples greatly improves documentation quality and developer experience.
 *
 * **Primary Use Cases:**
 * - Function usage demonstrations
 * - API endpoint example calls
 * - Configuration object examples
 * - Error handling patterns
 * - Integration examples with other libraries
 * - Complex workflow demonstrations
 *
 * **Best Practices:**
 * - Provide working, executable code examples
 * - Show realistic usage scenarios, not just minimal cases
 * - Include multiple examples for different use cases
 * - Add captions to distinguish between example scenarios
 * - Demonstrate both common usage and edge cases
 * - Include error handling in examples where relevant
 * - Keep examples focused and concise while being complete
 */
export class JSDocExampleTag extends JSDocTagBase {
	/**
	 * Create example tag instance
	 * @param {string} rawContent - Raw example tag content
	 */
	constructor(rawContent) {
		super("example", rawContent);
	}

	/**
	 * Parse example tag content into structured data
	 *
	 * Extracts optional caption and code content.
	 * Handles caption syntax with surgical precision.
	 */
	parseContent() {
		const content = this.rawContent.trim();
		let caption = "";
		let code = content;

		// Check for caption syntax: <caption>Title</caption>
		const captionMatch = content.match(
			/^<caption>(.*?)<\/caption>\s*([\s\S]*)$/,
		);
		if (captionMatch) {
			caption = captionMatch[1].trim();
			code = captionMatch[2].trim();
		}

		this.caption = caption;
		this.code = code;
	}

	/**
	 * Validate example tag content
	 *
	 * Ravens demand demonstration: valid example tags must have
	 * some code content to show.
	 */
	validate() {
		this.isValidated = Boolean(this.code && this.code.length > 0);
	} /**
	 * Generate HTML representation
	 * @returns {string} HTML string for example documentation
	 */
	toHTML() {
		return html`
			<div class="example-info">
				${this.caption ? html`<div class="example-caption">${escapeHTML(this.caption)}</div>` : ""}
				<pre class="example-code"><code>${escapeHTML(this.code)}</code></pre>
			</div>
		`;
	}

	/**
	 * Generate Markdown representation
	 * @returns {string} Markdown string for example documentation
	 */
	toMarkdown() {
		const caption = this.caption ? `**${this.caption}**\n\n` : "";
		const code = `\`\`\`javascript\n${this.code}\n\`\`\``;

		return `${caption}${code}`;
	}
}
