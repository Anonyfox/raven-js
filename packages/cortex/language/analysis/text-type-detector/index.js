/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Text type detector variants for different languages.
 *
 * Exports language-specific implementations of text type classification.
 * Each variant is optimized for its target language with hardcoded category
 * definitions and language-appropriate classification logic. Use the specific
 * language variant for best results, or general as a neutral fallback.
 */

// Export language-specific variants for treeshaking
export { detectTextType as detectTextTypeEnglish } from "./english.js";
// Default export is the general (language-agnostic) variant
export { detectTextType } from "./general.js";
export { detectTextType as detectTextTypeGerman } from "./german.js";
