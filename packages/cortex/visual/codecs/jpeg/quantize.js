/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Coefficient quantization with quality scaling for JPEG encoding.
 *
 * Implements ITU-T T.81 Annex A.3.4 quantization process for DCT coefficients.
 * Applies quantization tables with quality scaling to achieve desired compression
 * vs quality tradeoff. Supports standard and custom quantization tables with
 * various precision modes and quality control mechanisms.
 */

/**
 * Quantization table precision modes.
 * Different bit depths for quantization values.
 */
export const QUANTIZATION_PRECISION = {
  /** 8-bit quantization values (1-255) */
  PRECISION_8BIT: "8bit",
  /** 16-bit quantization values (1-65535) */
  PRECISION_16BIT: "16bit",
};

/**
 * Quantization quality modes.
 * Different quality scaling approaches.
 */
export const QUALITY_MODES = {
  /** Standard JPEG quality scaling */
  STANDARD: "standard",
  /** Linear quality scaling */
  LINEAR: "linear",
  /** Custom quality curve */
  CUSTOM: "custom",
  /** Perceptual quality scaling */
  PERCEPTUAL: "perceptual",
};

/**
 * Quantization rounding modes.
 * Different rounding strategies for coefficient quantization.
 */
export const QUANTIZATION_ROUNDING = {
  /** Round to nearest integer */
  NEAREST: "nearest",
  /** Round toward zero (truncate) */
  TRUNCATE: "truncate",
  /** Round toward negative infinity (floor) */
  FLOOR: "floor",
  /** Round toward positive infinity (ceiling) */
  CEILING: "ceiling",
  /** Round away from zero */
  AWAY_FROM_ZERO: "away_from_zero",
};

/**
 * Component types for quantization.
 * Different quantization tables for different components.
 */
export const COMPONENT_TYPES = {
  /** Luminance component (Y) */
  LUMINANCE: "luminance",
  /** Chrominance components (Cb, Cr) */
  CHROMINANCE: "chrominance",
};

/**
 * Standard JPEG luminance quantization table (ITU-T T.81 Annex K).
 * Optimized for human visual system sensitivity to brightness.
 */
export const STANDARD_LUMINANCE_TABLE = new Uint8Array([
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51,
  87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
]);

/**
 * Standard JPEG chrominance quantization table (ITU-T T.81 Annex K).
 * Optimized for human visual system sensitivity to color.
 */
export const STANDARD_CHROMINANCE_TABLE = new Uint8Array([
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99,
]);

/**
 * Default quantization options.
 * Standard settings for JPEG quantization.
 */
export const DEFAULT_QUANTIZATION_OPTIONS = {
  precision: QUANTIZATION_PRECISION.PRECISION_8BIT,
  qualityMode: QUALITY_MODES.STANDARD,
  roundingMode: QUANTIZATION_ROUNDING.NEAREST,
  validateInput: true,
  validateOutput: true,
  trackMetrics: true,
};

/**
 * Calculate quality scaling factor from quality value.
 * Implements standard JPEG quality scaling algorithm.
 *
 * @param {number} quality - Quality factor (1-100, higher = better quality)
 * @param {string} qualityMode - Quality scaling mode
 * @returns {number} Scaling factor for quantization table
 */
export function calculateQualityScale(quality, qualityMode = QUALITY_MODES.STANDARD) {
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error("Quality must be integer between 1 and 100");
  }

  switch (qualityMode) {
    case QUALITY_MODES.STANDARD: {
      // Standard JPEG quality scaling (ITU-T T.81)
      if (quality >= 50) {
        return (100 - quality) / 50;
      } else {
        return 50 / quality;
      }
    }

    case QUALITY_MODES.LINEAR: {
      // Linear quality scaling
      return (100 - quality) / 100;
    }

    case QUALITY_MODES.PERCEPTUAL: {
      // Perceptual quality scaling (more aggressive at low qualities)
      const normalized = quality / 100;
      return (1 - normalized) ** 1.5;
    }

    case QUALITY_MODES.CUSTOM: {
      // Custom quality curve (can be extended)
      return (100 - quality) / 50;
    }

    default:
      throw new Error(`Unknown quality mode: ${qualityMode}`);
  }
}

