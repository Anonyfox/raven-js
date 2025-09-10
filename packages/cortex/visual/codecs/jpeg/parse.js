/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Enhanced JPEG marker parsing and APP segment handling.
 *
 * Provides comprehensive infrastructure for parsing JPEG markers, extracting
 * segment data, and building the decoder state machine. Includes specialized
 * parsing for APP segments including JFIF, EXIF, ICC profiles, and Adobe
 * metadata with full metadata collection and validation.
 */

/**
 * @typedef {Object} MarkerResult
 * @property {number} marker - Marker value
 * @property {number} length - Segment length (including length field)
 * @property {number} dataOffset - Offset to segment data
 * @property {number} endOffset - Offset to end of segment
 */

/**
 * @typedef {Object} JFIFData
 * @property {string} identifier - "JFIF"
 * @property {number} versionMajor - Major version (1)
 * @property {number} versionMinor - Minor version (0-2)
 * @property {number} densityUnits - 0=pixels, 1=dpi, 2=dpcm
 * @property {number} densityX - Horizontal density
 * @property {number} densityY - Vertical density
 * @property {number} thumbnailWidth - Thumbnail width (0 if none)
 * @property {number} thumbnailHeight - Thumbnail height (0 if none)
 * @property {Uint8Array} [thumbnailRGB] - Thumbnail RGB data (if present)
 */

/**
 * @typedef {Object} EXIFData
 * @property {string} identifier - "Exif"
 * @property {number} tiffHeaderOffset - Offset to TIFF header in rawData
 * @property {string} byteOrder - "little-endian", "big-endian", or "unknown"
 * @property {Uint8Array} rawData - Raw EXIF data for further processing
 */

/**
 * @typedef {Object} XMPData
 * @property {string} type - "XMP"
 * @property {string} prefix - XMP packet prefix
 * @property {string} xmlData - XML content
 */

/**
 * @typedef {Object} ICCData
 * @property {string} identifier - "ICC_PROFILE"
 * @property {number} currentSequence - Current chunk number (1-based)
 * @property {number} totalSequences - Total number of chunks
 * @property {Uint8Array} profileData - ICC profile data chunk
 */

/**
 * @typedef {Object} AdobeData
 * @property {string} identifier - "Adobe"
 * @property {number} version - Adobe version
 * @property {number} transform - 0=RGB, 1=YCbCr, 2=YCCK
 * @property {number} flags - Color transform flags
 * @property {number} colorSpace - Color space ID
 */

/**
 * @typedef {Object} AppSegment
 * @property {number} appIndex - APP segment index (0-15)
 * @property {string} type - Segment type ("JFIF", "EXIF", "XMP", "ICC", "Adobe", "Unknown")
 * @property {number} length - Raw segment length
 * @property {Uint8Array} rawData - Raw segment data
 * @property {JFIFData|EXIFData|XMPData|ICCData|AdobeData|null} metadata - Parsed metadata (null if parsing failed)
 * @property {boolean} parsed - Whether metadata was successfully parsed
 */

/**
 * @typedef {Object} MetadataValidation
 * @property {boolean} hasJFIF - Whether JFIF segment is present
 * @property {boolean} hasEXIF - Whether EXIF segment is present
 * @property {boolean} hasXMP - Whether XMP segment is present
 * @property {boolean} hasAdobe - Whether Adobe segment is present
 * @property {boolean} hasICC - Whether ICC segments are present
 * @property {boolean} iccComplete - Whether ICC profile is complete
 * @property {Array<string>} warnings - Validation warnings
 * @property {Array<string>} errors - Validation errors
 */

/**
 * @typedef {Object} ComponentInfo
 * @property {number} id
 * @property {number} horizontalSampling
 * @property {number} verticalSampling
 * @property {number} quantTableId
 * @property {number} width
 * @property {number} height
 * @property {number} blocksPerLine
 * @property {number} blocksPerColumn
 * @property {(Int16Array|Uint8Array)[]|null} blocks
 */

/**
 * @typedef {Object} ProgressiveComponentData
 * @property {ComponentInfo} component - Component information
 * @property {Array<Int16Array>} coefficients - Coefficient arrays for each block
 * @property {number} blocksPerLine - Number of blocks per line
 * @property {number} blocksPerColumn - Number of blocks per column
 */

