/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file German signature phrases for text-type detection.
 * Data-only; used by detectTextType.
 */

/** @type {import('./signature-phrase.js').SignaturePhraseProfile} */
export const GERMAN_SIGNATURE_PHRASES = {
	name: "german",
	defaultType: "business",
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
			tokens: new Set(["omg", "lol", "tbh", "imo", "kp", "kA", "ur", "u"]),
			emojis: [/😭|😊|😂|❤️|🔥/],
			punctuation: [/!{2,}/],
		},
		casual: {
			tokens: new Set(["halt", "irgendwie", "naja", "okay", "sachen", "ding"]),
			phrases: new Set(["ziemlich gut", "nicht schlecht"]),
		},
		academic: {
			tokens: new Set([
				"forschung",
				"studie",
				"hypothese",
				"ergebnisse",
				"schlussfolgerung",
				"longitudinal",
				"korrelation",
				"populationen",
				"untersuchung",
				"analyse",
				"methodik",
			]),
			cooccurrence: [
				new Set(["analyse", "methodik"]),
				new Set(["forschung", "studie", "ergebnisse"]),
			],
		},
		technical: {
			tokens: new Set([
				"api",
				"algorithmus",
				"datenbank",
				"funktion",
				"optimierung",
				"leistung",
				"technisch",
				"framework",
				"implementierung",
				"system",
			]),
			cooccurrence: [
				new Set(["implementierung", "system"]),
				new Set([
					"api",
					"algorithmus",
					"leistung",
					"optimierung",
					"technisch",
					"framework",
				]),
			],
		},
		business: {
			tokens: new Set([
				"stakeholder",
				"ziele",
				"liefergegenstände",
				"strategisch",
				"operativ",
				"umfassend",
				"lösungen",
				"organisatorisch",
				"fahrplan",
				"exzellenz",
				"geschäft",
			]),
			cooccurrence: [
				new Set(["implementierung"]),
				new Set([
					"strategisch",
					"ziele",
					"stakeholder",
					"geschäft",
					"organisatorisch",
				]),
			],
		},
		creative: {
			tokens: new Set([
				"plötzlich",
				"flüsterte",
				"blickte",
				"träumte",
				"stellte sich vor",
				"schön",
				"geheimnisvoll",
				"magisch",
			]),
			punctuation: [/["']/],
		},
	},
};