/**
 * Scale quantization table by quality factor.
 * Applies quality scaling to base quantization table.
 *
 * @param {Uint8Array|Uint16Array} baseTable - Base quantization table (64 values)
 * @param {number} quality - Quality factor (1-100)
 * @param {string} qualityMode - Quality scaling mode
 * @param {string} precision - Output precision mode
 * @returns {Uint8Array|Uint16Array} Scaled quantization table
 */
export function scaleQuantizationTable(
  baseTable,
  quality,
  qualityMode = QUALITY_MODES.STANDARD,
  precision = QUANTIZATION_PRECISION.PRECISION_8BIT
) {
  if (!(baseTable instanceof Uint8Array) && !(baseTable instanceof Uint16Array)) {
    throw new Error("Base table must be Uint8Array or Uint16Array");
  }

  if (baseTable.length !== 64) {
    throw new Error("Quantization table must contain exactly 64 values");
  }

  const scale = calculateQualityScale(quality, qualityMode);
  const maxValue = precision === QUANTIZATION_PRECISION.PRECISION_8BIT ? 255 : 65535;

  // Create output table with appropriate precision
  const OutputArray = precision === QUANTIZATION_PRECISION.PRECISION_8BIT ? Uint8Array : Uint16Array;
  const scaledTable = new OutputArray(64);

  for (let i = 0; i < 64; i++) {
    // Apply scaling and ensure minimum value of 1
    const scaledValue = Math.round(baseTable[i] * scale);
    scaledTable[i] = Math.max(1, Math.min(maxValue, scaledValue));
  }

  return scaledTable;
}

/**
 * Get standard quantization table.
 * Returns standard luminance or chrominance table.
 *
 * @param {string} componentType - Component type (luminance/chrominance)
 * @param {number} quality - Quality factor (1-100)
 * @param {string} qualityMode - Quality scaling mode
 * @param {string} precision - Output precision mode
 * @returns {Uint8Array|Uint16Array} Standard quantization table
 */
export function getStandardQuantizationTable(
  componentType,
  quality = 75,
  qualityMode = QUALITY_MODES.STANDARD,
  precision = QUANTIZATION_PRECISION.PRECISION_8BIT
) {
  let baseTable;

  switch (componentType) {
    case COMPONENT_TYPES.LUMINANCE:
      baseTable = STANDARD_LUMINANCE_TABLE;
      break;

    case COMPONENT_TYPES.CHROMINANCE:
      baseTable = STANDARD_CHROMINANCE_TABLE;
      break;

    default:
      throw new Error(`Unknown component type: ${componentType}`);
  }

  return scaleQuantizationTable(baseTable, quality, qualityMode, precision);
}

/**
 * Apply rounding with specified mode.
 * Handles different rounding strategies for quantization.
 *
 * @param {number} value - Value to round
 * @param {string} roundingMode - Rounding strategy
 * @returns {number} Rounded value
 */
export function applyQuantizationRounding(value, roundingMode) {
  switch (roundingMode) {
    case QUANTIZATION_ROUNDING.NEAREST:
      return Math.round(value);

    case QUANTIZATION_ROUNDING.TRUNCATE:
      return Math.trunc(value);

    case QUANTIZATION_ROUNDING.FLOOR:
      return Math.floor(value);

    case QUANTIZATION_ROUNDING.CEILING:
      return Math.ceil(value);

    case QUANTIZATION_ROUNDING.AWAY_FROM_ZERO:
      return value >= 0 ? Math.ceil(value) : Math.floor(value);

    default:
      throw new Error(`Unknown rounding mode: ${roundingMode}`);
  }
}

/**
 * Quantize single DCT coefficient.
 * Applies quantization formula to single coefficient.
 *
 * @param {number} coefficient - DCT coefficient value
 * @param {number} quantValue - Quantization table value
 * @param {string} roundingMode - Rounding mode for quantization
 * @returns {number} Quantized coefficient
 */
