/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Language analysis and text pattern detection algorithms.
 *
 * Exports statistical and linguistic analysis functions for content authenticity,
 * writing style analysis, and AI-generated text detection using platform-native
 * JavaScript implementations without external dependencies.
 */

export { analyzeAITransitionPhrases } from "./ai-transition-phrases.js";
export { calculateBurstiness } from "./burstiness.js";
export { detectEmDashEpidemic } from "./em-dash-detector.js";
export { analyzeWithEnsemble } from "./ensemble-scorer.js";
export { analyzeNgramRepetition } from "./ngram-repetition.js";
export { detectParticipalPhraseFormula } from "./participial-phrase-detector.js";
export { detectPerfectGrammar } from "./perfect-grammar-detector.js";
export { approximatePerplexity } from "./perplexity-approximator.js";
export { detectRuleOfThreeObsession } from "./rule-of-three-detector.js";
export { calculateShannonEntropy } from "./shannon-entropy.js";
export { analyzeZipfDeviation } from "./zipf-deviation.js";
