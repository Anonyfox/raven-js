/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Minimal signature phrases for broad Latin-based languages.
 * Intended as a conservative default with low false-positive risk.
 */

/** @type {import('./signature-phrase.js').SignaturePhraseProfile} */
export const MINIMAL_SIGNATURE_PHRASES = {
	name: "minimal",
	defaultType: "business",
	grammar: {
		weight: 0.0,
		errorPatterns: [],
	},
	priority: [
		"social_media",
		"casual",
		"academic",
		"technical",
		"business",
		"creative",
	],
	categories: {
		social_media: {
			emojis: [/😭|😊|😂|❤️|🔥/],
			punctuation: [/!{2,}/],
		},
		casual: {
			// Generic colloquial tokens kept minimal to reduce FP across languages
			tokens: new Set(["okay"]),
		},
		academic: {
			// Generic Latin-root terms common across languages
			tokens: new Set(["method", "analysis", "conclusion"]),
		},
		technical: {
			tokens: new Set(["api", "system", "algorithm"]),
		},
		business: {
			tokens: new Set(["strategy", "objective", "stakeholder"]),
		},
		creative: {
			punctuation: [/["']/],
		},
	},
};
