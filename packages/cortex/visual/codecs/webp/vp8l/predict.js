/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * VP8L Lossless Predictors
 *
 * Implements the 14 prediction modes used in VP8L lossless compression.
 * Each predictor estimates a pixel value based on neighboring pixels.
 *
 * @fileoverview Zero-dependency VP8L predictors with ARGB pixel format
 */

/**
 * Number of prediction modes in VP8L
 */
const NUM_PREDICTORS = 14;

/**
 * Extracts ARGB components from a packed 32-bit pixel.
 *
 * @param {number} pixel - Packed ARGB pixel (0xAARRGGBB)
 * @returns {{a: number, r: number, g: number, b: number}} ARGB components
 */
function unpackARGB(pixel) {
  return {
    a: (pixel >>> 24) & 0xff,
    r: (pixel >>> 16) & 0xff,
    g: (pixel >>> 8) & 0xff,
    b: pixel & 0xff,
  };
}

/**
 * Packs ARGB components into a 32-bit pixel.
 *
 * @param {number} a - Alpha component (0-255)
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {number} Packed ARGB pixel
 */
function packARGB(a, r, g, b) {
  return ((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

/**
 * Clamps a value to the range [0, 255].
 *
 * @param {number} value - Value to clamp
 * @returns {number} Clamped value
 */
function clamp255(value) {
  return Math.max(0, Math.min(255, value));
}

/**
 * Predicts a pixel value using the specified prediction mode.
 *
 * VP8L defines 14 prediction modes:
 * 0: BLACK (0x00000000)
 * 1: L (left pixel)
 * 2: T (top pixel)
 * 3: TR (top-right pixel)
 * 4: TL (top-left pixel)
 * 5: AVERAGE2(L, T)
 * 6: AVERAGE2(L, TL)
 * 7: AVERAGE2(L, TR)
 * 8: AVERAGE2(T, TL)
 * 9: AVERAGE2(T, TR)
 * 10: AVERAGE2(TL, TR)
 * 11: SELECT(L, T, TL)
 * 12: CLAMP_ADD_SUBTRACT_FULL(L, T, TL)
 * 13: CLAMP_ADD_SUBTRACT_HALF(L, T, TL)
 *
 * @param {number} x - Pixel x coordinate
 * @param {number} y - Pixel y coordinate
 * @param {number} mode - Prediction mode (0-13)
 * @param {object} neighbors - Neighboring pixels {left, top, topRight, topLeft}
 * @returns {number} Predicted ARGB pixel value
 * @throws {Error} For invalid mode or coordinates
 */
export function predictPixel(x, y, mode, neighbors) {
  if (!Number.isInteger(x) || x < 0) {
    throw new Error(`Predict: invalid x coordinate ${x}`);
  }

  if (!Number.isInteger(y) || y < 0) {
    throw new Error(`Predict: invalid y coordinate ${y}`);
  }

  if (!Number.isInteger(mode) || mode < 0 || mode >= NUM_PREDICTORS) {
    throw new Error(`Predict: invalid mode ${mode} (must be 0-${NUM_PREDICTORS - 1})`);
  }

  if (!neighbors || typeof neighbors !== "object") {
    throw new Error("Predict: neighbors must be object");
  }

  /** @type {{ left?: number, top?: number, topRight?: number, topLeft?: number }} */
  const typedNeighbors = neighbors;
  const { left = 0, top = 0, topRight = 0, topLeft = 0 } = typedNeighbors;

  switch (mode) {
    case 0: // BLACK
      return 0x00000000;

    case 1: // L (left)
      return left;

    case 2: // T (top)
      return top;

    case 3: // TR (top-right)
      return topRight;

    case 4: // TL (top-left)
      return topLeft;

    case 5: // AVERAGE2(L, T)
      return average2(left, top);

    case 6: // AVERAGE2(L, TL)
      return average2(left, topLeft);

    case 7: // AVERAGE2(L, TR)
      return average2(left, topRight);

    case 8: // AVERAGE2(T, TL)
      return average2(top, topLeft);

    case 9: // AVERAGE2(T, TR)
      return average2(top, topRight);

    case 10: // AVERAGE2(TL, TR)
      return average2(topLeft, topRight);

    case 11: // SELECT(L, T, TL)
      return select(left, top, topLeft);

    case 12: // CLAMP_ADD_SUBTRACT_FULL(L, T, TL)
      return clampAddSubtractFull(left, top, topLeft);

    case 13: // CLAMP_ADD_SUBTRACT_HALF(L, T, TL)
      return clampAddSubtractHalf(left, top, topLeft);

    default:
      throw new Error(`Predict: unsupported mode ${mode}`);
  }
}

/**
 * Computes the average of two ARGB pixels.
 *
 * @param {number} pixel1 - First ARGB pixel
 * @param {number} pixel2 - Second ARGB pixel
 * @returns {number} Average ARGB pixel
 */
function average2(pixel1, pixel2) {
  const p1 = unpackARGB(pixel1);
  const p2 = unpackARGB(pixel2);

  return packARGB((p1.a + p2.a) >>> 1, (p1.r + p2.r) >>> 1, (p1.g + p2.g) >>> 1, (p1.b + p2.b) >>> 1);
}

/**
 * Selects the best predictor among left, top, and top-left pixels.
 * Uses Manhattan distance to choose the closest predictor.
 *
 * @param {number} left - Left pixel
 * @param {number} top - Top pixel
 * @param {number} topLeft - Top-left pixel
 * @returns {number} Selected pixel
 */
function select(left, top, topLeft) {
  const l = unpackARGB(left);
  const t = unpackARGB(top);
  const tl = unpackARGB(topLeft);

  // Calculate Manhattan distances
  const distL = Math.abs(l.a - tl.a) + Math.abs(l.r - tl.r) + Math.abs(l.g - tl.g) + Math.abs(l.b - tl.b);
  const distT = Math.abs(t.a - tl.a) + Math.abs(t.r - tl.r) + Math.abs(t.g - tl.g) + Math.abs(t.b - tl.b);

  // Return the pixel with smaller distance to top-left
  return distL < distT ? left : top;
}

/**
 * Computes L + T - TL with full clamping.
 *
 * @param {number} left - Left pixel
 * @param {number} top - Top pixel
 * @param {number} topLeft - Top-left pixel
 * @returns {number} Predicted pixel
 */
function clampAddSubtractFull(left, top, topLeft) {
  const l = unpackARGB(left);
  const t = unpackARGB(top);
  const tl = unpackARGB(topLeft);

  return packARGB(
    clamp255(l.a + t.a - tl.a),
    clamp255(l.r + t.r - tl.r),
    clamp255(l.g + t.g - tl.g),
    clamp255(l.b + t.b - tl.b)
  );
}

/**
 * Computes (L + T) / 2 with half clamping.
 *
 * @param {number} left - Left pixel
 * @param {number} top - Top pixel
 * @param {number} _topLeft - Top-left pixel (unused but kept for consistency)
 * @returns {number} Predicted pixel
 */
function clampAddSubtractHalf(left, top, _topLeft) {
  // This is essentially AVERAGE2(L, T) but with different semantics
  return average2(left, top);
}

/**
 * Applies prediction to an entire image.
 *
 * @param {Uint32Array} pixels - ARGB pixel array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} mode - Prediction mode to apply
 * @returns {Uint32Array} Predicted pixel array (new array)
 * @throws {Error} For invalid parameters
 */
export function applyPrediction(pixels, width, height, mode) {
  if (!(pixels instanceof Uint32Array)) {
    throw new Error("Predict: pixels must be Uint32Array");
  }

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`Predict: invalid width ${width}`);
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`Predict: invalid height ${height}`);
  }

  if (pixels.length !== width * height) {
    throw new Error(`Predict: pixel array size ${pixels.length} does not match ${width}x${height}`);
  }

  const predicted = new Uint32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // Get neighboring pixels (0 for out-of-bounds)
      const neighbors = {
        left: x > 0 ? pixels[idx - 1] : 0,
        top: y > 0 ? pixels[idx - width] : 0,
        topRight: y > 0 && x < width - 1 ? pixels[idx - width + 1] : 0,
        topLeft: y > 0 && x > 0 ? pixels[idx - width - 1] : 0,
      };

      predicted[idx] = predictPixel(x, y, mode, neighbors);
    }
  }

  return predicted;
}

