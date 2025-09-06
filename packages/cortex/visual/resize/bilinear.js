/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Bilinear interpolation for image resizing.
 *
 * Implements smooth image resizing using linear interpolation in both X and Y
 * directions. Provides good balance between quality and performance, making it
 * the most commonly used algorithm for general-purpose image resizing.
 */

import { clampCoord, getPixel, lerp } from "./utils.js";

/**
 * Resizes RGBA pixel data using bilinear interpolation.
 *
 * For each destination pixel, samples the four nearest source pixels and
 * linearly interpolates between them based on the exact fractional position.
 * This produces smooth results without the blockiness of nearest neighbor.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height
 * @param {number} dstWidth - Target image width
 * @param {number} dstHeight - Target image height
 * @returns {Uint8Array} Resized RGBA pixel data
 *
 * @example
 * // Smooth upscaling of photo
 * const upscaled = resizeBilinear(pixels, 800, 600, 1600, 1200);
 *
 * @example
 * // Create thumbnail with smooth edges
 * const thumbnail = resizeBilinear(pixels, 1920, 1080, 320, 180);
 */
export function resizeBilinear(pixels, srcWidth, srcHeight, dstWidth, dstHeight) {
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

      // Get the four surrounding pixels with bounds checking
      const tl = getPixel(pixels, srcX, srcY, srcWidth, srcHeight); // Top-left
      const tr = getPixel(pixels, srcX + 1, srcY, srcWidth, srcHeight); // Top-right
      const bl = getPixel(pixels, srcX, srcY + 1, srcWidth, srcHeight); // Bottom-left
      const br = getPixel(pixels, srcX + 1, srcY + 1, srcWidth, srcHeight); // Bottom-right

      // Perform bilinear interpolation for each channel
      for (let channel = 0; channel < 4; channel++) {
        // Interpolate top edge
        const top = lerp(tl[channel], tr[channel], fx);
        // Interpolate bottom edge
        const bottom = lerp(bl[channel], br[channel], fx);
        // Interpolate between top and bottom
        const value = lerp(top, bottom, fy);

        result[dstOffset + channel] = Math.round(value);
      }

      dstOffset += 4;
    }
  }

  return result;
}

/**
 * Optimized bilinear resize using separable filtering.
 *
 * Performs resize in two passes: first horizontal, then vertical. This can be
 * more cache-friendly for large images and allows for different algorithms
 * per axis if needed.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height
 * @param {number} dstWidth - Target image width
 * @param {number} dstHeight - Target image height
 * @returns {Uint8Array} Resized RGBA pixel data
 */
export function resizeBilinearSeparable(pixels, srcWidth, srcHeight, dstWidth, dstHeight) {
  // If only one dimension changes, use single-pass optimization
  if (srcWidth === dstWidth) {
    return resizeBilinearVertical(pixels, srcWidth, srcHeight, dstHeight);
  }
  if (srcHeight === dstHeight) {
    return resizeBilinearHorizontal(pixels, srcWidth, srcHeight, dstWidth);
  }

  // Two-pass resize: horizontal first, then vertical
  const intermediate = resizeBilinearHorizontal(pixels, srcWidth, srcHeight, dstWidth);
  return resizeBilinearVertical(intermediate, dstWidth, srcHeight, dstHeight);
}

/**
 * Horizontal-only bilinear resize.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width
 * @param {number} srcHeight - Source image height (unchanged)
 * @param {number} dstWidth - Target image width
 * @returns {Uint8Array} Horizontally resized RGBA pixel data
 */
function resizeBilinearHorizontal(pixels, srcWidth, srcHeight, dstWidth) {
  const result = new Uint8Array(dstWidth * srcHeight * 4);
  const scaleX = srcWidth / dstWidth;

  for (let y = 0; y < srcHeight; y++) {
    const srcRowOffset = y * srcWidth * 4;
    const dstRowOffset = y * dstWidth * 4;

    for (let dstX = 0; dstX < dstWidth; dstX++) {
      const srcXFloat = (dstX + 0.5) * scaleX - 0.5;
      const srcX = Math.floor(srcXFloat);
      const fx = srcXFloat - srcX;

      const x1 = clampCoord(srcX, srcWidth);
      const x2 = clampCoord(srcX + 1, srcWidth);

      const offset1 = srcRowOffset + x1 * 4;
      const offset2 = srcRowOffset + x2 * 4;
      const dstOffset = dstRowOffset + dstX * 4;

      // Interpolate each channel
      for (let channel = 0; channel < 4; channel++) {
        const value = lerp(pixels[offset1 + channel], pixels[offset2 + channel], fx);
        result[dstOffset + channel] = Math.round(value);
      }
    }
  }

  return result;
}

/**
 * Vertical-only bilinear resize.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} srcWidth - Source image width (unchanged)
 * @param {number} srcHeight - Source image height
 * @param {number} dstHeight - Target image height
 * @returns {Uint8Array} Vertically resized RGBA pixel data
 */
function resizeBilinearVertical(pixels, srcWidth, srcHeight, dstHeight) {
  const result = new Uint8Array(srcWidth * dstHeight * 4);
  const scaleY = srcHeight / dstHeight;

  for (let dstY = 0; dstY < dstHeight; dstY++) {
    const srcYFloat = (dstY + 0.5) * scaleY - 0.5;
    const srcY = Math.floor(srcYFloat);
    const fy = srcYFloat - srcY;

    const y1 = clampCoord(srcY, srcHeight);
    const y2 = clampCoord(srcY + 1, srcHeight);

    const srcRowOffset1 = y1 * srcWidth * 4;
    const srcRowOffset2 = y2 * srcWidth * 4;
    const dstRowOffset = dstY * srcWidth * 4;

    for (let x = 0; x < srcWidth; x++) {
      const offset1 = srcRowOffset1 + x * 4;
      const offset2 = srcRowOffset2 + x * 4;
      const dstOffset = dstRowOffset + x * 4;

      // Interpolate each channel
      for (let channel = 0; channel < 4; channel++) {
        const value = lerp(pixels[offset1 + channel], pixels[offset2 + channel], fy);
        result[dstOffset + channel] = Math.round(value);
      }
    }
  }

  return result;
}
