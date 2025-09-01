/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Language analysis module providing advanced text analysis capabilities
 * for detecting AI-generated content and analyzing linguistic patterns.
 *
 * This module serves as the main entry point for all language analysis functions,
 * re-exporting everything from the analysis submodule for convenience.
 */

// Re-export all analysis functions from the analysis submodule
export * from "./analysis/index.js";
export { isAIText } from "./is-ai-text.js";
