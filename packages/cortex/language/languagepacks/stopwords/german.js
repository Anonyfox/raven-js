/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file German stopwords for text analysis and processing.
 *
 * Common German words that are typically filtered out during text analysis
 * to focus on content-bearing words. Includes articles, prepositions, pronouns,
 * conjunctions, and auxiliary verbs. Used by specialized analysis functions
 * for preprocessing and noise reduction.
 */

export const GERMAN_STOPWORDS = new Set([
  // Definite articles (all cases)
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",

  // Indefinite articles (all cases)
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

  // Personal pronouns (all cases)
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

  // Possessive pronouns
  "mein",
  "dein",
  "sein",
  "unser",
  "euer",

  // Demonstrative pronouns
  "dieser",
  "diese",
  "dieses",
  "jener",
  "jene",
  "jenes",

  // Interrogative pronouns
  "welcher",
  "welche",
  "welches",

  // Auxiliary verbs and forms
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

  // Modal verbs
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

  // Subordinating conjunctions and adverbs
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

  // Additional conjunctions and adverbs
  "sowie",
  "sowohl",
  "weder",
  "noch",
  "bereits",
  "weiterhin",
  "jedoch",
  "dennoch",
  "trotzdem",
  "zudem",
  "außerdem",
  "ferner",
  "darüber",
  "hinaus",
  "folglich",
  "somit",
  "daher",
  "demnach",
  "insbesondere",
  "grundsätzlich",
  "zumindest",

  // Quantifiers and determiners
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
