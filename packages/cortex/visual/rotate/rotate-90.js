/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Fast 90° rotation implementations for RGBA pixel data.
 *
 * This module provides highly optimized implementations for 90° rotations
 * (0°, 90°, 180°, 270°) that use simple pixel rearrangement without
 * interpolation. These operations are lossless and extremely fast.
 *
 * @example
 * // Rotate 90° clockwise
 * const rotated = rotate90Clockwise(pixels, 800, 600);
 * console.log(`Rotated: ${rotated.width}×${rotated.height}`);
 *
 * // Rotate 180°
 * const flipped = rotate180(pixels, 800, 600);
 */

import { copyPixel, getPixelIndex } from "./utils.js";

/**
 * Rotates image 90° clockwise (width and height swap).
 * Optimized for V8 performance with efficient memory access patterns.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 */
export function rotate90Clockwise(pixels, width, height) {
  // Output dimensions are swapped
  const outputWidth = height;
  const outputHeight = width;
  const output = new Uint8Array(outputWidth * outputHeight * 4);

  // Rotate 90° clockwise: (x, y) → (height - 1 - y, x)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIndex = getPixelIndex(x, y, width);
      const dstX = height - 1 - y;
      const dstY = x;
      const dstIndex = getPixelIndex(dstX, dstY, outputWidth);

      copyPixel(pixels, output, srcIndex, dstIndex);
    }
  }

  return {
    pixels: output,
    width: outputWidth,
    height: outputHeight,
  };
}

/**
 * Rotates image 90° counter-clockwise (width and height swap).
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 */
export function rotate90CounterClockwise(pixels, width, height) {
  // Output dimensions are swapped
  const outputWidth = height;
  const outputHeight = width;
  const output = new Uint8Array(outputWidth * outputHeight * 4);

  // Rotate 90° counter-clockwise: (x, y) → (y, width - 1 - x)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIndex = getPixelIndex(x, y, width);
      const dstX = y;
      const dstY = width - 1 - x;
      const dstIndex = getPixelIndex(dstX, dstY, outputWidth);

      copyPixel(pixels, output, srcIndex, dstIndex);
    }
  }

  return {
    pixels: output,
    width: outputWidth,
    height: outputHeight,
  };
}

/**
 * Rotates image 180° (dimensions stay the same).
 * Equivalent to flipping both horizontally and vertically.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 */
export function rotate180(pixels, width, height) {
  const output = new Uint8Array(pixels.length);

  // Rotate 180°: (x, y) → (width - 1 - x, height - 1 - y)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIndex = getPixelIndex(x, y, width);
      const dstX = width - 1 - x;
      const dstY = height - 1 - y;
      const dstIndex = getPixelIndex(dstX, dstY, width);

      copyPixel(pixels, output, srcIndex, dstIndex);
    }
  }

  return {
    pixels: output,
    width,
    height,
  };
}

/**
 * Identity rotation (0°) - returns a copy of the original.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @returns {{pixels: Uint8Array, width: number, height: number}} Copied image data
 */
export function rotate0(pixels, width, height) {
  return {
    pixels: new Uint8Array(pixels),
    width,
    height,
  };
}

/**
 * Optimized 90° rotation dispatcher based on normalized angle.
 * Uses the most efficient algorithm for each quadrant.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} normalizedDegrees - Angle in degrees (must be 0, 90, 180, or 270)
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 * @throws {Error} If angle is not a valid 90° multiple
 */
export function rotateQuadrant(pixels, width, height, normalizedDegrees) {
  switch (normalizedDegrees) {
    case 0:
      return rotate0(pixels, width, height);
    case 90:
      return rotate90Clockwise(pixels, width, height);
    case 180:
      return rotate180(pixels, width, height);
    case 270:
      return rotate90CounterClockwise(pixels, width, height);
    default:
      throw new Error(`Invalid quadrant angle: ${normalizedDegrees}. Must be 0, 90, 180, or 270`);
  }
}

/**
 * Row-optimized 90° clockwise rotation for better cache performance.
 * Processes entire rows at once when possible.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 */
export function rotate90ClockwiseOptimized(pixels, width, height) {
  const outputWidth = height;
  const outputHeight = width;
  const output = new Uint8Array(outputWidth * outputHeight * 4);

  // Process by destination rows for better cache locality
  for (let dstY = 0; dstY < outputHeight; dstY++) {
    const srcX = dstY; // Source X coordinate

    for (let dstX = 0; dstX < outputWidth; dstX++) {
      const srcY = outputWidth - 1 - dstX; // Source Y coordinate

      const srcIndex = getPixelIndex(srcX, srcY, width);
      const dstIndex = getPixelIndex(dstX, dstY, outputWidth);

      copyPixel(pixels, output, srcIndex, dstIndex);
    }
  }

  return {
    pixels: output,
    width: outputWidth,
    height: outputHeight,
  };
}
