/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file YCbCr ↔ RGB color space conversion implementation.
 *
 * Implements ITU-R BT.601 and BT.709 color space conversions between YCbCr
 * (luminance + chroma) and RGB (red, green, blue) with precise mathematical
 * transformations, proper rounding, range clamping, and performance optimizations
 * for both encoding and decoding pipelines.
 */

/**
 * Standard color space conversion matrices and parameters.
 * Based on ITU-R recommendations for different video standards.
 */
export const COLOR_STANDARDS = {
  /** ITU-R BT.601 (SDTV) - Most common for JPEG */
  BT601: {
    name: "ITU-R BT.601",
    description: "Standard Definition Television",
    // RGB to YCbCr coefficients
    rgbToYcbcr: {
      yr: 0.299,
      yg: 0.587,
      yb: 0.114,
      cbr: -0.168736,
      cbg: -0.331264,
      cbb: 0.5,
      crr: 0.5,
      crg: -0.418688,
      crb: -0.081312,
    },
    // YCbCr to RGB coefficients
    ycbcrToRgb: {
      ry: 1.0,
      rcb: 0.0,
      rcr: 1.402,
      gy: 1.0,
      gcb: -0.344136,
      gcr: -0.714136,
      by: 1.0,
      bcb: 1.772,
      bcr: 0.0,
    },
  },

  /** ITU-R BT.709 (HDTV) - High Definition */
  BT709: {
    name: "ITU-R BT.709",
    description: "High Definition Television",
    // RGB to YCbCr coefficients
    rgbToYcbcr: {
      yr: 0.2126,
      yg: 0.7152,
      yb: 0.0722,
      cbr: -0.114572,
      cbg: -0.385428,
      cbb: 0.5,
      crr: 0.5,
      crg: -0.454153,
      crb: -0.045847,
    },
    // YCbCr to RGB coefficients
    ycbcrToRgb: {
      ry: 1.0,
      rcb: 0.0,
      rcr: 1.5748,
      gy: 1.0,
      gcb: -0.187324,
      gcr: -0.468124,
      by: 1.0,
      bcb: 1.8556,
      bcr: 0.0,
    },
  },
};

/**
 * Color range modes for different applications.
 * Defines the valid range of Y, Cb, Cr values.
 */
export const COLOR_RANGES = {
  /** Full range: Y,Cb,Cr ∈ [0,255] */
  FULL: {
    name: "Full Range",
    yMin: 0,
    yMax: 255,
    cMin: 0,
    cMax: 255,
    cCenter: 128,
    description: "Full 8-bit range (0-255)",
  },
  /** Limited range: Y ∈ [16,235], Cb,Cr ∈ [16,240] */
  LIMITED: {
    name: "Limited Range",
    yMin: 16,
    yMax: 235,
    cMin: 16,
    cMax: 240,
    cCenter: 128,
    description: "TV/Video range with headroom/footroom",
  },
};

/**
 * Rounding modes for color conversion.
 * Different strategies for handling fractional values.
 */
export const ROUNDING_MODES = {
  /** Round to nearest integer */
  NEAREST: "nearest",
  /** Truncate (floor) */
  TRUNCATE: "truncate",
  /** Banker's rounding (round half to even) */
  BANKERS: "bankers",
};

/**
 * Minimum valid RGB component value.
 * @type {number}
 */
export const RGB_MIN = 0;

/**
 * Maximum valid RGB component value.
 * @type {number}
 */
export const RGB_MAX = 255;

/**
 * YCbCr chroma center value (neutral chroma).
 * @type {number}
 */
export const CHROMA_CENTER = 128;

/**
 * Apply rounding according to specified mode.
 * Different rounding strategies for precision control.
 *
 * @param {number} value - Value to round
 * @param {string} mode - Rounding mode
 * @returns {number} Rounded value
 * @private
 */
