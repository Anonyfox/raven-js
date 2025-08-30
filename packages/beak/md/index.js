/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Markdown module - tagged templates and HTML conversion
 *
 * Dual functionality: intelligent markdown composition via tagged templates
 * and fast CommonMark-compliant HTML rendering. Clean separation of concerns.
 */

export { markdownToHTML } from "./markdown-to-html.js";
export { code, md, ref, table } from "./md.js";
