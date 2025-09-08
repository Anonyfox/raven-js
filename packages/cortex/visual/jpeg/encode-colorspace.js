/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file RGB to YCbCr color space conversion for JPEG encoding.
 *
 * Implements ITU-R BT.601 and BT.709 RGB to YCbCr conversion with precision
 * optimization for JPEG encoding pipeline. Handles full/limited range conversion,
 * gamut mapping, and provides quality control through configurable rounding modes
 * and precision handling.
 */

/**
 * Color space conversion standards.
 * Different RGB to YCbCr conversion matrices.
 */
export const COLOR_STANDARDS = {
  /** ITU-R BT.601 (Standard Definition) */
  BT601: "bt601",
  /** ITU-R BT.709 (High Definition) */
  BT709: "bt709",
  /** ITU-R BT.2020 (Ultra High Definition) */
  BT2020: "bt2020",
  /** sRGB (Standard RGB) */
  SRGB: "srgb",
};

/**
 * Color range types.
 * Different RGB and YCbCr value ranges.
 */
export const COLOR_RANGES = {
  /** Full range: RGB [0-255], YCbCr [0-255] */
  FULL: "full",
  /** Limited range: RGB [0-255], Y [16-235], CbCr [16-240] */
  LIMITED: "limited",
  /** Auto-detect range based on content */
  AUTO: "auto",
};

/**
 * Rounding modes for color conversion.
 * Different rounding strategies for precision control.
 */
export const ROUNDING_MODES = {
  /** Round to nearest integer */
  NEAREST: "nearest",
  /** Round down (floor) */
  FLOOR: "floor",
  /** Round up (ceiling) */
  CEILING: "ceiling",
  /** Banker's rounding (round half to even) */
  BANKERS: "bankers",
};

/**
 * Conversion precision modes.
 * Different precision vs performance trade-offs.
 */
export const PRECISION_MODES = {
  /** High precision floating-point */
  HIGH: "high",
  /** Medium precision fixed-point */
  MEDIUM: "medium",
  /** Fast integer approximation */
  FAST: "fast",
};

/**
 * ITU-R BT.601 conversion coefficients (Standard Definition).
 * Optimized for 8-bit precision with 16-bit intermediate calculations.
 */
export const BT601_COEFFICIENTS = {
  // RGB to Y conversion
  YR: 0.299,
  YG: 0.587,
  YB: 0.114,
  // RGB to Cb conversion
  CBR: -0.168736,
  CBG: -0.331264,
  CBB: 0.5,
  // RGB to Cr conversion
  CRR: 0.5,
  CRG: -0.418688,
  CRB: -0.081312,
  // Chroma offset
  CHROMA_OFFSET: 128,
};

/**
 * ITU-R BT.709 conversion coefficients (High Definition).
 * Optimized for 8-bit precision with 16-bit intermediate calculations.
 */
export const BT709_COEFFICIENTS = {
  // RGB to Y conversion
  YR: 0.2126,
  YG: 0.7152,
  YB: 0.0722,
  // RGB to Cb conversion
  CBR: -0.114572,
  CBG: -0.385428,
  CBB: 0.5,
  // RGB to Cr conversion
  CRR: 0.5,
  CRG: -0.454153,
  CRB: -0.045847,
  // Chroma offset
  CHROMA_OFFSET: 128,
};

/**
 * ITU-R BT.2020 conversion coefficients (Ultra High Definition).
 * For future HDR and wide gamut support.
 */
export const BT2020_COEFFICIENTS = {
  // RGB to Y conversion
  YR: 0.2627,
  YG: 0.678,
  YB: 0.0593,
  // RGB to Cb conversion
  CBR: -0.13963,
  CBG: -0.36037,
  CBB: 0.5,
  // RGB to Cr conversion
  CRR: 0.5,
  CRG: -0.459786,
  CRB: -0.040214,
  // Chroma offset
  CHROMA_OFFSET: 128,
};

/**
 * Range conversion parameters.
 * Different range scaling factors.
 */
