/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file JPEG header creation for encoding.
 *
 * Implements JPEG marker creation for encoding JPEG files, including SOI, SOF,
 * SOS, DHT, DQT, and EOI markers. This is the inverse of the header-parsing module.
 */

import { JPEG_MARKERS } from "./header-parsing.js";
import { createStandardHuffmanTable } from "./huffman-decode.js";
import { createQuantizationTables } from "./quantization.js";

/**
 * Create SOI (Start of Image) marker.
 *
 * @returns {Uint8Array} SOI marker bytes
 */
export function createSOI() {
  return new Uint8Array([JPEG_MARKERS.SOI >> 8, JPEG_MARKERS.SOI & 0xff]);
}

/**
 * Create EOI (End of Image) marker.
 *
 * @returns {Uint8Array} EOI marker bytes
 */
export function createEOI() {
  return new Uint8Array([JPEG_MARKERS.EOI >> 8, JPEG_MARKERS.EOI & 0xff]);
}

/**
 * Create APP0 (JFIF) marker.
 *
 * @param {Object} [options={}] - JFIF options
 * @param {number} [options.majorVersion=1] - JFIF major version
 * @param {number} [options.minorVersion=1] - JFIF minor version
 * @param {number} [options.units=0] - Units (0=no units, 1=dots/inch, 2=dots/cm)
 * @param {number} [options.xDensity=1] - X density
 * @param {number} [options.yDensity=1] - Y density
 * @param {number} [options.thumbnailWidth=0] - Thumbnail width
 * @param {number} [options.thumbnailHeight=0] - Thumbnail height
 * @returns {Uint8Array} APP0 marker bytes
 */
export function createAPP0(options = {}) {
  const {
    majorVersion = 1,
    minorVersion = 1,
    units = 0,
    xDensity = 1,
    yDensity = 1,
    thumbnailWidth = 0,
    thumbnailHeight = 0,
  } = options;

  // Validate parameters
  if (majorVersion < 1 || majorVersion > 255) {
    throw new Error(`Invalid major version: ${majorVersion} (must be 1-255)`);
  }
  if (minorVersion < 0 || minorVersion > 255) {
    throw new Error(`Invalid minor version: ${minorVersion} (must be 0-255)`);
  }
  if (units < 0 || units > 2) {
    throw new Error(`Invalid units: ${units} (must be 0-2)`);
  }
  if (xDensity < 1 || xDensity > 65535) {
    throw new Error(`Invalid X density: ${xDensity} (must be 1-65535)`);
  }
  if (yDensity < 1 || yDensity > 65535) {
    throw new Error(`Invalid Y density: ${yDensity} (must be 1-65535)`);
  }
  if (thumbnailWidth < 0 || thumbnailWidth > 255) {
    throw new Error(`Invalid thumbnail width: ${thumbnailWidth} (must be 0-255)`);
  }
  if (thumbnailHeight < 0 || thumbnailHeight > 255) {
    throw new Error(`Invalid thumbnail height: ${thumbnailHeight} (must be 0-255)`);
  }

  const length = 16; // Fixed length for basic JFIF
  const buffer = new Uint8Array(length + 2);
  let offset = 0;

  // APP0 marker
  buffer[offset++] = JPEG_MARKERS.APP0 >> 8;
  buffer[offset++] = JPEG_MARKERS.APP0 & 0xff;

  // Length
  buffer[offset++] = length >> 8;
  buffer[offset++] = length & 0xff;

  // JFIF identifier
  const jfifId = new TextEncoder().encode("JFIF\0");
  buffer.set(jfifId, offset);
  offset += jfifId.length;

  // Version
  buffer[offset++] = majorVersion;
  buffer[offset++] = minorVersion;

  // Units
  buffer[offset++] = units;

  // Density
  buffer[offset++] = xDensity >> 8;
  buffer[offset++] = xDensity & 0xff;
  buffer[offset++] = yDensity >> 8;
  buffer[offset++] = yDensity & 0xff;

  // Thumbnail dimensions
  buffer[offset++] = thumbnailWidth;
  buffer[offset++] = thumbnailHeight;

  return buffer;
}

