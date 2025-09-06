/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Arbitrary angle rotation implementations for RGBA pixel data.
 *
 * This module provides rotation for arbitrary angles using various interpolation
 * algorithms. Reuses interpolation functions from the resize module for
 * consistency and performance.
 *
 * @example
 * // Rotate 45° with bilinear interpolation
 * const rotated = rotateArbitrary(pixels, 800, 600, 45, "bilinear");
 * console.log(`Rotated: ${rotated.width}×${rotated.height}`);
 *
 * // Rotate with custom fill color
 * const rotated = rotateArbitrary(pixels, 800, 600, 30, "bicubic", [255, 255, 255, 255]);
 */

import { clamp, cubicKernel, lanczosKernel, lerp } from "../resize/utils.js";
import { calculateRotatedDimensions, clampColor, degreesToRadians, getPixelSafe, setPixel } from "./utils.js";

/**
 * Rotates image by arbitrary angle using nearest neighbor interpolation.
 * Fastest but lowest quality - good for pixel art or when speed is critical.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} degrees - Rotation angle in degrees
 * @param {[number, number, number, number]} [fillColor=[0, 0, 0, 0]] - RGBA fill color for empty areas
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 */
export function rotateNearest(pixels, width, height, degrees, fillColor = [0, 0, 0, 0]) {
  const { width: outputWidth, height: outputHeight } = calculateRotatedDimensions(width, height, degrees);
  const output = new Uint8Array(outputWidth * outputHeight * 4);

  // Fill with background color
  for (let i = 0; i < output.length; i += 4) {
    output[i] = fillColor[0]; // Red
    output[i + 1] = fillColor[1]; // Green
    output[i + 2] = fillColor[2]; // Blue
    output[i + 3] = fillColor[3]; // Alpha
  }

  const radians = degreesToRadians(degrees);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  // Rotation center points
  const centerX = width / 2;
  const centerY = height / 2;
  const outputCenterX = outputWidth / 2;
  const outputCenterY = outputHeight / 2;

  // Process each output pixel
  for (let dstY = 0; dstY < outputHeight; dstY++) {
    for (let dstX = 0; dstX < outputWidth; dstX++) {
      // Translate to center-based coordinates
      const dx = dstX - outputCenterX;
      const dy = dstY - outputCenterY;

      // Apply inverse rotation to find source coordinates
      const srcX = cos * dx + sin * dy + centerX;
      const srcY = -sin * dx + cos * dy + centerY;

      // Use nearest neighbor sampling
      const nearestX = Math.round(srcX);
      const nearestY = Math.round(srcY);

      // Get source pixel (with bounds checking)
      const [r, g, b, a] = getPixelSafe(pixels, nearestX, nearestY, width, height);

      // Set output pixel
      setPixel(output, dstX, dstY, outputWidth, r, g, b, a);
    }
  }

  return {
    pixels: output,
    width: outputWidth,
    height: outputHeight,
  };
}

/**
 * Rotates image by arbitrary angle using bilinear interpolation.
 * Good balance of quality and performance for most use cases.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} degrees - Rotation angle in degrees
 * @param {[number, number, number, number]} [fillColor=[0, 0, 0, 0]] - RGBA fill color for empty areas
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 */
export function rotateBilinear(pixels, width, height, degrees, fillColor = [0, 0, 0, 0]) {
  const { width: outputWidth, height: outputHeight } = calculateRotatedDimensions(width, height, degrees);
  const output = new Uint8Array(outputWidth * outputHeight * 4);

  // Fill with background color
  for (let i = 0; i < output.length; i += 4) {
    output[i] = fillColor[0];
    output[i + 1] = fillColor[1];
    output[i + 2] = fillColor[2];
    output[i + 3] = fillColor[3];
  }

  const radians = degreesToRadians(degrees);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const centerX = width / 2;
  const centerY = height / 2;
  const outputCenterX = outputWidth / 2;
  const outputCenterY = outputHeight / 2;

  for (let dstY = 0; dstY < outputHeight; dstY++) {
    for (let dstX = 0; dstX < outputWidth; dstX++) {
      const dx = dstX - outputCenterX;
      const dy = dstY - outputCenterY;

      const srcX = cos * dx + sin * dy + centerX;
      const srcY = -sin * dx + cos * dy + centerY;

      // Check if source coordinates are within bounds
      if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
        // Use bilinear interpolation
        const [r, g, b, a] = bilinearInterpolatePixels(pixels, srcX, srcY, width, height);
        setPixel(output, dstX, dstY, outputWidth, clampColor(r), clampColor(g), clampColor(b), clampColor(a));
      }
      // Else: keep fill color (already set)
    }
  }

  return {
    pixels: output,
    width: outputWidth,
    height: outputHeight,
  };
}

