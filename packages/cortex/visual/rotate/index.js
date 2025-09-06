/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main rotation functionality for RGBA pixel data.
 *
 * This module provides the primary rotatePixels function that orchestrates
 * all rotation operations, automatically choosing the optimal algorithm
 * based on the rotation angle and quality requirements.
 *
 * @example
 * // Rotate 90° (uses fast quadrant rotation)
 * const result = rotatePixels(pixels, 800, 600, 90);
 * console.log(`Rotated: ${result.width}×${result.height}`);
 *
 * // Rotate 45° with bilinear interpolation
 * const result = rotatePixels(pixels, 800, 600, 45, "bilinear");
 *
 * // Rotate with custom fill color
 * const result = rotatePixels(pixels, 800, 600, 30, "bicubic", [255, 255, 255, 255]);
 */

import { rotateQuadrant } from "./rotate-90.js";
import { rotateBicubic, rotateBilinear, rotateLanczos, rotateNearest } from "./rotate-arbitrary.js";
import {
  calculateRotatedDimensions,
  isIdentityRotation,
  isQuadrantRotation,
  normalizeAngle,
  validateRotationParameters,
} from "./utils.js";

/**
 * Rotates RGBA pixel data by specified angle using optimal algorithm.
 *
 * This function automatically chooses the best rotation method:
 * - Identity rotations (0°, 360°, etc.) return a copy
 * - 90° rotations (90°, 180°, 270°) use fast lossless algorithms
 * - Arbitrary angles use interpolation-based rotation
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data (4 bytes per pixel)
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} degrees - Rotation angle in degrees (positive = clockwise)
 * @param {string} [algorithm="bilinear"] - Interpolation algorithm for arbitrary angles
 * @param {[number, number, number, number]} [fillColor=[0, 0, 0, 0]] - RGBA fill color for empty areas
 * @returns {{pixels: Uint8Array, width: number, height: number}} Rotated image data
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Fast 90° rotation
 * const result = rotatePixels(pixels, 800, 600, 90);
 *
 * // High-quality arbitrary rotation
 * const result = rotatePixels(pixels, 800, 600, 45, "lanczos", [255, 255, 255, 255]);
 */
export function rotatePixels(pixels, srcWidth, srcHeight, degrees, algorithm = "bilinear", fillColor = [0, 0, 0, 0]) {
  // Validate all parameters
  validateRotationParameters(pixels, srcWidth, srcHeight, degrees);

  // Validate algorithm
  const validAlgorithms = ["nearest", "bilinear", "bicubic", "lanczos"];
  if (!validAlgorithms.includes(algorithm)) {
    throw new Error(`Invalid algorithm: ${algorithm}. Must be one of: ${validAlgorithms.join(", ")}`);
  }

  // Validate fill color
  if (!Array.isArray(fillColor) || fillColor.length !== 4) {
    throw new Error("fillColor must be an array of 4 RGBA values [0-255]");
  }
  for (let i = 0; i < 4; i++) {
    if (!Number.isInteger(fillColor[i]) || fillColor[i] < 0 || fillColor[i] > 255) {
      throw new Error(`fillColor[${i}] must be an integer between 0 and 255`);
    }
  }

  // Normalize angle to 0-360 range
  const normalizedDegrees = normalizeAngle(degrees);

  // Handle identity rotation (no change)
  if (isIdentityRotation(normalizedDegrees)) {
    return {
      pixels: new Uint8Array(pixels),
      width: srcWidth,
      height: srcHeight,
    };
  }

  // Handle 90° rotations with fast algorithms
  if (isQuadrantRotation(normalizedDegrees)) {
    return rotateQuadrant(pixels, srcWidth, srcHeight, normalizedDegrees);
  }

  // Handle arbitrary angles with interpolation
  switch (algorithm) {
    case "nearest":
      return rotateNearest(pixels, srcWidth, srcHeight, normalizedDegrees, fillColor);
    case "bilinear":
      return rotateBilinear(pixels, srcWidth, srcHeight, normalizedDegrees, fillColor);
    case "bicubic":
      return rotateBicubic(pixels, srcWidth, srcHeight, normalizedDegrees, fillColor);
    case "lanczos":
      return rotateLanczos(pixels, srcWidth, srcHeight, normalizedDegrees, fillColor);
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

/**
 * Recommends the optimal rotation algorithm based on angle and quality requirements.
 *
 * @param {number} degrees - Rotation angle in degrees
 * @param {string} [quality="balanced"] - Quality preference: "fast", "balanced", "high"
 * @returns {string} Recommended algorithm name
 *
 * @example
 * const algorithm = recommendRotationAlgorithm(45, "high"); // "lanczos"
 * const algorithm = recommendRotationAlgorithm(90, "fast"); // "quadrant" (handled automatically)
 */
export function recommendRotationAlgorithm(degrees, quality = "balanced") {
  const normalized = normalizeAngle(degrees);

  // 90° rotations are always optimal
  if (isQuadrantRotation(normalized)) {
    return "quadrant"; // Note: this is handled automatically by rotatePixels
  }

  // For arbitrary angles, recommend based on quality preference
  switch (quality) {
    case "fast":
      return "nearest";
    case "balanced":
      return "bilinear";
    case "high":
      return "lanczos";
    default:
      return "bilinear";
  }
}

/**
 * Gets information about a rotation operation without performing it.
 * Useful for validation and UI feedback.
 *
 * @param {number} srcWidth - Source image width in pixels
 * @param {number} srcHeight - Source image height in pixels
 * @param {number} degrees - Rotation angle in degrees
 * @returns {{
 *   normalizedAngle: number,
 *   isIdentity: boolean,
 *   isQuadrant: boolean,
 *   outputDimensions: {width: number, height: number},
 *   recommendedAlgorithm: string,
 *   outputSize: number,
 *   isValid: boolean
 * }} Rotation operation information
 */
export function getRotationInfo(srcWidth, srcHeight, degrees) {
  try {
    // Basic validation
    if (!Number.isInteger(srcWidth) || srcWidth <= 0) {
      throw new Error("Invalid source width");
    }
    if (!Number.isInteger(srcHeight) || srcHeight <= 0) {
      throw new Error("Invalid source height");
    }
    if (typeof degrees !== "number" || !Number.isFinite(degrees)) {
      throw new Error("Invalid rotation angle");
    }

    const normalizedAngle = normalizeAngle(degrees);
    const isIdentity = isIdentityRotation(normalizedAngle);
    const isQuadrant = isQuadrantRotation(normalizedAngle);
    const outputDimensions = calculateRotatedDimensions(srcWidth, srcHeight, normalizedAngle);
    const recommendedAlgorithm = recommendRotationAlgorithm(normalizedAngle, "balanced");
    const outputSize = outputDimensions.width * outputDimensions.height * 4;

    return {
      normalizedAngle,
      isIdentity,
      isQuadrant,
      outputDimensions,
      recommendedAlgorithm,
      outputSize,
      isValid: true,
    };
  } catch (_error) {
    return {
      normalizedAngle: 0,
      isIdentity: false,
      isQuadrant: false,
      outputDimensions: { width: 0, height: 0 },
      recommendedAlgorithm: "bilinear",
      outputSize: 0,
      isValid: false,
    };
  }
}
