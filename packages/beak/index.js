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

// Perfect tree-shaking: Direct re-exports from implementation files (no intermediate objects)
export { css, style } from "./css/index.js";
export { author } from "./html/author.js";
export { canonical } from "./html/canonical.js";
export { discord } from "./html/discord.js";
export { html, safeHtml } from "./html/index.js";
export { linkedin } from "./html/linkedin.js";
export { openGraph } from "./html/open-graph.js";
export { pinterest } from "./html/pinterest.js";
export { robots } from "./html/robots.js";
export { twitter } from "./html/twitter.js";
export { youtube } from "./html/youtube.js";
export { js, script, scriptAsync, scriptDefer } from "./js/index.js";
export * from "./md/index.js";
export { sh } from "./sh/index.js";
export { sql } from "./sql/index.js";
export { cdata, xml } from "./xml/index.js";
export { sitemap } from "./xml/sitemap.js";
