/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file JPEG quantization tables and quality control.
 *
 * Quantization is the lossy compression step in JPEG that reduces
 * precision of DCT coefficients based on visual perception. Higher
 * frequencies are quantized more aggressively since they're less
 * visible to human eyes.
 */

/**
 * Standard JPEG luminance (Y) quantization table.
 * Based on psychovisual experiments, optimized for human perception.
 * Values represent quantization steps for each DCT coefficient.
 */
export const STANDARD_LUMINANCE_TABLE = [
  [16, 11, 10, 16, 24, 40, 51, 61],
  [12, 12, 14, 19, 26, 58, 60, 55],
  [14, 13, 16, 24, 40, 57, 69, 56],
  [14, 17, 22, 29, 51, 87, 80, 62],
  [18, 22, 37, 56, 68, 109, 103, 77],
  [24, 35, 55, 64, 81, 104, 113, 92],
  [49, 64, 78, 87, 103, 121, 120, 101],
  [72, 92, 95, 98, 112, 100, 103, 99],
];

/**
 * Standard JPEG chrominance (Cb, Cr) quantization table.
 * Human eyes are less sensitive to color than luminance,
 * so chrominance can be quantized more aggressively.
 */
export const STANDARD_CHROMINANCE_TABLE = [
  [17, 18, 24, 47, 99, 99, 99, 99],
  [18, 21, 26, 66, 99, 99, 99, 99],
  [24, 26, 56, 99, 99, 99, 99, 99],
  [47, 66, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99],
];

/**
 * Validates a quantization table.
 *
 * @param {number[][]} table - 8x8 quantization table
 * @param {string} [name="Quantization table"] - Table name for error messages
 * @throws {Error} If table is invalid
 */
export function validateQuantizationTable(table, name = "Quantization table") {
  if (!Array.isArray(table) || table.length !== 8) {
    throw new Error(`${name} must be an 8x8 array (got ${table?.length || "invalid"} rows)`);
  }

  for (let i = 0; i < 8; i++) {
    if (!Array.isArray(table[i]) || table[i].length !== 8) {
      throw new Error(`${name} row ${i} must have 8 elements (got ${table[i]?.length || "invalid"})`);
    }

    for (let j = 0; j < 8; j++) {
      const value = table[i][j];
      if (typeof value !== "number" || Number.isNaN(value) || value <= 0 || value > 255) {
        throw new Error(`${name} element [${i}][${j}] must be a positive number ≤ 255 (got ${value})`);
      }
    }
  }
}

/**
 * Validates JPEG quality factor.
 *
 * @param {number} quality - Quality factor (1-100)
 * @throws {Error} If quality is invalid
 */
export function validateQuality(quality) {
  if (typeof quality !== "number" || Number.isNaN(quality) || quality < 1 || quality > 100) {
    throw new Error(`Quality must be a number between 1 and 100 (got ${quality})`);
  }
}

/**
 * Scales a quantization table based on quality factor.
 *
 * Quality scaling formula from IJG (Independent JPEG Group):
 * - Quality 50: Use standard table as-is
 * - Quality > 50: Scale down (better quality, larger files)
 * - Quality < 50: Scale up (worse quality, smaller files)
 *
 * @param {number[][]} baseTable - Base quantization table (8x8)
 * @param {number} quality - Quality factor (1-100)
 * @returns {number[][]} Scaled quantization table
 * @throws {Error} If inputs are invalid
 *
 * @example
 * const table = scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, 75);
 * // Returns table with values scaled for quality 75
 */
export function scaleQuantizationTable(baseTable, quality) {
  validateQuantizationTable(baseTable, "Base quantization table");
  validateQuality(quality);

  // IJG quality scaling formula
  let scaleFactor;
  if (quality < 50) {
    scaleFactor = 5000 / quality;
  } else {
    scaleFactor = 200 - quality * 2;
  }

  const scaledTable = Array(8)
    .fill()
    .map(() => Array(8).fill(0));

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      // Scale and clamp to valid range [1, 255]
      let scaledValue = Math.floor((baseTable[i][j] * scaleFactor + 50) / 100);
      scaledValue = Math.max(1, Math.min(255, scaledValue));
      scaledTable[i][j] = scaledValue;
    }
  }

  return scaledTable;
}

