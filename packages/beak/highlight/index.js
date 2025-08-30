/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Syntax highlighting module for code blocks
 *
 * Zero-dependency syntax highlighting for HTML, CSS, JavaScript, SQL, Shell/Bash,
 * XML, and JSON. Uses Bootstrap semantic classes for consistent theming and supports
 * variable interpolation, complex operators, and context-sensitive parsing. Each language
 * highlighter is tree-shakable and exports a single function that transforms source
 * code into semantically highlighted HTML.
 */

export * from "./css.js";
export * from "./html.js";
export * from "./js.js";
export * from "./json.js";
export * from "./shell.js";
export * from "./sql.js";
export * from "./xml.js";
