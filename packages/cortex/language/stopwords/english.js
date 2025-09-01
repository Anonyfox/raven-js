/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file English stopwords for text processing algorithms.
 *
 * Common function words that typically don't contribute to semantic meaning
 * in keyword extraction, topic modeling, and information retrieval tasks.
 * Optimized for RAKE and similar algorithms.
 */

/**
 * English stopwords set for text processing.
 * Includes articles, prepositions, conjunctions, pronouns, and common verbs.
 *
 * @type {Set<string>}
 */
export const ENGLISH_STOPWORDS = new Set([
	// Articles
	"a",
	"an",
	"the",

	// Prepositions
	"about",
	"above",
	"across",
	"after",
	"against",
	"along",
	"among",
	"around",
	"at",
	"before",
	"behind",
	"below",
	"beneath",
	"beside",
	"between",
	"beyond",
	"by",
	"down",
	"during",
	"except",
	"for",
	"from",
	"in",
	"inside",
	"into",
	"like",
	"near",
	"of",
	"off",
	"on",
	"outside",
	"over",
	"since",
	"through",
	"throughout",
	"till",
	"to",
	"toward",
	"under",
	"until",
	"up",
	"upon",
	"with",
	"within",
	"without",

	// Conjunctions
	"and",
	"but",
	"or",
	"nor",
	"for",
	"yet",
	"so",

	// Pronouns
	"i",
	"me",
	"my",
	"myself",
	"we",
	"our",
	"ours",
	"ourselves",
	"you",
	"your",
	"yours",
	"yourself",
	"yourselves",
	"he",
	"him",
	"his",
	"himself",
	"she",
	"her",
	"hers",
	"herself",
	"it",
	"its",
	"itself",
	"they",
	"them",
	"their",
	"theirs",
	"themselves",
	"what",
	"which",
	"who",
	"whom",
	"this",
	"that",
	"these",
	"those",

	// Common verbs and auxiliaries
	"am",
	"is",
	"are",
	"was",
	"were",
	"be",
	"been",
	"being",
	"have",
	"has",
	"had",
	"having",
	"do",
	"does",
	"did",
	"will",
	"would",
	"should",
	"could",
	"can",
	"may",
	"might",
	"must",
	"shall",

	// Common adverbs and determiners
	"as",
	"if",
	"when",
	"where",
	"why",
	"how",
	"all",
	"any",
	"both",
	"each",
	"few",
	"more",
	"most",
	"other",
	"some",
	"such",
	"no",
	"not",
	"only",
	"own",
	"same",
	"than",
	"too",
	"very",
	"just",
]);
