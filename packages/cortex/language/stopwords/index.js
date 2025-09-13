/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Stopwords exports for different languages.
 *
 * Clean re-exports of language-specific stopword sets for text preprocessing.
 * These simple, focused modules replace the complex monolithic language packs
 * and enable perfect treeshaking for specialized analysis functions.
 */

export { ENGLISH_STOPWORDS } from "./english.js";
export { GERMAN_STOPWORDS } from "./german.js";
export { MINIMAL_STOPWORDS } from "./minimal.js";