/**
 * Rotates image by arbitrary angle using bicubic interpolation.
 * Higher quality than bilinear, good for smooth gradients.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} degrees - Rotation angle in degrees
 * @param {[number, number, number, number]} [fillColor=[0, 0, 0, 0]] - RGBA fill color for empty areas
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 */
export function rotateBicubic(pixels, width, height, degrees, fillColor = [0, 0, 0, 0]) {
  const { width: outputWidth, height: outputHeight } = calculateRotatedDimensions(width, height, degrees);
  const output = new Uint8Array(outputWidth * outputHeight * 4);

  // Fill with background color
  for (let i = 0; i < output.length; i += 4) {
    output[i] = fillColor[0];
    output[i + 1] = fillColor[1];
    output[i + 2] = fillColor[2];
    output[i + 3] = fillColor[3];
  }

  const radians = degreesToRadians(degrees);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const centerX = width / 2;
  const centerY = height / 2;
  const outputCenterX = outputWidth / 2;
  const outputCenterY = outputHeight / 2;

  for (let dstY = 0; dstY < outputHeight; dstY++) {
    for (let dstX = 0; dstX < outputWidth; dstX++) {
      const dx = dstX - outputCenterX;
      const dy = dstY - outputCenterY;

      const srcX = cos * dx + sin * dy + centerX;
      const srcY = -sin * dx + cos * dy + centerY;

      // Check if we have enough surrounding pixels for bicubic
      if (srcX >= 1 && srcX < width - 2 && srcY >= 1 && srcY < height - 2) {
        const [r, g, b, a] = bicubicInterpolate(pixels, srcX, srcY, width, height);
        setPixel(output, dstX, dstY, outputWidth, clampColor(r), clampColor(g), clampColor(b), clampColor(a));
      }
      // Else: keep fill color
    }
  }

  return {
    pixels: output,
    width: outputWidth,
    height: outputHeight,
  };
}

/**
 * Rotates image by arbitrary angle using Lanczos resampling.
 * Highest quality, best for detailed images and text.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} degrees - Rotation angle in degrees
 * @param {[number, number, number, number]} [fillColor=[0, 0, 0, 0]] - RGBA fill color for empty areas
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 */
export function rotateLanczos(pixels, width, height, degrees, fillColor = [0, 0, 0, 0]) {
  const { width: outputWidth, height: outputHeight } = calculateRotatedDimensions(width, height, degrees);
  const output = new Uint8Array(outputWidth * outputHeight * 4);

  // Fill with background color
  for (let i = 0; i < output.length; i += 4) {
    output[i] = fillColor[0];
    output[i + 1] = fillColor[1];
    output[i + 2] = fillColor[2];
    output[i + 3] = fillColor[3];
  }

  const radians = degreesToRadians(degrees);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const centerX = width / 2;
  const centerY = height / 2;
  const outputCenterX = outputWidth / 2;
  const outputCenterY = outputHeight / 2;

  const radius = 3; // Lanczos-3

  for (let dstY = 0; dstY < outputHeight; dstY++) {
    for (let dstX = 0; dstX < outputWidth; dstX++) {
      const dx = dstX - outputCenterX;
      const dy = dstY - outputCenterY;

      const srcX = cos * dx + sin * dy + centerX;
      const srcY = -sin * dx + cos * dy + centerY;

      // Check if we have enough surrounding pixels for Lanczos
      if (srcX >= radius && srcX < width - radius && srcY >= radius && srcY < height - radius) {
        const [r, g, b, a] = lanczosInterpolate(pixels, srcX, srcY, width, height, radius);
        setPixel(output, dstX, dstY, outputWidth, clampColor(r), clampColor(g), clampColor(b), clampColor(a));
      }
      // Else: keep fill color
    }
  }

  return {
    pixels: output,
    width: outputWidth,
    height: outputHeight,
  };
}

