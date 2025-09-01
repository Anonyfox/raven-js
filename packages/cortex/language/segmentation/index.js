/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Text segmentation algorithms for boundary detection.
 *
 * Exports intelligent tokenization functions for words, sentences, and
 * code patterns. Uses modern Intl.Segmenter where available with
 * Unicode-aware regex fallbacks for comprehensive boundary detection.
 */

export { tokenizeCode } from "./tokenize-code.js";
export { tokenizeSentences } from "./tokenize-sentences.js";
export { tokenizeWords } from "./tokenize-words.js";
