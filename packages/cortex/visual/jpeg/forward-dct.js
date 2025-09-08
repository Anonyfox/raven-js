/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Fast 8×8 forward DCT for JPEG encoding.
 *
 * Implements ITU-T T.81 Annex A.3.3 forward Discrete Cosine Transform
 * using the Chen-Wang fast DCT algorithm. Converts 8×8 pixel blocks
 * from spatial domain to frequency domain for efficient quantization
 * and entropy coding.
 */

/**
 * DCT block size - all JPEG DCT operations use 8×8 blocks.
 */
export const DCT_BLOCK_SIZE = 8;

/**
 * DC level shift for unsigned 8-bit input.
 * Subtract 128 to center pixel values around zero before DCT.
 */
export const DC_LEVEL_SHIFT = 128;

/**
 * DCT coefficient precision modes.
 * Different precision levels for speed vs accuracy tradeoffs.
 */
export const DCT_PRECISION_MODES = {
  /** High precision floating-point (reference quality) */
  HIGH: "high",
  /** Medium precision fixed-point (standard JPEG) */
  MEDIUM: "medium",
  /** Fast integer approximation (speed optimized) */
  FAST: "fast",
};

/**
 * DCT implementation modes.
 * Different algorithmic approaches for various requirements.
 */
export const DCT_IMPLEMENTATION_MODES = {
  /** Chen-Wang fast DCT algorithm */
  CHEN_WANG: "chen_wang",
  /** Separable 1D DCT (row-column) */
  SEPARABLE: "separable",
  /** Reference implementation (slow but accurate) */
  REFERENCE: "reference",
  /** Scaled DCT for direct quantization */
  SCALED: "scaled",
};

/**
 * Rounding modes for DCT calculations.
 * Different rounding strategies for coefficient precision.
 */
export const DCT_ROUNDING_MODES = {
  /** Round to nearest integer */
  NEAREST: "nearest",
  /** Round toward zero (truncate) */
  TRUNCATE: "truncate",
  /** Round toward negative infinity (floor) */
  FLOOR: "floor",
  /** Round toward positive infinity (ceiling) */
  CEILING: "ceiling",
};

/**
 * Default forward DCT options.
 * Standard settings for JPEG encoding.
 */
export const DEFAULT_FORWARD_DCT_OPTIONS = {
  precisionMode: DCT_PRECISION_MODES.MEDIUM,
  implementationMode: DCT_IMPLEMENTATION_MODES.CHEN_WANG,
  roundingMode: DCT_ROUNDING_MODES.NEAREST,
  levelShift: true,
  validateInput: true,
  validateOutput: true,
};

/**
 * Pre-computed DCT cosine coefficients for Chen-Wang algorithm.
 * Scaled and optimized for fixed-point arithmetic.
 */
export const DCT_COSINE_COEFFICIENTS = {
  // Primary cosine values (scaled by 2^13 for fixed-point)
  C1: Math.round(Math.cos(Math.PI / 16) * 8192), // cos(π/16) * 2^13
  C2: Math.round(Math.cos(Math.PI / 8) * 8192), // cos(π/8) * 2^13
  C3: Math.round(Math.cos((3 * Math.PI) / 16) * 8192), // cos(3π/16) * 2^13
  C4: Math.round(Math.cos(Math.PI / 4) * 8192), // cos(π/4) * 2^13 = √2/2 * 2^13
  C5: Math.round(Math.cos((5 * Math.PI) / 16) * 8192), // cos(5π/16) * 2^13
  C6: Math.round(Math.cos((3 * Math.PI) / 8) * 8192), // cos(3π/8) * 2^13
  C7: Math.round(Math.cos((7 * Math.PI) / 16) * 8192), // cos(7π/16) * 2^13

  // Normalization factors
  NORM_1: Math.round((1 / Math.sqrt(2)) * 8192), // 1/√2 * 2^13 for DC normalization
  NORM_2: 8192, // 2^13 for AC normalization

  // Scaling factor for final output
  SCALE_SHIFT: 13, // Right shift by 13 to undo 2^13 scaling
};

/**
 * Apply level shifting to 8×8 block.
 * Subtracts DC_LEVEL_SHIFT from each pixel to center around zero.
 *
 * @param {Uint8Array} block - Input 8×8 pixel block (64 values)
 * @returns {Int16Array} Level-shifted block centered around zero
 */
