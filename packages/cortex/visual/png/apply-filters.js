// @ts-nocheck
/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PNG scanline filter application for encoding.
 *
 * PNG uses five filter types to preprocess scanlines before DEFLATE compression:
 * - Filter 0 (None): No filtering
 * - Filter 1 (Sub): Subtract left pixel value
 * - Filter 2 (Up): Subtract above pixel value
 * - Filter 3 (Average): Subtract average of left and above pixels
 * - Filter 4 (Paeth): Use Paeth predictor algorithm
 *
 * Filtering helps improve compression by reducing the entropy of the data.
 * The decoder reverses these filters during PNG decoding.
 *
 * @example
 * // Apply Sub filter to a scanline
 * const filtered = applySubFilter(scanlineData, bytesPerPixel);
 * console.log(`Filtered scanline: ${filtered.length} bytes`);
 *
 * @example
 * // Apply optimal filter to all scanlines
 * const filtered = applyOptimalFilters(imageData, width, height, bytesPerPixel);
 */

/**
 * PNG filter type constants.
 */
export const FILTER_TYPES = {
  NONE: 0,
  SUB: 1,
  UP: 2,
  AVERAGE: 3,
  PAETH: 4,
};

/**
 * Applies no filtering to scanline (Filter 0).
 *
 * @param {Uint8Array} scanline - Scanline data without filter byte
 * @returns {Uint8Array} Filtered scanline with filter byte prepended
 */
export function applyNoneFilter(scanline) {
  if (!(scanline instanceof Uint8Array)) {
    throw new TypeError("scanline must be a Uint8Array");
  }

  const filtered = new Uint8Array(scanline.length + 1);
  filtered[0] = FILTER_TYPES.NONE;
  filtered.set(scanline, 1);
  return filtered;
}

/**
 * Applies Sub filter to scanline (Filter 1).
 * Each byte is replaced with the difference between it and the corresponding
 * byte of the prior pixel in the same scanline.
 *
 * @param {Uint8Array} scanline - Scanline data without filter byte
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {Uint8Array} Filtered scanline with filter byte prepended
 */
export function applySubFilter(scanline, bytesPerPixel) {
  if (!(scanline instanceof Uint8Array)) {
    throw new TypeError("scanline must be a Uint8Array");
  }
  if (!Number.isInteger(bytesPerPixel) || bytesPerPixel < 1) {
    throw new Error("bytesPerPixel must be a positive integer");
  }

  const filtered = new Uint8Array(scanline.length + 1);
  filtered[0] = FILTER_TYPES.SUB;

  // Copy first pixel as-is (no left pixel to subtract)
  for (let i = 0; i < Math.min(bytesPerPixel, scanline.length); i++) {
    filtered[i + 1] = scanline[i];
  }

  // Apply Sub filter to remaining pixels
  for (let i = bytesPerPixel; i < scanline.length; i++) {
    const current = scanline[i];
    const left = scanline[i - bytesPerPixel];
    filtered[i + 1] = (current - left) & 0xff; // Modulo 256
  }

  return filtered;
}

/**
 * Applies Up filter to scanline (Filter 2).
 * Each byte is replaced with the difference between it and the corresponding
 * byte of the prior scanline.
 *
 * @param {Uint8Array} scanline - Current scanline data without filter byte
 * @param {Uint8Array|null} prevScanline - Previous scanline data (null for first scanline)
 * @returns {Uint8Array} Filtered scanline with filter byte prepended
 */
export function applyUpFilter(scanline, prevScanline) {
  if (!(scanline instanceof Uint8Array)) {
    throw new TypeError("scanline must be a Uint8Array");
  }
  if (prevScanline !== null && !(prevScanline instanceof Uint8Array)) {
    throw new TypeError("prevScanline must be a Uint8Array or null");
  }
  if (prevScanline && prevScanline.length !== scanline.length) {
    throw new Error("prevScanline must have same length as scanline");
  }

  const filtered = new Uint8Array(scanline.length + 1);
  filtered[0] = FILTER_TYPES.UP;

  if (prevScanline === null) {
    // First scanline: no previous scanline to subtract
    filtered.set(scanline, 1);
  } else {
    // Apply Up filter
    for (let i = 0; i < scanline.length; i++) {
      const current = scanline[i];
      const above = prevScanline[i];
      filtered[i + 1] = (current - above) & 0xff; // Modulo 256
    }
  }

  return filtered;
}

/**
 * Applies Average filter to scanline (Filter 3).
 * Each byte is replaced with the difference between it and the average
 * of the corresponding bytes of the prior pixel and prior scanline.
 *
 * @param {Uint8Array} scanline - Current scanline data without filter byte
 * @param {Uint8Array|null} prevScanline - Previous scanline data (null for first scanline)
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {Uint8Array} Filtered scanline with filter byte prepended
 */
