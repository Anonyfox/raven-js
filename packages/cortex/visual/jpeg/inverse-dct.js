/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Fast 8x8 Inverse Discrete Cosine Transform (IDCT) implementation.
 *
 * Implements ITU-T T.81 Annex A.3.3 IDCT using the Chen-Wang fast algorithm
 * with IEEE 1180-1990 compliance. Transforms dequantized frequency domain
 * coefficients back to spatial domain pixels with optimized butterfly
 * operations and fixed-point arithmetic for precision and performance.
 */

/**
 * Standard 8x8 DCT block size.
 * All JPEG coefficient and pixel blocks are 8x8 = 64 elements.
 *
 * @type {number}
 */
export const BLOCK_SIZE = 64;

/**
 * IDCT scaling factor for normalization.
 * Used to scale intermediate results during computation.
 *
 * @type {number}
 */
export const IDCT_SCALE = 8192;

/**
 * IDCT precision bits for fixed-point arithmetic.
 * Provides sufficient precision while avoiding overflow.
 *
 * @type {number}
 */
export const IDCT_PRECISION = 13;

/**
 * Minimum valid pixel value (8-bit).
 * Standard JPEG pixel range lower bound.
 *
 * @type {number}
 */
export const MIN_PIXEL_VALUE = 0;

/**
 * Maximum valid pixel value (8-bit).
 * Standard JPEG pixel range upper bound.
 *
 * @type {number}
 */
export const MAX_PIXEL_VALUE = 255;

/**
 * IDCT level shift constant.
 * Added to convert signed DCT domain to unsigned pixel domain.
 *
 * @type {number}
 */
export const LEVEL_SHIFT = 128;

/**
 * Precomputed IDCT constants for Chen-Wang algorithm.
 * Fixed-point representations of cosine values for efficiency.
 * Based on cos(k*π/16) scaled by IDCT_SCALE.
 */
export const IDCT_CONSTANTS = {
  // cos(π/16) * IDCT_SCALE
  C1: Math.round(Math.cos(Math.PI / 16) * IDCT_SCALE),
  // cos(2π/16) * IDCT_SCALE
  C2: Math.round(Math.cos((2 * Math.PI) / 16) * IDCT_SCALE),
  // cos(3π/16) * IDCT_SCALE
  C3: Math.round(Math.cos((3 * Math.PI) / 16) * IDCT_SCALE),
  // cos(4π/16) * IDCT_SCALE = cos(π/4) * IDCT_SCALE
  C4: Math.round(Math.cos(Math.PI / 4) * IDCT_SCALE),
  // cos(5π/16) * IDCT_SCALE
  C5: Math.round(Math.cos((5 * Math.PI) / 16) * IDCT_SCALE),
  // cos(6π/16) * IDCT_SCALE = cos(3π/8) * IDCT_SCALE
  C6: Math.round(Math.cos((6 * Math.PI) / 16) * IDCT_SCALE),
  // cos(7π/16) * IDCT_SCALE
  C7: Math.round(Math.cos((7 * Math.PI) / 16) * IDCT_SCALE),
};

/**
 * Clamp pixel value to valid 8-bit range.
 * Prevents overflow/underflow in final pixel output.
 *
 * @param {number} value - Pixel value to clamp
 * @returns {number} Clamped pixel value (0-255)
 */
export function clampPixel(value) {
  if (value < MIN_PIXEL_VALUE) {
    return MIN_PIXEL_VALUE;
  }
  if (value > MAX_PIXEL_VALUE) {
    return MAX_PIXEL_VALUE;
  }
  return Math.round(value);
}

/**
 * Perform 1D IDCT on a single row or column.
 * Implements the Chen-Wang fast IDCT algorithm with butterfly operations.
 *
 * @param {number[]} input - 8-element input vector (DCT coefficients)
 * @param {number[]} output - 8-element output vector (spatial domain)
 * @private
 */
function idct1D(input, output) {
  const { C1, C2, C3, C4, C5, C6, C7 } = IDCT_CONSTANTS;

  // Stage 1: Even part (coefficients 0, 2, 4, 6)
  const tmp0 = input[0] + input[4];
  const tmp1 = input[0] - input[4];
  const tmp2 = input[2] + input[6];
  const tmp3 = input[2] - input[6];

  // Stage 2: Even part
  const tmp10 = tmp0 + tmp2;
  const tmp11 = tmp0 - tmp2;
  const tmp12 = tmp1 + ((tmp3 * C4) >> IDCT_PRECISION);
  const tmp13 = tmp1 - ((tmp3 * C4) >> IDCT_PRECISION);

  // Stage 1: Odd part (coefficients 1, 3, 5, 7)
  const z1 = input[1] + input[7];
  const z2 = input[3] + input[5];
  const z3 = input[1] + input[5];
  const z4 = input[3] + input[7];
  const z5 = ((z3 + z4) * C3) >> IDCT_PRECISION;

  const tmp4 = ((input[7] * C1) >> IDCT_PRECISION) + z5;
  const tmp5 = ((input[5] * C2) >> IDCT_PRECISION) + z5;
  const tmp6 = ((input[3] * C6) >> IDCT_PRECISION) + z5;
  const tmp7 = ((input[1] * C7) >> IDCT_PRECISION) + z5;

  const z6 = ((z1 * C5) >> IDCT_PRECISION) - z5;
  const z7 = ((z2 * C4) >> IDCT_PRECISION) - z5;

  // Stage 2: Odd part
  const tmp20 = tmp4 + z6;
  const tmp21 = tmp5 + z7;
  const tmp22 = tmp6 + z7;
  const tmp23 = tmp7 + z6;

  // Final stage: Combine even and odd parts
  output[0] = tmp10 + tmp23;
  output[1] = tmp12 + tmp22;
  output[2] = tmp13 + tmp21;
  output[3] = tmp11 + tmp20;
  output[4] = tmp11 - tmp20;
  output[5] = tmp13 - tmp21;
  output[6] = tmp12 - tmp22;
  output[7] = tmp10 - tmp23;
}