/**
 * Bilinear interpolation for rotation.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} x - X coordinate (can be fractional)
 * @param {number} y - Y coordinate (can be fractional)
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @returns {[number, number, number, number]} Interpolated RGBA values
 */
function bilinearInterpolatePixels(pixels, x, y, width, height) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const fx = x - x0;
  const fy = y - y0;

  // Get the four corner pixels
  const tl = getPixelSafe(pixels, x0, y0, width, height); // Top-left
  const tr = getPixelSafe(pixels, x1, y0, width, height); // Top-right
  const bl = getPixelSafe(pixels, x0, y1, width, height); // Bottom-left
  const br = getPixelSafe(pixels, x1, y1, width, height); // Bottom-right

  // Interpolate each channel
  const r = lerp(lerp(tl[0], tr[0], fx), lerp(bl[0], br[0], fx), fy);
  const g = lerp(lerp(tl[1], tr[1], fx), lerp(bl[1], br[1], fx), fy);
  const b = lerp(lerp(tl[2], tr[2], fx), lerp(bl[2], br[2], fx), fy);
  const a = lerp(lerp(tl[3], tr[3], fx), lerp(bl[3], br[3], fx), fy);

  return [r, g, b, a];
}

/**
 * Bicubic interpolation for rotation.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} x - X coordinate (can be fractional)
 * @param {number} y - Y coordinate (can be fractional)
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @returns {[number, number, number, number]} Interpolated RGBA values
 */
function bicubicInterpolate(pixels, x, y, width, height) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  let r = 0,
    g = 0,
    b = 0,
    a = 0;

  // Sample 4x4 neighborhood
  for (let dy = -1; dy <= 2; dy++) {
    for (let dx = -1; dx <= 2; dx++) {
      const px = clamp(x0 + dx, 0, width - 1);
      const py = clamp(y0 + dy, 0, height - 1);

      const [pr, pg, pb, pa] = getPixelSafe(pixels, px, py, width, height);

      const weightX = cubicKernel(fx - dx);
      const weightY = cubicKernel(fy - dy);
      const weight = weightX * weightY;

      r += pr * weight;
      g += pg * weight;
      b += pb * weight;
      a += pa * weight;
    }
  }

  return [r, g, b, a];
}

/**
 * Lanczos interpolation for rotation.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} x - X coordinate (can be fractional)
 * @param {number} y - Y coordinate (can be fractional)
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} radius - Lanczos radius (typically 3)
 * @returns {[number, number, number, number]} Interpolated RGBA values
 */
function lanczosInterpolate(pixels, x, y, width, height, radius) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  let r = 0,
    g = 0,
    b = 0,
    a = 0;
  let totalWeight = 0;

  // Sample neighborhood
  for (let dy = -radius + 1; dy <= radius; dy++) {
    for (let dx = -radius + 1; dx <= radius; dx++) {
      const px = clamp(x0 + dx, 0, width - 1);
      const py = clamp(y0 + dy, 0, height - 1);

      const [pr, pg, pb, pa] = getPixelSafe(pixels, px, py, width, height);

      const weightX = lanczosKernel(fx - dx, radius);
      const weightY = lanczosKernel(fy - dy, radius);
      const weight = weightX * weightY;

      r += pr * weight;
      g += pg * weight;
      b += pb * weight;
      a += pa * weight;
      totalWeight += weight;
    }
  }

  // Normalize weights
  if (totalWeight > 0) {
    r /= totalWeight;
    g /= totalWeight;
    b /= totalWeight;
    a /= totalWeight;
  }

  return [r, g, b, a];
}