export function applyAverageFilter(scanline, prevScanline, bytesPerPixel) {
  if (!(scanline instanceof Uint8Array)) {
    throw new TypeError("scanline must be a Uint8Array");
  }
  if (prevScanline !== null && !(prevScanline instanceof Uint8Array)) {
    throw new TypeError("prevScanline must be a Uint8Array or null");
  }
  if (prevScanline && prevScanline.length !== scanline.length) {
    throw new Error("prevScanline must have same length as scanline");
  }
  if (!Number.isInteger(bytesPerPixel) || bytesPerPixel < 1) {
    throw new Error("bytesPerPixel must be a positive integer");
  }

  const filtered = new Uint8Array(scanline.length + 1);
  filtered[0] = FILTER_TYPES.AVERAGE;

  for (let i = 0; i < scanline.length; i++) {
    const current = scanline[i];

    // Get left pixel value (0 if no left pixel)
    const left = i >= bytesPerPixel ? scanline[i - bytesPerPixel] : 0;

    // Get above pixel value (0 if no previous scanline)
    const above = prevScanline ? prevScanline[i] : 0;

    // Calculate average (floor division)
    const average = Math.floor((left + above) / 2);

    filtered[i + 1] = (current - average) & 0xff; // Modulo 256
  }

  return filtered;
}

/**
 * Paeth predictor algorithm used in Filter 4.
 *
 * @param {number} left - Left pixel value
 * @param {number} above - Above pixel value
 * @param {number} upperLeft - Upper-left pixel value
 * @returns {number} Predicted value
 */
function paethPredictor(left, above, upperLeft) {
  const p = left + above - upperLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - above);
  const pc = Math.abs(p - upperLeft);

  if (pa <= pb && pa <= pc) {
    return left;
  }
  if (pb <= pc) {
    return above;
  }
  return upperLeft;
}

/**
 * Applies Paeth filter to scanline (Filter 4).
 * Each byte is replaced with the difference between it and the Paeth
 * predictor of the corresponding bytes of the prior pixel, prior scanline,
 * and prior pixel of the prior scanline.
 *
 * @param {Uint8Array} scanline - Current scanline data without filter byte
 * @param {Uint8Array|null} prevScanline - Previous scanline data (null for first scanline)
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {Uint8Array} Filtered scanline with filter byte prepended
 */
export function applyPaethFilter(scanline, prevScanline, bytesPerPixel) {
  if (!(scanline instanceof Uint8Array)) {
    throw new TypeError("scanline must be a Uint8Array");
  }
  if (prevScanline !== null && !(prevScanline instanceof Uint8Array)) {
    throw new TypeError("prevScanline must be a Uint8Array or null");
  }
  if (prevScanline && prevScanline.length !== scanline.length) {
    throw new Error("prevScanline must have same length as scanline");
  }
  if (!Number.isInteger(bytesPerPixel) || bytesPerPixel < 1) {
    throw new Error("bytesPerPixel must be a positive integer");
  }

  const filtered = new Uint8Array(scanline.length + 1);
  filtered[0] = FILTER_TYPES.PAETH;

  for (let i = 0; i < scanline.length; i++) {
    const current = scanline[i];

    // Get left pixel value (0 if no left pixel)
    const left = i >= bytesPerPixel ? scanline[i - bytesPerPixel] : 0;

    // Get above pixel value (0 if no previous scanline)
    const above = prevScanline ? prevScanline[i] : 0;

    // Get upper-left pixel value (0 if no previous scanline or no left pixel)
    const upperLeft = prevScanline && i >= bytesPerPixel ? prevScanline[i - bytesPerPixel] : 0;

    // Apply Paeth predictor
    const predicted = paethPredictor(left, above, upperLeft);

    filtered[i + 1] = (current - predicted) & 0xff; // Modulo 256
  }

  return filtered;
}

/**
 * Applies specified filter to a scanline.
 *
 * @param {number} filterType - Filter type (0-4)
 * @param {Uint8Array} scanline - Scanline data without filter byte
 * @param {Uint8Array|null} prevScanline - Previous scanline data (null for first scanline)
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {Uint8Array} Filtered scanline with filter byte prepended
 */
export function applyFilter(filterType, scanline, prevScanline, bytesPerPixel) {
  switch (filterType) {
    case FILTER_TYPES.NONE:
      return applyNoneFilter(scanline);
    case FILTER_TYPES.SUB:
      return applySubFilter(scanline, bytesPerPixel);
    case FILTER_TYPES.UP:
      return applyUpFilter(scanline, prevScanline);
    case FILTER_TYPES.AVERAGE:
      return applyAverageFilter(scanline, prevScanline, bytesPerPixel);
    case FILTER_TYPES.PAETH:
      return applyPaethFilter(scanline, prevScanline, bytesPerPixel);
    default:
      throw new Error(`Invalid filter type: ${filterType} (must be 0-4)`);
  }
}

