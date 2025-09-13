/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file AI transition phrase detector variants for different languages.
 *
 * Exports language-specific implementations of AI transition phrase detection.
 * Each variant is optimized for its target language with hardcoded phrases
 * and language-appropriate detection logic. Use the specific language variant
 * for best results, or general as a neutral fallback.
 */

// Export language-specific variants for treeshaking
export { analyzeAITransitionPhrases as analyzeAITransitionPhrasesEnglish } from "./english.js";
// Default export is the general (language-agnostic) variant
export { analyzeAITransitionPhrases } from "./general.js";
export { analyzeAITransitionPhrases as analyzeAITransitionPhrasesGerman } from "./german.js";
