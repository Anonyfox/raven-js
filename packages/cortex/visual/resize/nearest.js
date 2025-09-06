/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Nearest neighbor interpolation for image resizing.
 *
 * Implements the fastest resizing algorithm by selecting the closest source pixel
 * for each destination pixel. Preserves hard edges and is ideal for pixel art,
 * but produces blocky results for photographic content.
 */

import { clampCoord } from "./utils.js";

/**
 * Resizes RGBA pixel data using nearest neighbor interpolation.
 *
 * Maps each destination pixel to the nearest source pixel without any filtering.
 * This preserves sharp edges and produces no new colors, making it perfect for
 * pixel art, icons, and cases where exact color preservation is critical.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height
 * @param {number} dstWidth - Target image width
 * @param {number} dstHeight - Target image height
 * @returns {Uint8Array} Resized RGBA pixel data
 *
 * @example
 * // Upscale 16x16 pixel art to 64x64 (4x zoom)
 * const upscaled = resizeNearest(pixels, 16, 16, 64, 64);
 *
 * @example
 * // Downscale screenshot preserving UI elements
 * const thumbnail = resizeNearest(pixels, 1920, 1080, 320, 180);
 */
export function resizeNearest(pixels, srcWidth, srcHeight, dstWidth, dstHeight) {
  // Allocate output buffer
  const result = new Uint8Array(dstWidth * dstHeight * 4);

  // Calculate scaling factors
  const scaleX = srcWidth / dstWidth;
  const scaleY = srcHeight / dstHeight;

  // Process each destination pixel
  let dstOffset = 0;

  for (let dstY = 0; dstY < dstHeight; dstY++) {
    // Find nearest source Y coordinate
    const srcY = clampCoord(Math.floor(dstY * scaleY), srcHeight);
    const srcRowOffset = srcY * srcWidth * 4;

    for (let dstX = 0; dstX < dstWidth; dstX++) {
      // Find nearest source X coordinate
      const srcX = clampCoord(Math.floor(dstX * scaleX), srcWidth);
      const srcOffset = srcRowOffset + srcX * 4;

      // Copy RGBA values directly (no interpolation)
      result[dstOffset] = pixels[srcOffset]; // Red
      result[dstOffset + 1] = pixels[srcOffset + 1]; // Green
      result[dstOffset + 2] = pixels[srcOffset + 2]; // Blue
      result[dstOffset + 3] = pixels[srcOffset + 3]; // Alpha

      dstOffset += 4;
    }
  }

  return result;
}

/**
 * Optimized nearest neighbor resize for integer scale factors.
 *
 * When scaling by exact integer multiples (2x, 3x, 4x, etc.), this function
 * provides better performance by avoiding floating-point calculations.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height
 * @param {number} scale - Integer scale factor
 * @returns {Uint8Array} Resized RGBA pixel data
 */
export function resizeNearestInteger(pixels, srcWidth, srcHeight, scale) {
  if (!Number.isInteger(scale) || scale <= 0) {
    throw new Error(`Scale must be positive integer, got ${scale}`);
  }

  const dstWidth = srcWidth * scale;
  const dstHeight = srcHeight * scale;
  const result = new Uint8Array(dstWidth * dstHeight * 4);

  // For each source pixel, replicate it scale×scale times
  for (let srcY = 0; srcY < srcHeight; srcY++) {
    for (let srcX = 0; srcX < srcWidth; srcX++) {
      const srcOffset = (srcY * srcWidth + srcX) * 4;

      // Get source RGBA values
      const r = pixels[srcOffset];
      const g = pixels[srcOffset + 1];
      const b = pixels[srcOffset + 2];
      const a = pixels[srcOffset + 3];

      // Replicate to scale×scale destination block
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const dstX = srcX * scale + dx;
          const dstY = srcY * scale + dy;
          const dstOffset = (dstY * dstWidth + dstX) * 4;

          result[dstOffset] = r;
          result[dstOffset + 1] = g;
          result[dstOffset + 2] = b;
          result[dstOffset + 3] = a;
        }
      }
    }
  }

  return result;
}

/**
 * Checks if resize operation can use integer optimization.
 *
 * @param {number} srcWidth - Source width
 * @param {number} srcHeight - Source height
 * @param {number} dstWidth - Target width
 * @param {number} dstHeight - Target height
 * @returns {number|null} Integer scale factor or null if not applicable
 */
export function getIntegerScale(srcWidth, srcHeight, dstWidth, dstHeight) {
  const scaleX = dstWidth / srcWidth;
  const scaleY = dstHeight / srcHeight;

  // Check if both scales are the same integer
  if (scaleX === scaleY && Number.isInteger(scaleX) && scaleX > 0) {
    return scaleX;
  }

  return null;
}
