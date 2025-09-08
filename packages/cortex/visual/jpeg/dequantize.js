/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG coefficient dequantization implementation.
 *
 * Implements ITU-T T.81 Section A.3.4 coefficient dequantization by multiplying
 * quantized DCT coefficients with their corresponding quantization table values.
 * Supports progressive JPEG, spectral selection, and efficient block processing
 * with overflow protection and memory optimization.
 */

/**
 * Standard 8x8 DCT block size.
 * All JPEG coefficient blocks are 8x8 = 64 coefficients.
 *
 * @type {number}
 */
export const BLOCK_SIZE = 64;

/**
 * Maximum valid DCT coefficient value.
 * ITU-T T.81 Annex A constraint for 8-bit precision.
 *
 * @type {number}
 */
export const MAX_DCT_COEFFICIENT = 2047;

/**
 * Minimum valid DCT coefficient value.
 * ITU-T T.81 Annex A constraint for 8-bit precision.
 *
 * @type {number}
 */
export const MIN_DCT_COEFFICIENT = -2048;

/**
 * Zigzag scan order for 8x8 DCT blocks.
 * ITU-T T.81 Figure A.6 - natural order to zigzag order mapping.
 *
 * @type {number[]}
 */
export const ZIGZAG_ORDER = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47,
  55, 62, 63,
];

/**
 * Clamp DCT coefficient to valid range.
 * Prevents overflow/underflow in dequantized coefficients.
 *
 * @param {number} value - Coefficient value to clamp
 * @returns {number} Clamped coefficient within valid DCT range
 */
export function clampDCTCoefficient(value) {
  if (value > MAX_DCT_COEFFICIENT) {
    return MAX_DCT_COEFFICIENT;
  }
  if (value < MIN_DCT_COEFFICIENT) {
    return MIN_DCT_COEFFICIENT;
  }
  return value;
}

/**
 * Dequantize a single 8x8 coefficient block.
 * Multiplies each quantized coefficient by its quantization table value.
 *
 * @param {number[]} quantizedBlock - 64-element array of quantized coefficients
 * @param {number[]} quantizationTable - 64-element quantization table in zigzag order
 * @param {number} [startCoeff=0] - Starting coefficient index (for progressive)
 * @param {number} [endCoeff=63] - Ending coefficient index (for progressive)
 * @param {boolean} [inPlace=true] - Whether to modify block in-place or create copy
 * @returns {number[]} Dequantized coefficient block
 * @throws {Error} If block or table is invalid
 */
export function dequantizeBlock(quantizedBlock, quantizationTable, startCoeff = 0, endCoeff = 63, inPlace = true) {
  if (!Array.isArray(quantizedBlock) || quantizedBlock.length !== BLOCK_SIZE) {
    throw new Error("Expected 64-element quantized coefficient block");
  }

  if (!Array.isArray(quantizationTable) || quantizationTable.length !== BLOCK_SIZE) {
    throw new Error("Expected 64-element quantization table");
  }

  if (startCoeff < 0 || startCoeff > 63 || endCoeff < startCoeff || endCoeff > 63) {
    throw new Error(`Invalid coefficient range: ${startCoeff}-${endCoeff}`);
  }

  // Create output block (copy or in-place)
  const dequantizedBlock = inPlace ? quantizedBlock : [...quantizedBlock];

  // Dequantize coefficients in specified range
  for (let i = startCoeff; i <= endCoeff; i++) {
    const quantizedValue = quantizedBlock[i];
    const quantizationValue = quantizationTable[i];

    // Skip zero coefficients for efficiency
    if (quantizedValue === 0) {
      dequantizedBlock[i] = 0;
      continue;
    }

    // Validate quantization table value
    if (quantizationValue <= 0) {
      throw new Error(`Invalid quantization value ${quantizationValue} at index ${i}`);
    }

    // Perform dequantization with overflow protection
    const dequantizedValue = quantizedValue * quantizationValue;
    dequantizedBlock[i] = clampDCTCoefficient(dequantizedValue);
  }

  return dequantizedBlock;
}

/**
 * Dequantize multiple coefficient blocks for a component.
 * Processes array of 8x8 blocks using the same quantization table.
 *
 * @param {number[][]} quantizedBlocks - Array of 64-element coefficient blocks
 * @param {number[]} quantizationTable - 64-element quantization table in zigzag order
 * @param {number} [startCoeff=0] - Starting coefficient index (for progressive)
 * @param {number} [endCoeff=63] - Ending coefficient index (for progressive)
 * @param {boolean} [inPlace=true] - Whether to modify blocks in-place
 * @returns {number[][]} Array of dequantized coefficient blocks
 * @throws {Error} If blocks or table is invalid
 */
