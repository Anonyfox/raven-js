/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Lanczos resampling for image resizing.
 *
 * Implements the highest quality resizing algorithm using Lanczos kernel
 * (windowed sinc function). Provides superior results for downscaling and
 * professional image processing, at the cost of increased computation.
 */

import { clamp, clampCoord, getPixel, lanczosKernel } from "./utils.js";

/**
 * Resizes RGBA pixel data using Lanczos resampling.
 *
 * Uses a windowed sinc function to sample source pixels, providing the highest
 * quality results especially for downscaling. The algorithm minimizes aliasing
 * and preserves fine details better than other methods.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height
 * @param {number} dstWidth - Target image width
 * @param {number} dstHeight - Target image height
 * @param {number} a - Lanczos parameter (kernel size, typically 3)
 * @returns {Uint8Array} Resized RGBA pixel data
 *
 * @example
 * // Professional photo downscaling
 * const thumbnail = resizeLanczos(pixels, 4096, 3072, 512, 384);
 *
 * @example
 * // High-quality print preparation
 * const print = resizeLanczos(pixels, 1920, 1080, 3840, 2160, 3);
 */
export function resizeLanczos(pixels, srcWidth, srcHeight, dstWidth, dstHeight, a = 3) {
  // Allocate output buffer
  const result = new Uint8Array(dstWidth * dstHeight * 4);

  // Calculate scaling factors
  const scaleX = srcWidth / dstWidth;
  const scaleY = srcHeight / dstHeight;

  // Determine kernel support (how many pixels to sample)
  const supportX = Math.max(a, scaleX * a);
  const supportY = Math.max(a, scaleY * a);

  // Process each destination pixel
  let dstOffset = 0;

  for (let dstY = 0; dstY < dstHeight; dstY++) {
    // Map destination Y to source coordinate
    const srcYFloat = (dstY + 0.5) * scaleY - 0.5;
    const centerY = Math.floor(srcYFloat);

    for (let dstX = 0; dstX < dstWidth; dstX++) {
      // Map destination X to source coordinate
      const srcXFloat = (dstX + 0.5) * scaleX - 0.5;
      const centerX = Math.floor(srcXFloat);

      // Sample neighborhood using Lanczos kernel
      const rgba = lanczosSample(
        pixels,
        srcWidth,
        srcHeight,
        srcXFloat,
        srcYFloat,
        centerX,
        centerY,
        supportX,
        supportY,
        scaleX,
        scaleY,
        a
      );

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
 * Samples pixel neighborhood using Lanczos kernel.
 *
 * @param {Uint8Array} pixels - Source pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} srcX - Source X coordinate (float)
 * @param {number} srcY - Source Y coordinate (float)
 * @param {number} centerX - Center X coordinate (integer)
 * @param {number} centerY - Center Y coordinate (integer)
 * @param {number} supportX - X kernel support radius
 * @param {number} supportY - Y kernel support radius
 * @param {number} scaleX - X scaling factor
 * @param {number} scaleY - Y scaling factor
 * @param {number} a - Lanczos parameter
 * @returns {Array<number>} Interpolated RGBA values
 */
function lanczosSample(pixels, width, height, srcX, srcY, centerX, centerY, supportX, supportY, scaleX, scaleY, a) {
  const rgba = [0, 0, 0, 0]; // RGBA accumulator
  let totalWeight = 0;

  // Calculate sampling bounds
  const minX = Math.floor(centerX - supportX);
  const maxX = Math.ceil(centerX + supportX);
  const minY = Math.floor(centerY - supportY);
  const maxY = Math.ceil(centerY + supportY);

  // Sample pixels in kernel support region
  for (let y = minY; y <= maxY; y++) {
    const dy = y - srcY;
    const wyNorm = scaleY > 1 ? dy / scaleY : dy; // Normalize for downscaling
    const wy = lanczosKernel(wyNorm, a);

    if (Math.abs(wy) < 1e-8) continue; // Skip negligible weights

    for (let x = minX; x <= maxX; x++) {
      const dx = x - srcX;
      const wxNorm = scaleX > 1 ? dx / scaleX : dx; // Normalize for downscaling
      const wx = lanczosKernel(wxNorm, a);

      if (Math.abs(wx) < 1e-8) continue; // Skip negligible weights

      const weight = wx * wy;
      totalWeight += weight;

      // Get pixel with bounds checking
      const pixel = getPixel(pixels, x, y, width, height);

      // Accumulate weighted contribution
      rgba[0] += pixel[0] * weight; // Red
      rgba[1] += pixel[1] * weight; // Green
      rgba[2] += pixel[2] * weight; // Blue
      rgba[3] += pixel[3] * weight; // Alpha
    }
  }

  // Normalize by total weight to prevent brightness changes
  if (totalWeight > 0) {
    rgba[0] /= totalWeight;
    rgba[1] /= totalWeight;
    rgba[2] /= totalWeight;
    rgba[3] /= totalWeight;
  }

  return rgba;
}

/**
 * Optimized Lanczos resize using separable filtering.
 *
 * Performs resize in two passes for better performance and cache efficiency.
 * Reduces computational complexity while maintaining quality.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height
 * @param {number} dstWidth - Target image width
 * @param {number} dstHeight - Target image height
 * @param {number} a - Lanczos parameter
 * @returns {Uint8Array} Resized RGBA pixel data
 */
export function resizeLanczosSeparable(pixels, srcWidth, srcHeight, dstWidth, dstHeight, a = 3) {
  // If only one dimension changes, use single-pass optimization
  if (srcWidth === dstWidth) {
    return resizeLanczosVertical(pixels, srcWidth, srcHeight, dstHeight, a);
  }
  if (srcHeight === dstHeight) {
    return resizeLanczosHorizontal(pixels, srcWidth, srcHeight, dstWidth, a);
  }

  // Two-pass resize: horizontal first, then vertical
  const intermediate = resizeLanczosHorizontal(pixels, srcWidth, srcHeight, dstWidth, a);
  return resizeLanczosVertical(intermediate, dstWidth, srcHeight, dstHeight, a);
}

/**
 * Horizontal-only Lanczos resize.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height (unchanged)
 * @param {number} dstWidth - Target image width
 * @param {number} a - Lanczos parameter
 * @returns {Uint8Array} Horizontally resized RGBA pixel data
 */
function resizeLanczosHorizontal(pixels, srcWidth, srcHeight, dstWidth, a) {
  const result = new Uint8Array(dstWidth * srcHeight * 4);
  const scaleX = srcWidth / dstWidth;
  const support = Math.max(a, scaleX * a);

  for (let y = 0; y < srcHeight; y++) {
    const srcRowOffset = y * srcWidth * 4;
    const dstRowOffset = y * dstWidth * 4;

    for (let dstX = 0; dstX < dstWidth; dstX++) {
      const srcXFloat = (dstX + 0.5) * scaleX - 0.5;
      const centerX = Math.floor(srcXFloat);

      const rgba = [0, 0, 0, 0];
      let totalWeight = 0;

      const minX = Math.floor(centerX - support);
      const maxX = Math.ceil(centerX + support);

      for (let x = minX; x <= maxX; x++) {
        const dx = x - srcXFloat;
        const dxNorm = scaleX > 1 ? dx / scaleX : dx;
        const weight = lanczosKernel(dxNorm, a);

        if (Math.abs(weight) < 1e-8) continue;

        const clampedX = clampCoord(x, srcWidth);
        const offset = srcRowOffset + clampedX * 4;

        totalWeight += weight;
        rgba[0] += pixels[offset] * weight;
        rgba[1] += pixels[offset + 1] * weight;
        rgba[2] += pixels[offset + 2] * weight;
        rgba[3] += pixels[offset + 3] * weight;
      }

      const dstOffset = dstRowOffset + dstX * 4;
      if (totalWeight > 0) {
        result[dstOffset] = clamp(Math.round(rgba[0] / totalWeight), 0, 255);
        result[dstOffset + 1] = clamp(Math.round(rgba[1] / totalWeight), 0, 255);
        result[dstOffset + 2] = clamp(Math.round(rgba[2] / totalWeight), 0, 255);
        result[dstOffset + 3] = clamp(Math.round(rgba[3] / totalWeight), 0, 255);
      }
    }
  }

  return result;
}

/**
 * Vertical-only Lanczos resize.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width (unchanged)
 * @param {number} srcHeight - Source image height
 * @param {number} dstHeight - Target image height
 * @param {number} a - Lanczos parameter
 * @returns {Uint8Array} Vertically resized RGBA pixel data
 */
function resizeLanczosVertical(pixels, srcWidth, srcHeight, dstHeight, a) {
  const result = new Uint8Array(srcWidth * dstHeight * 4);
  const scaleY = srcHeight / dstHeight;
  const support = Math.max(a, scaleY * a);

  for (let dstY = 0; dstY < dstHeight; dstY++) {
    const srcYFloat = (dstY + 0.5) * scaleY - 0.5;
    const centerY = Math.floor(srcYFloat);

    const dstRowOffset = dstY * srcWidth * 4;

    for (let x = 0; x < srcWidth; x++) {
      const rgba = [0, 0, 0, 0];
      let totalWeight = 0;

      const minY = Math.floor(centerY - support);
      const maxY = Math.ceil(centerY + support);

      for (let y = minY; y <= maxY; y++) {
        const dy = y - srcYFloat;
        const dyNorm = scaleY > 1 ? dy / scaleY : dy;
        const weight = lanczosKernel(dyNorm, a);

        if (Math.abs(weight) < 1e-8) continue;

        const clampedY = clampCoord(y, srcHeight);
        const offset = clampedY * srcWidth * 4 + x * 4;

        totalWeight += weight;
        rgba[0] += pixels[offset] * weight;
        rgba[1] += pixels[offset + 1] * weight;
        rgba[2] += pixels[offset + 2] * weight;
        rgba[3] += pixels[offset + 3] * weight;
      }

      const dstOffset = dstRowOffset + x * 4;
      if (totalWeight > 0) {
        result[dstOffset] = clamp(Math.round(rgba[0] / totalWeight), 0, 255);
        result[dstOffset + 1] = clamp(Math.round(rgba[1] / totalWeight), 0, 255);
        result[dstOffset + 2] = clamp(Math.round(rgba[2] / totalWeight), 0, 255);
        result[dstOffset + 3] = clamp(Math.round(rgba[3] / totalWeight), 0, 255);
      }
    }
  }

  return result;
}
