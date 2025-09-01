/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Word-level morphological transformations for text processing.
 *
 * Provides stemming and phonetic encoding algorithms for reducing words
 * to canonical forms. Essential for search engines, fuzzy matching systems,
 * and multilingual text processing applications.
 */

// German stemming algorithms
export { stemCistem } from "./stem-cistem.js";
// English stemming algorithms
export { stemPorter2 } from "./stem-porter2.js";