function applyRounding(value, mode) {
  switch (mode) {
    case ROUNDING_MODES.NEAREST:
      return Math.round(value);

    case ROUNDING_MODES.TRUNCATE:
      return Math.floor(value);

    case ROUNDING_MODES.BANKERS: {
      // Banker's rounding: round half to even
      const rounded = Math.round(value);
      const diff = Math.abs(value - Math.floor(value) - 0.5);
      if (diff < Number.EPSILON) {
        // Exactly half - round to even
        return Math.floor(value) % 2 === 0 ? Math.floor(value) : Math.ceil(value);
      }
      return rounded;
    }

    default:
      throw new Error(`Unknown rounding mode: ${mode}`);
  }
}

/**
 * Clamp value to valid RGB range.
 * Ensures output stays within displayable range.
 *
 * @param {number} value - Value to clamp
 * @returns {number} Clamped value (0-255)
 */
export function clampRgb(value) {
  if (value < RGB_MIN) return RGB_MIN;
  if (value > RGB_MAX) return RGB_MAX;
  return value;
}

/**
 * Clamp value to specified YCbCr range.
 * Ensures output stays within valid color space range.
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 */
export function clampYcbcr(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Convert single RGB pixel to YCbCr.
 * Transforms red, green, blue components to luminance and chroma.
 *
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @param {string} [standard="BT601"] - Color standard to use
 * @param {string} [range="FULL"] - Color range mode
 * @param {string} [rounding="NEAREST"] - Rounding mode
 * @returns {{y: number, cb: number, cr: number}} YCbCr components
 * @throws {Error} If parameters are invalid
 */
export function rgbToYcbcr(
  r,
  g,
  b,
  /** @type {"BT601"|"BT709"} */ standard = "BT601",
  /** @type {"FULL"|"LIMITED"} */ range = "FULL",
  rounding = ROUNDING_MODES.NEAREST
) {
  // Validate inputs
  if (typeof r !== "number" || typeof g !== "number" || typeof b !== "number") {
    throw new Error("RGB components must be numbers");
  }

  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error("RGB components must be in range 0-255");
  }

  if (!COLOR_STANDARDS[standard]) {
    throw new Error(`Unknown color standard: ${standard}`);
  }

  if (!COLOR_RANGES[range]) {
    throw new Error(`Unknown color range: ${range}`);
  }

  if (!Object.values(ROUNDING_MODES).includes(rounding)) {
    throw new Error(`Unknown rounding mode: ${rounding}`);
  }

  const coeffs = COLOR_STANDARDS[standard].rgbToYcbcr;
  const rangeInfo = COLOR_RANGES[range];

  // Apply conversion matrix
  const yFloat = coeffs.yr * r + coeffs.yg * g + coeffs.yb * b;
  const cbFloat = coeffs.cbr * r + coeffs.cbg * g + coeffs.cbb * b + rangeInfo.cCenter;
  const crFloat = coeffs.crr * r + coeffs.crg * g + coeffs.crb * b + rangeInfo.cCenter;

  // Apply rounding
  const y = applyRounding(yFloat, rounding);
  const cb = applyRounding(cbFloat, rounding);
  const cr = applyRounding(crFloat, rounding);

  // Apply range clamping
  return {
    y: clampYcbcr(y, rangeInfo.yMin, rangeInfo.yMax),
    cb: clampYcbcr(cb, rangeInfo.cMin, rangeInfo.cMax),
    cr: clampYcbcr(cr, rangeInfo.cMin, rangeInfo.cMax),
  };
}

/**
 * Convert single YCbCr pixel to RGB.
 * Transforms luminance and chroma components to red, green, blue.
 *
 * @param {number} y - Luminance component
 * @param {number} cb - Blue chroma component
 * @param {number} cr - Red chroma component
 * @param {string} [standard="BT601"] - Color standard to use
 * @param {string} [range="FULL"] - Color range mode
 * @param {string} [rounding="NEAREST"] - Rounding mode
 * @returns {{r: number, g: number, b: number}} RGB components (0-255)
 * @throws {Error} If parameters are invalid
 */