export function quantizeCoefficient(coefficient, quantValue, roundingMode = QUANTIZATION_ROUNDING.NEAREST) {
  if (quantValue === 0) {
    throw new Error("Quantization value cannot be zero");
  }

  const quotient = coefficient / quantValue;
  return applyQuantizationRounding(quotient, roundingMode);
}

/**
 * Quantize 8×8 DCT coefficient block.
 * Applies quantization table to entire coefficient block.
 *
 * @param {Int16Array} coefficients - DCT coefficients (64 values in zigzag order)
 * @param {Uint8Array|Uint16Array} quantTable - Quantization table (64 values)
 * @param {Object} options - Quantization options
 * @returns {Int16Array} Quantized coefficients
 */
export function quantizeBlock(coefficients, quantTable, options = {}) {
  const opts = { ...DEFAULT_QUANTIZATION_OPTIONS, ...options };

  // Validate inputs
  if (opts.validateInput) {
    if (!(coefficients instanceof Int16Array) || coefficients.length !== 64) {
      throw new Error("Coefficients must be Int16Array with 64 values");
    }

    if (!(quantTable instanceof Uint8Array) && !(quantTable instanceof Uint16Array)) {
      throw new Error("Quantization table must be Uint8Array or Uint16Array");
    }

    if (quantTable.length !== 64) {
      throw new Error("Quantization table must contain exactly 64 values");
    }

    // Check for zero values in quantization table
    for (let i = 0; i < 64; i++) {
      if (quantTable[i] === 0) {
        throw new Error(`Quantization table contains zero value at position ${i}`);
      }
    }
  }

  const quantizedCoeffs = new Int16Array(64);
  let zeroCount = 0;
  let totalError = 0;

  // Apply quantization to each coefficient
  for (let i = 0; i < 64; i++) {
    const original = coefficients[i];
    const quantized = quantizeCoefficient(original, quantTable[i], opts.roundingMode);

    quantizedCoeffs[i] = quantized;

    if (quantized === 0) {
      zeroCount++;
    }

    // Track quantization error if metrics enabled
    if (opts.trackMetrics) {
      const reconstructed = quantized * quantTable[i];
      totalError += Math.abs(original - reconstructed);
    }
  }

  // Validate output if requested
  if (opts.validateOutput) {
    const validation = validateQuantizedBlock(quantizedCoeffs);
    if (!validation.isValid) {
      throw new Error(`Invalid quantized output: ${validation.errors.join(", ")}`);
    }
  }

  // Attach metadata if tracking metrics
  if (opts.trackMetrics) {
    /** @type {any} */ (quantizedCoeffs).metadata = {
      zeroCount,
      sparsity: (zeroCount / 64) * 100,
      averageError: totalError / 64,
      compressionRatio: estimateCompressionRatio(quantizedCoeffs),
    };
  }

  return quantizedCoeffs;
}

/**
 * Validate quantized coefficient block.
 * Ensures quantized coefficients are within expected ranges.
 *
 * @param {Int16Array} coefficients - Quantized coefficients to validate
 * @returns {{
 *   isValid: boolean,
 *   errors: string[],
 *   statistics: {
 *     minValue: number,
 *     maxValue: number,
 *     zeroCount: number,
 *     nonZeroCount: number,
 *     sparsity: number
 *   }
 * }} Validation results
 */
export function validateQuantizedBlock(coefficients) {
  const errors = [];

  if (!(coefficients instanceof Int16Array)) {
    errors.push("Coefficients must be Int16Array");
  }

  if (!coefficients || coefficients.length !== 64) {
    errors.push("Coefficients must contain exactly 64 values");
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      statistics: {
        minValue: 0,
        maxValue: 0,
        zeroCount: 0,
        nonZeroCount: 0,
        sparsity: 0,
      },
    };
  }

  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  let zeroCount = 0;

  // Analyze coefficient values
  for (let i = 0; i < 64; i++) {
    const coeff = coefficients[i];
    minValue = Math.min(minValue, coeff);
    maxValue = Math.max(maxValue, coeff);

    if (coeff === 0) {
      zeroCount++;
    }

    // Check reasonable coefficient ranges (quantized values should be smaller)
    if (coeff < -2048 || coeff > 2048) {
      errors.push(`Coefficient out of reasonable range at position ${i}: ${coeff}`);
    }
  }

  const nonZeroCount = 64 - zeroCount;
  const sparsity = (zeroCount / 64) * 100;

  return {
    isValid: errors.length === 0,
    errors,
    statistics: {
      minValue: minValue === Number.POSITIVE_INFINITY ? 0 : minValue,
      maxValue: maxValue === Number.NEGATIVE_INFINITY ? 0 : maxValue,
      zeroCount,
      nonZeroCount,
      sparsity: Math.round(sparsity * 100) / 100,
    },
  };
}

