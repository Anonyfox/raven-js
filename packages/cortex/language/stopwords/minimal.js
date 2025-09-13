/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Minimal stopwords for basic text processing.
 *
 * Very basic set of function words for minimal text preprocessing.
 * Contains only the most essential stopwords to reduce processing overhead
 * while still filtering out the most common function words.
 */

export const MINIMAL_STOPWORDS = new Set([
  // Basic articles
  "a",
  "an",
  "the",

  // Basic prepositions
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",

  // Basic pronouns
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",

  // Basic conjunctions
  "and",
  "or",
  "but",

  // Basic auxiliary verbs
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
]);