/**
 * Creates quantization tables for a given quality.
 * Returns both luminance and chrominance tables.
 *
 * @param {number} quality - Quality factor (1-100)
 * @returns {{
 *   luminance: number[][],
 *   chrominance: number[][]
 * }} Quantization tables for Y and CbCr channels
 * @throws {Error} If quality is invalid
 *
 * @example
 * const tables = createQuantizationTables(85);
 * const yTable = tables.luminance;
 * const cbcrTable = tables.chrominance;
 */
export function createQuantizationTables(quality) {
  validateQuality(quality);

  return {
    luminance: scaleQuantizationTable(STANDARD_LUMINANCE_TABLE, quality),
    chrominance: scaleQuantizationTable(STANDARD_CHROMINANCE_TABLE, quality),
  };
}

/**
 * Validates a DCT coefficient block.
 *
 * @param {number[][]} block - 8x8 DCT coefficient block
 * @param {string} [name="DCT block"] - Block name for error messages
 * @throws {Error} If block is invalid
 */
function validateDCTBlock(block, name = "DCT block") {
  if (!Array.isArray(block) || block.length !== 8) {
    throw new Error(`${name} must be an 8x8 array (got ${block?.length || "invalid"} rows)`);
  }

  for (let i = 0; i < 8; i++) {
    if (!Array.isArray(block[i]) || block[i].length !== 8) {
      throw new Error(`${name} row ${i} must have 8 elements (got ${block[i]?.length || "invalid"})`);
    }

    for (let j = 0; j < 8; j++) {
      if (typeof block[i][j] !== "number" || Number.isNaN(block[i][j])) {
        throw new Error(`${name} element [${i}][${j}] must be a valid number (got ${block[i][j]})`);
      }
    }
  }
}

/**
 * Quantizes DCT coefficients using a quantization table.
 * This is the lossy compression step that reduces file size.
 *
 * @param {number[][]} dctBlock - 8x8 DCT coefficient block
 * @param {number[][]} quantTable - 8x8 quantization table
 * @returns {number[][]} 8x8 quantized coefficient block
 * @throws {Error} If inputs are invalid
 *
 * @example
 * const dctCoeffs = forwardDCT(pixelBlock);
 * const quantized = quantizeBlock(dctCoeffs, luminanceTable);
 * // quantized contains integer coefficients ready for entropy coding
 */
export function quantizeBlock(dctBlock, quantTable) {
  validateDCTBlock(dctBlock, "DCT block");
  validateQuantizationTable(quantTable, "Quantization table");

  const quantizedBlock = Array(8)
    .fill()
    .map(() => Array(8).fill(0));

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      // Quantize: divide by quantization value and round
      quantizedBlock[i][j] = Math.round(dctBlock[i][j] / quantTable[i][j]);
    }
  }

  return quantizedBlock;
}

/**
 * Dequantizes coefficients using a quantization table.
 * This reverses quantization during JPEG decoding.
 *
 * @param {number[][]} quantizedBlock - 8x8 quantized coefficient block
 * @param {number[][]} quantTable - 8x8 quantization table
 * @returns {number[][]} 8x8 dequantized coefficient block
 * @throws {Error} If inputs are invalid
 *
 * @example
 * const dequantized = dequantizeBlock(quantizedCoeffs, luminanceTable);
 * const reconstructed = inverseDCT(dequantized);
 * // reconstructed contains approximate pixel values
 */
