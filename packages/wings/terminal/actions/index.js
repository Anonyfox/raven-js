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
 * **Function Categories**: Organized by purpose for clean import patterns.
 * All functions are pure (side effects limited to terminal I/O only).
 *
 * **Input Functions**: User interaction and data gathering.
 * **Format Functions**: Text styling with ANSI escape codes.
 * **Output Functions**: Colored messages with semantic symbols.
 * **Table Function**: Structured data display with Unicode box drawing.
 *
 * **Performance**: Synchronous formatting/output, async input gathering.
 * No external dependencies, platform-native ANSI codes.
 */

// Input functions (async)
export { ask, confirm } from "./ask.js";
// Formatting functions (sync)
export { bold, dim, italic, underline } from "./format.js";
// Output functions (sync)
export { error, info, print, success, warning } from "./output.js";

// Table display function (sync)
export { table } from "./table.js";
