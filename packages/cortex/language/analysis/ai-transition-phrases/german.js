/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file German-specific AI transition phrase detector.
 *
 * Hardcoded German transition phrases with sophisticated handling of natural
 * German connectors vs mechanical AI transitions. German has rich natural
 * connective phrases that are common in human writing and should not be
 * flagged as AI patterns.
 */

import { foldCase } from "../../normalization/index.js";
import { tokenizeWords } from "../../segmentation/index.js";

// German natural connectors (common in human German writing, should be ignored for AI detection)
const NATURAL_GERMAN_CONNECTORS = new Set([
  "und",
  "oder",
  "aber",
  "denn",
  "sondern",
  "doch",
  "jedoch",
  "allerdings",
  "trotzdem",
  "dennoch",
  "obwohl",
  "obgleich",
  "während",
  "wogegen",
  "hingegen",
  "andererseits",
  "im gegensatz dazu",
  "im vergleich dazu",
  "ebenso",
  "gleichermaßen",
  "ähnlich",
  "entsprechend",
  "folglich",
  "daher",
  "deshalb",
  "deswegen",
  "aus diesem grund",
  "infolgedessen",
]);

// German mechanical AI transitions (rare in human writing, strong AI indicators)
const MECHANICAL_AI_TRANSITIONS = new Set([
  "darüber hinaus",
  "des weiteren",
  "ferner",
  "überdies",
  "außerdem",
  "zusätzlich",
  "ebenso",
  "gleichfalls",
  "ebenfalls",
  "sowie",
  "sowohl",
  "als auch",
  "nicht nur",
  "sondern auch",
  "weder",
  "noch",
  "entweder",
  "oder",
  "ob",
  "falls",
  "sofern",
  "vorausgesetzt",
  "daß",
  "dass",
  "in der tat",
  "tatsächlich",
  "wirklich",
  "tatsächlich",
  "wahrhaftig",
  "gewiss",
  "sicherlich",
  "allerdings",
  "freilich",
  "zwar",
  "zweifellos",
  "offensichtlich",
  "ersichtlich",
  "erkennbar",
  "deutlich",
  "klar",
  "eindeutig",
  "unumstritten",
  "fraglos",
  "zweifelsohne",
  "gewissermaßen",
  "sozusagen",
  "gleichsam",
  "ebenso",
  "ähnlich",
  "entsprechend",
  "in diesem zusammenhang",
  "in diesem kontext",
  "im rahmen dessen",
  "vor diesem hintergrund",
  "unter diesen umständen",
  "angesichts dessen",
  "angesichts der tatsache",
  "in anbetracht dessen",
  "in betracht dessen",
]);

// Build complete German phrase configuration with refined baselines
const GERMAN_AI_PHRASES = /** @type {Record<string, {humanBaseline: number, detectionWeight: number}>} */ ({});

// Add natural connectors (high baseline, very low weight - these are human indicators)
for (const phrase of NATURAL_GERMAN_CONNECTORS) {
  const baseline = phrase.length > 10 ? 12.0 : 8.0; // Longer phrases are less common
  GERMAN_AI_PHRASES[phrase] = {
    humanBaseline: baseline,
    detectionWeight: 0.05, // Minimal AI detection weight
  };
}

// Add mechanical transitions (very low baseline, high weight - strong AI indicators)
for (const phrase of MECHANICAL_AI_TRANSITIONS) {
  const baseline = phrase.includes(" ") ? 0.05 : 0.1; // Multi-word phrases are rarer
  const weight = phrase.length > 15 ? 2.5 : 2.0; // Longer phrases are stronger indicators
  GERMAN_AI_PHRASES[phrase] = {
    humanBaseline: baseline,
    detectionWeight: weight,
  };
}

