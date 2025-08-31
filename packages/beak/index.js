/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Core template literal functions for HTML, CSS, Markdown, and JavaScript generation with automatic escaping and minification.
 *
 * Zero-dependency template engine providing tagged template literals for all major web content types.
 * Combines performance-optimized processing with intelligent value handling, security features, and
 * comprehensive SEO utilities. Main entry point for complete beak functionality.
 */

export { css, style } from "./css/index.js";
export { html, safeHtml } from "./html/index.js";
export { js, script, scriptAsync, scriptDefer } from "./js/index.js";
export * from "./md/index.js";
export * from "./seo/index.js";
export { sh } from "./sh/index.js";
export { sql } from "./sql/index.js";
export { cdata, xml } from "./xml/index.js";
