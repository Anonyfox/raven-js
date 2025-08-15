/**
 * Template literal function for parsing markdown into HTML.
 *
 * A lightweight, deterministic markdown parser that converts markdown text to HTML.
 * Perfect for server-side rendering, static site generation, or any scenario where
 * you need reliable markdown parsing without external dependencies.
 *
 * @param {TemplateStringsArray} strings - Template string literals
 * @param {...any} values - Values to interpolate into the template
 * @returns {string} HTML string
 *
 * @example
 * // Basic usage
 * const html = md`
 *   # Welcome to RavenJS
 *
 *   This is a **bold** paragraph with *italic* text and \`inline code\`.
 *
 *   - List item 1
 *   - List item 2
 *
 *   > This is a blockquote
 *
 *   \`\`\`javascript
 *   console.log("Hello, World!");
 *   \`\`\`
 * `;
 *
 * @example
 * // With dynamic content
 * const title = "Dynamic Title";
 * const items = ["Apple", "Banana", "Cherry"];
 *
 * const html = md`
 *   # ${title}
 *
 *   Here are some fruits:
 *   ${items.map(item => `- ${item}`).join('\n')}
 *
 *   Visit our [website](https://example.com) for more info.
 * `;
 *
 * @example
 * // Complex nested content
 * const html = md`
 *   # API Documentation
 *
 *   ## Authentication
 *
 *   Use the following endpoint for authentication:
 *
 *   \`\`\`bash
 *   curl -X POST https://api.example.com/auth \\
 *     -H "Content-Type: application/json" \\
 *     -d '{"username": "user", "password": "pass"}'
 *   \`\`\`
 *
 *   ### Response Format
 *
 *   The API returns JSON responses:
 *
 *   - **200**: Success
 *   - **401**: Unauthorized
 *   - **500**: Server Error
 *
 *   > **Note**: All requests must include a valid API key in the header.
 * `;
 *
 * ## Supported Markdown Features
 *
 * ### Block Elements
 * - **Headings**: `# H1` through `###### H6`
 * - **Paragraphs**: Plain text blocks
 * - **Lists**:
 *   - Unordered: `- item` or `* item`
 *   - Ordered: `1. item`, `2. item`, etc.
 * - **Blockquotes**: `> quoted text`
 * - **Code blocks**:
 *   - Fenced: \`\`\`language\ncode\n\`\`\`
 *   - Inline: \`code\`
 * - **Horizontal rules**: `---`, `***`, `___`
 *
 * ### Inline Elements
 * - **Bold**: `**text**` or `__text__`
 * - **Italic**: `*text*` or `_text_`
 * - **Links**: `[text](url)`
 * - **Images**: `![alt](url)`
 * - **Inline code**: \`code\`
 *
 * ### Advanced Features
 * - **Nested elements**: Bold within italic, links within bold, etc.
 * - **Mixed content**: Inline elements within block elements
 * - **Deterministic parsing**: Consistent output for identical input
 * - **Safety checks**: Prevents infinite loops and handles edge cases
 * - **HTML escaping**: Automatic escaping of special characters
 *
 * ## GFM Features Not Yet Supported
 *
 * The following GitHub Flavored Markdown (GFM) features are not currently implemented:
 *
 * ### Tables
 * ```markdown
 * | Header 1 | Header 2 |
 * |----------|----------|
 * | Cell 1   | Cell 2   |
 * ```
 *
 * ### Task Lists
 * ```markdown
 * - [x] Completed task
 * - [ ] Pending task
 * ```
 *
 * ### Strikethrough
 * ```markdown
 * ~~strikethrough text~~
 * ```
 *
 * ### Extended Code Blocks
 * - Syntax highlighting (language detection only)
 * - Line numbers
 * - Diff highlighting
 *
 * ### Extended Links
 * - Reference-style links: `[text][ref]`
 * - Link definitions: `[ref]: url "title"`
 *
 * ### Extended Images
 * - Reference-style images: `![alt][ref]`
 * - Image definitions: `[ref]: url "title"`
 *
 * ### Extended Lists
 * - Nested lists (indentation-based)
 * - Mixed list types
 * - List continuation
 *
 * ### Extended Blockquotes
 * - Nested blockquotes
 * - Blockquotes with other block elements
 *
 * ### Extended Headings
 * - Setext-style headings: `===` and `---`
 *
 * ### Extended Code
 * - Indented code blocks
 * - Code blocks with language-specific features
 *
 * ### Extended Emphasis
 * - Multiple emphasis levels
 * - Emphasis with underscores in words
 *
 * ### Extended Links and Images
 * - Relative URLs
 * - Fragment identifiers
 * - Email links
 *
 * ### Extended HTML
 * - Raw HTML blocks
 * - HTML comments
 * - HTML entities
 *
 * ### Extended Escaping
 * - Escaped characters in code blocks
 * - Escaped characters in links
 *
 * ## Performance Characteristics
 *
 * - **Deterministic**: Same input always produces same output
 * - **Bounded**: Parsing time is O(n) where n is input length
 * - **Memory efficient**: Minimal memory allocation during parsing
 * - **No external dependencies**: Pure JavaScript implementation
 *
 * ## Error Handling
 *
 * The parser is designed to be forgiving and will:
 * - Gracefully handle malformed markdown
 * - Fall back to plain text for unrecognized patterns
 * - Never throw exceptions for invalid input
 * - Always produce valid HTML output
 */
import { markdownToHTML } from "./html-transformer/index.js";

/**
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {string}
 */
export const md = (strings, ...values) => {
	const markdown = strings.reduce(
		/** @param {string} acc @param {string} str @param {number} i @returns {string} */
		(acc, str, i) => acc + str + (i < values.length ? values[i] : ""),
		"",
	);
	return markdownToHTML(markdown);
};