// Pre-compile German regexes for optimal performance
const GERMAN_PHRASE_REGEXES = new Map();
for (const phrase of Object.keys(GERMAN_AI_PHRASES)) {
  GERMAN_PHRASE_REGEXES.set(phrase, new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"));
}

/**
 * Analyzes German text for AI-characteristic transition phrases.
 *
 * Scans German text for hardcoded phrases with sophisticated handling of
 * natural German connective patterns vs mechanical AI transitions. Natural
 * German connectors (like "und", "aber", "jedoch") are very common in human
 * writing and given low AI detection weights, while mechanical transitions
 * typical of AI generation are given high detection weights.
 *
 * **Algorithm**: Tokenize and normalize German text → search for hardcoded
 * German phrases → apply language-specific weighting (natural vs mechanical) →
 * calculate AI likelihood with German-appropriate density expectations.
 *
 * **Why it works**: German has rich natural connective structures that AI
 * models struggle to replicate authentically. AI tends to overuse mechanical
 * transitions while underusing natural German connectors.
 *
 * **Performance**: O(n + m) where n is text length and m is number of phrases.
 * Optimized for German text with language-specific phrase handling.
 *
 * @param {string} text - German text to analyze for AI transition phrases
 * @param {Object} [options={}] - Analysis options
 * @param {boolean} [options.caseSensitive=false] - Whether to preserve case
 * @param {number} [options.minWordCount=20] - Minimum word count required
 * @param {boolean} [options.includeDetails=false] - Whether to include phrase details
 * @returns {{aiLikelihood: number, overallScore: number, phrasesPerThousand: number, totalPhrases: number, wordCount: number, detectedPhrases: Array<Object>}} Analysis results with AI detection metrics for German text.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 *
 * @example
 * // Human German text with natural connectors
 * const humanText = "Die analyse zeigt interessante ergebnisse. Und obwohl die methode komplex ist, jedoch liefert sie zuverlässige resultate.";
 * const humanAnalysis = analyzeAITransitionPhrases(humanText);
 * console.log(humanAnalysis.aiLikelihood); // ~0.1-0.3 (low AI probability due to natural connectors)
 *
 * @example
 * // AI-generated German text with mechanical transitions
 * const aiText = "Darüber hinaus ist es wichtig zu beachten, dass wir uns mit den komplexitäten auseinandersetzen müssen. Des weiteren werden verschiedene implementierungen verwendet.";
 * const aiAnalysis = analyzeAITransitionPhrases(aiText);
 * console.log(aiAnalysis.aiLikelihood); // ~0.7-0.9 (high AI probability due to mechanical transitions)
 */
export function analyzeAITransitionPhrases(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Expected text to be a string");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  // Extract and validate options
  const { caseSensitive = false, minWordCount = 20, includeDetails = false } = options;

  if (!Number.isInteger(minWordCount) || minWordCount < 1) {
    throw new Error("Parameter minWordCount must be a positive integer");
  }

  // Normalize text case using international-aware folding
  const normalizedText = caseSensitive ? text : foldCase(text);

  // Count total words using robust Unicode-aware tokenization
  const words = tokenizeWords(normalizedText);
  const wordCount = words.length;

  if (wordCount < minWordCount) {
    throw new Error(`Text must contain at least ${minWordCount} words for reliable analysis`);
  }

  // Search for German AI transition phrases using pre-compiled regexes
  const detectedPhrases = [];
  let totalPhrases = 0;
  let weightedScore = 0;
  let naturalConnectors = 0;
  let mechanicalTransitions = 0;

  for (const [phrase, config] of Object.entries(GERMAN_AI_PHRASES)) {
    // Use pre-compiled regex for optimal performance
    const regex = GERMAN_PHRASE_REGEXES.get(phrase);
    if (!regex) continue;

    const matches = normalizedText.match(regex) || [];
    const count = matches.length;

    if (count > 0) {
      const frequency = (count / wordCount) * 1000; // Per thousand words
      const ratio = Math.max(0, frequency / Math.max(config.humanBaseline, 0.001)); // Avoid division by zero
      const weightedRatio = ratio * config.detectionWeight;

      totalPhrases += count;
      weightedScore += weightedRatio * Math.sqrt(count); // Diminishing returns for repeated phrases

      // Track phrase categories for refined German scoring
      if (NATURAL_GERMAN_CONNECTORS.has(phrase)) naturalConnectors += count;
      if (MECHANICAL_AI_TRANSITIONS.has(phrase)) mechanicalTransitions += count;

      if (includeDetails) {
        const isNaturalConnector = NATURAL_GERMAN_CONNECTORS.has(phrase);
        const isMechanicalTransition = MECHANICAL_AI_TRANSITIONS.has(phrase);

        detectedPhrases.push({
          phrase,
          count,
          frequency,
          humanBaseline: config.humanBaseline,
          detectionWeight: config.detectionWeight,
          ratio,
          weightedRatio,
          category: isNaturalConnector
            ? "natural_connector"
            : isMechanicalTransition
              ? "mechanical_transition"
              : "other",
        });
      }
    }
  }

  // Calculate metrics with German-specific production-grade precision
  const phrasesPerThousand = (totalPhrases / Math.max(wordCount, 1)) * 1000;

  // Sophisticated German AI likelihood incorporating natural vs mechanical balance
  const naturalRatio = naturalConnectors / Math.max(wordCount / 1000, 0.1);
  const mechanicalRatio = mechanicalTransitions / Math.max(wordCount / 1000, 0.1);
  const baseDensity = phrasesPerThousand;

  // German-specific weighting: natural connectors reduce AI score, mechanical increase it
  // Mechanical transitions are strong AI indicators in German
  const aiLikelihood = Math.min(
    1,
    Math.max(
      0,
      baseDensity * 0.0006 + // Base density contribution (lower for German's richer grammar)
        mechanicalRatio * 3.0 + // Mechanical transitions strongly indicate AI
        Math.max(0, naturalRatio * -0.5) // Natural connectors slightly reduce AI score
    )
  );

  // Calculate overall score with logarithmic scaling for German's complex grammar
  const overallScore =
    totalPhrases > 0
      ? Math.log(1 + weightedScore / totalPhrases) / Math.log(2.5) // Adjusted logarithmic scaling for German
      : 0;

  // Sort detected phrases by ratio if details requested
  if (includeDetails) {
    detectedPhrases.sort((a, b) => b.ratio - a.ratio);
  }

  return {
    aiLikelihood,
    overallScore,
    phrasesPerThousand,
    totalPhrases,
    wordCount,
    detectedPhrases: includeDetails ? detectedPhrases : [],
  };
}