/**
 * Applies inverse prediction (reconstruction) to an image.
 * This adds the prediction to the residual to recover the original pixel.
 *
 * @param {Uint32Array} residuals - Residual ARGB pixel array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} mode - Prediction mode used during encoding
 * @returns {Uint32Array} Reconstructed pixel array (modified in-place)
 * @throws {Error} For invalid parameters
 */
export function applyInversePrediction(residuals, width, height, mode) {
  if (!(residuals instanceof Uint32Array)) {
    throw new Error("Predict: residuals must be Uint32Array");
  }

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`Predict: invalid width ${width}`);
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`Predict: invalid height ${height}`);
  }

  if (residuals.length !== width * height) {
    throw new Error(`Predict: residual array size ${residuals.length} does not match ${width}x${height}`);
  }

  // Process pixels in order (left-to-right, top-to-bottom)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // Get neighboring pixels from already reconstructed data
      const neighbors = {
        left: x > 0 ? residuals[idx - 1] : 0,
        top: y > 0 ? residuals[idx - width] : 0,
        topRight: y > 0 && x < width - 1 ? residuals[idx - width + 1] : 0,
        topLeft: y > 0 && x > 0 ? residuals[idx - width - 1] : 0,
      };

      const prediction = predictPixel(x, y, mode, neighbors);
      const residual = residuals[idx];

      // Add prediction to residual (component-wise with wraparound)
      const pred = unpackARGB(prediction);
      const res = unpackARGB(residual);

      residuals[idx] = packARGB(
        (pred.a + res.a) & 0xff,
        (pred.r + res.r) & 0xff,
        (pred.g + res.g) & 0xff,
        (pred.b + res.b) & 0xff
      );
    }
  }

  return residuals;
}