/**
 * Create DQT (Define Quantization Table) marker.
 *
 * @param {Object[]} quantizationTables - Array of quantization table objects
 * @param {number} quantizationTables[].id - Table ID (0-3)
 * @param {number} quantizationTables[].precision - Precision (0=8-bit, 1=16-bit)
 * @param {number[]} quantizationTables[].values - Quantization values (64 elements)
 * @returns {Uint8Array} DQT marker bytes
 */
export function createDQT(quantizationTables) {
  if (!Array.isArray(quantizationTables) || quantizationTables.length === 0) {
    throw new Error("Quantization tables must be a non-empty array");
  }

  // Calculate total length
  let totalLength = 2; // Length field
  for (const table of quantizationTables) {
    validateQuantizationTable(table);
    const valueSize = table.precision === 0 ? 1 : 2;
    totalLength += 1 + 64 * valueSize; // ID/precision byte + values
  }

  const buffer = new Uint8Array(totalLength + 2);
  let offset = 0;

  // DQT marker
  buffer[offset++] = JPEG_MARKERS.DQT >> 8;
  buffer[offset++] = JPEG_MARKERS.DQT & 0xff;

  // Length
  buffer[offset++] = totalLength >> 8;
  buffer[offset++] = totalLength & 0xff;

  // Write each table
  for (const table of quantizationTables) {
    // Precision and ID
    buffer[offset++] = (table.precision << 4) | table.id;

    // Values
    if (table.precision === 0) {
      // 8-bit values
      for (let i = 0; i < 64; i++) {
        buffer[offset++] = table.values[i];
      }
    } else {
      // 16-bit values
      for (let i = 0; i < 64; i++) {
        const value = table.values[i];
        buffer[offset++] = value >> 8;
        buffer[offset++] = value & 0xff;
      }
    }
  }

  return buffer;
}

/**
 * Create DHT (Define Huffman Table) marker.
 *
 * @param {Object[]} huffmanTables - Array of Huffman table objects
 * @param {number} huffmanTables[].class - Table class (0=DC, 1=AC)
 * @param {number} huffmanTables[].id - Table ID (0-3)
 * @param {number[]} huffmanTables[].codeLengths - Code lengths (16 elements)
 * @param {number[]} huffmanTables[].symbols - Symbol values
 * @returns {Uint8Array} DHT marker bytes
 */
export function createDHT(huffmanTables) {
  if (!Array.isArray(huffmanTables) || huffmanTables.length === 0) {
    throw new Error("Huffman tables must be a non-empty array");
  }

  // Calculate total length
  let totalLength = 2; // Length field
  for (const table of huffmanTables) {
    validateHuffmanTable(table);
    totalLength += 1 + 16 + table.symbols.length; // Class/ID + code lengths + symbols
  }

  const buffer = new Uint8Array(totalLength + 2);
  let offset = 0;

  // DHT marker
  buffer[offset++] = JPEG_MARKERS.DHT >> 8;
  buffer[offset++] = JPEG_MARKERS.DHT & 0xff;

  // Length
  buffer[offset++] = totalLength >> 8;
  buffer[offset++] = totalLength & 0xff;

  // Write each table
  for (const table of huffmanTables) {
    // Class and ID
    buffer[offset++] = (table.class << 4) | table.id;

    // Code lengths
    for (let i = 0; i < 16; i++) {
      buffer[offset++] = table.codeLengths[i];
    }

    // Symbols
    for (const symbol of table.symbols) {
      buffer[offset++] = symbol;
    }
  }

  return buffer;
}

/**
 * Create SOF0 (Start of Frame - Baseline) marker.
 *
 * @param {Object} frameInfo - Frame information
 * @param {number} frameInfo.width - Image width (1-65535)
 * @param {number} frameInfo.height - Image height (1-65535)
 * @param {number} [frameInfo.precision=8] - Sample precision (8 or 12)
 * @param {Object[]} frameInfo.components - Component specifications
 * @param {number} frameInfo.components[].id - Component ID (1-255)
 * @param {number} frameInfo.components[].horizontalSampling - Horizontal sampling factor (1-4)
 * @param {number} frameInfo.components[].verticalSampling - Vertical sampling factor (1-4)
 * @param {number} frameInfo.components[].quantizationTable - Quantization table ID (0-3)
 * @returns {Uint8Array} SOF0 marker bytes
 */