/**
 * Estimate compression ratio from quantized coefficients.
 * Provides rough estimate of compression based on coefficient sparsity.
 *
 * @param {Int16Array} coefficients - Quantized coefficients
 * @returns {number} Estimated compression ratio
 */
export function estimateCompressionRatio(coefficients) {
  if (!(coefficients instanceof Int16Array) || coefficients.length !== 64) {
    throw new Error("Coefficients must be Int16Array with 64 values");
  }

  let zeroCount = 0;
  let smallCoeffCount = 0; // Coefficients with absolute value <= 1

  for (let i = 0; i < 64; i++) {
    const coeff = coefficients[i];
    if (coeff === 0) {
      zeroCount++;
    } else if (Math.abs(coeff) <= 1) {
      smallCoeffCount++;
    }
  }

  // Simple compression ratio estimation based on sparsity and small coefficients
  const sparsity = zeroCount / 64;
  const smallRatio = smallCoeffCount / 64;

  // Higher sparsity and more small coefficients = better compression
  const baseRatio = 8; // Baseline compression ratio
  const sparsityBonus = sparsity * 4; // Up to 4x bonus for high sparsity
  const smallCoeffBonus = smallRatio * 2; // Up to 2x bonus for small coefficients

  return Math.round((baseRatio + sparsityBonus + smallCoeffBonus) * 100) / 100;
}

/**
 * Batch quantize multiple coefficient blocks.
 * Efficiently quantizes multiple blocks with shared parameters.
 *
 * @param {Int16Array[]} coefficientBlocks - Array of DCT coefficient blocks
 * @param {Uint8Array|Uint16Array} quantTable - Quantization table
 * @param {Object} options - Quantization options
 * @returns {{
 *   quantizedBlocks: Int16Array[],
 *   metadata: {
 *     blocksProcessed: number,
 *     totalZeroCoefficients: number,
 *     averageSparsity: number,
 *     averageCompressionRatio: number,
 *     totalQuantizationError: number,
 *     processingTime: number
 *   }
 * }} Batch quantization results
 */
export function batchQuantizeBlocks(coefficientBlocks, quantTable, options = {}) {
  if (!Array.isArray(coefficientBlocks)) {
    throw new Error("Coefficient blocks must be an array");
  }

  const opts = { ...DEFAULT_QUANTIZATION_OPTIONS, ...options };
  const startTime = performance.now();

  const quantizedBlocks = [];
  let totalZeroCoefficients = 0;
  let totalSparsity = 0;
  let totalCompressionRatio = 0;
  let totalQuantizationError = 0;

  for (let i = 0; i < coefficientBlocks.length; i++) {
    const block = coefficientBlocks[i];
    const quantizedBlock = quantizeBlock(block, quantTable, opts);

    quantizedBlocks.push(quantizedBlock);

    // Collect statistics if tracking metrics
    if (opts.trackMetrics && /** @type {any} */ (quantizedBlock).metadata) {
      const metadata = /** @type {any} */ (quantizedBlock).metadata;
      totalZeroCoefficients += metadata.zeroCount;
      totalSparsity += metadata.sparsity;
      totalCompressionRatio += metadata.compressionRatio;
      totalQuantizationError += metadata.averageError;
    }
  }

  const processingTime = performance.now() - startTime;
  const blocksProcessed = coefficientBlocks.length;

  const metadata = {
    blocksProcessed,
    totalZeroCoefficients,
    averageSparsity: blocksProcessed > 0 ? Math.round((totalSparsity / blocksProcessed) * 100) / 100 : 0,
    averageCompressionRatio:
      blocksProcessed > 0 ? Math.round((totalCompressionRatio / blocksProcessed) * 100) / 100 : 0,
    totalQuantizationError: Math.round(totalQuantizationError * 100) / 100,
    processingTime: Math.round(processingTime * 100) / 100,
  };

  return {
    quantizedBlocks,
    metadata,
  };
}