/**
 * JPEG marker constants - complete set as per ITU T.81 specification
 */
export const MARKERS = {
  // Start/end markers
  SOI: 0xffd8, // Start of Image
  EOI: 0xffd9, // End of Image

  // Frame headers
  SOF0: 0xffc0, // Start of Frame (Baseline DCT)
  SOF1: 0xffc1, // Start of Frame (Extended sequential DCT)
  SOF2: 0xffc2, // Start of Frame (Progressive DCT)
  SOF3: 0xffc3, // Start of Frame (Lossless)
  SOF5: 0xffc5, // Start of Frame (Differential sequential DCT)
  SOF6: 0xffc6, // Start of Frame (Differential progressive DCT)
  SOF7: 0xffc7, // Start of Frame (Differential lossless)
  SOF9: 0xffc9, // Start of Frame (Extended sequential DCT, arithmetic)
  SOF10: 0xffca, // Start of Frame (Progressive DCT, arithmetic)
  SOF11: 0xffcb, // Start of Frame (Lossless, arithmetic)
  SOF13: 0xffcd, // Start of Frame (Differential sequential DCT, arithmetic)
  SOF14: 0xffce, // Start of Frame (Differential progressive DCT, arithmetic)
  SOF15: 0xffcf, // Start of Frame (Differential lossless, arithmetic)

  // Scan headers and entropy coding
  SOS: 0xffda, // Start of Scan
  DQT: 0xffdb, // Define Quantization Table
  DHT: 0xffc4, // Define Huffman Table
  DAC: 0xffc8, // Define Arithmetic Coding Conditioning

  // Restart markers
  RST0: 0xffd0,
  RST1: 0xffd1,
  RST2: 0xffd2,
  RST3: 0xffd3,
  RST4: 0xffd4,
  RST5: 0xffd5,
  RST6: 0xffd6,
  RST7: 0xffd7,

  // Miscellaneous
  DRI: 0xffdd, // Define Restart Interval
  DNL: 0xffdc, // Define Number of Lines
  TEM: 0xff01, // Temporary marker (ignorable)

  // Application segments
  APP0: 0xffe0, // JFIF
  APP1: 0xffe1, // EXIF/XMP
  APP2: 0xffe2, // ICC profile
  APP3: 0xffe3,
  APP4: 0xffe4,
  APP5: 0xffe5,
  APP6: 0xffe6,
  APP7: 0xffe7,
  APP8: 0xffe8, // SPIFF
  APP9: 0xffe9,
  APP10: 0xffea,
  APP11: 0xffeb,
  APP12: 0xffec,
  APP13: 0xffed,
  APP14: 0xffee, // Adobe
  APP15: 0xffef,

  // Comments and extensions
  COM: 0xfffe, // Comment
  JPG: 0xffc8, // Reserved for JPEG extensions
};

/**
 * Parse JPEG marker from buffer at given offset.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} offset - Current offset in buffer
 * @returns {MarkerResult} Marker info with type, length, and data offset
 * @throws {Error} If marker is invalid or buffer bounds exceeded
 */
export function parseMarker(buffer, offset) {
  if (offset + 1 >= buffer.length) {
    throw new Error(`Marker parse failed: insufficient data at offset ${offset}`);
  }

  const marker = (buffer[offset] << 8) | buffer[offset + 1];
  offset += 2;

  // SOI and EOI have no payload
  if (marker === MARKERS.SOI || marker === MARKERS.EOI) {
    return { marker, length: 0, dataOffset: offset, endOffset: offset };
  }

  // All other markers have a length field
  if (offset + 2 > buffer.length) {
    throw new Error(`Marker ${marker.toString(16)} length field missing at offset ${offset}`);
  }

  const length = readUint16BE(buffer, offset);
  if (length < 2) {
    throw new Error(`Invalid marker length ${length} for marker ${marker.toString(16)}`);
  }

  const dataOffset = offset + 2;
  const endOffset = dataOffset + length - 2;

  if (endOffset > buffer.length) {
    throw new Error(`Marker ${marker.toString(16)} payload exceeds buffer bounds`);
  }

  return { marker, length, dataOffset, endOffset };
}