export function createSOF0(frameInfo) {
  validateFrameInfo(frameInfo);

  const length = 8 + frameInfo.components.length * 3;
  const buffer = new Uint8Array(length + 2);
  let offset = 0;

  // SOF0 marker
  buffer[offset++] = JPEG_MARKERS.SOF0 >> 8;
  buffer[offset++] = JPEG_MARKERS.SOF0 & 0xff;

  // Length
  buffer[offset++] = length >> 8;
  buffer[offset++] = length & 0xff;

  // Precision
  buffer[offset++] = frameInfo.precision || 8;

  // Height
  buffer[offset++] = frameInfo.height >> 8;
  buffer[offset++] = frameInfo.height & 0xff;

  // Width
  buffer[offset++] = frameInfo.width >> 8;
  buffer[offset++] = frameInfo.width & 0xff;

  // Number of components
  buffer[offset++] = frameInfo.components.length;

  // Component specifications
  for (const component of frameInfo.components) {
    buffer[offset++] = component.id;
    buffer[offset++] = (component.horizontalSampling << 4) | component.verticalSampling;
    buffer[offset++] = component.quantizationTable;
  }

  return buffer;
}

/**
 * Create SOS (Start of Scan) marker.
 *
 * @param {Object} scanInfo - Scan information
 * @param {Object[]} scanInfo.components - Component scan specifications
 * @param {number} scanInfo.components[].id - Component ID
 * @param {number} scanInfo.components[].dcTable - DC Huffman table ID (0-3)
 * @param {number} scanInfo.components[].acTable - AC Huffman table ID (0-3)
 * @param {number} [scanInfo.spectralStart=0] - Spectral selection start (0-63)
 * @param {number} [scanInfo.spectralEnd=63] - Spectral selection end (0-63)
 * @param {number} [scanInfo.approximationHigh=0] - Successive approximation high
 * @param {number} [scanInfo.approximationLow=0] - Successive approximation low
 * @returns {Uint8Array} SOS marker bytes
 */
export function createSOS(scanInfo) {
  validateScanInfo(scanInfo);

  const length = 6 + scanInfo.components.length * 2;
  const buffer = new Uint8Array(length + 2);
  let offset = 0;

  // SOS marker
  buffer[offset++] = JPEG_MARKERS.SOS >> 8;
  buffer[offset++] = JPEG_MARKERS.SOS & 0xff;

  // Length
  buffer[offset++] = length >> 8;
  buffer[offset++] = length & 0xff;

  // Number of components
  buffer[offset++] = scanInfo.components.length;

  // Component specifications
  for (const component of scanInfo.components) {
    buffer[offset++] = component.id;
    buffer[offset++] = (component.dcTable << 4) | component.acTable;
  }

  // Spectral selection
  buffer[offset++] = scanInfo.spectralStart || 0;
  buffer[offset++] = scanInfo.spectralEnd || 63;

  // Successive approximation
  const approximationHigh = scanInfo.approximationHigh || 0;
  const approximationLow = scanInfo.approximationLow || 0;
  buffer[offset++] = (approximationHigh << 4) | approximationLow;

  return buffer;
}

/**
 * Creates JPEG headers from structured information.
 *
 * @param {{
 *   frame: {
 *     width: number,
 *     height: number,
 *     precision?: number,
 *     components: Array<{
 *       id: number,
 *       horizontalSampling: number,
 *       verticalSampling: number,
 *       quantizationTable: number
 *     }>
 *   },
 *   scan: {
 *     components: Array<{
 *       id: number,
 *       dcTable: number,
 *       acTable: number
 *     }>,
 *     spectralStart?: number,
 *     spectralEnd?: number,
 *     approximationHigh?: number,
 *     approximationLow?: number
 *   },
 *   quantizationTables: Array<{
 *     id: number,
 *     precision: number,
 *     values: number[]
 *   }>,
 *   huffmanTables: Array<{
 *     class: number,
 *     id: number,
 *     codeLengths: number[],
 *     symbols: number[]
 *   }>,
 *   app0?: {
 *     majorVersion?: number,
 *     minorVersion?: number,
 *     units?: number,
 *     xDensity?: number,
 *     yDensity?: number,
 *     thumbnail?: {
 *       width: number,
 *       height: number,
 *       data: Uint8Array
 *     }
 *   }
 * }} jpegInfo - JPEG structure information
 * @returns {Uint8Array} Complete JPEG headers
 */