/**
 * Quantization performance and quality metrics.
 * Tracks quantization operations and analyzes compression characteristics.
 */
export class QuantizationMetrics {
  /**
   * Create quantization metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.quantizationsPerformed = 0;
    /** @type {number} */
    this.blocksProcessed = 0;
    /** @type {number} */
    this.totalProcessingTime = 0;
    /** @type {number} */
    this.totalZeroCoefficients = 0;
    /** @type {number} */
    this.totalQuantizationError = 0;
    /** @type {Object<string, number>} */
    this.qualityModeUsage = {};
    /** @type {Object<string, number>} */
    this.precisionModeUsage = {};
    /** @type {number[]} */
    this.sparsityValues = [];
    /** @type {number[]} */
    this.compressionRatios = [];
    /** @type {string[]} */
    this.errors = [];
  }

  /**
   * Record quantization operation.
   *
   * @param {{
   *   blocksProcessed: number,
   *   totalZeroCoefficients: number,
   *   averageSparsity: number,
   *   averageCompressionRatio: number,
   *   totalQuantizationError: number,
   *   processingTime: number,
   *   qualityMode: string,
   *   precision: string
   * }} metadata - Quantization operation metadata
   */
  recordQuantization(metadata) {
    this.quantizationsPerformed++;
    this.blocksProcessed += metadata.blocksProcessed;
    this.totalProcessingTime += metadata.processingTime;
    this.totalZeroCoefficients += metadata.totalZeroCoefficients;
    this.totalQuantizationError += metadata.totalQuantizationError;

    this.qualityModeUsage[metadata.qualityMode] = (this.qualityModeUsage[metadata.qualityMode] || 0) + 1;
    this.precisionModeUsage[metadata.precision] = (this.precisionModeUsage[metadata.precision] || 0) + 1;

    this.sparsityValues.push(metadata.averageSparsity);
    this.compressionRatios.push(metadata.averageCompressionRatio);
  }

  /**
   * Record quantization error.
   *
   * @param {string} error - Error message
   */
  recordError(error) {
    this.errors.push(error);
  }

  /**
   * Get quantization metrics summary.
   *
   * @returns {{
   *   quantizationsPerformed: number,
   *   blocksProcessed: number,
   *   averageBlocksPerQuantization: number,
   *   coefficientSparsity: number,
   *   averageCompressionRatio: number,
   *   averageQuantizationError: number,
   *   averageProcessingTime: number,
   *   blocksPerSecond: number,
   *   qualityModeDistribution: Object<string, number>,
   *   precisionModeDistribution: Object<string, number>,
   *   errorCount: number,
   *   description: string
   * }} Metrics summary
   */
  getSummary() {
    const averageBlocksPerQuantization =
      this.quantizationsPerformed > 0 ? Math.round(this.blocksProcessed / this.quantizationsPerformed) : 0;

    const coefficientSparsity =
      this.sparsityValues.length > 0
        ? this.sparsityValues.reduce((sum, val) => sum + val, 0) / this.sparsityValues.length
        : 0;

    const averageCompressionRatio =
      this.compressionRatios.length > 0
        ? this.compressionRatios.reduce((sum, val) => sum + val, 0) / this.compressionRatios.length
        : 0;

    const averageQuantizationError =
      this.quantizationsPerformed > 0 ? this.totalQuantizationError / this.quantizationsPerformed : 0;

    const averageProcessingTime =
      this.quantizationsPerformed > 0 ? this.totalProcessingTime / this.quantizationsPerformed : 0;

    const blocksPerSecond =
      this.totalProcessingTime > 0 ? Math.round((this.blocksProcessed / this.totalProcessingTime) * 1000) : 0;

    return {
      quantizationsPerformed: this.quantizationsPerformed,
      blocksProcessed: this.blocksProcessed,
      averageBlocksPerQuantization,
      coefficientSparsity: Math.round(coefficientSparsity * 100) / 100,
      averageCompressionRatio: Math.round(averageCompressionRatio * 100) / 100,
      averageQuantizationError: Math.round(averageQuantizationError * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      blocksPerSecond,
      qualityModeDistribution: { ...this.qualityModeUsage },
      precisionModeDistribution: { ...this.precisionModeUsage },
      errorCount: this.errors.length,
      description: `Quantization: ${this.quantizationsPerformed} operations, ${this.blocksProcessed.toLocaleString()} blocks, ${blocksPerSecond.toLocaleString()} blocks/s`,
    };
  }

  /**
   * Reset quantization metrics.
   */
  reset() {
    this.quantizationsPerformed = 0;
    this.blocksProcessed = 0;
    this.totalProcessingTime = 0;
    this.totalZeroCoefficients = 0;
    this.totalQuantizationError = 0;
    this.qualityModeUsage = {};
    this.precisionModeUsage = {};
    this.sparsityValues = [];
    this.compressionRatios = [];
    this.errors = [];
  }
}

