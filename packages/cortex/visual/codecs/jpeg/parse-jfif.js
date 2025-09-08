/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JFIF metadata parsing from JPEG APP0 segments.
 *
 * Implements JFIF 1.02 specification for extracting pixel density information,
 * aspect ratios, and embedded thumbnails from JPEG File Interchange Format
 * markers. Handles version compatibility, density unit conversions, and
 * thumbnail data extraction with comprehensive error checking.
 */

/**
 * JFIF identifier in APP0 segment.
 * Must appear at the start of JFIF data.
 *
 * @type {string}
 */
export const JFIF_IDENTIFIER = "JFIF\0";

/**
 * JFXX identifier for JFIF extensions.
 * Appears in additional APP0 segments.
 *
 * @type {string}
 */
export const JFXX_IDENTIFIER = "JFXX\0";

/**
 * JFIF version numbers.
 * Supported JFIF format versions.
 */
export const JFIF_VERSIONS = {
  /** JFIF version 1.00 */
  V1_00: { major: 1, minor: 0, name: "1.00" },
  /** JFIF version 1.01 */
  V1_01: { major: 1, minor: 1, name: "1.01" },
  /** JFIF version 1.02 */
  V1_02: { major: 1, minor: 2, name: "1.02" },
};

/**
 * JFIF density units.
 * Defines how density values should be interpreted.
 */
export const JFIF_DENSITY_UNITS = {
  /** No units specified (aspect ratio only) */
  NONE: 0,
  /** Pixels per inch */
  PIXELS_PER_INCH: 1,
  /** Pixels per centimeter */
  PIXELS_PER_CM: 2,
};

/**
 * JFXX thumbnail format codes.
 * Different thumbnail encoding formats in JFXX extensions.
 */
export const JFXX_THUMBNAIL_FORMATS = {
  /** JPEG format thumbnail */
  JPEG: 0x10,
  /** 1 byte per pixel palettized */
  PALETTE: 0x11,
  /** 3 byte per pixel RGB */
  RGB: 0x13,
};

/**
 * Default density values.
 * Standard assumptions when density is not specified.
 */
export const DEFAULT_DENSITY = {
  /** Standard screen resolution */
  DPI: 72,
  /** Pixels per centimeter equivalent */
  PIXELS_PER_CM: 28.35, // 72 DPI / 2.54
};

/**
 * Maximum allowed thumbnail dimensions.
 * Prevents memory exhaustion attacks.
 */
export const MAX_THUMBNAIL_DIMENSION = 255;

/**
 * Maximum thumbnail data size in bytes.
 * 255×255×3 = ~195KB maximum
 */
export const MAX_THUMBNAIL_SIZE = MAX_THUMBNAIL_DIMENSION * MAX_THUMBNAIL_DIMENSION * 3;

/**
 * Convert pixels per inch to pixels per centimeter.
 * Uses standard conversion factor (1 inch = 2.54 cm).
 *
 * @param {number} dpi - Dots per inch
 * @returns {number} Pixels per centimeter
 */
export function dpiToPixelsPerCm(dpi) {
  if (typeof dpi !== "number" || dpi <= 0) {
    throw new Error("DPI must be a positive number");
  }
  return dpi / 2.54;
}

/**
 * Convert pixels per centimeter to pixels per inch.
 * Uses standard conversion factor (1 inch = 2.54 cm).
 *
 * @param {number} pixelsPerCm - Pixels per centimeter
 * @returns {number} Dots per inch
 */
export function pixelsPerCmToDpi(pixelsPerCm) {
  if (typeof pixelsPerCm !== "number" || pixelsPerCm <= 0) {
    throw new Error("Pixels per cm must be a positive number");
  }
  return pixelsPerCm * 2.54;
}

/**
 * Calculate aspect ratio from density values.
 * Determines width/height scaling factor for proper display.
 *
 * @param {number} xDensity - Horizontal density
 * @param {number} yDensity - Vertical density
 * @returns {number} Aspect ratio (width/height)
 */
export function calculateAspectRatio(xDensity, yDensity) {
  if (typeof xDensity !== "number" || typeof yDensity !== "number") {
    throw new Error("Density values must be numbers");
  }

  if (xDensity <= 0 || yDensity <= 0) {
    return 1.0; // Square pixels assumption
  }

  return xDensity / yDensity;
}

/**
 * Normalize density to a standard unit.
 * Converts density values to pixels per inch for consistency.
 *
 * @param {number} density - Density value
 * @param {number} units - Density units (JFIF_DENSITY_UNITS)
 * @returns {number} Density in pixels per inch
 */