export function dequantizeBlock(quantizedBlock, quantTable) {
  validateDCTBlock(quantizedBlock, "Quantized block");
  validateQuantizationTable(quantTable, "Quantization table");

  const dequantizedBlock = Array(8)
    .fill()
    .map(() => Array(8).fill(0));

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      // Dequantize: multiply by quantization value
      dequantizedBlock[i][j] = quantizedBlock[i][j] * quantTable[i][j];
    }
  }

  return dequantizedBlock;
}

/**
 * Analyzes quantization table properties.
 * Useful for understanding compression characteristics.
 *
 * @param {number[][]} quantTable - 8x8 quantization table
 * @returns {{
 *   averageValue: number,
 *   minValue: number,
 *   maxValue: number,
 *   dcValue: number,
 *   highFreqAverage: number,
 *   compressionRatio: number
 * }} Analysis of quantization table properties
 */
export function analyzeQuantizationTable(quantTable) {
  validateQuantizationTable(quantTable, "Quantization table");

  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let highFreqSum = 0;
  let highFreqCount = 0;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const value = quantTable[i][j];
      sum += value;
      min = Math.min(min, value);
      max = Math.max(max, value);

      // High frequency coefficients (excluding DC and low frequencies)
      if (i + j > 2) {
        highFreqSum += value;
        highFreqCount++;
      }
    }
  }

  const averageValue = sum / 64;
  const highFreqAverage = highFreqCount > 0 ? highFreqSum / highFreqCount : 0;

  // Estimate compression ratio based on quantization aggressiveness
  const compressionRatio = averageValue / 16; // Relative to standard table

  return {
    averageValue,
    minValue: min,
    maxValue: max,
    dcValue: quantTable[0][0], // DC coefficient quantization
    highFreqAverage,
    compressionRatio,
  };
}

/**
 * Creates a custom quantization table with specified characteristics.
 * Useful for specialized compression requirements.
 *
 * @param {Object} options - Table generation options
 * @param {number} [options.dcValue=16] - DC coefficient quantization value
 * @param {number} [options.baseValue=16] - Base quantization value
 * @param {number} [options.highFreqMultiplier=4] - Multiplier for high frequencies
 * @param {boolean} [options.perceptual=true] - Use perceptual weighting
 * @returns {number[][]} 8x8 custom quantization table
 *
 * @example
 * const customTable = createCustomQuantizationTable({
 *   dcValue: 8,        // Better DC preservation
 *   baseValue: 12,     // Lower base quantization
 *   highFreqMultiplier: 6  // More aggressive high-freq compression
 * });
 */
export function createCustomQuantizationTable(options = {}) {
  const { dcValue = 16, baseValue = 16, highFreqMultiplier = 4, perceptual = true } = options;

  if (dcValue <= 0 || dcValue > 255) {
    throw new Error(`DC value must be between 1 and 255 (got ${dcValue})`);
  }
  if (baseValue <= 0 || baseValue > 255) {
    throw new Error(`Base value must be between 1 and 255 (got ${baseValue})`);
  }
  if (highFreqMultiplier < 1 || highFreqMultiplier > 10) {
    throw new Error(`High frequency multiplier must be between 1 and 10 (got ${highFreqMultiplier})`);
  }

  const table = Array(8)
    .fill()
    .map(() => Array(8).fill(0));

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (i === 0 && j === 0) {
        // DC coefficient
        table[i][j] = dcValue;
      } else {
        // AC coefficients
        let value = baseValue;

        if (perceptual) {
          // Apply perceptual weighting (higher frequencies get larger values)
          const frequency = Math.sqrt(i * i + j * j);
          const weight = 1 + (frequency / 8) * (highFreqMultiplier - 1);
          value = Math.round(baseValue * weight);
        } else {
          // Simple frequency-based scaling
          const frequency = i + j;
          if (frequency > 4) {
            value = Math.round(baseValue * highFreqMultiplier);
          }
        }

        table[i][j] = Math.max(1, Math.min(255, value));
      }
    }
  }

  return table;
}
