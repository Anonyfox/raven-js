/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Parsing module for structured, non-semantic transformations.
 *
 * Zero-dependency utilities for converting and extracting from structured
 * formats. Focused on syntax-level processing (HTML, XML, JSON, CSV), not
 * language semantics.
 */

export { loadEnv, parseEnv } from "./dotenv.js";
export { extractAssetsFromHtml } from "./extract-assets-from-html.js";
export { extractLinksFromHtml } from "./extract-links-from-html.js";
export { extractUrlsFromHtml } from "./extract-urls-from-html.js";
export { htmlToContent } from "./html-to-content.js";
export { htmlToText } from "./html-to-text.js";
export { isProbablyReadableHtml } from "./is-probably-readable-html.js";
