/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG marker segment parser with validation.
 *
 * Parses JPEG marker structure according to ITU-T T.81 specification.
 * Each marker consists of: 0xFF + marker code + optional length + data.
 * Handles marker stuffing, validation, and proper sequence ordering.
 * Supports streaming parse for large files and progressive JPEG extensions.
 */

/**
 * JPEG marker codes as defined in ITU-T T.81 specification.
 * Critical markers for baseline and progressive JPEG support.
 */
export const JPEG_MARKERS = {
  // Standalone markers (no length field)
  SOI: 0xd8, // Start of Image
  EOI: 0xd9, // End of Image
  RST0: 0xd0, // Restart marker 0
  RST1: 0xd1, // Restart marker 1
  RST2: 0xd2, // Restart marker 2
  RST3: 0xd3, // Restart marker 3
  RST4: 0xd4, // Restart marker 4
  RST5: 0xd5, // Restart marker 5
  RST6: 0xd6, // Restart marker 6
  RST7: 0xd7, // Restart marker 7

  // Frame markers
  SOF0: 0xc0, // Start of Frame (baseline DCT)
  SOF1: 0xc1, // Start of Frame (extended sequential DCT)
  SOF2: 0xc2, // Start of Frame (progressive DCT)
  SOF3: 0xc3, // Start of Frame (lossless sequential)
  SOF5: 0xc5, // Start of Frame (differential sequential DCT)
  SOF6: 0xc6, // Start of Frame (differential progressive DCT)
  SOF7: 0xc7, // Start of Frame (differential lossless)
  SOF9: 0xc9, // Start of Frame (extended sequential DCT, arithmetic)
  SOF10: 0xca, // Start of Frame (progressive DCT, arithmetic)
  SOF11: 0xcb, // Start of Frame (lossless sequential, arithmetic)
  SOF13: 0xcd, // Start of Frame (differential sequential DCT, arithmetic)
  SOF14: 0xce, // Start of Frame (differential progressive DCT, arithmetic)
  SOF15: 0xcf, // Start of Frame (differential lossless, arithmetic)

  // Table markers
  DHT: 0xc4, // Define Huffman Table
  DQT: 0xdb, // Define Quantization Table
  DRI: 0xdd, // Define Restart Interval

  // Scan markers
  SOS: 0xda, // Start of Scan

  // Application markers
  APP0: 0xe0, // Application marker 0 (JFIF)
  APP1: 0xe1, // Application marker 1 (EXIF)
  APP2: 0xe2, // Application marker 2
  APP3: 0xe3, // Application marker 3
  APP4: 0xe4, // Application marker 4
  APP5: 0xe5, // Application marker 5
  APP6: 0xe6, // Application marker 6
  APP7: 0xe7, // Application marker 7
  APP8: 0xe8, // Application marker 8
  APP9: 0xe9, // Application marker 9
  APP10: 0xea, // Application marker 10
  APP11: 0xeb, // Application marker 11
  APP12: 0xec, // Application marker 12
  APP13: 0xed, // Application marker 13
  APP14: 0xee, // Application marker 14 (Adobe)
  APP15: 0xef, // Application marker 15

  // Other markers
  COM: 0xfe, // Comment
  TEM: 0x01, // Temporary use (arithmetic coding)
};

/**
 * Marker codes that are standalone (no length field).
 * These markers consist only of 0xFF + marker code.
 */
const STANDALONE_MARKERS = new Set([
  JPEG_MARKERS.SOI,
  JPEG_MARKERS.EOI,
  JPEG_MARKERS.RST0,
  JPEG_MARKERS.RST1,
  JPEG_MARKERS.RST2,
  JPEG_MARKERS.RST3,
  JPEG_MARKERS.RST4,
  JPEG_MARKERS.RST5,
  JPEG_MARKERS.RST6,
  JPEG_MARKERS.RST7,
  JPEG_MARKERS.TEM,
]);

/**
 * Get human-readable name for marker code.
 * Useful for debugging and error messages.
 *
 * @param {number} markerCode - JPEG marker code (0x00-0xFF)
 * @returns {string} Marker name or 'UNKNOWN'
 *
 * @example
 * console.log(getMarkerName(0xD8)); // "SOI"
 * console.log(getMarkerName(0xC0)); // "SOF0"
 */