export function dequantizeBlocks(quantizedBlocks, quantizationTable, startCoeff = 0, endCoeff = 63, inPlace = true) {
  if (!Array.isArray(quantizedBlocks)) {
    throw new Error("Expected array of quantized blocks");
  }

  if (quantizedBlocks.length === 0) {
    return [];
  }

  // Validate quantization table once
  if (!Array.isArray(quantizationTable) || quantizationTable.length !== BLOCK_SIZE) {
    throw new Error("Expected 64-element quantization table");
  }

  // Process each block
  const dequantizedBlocks = inPlace ? quantizedBlocks : [];

  for (let blockIndex = 0; blockIndex < quantizedBlocks.length; blockIndex++) {
    const quantizedBlock = quantizedBlocks[blockIndex];

    if (!inPlace) {
      dequantizedBlocks[blockIndex] = dequantizeBlock(quantizedBlock, quantizationTable, startCoeff, endCoeff, false);
    } else {
      dequantizeBlock(quantizedBlock, quantizationTable, startCoeff, endCoeff, true);
    }
  }

  return inPlace ? quantizedBlocks : dequantizedBlocks;
}

/**
 * Convert quantization table from zigzag order to natural 8x8 matrix order.
 * Useful for 2D DCT operations that expect natural coefficient ordering.
 *
 * @param {number[]} zigzagTable - 64-element table in zigzag order
 * @returns {number[][]} 8x8 matrix in natural order
 * @throws {Error} If table is invalid
 */
export function zigzagToMatrix(zigzagTable) {
  if (!Array.isArray(zigzagTable) || zigzagTable.length !== BLOCK_SIZE) {
    throw new Error("Expected 64-element zigzag table");
  }

  const matrix = Array.from({ length: 8 }, () => new Array(8));

  for (let i = 0; i < BLOCK_SIZE; i++) {
    const naturalIndex = ZIGZAG_ORDER[i];
    const row = Math.floor(naturalIndex / 8);
    const col = naturalIndex % 8;
    matrix[row][col] = zigzagTable[i];
  }

  return matrix;
}

/**
 * Convert 8x8 matrix to zigzag order.
 * Inverse of zigzagToMatrix for table preparation.
 *
 * @param {number[][]} matrix - 8x8 coefficient matrix
 * @returns {number[]} 64-element array in zigzag order
 * @throws {Error} If matrix is invalid
 */
export function matrixToZigzag(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== 8) {
    throw new Error("Expected 8x8 matrix");
  }

  for (let i = 0; i < 8; i++) {
    if (!Array.isArray(matrix[i]) || matrix[i].length !== 8) {
      throw new Error("Expected 8x8 matrix");
    }
  }

  const zigzagArray = new Array(BLOCK_SIZE);

  for (let i = 0; i < BLOCK_SIZE; i++) {
    const naturalIndex = ZIGZAG_ORDER[i];
    const row = Math.floor(naturalIndex / 8);
    const col = naturalIndex % 8;
    zigzagArray[i] = matrix[row][col];
  }

  return zigzagArray;
}

/**
 * Dequantize coefficient block with 2D quantization matrix.
 * Alternative interface for operations that work with 2D matrices.
 *
 * @param {number[]} quantizedBlock - 64-element coefficient block in zigzag order
 * @param {number[][]} quantizationMatrix - 8x8 quantization matrix in natural order
 * @param {number} [startCoeff=0] - Starting coefficient index
 * @param {number} [endCoeff=63] - Ending coefficient index
 * @param {boolean} [inPlace=true] - Whether to modify block in-place
 * @returns {number[]} Dequantized coefficient block in zigzag order
 * @throws {Error} If inputs are invalid
 */
export function dequantizeBlockMatrix(
  quantizedBlock,
  quantizationMatrix,
  startCoeff = 0,
  endCoeff = 63,
  inPlace = true
) {
  // Convert matrix to zigzag order
  const quantizationTable = matrixToZigzag(quantizationMatrix);

  // Use standard block dequantization
  return dequantizeBlock(quantizedBlock, quantizationTable, startCoeff, endCoeff, inPlace);
}

/**
 * Progressive dequantization state manager.
 * Handles multi-pass progressive JPEG coefficient refinement.
 */