/**
 * Calculates the sum of absolute values for a filtered scanline.
 * Lower sums generally indicate better compression potential.
 *
 * @param {Uint8Array} filteredScanline - Filtered scanline with filter byte
 * @returns {number} Sum of absolute values (excluding filter byte)
 */
export function calculateFilterSum(filteredScanline) {
  if (!(filteredScanline instanceof Uint8Array) || filteredScanline.length < 1) {
    throw new TypeError("filteredScanline must be a non-empty Uint8Array");
  }

  let sum = 0;
  // Skip first byte (filter type) and sum absolute values
  for (let i = 1; i < filteredScanline.length; i++) {
    const value = filteredScanline[i];
    // Convert signed byte to absolute value
    sum += value > 127 ? 256 - value : value;
  }
  return sum;
}

/**
 * Finds the optimal filter for a scanline by testing all filter types
 * and selecting the one with the lowest sum of absolute values.
 *
 * @param {Uint8Array} scanline - Scanline data without filter byte
 * @param {Uint8Array|null} prevScanline - Previous scanline data (null for first scanline)
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {{filterType: number, filteredScanline: Uint8Array}} Optimal filter and result
 */
export function findOptimalFilter(scanline, prevScanline, bytesPerPixel) {
  let bestFilterType = FILTER_TYPES.NONE;
  let bestFilteredScanline = null;
  let bestSum = Number.POSITIVE_INFINITY;

  // Test all filter types
  for (let filterType = 0; filterType <= 4; filterType++) {
    try {
      const filtered = applyFilter(filterType, scanline, prevScanline, bytesPerPixel);
      const sum = calculateFilterSum(filtered);

      if (sum < bestSum) {
        bestSum = sum;
        bestFilterType = filterType;
        bestFilteredScanline = filtered;
      }
    } catch (_error) {}
  }

  return {
    filterType: bestFilterType,
    filteredScanline: bestFilteredScanline,
  };
}

/**
 * Applies filters to all scanlines in image data.
 *
 * @param {Uint8Array} imageData - Raw image data (scanlines without filter bytes)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} bytesPerPixel - Bytes per pixel
 * @param {number|'optimal'} filterStrategy - Filter strategy: specific filter type (0-4) or 'optimal'
 * @returns {Uint8Array} Filtered image data with filter bytes
 */
export function applyFilters(imageData, width, height, bytesPerPixel, filterStrategy = "optimal") {
  if (!(imageData instanceof Uint8Array)) {
    throw new TypeError("imageData must be a Uint8Array");
  }
  if (!Number.isInteger(width) || width < 1) {
    throw new Error("width must be a positive integer");
  }
  if (!Number.isInteger(height) || height < 1) {
    throw new Error("height must be a positive integer");
  }
  if (!Number.isInteger(bytesPerPixel) || bytesPerPixel < 1) {
    throw new Error("bytesPerPixel must be a positive integer");
  }

  const scanlineWidth = width * bytesPerPixel;
  const expectedDataSize = height * scanlineWidth;

  if (imageData.length !== expectedDataSize) {
    throw new Error(`Invalid image data size: expected ${expectedDataSize}, got ${imageData.length}`);
  }

  const filteredData = new Uint8Array(height * (scanlineWidth + 1)); // +1 for filter byte per scanline
  let outputOffset = 0;

  for (let y = 0; y < height; y++) {
    const scanlineStart = y * scanlineWidth;
    const scanline = imageData.slice(scanlineStart, scanlineStart + scanlineWidth);

    // Get previous scanline (null for first scanline)
    const prevScanline = y > 0 ? imageData.slice((y - 1) * scanlineWidth, y * scanlineWidth) : null;

    let filteredScanline;

    if (filterStrategy === "optimal") {
      // Find optimal filter for this scanline
      const result = findOptimalFilter(scanline, prevScanline, bytesPerPixel);
      filteredScanline = result.filteredScanline;
    } else if (Number.isInteger(filterStrategy) && filterStrategy >= 0 && filterStrategy <= 4) {
      // Use specific filter type
      filteredScanline = applyFilter(filterStrategy, scanline, prevScanline, bytesPerPixel);
    } else {
      throw new Error(`Invalid filter strategy: ${filterStrategy} (must be 0-4 or 'optimal')`);
    }

    // Copy filtered scanline to output
    filteredData.set(filteredScanline, outputOffset);
    outputOffset += filteredScanline.length;
  }

  return filteredData;
}
