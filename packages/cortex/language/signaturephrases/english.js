/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file English signature phrases for text-type detection.
 * Data-only; used by detectTextType.
 */

/** @type {import('./signature-phrase.js').SignaturePhraseProfile} */
export const ENGLISH_SIGNATURE_PHRASES = {
	name: "english",
	defaultType: "business",
	grammar: {
		weight: 0.09,
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
			tokens: new Set([
				"omg",
				"lol",
				"tbh",
				"imo",
				"cant",
				"dont",
				"wont",
				"ur",
				"u",
			]),
			emojis: [/😭|😊|😂|❤️|🔥/],
			punctuation: [/!{2,}/],
		},
		casual: {
			tokens: new Set([
				"kinda",
				"gonna",
				"wanna",
				"yeah",
				"okay",
				"stuff",
				"thing",
			]),
			phrases: new Set(["pretty good", "not bad"]),
		},
		academic: {
			tokens: new Set([
				"research",
				"study",
				"hypothesis",
				"findings",
				"conclusion",
				"longitudinal",
				"correlation",
				"populations",
				"investigation",
				"analysis",
				"methodology",
			]),
			cooccurrence: [
				new Set(["analysis", "methodology"]),
				new Set(["research", "study", "findings"]),
			],
		},
		technical: {
			tokens: new Set([
				"api",
				"algorithm",
				"database",
				"function",
				"optimization",
				"performance",
				"technical",
				"framework",
				"implementation",
				"system",
			]),
			cooccurrence: [
				new Set(["implementation", "system"]),
				new Set([
					"api",
					"algorithm",
					"performance",
					"optimization",
					"technical",
					"framework",
				]),
			],
		},
		business: {
			tokens: new Set([
				"stakeholders",
				"objectives",
				"deliverables",
				"strategic",
				"operational",
				"comprehensive",
				"solutions",
				"organizational",
				"roadmap",
				"excellence",
				"business",
			]),
			cooccurrence: [
				new Set(["implementation"]),
				new Set([
					"strategic",
					"objectives",
					"stakeholders",
					"business",
					"organizational",
				]),
			],
		},
		creative: {
			tokens: new Set([
				"suddenly",
				"whispered",
				"gazed",
				"dreamed",
				"imagined",
				"beautiful",
				"mysterious",
				"magical",
			]),
			punctuation: [/["']/],
		},
	},
};