export function getMarkerName(markerCode) {
  for (const [name, code] of Object.entries(JPEG_MARKERS)) {
    if (code === markerCode) {
      return name;
    }
  }
  return `UNKNOWN(0x${markerCode.toString(16).toUpperCase().padStart(2, "0")})`;
}

/**
 * Check if marker code is standalone (no length field).
 *
 * @param {number} markerCode - JPEG marker code
 * @returns {boolean} True if marker is standalone
 *
 * @example
 * console.log(isStandaloneMarker(0xD8)); // true (SOI)
 * console.log(isStandaloneMarker(0xC0)); // false (SOF0)
 */
export function isStandaloneMarker(markerCode) {
  return STANDALONE_MARKERS.has(markerCode);
}

/**
 * Read 16-bit big-endian unsigned integer from buffer.
 *
 * @param {Uint8Array} buffer - Buffer to read from
 * @param {number} offset - Byte offset to read from
 * @returns {number} 16-bit unsigned integer
 * @throws {Error} If offset is out of bounds
 *
 * @private
 */
function readUint16BE(buffer, offset) {
  if (offset + 1 >= buffer.length) {
    throw new Error(`Cannot read uint16 at offset ${offset}: buffer too short`);
  }
  return (buffer[offset] << 8) | buffer[offset + 1];
}

/**
 * Find next marker in JPEG data stream.
 * Handles marker stuffing (0xFF00 sequences) correctly.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} startOffset - Offset to start searching from
 * @returns {{offset: number, markerCode: number}|null} Marker location or null if not found
 *
 * @example
 * // Find first marker in JPEG file
 * const marker = findNextMarker(jpegData, 0);
 * if (marker && marker.markerCode === JPEG_MARKERS.SOI) {
 *   console.log('Found SOI marker at offset', marker.offset);
 * }
 *
 * @private
 */
function findNextMarker(buffer, startOffset) {
  for (let i = startOffset; i < buffer.length - 1; i++) {
    if (buffer[i] === 0xff) {
      const nextByte = buffer[i + 1];

      // Skip marker stuffing (0xFF00)
      if (nextByte === 0x00) {
        continue;
      }

      // Skip padding bytes (0xFFFF)
      if (nextByte === 0xff) {
        continue;
      }

      // Found valid marker
      return {
        offset: i,
        markerCode: nextByte,
      };
    }
  }

  return null;
}

/**
 * Validate JPEG marker sequence ordering.
 * Ensures markers appear in correct order according to JPEG specification.
 *
 * @param {Array<{markerCode: number, offset: number}>} markers - Parsed markers
 * @throws {Error} If marker sequence is invalid
 *
 * @example
 * // Validate marker sequence
 * validateMarkerSequence(parsedMarkers); // throws if invalid
 *
 * @private
 */
function validateMarkerSequence(markers) {
  if (markers.length === 0) {
    throw new Error("JPEG file contains no markers");
  }

  // First marker must be SOI
  if (markers[0].markerCode !== JPEG_MARKERS.SOI) {
    throw new Error(`First marker must be SOI, got ${getMarkerName(markers[0].markerCode)}`);
  }

  // Last marker must be EOI
  if (markers[markers.length - 1].markerCode !== JPEG_MARKERS.EOI) {
    throw new Error(`Last marker must be EOI, got ${getMarkerName(markers[markers.length - 1].markerCode)}`);
  }

  // Check for required markers
  const markerCodes = markers.map((m) => m.markerCode);
  const hasSOF = markerCodes.some(
    (code) => code >= JPEG_MARKERS.SOF0 && code <= JPEG_MARKERS.SOF15 && code !== 0xc8 && code !== 0xcc
  );
  const hasSOS = markerCodes.includes(JPEG_MARKERS.SOS);

  if (!hasSOF) {
    throw new Error("JPEG file must contain a Start of Frame (SOF) marker");
  }

  if (!hasSOS) {
    throw new Error("JPEG file must contain a Start of Scan (SOS) marker");
  }

  // SOF must come before SOS
  const sofIndex = markers.findIndex(
    (m) =>
      m.markerCode >= JPEG_MARKERS.SOF0 &&
      m.markerCode <= JPEG_MARKERS.SOF15 &&
      m.markerCode !== 0xc8 &&
      m.markerCode !== 0xcc
  );
  const sosIndex = markers.findIndex((m) => m.markerCode === JPEG_MARKERS.SOS);

  if (sofIndex > sosIndex) {
    throw new Error("Start of Frame (SOF) marker must appear before Start of Scan (SOS)");
  }
}

