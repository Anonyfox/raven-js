/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Bicubic interpolation for image resizing.
 *
 * Implements high-quality image resizing using cubic spline interpolation.
 * Samples a 4×4 neighborhood around each destination pixel for smoother results
 * than bilinear, especially for photographic content and upscaling.
 */

import { clamp, clampCoord, cubicKernel, getPixel } from "./utils.js";

/**
 * Resizes RGBA pixel data using bicubic interpolation.
 *
 * For each destination pixel, samples a 4×4 grid of source pixels and applies
 * cubic spline interpolation. This produces higher quality results than bilinear
 * with better preservation of edges and fine details.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height
 * @param {number} dstWidth - Target image width
 * @param {number} dstHeight - Target image height
 * @returns {Uint8Array} Resized RGBA pixel data
 *
 * @example
 * // High-quality photo upscaling
 * const upscaled = resizeBicubic(pixels, 1024, 768, 2048, 1536);
 *
 * @example
 * // Professional thumbnail generation
 * const thumbnail = resizeBicubic(pixels, 3840, 2160, 640, 360);
 */
export function resizeBicubic(pixels, srcWidth, srcHeight, dstWidth, dstHeight) {
  // Allocate output buffer
  const result = new Uint8Array(dstWidth * dstHeight * 4);

  // Calculate scaling factors
  const scaleX = srcWidth / dstWidth;
  const scaleY = srcHeight / dstHeight;

  // Process each destination pixel
  let dstOffset = 0;

  for (let dstY = 0; dstY < dstHeight; dstY++) {
    // Map destination Y to source coordinate
    const srcYFloat = (dstY + 0.5) * scaleY - 0.5;
    const srcY = Math.floor(srcYFloat);
    const fy = srcYFloat - srcY; // Fractional part for Y interpolation

    for (let dstX = 0; dstX < dstWidth; dstX++) {
      // Map destination X to source coordinate
      const srcXFloat = (dstX + 0.5) * scaleX - 0.5;
      const srcX = Math.floor(srcXFloat);
      const fx = srcXFloat - srcX; // Fractional part for X interpolation

      // Sample 4×4 neighborhood and apply bicubic interpolation
      const rgba = bicubicSample(pixels, srcWidth, srcHeight, srcX, srcY, fx, fy);

      // Store result with clamping to valid range
      result[dstOffset] = clamp(Math.round(rgba[0]), 0, 255); // Red
      result[dstOffset + 1] = clamp(Math.round(rgba[1]), 0, 255); // Green
      result[dstOffset + 2] = clamp(Math.round(rgba[2]), 0, 255); // Blue
      result[dstOffset + 3] = clamp(Math.round(rgba[3]), 0, 255); // Alpha

      dstOffset += 4;
    }
  }

  return result;
}

/**
 * Samples 4×4 pixel neighborhood using bicubic interpolation.
 *
 * @param {Uint8Array} pixels - Source pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} centerX - Center X coordinate (integer)
 * @param {number} centerY - Center Y coordinate (integer)
 * @param {number} fx - X fractional offset (0-1)
 * @param {number} fy - Y fractional offset (0-1)
 * @returns {Array<number>} Interpolated RGBA values
 */
function bicubicSample(pixels, width, height, centerX, centerY, fx, fy) {
  const result = [0, 0, 0, 0]; // RGBA accumulator

  // Sample 4×4 grid centered on (centerX, centerY)
  for (let dy = -1; dy <= 2; dy++) {
    const y = centerY + dy;
    const wy = cubicKernel(dy - fy); // Y weight

    for (let dx = -1; dx <= 2; dx++) {
      const x = centerX + dx;
      const wx = cubicKernel(dx - fx); // X weight
      const weight = wx * wy;

      // Get pixel with bounds checking
      const pixel = getPixel(pixels, x, y, width, height);

      // Accumulate weighted contribution
      result[0] += pixel[0] * weight; // Red
      result[1] += pixel[1] * weight; // Green
      result[2] += pixel[2] * weight; // Blue
      result[3] += pixel[3] * weight; // Alpha
    }
  }

  return result;
}

/**
 * Optimized bicubic resize using separable filtering.
 *
 * Performs resize in two passes for better cache performance and reduced
 * computational complexity from O(n²) to O(n) per pixel.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height
 * @param {number} dstWidth - Target image width
 * @param {number} dstHeight - Target image height
 * @returns {Uint8Array} Resized RGBA pixel data
 */