/**
 * Check if marker is a restart marker (RST0-RST7).
 *
 * @param {number} marker - Marker value
 * @returns {boolean} True if restart marker
 */
export function isRestartMarker(marker) {
  return marker >= MARKERS.RST0 && marker <= MARKERS.RST7;
}

/**
 * Get restart marker index (0-7) from marker value.
 *
 * @param {number} marker - Restart marker value
 * @returns {number} Restart index (0-7)
 * @throws {Error} If not a valid restart marker
 */
export function getRestartIndex(marker) {
  if (!isRestartMarker(marker)) {
    throw new Error(`Not a restart marker: ${marker.toString(16)}`);
  }
  return marker - MARKERS.RST0;
}

/**
 * Find next marker in buffer, handling fill bytes (0xFF00).
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} startOffset - Starting offset to search from
 * @param {number} maxSearch - Maximum bytes to search (default 1024)
 * @returns {number} Offset of next marker
 * @throws {Error} If no valid marker found within search limit
 */
export function findNextMarker(buffer, startOffset, maxSearch = 1024) {
  let offset = startOffset;
  const endOffset = Math.min(startOffset + maxSearch, buffer.length);

  while (offset < endOffset) {
    // Look for 0xFF
    if (buffer[offset] === 0xff) {
      // Check next byte
      if (offset + 1 >= buffer.length) {
        break; // End of buffer
      }

      const nextByte = buffer[offset + 1];
      if (nextByte !== 0x00) {
        // Found marker (not stuffed byte)
        return offset;
      }
      // Skip stuffed byte (0xFF00)
      offset += 2;
    } else {
      offset++;
    }
  }

  throw new Error(`No valid marker found within ${maxSearch} bytes from offset ${startOffset}`);
}

/**
 * Validate JPEG SOI marker at start of buffer.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @throws {Error} If SOI marker not found or invalid
 */
export function validateSOI(buffer) {
  if (buffer.length < 2) {
    throw new Error("Buffer too small for JPEG data");
  }

  const soi = (buffer[0] << 8) | buffer[1];
  if (soi !== MARKERS.SOI) {
    throw new Error(`Invalid JPEG: expected SOI (0xFFD8), found 0x${soi.toString(16)}`);
  }
}

/**
 * Check if marker is an APP (Application) marker.
 *
 * @param {number} marker - Marker value
 * @returns {boolean} True if APP marker
 */
export function isAppMarker(marker) {
  return marker >= MARKERS.APP0 && marker <= MARKERS.APP15;
}

/**
 * Check if marker is a SOF (Start of Frame) marker.
 *
 * @param {number} marker - Marker value
 * @returns {boolean} True if SOF marker
 */
export function isSofMarker(marker) {
  return (
    (marker >= MARKERS.SOF0 && marker <= MARKERS.SOF3) ||
    (marker >= MARKERS.SOF5 && marker <= MARKERS.SOF7) ||
    (marker >= MARKERS.SOF9 && marker <= MARKERS.SOF11) ||
    (marker >= MARKERS.SOF13 && marker <= MARKERS.SOF15)
  );
}

/**
 * Check if marker is a resync marker (RST or DRI).
 *
 * @param {number} marker - Marker value
 * @returns {boolean} True if resync marker
 */
export function isResyncMarker(marker) {
  return isRestartMarker(marker) || marker === MARKERS.DRI;
}

/**
 * Check if marker indicates start of entropy-coded data.
 *
 * @param {number} marker - Marker value
 * @returns {boolean} True if entropy-coded data follows
 */
export function isEntropyCodedMarker(marker) {
  return marker === MARKERS.SOS;
}

/**
 * Get APP marker index (0-15) from marker value.
 *
 * @param {number} marker - APP marker value
 * @returns {number} APP index (0-15)
 * @throws {Error} If not a valid APP marker
 */
export function getAppIndex(marker) {
  if (!isAppMarker(marker)) {
    throw new Error(`Not an APP marker: ${marker.toString(16)}`);
  }
  return marker - MARKERS.APP0;
}