export function ycbcrToRgb(
  y,
  cb,
  cr,
  /** @type {"BT601"|"BT709"} */ standard = "BT601",
  /** @type {"FULL"|"LIMITED"} */ range = "FULL",
  rounding = ROUNDING_MODES.NEAREST
) {
  // Validate inputs
  if (typeof y !== "number" || typeof cb !== "number" || typeof cr !== "number") {
    throw new Error("YCbCr components must be numbers");
  }

  if (!COLOR_STANDARDS[standard]) {
    throw new Error(`Unknown color standard: ${standard}`);
  }

  if (!COLOR_RANGES[range]) {
    throw new Error(`Unknown color range: ${range}`);
  }

  if (!Object.values(ROUNDING_MODES).includes(rounding)) {
    throw new Error(`Unknown rounding mode: ${rounding}`);
  }

  const coeffs = COLOR_STANDARDS[standard].ycbcrToRgb;
  const rangeInfo = COLOR_RANGES[range];

  // Center chroma components
  const cbCentered = cb - rangeInfo.cCenter;
  const crCentered = cr - rangeInfo.cCenter;

  // Apply conversion matrix
  const rFloat = coeffs.ry * y + coeffs.rcb * cbCentered + coeffs.rcr * crCentered;
  const gFloat = coeffs.gy * y + coeffs.gcb * cbCentered + coeffs.gcr * crCentered;
  const bFloat = coeffs.by * y + coeffs.bcb * cbCentered + coeffs.bcr * crCentered;

  // Apply rounding
  const r = applyRounding(rFloat, rounding);
  const g = applyRounding(gFloat, rounding);
  const b = applyRounding(bFloat, rounding);

  // Apply RGB clamping
  return {
    r: clampRgb(r),
    g: clampRgb(g),
    b: clampRgb(b),
  };
}

/**
 * Convert RGB image data to YCbCr planar format.
 * Transforms interleaved RGB pixels to separate Y, Cb, Cr planes.
 *
 * @param {Uint8Array} rgbData - Interleaved RGB data (RGBRGBRGB...)
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} [standard="BT601"] - Color standard to use
 * @param {string} [range="FULL"] - Color range mode
 * @param {string} [rounding="NEAREST"] - Rounding mode
 * @returns {{y: Uint8Array, cb: Uint8Array, cr: Uint8Array}} Planar YCbCr data
 * @throws {Error} If parameters are invalid
 */
export function convertRgbToYcbcrPlanar(
  rgbData,
  width,
  height,
  /** @type {"BT601"|"BT709"} */ standard = "BT601",
  /** @type {"FULL"|"LIMITED"} */ range = "FULL",
  rounding = ROUNDING_MODES.NEAREST
) {
  // Validate inputs
  if (!(rgbData instanceof Uint8Array)) {
    throw new Error("RGB data must be Uint8Array");
  }

  if (width <= 0 || height <= 0) {
    throw new Error("Width and height must be positive");
  }

  const expectedLength = width * height * 3;
  if (rgbData.length !== expectedLength) {
    throw new Error(`RGB data length ${rgbData.length} doesn't match dimensions ${width}x${height}x3`);
  }

  const pixelCount = width * height;
  const yData = new Uint8Array(pixelCount);
  const cbData = new Uint8Array(pixelCount);
  const crData = new Uint8Array(pixelCount);

  // Convert each pixel
  for (let i = 0; i < pixelCount; i++) {
    const rgbIndex = i * 3;
    const r = rgbData[rgbIndex];
    const g = rgbData[rgbIndex + 1];
    const b = rgbData[rgbIndex + 2];

    const ycbcr = rgbToYcbcr(r, g, b, standard, range, rounding);

    yData[i] = ycbcr.y;
    cbData[i] = ycbcr.cb;
    crData[i] = ycbcr.cr;
  }

  return {
    y: yData,
    cb: cbData,
    cr: crData,
  };
}