export function normalizeDensity(density, units) {
  if (typeof density !== "number" || typeof units !== "number") {
    throw new Error("Density and units must be numbers");
  }

  if (density <= 0) {
    return DEFAULT_DENSITY.DPI;
  }

  switch (units) {
    case JFIF_DENSITY_UNITS.PIXELS_PER_INCH:
      return density;

    case JFIF_DENSITY_UNITS.PIXELS_PER_CM:
      return pixelsPerCmToDpi(density);

    default:
      return DEFAULT_DENSITY.DPI;
  }
}

/**
 * Parse JFIF header from APP0 segment data.
 * Extracts version, density, and thumbnail information.
 *
 * @param {Uint8Array} app0Data - Complete APP0 segment data
 * @returns {{
 *   identifier: string,
 *   version: {major: number, minor: number, name: string},
 *   densityUnits: number,
 *   xDensity: number,
 *   yDensity: number,
 *   thumbnailWidth: number,
 *   thumbnailHeight: number,
 *   thumbnailData: Uint8Array | null
 * }} Parsed JFIF data
 * @throws {Error} If APP0 data is invalid
 */
export function parseJfifData(app0Data) {
  // Validate input
  if (!(app0Data instanceof Uint8Array)) {
    throw new Error("APP0 data must be Uint8Array");
  }

  if (app0Data.length < JFIF_IDENTIFIER.length) {
    throw new Error("APP0 data too short for JFIF");
  }

  // Check for JFIF identifier
  const identifier = new TextDecoder("ascii").decode(app0Data.slice(0, JFIF_IDENTIFIER.length));
  if (identifier !== JFIF_IDENTIFIER) {
    throw new Error(`Invalid JFIF identifier: ${identifier}`);
  }

  // Minimum JFIF header is 14 bytes (5 + 2 + 1 + 2 + 2 + 1 + 1)
  if (app0Data.length < 14) {
    throw new Error("JFIF header too short");
  }

  let offset = JFIF_IDENTIFIER.length;

  // Parse version (2 bytes)
  const majorVersion = app0Data[offset++];
  const minorVersion = app0Data[offset++];

  // Validate version
  const versionKey = `${majorVersion}.${minorVersion.toString().padStart(2, "0")}`;
  const version = Object.values(JFIF_VERSIONS).find((v) => v.name === versionKey) || {
    major: majorVersion,
    minor: minorVersion,
    name: versionKey,
  };

  // Parse density units (1 byte)
  const densityUnits = app0Data[offset++];

  // Parse density values (4 bytes)
  const xDensity = (app0Data[offset] << 8) | app0Data[offset + 1];
  offset += 2;
  const yDensity = (app0Data[offset] << 8) | app0Data[offset + 1];
  offset += 2;

  // Parse thumbnail dimensions (2 bytes)
  const thumbnailWidth = app0Data[offset++];
  const thumbnailHeight = app0Data[offset++];

  // Calculate expected thumbnail data size
  const expectedThumbnailSize = thumbnailWidth * thumbnailHeight * 3; // RGB

  // Validate thumbnail data size
  if (expectedThumbnailSize > 0) {
    if (offset + expectedThumbnailSize > app0Data.length) {
      throw new Error(
        `Insufficient data for thumbnail: need ${expectedThumbnailSize}, have ${app0Data.length - offset}`
      );
    }

    if (expectedThumbnailSize > MAX_THUMBNAIL_SIZE) {
      throw new Error(`Thumbnail too large: ${expectedThumbnailSize} bytes (max ${MAX_THUMBNAIL_SIZE})`);
    }
  }

  // Extract thumbnail data
  let thumbnailData = null;
  if (expectedThumbnailSize > 0) {
    thumbnailData = app0Data.slice(offset, offset + expectedThumbnailSize);
  }

  return {
    identifier,
    version,
    densityUnits,
    xDensity,
    yDensity,
    thumbnailWidth,
    thumbnailHeight,
    thumbnailData,
  };
}

/**
 * Parse JFXX extension from APP0 segment data.
 * Extracts additional thumbnail formats and extensions.
 *
 * @param {Uint8Array} app0Data - Complete APP0 segment data
 * @returns {{
 *   identifier: string,
 *   thumbnailFormat: number,
 *   thumbnailData: Uint8Array
 * }} Parsed JFXX data
 * @throws {Error} If APP0 data is invalid
 */
