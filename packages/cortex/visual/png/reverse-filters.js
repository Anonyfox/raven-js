/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Reverses PNG scanline filters to reconstruct original pixel data.
 *
 * PNG applies predictive filters to each scanline before DEFLATE compression
 * to improve compression efficiency. Each scanline starts with a filter type byte
 * followed by the filtered pixel data.
 *
 * Filter types (PNG spec section 12.3):
 * - 0 (None): No filtering applied
 * - 1 (Sub): Each byte is the difference from the corresponding byte of the prior pixel
 * - 2 (Up): Each byte is the difference from the corresponding byte of the pixel above
 * - 3 (Average): Each byte is the difference from the average of prior and above pixels
 * - 4 (Paeth): Each byte is the difference from the Paeth predictor of prior, above, and upper-left pixels
 *
 * This module implements the reverse operations to reconstruct the original scanlines.
 *
 * @param {Uint8Array} filteredData - Decompressed IDAT data with filter bytes
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} bytesPerPixel - Bytes per pixel (depends on color type and bit depth)
 * @returns {Uint8Array} Unfiltered scanline data
 *
 * @example
 * // Reverse filters on decompressed PNG data
 * const unfiltered = reverseFilters(decompressedData, 180, 180, 4);
 * console.log(`Reconstructed ${unfiltered.length} bytes of pixel data`);
 *
 * @example
 * // Handle different color types
 * const bytesPerPixel = ihdr.colorType === 2 ? 3 : 4; // RGB vs RGBA
 * const pixels = reverseFilters(data, ihdr.width, ihdr.height, bytesPerPixel);
 */

/**
 * PNG filter type constants as defined in PNG specification.
 */
export const FILTER_TYPES = {
  /** No filtering applied */
  NONE: 0,
  /** Each byte is difference from corresponding byte of prior pixel */
  SUB: 1,
  /** Each byte is difference from corresponding byte of pixel above */
  UP: 2,
  /** Each byte is difference from average of prior and above pixels */
  AVERAGE: 3,
  /** Each byte is difference from Paeth predictor */
  PAETH: 4,
};

/**
 * Calculate Paeth predictor for PNG filtering.
 *
 * The Paeth predictor selects the prior pixel (left), above pixel, or
 * upper-left pixel that is closest to the initial estimate (left + above - upper-left).
 * This provides better prediction for edges and gradients.
 *
 * @param {number} left - Value of pixel to the left (or 0 if at left edge)
 * @param {number} above - Value of pixel above (or 0 if at top edge)
 * @param {number} upperLeft - Value of pixel above-left (or 0 if at corner)
 * @returns {number} Paeth predictor value (0-255)
 *
 * @private
 */
function paethPredictor(left, above, upperLeft) {
  // Initial estimate
  const estimate = left + above - upperLeft;

  // Distances to each candidate
  const distanceLeft = Math.abs(estimate - left);
  const distanceAbove = Math.abs(estimate - above);
  const distanceUpperLeft = Math.abs(estimate - upperLeft);

  // Return closest candidate
  if (distanceLeft <= distanceAbove && distanceLeft <= distanceUpperLeft) {
    return left;
  }
  if (distanceAbove <= distanceUpperLeft) {
    return above;
  }
  return upperLeft;
}

/**
 * Reverse None filter (filter type 0).
 * No filtering was applied, so data is returned unchanged.
 *
 * @param {Uint8Array} scanline - Filtered scanline data (without filter byte)
 * @param {Uint8Array} _prevScanline - Previous scanline (unused for None filter)
 * @param {number} _bytesPerPixel - Bytes per pixel (unused for None filter)
 * @returns {Uint8Array} Unfiltered scanline data
 *
 * @private
 */
function reverseNoneFilter(scanline, _prevScanline, _bytesPerPixel) {
  // None filter: no change needed
  return new Uint8Array(scanline);
}

/**
 * Reverse Sub filter (filter type 1).
 * Each byte is the difference from the corresponding byte of the prior pixel.
 * To reverse: add the corresponding byte of the prior pixel.
 *
 * @param {Uint8Array} scanline - Filtered scanline data (without filter byte)
 * @param {Uint8Array} _prevScanline - Previous scanline (unused for Sub filter)
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {Uint8Array} Unfiltered scanline data
 *
 * @private
 */
function reverseSubFilter(scanline, _prevScanline, bytesPerPixel) {
  const result = new Uint8Array(scanline.length);

  // First pixel has no prior pixel, so copy as-is
  for (let i = 0; i < bytesPerPixel && i < scanline.length; i++) {
    result[i] = scanline[i];
  }

  // Subsequent pixels: add corresponding byte from prior pixel
  for (let i = bytesPerPixel; i < scanline.length; i++) {
    result[i] = (scanline[i] + result[i - bytesPerPixel]) & 0xff;
  }

  return result;
}

