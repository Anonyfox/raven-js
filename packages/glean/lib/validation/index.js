/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Validation module - JSDoc validation and quality analysis API.
 *
 * Reconstructed public API that maintains identical behavior to the original
 * monolithic validation.js while leveraging the new modular architecture.
 * Surgical precision documentation archaeology for modern JavaScript.
 */

// Re-export entity extraction functions
export { extractCodeEntities } from "./entity-extraction.js";
// Re-export core analysis functions
export { analyzeFile, analyzeFiles } from "./file-analysis.js";

// Re-export JSDoc parsing functions
export { findPrecedingJSDoc, parseJSDocComment } from "./jsdoc-parsing.js";

// Re-export quality assessment functions
export {
	calculateQualityScore,
	validateEntity,
	validateJSDocContent,
} from "./quality-assessment.js";