export function parseJfxxData(app0Data) {
  // Validate input
  if (!(app0Data instanceof Uint8Array)) {
    throw new Error("APP0 data must be Uint8Array");
  }

  if (app0Data.length < JFXX_IDENTIFIER.length) {
    throw new Error("APP0 data too short for JFXX");
  }

  // Check for JFXX identifier
  const identifier = new TextDecoder("ascii").decode(app0Data.slice(0, JFXX_IDENTIFIER.length));
  if (identifier !== JFXX_IDENTIFIER) {
    throw new Error(`Invalid JFXX identifier: ${identifier}`);
  }

  // Minimum JFXX header is 6 bytes (5 + 1)
  if (app0Data.length < 6) {
    throw new Error("JFXX header too short");
  }

  let offset = JFXX_IDENTIFIER.length;

  // Parse thumbnail format (1 byte)
  const thumbnailFormat = app0Data[offset++];

  // Validate thumbnail format
  if (!Object.values(JFXX_THUMBNAIL_FORMATS).includes(thumbnailFormat)) {
    throw new Error(`Unknown JFXX thumbnail format: 0x${thumbnailFormat.toString(16)}`);
  }

  // Extract remaining data as thumbnail
  const thumbnailData = app0Data.slice(offset);

  return {
    identifier,
    thumbnailFormat,
    thumbnailData,
  };
}

/**
 * Extract human-readable metadata from JFIF data.
 * Converts raw JFIF data to user-friendly format.
 *
 * @param {{
 *   version: {major: number, minor: number, name: string},
 *   densityUnits: number,
 *   xDensity: number,
 *   yDensity: number,
 *   thumbnailWidth: number,
 *   thumbnailHeight: number,
 *   thumbnailData: Uint8Array | null
 * }} jfifData - Parsed JFIF data
 * @returns {{
 *   version: string,
 *   density: {x: number, y: number, units: string, dpi: {x: number, y: number}},
 *   aspectRatio: number,
 *   thumbnail: {width: number, height: number, hasData: boolean, size: number} | null
 * }} Human-readable metadata
 */
export function extractJfifMetadata(jfifData) {
  // Version information
  const version = jfifData.version.name;

  // Density information
  let unitsName;
  switch (jfifData.densityUnits) {
    case JFIF_DENSITY_UNITS.PIXELS_PER_INCH:
      unitsName = "pixels per inch";
      break;
    case JFIF_DENSITY_UNITS.PIXELS_PER_CM:
      unitsName = "pixels per centimeter";
      break;
    default:
      unitsName = "none (aspect ratio only)";
      break;
  }

  const density = {
    x: jfifData.xDensity,
    y: jfifData.yDensity,
    units: unitsName,
    dpi: {
      x: normalizeDensity(jfifData.xDensity, jfifData.densityUnits),
      y: normalizeDensity(jfifData.yDensity, jfifData.densityUnits),
    },
  };

  // Aspect ratio
  const aspectRatio = calculateAspectRatio(jfifData.xDensity, jfifData.yDensity);

  // Thumbnail information
  let thumbnail = null;
  if (jfifData.thumbnailWidth > 0 || jfifData.thumbnailHeight > 0) {
    thumbnail = {
      width: jfifData.thumbnailWidth,
      height: jfifData.thumbnailHeight,
      hasData: jfifData.thumbnailData !== null,
      size: jfifData.thumbnailData ? jfifData.thumbnailData.length : 0,
    };
  }

  return {
    version,
    density,
    aspectRatio,
    thumbnail,
  };
}

/**
 * JFIF parsing quality metrics.
 * Analyzes JFIF parsing process and results.
 */
