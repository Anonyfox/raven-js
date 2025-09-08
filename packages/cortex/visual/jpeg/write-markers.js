/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG marker generation for encoding with complete file structure assembly.
 *
 * Implements ITU-T T.81 Section B marker generation and file structure assembly.
 * Creates complete JPEG files with proper marker sequences, table embedding, and
 * metadata integration. Supports baseline, progressive, and extended JPEG variants
 * with comprehensive validation and optimization.
 */

/**
 * JPEG marker constants for file structure generation.
 * Standard ITU-T T.81 marker definitions.
 */
export const JPEG_MARKERS = {
  /** Start of Image - File header */
  SOI: 0xffd8,
  /** End of Image - File terminator */
  EOI: 0xffd9,
  /** Start of Frame - Baseline DCT */
  SOF0: 0xffc0,
  /** Start of Frame - Extended Sequential DCT */
  SOF1: 0xffc1,
  /** Start of Frame - Progressive DCT */
  SOF2: 0xffc2,
  /** Start of Frame - Lossless Sequential */
  SOF3: 0xffc3,
  /** Define Huffman Table */
  DHT: 0xffc4,
  /** Define Quantization Table */
  DQT: 0xffdb,
  /** Define Restart Interval */
  DRI: 0xffdd,
  /** Start of Scan */
  SOS: 0xffda,
  /** Application Segment 0 (JFIF) */
  APP0: 0xffe0,
  /** Application Segment 1 (EXIF) */
  APP1: 0xffe1,
  /** Application Segment 14 (Adobe) */
  APP14: 0xffee,
  /** Comment */
  COM: 0xfffe,
  /** Restart Marker 0 */
  RST0: 0xffd0,
  /** Restart Marker 7 */
  RST7: 0xffd7,
};

/**
 * JPEG encoding modes for marker generation.
 * Different modes require different marker sequences.
 */
export const JPEG_MODES = {
  /** Baseline DCT (most common) */
  BASELINE: "baseline",
  /** Extended Sequential DCT */
  EXTENDED: "extended",
  /** Progressive DCT */
  PROGRESSIVE: "progressive",
  /** Lossless Sequential */
  LOSSLESS: "lossless",
};

/**
 * Component subsampling factors for SOF marker generation.
 * Standard JPEG subsampling patterns.
 */
export const SUBSAMPLING_FACTORS = {
  /** 4:4:4 - No subsampling */
  "4:4:4": { Y: [1, 1], Cb: [1, 1], Cr: [1, 1] },
  /** 4:2:2 - Horizontal subsampling */
  "4:2:2": { Y: [2, 1], Cb: [1, 1], Cr: [1, 1] },
  /** 4:2:0 - Horizontal and vertical subsampling */
  "4:2:0": { Y: [2, 2], Cb: [1, 1], Cr: [1, 1] },
  /** 4:1:1 - Aggressive horizontal subsampling */
  "4:1:1": { Y: [4, 1], Cb: [1, 1], Cr: [1, 1] },
};

/**
 * Default JPEG encoding options.
 * Standard settings for JPEG file generation.
 */
export const DEFAULT_WRITE_OPTIONS = {
  mode: JPEG_MODES.BASELINE,
  quality: 75,
  subsampling: "4:2:0",
  includeJFIF: true,
  includeEXIF: false,
  includeComment: false,
  optimizeTables: true,
  validateOutput: true,
  restartInterval: 0,
};

/**
 * Write 16-bit big-endian value to buffer.
 * JPEG uses big-endian byte order for all multi-byte values.
 *
 * @param {Uint8Array} buffer - Target buffer
 * @param {number} offset - Write offset
 * @param {number} value - 16-bit value to write
 * @returns {number} New offset after write
 */
export function writeUint16BE(buffer, offset, value) {
  if (value < 0 || value > 0xffff) {
    throw new Error(`Value out of range for 16-bit: ${value}`);
  }

  buffer[offset] = (value >> 8) & 0xff;
  buffer[offset + 1] = value & 0xff;
  return offset + 2;
}

