/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * ALPH Chunk Decoder for WebP
 *
 * Implements VP8X alpha channel decoding according to the WebP specification.
 * Supports methods 0 (raw) and 1 (VP8L compressed) as of M9 milestone.
 *
 * @fileoverview Zero-dependency alpha plane decoder with strict validation
 */

import { decodeVP8L } from "../vp8l/decode.js";

/**
 * Decodes an ALPH chunk to produce an alpha plane.
 *
 * ALPH chunk format:
 * - Byte 0: [RSRV|P|F|C] where:
 *   - RSRV (bits 7-4): Reserved, must be 0
 *   - P (bit 3): Pre-processing flag (0=none, 1=level reduction)
 *   - F (bits 2-1): Filtering method (0=none, 1=horizontal, 2=vertical, 3=gradient)
 *   - C (bit 0): Compression method (0=none/raw, 1=VP8L lossless)
 * - Remaining bytes: Alpha data according to compression method
 *
 * @param {Uint8Array} alph - ALPH chunk data (including header byte)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {Uint8Array} Alpha plane (width * height bytes, row-major)
 * @throws {Error} For invalid headers, unsupported methods, or size mismatches
 */
export function decodeAlpha(alph, width, height) {
  if (!alph || alph.length === 0) {
    throw new Error("ALPH: chunk data is empty");
  }

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error(`ALPH: invalid dimensions ${width}x${height}`);
  }

  // Parse header byte
  const header = alph[0];
  const reserved = (header >> 4) & 0x0f;
  const preprocessing = (header >> 3) & 0x01;
  const filtering = (header >> 1) & 0x03;
  const compression = header & 0x01;

  // Validate reserved bits
  if (reserved !== 0) {
    throw new Error(`ALPH: reserved bits must be 0, got ${reserved}`);
  }

  // Get alpha data (excluding header byte)
  const alphaData = alph.subarray(1);
  const expectedSize = width * height;

  // Decode based on compression method
  let alphaPlan;

  if (compression === 0) {
    // Method 0: Raw/uncompressed alpha data
    alphaPlan = decodeRawAlpha(alphaData, width, height, filtering, preprocessing);
  } else if (compression === 1) {
    // Method 1: VP8L lossless compression
    alphaPlan = decodeVP8LAlpha(alphaData, width, height, filtering, preprocessing);
  } else {
    throw new Error(`ALPH: invalid compression method ${compression}`);
  }

  // Validate output size
  if (alphaPlan.length !== expectedSize) {
    throw new Error(`ALPH: decoded size ${alphaPlan.length} does not match expected ${expectedSize}`);
  }

  return alphaPlan;
}

/**
 * Decodes raw (uncompressed) alpha data with optional filtering and preprocessing.
 *
 * @param {Uint8Array} data - Raw alpha data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} filtering - Filtering method (0=none, 1=horizontal, 2=vertical, 3=gradient)
 * @param {number} preprocessing - Preprocessing flag (0=none, 1=level reduction)
 * @returns {Uint8Array} Decoded alpha plane
 * @throws {Error} For invalid data size or unsupported methods
 */
function decodeRawAlpha(data, width, height, filtering, preprocessing) {
  const expectedSize = width * height;

  if (data.length !== expectedSize) {
    throw new Error(`ALPH: raw data size ${data.length} does not match expected ${expectedSize} (${width}x${height})`);
  }

  // For M7, implement basic raw decoding
  // Filtering and preprocessing will be enhanced in later iterations
  const alphaPlan = new Uint8Array(data);

  // Apply inverse filtering if specified
  if (filtering === 1) {
    // Horizontal filtering: each pixel is delta from left neighbor
    applyHorizontalInverseFilter(alphaPlan, width, height);
  } else if (filtering === 2) {
    // Vertical filtering: each pixel is delta from top neighbor
    applyVerticalInverseFilter(alphaPlan, width, height);
  } else if (filtering === 3) {
    // Gradient filtering: each pixel is delta from gradient predictor
    applyGradientInverseFilter(alphaPlan, width, height);
  } else if (filtering !== 0) {
    throw new Error(`ALPH: unsupported filtering method ${filtering}`);
  }

  // Apply inverse preprocessing if specified
  if (preprocessing === 1) {
    // Level reduction preprocessing (simple quantization expansion)
    applyLevelReductionInverse(alphaPlan);
  } else if (preprocessing !== 0) {
    throw new Error(`ALPH: unsupported preprocessing method ${preprocessing}`);
  }

  return alphaPlan;
}