/**
 * Get SOF marker precision from marker value.
 *
 * @param {number} marker - SOF marker value
 * @returns {string} Frame type description
 * @throws {Error} If not a valid SOF marker
 */
export function getFrameType(marker) {
  if (!isSofMarker(marker)) {
    throw new Error(`Not a SOF marker: ${marker.toString(16)}`);
  }

  const frameTypes = {
    [MARKERS.SOF0]: "Baseline DCT",
    [MARKERS.SOF1]: "Extended sequential DCT",
    [MARKERS.SOF2]: "Progressive DCT",
    [MARKERS.SOF3]: "Lossless",
    [MARKERS.SOF5]: "Differential sequential DCT",
    [MARKERS.SOF6]: "Differential progressive DCT",
    [MARKERS.SOF7]: "Differential lossless",
    [MARKERS.SOF9]: "Extended sequential DCT (arithmetic)",
    [MARKERS.SOF10]: "Progressive DCT (arithmetic)",
    [MARKERS.SOF11]: "Lossless (arithmetic)",
    [MARKERS.SOF13]: "Differential sequential DCT (arithmetic)",
    [MARKERS.SOF14]: "Differential progressive DCT (arithmetic)",
    [MARKERS.SOF15]: "Differential lossless (arithmetic)",
  };

  return frameTypes[marker] || "Unknown";
}

/**
 * Validate marker segment length according to JPEG specification.
 *
 * @param {number} marker - Marker value
 * @param {number} length - Declared segment length
 * @param {number} actualLength - Actual available data length
 * @param {boolean} strict - Whether to use strict validation
 * @throws {Error} If length validation fails
 */
export function validateSegmentLength(marker, length, actualLength, strict = true) {
  // All segments except SOI/EOI/RST have minimum length of 2 (for length field)
  if (marker !== MARKERS.SOI && marker !== MARKERS.EOI && !isRestartMarker(marker)) {
    if (length < 2) {
      throw new Error(`Invalid segment length ${length} for marker ${marker.toString(16)}`);
    }

    // Check if declared payload length matches available data
    const payloadLength = length - 2;
    if (actualLength < payloadLength) {
      if (strict) {
        throw new Error(`Segment payload truncated: expected ${payloadLength}, got ${actualLength}`);
      } else {
        // Tolerant mode: allow truncated segments but warn
        console.warn(
          `Segment payload truncated for marker ${marker.toString(16)}: expected ${payloadLength}, got ${actualLength}`
        );
      }
    }
  }
}

/**
 * Skip segment payload and return next marker offset.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} offset - Current offset (after marker)
 * @param {number} segmentLength - Segment length (including length field)
 * @returns {number} Offset of next marker
 * @throws {Error} If segment length is invalid
 */
export function skipSegment(buffer, offset, segmentLength) {
  if (segmentLength < 2) {
    throw new Error(`Invalid segment length: ${segmentLength}`);
  }

  const nextOffset = offset + segmentLength - 2; // -2 for the length field itself

  if (nextOffset > buffer.length) {
    throw new Error(`Segment extends beyond buffer: ${nextOffset} > ${buffer.length}`);
  }

  return nextOffset;
}

/**
 * Read big-endian 16-bit value from buffer.
 *
 * @param {Uint8Array} buffer - Data buffer
 * @param {number} offset - Offset to read from
 * @returns {number} 16-bit big-endian value
 */
export function readUint16BE(buffer, offset) {
  return (buffer[offset] << 8) | buffer[offset + 1];
}

/**
 * Read big-endian 32-bit value from buffer.
 *
 * @param {Uint8Array} buffer - Data buffer
 * @param {number} offset - Offset to read from
 * @returns {number} 32-bit big-endian value
 */
export function readUint32BE(buffer, offset) {
  return (buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3];
}

/**
 * Read null-terminated string from buffer.
 *
 * @param {Uint8Array} buffer - Data buffer
 * @param {number} offset - Starting offset
 * @param {number} maxLength - Maximum length to read
 * @returns {string} Null-terminated string
 */
export function readNullTerminatedString(buffer, offset, maxLength) {
  let end = offset;
  while (end < offset + maxLength && buffer[end] !== 0) {
    end++;
  }
  return new TextDecoder("ascii").decode(buffer.slice(offset, end));
}

