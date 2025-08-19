/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTML template literals with performance optimization and XSS protection
 *
 * Tagged template functions for safe HTML generation. Provides fast rendering
 * with optional content escaping for untrusted input. Features whitespace
 * normalization, array flattening, and performance caching.
 */

import { escapeSpecialCharacters } from "./escape-special-characters.js";
import { _renderHtmlFast, _renderSafeHtmlFast } from "./template-renderer.js";

/**
 * Tagged template literal for trusted HTML content.
 *
 * **Performance:** Zero-copy for static templates, optimized fast paths for
 * single-value interpolation. String cache reduces repeated normalization overhead.
 *
 * **Behavior:**
 * - Arrays flatten without separators: `[1,2,3]` → `"123"`
 * - Falsy values excluded except `0`
 * - Whitespace normalized between tags
 * - **No XSS protection** - use `safeHtml` for untrusted input
 *
 * @param {TemplateStringsArray} strings - Static template parts
 * @param {...*} values - Dynamic values for interpolation
 * @returns {string} Rendered HTML string
 *
 * @example
 * const name = 'Alice';
 * html`<h1>Hello, ${name}!</h1>`
 * // "<h1>Hello, Alice!</h1>"
 *
 * @example
 * const items = ['a', 'b', 'c'];
 * html`<ul>${items.map(x => html`<li>${x}</li>`)}</ul>`
 * // "<ul><li>a</li><li>b</li><li>c</li></ul>"
 *
 * @example
 * const count = 0;
 * html`<div>Count: ${count}</div>`
 * // "<div>Count: 0</div>" (zero preserved)
 */
export const html = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {...*} */ ...values
) => _renderHtmlFast(strings, values);

/**
 * Tagged template literal with XSS protection for untrusted content.
 *
 * **Security:** Escapes `&`, `<`, `>`, `"`, `'` to prevent script injection,
 * tag injection, and attribute injection attacks.
 *
 * **Performance:** Same optimizations as `html` with additional escaping step.
 * Use `html` for trusted content to avoid escape overhead.
 *
 * **Critical for:** User input, form data, API responses, comments, any external content.
 *
 * @param {TemplateStringsArray} strings - Static template parts
 * @param {...*} values - Dynamic values for interpolation and escaping
 * @returns {string} Rendered HTML with escaped dynamic content
 *
 * @example
 * const userInput = '<script>alert("XSS")</script>';
 * safeHtml`<p>${userInput}</p>`
 * // "<p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p>"
 *
 * @example
 * const users = [{name: '<script>', email: 'user@test.com'}];
 * safeHtml`<table>${users.map(u => safeHtml`<tr><td>${u.name}</td></tr>`)}</table>`
 * // Escapes user.name, keeps structure safe
 */
export const safeHtml = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {...*} */ ...values
) => _renderSafeHtmlFast(strings, values);

/**
 * Escapes HTML special characters to prevent XSS attacks.
 *
 * Converts dangerous characters to safe HTML entities:
 * `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`
 *
 * **Alias for `escapeSpecialCharacters`** - use directly when not templating.
 *
 * @param {*} str - Value to escape (converted to string)
 * @returns {string} String with HTML entities replacing special characters
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
 */
export const escapeHtml = escapeSpecialCharacters;