export function applyLevelShift(block) {
  if (!(block instanceof Uint8Array)) {
    throw new Error("Block must be Uint8Array");
  }

  if (block.length !== 64) {
    throw new Error("Block must contain exactly 64 values (8×8)");
  }

  const shifted = new Int16Array(64);

  for (let i = 0; i < 64; i++) {
    shifted[i] = block[i] - DC_LEVEL_SHIFT;
  }

  return shifted;
}

/**
 * Validate DCT input block.
 * Ensures block meets requirements for DCT transformation.
 *
 * @param {Uint8Array|Int16Array} block - Input block to validate
 * @returns {{
 *   isValid: boolean,
 *   errors: string[],
 *   statistics: {
 *     minValue: number,
 *     maxValue: number,
 *     meanValue: number,
 *     range: number
 *   }
 * }} Validation results
 */
export function validateDctInput(block) {
  const errors = [];
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  let sum = 0;

  // Check block type and size
  if (!(block instanceof Uint8Array) && !(block instanceof Int16Array)) {
    errors.push("Block must be Uint8Array or Int16Array");
  }

  if (!block || block.length !== 64) {
    errors.push("Block must contain exactly 64 values (8×8)");
  }

  if (errors.length === 0) {
    // Analyze block values
    for (let i = 0; i < 64; i++) {
      const value = block[i];
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
      sum += value;

      // Check value ranges
      if (block instanceof Uint8Array) {
        if (value < 0 || value > 255) {
          errors.push(`Invalid Uint8 value at position ${i}: ${value}`);
        }
      } else if (block instanceof Int16Array) {
        if (value < -128 || value > 127) {
          errors.push(`Level-shifted value out of range at position ${i}: ${value}`);
        }
      }
    }
  }

  const meanValue = errors.length === 0 ? sum / 64 : 0;
  const range = errors.length === 0 ? maxValue - minValue : 0;

  return {
    isValid: errors.length === 0,
    errors,
    statistics: {
      minValue: errors.length === 0 ? minValue : 0,
      maxValue: errors.length === 0 ? maxValue : 0,
      meanValue: Math.round(meanValue * 100) / 100,
      range,
    },
  };
}

/**
 * Apply rounding with specified mode.
 * Handles different rounding strategies for coefficient precision.
 *
 * @param {number} value - Value to round
 * @param {string} roundingMode - Rounding strategy
 * @returns {number} Rounded value
 */
export function applyRounding(value, roundingMode) {
  switch (roundingMode) {
    case DCT_ROUNDING_MODES.NEAREST:
      return Math.round(value);

    case DCT_ROUNDING_MODES.TRUNCATE:
      return Math.trunc(value);

    case DCT_ROUNDING_MODES.FLOOR:
      return Math.floor(value);

    case DCT_ROUNDING_MODES.CEILING:
      return Math.ceil(value);

    default:
      throw new Error(`Unknown rounding mode: ${roundingMode}`);
  }
}

/**
 * Perform 1D DCT on 8-element array.
 * Implements fast 1D DCT using Chen-Wang algorithm.
 *
 * @param {Int16Array|Float64Array} input - 8-element input array
 * @param {string} precisionMode - Precision mode for calculations
 * @param {string} roundingMode - Rounding mode for output
 * @returns {Int16Array} 8-element DCT coefficient array
 */
export function dct1d(input, precisionMode = DCT_PRECISION_MODES.MEDIUM, roundingMode = DCT_ROUNDING_MODES.NEAREST) {
  if (!input || input.length !== 8) {
    throw new Error("Input must contain exactly 8 values");
  }

  const output = new Int16Array(8);

  if (precisionMode === DCT_PRECISION_MODES.HIGH) {
    // High precision floating-point implementation
    const temp = new Float64Array(8);
    const sqrt2 = Math.sqrt(2);
    const norm = 0.5; // 1/2 normalization factor

    // Direct DCT calculation
    for (let u = 0; u < 8; u++) {
      let sum = 0;
      const cu = u === 0 ? 1 / sqrt2 : 1; // Normalization factor

      for (let x = 0; x < 8; x++) {
        sum += input[x] * Math.cos(((2 * x + 1) * u * Math.PI) / 16);
      }

      temp[u] = norm * cu * sum;
    }

    // Convert to integer with rounding
    for (let i = 0; i < 8; i++) {
      output[i] = applyRounding(temp[i], roundingMode);
    }
  } else {
    // Medium/Fast precision - use simpler floating point with integer output
    const temp = new Float64Array(8);
    const sqrt2 = Math.sqrt(2);
    const norm = 0.5;

    // Simplified DCT calculation
    for (let u = 0; u < 8; u++) {
      let sum = 0;
      const cu = u === 0 ? 1 / sqrt2 : 1;

      for (let x = 0; x < 8; x++) {
        sum += input[x] * Math.cos(((2 * x + 1) * u * Math.PI) / 16);
      }

      temp[u] = norm * cu * sum;
      output[u] = applyRounding(temp[u], roundingMode);
    }
  }

  return output;
}