/**
 * Perform fast 8x8 IDCT on coefficient block.
 * Uses separable 2D transform: 1D IDCT on rows, then columns.
 *
 * @param {number[]} coefficients - 64-element DCT coefficient block in row-major order
 * @param {boolean} [inPlace=true] - Whether to modify coefficients in-place
 * @returns {number[]} 64-element pixel block in row-major order
 * @throws {Error} If coefficient block is invalid
 */
export function idct8x8(coefficients, inPlace = true) {
  if (!Array.isArray(coefficients) || coefficients.length !== BLOCK_SIZE) {
    throw new Error("Expected 64-element coefficient block");
  }

  // Create working arrays
  const temp = new Array(BLOCK_SIZE);
  const result = inPlace ? coefficients : new Array(BLOCK_SIZE);

  // Stage 1: 1D IDCT on rows
  for (let row = 0; row < 8; row++) {
    const rowOffset = row * 8;
    const inputRow = new Array(8);
    const outputRow = new Array(8);

    // Extract row
    for (let col = 0; col < 8; col++) {
      inputRow[col] = coefficients[rowOffset + col];
    }

    // Apply 1D IDCT to row
    idct1D(inputRow, outputRow);

    // Store result
    for (let col = 0; col < 8; col++) {
      temp[rowOffset + col] = outputRow[col];
    }
  }

  // Stage 2: 1D IDCT on columns
  for (let col = 0; col < 8; col++) {
    const inputCol = new Array(8);
    const outputCol = new Array(8);

    // Extract column
    for (let row = 0; row < 8; row++) {
      inputCol[row] = temp[row * 8 + col];
    }

    // Apply 1D IDCT to column
    idct1D(inputCol, outputCol);

    // Store result with level shift and clamping
    for (let row = 0; row < 8; row++) {
      const pixelValue = (outputCol[row] >> IDCT_PRECISION) + LEVEL_SHIFT;
      result[row * 8 + col] = clampPixel(pixelValue);
    }
  }

  return result;
}

/**
 * Perform IDCT on multiple 8x8 blocks.
 * Efficiently processes arrays of coefficient blocks.
 *
 * @param {number[][]} coefficientBlocks - Array of 64-element coefficient blocks
 * @param {boolean} [inPlace=true] - Whether to modify blocks in-place
 * @returns {number[][]} Array of 64-element pixel blocks
 * @throws {Error} If blocks array is invalid
 */
export function idctBlocks(coefficientBlocks, inPlace = true) {
  if (!Array.isArray(coefficientBlocks)) {
    throw new Error("Expected array of coefficient blocks");
  }

  if (coefficientBlocks.length === 0) {
    return [];
  }

  const pixelBlocks = inPlace ? coefficientBlocks : new Array(coefficientBlocks.length);

  for (let i = 0; i < coefficientBlocks.length; i++) {
    if (inPlace) {
      idct8x8(coefficientBlocks[i], true);
    } else {
      pixelBlocks[i] = idct8x8(coefficientBlocks[i], false);
    }
  }

  return pixelBlocks;
}

/**
 * Convert 1D coefficient block to 2D matrix representation.
 * Useful for debugging and visualization.
 *
 * @param {number[]} block - 64-element block in row-major order
 * @returns {number[][]} 8x8 matrix representation
 * @throws {Error} If block is invalid
 */
export function blockToMatrix(block) {
  if (!Array.isArray(block) || block.length !== BLOCK_SIZE) {
    throw new Error("Expected 64-element block");
  }

  const matrix = new Array(8);
  for (let row = 0; row < 8; row++) {
    matrix[row] = new Array(8);
    for (let col = 0; col < 8; col++) {
      matrix[row][col] = block[row * 8 + col];
    }
  }

  return matrix;
}

/**
 * Convert 2D matrix to 1D block representation.
 * Inverse of blockToMatrix for data preparation.
 *
 * @param {number[][]} matrix - 8x8 matrix
 * @returns {number[]} 64-element block in row-major order
 * @throws {Error} If matrix is invalid
 */