/**
 * Write JPEG marker to buffer.
 * All JPEG markers are 2 bytes starting with 0xFF.
 *
 * @param {Uint8Array} buffer - Target buffer
 * @param {number} offset - Write offset
 * @param {number} marker - Marker value
 * @returns {number} New offset after write
 */
export function writeMarker(buffer, offset, marker) {
  if ((marker & 0xff00) !== 0xff00) {
    throw new Error(`Invalid JPEG marker: 0x${marker.toString(16)}`);
  }

  return writeUint16BE(buffer, offset, marker);
}

/**
 * Write marker segment with length field.
 * Most JPEG markers have a length field followed by data.
 *
 * @param {Uint8Array} buffer - Target buffer
 * @param {number} offset - Write offset
 * @param {number} marker - Marker value
 * @param {Uint8Array} data - Segment data
 * @returns {number} New offset after write
 */
export function writeMarkerSegment(buffer, offset, marker, data) {
  if (!data || !(data instanceof Uint8Array)) {
    throw new Error("Segment data must be Uint8Array");
  }

  const segmentLength = data.length + 2; // Include length field itself
  if (segmentLength > 0xffff) {
    throw new Error(`Segment too large: ${segmentLength} bytes (max 65535)`);
  }

  // Write marker
  offset = writeMarker(buffer, offset, marker);

  // Write length
  offset = writeUint16BE(buffer, offset, segmentLength);

  // Write data
  buffer.set(data, offset);
  return offset + data.length;
}

/**
 * Generate SOI (Start of Image) marker.
 * First marker in every JPEG file.
 *
 * @returns {Uint8Array} SOI marker bytes
 */
export function generateSOI() {
  const buffer = new Uint8Array(2);
  writeMarker(buffer, 0, JPEG_MARKERS.SOI);
  return buffer;
}

/**
 * Generate EOI (End of Image) marker.
 * Last marker in every JPEG file.
 *
 * @returns {Uint8Array} EOI marker bytes
 */
export function generateEOI() {
  const buffer = new Uint8Array(2);
  writeMarker(buffer, 0, JPEG_MARKERS.EOI);
  return buffer;
}

/**
 * Generate JFIF APP0 marker.
 * Standard JFIF metadata for JPEG interchange.
 *
 * @param {{
 *   version?: {major: number, minor: number},
 *   densityUnits?: number,
 *   xDensity?: number,
 *   yDensity?: number,
 *   thumbnail?: {width: number, height: number, data: Uint8Array}
 * }} options - JFIF options
 * @returns {Uint8Array} JFIF APP0 segment
 */
export function generateJFIF(options = {}) {
  const {
    version = { major: 1, minor: 2 },
    densityUnits = 1, // 1 = pixels per inch
    xDensity = 72,
    yDensity = 72,
    thumbnail = null,
  } = options;

  // Validate parameters
  if (version.major < 1 || version.major > 255 || version.minor < 0 || version.minor > 255) {
    throw new Error(`Invalid JFIF version: ${version.major}.${version.minor}`);
  }

  if (densityUnits < 0 || densityUnits > 2) {
    throw new Error(`Invalid density units: ${densityUnits} (must be 0-2)`);
  }

  if (xDensity < 1 || xDensity > 65535 || yDensity < 1 || yDensity > 65535) {
    throw new Error(`Invalid density values: ${xDensity}x${yDensity}`);
  }

  // Calculate segment size
  let dataSize = 14; // Fixed JFIF header size
  if (thumbnail) {
    if (thumbnail.width > 255 || thumbnail.height > 255) {
      throw new Error(`Thumbnail too large: ${thumbnail.width}x${thumbnail.height} (max 255x255)`);
    }
    dataSize += 2 + thumbnail.width * thumbnail.height * 3; // RGB thumbnail
  }

  const data = new Uint8Array(dataSize);
  let offset = 0;

  // JFIF identifier
  const jfifId = new TextEncoder().encode("JFIF\0");
  data.set(jfifId, offset);
  offset += jfifId.length;

  // Version
  data[offset++] = version.major;
  data[offset++] = version.minor;

  // Density units
  data[offset++] = densityUnits;

  // Density values
  offset = writeUint16BE(data, offset, xDensity);
  offset = writeUint16BE(data, offset, yDensity);

  // Thumbnail
  if (thumbnail) {
    data[offset++] = thumbnail.width;
    data[offset++] = thumbnail.height;
    data.set(thumbnail.data, offset);
  } else {
    data[offset++] = 0; // No thumbnail width
    data[offset++] = 0; // No thumbnail height
  }

  // Create complete APP0 segment
  const segmentSize = data.length + 4; // Marker + length + data
  const segment = new Uint8Array(segmentSize);
  writeMarkerSegment(segment, 0, JPEG_MARKERS.APP0, data);

  return segment;
}

