/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Universal image resizing orchestrator for all formats.
 *
 * Provides format-agnostic image resizing using various interpolation algorithms.
 * Operates on standardized RGBA pixel data for consistent results across PNG,
 * JPEG, WebP, GIF and other formats. Optimized for V8 performance.
 */

import { resizeBicubic } from "./bicubic.js";
import { resizeBilinear } from "./bilinear.js";
import { resizeLanczos } from "./lanczos.js";
import { resizeNearest } from "./nearest.js";
import { validateResizeParameters } from "./utils.js";

/**
 * Available resize algorithms with their characteristics.
 */
export const RESIZE_ALGORITHMS = {
  nearest: {
    name: "Nearest Neighbor",
    description: "Fastest, preserves hard edges, good for pixel art",
    quality: "low",
    performance: "fastest",
  },
  bilinear: {
    name: "Bilinear Interpolation",
    description: "Good balance of quality and speed, general purpose",
    quality: "medium",
    performance: "fast",
  },
  bicubic: {
    name: "Bicubic Interpolation",
    description: "Higher quality, better for photographic content",
    quality: "high",
    performance: "medium",
  },
  lanczos: {
    name: "Lanczos Resampling",
    description: "Highest quality, best for professional downscaling",
    quality: "highest",
    performance: "slow",
  },
};

/**
 * Resizes RGBA pixel data using specified algorithm.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} dstWidth - Target image width in pixels
 * @param {number} dstHeight - Target image height in pixels
 * @param {string} algorithm - Interpolation algorithm ('nearest'|'bilinear'|'bicubic'|'lanczos')
 * @returns {Uint8Array} Resized RGBA pixel data
 *
 * @example
 * // Resize 100x100 image to 200x150 using bilinear interpolation
 * const resized = resizePixels(pixels, 100, 100, 200, 150, 'bilinear');
 *
 * @example
 * // High-quality downscaling using Lanczos
 * const thumbnail = resizePixels(pixels, 1920, 1080, 320, 180, 'lanczos');
 */
export function resizePixels(pixels, srcWidth, srcHeight, dstWidth, dstHeight, algorithm = "bilinear") {
  // Validate all parameters
  validateResizeParameters(pixels, srcWidth, srcHeight, dstWidth, dstHeight, algorithm);

  // Early return for no-op resize
  if (srcWidth === dstWidth && srcHeight === dstHeight) {
    return new Uint8Array(pixels);
  }

  // Dispatch to appropriate algorithm
  switch (algorithm) {
    case "nearest":
      return resizeNearest(pixels, srcWidth, srcHeight, dstWidth, dstHeight);

    case "bilinear":
      return resizeBilinear(pixels, srcWidth, srcHeight, dstWidth, dstHeight);

    case "bicubic":
      return resizeBicubic(pixels, srcWidth, srcHeight, dstWidth, dstHeight);

    case "lanczos":
      return resizeLanczos(pixels, srcWidth, srcHeight, dstWidth, dstHeight);

    default:
      throw new Error(`Unknown resize algorithm: ${algorithm}. Use: ${Object.keys(RESIZE_ALGORITHMS).join(", ")}`);
  }
}

/**
 * Gets information about available resize algorithms.
 *
 * @returns {Object} Algorithm information keyed by algorithm name
 */
export function getResizeAlgorithms() {
  return { ...RESIZE_ALGORITHMS };
}

/**
 * Recommends optimal algorithm based on resize parameters.
 *
 * @param {number} srcWidth - Source width
 * @param {number} srcHeight - Source height
 * @param {number} dstWidth - Target width
 * @param {number} dstHeight - Target height
 * @param {string} priority - Optimization priority ('quality'|'speed'|'balanced')
 * @returns {string} Recommended algorithm name
 */
export function recommendAlgorithm(srcWidth, srcHeight, dstWidth, dstHeight, priority = "balanced") {
  const scaleX = dstWidth / srcWidth;
  const scaleY = dstHeight / srcHeight;
  const avgScale = (scaleX + scaleY) / 2;
  const isUpscaling = avgScale > 1;
  const isSignificantResize = Math.abs(avgScale - 1) > 0.1;

  if (!isSignificantResize) {
    return "nearest"; // Minimal resize, use fastest
  }

  switch (priority) {
    case "speed":
      return isUpscaling ? "bilinear" : "nearest";

    case "quality":
      return isUpscaling ? "bicubic" : "lanczos";

    default:
      if (isUpscaling) {
        return avgScale > 2 ? "bicubic" : "bilinear";
      } else {
        return avgScale < 0.5 ? "lanczos" : "bilinear";
      }
  }
}
