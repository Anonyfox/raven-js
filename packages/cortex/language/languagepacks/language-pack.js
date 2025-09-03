/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unified language pack type combining signature phrases and stopwords.
 * Data-only shape, no logic. Packs in this folder export concrete instances.
 */

/**
 * @typedef {Object} LanguagePack
 * @property {string} name
 * @property {string} defaultType
 * @property {string[]} priority
 * @property {Record<string, LanguagePackCategory>} categories
 * @property {{
 *   errorPatterns?: RegExp[],
 *   falsePositiveTokens?: Set<string>,
 *   contractions?: Set<string>,
 *   apostrophes?: string[],
 *   homophonePatterns?: RegExp[],
 *   capitalization?: { mustCapitalize?: Set<string> },
 *   weight?: number
 * }} grammar
 * @property {{
 *   conjunctions?: Set<string>,
 *   separators?: RegExp[],
 *   minItemLength?: number,
 *   whitelistTokens?: Set<string>,
 *   weight?: number
 * }} ruleOfThree
 * @property {{
 *   phrases?: Set<string>,
 *   regex?: RegExp[],
 *   caseInsensitive?: boolean,
 *   weight?: number
 * }} transitions
 * @property {{
 *   sentenceInitial?: { presentActions?: Set<string>, presentStates?: Set<string>, past?: Set<string>, irregular?: Set<string> },
 *   technicalVerbs?: Set<string>,
 *   processVerbs?: Set<string>,
 *   systemVerbs?: Set<string>,
 *   academicVerbs?: Set<string>,
 *   businessVerbs?: Set<string>,
 *   marketingVerbs?: Set<string>,
 *   whenGerunds?: Set<string>,
 *   transitionsVerbs?: Set<string>,
 *   weight?: number
 * }} participles
 * @property {Set<string>} stopwords
 */

/**
 * @typedef {Object} LanguagePackCategory
 * @property {Set<string>} [tokens]
 * @property {Set<string>} [phrases]
 * @property {[Set<string>, Set<string>]} [cooccurrence]
 * @property {(string|RegExp)[]} [emojis]
 * @property {RegExp[]} [punctuation]
 */

export {};