/**
 * Parse JFIF (JPEG File Interchange Format) APP0 segment.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} dataOffset - Offset to APP0 data
 * @param {number} dataLength - Length of APP0 data
 * @returns {JFIFData} JFIF metadata
 * @throws {Error} If JFIF data is invalid
 */
export function parseJFIF(buffer, dataOffset, dataLength) {
  if (dataLength < 14) {
    throw new Error(`JFIF segment too short: ${dataLength} bytes, need at least 14`);
  }

  // Check JFIF identifier
  const identifier = readNullTerminatedString(buffer, dataOffset, 5);
  if (identifier !== "JFIF") {
    throw new Error(`Invalid JFIF identifier: ${identifier}, expected 'JFIF'`);
  }

  /** @type {JFIFData} */
  const jfifData = {
    identifier,
    versionMajor: buffer[dataOffset + 5],
    versionMinor: buffer[dataOffset + 6],
    densityUnits: buffer[dataOffset + 7], // 0=pixels, 1=dpi, 2=dpcm
    densityX: readUint16BE(buffer, dataOffset + 8),
    densityY: readUint16BE(buffer, dataOffset + 10),
    thumbnailWidth: buffer[dataOffset + 12],
    thumbnailHeight: buffer[dataOffset + 13],
  };

  // Validate version
  if (jfifData.versionMajor > 1 || (jfifData.versionMajor === 1 && jfifData.versionMinor > 2)) {
    throw new Error(`Unsupported JFIF version: ${jfifData.versionMajor}.${jfifData.versionMinor}`);
  }

  // Parse thumbnail data if present
  const thumbnailOffset = dataOffset + 14;
  const thumbnailSize = jfifData.thumbnailWidth * jfifData.thumbnailHeight * 3; // RGB
  if (thumbnailSize > 0 && dataLength >= 14 + thumbnailSize) {
    jfifData.thumbnailRGB = buffer.slice(thumbnailOffset, thumbnailOffset + thumbnailSize);
  }

  return jfifData;
}

/**
 * Parse EXIF APP1 segment.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} dataOffset - Offset to APP1 data
 * @param {number} dataLength - Length of APP1 data
 * @returns {EXIFData} EXIF metadata
 * @throws {Error} If EXIF data is invalid
 */
export function parseEXIF(buffer, dataOffset, dataLength) {
  if (dataLength < 6) {
    throw new Error(`EXIF segment too short: ${dataLength} bytes, need at least 6`);
  }

  // Check EXIF identifier
  const identifier = readNullTerminatedString(buffer, dataOffset, 6);
  if (identifier !== "Exif") {
    throw new Error(`Invalid EXIF identifier: ${identifier}, expected 'Exif'`);
  }

  /** @type {EXIFData} */
  const exifData = {
    identifier,
    tiffHeaderOffset: dataOffset + 6,
    // Raw EXIF data for further processing by specialized EXIF parser
    rawData: buffer.slice(dataOffset + 6, dataOffset + dataLength),
    byteOrder: "little-endian", // Will be updated below
  };

  // Basic TIFF header validation (optional for minimal EXIF detection)
  if (exifData.rawData.length >= 8) {
    // Check byte order (little-endian or big-endian)
    const byteOrder = exifData.rawData[0] * 256 + exifData.rawData[1];
    if (byteOrder === 0x4949 || byteOrder === 0x4d4d) {
      exifData.byteOrder = byteOrder === 0x4949 ? "little-endian" : "big-endian";
    } else {
      // Invalid byte order, but still mark as EXIF if identifier is correct
      exifData.byteOrder = "unknown";
    }
  } else {
    // Too short for TIFF header, but still valid EXIF identifier
    exifData.byteOrder = "unknown";
  }

  return exifData;
}

/**
 * Parse XMP (Extensible Metadata Platform) data.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} dataOffset - Offset to XMP data
 * @param {number} dataLength - Length of XMP data
 * @returns {XMPData} XMP metadata
 */