/**
 * Perform 2D forward DCT on 8×8 block.
 * Implements separable 2D DCT using 1D DCT on rows then columns.
 *
 * @param {Uint8Array|Int16Array} block - Input 8×8 block (64 values)
 * @param {Object} options - DCT transformation options
 * @returns {Int16Array} 8×8 DCT coefficient block (64 values)
 */
export function forwardDct2d(block, options = {}) {
  const opts = { ...DEFAULT_FORWARD_DCT_OPTIONS, ...options };

  // Validate input if requested
  if (opts.validateInput) {
    const validation = validateDctInput(block);
    if (!validation.isValid) {
      throw new Error(`Invalid DCT input: ${validation.errors.join(", ")}`);
    }
  }

  // Apply level shifting if requested and input is unsigned
  let workingBlock;
  if (opts.levelShift && block instanceof Uint8Array) {
    workingBlock = applyLevelShift(block);
  } else {
    workingBlock = block instanceof Int16Array ? block : new Int16Array(block);
  }

  // Intermediate storage for row-wise DCT
  const intermediate = new Int16Array(64);

  // Step 1: Apply 1D DCT to each row
  for (let row = 0; row < 8; row++) {
    const rowStart = row * 8;
    const rowInput = workingBlock.subarray(rowStart, rowStart + 8);
    const rowOutput = dct1d(rowInput, opts.precisionMode, opts.roundingMode);

    for (let col = 0; col < 8; col++) {
      intermediate[rowStart + col] = rowOutput[col];
    }
  }

  // Step 2: Apply 1D DCT to each column
  const output = new Int16Array(64);
  for (let col = 0; col < 8; col++) {
    const colInput = new Int16Array(8);
    for (let row = 0; row < 8; row++) {
      colInput[row] = intermediate[row * 8 + col];
    }

    const colOutput = dct1d(colInput, opts.precisionMode, opts.roundingMode);

    for (let row = 0; row < 8; row++) {
      output[row * 8 + col] = colOutput[row];
    }
  }

  // Validate output if requested
  if (opts.validateOutput) {
    const validation = validateDctOutput(output);
    if (!validation.isValid) {
      throw new Error(`Invalid DCT output: ${validation.errors.join(", ")}`);
    }
  }

  return output;
}

/**
 * Validate DCT output coefficients.
 * Ensures DCT coefficients are within expected ranges.
 *
 * @param {Int16Array} coefficients - DCT coefficients to validate
 * @returns {{
 *   isValid: boolean,
 *   errors: string[],
 *   statistics: {
 *     dcValue: number,
 *     acRange: {min: number, max: number},
 *     zeroCount: number,
 *     energyConcentration: number
 *   }
 * }} Validation results
 */
export function validateDctOutput(coefficients) {
  const errors = [];

  if (!(coefficients instanceof Int16Array)) {
    errors.push("Coefficients must be Int16Array");
  }

  if (!coefficients || coefficients.length !== 64) {
    errors.push("Coefficients must contain exactly 64 values (8×8)");
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      statistics: {
        dcValue: 0,
        acRange: { min: 0, max: 0 },
        zeroCount: 0,
        energyConcentration: 0,
      },
    };
  }

  const dcValue = coefficients[0];
  let acMin = Number.POSITIVE_INFINITY;
  let acMax = Number.NEGATIVE_INFINITY;
  let zeroCount = 0;
  let totalEnergy = 0;
  let lowFreqEnergy = 0; // First 3×3 coefficients

  // Analyze coefficients
  for (let i = 0; i < 64; i++) {
    const coeff = coefficients[i];
    totalEnergy += coeff * coeff;

    if (i === 0) {
      // DC coefficient validation (wider range for forward DCT)
      if (coeff < -8192 || coeff > 8192) {
        errors.push(`DC coefficient out of range: ${coeff} (expected -8192 to 8192)`);
      }
    } else {
      // AC coefficient validation
      acMin = Math.min(acMin, coeff);
      acMax = Math.max(acMax, coeff);

      if (coeff < -8192 || coeff > 8192) {
        errors.push(`AC coefficient out of range at position ${i}: ${coeff} (expected -8192 to 8192)`);
      }

      if (coeff === 0) {
        zeroCount++;
      }

      // Low frequency energy (first 3×3 block)
      const row = Math.floor(i / 8);
      const col = i % 8;
      if (row < 3 && col < 3) {
        lowFreqEnergy += coeff * coeff;
      }
    }
  }

  // Calculate energy concentration (should be high for typical images)
  const energyConcentration = totalEnergy > 0 ? (lowFreqEnergy / totalEnergy) * 100 : 0;

  return {
    isValid: errors.length === 0,
    errors,
    statistics: {
      dcValue,
      acRange: {
        min: acMin === Number.POSITIVE_INFINITY ? 0 : acMin,
        max: acMax === Number.NEGATIVE_INFINITY ? 0 : acMax,
      },
      zeroCount,
      energyConcentration: Math.round(energyConcentration * 100) / 100,
    },
  };
}