/**
 * Generate DQT (Define Quantization Table) marker.
 * Embeds quantization tables for DCT coefficient quantization.
 *
 * @param {Array<{
 *   destination: number,
 *   precision: number,
 *   table: Uint8Array|Uint16Array
 * }>} tables - Quantization tables to embed
 * @returns {Uint8Array} DQT marker segment
 */
export function generateDQT(tables) {
  if (!Array.isArray(tables) || tables.length === 0) {
    throw new Error("Must provide at least one quantization table");
  }

  let totalDataSize = 0;
  for (const table of tables) {
    if (table.destination < 0 || table.destination > 3) {
      throw new Error(`Invalid quantization table destination: ${table.destination}`);
    }

    if (table.precision !== 8 && table.precision !== 16) {
      throw new Error(`Invalid quantization table precision: ${table.precision}`);
    }

    const expectedElements = 64;
    if (table.table.length !== expectedElements) {
      throw new Error(`Invalid quantization table size: ${table.table.length} elements (expected ${expectedElements})`);
    }

    const tableDataSize = table.precision === 8 ? 64 : 128; // Bytes for table data
    totalDataSize += 1 + tableDataSize; // Precision/destination byte + table data
  }

  const data = new Uint8Array(totalDataSize);
  let offset = 0;

  for (const table of tables) {
    // Precision and destination byte
    const precisionFlag = table.precision === 16 ? 1 : 0;
    data[offset++] = (precisionFlag << 4) | table.destination;

    // Table data in zigzag order
    if (table.precision === 8) {
      data.set(table.table, offset);
      offset += 64;
    } else {
      // 16-bit values in big-endian order
      for (let i = 0; i < 64; i++) {
        offset = writeUint16BE(data, offset, table.table[i]);
      }
    }
  }

  // Create complete DQT segment
  const segmentSize = data.length + 4; // Marker + length + data
  const segment = new Uint8Array(segmentSize);
  writeMarkerSegment(segment, 0, JPEG_MARKERS.DQT, data);

  return segment;
}

/**
 * Generate DHT (Define Huffman Table) marker.
 * Embeds Huffman tables for entropy coding.
 *
 * @param {Array<{
 *   tableClass: number,
 *   destination: number,
 *   codeLengths: number[],
 *   symbols: number[]
 * }>} tables - Huffman tables to embed
 * @returns {Uint8Array} DHT marker segment
 */
