/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Rule-of-three detector variants for different languages.
 *
 * Exports language-specific implementations of rule-of-three detection.
 * Each variant is optimized for its target language with hardcoded patterns
 * and language-appropriate detection logic. Use the specific language variant
 * for best results, or general as a neutral fallback.
 */

// Export language-specific variants for treeshaking
export { detectRuleOfThreeObsession as detectRuleOfThreeObsessionEnglish } from "./english.js";
// Default export is the general (language-agnostic) variant
export { detectRuleOfThreeObsession } from "./general.js";
export { detectRuleOfThreeObsession as detectRuleOfThreeObsessionGerman } from "./german.js";
