/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Language processing module providing comprehensive text analysis and processing.
 *
 * Complete text processing capabilities including AI content detection, Unicode
 * normalization, text segmentation, entity extraction, and linguistic analysis.
 * All functions use platform-native JavaScript APIs with intelligent fallbacks.
 */

// Re-export all analysis functions from the analysis submodule
export * from "./analysis/index.js";
// Re-export all extraction functions from the extraction submodule
export * from "./extraction/index.js";
export { isAIText } from "./is-ai-text.js";
// Re-export all normalization functions from the normalization submodule
export * from "./normalization/index.js";
// Re-export all segmentation functions from the segmentation submodule
export * from "./segmentation/index.js";