export function generateDHT(tables) {
  if (!Array.isArray(tables) || tables.length === 0) {
    throw new Error("Must provide at least one Huffman table");
  }

  let totalDataSize = 0;
  for (const table of tables) {
    if (table.tableClass < 0 || table.tableClass > 1) {
      throw new Error(`Invalid Huffman table class: ${table.tableClass}`);
    }

    if (table.destination < 0 || table.destination > 3) {
      throw new Error(`Invalid Huffman table destination: ${table.destination}`);
    }

    if (!Array.isArray(table.codeLengths) || table.codeLengths.length !== 16) {
      throw new Error("Huffman table must have exactly 16 code length entries");
    }

    const symbolCount = table.codeLengths.reduce((sum, count) => sum + count, 0);
    if (!Array.isArray(table.symbols) || table.symbols.length !== symbolCount) {
      throw new Error(`Symbol count mismatch: ${table.symbols.length} symbols, ${symbolCount} expected`);
    }

    totalDataSize += 1 + 16 + table.symbols.length; // Class/destination + code lengths + symbols
  }

  const data = new Uint8Array(totalDataSize);
  let offset = 0;

  for (const table of tables) {
    // Table class and destination byte
    data[offset++] = (table.tableClass << 4) | table.destination;

    // Code lengths (16 bytes)
    for (let i = 0; i < 16; i++) {
      data[offset++] = table.codeLengths[i];
    }

    // Symbols
    for (const symbol of table.symbols) {
      if (symbol < 0 || symbol > 255) {
        throw new Error(`Invalid Huffman symbol: ${symbol}`);
      }
      data[offset++] = symbol;
    }
  }

  // Create complete DHT segment
  const segmentSize = data.length + 4; // Marker + length + data
  const segment = new Uint8Array(segmentSize);
  writeMarkerSegment(segment, 0, JPEG_MARKERS.DHT, data);

  return segment;
}

/**
 * Generate SOF (Start of Frame) marker.
 * Defines image structure and component information.
 *
 * @param {{
 *   mode: string,
 *   width: number,
 *   height: number,
 *   precision: number,
 *   components: Array<{
 *     id: number,
 *     samplingFactors: {horizontal: number, vertical: number},
 *     quantizationTable: number
 *   }>
 * }} frameInfo - Frame information
 * @returns {Uint8Array} SOF marker segment
 */
export function generateSOF(frameInfo) {
  const { mode, width, height, precision = 8, components } = frameInfo;

  // Validate parameters
  if (width < 1 || width > 65535 || height < 1 || height > 65535) {
    throw new Error(`Invalid image dimensions: ${width}x${height}`);
  }

  if (precision !== 8 && precision !== 12 && precision !== 16) {
    throw new Error(`Invalid precision: ${precision} (must be 8, 12, or 16)`);
  }

  if (!Array.isArray(components) || components.length === 0 || components.length > 255) {
    throw new Error(`Invalid component count: ${components.length}`);
  }

  // Determine SOF marker type
  let sofMarker;
  switch (mode) {
    case JPEG_MODES.BASELINE:
      sofMarker = JPEG_MARKERS.SOF0;
      break;
    case JPEG_MODES.EXTENDED:
      sofMarker = JPEG_MARKERS.SOF1;
      break;
    case JPEG_MODES.PROGRESSIVE:
      sofMarker = JPEG_MARKERS.SOF2;
      break;
    case JPEG_MODES.LOSSLESS:
      sofMarker = JPEG_MARKERS.SOF3;
      break;
    default:
      throw new Error(`Unknown JPEG mode: ${mode}`);
  }

  const dataSize = 6 + components.length * 3; // Header + component info
  const data = new Uint8Array(dataSize);
  let offset = 0;

  // Sample precision
  data[offset++] = precision;

  // Image dimensions
  offset = writeUint16BE(data, offset, height);
  offset = writeUint16BE(data, offset, width);

  // Number of components
  data[offset++] = components.length;

  // Component information
  for (const component of components) {
    if (component.id < 1 || component.id > 255) {
      throw new Error(`Invalid component ID: ${component.id}`);
    }

    const { horizontal, vertical } = component.samplingFactors;
    if (horizontal < 1 || horizontal > 4 || vertical < 1 || vertical > 4) {
      throw new Error(`Invalid sampling factors: ${horizontal}x${vertical}`);
    }

    if (component.quantizationTable < 0 || component.quantizationTable > 3) {
      throw new Error(`Invalid quantization table: ${component.quantizationTable}`);
    }

    data[offset++] = component.id;
    data[offset++] = (horizontal << 4) | vertical;
    data[offset++] = component.quantizationTable;
  }

  // Create complete SOF segment
  const segmentSize = data.length + 4; // Marker + length + data
  const segment = new Uint8Array(segmentSize);
  writeMarkerSegment(segment, 0, sofMarker, data);

  return segment;
}

