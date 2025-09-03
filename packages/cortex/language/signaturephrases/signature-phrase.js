/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Signature phrase data type used by text-type detection.
 * Data-only shape, no logic. Packs in this folder export concrete instances.
 */

/**
 * Signature phrase profile used for text-type detection across languages.
 *
 * @typedef {Object} SignaturePhraseProfile
 * @property {string} name - Human-readable profile name (e.g., "english")
 * @property {string} [defaultType] - Fallback type if no matches occur
 * @property {string[]} [priority] - Tie-break priority order of categories
 * @property {{ errorPatterns?: RegExp[], weight?: number, falsePositiveTokens?: Set<string> }} [grammar] - Language-specific grammar config
 * @property {{ conjunctions?: Set<string>, separators?: RegExp[], minItemLength?: number, whitelistTokens?: Set<string>, weight?: number }} [ruleOfThree] - Language-specific triad config
 * @property {{ phrases?: Set<string>, regex?: RegExp[], weight?: number, caseInsensitive?: boolean }} [transitions] - Language-specific AI-transition phrases
 * @property {Record<string, SignaturePhraseCategory>} categories - Map of category name to rules
 */

/**
 * Category rules used by the classifier. All properties are optional.
 *
 * @typedef {Object} SignaturePhraseCategory
 * @property {Set<string>} [tokens] - Single-word tokens checked with word boundaries
 * @property {Set<string>} [phrases] - Multi-word phrases (case folded) matched via substring
 * @property {[Set<string>, Set<string>]} [cooccurrence] - Two token sets; both must occur
 * @property {(string|RegExp)[]} [emojis] - Emoji strings or regexes matched on raw text
 * @property {RegExp[]} [punctuation] - Punctuation patterns matched on raw text
 */

export {};