export function createJPEGHeaders(jpegInfo) {
  validateJPEGInfo(jpegInfo);

  const parts = [];

  // SOI
  parts.push(createSOI());

  // APP0 (JFIF)
  parts.push(createAPP0(jpegInfo.app0));

  // DQT
  parts.push(createDQT(jpegInfo.quantizationTables));

  // SOF0
  parts.push(createSOF0(jpegInfo.frame));

  // DHT
  parts.push(createDHT(jpegInfo.huffmanTables));

  // SOS
  parts.push(createSOS(jpegInfo.scan));

  // Combine all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const buffer = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    buffer.set(part, offset);
    offset += part.length;
  }

  return buffer;
}

/**
 * Validates a quantization table structure.
 * @param {{id: number, precision: number, values: number[]}} table - Quantization table
 * @throws {Error} If table is invalid
 */
function validateQuantizationTable(table) {
  if (!table || typeof table !== "object") {
    throw new Error("Quantization table must be an object");
  }

  if (typeof table.id !== "number" || table.id < 0 || table.id > 3) {
    throw new Error(`Invalid quantization table ID: ${table.id} (must be 0-3)`);
  }

  if (typeof table.precision !== "number" || (table.precision !== 0 && table.precision !== 1)) {
    throw new Error(`Invalid quantization table precision: ${table.precision} (must be 0 or 1)`);
  }

  if (!Array.isArray(table.values) || table.values.length !== 64) {
    throw new Error("Quantization table values must be an array of 64 elements");
  }

  const maxValue = table.precision === 0 ? 255 : 65535;
  for (let i = 0; i < 64; i++) {
    const value = table.values[i];
    if (typeof value !== "number" || value < 1 || value > maxValue) {
      throw new Error(`Invalid quantization value at index ${i}: ${value} (must be 1-${maxValue})`);
    }
  }
}

/**
 * Validates a Huffman table structure.
 * @param {{class: number, id: number, codeLengths: number[], symbols: number[]}} table - Huffman table
 * @throws {Error} If table is invalid
 */
function validateHuffmanTable(table) {
  if (!table || typeof table !== "object") {
    throw new Error("Huffman table must be an object");
  }

  if (typeof table.class !== "number" || (table.class !== 0 && table.class !== 1)) {
    throw new Error(`Invalid Huffman table class: ${table.class} (must be 0 or 1)`);
  }

  if (typeof table.id !== "number" || table.id < 0 || table.id > 3) {
    throw new Error(`Invalid Huffman table ID: ${table.id} (must be 0-3)`);
  }

  if (!Array.isArray(table.codeLengths) || table.codeLengths.length !== 16) {
    throw new Error("Huffman table code lengths must be an array of 16 elements");
  }

  for (let i = 0; i < 16; i++) {
    const length = table.codeLengths[i];
    if (typeof length !== "number" || length < 0 || length > 255) {
      throw new Error(`Invalid code length at index ${i}: ${length} (must be 0-255)`);
    }
  }

  if (!Array.isArray(table.symbols)) {
    throw new Error("Huffman table symbols must be an array");
  }

  const expectedSymbolCount = table.codeLengths.reduce((sum, count) => sum + count, 0);
  if (table.symbols.length !== expectedSymbolCount) {
    throw new Error(`Symbol count mismatch: expected ${expectedSymbolCount}, got ${table.symbols.length}`);
  }

  for (let i = 0; i < table.symbols.length; i++) {
    const symbol = table.symbols[i];
    if (typeof symbol !== "number" || symbol < 0 || symbol > 255) {
      throw new Error(`Invalid symbol at index ${i}: ${symbol} (must be 0-255)`);
    }
  }
}