/**
 * Generate SOS (Start of Scan) marker.
 * Defines scan parameters and component selection.
 *
 * @param {{
 *   components: Array<{
 *     id: number,
 *     huffmanTables: {dc: number, ac: number}
 *   }>,
 *   spectralStart?: number,
 *   spectralEnd?: number,
 *   approximation?: {high: number, low: number}
 * }} scanInfo - Scan information
 * @returns {Uint8Array} SOS marker segment
 */
export function generateSOS(scanInfo) {
  const { components, spectralStart = 0, spectralEnd = 63, approximation = { high: 0, low: 0 } } = scanInfo;

  // Validate parameters
  if (!Array.isArray(components) || components.length === 0 || components.length > 4) {
    throw new Error(`Invalid component count in scan: ${components.length}`);
  }

  if (spectralStart < 0 || spectralStart > 63 || spectralEnd < 0 || spectralEnd > 63 || spectralStart > spectralEnd) {
    throw new Error(`Invalid spectral selection: ${spectralStart}-${spectralEnd}`);
  }

  if (approximation.high < 0 || approximation.high > 13 || approximation.low < 0 || approximation.low > 13) {
    throw new Error(`Invalid approximation: ${approximation.high}/${approximation.low}`);
  }

  const dataSize = 4 + components.length * 2; // Header + component selection
  const data = new Uint8Array(dataSize);
  let offset = 0;

  // Number of components in scan
  data[offset++] = components.length;

  // Component selection and Huffman table assignments
  for (const component of components) {
    if (component.id < 1 || component.id > 255) {
      throw new Error(`Invalid component ID: ${component.id}`);
    }

    const { dc, ac } = component.huffmanTables;
    if (dc < 0 || dc > 3 || ac < 0 || ac > 3) {
      throw new Error(`Invalid Huffman table assignments: DC=${dc}, AC=${ac}`);
    }

    data[offset++] = component.id;
    data[offset++] = (dc << 4) | ac;
  }

  // Spectral selection
  data[offset++] = spectralStart;
  data[offset++] = spectralEnd;

  // Successive approximation
  data[offset++] = (approximation.high << 4) | approximation.low;

  // Create complete SOS segment
  const segmentSize = data.length + 4; // Marker + length + data
  const segment = new Uint8Array(segmentSize);
  writeMarkerSegment(segment, 0, JPEG_MARKERS.SOS, data);

  return segment;
}

/**
 * Generate DRI (Define Restart Interval) marker.
 * Defines restart marker interval for error resilience.
 *
 * @param {number} interval - Restart interval in MCUs
 * @returns {Uint8Array} DRI marker segment
 */
export function generateDRI(interval) {
  if (interval < 0 || interval > 65535) {
    throw new Error(`Invalid restart interval: ${interval}`);
  }

  const data = new Uint8Array(2);
  writeUint16BE(data, 0, interval);

  // Create complete DRI segment
  const segment = new Uint8Array(6); // Marker + length + data
  writeMarkerSegment(segment, 0, JPEG_MARKERS.DRI, data);

  return segment;
}

/**
 * Generate COM (Comment) marker.
 * Embeds text comments in JPEG file.
 *
 * @param {string} comment - Comment text
 * @returns {Uint8Array} COM marker segment
 */