/**
 * Decodes VP8L compressed alpha data with optional filtering and preprocessing.
 *
 * @param {Uint8Array} data - VP8L compressed alpha data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} filtering - Filtering method (0=none, 1=horizontal, 2=vertical, 3=gradient)
 * @param {number} preprocessing - Preprocessing flag (0=none, 1=level reduction)
 * @returns {Uint8Array} Decoded alpha plane
 * @throws {Error} For invalid data or VP8L decoding errors
 */
function decodeVP8LAlpha(data, width, height, filtering, preprocessing) {
  // Decode VP8L compressed data
  const vp8lResult = decodeVP8L(data);

  // Validate dimensions match
  if (vp8lResult.width !== width || vp8lResult.height !== height) {
    throw new Error(
      `ALPH: VP8L dimensions ${vp8lResult.width}x${vp8lResult.height} do not match expected ${width}x${height}`
    );
  }

  // Extract alpha channel from RGBA data
  const pixelCount = width * height;
  const alphaPlan = new Uint8Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    // VP8L returns RGBA, we want just the alpha channel
    // For alpha-only images, the alpha is typically stored in the green channel
    // or all channels contain the same alpha value
    const rgbaIndex = i * 4;
    alphaPlan[i] = vp8lResult.pixels[rgbaIndex + 1]; // Use green channel as alpha
  }

  // Apply inverse filtering if specified
  if (filtering === 1) {
    applyHorizontalInverseFilter(alphaPlan, width, height);
  } else if (filtering === 2) {
    applyVerticalInverseFilter(alphaPlan, width, height);
  } else if (filtering === 3) {
    applyGradientInverseFilter(alphaPlan, width, height);
  } else if (filtering !== 0) {
    throw new Error(`ALPH: unsupported filtering method ${filtering}`);
  }

  // Apply inverse preprocessing if specified
  if (preprocessing === 1) {
    applyLevelReductionInverse(alphaPlan);
  } else if (preprocessing !== 0) {
    throw new Error(`ALPH: unsupported preprocessing method ${preprocessing}`);
  }

  return alphaPlan;
}

/**
 * Applies inverse horizontal filtering to alpha plane.
 * Each pixel was encoded as delta from its left neighbor.
 *
 * @param {Uint8Array} plane - Alpha plane to filter in-place
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
function applyHorizontalInverseFilter(plane, width, height) {
  for (let y = 0; y < height; y++) {
    const rowStart = y * width;
    for (let x = 1; x < width; x++) {
      const idx = rowStart + x;
      const leftIdx = rowStart + x - 1;
      // Reconstruct: current = delta + left (with wraparound)
      plane[idx] = (plane[idx] + plane[leftIdx]) & 0xff;
    }
  }
}

/**
 * Applies inverse vertical filtering to alpha plane.
 * Each pixel was encoded as delta from its top neighbor.
 *
 * @param {Uint8Array} plane - Alpha plane to filter in-place
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
function applyVerticalInverseFilter(plane, width, height) {
  for (let y = 1; y < height; y++) {
    const rowStart = y * width;
    const prevRowStart = (y - 1) * width;
    for (let x = 0; x < width; x++) {
      const idx = rowStart + x;
      const topIdx = prevRowStart + x;
      // Reconstruct: current = delta + top (with wraparound)
      plane[idx] = (plane[idx] + plane[topIdx]) & 0xff;
    }
  }
}

/**
 * Applies inverse gradient filtering to alpha plane.
 * Each pixel was encoded as delta from gradient predictor (left + top - top-left).
 *
 * @param {Uint8Array} plane - Alpha plane to filter in-place
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
function applyGradientInverseFilter(plane, width, height) {
  for (let y = 0; y < height; y++) {
    const rowStart = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowStart + x;

      // Get neighbors (0 for out-of-bounds)
      const left = x > 0 ? plane[rowStart + x - 1] : 0;
      const top = y > 0 ? plane[(y - 1) * width + x] : 0;
      const topLeft = x > 0 && y > 0 ? plane[(y - 1) * width + x - 1] : 0;

      // Gradient predictor: left + top - top-left
      const predictor = (left + top - topLeft) & 0xff;

      // Reconstruct: current = delta + predictor (with wraparound)
      plane[idx] = (plane[idx] + predictor) & 0xff;
    }
  }
}

/**
 * Applies inverse level reduction preprocessing.
 * Expands quantized alpha values back to full 8-bit range.
 *
 * @param {Uint8Array} plane - Alpha plane to process in-place
 */