export function parseXMP(buffer, dataOffset, dataLength) {
  // Look for XMP packet wrapper
  const xmpPrefix = "http://ns.adobe.com/xap/1.0/";
  const prefixLength = xmpPrefix.length;

  if (dataLength < prefixLength) {
    throw new Error(`XMP data too short: ${dataLength} bytes`);
  }

  const prefix = readNullTerminatedString(buffer, dataOffset, prefixLength);
  if (prefix !== xmpPrefix) {
    throw new Error(`Invalid XMP prefix: ${prefix}`);
  }

  return {
    type: "XMP",
    prefix: xmpPrefix,
    // Raw XML data for further processing
    xmlData: new TextDecoder("utf-8").decode(buffer.slice(dataOffset + prefixLength, dataOffset + dataLength)),
  };
}

/**
 * Parse ICC (International Color Consortium) profile from APP2 segment.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} dataOffset - Offset to APP2 data
 * @param {number} dataLength - Length of APP2 data
 * @returns {ICCData} ICC profile metadata
 * @throws {Error} If ICC data is invalid
 */
export function parseICC(buffer, dataOffset, dataLength) {
  if (dataLength < 14) {
    throw new Error(`ICC segment too short: ${dataLength} bytes, need at least 14`);
  }

  // Check ICC identifier
  const identifier = readNullTerminatedString(buffer, dataOffset, 12);
  if (identifier !== "ICC_PROFILE") {
    throw new Error(`Invalid ICC identifier: ${identifier}, expected 'ICC_PROFILE'`);
  }

  const iccData = {
    identifier,
    currentSequence: buffer[dataOffset + 12], // Current chunk number (1-based)
    totalSequences: buffer[dataOffset + 13], // Total number of chunks
    profileData: buffer.slice(dataOffset + 14, dataOffset + dataLength),
  };

  // Validate sequence numbers
  if (iccData.currentSequence < 1 || iccData.totalSequences < 1) {
    throw new Error(`Invalid ICC sequence numbers: ${iccData.currentSequence}/${iccData.totalSequences}`);
  }

  if (iccData.currentSequence > iccData.totalSequences) {
    throw new Error(`ICC sequence number exceeds total: ${iccData.currentSequence} > ${iccData.totalSequences}`);
  }

  return iccData;
}

/**
 * Parse Adobe APP14 segment for transform information.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} dataOffset - Offset to APP14 data
 * @param {number} dataLength - Length of APP14 data
 * @returns {AdobeData} Adobe transform metadata
 * @throws {Error} If Adobe data is invalid
 */
export function parseAdobe(buffer, dataOffset, dataLength) {
  if (dataLength < 12) {
    throw new Error(`Adobe APP14 segment too short: ${dataLength} bytes, need at least 12`);
  }

  // Check Adobe identifier
  const identifier = readNullTerminatedString(buffer, dataOffset, 6);
  if (identifier !== "Adobe") {
    throw new Error(`Invalid Adobe identifier: ${identifier}, expected 'Adobe'`);
  }

  const adobeData = {
    identifier,
    version: readUint16BE(buffer, dataOffset + 6),
    transform: buffer[dataOffset + 8], // 0=RGB, 1=YCbCr, 2=YCCK
    flags: readUint16BE(buffer, dataOffset + 9), // Color transform flags
    colorSpace: buffer[dataOffset + 11], // Color space ID
  };

  // Validate transform value (0=RGB, 1=YCbCr, 2=YCCK)
  if (adobeData.transform > 2) {
    throw new Error(`Invalid Adobe transform value: ${adobeData.transform}, expected 0-2`);
  }

  return adobeData;
}

/**
 * Parse generic APP segment.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @param {number} dataOffset - Offset to APP data
 * @param {number} dataLength - Length of APP data
 * @param {number} appIndex - APP segment index (0-15)
 * @returns {AppSegment} APP segment metadata
 */