/**
 * Validates frame information structure.
 * @param {{
 *   width: number,
 *   height: number,
 *   precision?: number,
 *   components: Array<{
 *     id: number,
 *     horizontalSampling: number,
 *     verticalSampling: number,
 *     quantizationTable: number
 *   }>
 * }} frameInfo - Frame information
 * @throws {Error} If frame info is invalid
 */
function validateFrameInfo(frameInfo) {
  if (!frameInfo || typeof frameInfo !== "object") {
    throw new Error("Frame info must be an object");
  }

  if (typeof frameInfo.width !== "number" || frameInfo.width < 1 || frameInfo.width > 65535) {
    throw new Error(`Invalid frame width: ${frameInfo.width} (must be 1-65535)`);
  }

  if (typeof frameInfo.height !== "number" || frameInfo.height < 1 || frameInfo.height > 65535) {
    throw new Error(`Invalid frame height: ${frameInfo.height} (must be 1-65535)`);
  }

  if (frameInfo.precision !== undefined) {
    if (typeof frameInfo.precision !== "number" || (frameInfo.precision !== 8 && frameInfo.precision !== 12)) {
      throw new Error(`Invalid frame precision: ${frameInfo.precision} (must be 8 or 12)`);
    }
  }

  if (!Array.isArray(frameInfo.components) || frameInfo.components.length === 0) {
    throw new Error("Frame components must be a non-empty array");
  }

  if (frameInfo.components.length > 4) {
    throw new Error(`Too many components: ${frameInfo.components.length} (maximum 4)`);
  }

  for (let i = 0; i < frameInfo.components.length; i++) {
    const component = frameInfo.components[i];

    if (!component || typeof component !== "object") {
      throw new Error(`Component ${i} must be an object`);
    }

    if (typeof component.id !== "number" || component.id < 1 || component.id > 255) {
      throw new Error(`Invalid component ${i} ID: ${component.id} (must be 1-255)`);
    }

    if (
      typeof component.horizontalSampling !== "number" ||
      component.horizontalSampling < 1 ||
      component.horizontalSampling > 4
    ) {
      throw new Error(`Invalid component ${i} horizontal sampling: ${component.horizontalSampling} (must be 1-4)`);
    }

    if (
      typeof component.verticalSampling !== "number" ||
      component.verticalSampling < 1 ||
      component.verticalSampling > 4
    ) {
      throw new Error(`Invalid component ${i} vertical sampling: ${component.verticalSampling} (must be 1-4)`);
    }

    if (
      typeof component.quantizationTable !== "number" ||
      component.quantizationTable < 0 ||
      component.quantizationTable > 3
    ) {
      throw new Error(`Invalid component ${i} quantization table: ${component.quantizationTable} (must be 0-3)`);
    }
  }
}

/**
 * Validates scan information structure.
 * @param {{
 *   components: Array<{
 *     id: number,
 *     dcTable: number,
 *     acTable: number
 *   }>,
 *   spectralStart?: number,
 *   spectralEnd?: number,
 *   approximationHigh?: number,
 *   approximationLow?: number
 * }} scanInfo - Scan information
 * @throws {Error} If scan info is invalid
 */
