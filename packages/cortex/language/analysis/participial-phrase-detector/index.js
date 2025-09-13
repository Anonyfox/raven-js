/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Participial phrase detector variants for different languages.
 *
 * Exports language-specific implementations of participial phrase detection.
 * Each variant is optimized for its target language with hardcoded patterns
 * and language-appropriate detection logic. Use the specific language variant
 * for best results, or general as a neutral fallback.
 */

// Export language-specific variants for treeshaking
export { detectParticipalPhraseFormula as detectParticipalPhraseFormulaEnglish } from "./english.js";
// Default export is the general (language-agnostic) variant
export { detectParticipalPhraseFormula } from "./general.js";
export { detectParticipalPhraseFormula as detectParticipalPhraseFormulaGerman } from "./german.js";