export class ProgressiveDequantizer {
  /**
   * Create progressive dequantizer.
   *
   * @param {number[]} quantizationTable - 64-element quantization table
   * @param {number} spectralStart - Start of spectral selection (Ss)
   * @param {number} spectralEnd - End of spectral selection (Se)
   * @param {number} approximationHigh - Successive approximation high bit (Ah)
   * @param {number} approximationLow - Successive approximation low bit (Al)
   */
  constructor(quantizationTable, spectralStart, spectralEnd, approximationHigh, approximationLow) {
    if (!Array.isArray(quantizationTable) || quantizationTable.length !== BLOCK_SIZE) {
      throw new Error("Expected 64-element quantization table");
    }

    if (spectralStart < 0 || spectralStart > 63 || spectralEnd < spectralStart || spectralEnd > 63) {
      throw new Error(`Invalid spectral range: ${spectralStart}-${spectralEnd}`);
    }

    if (approximationHigh < 0 || approximationHigh > 13 || approximationLow < 0 || approximationLow > 13) {
      throw new Error(`Invalid approximation bits: Ah=${approximationHigh}, Al=${approximationLow}`);
    }

    /** @type {number[]} */
    this.quantizationTable = [...quantizationTable];
    /** @type {number} */
    this.spectralStart = spectralStart;
    /** @type {number} */
    this.spectralEnd = spectralEnd;
    /** @type {number} */
    this.approximationHigh = approximationHigh;
    /** @type {number} */
    this.approximationLow = approximationLow;
    /** @type {boolean} */
    this.isFirstScan = approximationHigh === 0;
    /** @type {boolean} */
    this.isRefinementScan = approximationHigh > approximationLow;
  }

  /**
   * Dequantize block for current progressive scan.
   * Handles first scan vs refinement scan logic.
   *
   * @param {number[]} quantizedBlock - 64-element coefficient block
   * @param {boolean} [inPlace=true] - Whether to modify block in-place
   * @returns {number[]} Dequantized coefficient block
   */
  dequantizeProgressiveBlock(quantizedBlock, inPlace = true) {
    if (this.isFirstScan) {
      // First scan: normal dequantization with bit shift
      const dequantizedBlock = dequantizeBlock(
        quantizedBlock,
        this.quantizationTable,
        this.spectralStart,
        this.spectralEnd,
        inPlace
      );

      // Apply successive approximation bit shift
      if (this.approximationLow > 0) {
        for (let i = this.spectralStart; i <= this.spectralEnd; i++) {
          dequantizedBlock[i] <<= this.approximationLow;
        }
      }

      return dequantizedBlock;
    }

    // Refinement scan: apply refinement bits
    const dequantizedBlock = inPlace ? quantizedBlock : [...quantizedBlock];

    for (let i = this.spectralStart; i <= this.spectralEnd; i++) {
      const refinementBit = quantizedBlock[i];
      if (refinementBit !== 0) {
        // Apply refinement bit at appropriate position
        const bitPosition = this.approximationLow;
        const refinementValue = refinementBit << bitPosition;
        dequantizedBlock[i] = refinementValue;
      } else {
        dequantizedBlock[i] = 0;
      }
    }

    return dequantizedBlock;
  }

  /**
   * Get summary of progressive dequantizer state.
   *
   * @returns {Object} Summary information
   */
  getSummary() {
    return {
      spectralRange: `${this.spectralStart}-${this.spectralEnd}`,
      approximationBits: `Ah=${this.approximationHigh}, Al=${this.approximationLow}`,
      scanType: this.isFirstScan ? "first" : "refinement",
      coefficientCount: this.spectralEnd - this.spectralStart + 1,
      description: `Progressive dequantizer: ${this.spectralStart}-${this.spectralEnd} (${this.isFirstScan ? "first" : "refinement"} scan)`,
    };
  }
}

/**
 * Get summary information about dequantization operation.
 * Provides debugging and analysis information.
 *
 * @param {number[]} quantizationTable - Quantization table used
 * @param {number} blockCount - Number of blocks processed
 * @param {number} [startCoeff=0] - Starting coefficient index
 * @param {number} [endCoeff=63] - Ending coefficient index
 * @returns {Object} Summary information
 */
export function getDequantizationSummary(quantizationTable, blockCount, startCoeff = 0, endCoeff = 63) {
  if (!Array.isArray(quantizationTable) || quantizationTable.length !== BLOCK_SIZE) {
    throw new TypeError("Expected 64-element quantization table");
  }

  // Analyze quantization table characteristics
  const nonZeroValues = quantizationTable.filter((val) => val > 0);
  const minValue = Math.min(...nonZeroValues);
  const maxValue = Math.max(...nonZeroValues);
  const avgValue = nonZeroValues.reduce((sum, val) => sum + val, 0) / nonZeroValues.length;

  // Calculate coefficient range
  const coefficientCount = endCoeff - startCoeff + 1;
  const totalCoefficients = blockCount * coefficientCount;

  return {
    blockCount,
    coefficientRange: `${startCoeff}-${endCoeff}`,
    coefficientCount,
    totalCoefficients,
    quantizationStats: {
      minValue: Math.round(minValue),
      maxValue: Math.round(maxValue),
      avgValue: Math.round(avgValue * 100) / 100,
      nonZeroCount: nonZeroValues.length,
    },
    description: `Dequantization: ${blockCount} block${blockCount === 1 ? "" : "s"}, coefficients ${startCoeff}-${endCoeff}`,
  };
}
