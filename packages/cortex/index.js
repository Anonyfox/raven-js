/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Machine learning, data structures, temporal computation, language analysis, and image processing using platform-native algorithms.
 *
 * Neural networks, matrix operations, schema validation, holiday calculations, text analysis,
 * and image manipulation using pure JavaScript primitives and Node.js built-ins. Exports learning
 * algorithms, structural primitives, temporal functions, language processing tools, and visual
 * processing capabilities for cognitive and media tasks.
 *
 * @example
 * // Neural networks and machine learning
 * import { NeuralNetwork, LinearRegression } from "@raven-js/cortex";
 *
 * const nn = new NeuralNetwork([2, 4, 1]);
 * const regression = new LinearRegression();
 *
 * @example
 * // Matrix operations and data structures
 * import { Matrix, Schema } from "@raven-js/cortex";
 *
 * const matrix = Matrix.random(3, 3);
 * const result = matrix.multiply(Matrix.identity(3));
 *
 * @example
 * // Temporal computation
 * import { calculateEasterSunday, calculateHolidaysOfYear } from "@raven-js/cortex";
 *
 * const easter2024 = calculateEasterSunday(2024);
 * const holidays = calculateHolidaysOfYear({ year: 2024, country: 'US' });
 *
 * @example
 * // Language analysis and text pattern detection
 * import { calculateBurstiness } from "@raven-js/cortex";
 *
 * const text = "This varies. This is a longer sentence. Short.";
 * const burstiness = calculateBurstiness(text);
 * console.log(burstiness > 0.5 ? 'human-like' : 'ai-like');
 *
 * @example
 * // Image processing and format conversion
 * import { createImage } from "@raven-js/cortex";
 *
 * const image = createImage(buffer, 'image/png');
 * const resized = image.resize(800, 600).crop(0, 0, 400, 300);
 * const webpBuffer = resized.toBuffer('image/webp');
 */

/**
 * Basic greeting function demonstrating Cortex package functionality.
 *
 * @param {string} name - Name to include in greeting
 * @returns {string} Greeting message with Cortex branding
 *
 * @example
 * // Basic usage
 * const greeting = hello("Developer");
 * console.log(greeting); // "Hello, Developer! The raven's mind awakens."
 */
export function hello(name) {
  if (typeof name !== "string") {
    throw new TypeError("Expected name to be a string");
  }

  return `Hello, ${name}! The raven's mind awakens.`;
}

// Export language analysis functions
export {
  analyzeAITransitionPhrases,
  analyzeNgramRepetition,
  analyzeWithEnsemble,
  analyzeZipfDeviation,
  approximatePerplexity,
  calculateBurstiness,
  calculateShannonEntropy,
  detectEmDashEpidemic,
  detectParticipalPhraseFormula,
  detectPerfectGrammar,
  detectRuleOfThreeObsession,
  isAIText,
} from "./language/index.js";
// Export learning algorithms
export {
  LinearRegression,
  Model,
  NeuralNetwork,
  Tfidf,
} from "./learning/index.js";
// Export primitive functions
export { fnv1a32, fnv1a64, fnv32 } from "./primitives/index.js";
// Export structural primitives
export { Matrix, Schema } from "./structures/index.js";
// Export temporal functions and classes
export {
  calculateEasterSunday,
  calculateHolidaysOfYear,
  Holiday,
  NaiveDateTime,
} from "./temporal/index.js";
// Export visual processing functions and classes
export {
  // New codec functions
  decodePNG,
  encodePNG,
  // Base Image class
  Image,
} from "./visual/index.js";