/**
 * Parse JPEG marker segments from buffer data.
 *
 * Parses all markers in a JPEG file according to ITU-T T.81 specification.
 * Validates marker structure, handles marker stuffing, and checks sequence ordering.
 * Returns array of marker objects with type, data, and metadata.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - JPEG data buffer
 * @param {Object} [options] - Parsing options
 * @param {boolean} [options.validateSequence=true] - Whether to validate marker sequence
 * @param {boolean} [options.strictMode=true] - Whether to throw on unknown markers
 * @param {boolean} [options.includeEntropy=false] - Whether to include entropy-coded data segments
 * @returns {Array<{markerCode: number, name: string, data: Uint8Array, length: number, offset: number, standalone: boolean, valid: boolean, error?: string}>} Array of parsed markers
 * @throws {Error} If marker structure is invalid or sequence validation fails
 *
 * @example
 * // Parse JPEG markers with validation
 * const markers = parseJPEGMarkers(jpegData);
 * console.log(markers[0].name); // 'SOI'
 *
 * @example
 * // Parse without sequence validation (for damaged files)
 * const markers = parseJPEGMarkers(jpegData, { validateSequence: false });
 *
 * @example
 * // Include entropy-coded data segments
 * const markers = parseJPEGMarkers(jpegData, { includeEntropy: true });
 */
export function parseJPEGMarkers(buffer, options = {}) {
  const { validateSequence = true, strictMode = true, includeEntropy = false } = options;

  if (!buffer || (!(buffer instanceof ArrayBuffer) && !(buffer instanceof Uint8Array))) {
    throw new TypeError("Expected buffer to be ArrayBuffer or Uint8Array");
  }

  const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  const markers = [];
  let offset = 0;

  while (offset < data.length) {
    // Find next marker
    const markerInfo = findNextMarker(data, offset);
    if (!markerInfo) {
      // No more markers found
      break;
    }

    const { offset: markerOffset, markerCode } = markerInfo;
    const markerName = getMarkerName(markerCode);
    const standalone = isStandaloneMarker(markerCode);

    // Handle entropy-coded data before marker
    if (includeEntropy && markerOffset > offset) {
      const entropyData = data.slice(offset, markerOffset);
      markers.push({
        markerCode: null,
        name: "ENTROPY_DATA",
        data: entropyData,
        length: entropyData.length,
        offset,
        standalone: false,
        valid: true,
      });
    }

    if (standalone) {
      // Standalone marker (no length field)
      markers.push({
        markerCode,
        name: markerName,
        data: new Uint8Array(0),
        length: 0,
        offset: markerOffset,
        standalone: true,
        valid: true,
      });

      offset = markerOffset + 2; // Skip 0xFF + marker code
    } else {
      // Marker with length field
      if (markerOffset + 4 > data.length) {
        if (strictMode) {
          throw new Error(`Incomplete marker ${markerName} at offset ${markerOffset}: need 4 bytes for header`);
        }
        break;
      }

      // Read length field (includes length bytes themselves)
      const length = readUint16BE(data, markerOffset + 2);

      if (length < 2) {
        const error = new Error(
          `Invalid length ${length} for marker ${markerName} at offset ${markerOffset}: minimum length is 2`
        );
        if (strictMode) {
          throw error;
        }

        markers.push({
          markerCode,
          name: markerName,
          data: new Uint8Array(0),
          length: 0,
          offset: markerOffset,
          standalone: false,
          valid: false,
          error: error.message,
        });

        offset = markerOffset + 4;
        continue;
      }

      // Check if we have enough data for the complete marker
      const totalMarkerSize = 2 + length; // 0xFF + marker code + length field + data
      if (markerOffset + totalMarkerSize > data.length) {
        if (strictMode) {
          throw new Error(
            `Incomplete marker ${markerName} at offset ${markerOffset}: need ${totalMarkerSize} bytes, got ${data.length - markerOffset}`
          );
        }
        break;
      }

      // Extract marker data (excluding length field)
      const markerData = data.slice(markerOffset + 4, markerOffset + 2 + length);

      markers.push({
        markerCode,
        name: markerName,
        data: markerData,
        length: length - 2, // Exclude length field from data length
        offset: markerOffset,
        standalone: false,
        valid: true,
      });

      offset = markerOffset + 2 + length;
    }

    // Stop at EOI marker
    if (markerCode === JPEG_MARKERS.EOI) {
      break;
    }
  }

  // Validate marker sequence if requested
  if (validateSequence) {
    validateMarkerSequence(markers.filter((m) => m.markerCode !== null));
  }

  return markers;
}