export const RANGE_PARAMETERS = {
  [COLOR_RANGES.FULL]: {
    yMin: 0,
    yMax: 255,
    cMin: 0,
    cMax: 255,
    yScale: 1.0,
    cScale: 1.0,
  },
  [COLOR_RANGES.LIMITED]: {
    yMin: 16,
    yMax: 235,
    cMin: 16,
    cMax: 240,
    yScale: 219 / 255, // (235-16) / 255
    cScale: 224 / 255, // (240-16) / 255
  },
};

/**
 * Default conversion options.
 * Standard settings for RGB to YCbCr conversion.
 */
export const DEFAULT_CONVERSION_OPTIONS = {
  standard: COLOR_STANDARDS.BT601,
  range: COLOR_RANGES.FULL,
  rounding: ROUNDING_MODES.NEAREST,
  precision: PRECISION_MODES.MEDIUM,
  gamutMapping: true,
  qualityMetrics: false,
};

/**
 * Apply rounding mode to a floating-point value.
 * Implements various rounding strategies for precision control.
 *
 * @param {number} value - Value to round
 * @param {string} mode - Rounding mode
 * @returns {number} Rounded value
 */
export function applyRounding(value, mode) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Value must be a finite number");
  }

  switch (mode) {
    case ROUNDING_MODES.NEAREST:
      return Math.round(value);

    case ROUNDING_MODES.FLOOR:
      return Math.floor(value);

    case ROUNDING_MODES.CEILING:
      return Math.ceil(value);

    case ROUNDING_MODES.BANKERS: {
      const truncated = Math.trunc(value);
      const fraction = value - truncated;

      if (Math.abs(fraction) === 0.5) {
        // Round half to even
        return truncated % 2 === 0 ? truncated : truncated + Math.sign(fraction);
      }
      return Math.round(value);
    }

    default:
      throw new Error(`Unknown rounding mode: ${mode}`);
  }
}

/**
 * Clamp value to valid range with gamut mapping.
 * Ensures converted values stay within valid YCbCr ranges.
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum valid value
 * @param {number} max - Maximum valid value
 * @param {boolean} gamutMapping - Enable perceptual gamut mapping
 * @returns {number} Clamped value
 */
export function clampValue(value, min, max, gamutMapping = false) {
  if (typeof value !== "number") {
    return min;
  }

  // Handle infinite values
  if (value === Number.POSITIVE_INFINITY) {
    return max;
  }
  if (value === Number.NEGATIVE_INFINITY) {
    return min;
  }
  if (!Number.isFinite(value)) {
    return min; // NaN and other non-finite values
  }

  if (gamutMapping && (value < min || value > max)) {
    // Perceptual gamut mapping - compress out-of-gamut values
    const range = max - min;
    const center = min + range / 2;

    if (value < min) {
      // Compress below-range values
      const deficit = min - value;
      const compression = Math.min(deficit / range, 0.5);
      return min + (center - min) * compression;
    } else if (value > max) {
      // Compress above-range values
      const excess = value - max;
      const compression = Math.min(excess / range, 0.5);
      return max - (max - center) * compression;
    }
  }

  // Standard clamping
  return Math.max(min, Math.min(max, value));
}

/**
 * Get conversion coefficients for specified standard.
 * Returns appropriate coefficient set for color space conversion.
 *
 * @param {string} standard - Color standard
 * @returns {{
 *   YR: number,
 *   YG: number,
 *   YB: number,
 *   CBR: number,
 *   CBG: number,
 *   CBB: number,
 *   CRR: number,
 *   CRG: number,
 *   CRB: number,
 *   CHROMA_OFFSET: number
 * }} Conversion coefficients
 * @throws {Error} If standard is not supported
 */
export function getConversionCoefficients(standard) {
  switch (standard) {
    case COLOR_STANDARDS.BT601:
    case COLOR_STANDARDS.SRGB:
      return BT601_COEFFICIENTS;

    case COLOR_STANDARDS.BT709:
      return BT709_COEFFICIENTS;

    case COLOR_STANDARDS.BT2020:
      return BT2020_COEFFICIENTS;

    default:
      throw new Error(`Unsupported color standard: ${standard}`);
  }
}

/**
 * Detect optimal color range from RGB data.
 * Analyzes RGB content to determine best range setting.
 *
 * @param {Uint8ClampedArray|Uint8Array} rgbData - RGB pixel data (RGBA or RGB)
 * @param {number} channels - Number of channels (3 for RGB, 4 for RGBA)
 * @returns {string} Recommended color range
 */
