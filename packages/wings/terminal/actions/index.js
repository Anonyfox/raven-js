/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Terminal UI action functions for interactive CLI applications.
 *
 * Exports input functions (ask, confirm), formatting functions (bold, italic, etc.),
 * output functions (success, error, etc.), and table display functionality.
 */

// Input functions (async)
export { ask, confirm } from "./ask.js";
// Formatting functions (sync)
export { bold, dim, italic, underline } from "./format.js";
// Output functions (sync)
export { error, info, print, success, warning } from "./output.js";

// Table display function (sync)
export { table } from "./table.js";