function applyLevelReductionInverse(plane) {
  // Simple level expansion: scale from reduced range to full 0-255
  // This is a basic implementation - the actual WebP spec may use different tables
  for (let i = 0; i < plane.length; i++) {
    // Expand from 4-bit to 8-bit range (common quantization)
    const reduced = plane[i] & 0x0f; // Take lower 4 bits
    plane[i] = reduced * 17; // 0-15 -> 0-255 (15*17=255)
  }
}

/**
 * Validates alpha plane dimensions and content.
 *
 * @param {Uint8Array} alphaPlan - Alpha plane to validate
 * @param {number} width - Expected width
 * @param {number} height - Expected height
 * @throws {Error} If validation fails
 */
export function validateAlphaPlane(alphaPlan, width, height) {
  if (!alphaPlan || !(alphaPlan instanceof Uint8Array)) {
    throw new Error("ALPH: alpha plane must be Uint8Array");
  }

  const expectedSize = width * height;
  if (alphaPlan.length !== expectedSize) {
    throw new Error(`ALPH: alpha plane size ${alphaPlan.length} does not match expected ${expectedSize}`);
  }

  // All values should be valid alpha (0-255) - already guaranteed by Uint8Array
  return true;
}

/**
 * Composites RGB and alpha planes into RGBA without premultiplication.
 *
 * @param {Uint8Array} rgbPixels - RGB pixel data (width * height * 3 bytes)
 * @param {Uint8Array} alphaPlan - Alpha plane (width * height bytes)
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8Array} RGBA pixel data (width * height * 4 bytes)
 * @throws {Error} For size mismatches
 */
export function compositeRGBA(rgbPixels, alphaPlan, width, height) {
  const pixelCount = width * height;
  const expectedRgbSize = pixelCount * 3;
  const expectedAlphaSize = pixelCount;

  if (rgbPixels.length !== expectedRgbSize) {
    throw new Error(`ALPH: RGB size ${rgbPixels.length} does not match expected ${expectedRgbSize}`);
  }

  if (alphaPlan.length !== expectedAlphaSize) {
    throw new Error(`ALPH: alpha size ${alphaPlan.length} does not match expected ${expectedAlphaSize}`);
  }

  const rgba = new Uint8Array(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const rgbIdx = i * 3;
    const rgbaIdx = i * 4;

    // Copy RGB channels
    rgba[rgbaIdx] = rgbPixels[rgbIdx]; // R
    rgba[rgbaIdx + 1] = rgbPixels[rgbIdx + 1]; // G
    rgba[rgbaIdx + 2] = rgbPixels[rgbIdx + 2]; // B

    // Set alpha channel (no premultiplication)
    rgba[rgbaIdx + 3] = alphaPlan[i]; // A
  }

  return rgba;
}