function validateScanInfo(scanInfo) {
  if (!scanInfo || typeof scanInfo !== "object") {
    throw new Error("Scan info must be an object");
  }

  if (!Array.isArray(scanInfo.components) || scanInfo.components.length === 0) {
    throw new Error("Scan components must be a non-empty array");
  }

  if (scanInfo.components.length > 4) {
    throw new Error(`Too many scan components: ${scanInfo.components.length} (maximum 4)`);
  }

  for (let i = 0; i < scanInfo.components.length; i++) {
    const component = scanInfo.components[i];

    if (!component || typeof component !== "object") {
      throw new Error(`Scan component ${i} must be an object`);
    }

    if (typeof component.id !== "number" || component.id < 1 || component.id > 255) {
      throw new Error(`Invalid scan component ${i} ID: ${component.id} (must be 1-255)`);
    }

    if (typeof component.dcTable !== "number" || component.dcTable < 0 || component.dcTable > 3) {
      throw new Error(`Invalid scan component ${i} DC table: ${component.dcTable} (must be 0-3)`);
    }

    if (typeof component.acTable !== "number" || component.acTable < 0 || component.acTable > 3) {
      throw new Error(`Invalid scan component ${i} AC table: ${component.acTable} (must be 0-3)`);
    }
  }

  if (scanInfo.spectralStart !== undefined) {
    if (typeof scanInfo.spectralStart !== "number" || scanInfo.spectralStart < 0 || scanInfo.spectralStart > 63) {
      throw new Error(`Invalid spectral start: ${scanInfo.spectralStart} (must be 0-63)`);
    }
  }

  if (scanInfo.spectralEnd !== undefined) {
    if (typeof scanInfo.spectralEnd !== "number" || scanInfo.spectralEnd < 0 || scanInfo.spectralEnd > 63) {
      throw new Error(`Invalid spectral end: ${scanInfo.spectralEnd} (must be 0-63)`);
    }
  }

  if (scanInfo.approximationHigh !== undefined) {
    if (
      typeof scanInfo.approximationHigh !== "number" ||
      scanInfo.approximationHigh < 0 ||
      scanInfo.approximationHigh > 15
    ) {
      throw new Error(`Invalid approximation high: ${scanInfo.approximationHigh} (must be 0-15)`);
    }
  }

  if (scanInfo.approximationLow !== undefined) {
    if (
      typeof scanInfo.approximationLow !== "number" ||
      scanInfo.approximationLow < 0 ||
      scanInfo.approximationLow > 15
    ) {
      throw new Error(`Invalid approximation low: ${scanInfo.approximationLow} (must be 0-15)`);
    }
  }
}

/**
 * Validates complete JPEG information structure.
 * @param {{
 *   frame: {
 *     width: number,
 *     height: number,
 *     precision?: number,
 *     components: Array<{
 *       id: number,
 *       horizontalSampling: number,
 *       verticalSampling: number,
 *       quantizationTable: number
 *     }>
 *   },
 *   scan: {
 *     components: Array<{
 *       id: number,
 *       dcTable: number,
 *       acTable: number
 *     }>,
 *     spectralStart?: number,
 *     spectralEnd?: number,
 *     approximationHigh?: number,
 *     approximationLow?: number
 *   },
 *   quantizationTables: Array<{
 *     id: number,
 *     precision: number,
 *     values: number[]
 *   }>,
 *   huffmanTables: Array<{
 *     class: number,
 *     id: number,
 *     codeLengths: number[],
 *     symbols: number[]
 *   }>
 * }} jpegInfo - Complete JPEG information
 * @throws {Error} If JPEG info is invalid
 */
function validateJPEGInfo(jpegInfo) {
  if (!jpegInfo || typeof jpegInfo !== "object") {
    throw new Error("JPEG info must be an object");
  }

  if (!jpegInfo.frame) {
    throw new Error("JPEG info must include frame information");
  }

  if (!jpegInfo.scan) {
    throw new Error("JPEG info must include scan information");
  }

  if (!jpegInfo.quantizationTables) {
    throw new Error("JPEG info must include quantization tables");
  }

  if (!jpegInfo.huffmanTables) {
    throw new Error("JPEG info must include Huffman tables");
  }

  validateFrameInfo(jpegInfo.frame);
  validateScanInfo(jpegInfo.scan);

  if (!Array.isArray(jpegInfo.quantizationTables)) {
    throw new Error("Quantization tables must be an array");
  }

  if (!Array.isArray(jpegInfo.huffmanTables)) {
    throw new Error("Huffman tables must be an array");
  }

  for (const table of jpegInfo.quantizationTables) {
    validateQuantizationTable(table);
  }

  for (const table of jpegInfo.huffmanTables) {
    validateHuffmanTable(table);
  }
}