export function generateCOM(comment) {
  if (typeof comment !== "string") {
    throw new Error("Comment must be a string");
  }

  const encoder = new TextEncoder();
  const commentBytes = encoder.encode(comment);

  if (commentBytes.length > 65533) {
    // Max segment size - marker - length
    throw new Error(`Comment too long: ${commentBytes.length} bytes (max 65533)`);
  }

  // Create complete COM segment
  const segmentSize = commentBytes.length + 4; // Marker + length + data
  const segment = new Uint8Array(segmentSize);
  writeMarkerSegment(segment, 0, JPEG_MARKERS.COM, commentBytes);

  return segment;
}

/**
 * JPEG file builder for complete file assembly.
 * Manages marker sequence and file structure validation.
 */
export class JPEGFileBuilder {
  /**
   * Create JPEG file builder.
   *
   * @param {Object} options - Builder options
   */
  constructor(options = {}) {
    /** @type {Object} */
    this.options = { ...DEFAULT_WRITE_OPTIONS, ...options };
    /** @type {Uint8Array[]} */
    this.segments = [];
    /** @type {number} */
    this.totalSize = 0;
    /** @type {boolean} */
    this.hasSOI = false;
    /** @type {boolean} */
    this.hasEOI = false;
    /** @type {boolean} */
    this.hasSOF = false;
    /** @type {boolean} */
    this.hasSOS = false;
    /** @type {Set<number>} */
    this.quantizationTables = new Set();
    /** @type {Set<string>} */
    this.huffmanTables = new Set();
  }

  /**
   * Add marker segment to file.
   *
   * @param {Uint8Array} segment - Marker segment
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addSegment(segment) {
    if (!(segment instanceof Uint8Array)) {
      throw new Error("Segment must be Uint8Array");
    }

    if (segment.length < 2) {
      throw new Error("Segment too small");
    }

    // Track marker types for validation
    const marker = (segment[0] << 8) | segment[1];
    this._trackMarker(marker);

    this.segments.push(segment);
    this.totalSize += segment.length;

    return this;
  }

  /**
   * Track marker for validation.
   * @private
   *
   * @param {number} marker - Marker value
   */
  _trackMarker(marker) {
    switch (marker) {
      case JPEG_MARKERS.SOI:
        this.hasSOI = true;
        break;
      case JPEG_MARKERS.EOI:
        this.hasEOI = true;
        break;
      case JPEG_MARKERS.SOF0:
      case JPEG_MARKERS.SOF1:
      case JPEG_MARKERS.SOF2:
      case JPEG_MARKERS.SOF3:
        this.hasSOF = true;
        break;
      case JPEG_MARKERS.SOS:
        this.hasSOS = true;
        break;
      case JPEG_MARKERS.DQT:
        // Could parse to track specific tables, but simplified for now
        break;
      case JPEG_MARKERS.DHT:
        // Could parse to track specific tables, but simplified for now
        break;
    }
  }

  /**
   * Add SOI marker.
   *
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addSOI() {
    if (this.hasSOI) {
      throw new Error("SOI marker already added");
    }
    return this.addSegment(generateSOI());
  }

  /**
   * Add EOI marker.
   *
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addEOI() {
    if (this.hasEOI) {
      throw new Error("EOI marker already added");
    }
    return this.addSegment(generateEOI());
  }

  /**
   * Add JFIF APP0 marker.
   *
   * @param {Object} options - JFIF options
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addJFIF(options = {}) {
    return this.addSegment(generateJFIF(options));
  }

  /**
   * Add quantization tables.
   *
   * @param {Array<any>} tables - Quantization tables
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addQuantizationTables(tables) {
    return this.addSegment(generateDQT(tables));
  }

  /**
   * Add Huffman tables.
   *
   * @param {Array<any>} tables - Huffman tables
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addHuffmanTables(tables) {
    return this.addSegment(generateDHT(tables));
  }

  /**
   * Add Start of Frame marker.
   *
   * @param {any} frameInfo - Frame information
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addSOF(frameInfo) {
    if (this.hasSOF) {
      throw new Error("SOF marker already added");
    }
    return this.addSegment(generateSOF(frameInfo));
  }

  /**
   * Add Start of Scan marker.
   *
   * @param {any} scanInfo - Scan information
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addSOS(scanInfo) {
    return this.addSegment(generateSOS(scanInfo));
  }

  /**
   * Add restart interval marker.
   *
   * @param {number} interval - Restart interval
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addDRI(interval) {
    return this.addSegment(generateDRI(interval));
  }

  /**
   * Add comment marker.
   *
   * @param {string} comment - Comment text
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addComment(comment) {
    return this.addSegment(generateCOM(comment));
  }

  /**
   * Add compressed scan data.
   *
   * @param {Uint8Array} scanData - Huffman-encoded scan data
   * @returns {JPEGFileBuilder} This builder for chaining
   */
  addScanData(scanData) {
    if (!(scanData instanceof Uint8Array)) {
      throw new Error("Scan data must be Uint8Array");
    }

    // Scan data is added directly without marker wrapping
    this.segments.push(scanData);
    this.totalSize += scanData.length;

    return this;
  }