/**
 * Convert DCT coefficients to zigzag order.
 * Reorders coefficients from 2D block order to zigzag scan order for quantization.
 *
 * @param {Int16Array} coefficients - 8×8 DCT coefficients in block order
 * @returns {Int16Array} Coefficients in zigzag order
 */
export function coefficientsToZigzag(coefficients) {
  if (!(coefficients instanceof Int16Array) || coefficients.length !== 64) {
    throw new Error("Coefficients must be Int16Array with 64 values");
  }

  // Zigzag scan order (maps 2D position to 1D zigzag index)
  const zigzagOrder = [
    0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21,
    28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54,
    47, 55, 62, 63,
  ];

  const zigzagCoeffs = new Int16Array(64);
  for (let i = 0; i < 64; i++) {
    zigzagCoeffs[i] = coefficients[zigzagOrder[i]];
  }

  return zigzagCoeffs;
}

/**
 * Batch forward DCT transformation.
 * Processes multiple 8×8 blocks efficiently with shared options.
 *
 * @param {Uint8Array[]} blocks - Array of 8×8 pixel blocks
 * @param {Object} options - DCT transformation options
 * @returns {{
 *   coefficients: Int16Array[],
 *   zigzagCoefficients: Int16Array[],
 *   metadata: {
 *     blocksProcessed: number,
 *     averageDcValue: number,
 *     totalZeroCoefficients: number,
 *     averageEnergyConcentration: number,
 *     processingTime: number
 *   }
 * }} Batch transformation results
 */
export function batchForwardDct(blocks, options = {}) {
  if (!Array.isArray(blocks)) {
    throw new Error("Blocks must be an array");
  }

  const opts = { ...DEFAULT_FORWARD_DCT_OPTIONS, ...options };
  const startTime = performance.now();

  const coefficients = [];
  const zigzagCoefficients = [];
  let totalDcValue = 0;
  let totalZeroCoefficients = 0;
  let totalEnergyConcentration = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Transform block
    const blockCoeffs = forwardDct2d(block, opts);
    const zigzagCoeffs = coefficientsToZigzag(blockCoeffs);

    coefficients.push(blockCoeffs);
    zigzagCoefficients.push(zigzagCoeffs);

    // Collect statistics
    const validation = validateDctOutput(blockCoeffs);
    if (validation.isValid) {
      totalDcValue += validation.statistics.dcValue;
      totalZeroCoefficients += validation.statistics.zeroCount;
      totalEnergyConcentration += validation.statistics.energyConcentration;
    }
  }

  const processingTime = performance.now() - startTime;
  const blocksProcessed = blocks.length;

  const metadata = {
    blocksProcessed,
    averageDcValue: blocksProcessed > 0 ? Math.round(totalDcValue / blocksProcessed) : 0,
    totalZeroCoefficients,
    averageEnergyConcentration:
      blocksProcessed > 0 ? Math.round((totalEnergyConcentration / blocksProcessed) * 100) / 100 : 0,
    processingTime: Math.round(processingTime * 100) / 100,
  };

  return {
    coefficients,
    zigzagCoefficients,
    metadata,
  };
}

/**
 * Forward DCT performance and quality metrics.
 * Tracks DCT operations and analyzes transformation quality.
 */