/**
 * Analyze quantization table characteristics.
 * Provides insights into quantization table properties.
 *
 * @param {Uint8Array|Uint16Array} quantTable - Quantization table to analyze
 * @returns {{
 *   minValue: number,
 *   maxValue: number,
 *   averageValue: number,
 *   dynamicRange: number,
 *   lowFrequencyAverage: number,
 *   highFrequencyAverage: number,
 *   compressionAggressiveness: number,
 *   tableType: string
 * }} Table analysis results
 */
export function analyzeQuantizationTable(quantTable) {
  if (!(quantTable instanceof Uint8Array) && !(quantTable instanceof Uint16Array)) {
    throw new Error("Quantization table must be Uint8Array or Uint16Array");
  }

  if (quantTable.length !== 64) {
    throw new Error("Quantization table must contain exactly 64 values");
  }

  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  let sum = 0;
  let lowFreqSum = 0; // First 3×3 coefficients
  let highFreqSum = 0; // Last 3×3 coefficients

  for (let i = 0; i < 64; i++) {
    const value = quantTable[i];
    minValue = Math.min(minValue, value);
    maxValue = Math.max(maxValue, value);
    sum += value;

    // Low frequency region (top-left 3×3)
    const row = Math.floor(i / 8);
    const col = i % 8;
    if (row < 3 && col < 3) {
      lowFreqSum += value;
    }
    // High frequency region (bottom-right 3×3)
    else if (row >= 5 && col >= 5) {
      highFreqSum += value;
    }
  }

  const averageValue = sum / 64;
  const dynamicRange = maxValue - minValue;
  const lowFrequencyAverage = lowFreqSum / 9; // 3×3 = 9 coefficients
  const highFrequencyAverage = highFreqSum / 9; // 3×3 = 9 coefficients

  // Compression aggressiveness: ratio of high-freq to low-freq quantization
  const compressionAggressiveness = lowFrequencyAverage > 0 ? highFrequencyAverage / lowFrequencyAverage : 0;

  // Determine likely table type based on characteristics
  let tableType = "custom";
  if (Math.abs(averageValue - 50) < 15 && compressionAggressiveness > 2) {
    tableType = "luminance";
  } else if (averageValue > 50 && compressionAggressiveness > 3) {
    tableType = "chrominance";
  }

  return {
    minValue,
    maxValue,
    averageValue: Math.round(averageValue * 100) / 100,
    dynamicRange,
    lowFrequencyAverage: Math.round(lowFrequencyAverage * 100) / 100,
    highFrequencyAverage: Math.round(highFrequencyAverage * 100) / 100,
    compressionAggressiveness: Math.round(compressionAggressiveness * 100) / 100,
    tableType,
  };
}