export function resizeBicubicSeparable(pixels, srcWidth, srcHeight, dstWidth, dstHeight) {
  // If only one dimension changes, use single-pass optimization
  if (srcWidth === dstWidth) {
    return resizeBicubicVertical(pixels, srcWidth, srcHeight, dstHeight);
  }
  if (srcHeight === dstHeight) {
    return resizeBicubicHorizontal(pixels, srcWidth, srcHeight, dstWidth);
  }

  // Two-pass resize: horizontal first, then vertical
  const intermediate = resizeBicubicHorizontal(pixels, srcWidth, srcHeight, dstWidth);
  return resizeBicubicVertical(intermediate, dstWidth, srcHeight, dstHeight);
}

/**
 * Horizontal-only bicubic resize.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height (unchanged)
 * @param {number} dstWidth - Target image width
 * @returns {Uint8Array} Horizontally resized RGBA pixel data
 */
function resizeBicubicHorizontal(pixels, srcWidth, srcHeight, dstWidth) {
  const result = new Uint8Array(dstWidth * srcHeight * 4);
  const scaleX = srcWidth / dstWidth;

  for (let y = 0; y < srcHeight; y++) {
    const srcRowOffset = y * srcWidth * 4;
    const dstRowOffset = y * dstWidth * 4;

    for (let dstX = 0; dstX < dstWidth; dstX++) {
      const srcXFloat = (dstX + 0.5) * scaleX - 0.5;
      const srcX = Math.floor(srcXFloat);
      const fx = srcXFloat - srcX;

      const rgba = [0, 0, 0, 0]; // RGBA accumulator

      // Sample 4 pixels horizontally
      for (let dx = -1; dx <= 2; dx++) {
        const x = clampCoord(srcX + dx, srcWidth);
        const weight = cubicKernel(dx - fx);
        const offset = srcRowOffset + x * 4;

        rgba[0] += pixels[offset] * weight; // Red
        rgba[1] += pixels[offset + 1] * weight; // Green
        rgba[2] += pixels[offset + 2] * weight; // Blue
        rgba[3] += pixels[offset + 3] * weight; // Alpha
      }

      const dstOffset = dstRowOffset + dstX * 4;
      result[dstOffset] = clamp(Math.round(rgba[0]), 0, 255);
      result[dstOffset + 1] = clamp(Math.round(rgba[1]), 0, 255);
      result[dstOffset + 2] = clamp(Math.round(rgba[2]), 0, 255);
      result[dstOffset + 3] = clamp(Math.round(rgba[3]), 0, 255);
    }
  }

  return result;
}

/**
 * Vertical-only bicubic resize.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width (unchanged)
 * @param {number} srcHeight - Source image height
 * @param {number} dstHeight - Target image height
 * @returns {Uint8Array} Vertically resized RGBA pixel data
 */
function resizeBicubicVertical(pixels, srcWidth, srcHeight, dstHeight) {
  const result = new Uint8Array(srcWidth * dstHeight * 4);
  const scaleY = srcHeight / dstHeight;

  for (let dstY = 0; dstY < dstHeight; dstY++) {
    const srcYFloat = (dstY + 0.5) * scaleY - 0.5;
    const srcY = Math.floor(srcYFloat);
    const fy = srcYFloat - srcY;

    const dstRowOffset = dstY * srcWidth * 4;

    for (let x = 0; x < srcWidth; x++) {
      const rgba = [0, 0, 0, 0]; // RGBA accumulator

      // Sample 4 pixels vertically
      for (let dy = -1; dy <= 2; dy++) {
        const y = clampCoord(srcY + dy, srcHeight);
        const weight = cubicKernel(dy - fy);
        const offset = y * srcWidth * 4 + x * 4;

        rgba[0] += pixels[offset] * weight; // Red
        rgba[1] += pixels[offset + 1] * weight; // Green
        rgba[2] += pixels[offset + 2] * weight; // Blue
        rgba[3] += pixels[offset + 3] * weight; // Alpha
      }

      const dstOffset = dstRowOffset + x * 4;
      result[dstOffset] = clamp(Math.round(rgba[0]), 0, 255);
      result[dstOffset + 1] = clamp(Math.round(rgba[1]), 0, 255);
      result[dstOffset + 2] = clamp(Math.round(rgba[2]), 0, 255);
      result[dstOffset + 3] = clamp(Math.round(rgba[3]), 0, 255);
    }
  }

  return result;
}
