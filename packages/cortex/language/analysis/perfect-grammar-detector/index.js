/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Perfect grammar detector variants for different languages.
 *
 * Exports language-specific implementations of perfect grammar detection.
 * Each variant is optimized for its target language with hardcoded grammar
 * error patterns and language-appropriate detection logic. Use the specific
 * language variant for best results, or general as a neutral fallback.
 */

// Export language-specific variants for treeshaking
export { detectPerfectGrammar as detectPerfectGrammarEnglish } from "./english.js";
// Default export is the general (language-agnostic) variant
export { detectPerfectGrammar } from "./general.js";
export { detectPerfectGrammar as detectPerfectGrammarGerman } from "./german.js";