export function detectColorRange(rgbData, channels = 4) {
  if (!(rgbData instanceof Uint8Array) && !(rgbData instanceof Uint8ClampedArray)) {
    throw new Error("RGB data must be Uint8Array or Uint8ClampedArray");
  }

  if (channels !== 3 && channels !== 4) {
    throw new Error("Channels must be 3 (RGB) or 4 (RGBA)");
  }

  const pixelCount = Math.floor(rgbData.length / channels);
  if (pixelCount === 0) {
    return COLOR_RANGES.FULL;
  }

  let blackPixels = 0;
  let whitePixels = 0;
  let nearBlackPixels = 0;
  let nearWhitePixels = 0;

  // Sample pixels for range analysis
  const sampleStep = Math.max(1, Math.floor(pixelCount / 10000)); // Sample up to 10k pixels

  for (let i = 0; i < pixelCount; i += sampleStep) {
    const offset = i * channels;
    const r = rgbData[offset];
    const g = rgbData[offset + 1];
    const b = rgbData[offset + 2];

    // Check for pure black/white
    if (r === 0 && g === 0 && b === 0) {
      blackPixels++;
    } else if (r === 255 && g === 255 && b === 255) {
      whitePixels++;
    }

    // Check for near black/white (limited range indicators)
    if (r <= 16 && g <= 16 && b <= 16) {
      nearBlackPixels++;
    } else if (r >= 235 && g >= 235 && b >= 235) {
      nearWhitePixels++;
    }
  }

  const sampledPixels = Math.ceil(pixelCount / sampleStep);
  const blackRatio = blackPixels / sampledPixels;
  const whiteRatio = whitePixels / sampledPixels;
  const nearBlackRatio = nearBlackPixels / sampledPixels;
  const nearWhiteRatio = nearWhitePixels / sampledPixels;

  // Heuristics for range detection
  if (nearBlackRatio > 0.01 && nearWhiteRatio > 0.01 && blackRatio < 0.001 && whiteRatio < 0.001) {
    // Likely limited range content
    return COLOR_RANGES.LIMITED;
  }

  // Default to full range
  return COLOR_RANGES.FULL;
}

/**
 * Convert single RGB pixel to YCbCr.
 * High-precision conversion of individual pixel values.
 *
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @param {Object} options - Conversion options
 * @returns {{y: number, cb: number, cr: number}} YCbCr values
 */
export function convertRgbPixelToYcbcr(r, g, b, options = {}) {
  // Validate inputs
  if (typeof r !== "number" || typeof g !== "number" || typeof b !== "number") {
    throw new Error("RGB components must be numbers");
  }

  // Merge with defaults
  const opts = { ...DEFAULT_CONVERSION_OPTIONS, ...options };

  // Get conversion coefficients
  const coeff = getConversionCoefficients(opts.standard);
  const rangeParams = RANGE_PARAMETERS[opts.range] || RANGE_PARAMETERS[COLOR_RANGES.FULL];

  // Normalize RGB to [0,1] range if needed
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Convert to YCbCr using matrix multiplication
  let y, cb, cr;

  if (opts.precision === PRECISION_MODES.HIGH) {
    // High precision floating-point
    y = coeff.YR * rNorm + coeff.YG * gNorm + coeff.YB * bNorm;
    cb = coeff.CBR * rNorm + coeff.CBG * gNorm + coeff.CBB * bNorm;
    cr = coeff.CRR * rNorm + coeff.CRG * gNorm + coeff.CRB * bNorm;
  } else {
    // Medium/fast precision with direct 8-bit calculation
    y = (coeff.YR * r + coeff.YG * g + coeff.YB * b) / 255;
    cb = (coeff.CBR * r + coeff.CBG * g + coeff.CBB * b) / 255;
    cr = (coeff.CRR * r + coeff.CRG * g + coeff.CRB * b) / 255;
  }

  // Scale to output range
  y = y * 255 * rangeParams.yScale + rangeParams.yMin;
  cb = cb * 255 * rangeParams.cScale + coeff.CHROMA_OFFSET;
  cr = cr * 255 * rangeParams.cScale + coeff.CHROMA_OFFSET;

  // Apply rounding
  y = applyRounding(y, opts.rounding);
  cb = applyRounding(cb, opts.rounding);
  cr = applyRounding(cr, opts.rounding);

  // Clamp to valid ranges
  y = clampValue(y, rangeParams.yMin, rangeParams.yMax, opts.gamutMapping);
  cb = clampValue(cb, rangeParams.cMin, rangeParams.cMax, opts.gamutMapping);
  cr = clampValue(cr, rangeParams.cMin, rangeParams.cMax, opts.gamutMapping);

  return { y, cb, cr };
}