export class JfifMetrics {
  /**
   * Create JFIF metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.jfifSegmentsParsed = 0;
    /** @type {number} */
    this.jfxxSegmentsParsed = 0;
    /** @type {number} */
    this.thumbnailsExtracted = 0;
    /** @type {number} */
    this.totalThumbnailSize = 0;
    /** @type {Object<string, number>} */
    this.versionCounts = {};
    /** @type {Object<string, number>} */
    this.densityUnitCounts = {};
    /** @type {Object<number, number>} */
    this.thumbnailFormatCounts = {};
    /** @type {string[]} */
    this.errors = [];
  }

  /**
   * Record JFIF segment processing.
   *
   * @param {string} version - JFIF version
   * @param {number} densityUnits - Density units
   * @param {boolean} hasThumbnail - Whether segment has thumbnail
   * @param {number} thumbnailSize - Thumbnail data size
   */
  recordJfifSegment(version, densityUnits, hasThumbnail, thumbnailSize) {
    this.jfifSegmentsParsed++;

    this.versionCounts[version] = (this.versionCounts[version] || 0) + 1;

    const unitsName =
      Object.keys(JFIF_DENSITY_UNITS).find(
        (key) => JFIF_DENSITY_UNITS[/** @type {keyof typeof JFIF_DENSITY_UNITS} */ (key)] === densityUnits
      ) || "unknown";
    this.densityUnitCounts[unitsName] = (this.densityUnitCounts[unitsName] || 0) + 1;

    if (hasThumbnail) {
      this.thumbnailsExtracted++;
      this.totalThumbnailSize += thumbnailSize;
    }
  }

  /**
   * Record JFXX segment processing.
   *
   * @param {number} thumbnailFormat - Thumbnail format code
   * @param {number} thumbnailSize - Thumbnail data size
   */
  recordJfxxSegment(thumbnailFormat, thumbnailSize) {
    this.jfxxSegmentsParsed++;
    this.thumbnailFormatCounts[thumbnailFormat] = (this.thumbnailFormatCounts[thumbnailFormat] || 0) + 1;
    this.totalThumbnailSize += thumbnailSize;
  }

  /**
   * Record parsing error.
   *
   * @param {string} error - Error message
   */
  recordError(error) {
    this.errors.push(error);
  }

  /**
   * Get metrics summary.
   *
   * @returns {{
   *   jfifSegmentsParsed: number,
   *   jfxxSegmentsParsed: number,
   *   thumbnailsExtracted: number,
   *   totalThumbnailSize: number,
   *   averageThumbnailSize: number,
   *   versionCounts: Object<string, number>,
   *   densityUnitCounts: Object<string, number>,
   *   thumbnailFormatCounts: Object<number, number>,
   *   errorCount: number,
   *   mostCommonVersion: string,
   *   description: string
   * }} Metrics summary
   */
  getSummary() {
    const totalSegments = this.jfifSegmentsParsed + this.jfxxSegmentsParsed;
    const totalThumbnails = this.thumbnailsExtracted + this.jfxxSegmentsParsed;
    const averageThumbnailSize = totalThumbnails > 0 ? Math.round(this.totalThumbnailSize / totalThumbnails) : 0;

    const mostCommonVersion =
      Object.keys(this.versionCounts).length > 0
        ? Object.keys(this.versionCounts).reduce((a, b) => (this.versionCounts[a] >= this.versionCounts[b] ? a : b))
        : "none";

    return {
      jfifSegmentsParsed: this.jfifSegmentsParsed,
      jfxxSegmentsParsed: this.jfxxSegmentsParsed,
      thumbnailsExtracted: this.thumbnailsExtracted,
      totalThumbnailSize: this.totalThumbnailSize,
      averageThumbnailSize,
      versionCounts: { ...this.versionCounts },
      densityUnitCounts: { ...this.densityUnitCounts },
      thumbnailFormatCounts: { ...this.thumbnailFormatCounts },
      errorCount: this.errors.length,
      mostCommonVersion,
      description: `JFIF: ${totalSegments} segments, ${this.thumbnailsExtracted} thumbnails, ${this.errors.length} errors`,
    };
  }

  /**
   * Reset metrics.
   */
  reset() {
    this.jfifSegmentsParsed = 0;
    this.jfxxSegmentsParsed = 0;
    this.thumbnailsExtracted = 0;
    this.totalThumbnailSize = 0;
    this.versionCounts = {};
    this.densityUnitCounts = {};
    this.thumbnailFormatCounts = {};
    this.errors = [];
  }
}

/**
 * Get summary information about JFIF parsing.
 * Provides debugging and analysis information.
 *
 * @param {{
 *   version: {major: number, minor: number, name: string},
 *   densityUnits: number,
 *   xDensity: number,
 *   yDensity: number,
 *   thumbnailWidth: number,
 *   thumbnailHeight: number,
 *   thumbnailData: Uint8Array | null
 * }} jfifData - Parsed JFIF data
 * @returns {{
 *   version: string,
 *   densityUnits: number,
 *   hasThumbnail: boolean,
 *   thumbnailSize: number,
 *   aspectRatio: number,
 *   dpiX: number,
 *   dpiY: number,
 *   description: string
 * }} Summary information
 */
export function getJfifSummary(jfifData) {
  const version = jfifData.version.name;
  const hasThumbnail = jfifData.thumbnailWidth > 0 && jfifData.thumbnailHeight > 0;
  const thumbnailSize = jfifData.thumbnailData ? jfifData.thumbnailData.length : 0;
  const aspectRatio = calculateAspectRatio(jfifData.xDensity, jfifData.yDensity);
  const dpiX = normalizeDensity(jfifData.xDensity, jfifData.densityUnits);
  const dpiY = normalizeDensity(jfifData.yDensity, jfifData.densityUnits);

  return {
    version,
    densityUnits: jfifData.densityUnits,
    hasThumbnail,
    thumbnailSize,
    aspectRatio: Math.round(aspectRatio * 1000) / 1000,
    dpiX: Math.round(dpiX * 100) / 100,
    dpiY: Math.round(dpiY * 100) / 100,
    description: `JFIF ${version}: ${dpiX.toFixed(0)}×${dpiY.toFixed(0)} DPI${hasThumbnail ? `, ${jfifData.thumbnailWidth}×${jfifData.thumbnailHeight} thumbnail` : ""}`,
  };
}
