/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Em-dash epidemic detector variants for different languages.
 *
 * Exports language-specific implementations of punctuation overuse detection.
 * Each variant is optimized for its target language with hardcoded punctuation
 * baselines and language-appropriate detection logic. Use the specific language
 * variant for best results, or general as a neutral fallback.
 */

// Export language-specific variants for treeshaking
export { detectEmDashEpidemic as detectEmDashEpidemicEnglish } from "./english.js";
// Default export is the general (language-agnostic) variant
export { detectEmDashEpidemic } from "./general.js";
export { detectEmDashEpidemic as detectEmDashEpidemicGerman } from "./german.js";