  /**
   * Validate file structure.
   *
   * @returns {{
   *   isValid: boolean,
   *   errors: string[],
   *   warnings: string[]
   * }} Validation results
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Check required markers
    if (!this.hasSOI) {
      errors.push("Missing SOI marker");
    }

    if (!this.hasEOI) {
      errors.push("Missing EOI marker");
    }

    if (!this.hasSOF) {
      errors.push("Missing SOF marker");
    }

    if (!this.hasSOS) {
      errors.push("Missing SOS marker");
    }

    // Check marker order
    if (this.segments.length > 0) {
      const firstMarker = (this.segments[0][0] << 8) | this.segments[0][1];
      if (firstMarker !== JPEG_MARKERS.SOI) {
        errors.push("File must start with SOI marker");
      }

      const lastMarker = (this.segments[this.segments.length - 1][0] << 8) | this.segments[this.segments.length - 1][1];
      if (lastMarker !== JPEG_MARKERS.EOI) {
        warnings.push("File should end with EOI marker");
      }
    }

    // Check file size
    if (this.totalSize > 100 * 1024 * 1024) {
      // 100MB warning
      warnings.push(`Large file size: ${(this.totalSize / 1024 / 1024).toFixed(1)}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Build complete JPEG file.
   *
   * @returns {{
   *   data: Uint8Array,
   *   size: number,
   *   validation: Object
   * }} Complete JPEG file
   */
  build() {
    const validation = this.validate();

    if (/** @type {any} */ (this.options).validateOutput && !validation.isValid) {
      throw new Error(`Invalid JPEG file structure: ${validation.errors.join(", ")}`);
    }

    // Concatenate all segments
    const fileData = new Uint8Array(this.totalSize);
    let offset = 0;

    for (const segment of this.segments) {
      fileData.set(segment, offset);
      offset += segment.length;
    }

    return {
      data: fileData,
      size: this.totalSize,
      validation,
    };
  }

  /**
   * Get file statistics.
   *
   * @returns {{
   *   segmentCount: number,
   *   totalSize: number,
   *   hasRequiredMarkers: boolean,
   *   markerTypes: string[]
   * }} File statistics
   */
  getStatistics() {
    const markerTypes = [];

    for (const segment of this.segments) {
      if (segment.length >= 2) {
        const marker = (segment[0] << 8) | segment[1];
        const markerName = Object.keys(JPEG_MARKERS).find((key) => /** @type {any} */ (JPEG_MARKERS)[key] === marker);
        if (markerName) {
          markerTypes.push(markerName);
        } else {
          markerTypes.push(`0x${marker.toString(16).toUpperCase()}`);
        }
      }
    }

    return {
      segmentCount: this.segments.length,
      totalSize: this.totalSize,
      hasRequiredMarkers: this.hasSOI && this.hasEOI && this.hasSOF && this.hasSOS,
      markerTypes,
    };
  }