/**
 * Convert YCbCr planar data to RGB image format.
 * Transforms separate Y, Cb, Cr planes to interleaved RGB pixels.
 *
 * @param {Uint8Array} yData - Luminance plane
 * @param {Uint8Array} cbData - Blue chroma plane
 * @param {Uint8Array} crData - Red chroma plane
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} [standard="BT601"] - Color standard to use
 * @param {string} [range="FULL"] - Color range mode
 * @param {string} [rounding="NEAREST"] - Rounding mode
 * @returns {Uint8Array} Interleaved RGB data (RGBRGBRGB...)
 * @throws {Error} If parameters are invalid
 */
export function convertYcbcrToRgbPlanar(
  yData,
  cbData,
  crData,
  width,
  height,
  /** @type {"BT601"|"BT709"} */ standard = "BT601",
  /** @type {"FULL"|"LIMITED"} */ range = "FULL",
  rounding = ROUNDING_MODES.NEAREST
) {
  // Validate inputs
  if (!(yData instanceof Uint8Array) || !(cbData instanceof Uint8Array) || !(crData instanceof Uint8Array)) {
    throw new Error("YCbCr data must be Uint8Array");
  }

  if (width <= 0 || height <= 0) {
    throw new Error("Width and height must be positive");
  }

  const pixelCount = width * height;
  if (yData.length !== pixelCount || cbData.length !== pixelCount || crData.length !== pixelCount) {
    throw new Error(`YCbCr data lengths don't match dimensions ${width}x${height}`);
  }

  const rgbData = new Uint8Array(pixelCount * 3);

  // Convert each pixel
  for (let i = 0; i < pixelCount; i++) {
    const y = yData[i];
    const cb = cbData[i];
    const cr = crData[i];

    const rgb = ycbcrToRgb(y, cb, cr, standard, range, rounding);

    const rgbIndex = i * 3;
    rgbData[rgbIndex] = rgb.r;
    rgbData[rgbIndex + 1] = rgb.g;
    rgbData[rgbIndex + 2] = rgb.b;
  }

  return rgbData;
}

/**
 * Convert RGB image data to YCbCr interleaved format.
 * Transforms RGB pixels to interleaved YCbCr format.
 *
 * @param {Uint8Array} rgbData - Interleaved RGB data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} [standard="BT601"] - Color standard to use
 * @param {string} [range="FULL"] - Color range mode
 * @param {string} [rounding="NEAREST"] - Rounding mode
 * @returns {Uint8Array} Interleaved YCbCr data (YCbCrYCbCrYCbCr...)
 */
export function convertRgbToYcbcrInterleaved(
  rgbData,
  width,
  height,
  /** @type {"BT601"|"BT709"} */ standard = "BT601",
  /** @type {"FULL"|"LIMITED"} */ range = "FULL",
  rounding = ROUNDING_MODES.NEAREST
) {
  // Validate inputs (similar to planar version)
  if (!(rgbData instanceof Uint8Array)) {
    throw new Error("RGB data must be Uint8Array");
  }

  if (width <= 0 || height <= 0) {
    throw new Error("Width and height must be positive");
  }

  const expectedLength = width * height * 3;
  if (rgbData.length !== expectedLength) {
    throw new Error(`RGB data length ${rgbData.length} doesn't match dimensions ${width}x${height}x3`);
  }

  const pixelCount = width * height;
  const ycbcrData = new Uint8Array(pixelCount * 3);

  // Convert each pixel
  for (let i = 0; i < pixelCount; i++) {
    const rgbIndex = i * 3;
    const r = rgbData[rgbIndex];
    const g = rgbData[rgbIndex + 1];
    const b = rgbData[rgbIndex + 2];

    const ycbcr = rgbToYcbcr(r, g, b, standard, range, rounding);

    const ycbcrIndex = i * 3;
    ycbcrData[ycbcrIndex] = ycbcr.y;
    ycbcrData[ycbcrIndex + 1] = ycbcr.cb;
    ycbcrData[ycbcrIndex + 2] = ycbcr.cr;
  }

  return ycbcrData;
}