/**
 * Reverse Up filter (filter type 2).
 * Each byte is the difference from the corresponding byte of the pixel above.
 * To reverse: add the corresponding byte from the scanline above.
 *
 * @param {Uint8Array} scanline - Filtered scanline data (without filter byte)
 * @param {Uint8Array} prevScanline - Previous scanline data (or null for first scanline)
 * @param {number} _bytesPerPixel - Bytes per pixel (unused for Up filter)
 * @returns {Uint8Array} Unfiltered scanline data
 *
 * @private
 */
function reverseUpFilter(scanline, prevScanline, _bytesPerPixel) {
  const result = new Uint8Array(scanline.length);

  if (!prevScanline) {
    // First scanline has no scanline above, so copy as-is
    result.set(scanline);
  } else {
    // Add corresponding byte from scanline above
    for (let i = 0; i < scanline.length; i++) {
      result[i] = (scanline[i] + prevScanline[i]) & 0xff;
    }
  }

  return result;
}

/**
 * Reverse Average filter (filter type 3).
 * Each byte is the difference from the average of the prior pixel and pixel above.
 * To reverse: add the average of prior pixel and pixel above.
 *
 * @param {Uint8Array} scanline - Filtered scanline data (without filter byte)
 * @param {Uint8Array} prevScanline - Previous scanline data (or null for first scanline)
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {Uint8Array} Unfiltered scanline data
 *
 * @private
 */
function reverseAverageFilter(scanline, prevScanline, bytesPerPixel) {
  const result = new Uint8Array(scanline.length);

  for (let i = 0; i < scanline.length; i++) {
    // Get prior pixel byte (left)
    const left = i >= bytesPerPixel ? result[i - bytesPerPixel] : 0;

    // Get above pixel byte
    const above = prevScanline ? prevScanline[i] : 0;

    // Average of left and above (using floor division)
    const average = Math.floor((left + above) / 2);

    // Add average to filtered value
    result[i] = (scanline[i] + average) & 0xff;
  }

  return result;
}

/**
 * Reverse Paeth filter (filter type 4).
 * Each byte is the difference from the Paeth predictor of prior, above, and upper-left pixels.
 * To reverse: add the Paeth predictor value.
 *
 * @param {Uint8Array} scanline - Filtered scanline data (without filter byte)
 * @param {Uint8Array} prevScanline - Previous scanline data (or null for first scanline)
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {Uint8Array} Unfiltered scanline data
 *
 * @private
 */
function reversePaethFilter(scanline, prevScanline, bytesPerPixel) {
  const result = new Uint8Array(scanline.length);

  for (let i = 0; i < scanline.length; i++) {
    // Get prior pixel byte (left)
    const left = i >= bytesPerPixel ? result[i - bytesPerPixel] : 0;

    // Get above pixel byte
    const above = prevScanline ? prevScanline[i] : 0;

    // Get upper-left pixel byte
    const upperLeft = prevScanline && i >= bytesPerPixel ? prevScanline[i - bytesPerPixel] : 0;

    // Calculate Paeth predictor
    const predictor = paethPredictor(left, above, upperLeft);

    // Add predictor to filtered value
    result[i] = (scanline[i] + predictor) & 0xff;
  }

  return result;
}

/**
 * Reverse a single scanline filter based on filter type.
 *
 * @param {number} filterType - PNG filter type (0-4)
 * @param {Uint8Array} scanline - Filtered scanline data (without filter byte)
 * @param {Uint8Array} prevScanline - Previous unfiltered scanline (or null for first scanline)
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {Uint8Array} Unfiltered scanline data
 * @throws {Error} If filter type is invalid
 *
 * @private
 */
function reverseScanlineFilter(filterType, scanline, prevScanline, bytesPerPixel) {
  switch (filterType) {
    case FILTER_TYPES.NONE:
      return reverseNoneFilter(scanline, prevScanline, bytesPerPixel);

    case FILTER_TYPES.SUB:
      return reverseSubFilter(scanline, prevScanline, bytesPerPixel);

    case FILTER_TYPES.UP:
      return reverseUpFilter(scanline, prevScanline, bytesPerPixel);

    case FILTER_TYPES.AVERAGE:
      return reverseAverageFilter(scanline, prevScanline, bytesPerPixel);

    case FILTER_TYPES.PAETH:
      return reversePaethFilter(scanline, prevScanline, bytesPerPixel);

    default:
      throw new Error(`Invalid PNG filter type: ${filterType} (must be 0-4)`);
  }
}

/**
 * Validate filter reversal parameters.
 *
 * @param {Uint8Array} filteredData - Decompressed IDAT data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} bytesPerPixel - Bytes per pixel
 * @throws {Error} If parameters are invalid
 *
 * @private
 */
function validateFilterParameters(filteredData, width, height, bytesPerPixel) {
  if (!(filteredData instanceof Uint8Array)) {
    throw new TypeError("Expected filteredData to be Uint8Array");
  }

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`Invalid width: ${width} (must be positive integer)`);
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`Invalid height: ${height} (must be positive integer)`);
  }

  if (!Number.isInteger(bytesPerPixel) || bytesPerPixel <= 0) {
    throw new Error(`Invalid bytesPerPixel: ${bytesPerPixel} (must be positive integer)`);
  }

  // Calculate expected data size: each scanline has 1 filter byte + width * bytesPerPixel
  const scanlineSize = 1 + width * bytesPerPixel;
  const expectedSize = scanlineSize * height;

  if (filteredData.length !== expectedSize) {
    throw new Error(
      `Invalid data size: expected ${expectedSize} bytes (${height} scanlines × ${scanlineSize} bytes), got ${filteredData.length}`
    );
  }
}