/**
 * Convert RGB image data to YCbCr arrays.
 * Efficient batch conversion of entire image arrays.
 *
 * @param {Uint8ClampedArray|Uint8Array} rgbData - RGB pixel data (RGBA or RGB)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} channels - Number of channels (3 for RGB, 4 for RGBA)
 * @param {Object} options - Conversion options
 * @returns {{
 *   yData: Uint8Array,
 *   cbData: Uint8Array,
 *   crData: Uint8Array,
 *   metadata: Object
 * }} Converted YCbCr data and metadata
 */
export function convertRgbToYcbcr(rgbData, width, height, channels = 4, options = {}) {
  // Validate inputs
  if (!(rgbData instanceof Uint8Array) && !(rgbData instanceof Uint8ClampedArray)) {
    throw new Error("RGB data must be Uint8Array or Uint8ClampedArray");
  }

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error("Width must be positive integer");
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error("Height must be positive integer");
  }

  if (channels !== 3 && channels !== 4) {
    throw new Error("Channels must be 3 (RGB) or 4 (RGBA)");
  }

  const pixelCount = width * height;
  const expectedLength = pixelCount * channels;

  if (rgbData.length < expectedLength) {
    throw new Error(`Insufficient RGB data: expected ${expectedLength}, got ${rgbData.length}`);
  }

  // Merge options with defaults
  const opts = { ...DEFAULT_CONVERSION_OPTIONS, ...options };

  // Auto-detect range if requested
  if (opts.range === COLOR_RANGES.AUTO) {
    opts.range = detectColorRange(rgbData, channels);
  }

  // Prepare output arrays
  const yData = new Uint8Array(pixelCount);
  const cbData = new Uint8Array(pixelCount);
  const crData = new Uint8Array(pixelCount);

  // Conversion metadata
  const metadata = {
    standard: opts.standard,
    range: opts.range,
    rounding: opts.rounding,
    precision: opts.precision,
    gamutMapping: opts.gamutMapping,
    pixelsConverted: pixelCount,
    outOfGamutPixels: 0,
    conversionTime: 0,
  };

  const startTime = performance.now();

  // Get conversion coefficients and parameters
  const coeff = getConversionCoefficients(opts.standard);
  const rangeParams = RANGE_PARAMETERS[opts.range];

  // Batch conversion loop
  for (let i = 0; i < pixelCount; i++) {
    const rgbOffset = i * channels;
    const r = rgbData[rgbOffset];
    const g = rgbData[rgbOffset + 1];
    const b = rgbData[rgbOffset + 2];

    // Convert pixel
    let y, cb, cr;

    if (opts.precision === PRECISION_MODES.FAST) {
      // Fast integer approximation
      y = (coeff.YR * 256 * r + coeff.YG * 256 * g + coeff.YB * 256 * b) >> 8;
      cb = (coeff.CBR * 256 * r + coeff.CBG * 256 * g + coeff.CBB * 256 * b) >> 8;
      cr = (coeff.CRR * 256 * r + coeff.CRG * 256 * g + coeff.CRB * 256 * b) >> 8;
    } else {
      // Medium/high precision
      y = coeff.YR * r + coeff.YG * g + coeff.YB * b;
      cb = coeff.CBR * r + coeff.CBG * g + coeff.CBB * b;
      cr = coeff.CRR * r + coeff.CRG * g + coeff.CRB * b;
    }

    // Scale to output range
    y = y * rangeParams.yScale + rangeParams.yMin;
    cb = cb * rangeParams.cScale + coeff.CHROMA_OFFSET;
    cr = cr * rangeParams.cScale + coeff.CHROMA_OFFSET;

    // Apply rounding
    y = applyRounding(y, opts.rounding);
    cb = applyRounding(cb, opts.rounding);
    cr = applyRounding(cr, opts.rounding);

    // Check for out-of-gamut pixels before clamping
    const originalY = y;
    const originalCb = cb;
    const originalCr = cr;

    // Clamp to valid ranges
    y = clampValue(y, rangeParams.yMin, rangeParams.yMax, opts.gamutMapping);
    cb = clampValue(cb, rangeParams.cMin, rangeParams.cMax, opts.gamutMapping);
    cr = clampValue(cr, rangeParams.cMin, rangeParams.cMax, opts.gamutMapping);

    // Track out-of-gamut pixels
    if (originalY !== y || originalCb !== cb || originalCr !== cr) {
      metadata.outOfGamutPixels++;
    }

    // Store converted values
    yData[i] = y;
    cbData[i] = cb;
    crData[i] = cr;
  }

  metadata.conversionTime = performance.now() - startTime;

  return {
    yData,
    cbData,
    crData,
    metadata,
  };
}

