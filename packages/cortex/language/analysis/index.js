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

export {
  analyzeAITransitionPhrases, // Default (general/language-agnostic)
  analyzeAITransitionPhrasesEnglish,
  analyzeAITransitionPhrasesGerman,
} from "./ai-transition-phrases/index.js";
export { calculateBurstiness } from "./burstiness.js";
export {
  detectEmDashEpidemic, // Default (general/language-agnostic)
  detectEmDashEpidemicEnglish,
  detectEmDashEpidemicGerman,
} from "./em-dash-detector/index.js";
export { analyzeNgramRepetition } from "./ngram-repetition.js";
export {
  detectParticipalPhraseFormula, // Default (general/language-agnostic)
  detectParticipalPhraseFormulaEnglish,
  detectParticipalPhraseFormulaGerman,
} from "./participial-phrase-detector/index.js";
export {
  detectPerfectGrammar, // Default (general/language-agnostic)
  detectPerfectGrammarEnglish,
  detectPerfectGrammarGerman,
} from "./perfect-grammar-detector/index.js";
export { approximatePerplexity } from "./perplexity-approximator.js";
export {
  detectRuleOfThreeObsession, // Default (general/language-agnostic)
  detectRuleOfThreeObsessionEnglish,
  detectRuleOfThreeObsessionGerman,
} from "./rule-of-three-detector/index.js";
export { calculateShannonEntropy } from "./shannon-entropy.js";
export {
  detectTextType, // Default (general/language-agnostic)
  detectTextTypeEnglish,
  detectTextTypeGerman,
} from "./text-type-detector/index.js";
export { analyzeZipfDeviation } from "./zipf-deviation.js";
