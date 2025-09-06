/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shared utilities for image resizing algorithms.
 *
 * Provides common functions used across all interpolation algorithms including
 * parameter validation, coordinate clamping, and optimized pixel access patterns.
 */

/**
 * Validates resize operation parameters.
 *
 * @param {Uint8Array} pixels - Source pixel data
 * @param {number} srcWidth - Source width
 * @param {number} srcHeight - Source height
 * @param {number} dstWidth - Target width
 * @param {number} dstHeight - Target height
 * @param {string} algorithm - Algorithm name
 */
export function validateResizeParameters(pixels, srcWidth, srcHeight, dstWidth, dstHeight, algorithm) {
  if (!(pixels instanceof Uint8Array)) {
    throw new TypeError("pixels must be a Uint8Array");
  }

  if (!Number.isInteger(srcWidth) || srcWidth <= 0) {
    throw new Error(`Invalid source width: ${srcWidth}. Must be positive integer`);
  }

  if (!Number.isInteger(srcHeight) || srcHeight <= 0) {
    throw new Error(`Invalid source height: ${srcHeight}. Must be positive integer`);
  }

  if (!Number.isInteger(dstWidth) || dstWidth <= 0) {
    throw new Error(`Invalid target width: ${dstWidth}. Must be positive integer`);
  }

  if (!Number.isInteger(dstHeight) || dstHeight <= 0) {
    throw new Error(`Invalid target height: ${dstHeight}. Must be positive integer`);
  }

  const expectedSize = srcWidth * srcHeight * 4; // RGBA = 4 bytes per pixel
  if (pixels.length !== expectedSize) {
    throw new Error(`Invalid pixel data size: expected ${expectedSize}, got ${pixels.length}`);
  }

  if (typeof algorithm !== "string") {
    throw new TypeError(`Algorithm must be string, got ${typeof algorithm}`);
  }

  // Check for reasonable size limits (prevent memory exhaustion)
  const maxDimension = 32768; // 32K pixels max per dimension
  if (dstWidth > maxDimension || dstHeight > maxDimension) {
    throw new Error(`Target dimensions too large: ${dstWidth}×${dstHeight}. Max: ${maxDimension}×${maxDimension}`);
  }
}

/**
 * Clamps value to specified range (inclusive).
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/**
 * Clamps integer coordinate to image bounds.
 *
 * @param {number} coord - Coordinate to clamp
 * @param {number} max - Maximum coordinate (exclusive)
 * @returns {number} Clamped coordinate
 */
export function clampCoord(coord, max) {
  return coord < 0 ? 0 : coord >= max ? max - 1 : coord;
}

/**
 * Gets RGBA pixel at specified coordinates with bounds checking.
 *
 * @param {Uint8Array} pixels - Pixel data
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array<number>} RGBA values [r, g, b, a]
 */
export function getPixel(pixels, x, y, width, height) {
  // Clamp coordinates to image bounds
  const clampedX = clampCoord(x, width);
  const clampedY = clampCoord(y, height);

  // Calculate pixel offset (4 bytes per pixel)
  const offset = (clampedY * width + clampedX) * 4;

  return [
    pixels[offset], // Red
    pixels[offset + 1], // Green
    pixels[offset + 2], // Blue
    pixels[offset + 3], // Alpha
  ];
}

/**
 * Sets RGBA pixel at specified coordinates.
 *
 * @param {Uint8Array} pixels - Pixel data
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Image width
 * @param {Array<number>} rgba - RGBA values [r, g, b, a]
 */
export function setPixel(pixels, x, y, width, rgba) {
  const offset = (y * width + x) * 4;
  pixels[offset] = rgba[0]; // Red
  pixels[offset + 1] = rgba[1]; // Green
  pixels[offset + 2] = rgba[2]; // Blue
  pixels[offset + 3] = rgba[3]; // Alpha
}

/**
 * Linear interpolation between two values.
 *
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + t * (b - a);
}

/**
 * Bilinear interpolation between four RGBA values.
 *
 * @param {Array<number>} tl - Top-left RGBA
 * @param {Array<number>} tr - Top-right RGBA
 * @param {Array<number>} bl - Bottom-left RGBA
 * @param {Array<number>} br - Bottom-right RGBA
 * @param {number} fx - X interpolation factor (0-1)
 * @param {number} fy - Y interpolation factor (0-1)
 * @returns {Array<number>} Interpolated RGBA
 */
export function bilinearInterpolate(tl, tr, bl, br, fx, fy) {
  const result = new Array(4);

  for (let i = 0; i < 4; i++) {
    // Interpolate top edge
    const top = lerp(tl[i], tr[i], fx);
    // Interpolate bottom edge
    const bottom = lerp(bl[i], br[i], fx);
    // Interpolate between top and bottom
    result[i] = Math.round(lerp(top, bottom, fy));
  }

  return result;
}

/**
 * Cubic interpolation kernel (Catmull-Rom spline).
 *
 * @param {number} t - Distance from center (-2 to 2)
 * @returns {number} Kernel weight
 */
export function cubicKernel(t) {
  const absT = Math.abs(t);

  if (absT <= 1) {
    return 1.5 * absT * absT * absT - 2.5 * absT * absT + 1;
  } else if (absT <= 2) {
    return -0.5 * absT * absT * absT + 2.5 * absT * absT - 4 * absT + 2;
  } else {
    return 0;
  }
}

/**
 * Lanczos kernel function.
 *
 * @param {number} x - Distance from center
 * @param {number} a - Lanczos parameter (typically 3)
 * @returns {number} Kernel weight
 */
export function lanczosKernel(x, a = 3) {
  if (x === 0) return 1;
  if (Math.abs(x) >= a) return 0;

  const piX = Math.PI * x;
  const piXOverA = piX / a;

  return (Math.sin(piX) / piX) * (Math.sin(piXOverA) / piXOverA);
}

/**
 * Normalizes kernel weights to sum to 1.
 *
 * @param {Array<number>} weights - Kernel weights
 * @returns {Array<number>} Normalized weights
 */
export function normalizeWeights(weights) {
  const sum = weights.reduce((acc, w) => acc + w, 0);
  return sum === 0 ? weights : weights.map((w) => w / sum);
}