/**
 * Convert YCbCr interleaved data to RGB image format.
 * Transforms interleaved YCbCr pixels to RGB format.
 *
 * @param {Uint8Array} ycbcrData - Interleaved YCbCr data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} [standard="BT601"] - Color standard to use
 * @param {string} [range="FULL"] - Color range mode
 * @param {string} [rounding="NEAREST"] - Rounding mode
 * @returns {Uint8Array} Interleaved RGB data
 */
export function convertYcbcrToRgbInterleaved(
  ycbcrData,
  width,
  height,
  /** @type {"BT601"|"BT709"} */ standard = "BT601",
  /** @type {"FULL"|"LIMITED"} */ range = "FULL",
  rounding = ROUNDING_MODES.NEAREST
) {
  // Validate inputs
  if (!(ycbcrData instanceof Uint8Array)) {
    throw new Error("YCbCr data must be Uint8Array");
  }

  if (width <= 0 || height <= 0) {
    throw new Error("Width and height must be positive");
  }

  const expectedLength = width * height * 3;
  if (ycbcrData.length !== expectedLength) {
    throw new Error(`YCbCr data length ${ycbcrData.length} doesn't match dimensions ${width}x${height}x3`);
  }

  const pixelCount = width * height;
  const rgbData = new Uint8Array(pixelCount * 3);

  // Convert each pixel
  for (let i = 0; i < pixelCount; i++) {
    const ycbcrIndex = i * 3;
    const y = ycbcrData[ycbcrIndex];
    const cb = ycbcrData[ycbcrIndex + 1];
    const cr = ycbcrData[ycbcrIndex + 2];

    const rgb = ycbcrToRgb(y, cb, cr, standard, range, rounding);

    const rgbIndex = i * 3;
    rgbData[rgbIndex] = rgb.r;
    rgbData[rgbIndex + 1] = rgb.g;
    rgbData[rgbIndex + 2] = rgb.b;
  }

  return rgbData;
}

/**
 * Color space conversion quality metrics.
 * Analyzes quality and characteristics of color conversions.
 */