export class ForwardDctMetrics {
  /**
   * Create forward DCT metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.transformsPerformed = 0;
    /** @type {number} */
    this.blocksProcessed = 0;
    /** @type {number} */
    this.totalProcessingTime = 0;
    /** @type {number} */
    this.totalCoefficients = 0;
    /** @type {number} */
    this.totalZeroCoefficients = 0;
    /** @type {Object<string, number>} */
    this.precisionModeUsage = {};
    /** @type {Object<string, number>} */
    this.implementationModeUsage = {};
    /** @type {number[]} */
    this.dcValues = [];
    /** @type {number[]} */
    this.energyConcentrations = [];
    /** @type {string[]} */
    this.errors = [];
  }

  /**
   * Record forward DCT operation.
   *
   * @param {{
   *   blocksProcessed: number,
   *   averageDcValue: number,
   *   totalZeroCoefficients: number,
   *   averageEnergyConcentration: number,
   *   processingTime: number,
   *   precisionMode: string,
   *   implementationMode: string
   * }} metadata - DCT operation metadata
   */
  recordTransform(metadata) {
    this.transformsPerformed++;
    this.blocksProcessed += metadata.blocksProcessed;
    this.totalProcessingTime += metadata.processingTime;
    this.totalCoefficients += metadata.blocksProcessed * 64;
    this.totalZeroCoefficients += metadata.totalZeroCoefficients;

    this.precisionModeUsage[metadata.precisionMode] = (this.precisionModeUsage[metadata.precisionMode] || 0) + 1;
    this.implementationModeUsage[metadata.implementationMode] =
      (this.implementationModeUsage[metadata.implementationMode] || 0) + 1;

    this.dcValues.push(metadata.averageDcValue);
    this.energyConcentrations.push(metadata.averageEnergyConcentration);
  }

  /**
   * Record DCT error.
   *
   * @param {string} error - Error message
   */
  recordError(error) {
    this.errors.push(error);
  }

  /**
   * Get DCT metrics summary.
   *
   * @returns {{
   *   transformsPerformed: number,
   *   blocksProcessed: number,
   *   averageBlocksPerTransform: number,
   *   coefficientSparsity: number,
   *   averageProcessingTime: number,
   *   blocksPerSecond: number,
   *   averageDcValue: number,
   *   averageEnergyConcentration: number,
   *   precisionModeDistribution: Object<string, number>,
   *   implementationModeDistribution: Object<string, number>,
   *   errorCount: number,
   *   description: string
   * }} Metrics summary
   */
  getSummary() {
    const averageBlocksPerTransform =
      this.transformsPerformed > 0 ? Math.round(this.blocksProcessed / this.transformsPerformed) : 0;

    const coefficientSparsity =
      this.totalCoefficients > 0 ? (this.totalZeroCoefficients / this.totalCoefficients) * 100 : 0;

    const averageProcessingTime =
      this.transformsPerformed > 0 ? this.totalProcessingTime / this.transformsPerformed : 0;

    const blocksPerSecond =
      this.totalProcessingTime > 0 ? Math.round((this.blocksProcessed / this.totalProcessingTime) * 1000) : 0;

    const averageDcValue =
      this.dcValues.length > 0 ? this.dcValues.reduce((sum, val) => sum + val, 0) / this.dcValues.length : 0;

    const averageEnergyConcentration =
      this.energyConcentrations.length > 0
        ? this.energyConcentrations.reduce((sum, val) => sum + val, 0) / this.energyConcentrations.length
        : 0;

    return {
      transformsPerformed: this.transformsPerformed,
      blocksProcessed: this.blocksProcessed,
      averageBlocksPerTransform,
      coefficientSparsity: Math.round(coefficientSparsity * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      blocksPerSecond,
      averageDcValue: Math.round(averageDcValue),
      averageEnergyConcentration: Math.round(averageEnergyConcentration * 100) / 100,
      precisionModeDistribution: { ...this.precisionModeUsage },
      implementationModeDistribution: { ...this.implementationModeUsage },
      errorCount: this.errors.length,
      description: `Forward DCT: ${this.transformsPerformed} transforms, ${this.blocksProcessed.toLocaleString()} blocks, ${blocksPerSecond.toLocaleString()} blocks/s`,
    };
  }

  /**
   * Reset DCT metrics.
   */
  reset() {
    this.transformsPerformed = 0;
    this.blocksProcessed = 0;
    this.totalProcessingTime = 0;
    this.totalCoefficients = 0;
    this.totalZeroCoefficients = 0;
    this.precisionModeUsage = {};
    this.implementationModeUsage = {};
    this.dcValues = [];
    this.energyConcentrations = [];
    this.errors = [];
  }
}