export function parseGenericAPP(buffer, dataOffset, dataLength, appIndex) {
  // Try to identify known APP formats by examining the data
  let appType = "Unknown";
  let metadata = null;

  try {
    if (appIndex === 0 && dataLength >= 14) {
      // APP0 - likely JFIF
      const identifier = readNullTerminatedString(buffer, dataOffset, 5);
      if (identifier === "JFIF") {
        appType = "JFIF";
        metadata = parseJFIF(buffer, dataOffset, dataLength);
      } else if (identifier === "JFXX") {
        appType = "JFIF Extension";
      }
    } else if (appIndex === 1 && dataLength >= 6) {
      // APP1 - likely EXIF or XMP
      const identifier = readNullTerminatedString(buffer, dataOffset, 6);
      if (identifier === "Exif") {
        appType = "EXIF";
        metadata = parseEXIF(buffer, dataOffset, dataLength);
      } else if (identifier.startsWith("http://")) {
        appType = "XMP";
        metadata = parseXMP(buffer, dataOffset, dataLength);
      }
    } else if (appIndex === 2 && dataLength >= 14) {
      // APP2 - likely ICC profile
      const identifier = readNullTerminatedString(buffer, dataOffset, 12);
      if (identifier === "ICC_PROFILE") {
        appType = "ICC";
        metadata = parseICC(buffer, dataOffset, dataLength);
      }
    } else if (appIndex === 14 && dataLength >= 12) {
      // APP14 - likely Adobe
      const identifier = readNullTerminatedString(buffer, dataOffset, 5);
      if (identifier === "Adobe") {
        appType = "Adobe";
        metadata = parseAdobe(buffer, dataOffset, dataLength);
      }
    }
  } catch (_error) {
    // If parsing fails, treat as unknown/generic APP segment
    appType = "Unknown";
    metadata = null;
  }

  return {
    appIndex,
    type: appType,
    length: dataLength,
    rawData: buffer.slice(dataOffset, dataOffset + dataLength),
    metadata,
    parsed: metadata !== null,
  };
}

/**
 * Extract all APP segments from JPEG buffer.
 *
 * @param {Uint8Array} buffer - JPEG data buffer
 * @returns {AppSegment[]} Array of parsed APP segments
 */
export function extractAppSegments(buffer) {
  const appSegments = [];
  let offset = 2; // Skip SOI marker

  try {
    while (offset < buffer.length - 1) {
      // Find next marker
      const markerOffset = findNextMarker(buffer, offset);
      const marker = (buffer[markerOffset] << 8) | buffer[markerOffset + 1];

      if (marker === MARKERS.EOI) {
        break; // End of image
      }

      if (isAppMarker(marker)) {
        // Parse APP segment
        const markerInfo = parseMarker(buffer, markerOffset);
        const appIndex = getAppIndex(marker);
        const appSegment = parseGenericAPP(
          buffer,
          markerInfo.dataOffset,
          markerInfo.length - 2, // Exclude length field
          appIndex
        );
        appSegments.push(appSegment);

        offset = markerInfo.endOffset;
      } else {
        // Skip non-APP segments
        const markerInfo = parseMarker(buffer, markerOffset);
        offset = markerInfo.endOffset;
      }
    }
  } catch (error) {
    // If parsing fails partway through, return what we have
    console.warn("APP segment extraction failed:", error.message);
  }

  return appSegments;
}

/**
 * Get JFIF metadata from APP segments.
 *
 * @param {AppSegment[]} appSegments - Array of parsed APP segments
 * @returns {JFIFData|null} JFIF metadata or null if not found
 */
export function getJFIFMetadata(appSegments) {
  const jfifSegment = appSegments.find((segment) => segment.type === "JFIF");
  return jfifSegment && jfifSegment.type === "JFIF" ? /** @type {JFIFData} */ (jfifSegment.metadata) : null;
}

/**
 * Get EXIF metadata from APP segments.
 *
 * @param {AppSegment[]} appSegments - Array of parsed APP segments
 * @returns {EXIFData|null} EXIF metadata or null if not found
 */
export function getEXIFMetadata(appSegments) {
  const exifSegment = appSegments.find((segment) => segment.type === "EXIF");
  return exifSegment && exifSegment.type === "EXIF" ? /** @type {EXIFData} */ (exifSegment.metadata) : null;
}

/**
 * Get XMP metadata from APP segments.
 *
 * @param {AppSegment[]} appSegments - Array of parsed APP segments
 * @returns {XMPData|null} XMP metadata or null if not found
 */
export function getXMPMetadata(appSegments) {
  const xmpSegment = appSegments.find((segment) => segment.type === "XMP");
  return xmpSegment && xmpSegment.type === "XMP" ? /** @type {XMPData} */ (xmpSegment.metadata) : null;
}