  /**
   * Reset builder for reuse.
   */
  reset() {
    this.segments = [];
    this.totalSize = 0;
    this.hasSOI = false;
    this.hasEOI = false;
    this.hasSOF = false;
    this.hasSOS = false;
    this.quantizationTables.clear();
    this.huffmanTables.clear();
  }
}

/**
 * Create complete JPEG file from encoding components.
 * High-level function for complete JPEG file generation.
 *
 * @param {{
 *   width: number,
 *   height: number,
 *   components: Array<any>,
 *   quantizationTables: Array<any>,
 *   huffmanTables: Array<any>,
 *   scanData: Uint8Array,
 *   metadata?: Object,
 *   options?: Object
 * }} jpegData - Complete JPEG data
 * @returns {{
 *   data: Uint8Array,
 *   size: number,
 *   validation: Object,
 *   statistics: Object
 * }} Complete JPEG file
 */
export function createJPEGFile(jpegData) {
  const {
    width,
    height,
    components,
    quantizationTables,
    huffmanTables,
    scanData,
    metadata = {},
    options = {},
  } = jpegData;

  // Validate input data
  if (!width || !height || width < 1 || height < 1) {
    throw new Error(`Invalid image dimensions: ${width}x${height}`);
  }

  if (!Array.isArray(components) || components.length === 0) {
    throw new Error("Must provide image components");
  }

  if (!Array.isArray(quantizationTables) || quantizationTables.length === 0) {
    throw new Error("Must provide quantization tables");
  }

  if (!Array.isArray(huffmanTables) || huffmanTables.length === 0) {
    throw new Error("Must provide Huffman tables");
  }

  if (!scanData || !(scanData instanceof Uint8Array)) {
    throw new Error("Must provide scan data");
  }

  const builder = new JPEGFileBuilder(options);

  // Build JPEG file structure
  builder.addSOI();

  // Add JFIF metadata if requested
  if (/** @type {any} */ (options).includeJFIF !== false) {
    builder.addJFIF(/** @type {any} */ (metadata).jfif);
  }

  // Add EXIF metadata if provided
  if (/** @type {any} */ (metadata).exif && /** @type {any} */ (options).includeEXIF) {
    // EXIF generation would be implemented here
    // For now, skip complex EXIF generation
  }

  // Add quantization tables
  builder.addQuantizationTables(quantizationTables);

  // Add Huffman tables
  builder.addHuffmanTables(huffmanTables);

  // Add restart interval if specified
  if (/** @type {any} */ (options).restartInterval > 0) {
    builder.addDRI(/** @type {any} */ (options).restartInterval);
  }

  // Add Start of Frame
  builder.addSOF({
    mode: /** @type {any} */ (options).mode || JPEG_MODES.BASELINE,
    width,
    height,
    precision: /** @type {any} */ (options).precision || 8,
    components,
  });

  // Add comment if provided
  if (/** @type {any} */ (metadata).comment && /** @type {any} */ (options).includeComment) {
    builder.addComment(/** @type {any} */ (metadata).comment);
  }

  // Add Start of Scan
  const scanComponents = components.map((comp) => ({
    id: /** @type {any} */ (comp).id,
    huffmanTables: {
      dc: /** @type {any} */ (comp).huffmanDC || 0,
      ac: /** @type {any} */ (comp).huffmanAC || 0,
    },
  }));

  builder.addSOS({
    components: scanComponents,
    spectralStart: /** @type {any} */ (options).spectralStart || 0,
    spectralEnd: /** @type {any} */ (options).spectralEnd || 63,
    approximation: /** @type {any} */ (options).approximation || { high: 0, low: 0 },
  });

  // Add compressed scan data
  builder.addScanData(scanData);

  // Add End of Image
  builder.addEOI();

  // Build and return complete file
  const result = builder.build();

  return {
    ...result,
    statistics: builder.getStatistics(),
  };
}