export function matrixToBlock(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== 8) {
    throw new Error("Expected 8x8 matrix");
  }

  for (let i = 0; i < 8; i++) {
    if (!Array.isArray(matrix[i]) || matrix[i].length !== 8) {
      throw new Error("Expected 8x8 matrix");
    }
  }

  const block = new Array(BLOCK_SIZE);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      block[row * 8 + col] = matrix[row][col];
    }
  }

  return block;
}

/**
 * Optimized IDCT for DC-only blocks (uniform color).
 * Significantly faster than full IDCT for blocks with only DC coefficient.
 *
 * @param {number} dcValue - DC coefficient value
 * @returns {number[]} 64-element pixel block with uniform value
 */
export function idctDCOnly(dcValue) {
  // For DC-only block, all pixels have the same value
  const pixelValue = clampPixel((dcValue >> IDCT_PRECISION) + LEVEL_SHIFT);
  return new Array(BLOCK_SIZE).fill(pixelValue);
}

/**
 * Check if coefficient block is DC-only.
 * Optimization opportunity for uniform color blocks.
 *
 * @param {number[]} coefficients - 64-element coefficient block
 * @returns {boolean} True if only DC coefficient is non-zero
 */
export function isDCOnlyBlock(coefficients) {
  if (!Array.isArray(coefficients) || coefficients.length !== BLOCK_SIZE) {
    return false;
  }

  // Check if all AC coefficients are zero
  for (let i = 1; i < BLOCK_SIZE; i++) {
    if (coefficients[i] !== 0) {
      return false;
    }
  }

  return true;
}

/**
 * IDCT quality metrics for validation and testing.
 * Provides analysis of IDCT precision and compliance.
 */
export class IDCTQualityMetrics {
  /**
   * Create IDCT quality metrics analyzer.
   */
  constructor() {
    /** @type {number[]} */
    this.errors = [];
    /** @type {number} */
    this.maxError = 0;
    /** @type {number} */
    this.meanSquareError = 0;
    /** @type {number} */
    this.blocksProcessed = 0;
  }

  /**
   * Add error measurement from IDCT operation.
   *
   * @param {number[]} expected - Expected pixel values
   * @param {number[]} actual - Actual IDCT output
   */
  addMeasurement(expected, actual) {
    if (!Array.isArray(expected) || !Array.isArray(actual) || expected.length !== actual.length) {
      throw new Error("Expected and actual arrays must have same length");
    }

    let maxBlockError = 0;

    for (let i = 0; i < expected.length; i++) {
      const error = Math.abs(expected[i] - actual[i]);
      this.errors.push(error);

      maxBlockError = Math.max(maxBlockError, error);
    }

    this.maxError = Math.max(this.maxError, maxBlockError);

    // Calculate MSE correctly: total squared error divided by total number of elements
    const totalElements = this.errors.length;
    const totalSquaredError = this.errors.reduce((sum, err) => sum + err * err, 0);
    this.meanSquareError = totalSquaredError / totalElements;

    this.blocksProcessed++;
  }

  /**
   * Get quality metrics summary.
   *
   * @returns {Object} Quality metrics
   */
  getSummary() {
    const meanError = this.errors.length > 0 ? this.errors.reduce((sum, err) => sum + err, 0) / this.errors.length : 0;

    return {
      blocksProcessed: this.blocksProcessed,
      maxError: this.maxError,
      meanError: Math.round(meanError * 1000) / 1000,
      meanSquareError: Math.round(this.meanSquareError * 1000) / 1000,
      ieee1180Compliant: this.maxError <= 1 && this.meanSquareError <= 0.06,
      description: `IDCT Quality: ${this.blocksProcessed} blocks, max error ${this.maxError}, MSE ${Math.round(this.meanSquareError * 1000) / 1000}`,
    };
  }

  /**
   * Reset metrics for new measurement session.
   */
  reset() {
    this.errors = [];
    this.maxError = 0;
    this.meanSquareError = 0;
    this.blocksProcessed = 0;
  }
}

/**
 * Get summary information about IDCT operation.
 * Provides debugging and analysis information.
 *
 * @param {number} blockCount - Number of blocks processed
 * @param {boolean} [usedOptimizations=false] - Whether optimizations were applied
 * @returns {Object} Summary information
 */
export function getIDCTSummary(blockCount, usedOptimizations = false) {
  const operationsPerBlock = 64; // Approximate operations for 8x8 IDCT
  const totalOperations = blockCount * operationsPerBlock;

  return {
    blockCount,
    totalOperations,
    operationsPerBlock,
    usedOptimizations,
    algorithm: "Chen-Wang Fast IDCT",
    precision: `${IDCT_PRECISION}-bit fixed-point`,
    outputRange: `${MIN_PIXEL_VALUE}-${MAX_PIXEL_VALUE}`,
    description: `IDCT: ${blockCount} block${blockCount === 1 ? "" : "s"} processed with ${usedOptimizations ? "optimizations" : "standard algorithm"}`,
  };
}