/**
 * Validates prediction parameters.
 *
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} mode - Prediction mode
 * @returns {{
 *   valid: boolean,
 *   error?: string
 * }} Validation result
 */
export function validatePrediction(width, height, mode) {
  if (!Number.isInteger(width) || width <= 0) {
    return { valid: false, error: `invalid width ${width}` };
  }

  if (!Number.isInteger(height) || height <= 0) {
    return { valid: false, error: `invalid height ${height}` };
  }

  if (!Number.isInteger(mode) || mode < 0 || mode >= NUM_PREDICTORS) {
    return { valid: false, error: `invalid mode ${mode}` };
  }

  return { valid: true };
}

/**
 * Gets the name of a prediction mode.
 *
 * @param {number} mode - Prediction mode (0-13)
 * @returns {string} Mode name
 */
export function getPredictionModeName(mode) {
  const names = [
    "BLACK",
    "L",
    "T",
    "TR",
    "TL",
    "AVERAGE2(L,T)",
    "AVERAGE2(L,TL)",
    "AVERAGE2(L,TR)",
    "AVERAGE2(T,TL)",
    "AVERAGE2(T,TR)",
    "AVERAGE2(TL,TR)",
    "SELECT(L,T,TL)",
    "CLAMP_ADD_SUBTRACT_FULL(L,T,TL)",
    "CLAMP_ADD_SUBTRACT_HALF(L,T,TL)",
  ];

  return names[mode] || `UNKNOWN(${mode})`;
}
