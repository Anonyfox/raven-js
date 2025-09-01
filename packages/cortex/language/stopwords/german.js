/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file German stopwords for text processing algorithms.
 *
 * Common function words that typically don't contribute to semantic meaning
 * in keyword extraction, topic modeling, and information retrieval tasks.
 * Includes German-specific grammar patterns and declensions.
 */

/**
 * German stopwords set for text processing.
 * Includes articles, prepositions, conjunctions, pronouns, and common verbs
 * with typical German declension patterns.
 *
 * @type {Set<string>}
 */
export const GERMAN_STOPWORDS = new Set([
	// Articles (definite and indefinite)
	"der",
	"die",
	"das",
	"den",
	"dem",
	"des",
	"ein",
	"eine",
	"einen",
	"einem",
	"eines",
	"einer",

	// Prepositions
	"an",
	"auf",
	"aus",
	"bei",
	"durch",
	"für",
	"gegen",
	"in",
	"mit",
	"nach",
	"über",
	"um",
	"unter",
	"von",
	"vor",
	"zu",
	"zwischen",

	// Conjunctions
	"und",
	"oder",
	"aber",
	"denn",
	"sondern",
	"sowie",

	// Pronouns (personal, possessive, demonstrative)
	"ich",
	"du",
	"er",
	"sie",
	"es",
	"wir",
	"ihr",
	"mich",
	"dich",
	"sich",
	"uns",
	"euch",
	"mir",
	"dir",
	"ihm",
	"ihr",
	"ihnen",
	"mein",
	"dein",
	"sein",
	"unser",
	"euer",
	"dieser",
	"diese",
	"dieses",
	"jener",
	"jene",
	"jenes",
	"welcher",
	"welche",
	"welches",

	// Common verbs (sein, haben, werden, modal verbs)
	"bin",
	"bist",
	"ist",
	"sind",
	"war",
	"warst",
	"waren",
	"wart",
	"sein",
	"haben",
	"hat",
	"hatte",
	"hatten",
	"werden",
	"wird",
	"wurde",
	"wurden",
	"können",
	"kann",
	"konnte",
	"konnten",
	"müssen",
	"muss",
	"musste",
	"mussten",
	"sollen",
	"soll",
	"sollte",
	"sollten",
	"wollen",
	"will",
	"wollte",
	"wollten",
	"dürfen",
	"darf",
	"durfte",
	"durften",
	"mögen",
	"mag",
	"mochte",
	"mochten",

	// Common adverbs, particles, and determiners
	"als",
	"auch",
	"da",
	"dann",
	"doch",
	"hier",
	"nicht",
	"noch",
	"nur",
	"schon",
	"so",
	"sehr",
	"viel",
	"wie",
	"wo",
	"wenn",
	"weil",
	"dass",
	"ob",
	"alle",
	"alles",
	"andere",
	"anderen",
	"anderer",
	"anderes",
	"beide",
	"beiden",
	"beides",
	"einige",
	"einigen",
	"einiger",
	"einiges",
	"keine",
	"keinen",
	"keiner",
	"keines",
	"viele",
	"vielen",
	"vieler",
	"vieles",
]);