/**
 * Find markers by type.
 *
 * Utility function to filter markers by their marker code.
 * Useful for extracting specific marker types like SOF, DHT, etc.
 *
 * @param {Array<{markerCode: number, valid?: boolean}>} markers - Array of parsed markers
 * @param {number} markerCode - Marker code to find
 * @returns {Array<{markerCode: number, valid?: boolean}>} Array of markers matching the code
 *
 * @example
 * // Find all DHT markers
 * const dhtMarkers = findMarkersByType(markers, JPEG_MARKERS.DHT);
 *
 * @example
 * // Find SOF marker (should be exactly one)
 * const sofMarkers = findMarkersByType(markers, JPEG_MARKERS.SOF0);
 * if (sofMarkers.length !== 1) throw new Error('Invalid JPEG: missing or multiple SOF markers');
 */
export function findMarkersByType(markers, markerCode) {
  if (!Array.isArray(markers)) {
    throw new TypeError("Expected markers to be an array");
  }

  if (typeof markerCode !== "number") {
    throw new TypeError("Expected markerCode to be a number");
  }

  return markers.filter((marker) => marker.markerCode === markerCode && marker.valid !== false);
}

/**
 * Get JPEG file information from parsed markers.
 * Extracts basic file properties without full decoding.
 *
 * @param {Array<{markerCode: number, valid?: boolean}>} markers - Array of parsed markers
 * @returns {{hasSOI: boolean, hasEOI: boolean, hasSOF: boolean, hasSOS: boolean, progressive: boolean, arithmetic: boolean, applications: Array<string>}} JPEG file info
 *
 * @example
 * // Get JPEG file information
 * const info = getJPEGInfo(markers);
 * console.log(`Progressive: ${info.progressive}, Applications: ${info.applications.join(', ')}`);
 */
export function getJPEGInfo(markers) {
  const markerCodes = markers.filter((m) => m.valid !== false).map((m) => m.markerCode);

  const hasSOI = markerCodes.includes(JPEG_MARKERS.SOI);
  const hasEOI = markerCodes.includes(JPEG_MARKERS.EOI);
  const hasSOF = markerCodes.some(
    (code) => code >= JPEG_MARKERS.SOF0 && code <= JPEG_MARKERS.SOF15 && code !== 0xc8 && code !== 0xcc
  );
  const hasSOS = markerCodes.includes(JPEG_MARKERS.SOS);

  // Check for progressive JPEG (SOF2)
  const progressive = markerCodes.includes(JPEG_MARKERS.SOF2);

  // Check for arithmetic coding
  const arithmetic = markerCodes.some((code) =>
    [
      JPEG_MARKERS.SOF9,
      JPEG_MARKERS.SOF10,
      JPEG_MARKERS.SOF11,
      JPEG_MARKERS.SOF13,
      JPEG_MARKERS.SOF14,
      JPEG_MARKERS.SOF15,
    ].includes(code)
  );

  // Find application markers
  const applications = [];
  for (let i = JPEG_MARKERS.APP0; i <= JPEG_MARKERS.APP15; i++) {
    if (markerCodes.includes(i)) {
      applications.push(`APP${i - JPEG_MARKERS.APP0}`);
    }
  }

  return {
    hasSOI,
    hasEOI,
    hasSOF,
    hasSOS,
    progressive,
    arithmetic,
    applications,
  };
}