/**
 * Create standard JPEG structure for common use cases.
 *
 * @param {{width: number, height: number, quality?: number, colorSpace?: string}} options - JPEG creation options
 * @returns {{
 *   frame: {
 *     width: number,
 *     height: number,
 *     precision?: number,
 *     components: Array<{
 *       id: number,
 *       horizontalSampling: number,
 *       verticalSampling: number,
 *       quantizationTable: number
 *     }>
 *   },
 *   scan: {
 *     components: Array<{
 *       id: number,
 *       dcTable: number,
 *       acTable: number
 *     }>,
 *     spectralStart?: number,
 *     spectralEnd?: number,
 *     approximationHigh?: number,
 *     approximationLow?: number
 *   },
 *   quantizationTables: Array<{
 *     id: number,
 *     precision: number,
 *     values: number[]
 *   }>,
 *   huffmanTables: Array<{
 *     class: number,
 *     id: number,
 *     codeLengths: number[],
 *     symbols: number[]
 *   }>,
 *   app0?: {
 *     majorVersion?: number,
 *     minorVersion?: number,
 *     units?: number,
 *     xDensity?: number,
 *     yDensity?: number,
 *     thumbnail?: {
 *       width: number,
 *       height: number,
 *       data: Uint8Array
 *     }
 *   }
 * }} Standard JPEG structure
 */
export function createStandardJPEGStructure(options) {
  const { width, height, quality = 85, colorSpace = "ycbcr" } = options;

  if (typeof width !== "number" || width < 1 || width > 65535) {
    throw new Error(`Invalid width: ${width} (must be 1-65535)`);
  }

  if (typeof height !== "number" || height < 1 || height > 65535) {
    throw new Error(`Invalid height: ${height} (must be 1-65535)`);
  }

  if (typeof quality !== "number" || quality < 1 || quality > 100) {
    throw new Error(`Invalid quality: ${quality} (must be 1-100)`);
  }

  if (colorSpace !== "grayscale" && colorSpace !== "ycbcr") {
    throw new Error(`Invalid color space: ${colorSpace} (must be "grayscale" or "ycbcr")`);
  }

  // Use imported quantization and Huffman table creation functions

  // Create quantization tables
  const quantTables = createQuantizationTables(quality);
  const quantizationTables = [
    {
      id: 0,
      precision: 0,
      values: Array.from(quantTables.luminance.flat()),
    },
  ];

  if (colorSpace === "ycbcr") {
    quantizationTables.push({
      id: 1,
      precision: 0,
      values: Array.from(quantTables.chrominance.flat()),
    });
  }

  // Create Huffman tables
  const huffmanTables = [
    {
      class: 0,
      id: 0,
      ...createStandardHuffmanTable("dc-luminance"),
    },
    {
      class: 1,
      id: 0,
      ...createStandardHuffmanTable("ac-luminance"),
    },
  ];

  if (colorSpace === "ycbcr") {
    huffmanTables.push(
      {
        class: 0,
        id: 1,
        ...createStandardHuffmanTable("dc-chrominance"),
      },
      {
        class: 1,
        id: 1,
        ...createStandardHuffmanTable("ac-chrominance"),
      }
    );
  }

  // Create frame info
  const frame = {
    width,
    height,
    precision: 8,
    components: [
      {
        id: 1,
        horizontalSampling: 1,
        verticalSampling: 1,
        quantizationTable: 0,
      },
    ],
  };

  if (colorSpace === "ycbcr") {
    frame.components.push(
      {
        id: 2,
        horizontalSampling: 1,
        verticalSampling: 1,
        quantizationTable: 1,
      },
      {
        id: 3,
        horizontalSampling: 1,
        verticalSampling: 1,
        quantizationTable: 1,
      }
    );
  }

  // Create scan info
  const scan = {
    components: [
      {
        id: 1,
        dcTable: 0,
        acTable: 0,
      },
    ],
    spectralStart: 0,
    spectralEnd: 63,
    approximationHigh: 0,
    approximationLow: 0,
  };

  if (colorSpace === "ycbcr") {
    scan.components.push(
      {
        id: 2,
        dcTable: 1,
        acTable: 1,
      },
      {
        id: 3,
        dcTable: 1,
        acTable: 1,
      }
    );
  }

  return {
    frame,
    scan,
    quantizationTables,
    huffmanTables,
    app0: {
      majorVersion: 1,
      minorVersion: 1,
      units: 0,
      xDensity: 1,
      yDensity: 1,
    },
  };
}