/**
 * RGB to YCbCr conversion quality metrics.
 * Analyzes conversion quality and performance.
 */
export class ConversionMetrics {
  /**
   * Create conversion metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.conversionsPerformed = 0;
    /** @type {number} */
    this.totalPixelsConverted = 0;
    /** @type {number} */
    this.totalOutOfGamutPixels = 0;
    /** @type {number} */
    this.totalConversionTime = 0;
    /** @type {Object<string, number>} */
    this.standardUsage = {};
    /** @type {Object<string, number>} */
    this.rangeUsage = {};
    /** @type {Object<string, number>} */
    this.precisionUsage = {};
    /** @type {number[]} */
    this.conversionTimes = [];
    /** @type {string[]} */
    this.errors = [];
  }

  /**
   * Record conversion operation.
   *
   * @param {{
   *   standard: string,
   *   range: string,
   *   precision: string,
   *   pixelsConverted: number,
   *   outOfGamutPixels: number,
   *   conversionTime: number
   * }} metadata - Conversion metadata
   */
  recordConversion(metadata) {
    this.conversionsPerformed++;
    this.totalPixelsConverted += metadata.pixelsConverted;
    this.totalOutOfGamutPixels += metadata.outOfGamutPixels;
    this.totalConversionTime += metadata.conversionTime;

    this.standardUsage[metadata.standard] = (this.standardUsage[metadata.standard] || 0) + 1;
    this.rangeUsage[metadata.range] = (this.rangeUsage[metadata.range] || 0) + 1;
    this.precisionUsage[metadata.precision] = (this.precisionUsage[metadata.precision] || 0) + 1;

    this.conversionTimes.push(metadata.conversionTime);
  }

  /**
   * Record conversion error.
   *
   * @param {string} error - Error message
   */
  recordError(error) {
    this.errors.push(error);
  }

  /**
   * Get conversion metrics summary.
   *
   * @returns {{
   *   conversionsPerformed: number,
   *   totalPixelsConverted: number,
   *   averagePixelsPerConversion: number,
   *   outOfGamutRatio: number,
   *   averageConversionTime: number,
   *   pixelsPerSecond: number,
   *   standardDistribution: Object<string, number>,
   *   rangeDistribution: Object<string, number>,
   *   precisionDistribution: Object<string, number>,
   *   errorCount: number,
   *   description: string
   * }} Metrics summary
   */
  getSummary() {
    const averagePixelsPerConversion =
      this.conversionsPerformed > 0 ? Math.round(this.totalPixelsConverted / this.conversionsPerformed) : 0;

    const outOfGamutRatio = this.totalPixelsConverted > 0 ? this.totalOutOfGamutPixels / this.totalPixelsConverted : 0;

    const averageConversionTime =
      this.conversionsPerformed > 0 ? this.totalConversionTime / this.conversionsPerformed : 0;

    const pixelsPerSecond =
      this.totalConversionTime > 0 ? Math.round((this.totalPixelsConverted / this.totalConversionTime) * 1000) : 0;

    return {
      conversionsPerformed: this.conversionsPerformed,
      totalPixelsConverted: this.totalPixelsConverted,
      averagePixelsPerConversion,
      outOfGamutRatio: Math.round(outOfGamutRatio * 10000) / 100, // Percentage with 2 decimals
      averageConversionTime: Math.round(averageConversionTime * 100) / 100,
      pixelsPerSecond,
      standardDistribution: { ...this.standardUsage },
      rangeDistribution: { ...this.rangeUsage },
      precisionDistribution: { ...this.precisionUsage },
      errorCount: this.errors.length,
      description: `RGB→YCbCr: ${this.conversionsPerformed} conversions, ${this.totalPixelsConverted.toLocaleString()} pixels, ${pixelsPerSecond.toLocaleString()} px/s`,
    };
  }

  /**
   * Reset conversion metrics.
   */
  reset() {
    this.conversionsPerformed = 0;
    this.totalPixelsConverted = 0;
    this.totalOutOfGamutPixels = 0;
    this.totalConversionTime = 0;
    this.standardUsage = {};
    this.rangeUsage = {};
    this.precisionUsage = {};
    this.conversionTimes = [];
    this.errors = [];
  }
}

