/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Zero-dependency template literal engine for modern JavaScript
 *
 * Tagged template literals for HTML, CSS, JavaScript, SQL, and Markdown generation.
 * Near string-concatenation performance with intelligent value processing,
 * array flattening, and whitespace optimization.
 *
 * **VSCode Integration:** Syntax highlighting and autocompletion via RavenJS plugin.
 * **Performance:** Optimized execution paths based on interpolation count.
 * **Security:** Optional XSS protection for untrusted content.
 *
 * @example
 * // Conditional rendering with ternary operators
 * const greeting = html`<div>
 *   ${isLoggedIn ? html`<p>Welcome back!</p>` : html`<p>Please log in.</p>`}
 * </div>`;
 *
 * @example
 * // Array mapping for list generation
 * const colors = ['red', 'green', 'blue'];
 * const list = html`<ul>${colors.map(color => html`<li>${color}</li>`)}</ul>`;
 *
 * @example
 * // Component pattern with function factories
 * const Button = ({ text }) => html`<button>${text}</button>`;
 * const button = Button({ text: 'Click me' }); // "<button>Click me</button>"
 */

export { css, style } from "./css/index.js";
export { html, safeHtml } from "./html/index.js";
export { js, script, scriptAsync, scriptDefer } from "./js/index.js";
export * from "./md/index.js";
export * from "./seo/index.js";
export { sql } from "./sql/index.js";
