/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Text normalization algorithms for character-level transformations.
 *
 * Exports platform-native text processing functions for Unicode normalization,
 * case folding, and width conversion. Each function performs atomic character
 * transformations using modern JavaScript APIs.
 */

export { foldCase } from "./fold-case.js";
export { foldWidth } from "./fold-width.js";
export { normalizeUnicode } from "./normalize-unicode.js";