/**
 * Reverse PNG scanline filters to reconstruct original pixel data.
 *
 * Processes decompressed IDAT data to reverse the predictive filters applied
 * before compression. Each scanline starts with a filter type byte (0-4)
 * followed by the filtered pixel data.
 *
 * The function processes scanlines sequentially since each scanline may depend
 * on the previous unfiltered scanline for prediction.
 *
 * @param {Uint8Array} filteredData - Decompressed IDAT data with filter bytes
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} bytesPerPixel - Bytes per pixel (from IHDR color type and bit depth)
 * @returns {Uint8Array} Unfiltered pixel data (without filter bytes)
 * @throws {Error} If parameters are invalid or filter types are unsupported
 *
 * @example
 * // Reverse filters for RGBA image
 * const unfiltered = reverseFilters(decompressedData, 180, 180, 4);
 * console.log(`Reconstructed ${unfiltered.length} bytes of RGBA pixel data`);
 *
 * @example
 * // Reverse filters for RGB image
 * const unfiltered = reverseFilters(decompressedData, width, height, 3);
 *
 * @example
 * // Reverse filters for grayscale image
 * const unfiltered = reverseFilters(decompressedData, width, height, 1);
 */
export function reverseFilters(filteredData, width, height, bytesPerPixel) {
  // Validate input parameters
  validateFilterParameters(filteredData, width, height, bytesPerPixel);

  const scanlineSize = 1 + width * bytesPerPixel; // 1 filter byte + pixel data
  const pixelDataSize = width * bytesPerPixel; // Size without filter byte
  const result = new Uint8Array(height * pixelDataSize);

  let prevScanline = null;

  // Process each scanline
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * scanlineSize;

    // Extract filter type (first byte of scanline)
    const filterType = filteredData[scanlineOffset];

    // Extract filtered pixel data (remaining bytes of scanline)
    const filteredScanline = filteredData.slice(scanlineOffset + 1, scanlineOffset + scanlineSize);

    // Reverse the filter for this scanline
    const unfilteredScanline = reverseScanlineFilter(filterType, filteredScanline, prevScanline, bytesPerPixel);

    // Store unfiltered scanline in result
    const resultOffset = y * pixelDataSize;
    result.set(unfilteredScanline, resultOffset);

    // Keep reference to this unfiltered scanline for next iteration
    prevScanline = unfilteredScanline;
  }

  return result;
}

/**
 * Get human-readable name for filter type.
 * Useful for debugging and logging.
 *
 * @param {number} filterType - PNG filter type (0-4)
 * @returns {string} Filter type name
 *
 * @example
 * console.log(getFilterTypeName(1)); // "Sub"
 * console.log(getFilterTypeName(4)); // "Paeth"
 */
export function getFilterTypeName(filterType) {
  switch (filterType) {
    case FILTER_TYPES.NONE:
      return "None";
    case FILTER_TYPES.SUB:
      return "Sub";
    case FILTER_TYPES.UP:
      return "Up";
    case FILTER_TYPES.AVERAGE:
      return "Average";
    case FILTER_TYPES.PAETH:
      return "Paeth";
    default:
      return `Unknown(${filterType})`;
  }
}

/**
 * Analyze filter type usage in PNG data.
 * Useful for understanding compression characteristics and debugging.
 *
 * @param {Uint8Array} filteredData - Decompressed IDAT data with filter bytes
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} bytesPerPixel - Bytes per pixel
 * @returns {{filterCounts: Object, totalScanlines: number, mostUsedFilter: number}} Filter usage statistics
 *
 * @example
 * // Analyze filter usage
 * const stats = analyzeFilterUsage(data, 180, 180, 4);
 * console.log(`Most used filter: ${getFilterTypeName(stats.mostUsedFilter)}`);
 * console.log(`Filter distribution:`, stats.filterCounts);
 */
export function analyzeFilterUsage(filteredData, width, height, bytesPerPixel) {
  validateFilterParameters(filteredData, width, height, bytesPerPixel);

  const scanlineSize = 1 + width * bytesPerPixel;
  /** @type {Record<number, number>} */
  const filterCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

  // Count filter type usage
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * scanlineSize;
    const filterType = filteredData[scanlineOffset];

    if (filterType >= 0 && filterType <= 4) {
      filterCounts[filterType]++;
    }
  }

  // Find most used filter
  let mostUsedFilter = 0;
  let maxCount = filterCounts[0];

  for (let filterType = 1; filterType <= 4; filterType++) {
    if (filterCounts[filterType] > maxCount) {
      maxCount = filterCounts[filterType];
      mostUsedFilter = filterType;
    }
  }

  return {
    filterCounts,
    totalScanlines: height,
    mostUsedFilter,
  };
}
