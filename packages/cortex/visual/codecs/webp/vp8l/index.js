/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * VP8L Lossless Codec Exports
 *
 * Provides a clean public API for VP8L lossless decoding functionality.
 * Exports core primitives and the main decoder.
 *
 * @fileoverview Public API for VP8L lossless codec
 */

export { decodeVP8L, parseVP8LHeader } from "./decode.js";
export { buildHuffman, createBitReader, decodeSymbol, validateHuffmanTree } from "./huffman.js";
export {
  applyInversePrediction,
  applyPrediction,
  getPredictionModeName,
  predictPixel,
  validatePrediction,
} from "./predict.js";
export {
  applyColorTransform,
  applyInverseColorTransform,
  applyInverseSubtractGreen,
  applyInverseTransforms,
  applyPaletteTransform,
  applySubtractGreen,
  applyTransforms,
  createPalette,
  getTransformTypeName,
  TRANSFORM_TYPES,
  validateTransform,
} from "./transforms.js";