/**
 * Get Adobe transform information from APP segments.
 *
 * @param {AppSegment[]} appSegments - Array of parsed APP segments
 * @returns {AdobeData|null} Adobe metadata or null if not found
 */
export function getAdobeMetadata(appSegments) {
  const adobeSegment = appSegments.find((segment) => segment.type === "Adobe");
  return adobeSegment && adobeSegment.type === "Adobe" ? /** @type {AdobeData} */ (adobeSegment.metadata) : null;
}

/**
 * Assemble multi-chunk ICC profile from APP2 segments.
 *
 * @param {AppSegment[]} appSegments - Array of parsed APP segments
 * @returns {Uint8Array|null} Complete ICC profile or null if not found/incomplete
 */
export function assembleICCProfile(appSegments) {
  const iccSegments = appSegments.filter((segment) => segment.type === "ICC");

  if (iccSegments.length === 0) {
    return null;
  }

  // Check if we have all chunks
  const firstChunk = /** @type {ICCData} */ (iccSegments[0].metadata);
  const totalChunks = firstChunk.totalSequences;

  if (iccSegments.length !== totalChunks) {
    console.warn(`Incomplete ICC profile: have ${iccSegments.length} of ${totalChunks} chunks`);
    return null;
  }

  // Sort by sequence number and validate
  iccSegments.sort((a, b) => {
    const aMetadata = /** @type {ICCData} */ (a.metadata);
    const bMetadata = /** @type {ICCData} */ (b.metadata);
    return aMetadata.currentSequence - bMetadata.currentSequence;
  });

  for (let i = 0; i < iccSegments.length; i++) {
    const chunk = /** @type {ICCData} */ (iccSegments[i].metadata);
    if (chunk.currentSequence !== i + 1 || chunk.totalSequences !== totalChunks) {
      console.warn(
        `Invalid ICC chunk sequence: expected ${i + 1}/${totalChunks}, got ${chunk.currentSequence}/${chunk.totalSequences}`
      );
      return null;
    }
  }

  // Concatenate all profile data
  const totalSize = iccSegments.reduce((sum, segment) => {
    const metadata = /** @type {ICCData} */ (segment.metadata);
    return sum + metadata.profileData.length;
  }, 0);
  const profile = new Uint8Array(totalSize);
  let offset = 0;

  for (const segment of iccSegments) {
    const metadata = /** @type {ICCData} */ (segment.metadata);
    profile.set(metadata.profileData, offset);
    offset += metadata.profileData.length;
  }

  return profile;
}

/**
 * Validate JPEG metadata completeness and consistency.
 *
 * @param {AppSegment[]} appSegments - Array of parsed APP segments
 * @returns {MetadataValidation} Validation results
 */
export function validateMetadata(appSegments) {
  /** @type {MetadataValidation} */
  const results = {
    hasJFIF: false,
    hasEXIF: false,
    hasXMP: false,
    hasAdobe: false,
    hasICC: false,
    iccComplete: false,
    warnings: [],
    errors: [],
  };

  // Check for required segments
  for (const segment of appSegments) {
    switch (segment.type) {
      case "JFIF":
        results.hasJFIF = true;
        break;
      case "EXIF":
        results.hasEXIF = true;
        break;
      case "XMP":
        results.hasXMP = true;
        break;
      case "Adobe":
        results.hasAdobe = true;
        break;
      case "ICC":
        results.hasICC = true;
        break;
    }
  }

  // Check ICC profile completeness
  if (results.hasICC) {
    const iccProfile = assembleICCProfile(appSegments);
    results.iccComplete = iccProfile !== null;
  }

  // Validation rules
  if (!results.hasJFIF) {
    results.warnings.push("No JFIF segment found - image may not conform to JFIF standard");
  }

  if (results.hasEXIF && results.hasXMP) {
    results.warnings.push("Both EXIF and XMP metadata present - potential duplication");
  }

  if (results.hasAdobe && !results.hasJFIF) {
    results.errors.push("Adobe APP14 segment without JFIF - invalid JPEG structure");
  }

  return results;
}
