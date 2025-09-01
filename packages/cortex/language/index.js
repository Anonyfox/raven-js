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
 * normalization, text segmentation, morphological transformation, feature extraction,
 * entity extraction, keyword extraction (RAKE and TextRank), and linguistic analysis.
 * All functions use platform-native JavaScript APIs with intelligent fallbacks.
 */

// Re-export all analysis functions from the analysis submodule
export * from "./analysis/index.js";
// Re-export all extraction functions from the extraction submodule
export * from "./extraction/index.js";
// Re-export all featurization functions from the featurization submodule
export * from "./featurization/index.js";
export { isAIText } from "./is-ai-text.js";
// Re-export all normalization functions from the normalization submodule
export * from "./normalization/index.js";
// Re-export all segmentation functions from the segmentation submodule
export * from "./segmentation/index.js";
// Re-export all transformation functions from the transformation submodule
export * from "./transformation/index.js";
