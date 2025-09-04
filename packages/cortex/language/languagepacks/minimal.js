/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/** @type {import('./language-pack.js').LanguagePack} */
export const MINIMAL_LANGUAGE_PACK = {
	name: "minimal",
	defaultType: "business",
	priority: [
		"business",
		"technical",
		"academic",
		"creative",
		"casual",
		"social_media",
	],
	categories: /** @type {any} */ ({
		business: { tokens: new Set(["business"]) },
	}),
	entropy: {
		// Minimal entropy configuration (neutral defaults)
		aiThreshold: 3.5,
		normalizationFactor: 5.0,
		baselineRange: {
			human: { min: 3.5, max: 5.0 },
			ai: { min: 3.0, max: 4.0 },
		},
		compoundWordBonus: 0.0,
		technicalTermBonus: 0.0,
	},
	grammar: { errorPatterns: [], weight: 0.0 },
	ruleOfThree: {
		conjunctions: new Set(),
		separators: [],
		minItemLength: 3,
		whitelistTokens: new Set(),
		weight: 0.0,
	},
	transitions: {
		phrases: new Set(),
		regex: [],
		caseInsensitive: true,
		weight: 0.0,
	},
	participles: { sentenceInitial: {}, weight: 0.0 },
	stopwords: new Set(),
};