/**
 * Analyze RGB to YCbCr conversion quality.
 * Compares original and converted data for quality assessment.
 *
 * @param {Uint8ClampedArray|Uint8Array} _originalRgb - Original RGB data
 * @param {{yData: Uint8Array, cbData: Uint8Array, crData: Uint8Array}} ycbcrData - Converted YCbCr data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} _options - Analysis options
 * @returns {{
 *   luminanceRange: {min: number, max: number, mean: number},
 *   chromaRange: {cbMin: number, cbMax: number, crMin: number, crMax: number},
 *   dynamicRange: number,
 *   gamutUtilization: number,
 *   qualityScore: number,
 *   recommendations: string[]
 * }} Quality analysis results
 */
export function analyzeConversionQuality(_originalRgb, ycbcrData, width, height, _options = {}) {
  const pixelCount = width * height;

  // Analyze luminance (Y) component
  let yMin = 255;
  let yMax = 0;
  let ySum = 0;

  // Analyze chroma (Cb, Cr) components
  let cbMin = 255;
  let cbMax = 0;
  let crMin = 255;
  let crMax = 0;

  for (let i = 0; i < pixelCount; i++) {
    const y = ycbcrData.yData[i];
    const cb = ycbcrData.cbData[i];
    const cr = ycbcrData.crData[i];

    yMin = Math.min(yMin, y);
    yMax = Math.max(yMax, y);
    ySum += y;

    cbMin = Math.min(cbMin, cb);
    cbMax = Math.max(cbMax, cb);
    crMin = Math.min(crMin, cr);
    crMax = Math.max(crMax, cr);
  }

  const yMean = ySum / pixelCount;
  const dynamicRange = yMax - yMin;
  const gamutUtilization = dynamicRange / 255;

  // Calculate quality score (0-100)
  let qualityScore = 100;

  // Penalize limited dynamic range
  if (dynamicRange < 128) {
    qualityScore -= ((128 - dynamicRange) / 128) * 20;
  }

  // Penalize poor gamut utilization
  if (gamutUtilization < 0.8) {
    qualityScore -= (0.8 - gamutUtilization) * 25;
  }

  // Generate recommendations
  const recommendations = [];

  if (dynamicRange < 100) {
    recommendations.push("Consider gamma correction or histogram equalization");
  }

  if (cbMin > 100 && cbMax < 155 && crMin > 100 && crMax < 155) {
    recommendations.push("Limited chroma range detected - consider full range conversion");
  }

  if (yMean < 50) {
    recommendations.push("Dark image detected - consider brightness adjustment");
  } else if (yMean > 200) {
    recommendations.push("Bright image detected - consider exposure adjustment");
  }

  return {
    luminanceRange: {
      min: yMin,
      max: yMax,
      mean: Math.round(yMean),
    },
    chromaRange: {
      cbMin,
      cbMax,
      crMin,
      crMax,
    },
    dynamicRange,
    gamutUtilization: Math.round(gamutUtilization * 100) / 100,
    qualityScore: Math.round(qualityScore),
    recommendations,
  };
}