export class ColorSpaceMetrics {
  /**
   * Create color space metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.pixelsProcessed = 0;
    /** @type {Object<string, number>} */
    this.standardUsage = {};
    /** @type {Object<string, number>} */
    this.rangeUsage = {};
    /** @type {number} */
    this.clampingEvents = 0;
    /** @type {{r: {min: number, max: number}, g: {min: number, max: number}, b: {min: number, max: number}}} */
    this.rgbRange = { r: { min: 255, max: 0 }, g: { min: 255, max: 0 }, b: { min: 255, max: 0 } };
    /** @type {{y: {min: number, max: number}, cb: {min: number, max: number}, cr: {min: number, max: number}}} */
    this.ycbcrRange = { y: { min: 255, max: 0 }, cb: { min: 255, max: 0 }, cr: { min: 255, max: 0 } };
  }

  /**
   * Record color conversion operation.
   *
   * @param {number} pixelCount - Number of pixels processed
   * @param {string} standard - Color standard used
   * @param {string} range - Color range used
   * @param {boolean} hadClamping - Whether clamping was applied
   */
  recordConversion(pixelCount, standard, range, hadClamping) {
    this.pixelsProcessed += pixelCount;
    this.standardUsage[standard] = (this.standardUsage[standard] || 0) + 1;
    this.rangeUsage[range] = (this.rangeUsage[range] || 0) + 1;

    if (hadClamping) {
      this.clampingEvents++;
    }
  }

  /**
   * Update color value ranges.
   *
   * @param {{r: number, g: number, b: number}} [rgb] - RGB values
   * @param {{y: number, cb: number, cr: number}} [ycbcr] - YCbCr values
   */
  updateRanges(rgb, ycbcr) {
    if (rgb) {
      this.rgbRange.r.min = Math.min(this.rgbRange.r.min, rgb.r);
      this.rgbRange.r.max = Math.max(this.rgbRange.r.max, rgb.r);
      this.rgbRange.g.min = Math.min(this.rgbRange.g.min, rgb.g);
      this.rgbRange.g.max = Math.max(this.rgbRange.g.max, rgb.g);
      this.rgbRange.b.min = Math.min(this.rgbRange.b.min, rgb.b);
      this.rgbRange.b.max = Math.max(this.rgbRange.b.max, rgb.b);
    }

    if (ycbcr) {
      this.ycbcrRange.y.min = Math.min(this.ycbcrRange.y.min, ycbcr.y);
      this.ycbcrRange.y.max = Math.max(this.ycbcrRange.y.max, ycbcr.y);
      this.ycbcrRange.cb.min = Math.min(this.ycbcrRange.cb.min, ycbcr.cb);
      this.ycbcrRange.cb.max = Math.max(this.ycbcrRange.cb.max, ycbcr.cb);
      this.ycbcrRange.cr.min = Math.min(this.ycbcrRange.cr.min, ycbcr.cr);
      this.ycbcrRange.cr.max = Math.max(this.ycbcrRange.cr.max, ycbcr.cr);
    }
  }

  /**
   * Get metrics summary.
   *
   * @returns {Object} Metrics summary
   */
  getSummary() {
    const mostUsedStandard = Object.keys(this.standardUsage).reduce(
      (a, b) => (this.standardUsage[a] > this.standardUsage[b] ? a : b),
      "none"
    );

    const mostUsedRange = Object.keys(this.rangeUsage).reduce(
      (a, b) => (this.rangeUsage[a] > this.rangeUsage[b] ? a : b),
      "none"
    );

    return {
      pixelsProcessed: this.pixelsProcessed,
      standardUsage: { ...this.standardUsage },
      rangeUsage: { ...this.rangeUsage },
      mostUsedStandard,
      mostUsedRange,
      clampingEvents: this.clampingEvents,
      clampingRate: this.pixelsProcessed > 0 ? this.clampingEvents / this.pixelsProcessed : 0,
      rgbRange: JSON.parse(JSON.stringify(this.rgbRange)),
      ycbcrRange: JSON.parse(JSON.stringify(this.ycbcrRange)),
      description: `Color conversion: ${this.pixelsProcessed} pixels, ${this.clampingEvents} clamps, ${mostUsedStandard}/${mostUsedRange}`,
    };
  }

  /**
   * Reset metrics.
   */
  reset() {
    this.pixelsProcessed = 0;
    this.standardUsage = {};
    this.rangeUsage = {};
    this.clampingEvents = 0;
    this.rgbRange = { r: { min: 255, max: 0 }, g: { min: 255, max: 0 }, b: { min: 255, max: 0 } };
    this.ycbcrRange = { y: { min: 255, max: 0 }, cb: { min: 255, max: 0 }, cr: { min: 255, max: 0 } };
  }
}

/**
 * Get summary information about color space conversion.
 * Provides debugging and analysis information.
 *
 * @param {number} pixelCount - Number of pixels processed
 * @param {string} direction - Conversion direction ("RGB→YCbCr" or "YCbCr→RGB")
 * @param {string} standard - Color standard used
 * @param {string} range - Color range used
 * @param {string} format - Data format ("planar" or "interleaved")
 * @returns {Object} Summary information
 */
export function getColorConversionSummary(
  pixelCount,
  direction,
  /** @type {"BT601"|"BT709"} */ standard,
  /** @type {"FULL"|"LIMITED"} */ range,
  format
) {
  const standardInfo = COLOR_STANDARDS[standard];
  const rangeInfo = COLOR_RANGES[range];

  return {
    pixelCount,
    direction,
    standard: standardInfo ? standardInfo.name : standard,
    range: rangeInfo ? rangeInfo.name : range,
    format,
    totalOperations: pixelCount * 3, // 3 operations per pixel
    description: `Color conversion: ${pixelCount} pixels ${direction} using ${standardInfo?.name || standard} (${rangeInfo?.name || range}) in ${format} format`,
  };
}
