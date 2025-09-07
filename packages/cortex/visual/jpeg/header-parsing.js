/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file JPEG header parsing and marker processing.
 *
 * JPEG files are structured as a sequence of markers that define the image
 * format, compression parameters, and encoded data. This module handles
 * parsing these markers to extract all necessary information for decoding.
 */

/**
 * JPEG marker constants.
 * All markers start with 0xFF followed by a specific byte.
 */
export const JPEG_MARKERS = {
  // Start/End markers
  SOI: 0xffd8, // Start of Image
  EOI: 0xffd9, // End of Image

  // Frame markers (Start of Frame)
  SOF0: 0xffc0, // Baseline DCT
  SOF1: 0xffc1, // Extended sequential DCT
  SOF2: 0xffc2, // Progressive DCT
  SOF3: 0xffc3, // Lossless (sequential)

  // Huffman table markers
  DHT: 0xffc4, // Define Huffman Table

  // Quantization table markers
  DQT: 0xffdb, // Define Quantization Table

  // Restart markers
  RST0: 0xffd0, // Restart 0
  RST1: 0xffd1, // Restart 1
  RST2: 0xffd2, // Restart 2
  RST3: 0xffd3, // Restart 3
  RST4: 0xffd4, // Restart 4
  RST5: 0xffd5, // Restart 5
  RST6: 0xffd6, // Restart 6
  RST7: 0xffd7, // Restart 7

  // Scan markers
  SOS: 0xffda, // Start of Scan

  // Application markers
  APP0: 0xffe0, // Application segment 0 (JFIF)
  APP1: 0xffe1, // Application segment 1 (EXIF)
  APP2: 0xffe2, // Application segment 2
  APP3: 0xffe3, // Application segment 3
  APP4: 0xffe4, // Application segment 4
  APP5: 0xffe5, // Application segment 5
  APP6: 0xffe6, // Application segment 6
  APP7: 0xffe7, // Application segment 7
  APP8: 0xffe8, // Application segment 8
  APP9: 0xffe9, // Application segment 9
  APP10: 0xffea, // Application segment 10
  APP11: 0xffeb, // Application segment 11
  APP12: 0xffec, // Application segment 12
  APP13: 0xffed, // Application segment 13
  APP14: 0xffee, // Application segment 14
  APP15: 0xffef, // Application segment 15

  // Comment marker
  COM: 0xfffe, // Comment
};

/**
 * Validates JPEG data buffer.
 *
 * @param {Uint8Array} data - JPEG data buffer
 * @throws {Error} If data is invalid
 */
export function validateJPEGData(data) {
  if (!(data instanceof Uint8Array)) {
    throw new Error("JPEG data must be a Uint8Array");
  }

  if (data.length < 4) {
    throw new Error("JPEG data too short (minimum 4 bytes required)");
  }

  // Check for SOI marker at start
  const soi = (data[0] << 8) | data[1];
  if (soi !== JPEG_MARKERS.SOI) {
    throw new Error(
      `Invalid JPEG: missing SOI marker (expected 0x${JPEG_MARKERS.SOI.toString(16)}, got 0x${soi.toString(16)})`
    );
  }
}

/**
 * Reads a 16-bit big-endian value from buffer.
 *
 * @param {Uint8Array} data - Data buffer
 * @param {number} offset - Byte offset
 * @returns {number} 16-bit value
 * @throws {Error} If offset is out of bounds
 */
export function readUint16BE(data, offset) {
  if (offset < 0 || offset + 1 >= data.length) {
    throw new Error(`Offset ${offset} out of bounds for buffer length ${data.length}`);
  }
  return (data[offset] << 8) | data[offset + 1];
}

/**
 * Reads an 8-bit value from buffer.
 *
 * @param {Uint8Array} data - Data buffer
 * @param {number} offset - Byte offset
 * @returns {number} 8-bit value
 * @throws {Error} If offset is out of bounds
 */
export function readUint8(data, offset) {
  if (offset < 0 || offset >= data.length) {
    throw new Error(`Offset ${offset} out of bounds for buffer length ${data.length}`);
  }
  return data[offset];
}

/**
 * Finds the next JPEG marker in the data stream.
 *
 * @param {Uint8Array} data - JPEG data buffer
 * @param {number} startOffset - Starting search offset
 * @returns {{
 *   marker: number,
 *   offset: number,
 *   found: boolean
 * }} Marker information
 */
export function findNextMarker(data, startOffset = 0) {
  let offset = startOffset;

  while (offset < data.length - 1) {
    if (data[offset] === 0xff) {
      const nextByte = data[offset + 1];

      // Skip padding bytes (0xFF 0x00 is not a marker)
      if (nextByte === 0x00) {
        offset += 2;
        continue;
      }

      // Skip fill bytes (multiple 0xFF in a row)
      if (nextByte === 0xff) {
        offset += 1;
        continue;
      }

      // Found a valid marker
      const marker = (data[offset] << 8) | nextByte;
      return {
        marker,
        offset,
        found: true,
      };
    }
    offset++;
  }

  return {
    marker: 0,
    offset: data.length,
    found: false,
  };
}

/**
 * Parses a Start of Frame (SOF) marker.
 *
 * @param {Uint8Array} data - JPEG data buffer
 * @param {number} offset - Marker offset
 * @returns {{
 *   length: number,
 *   precision: number,
 *   height: number,
 *   width: number,
 *   components: Array<{
 *     id: number,
 *     horizontalSampling: number,
 *     verticalSampling: number,
 *     quantizationTable: number
 *   }>,
 *   nextOffset: number
 * }} Parsed SOF data
 */
export function parseSOF(data, offset) {
  const length = readUint16BE(data, offset);
  const precision = readUint8(data, offset + 2);
  const height = readUint16BE(data, offset + 3);
  const width = readUint16BE(data, offset + 5);
  const numComponents = readUint8(data, offset + 7);

  if (length !== 8 + numComponents * 3) {
    throw new Error(`Invalid SOF length: expected ${8 + numComponents * 3}, got ${length}`);
  }

  if (precision !== 8) {
    throw new Error(`Unsupported precision: ${precision} (only 8-bit supported)`);
  }

  if (numComponents < 1 || numComponents > 4) {
    throw new Error(`Invalid number of components: ${numComponents} (must be 1-4)`);
  }

  const components = [];
  for (let i = 0; i < numComponents; i++) {
    const componentOffset = offset + 8 + i * 3;
    const id = readUint8(data, componentOffset);
    const sampling = readUint8(data, componentOffset + 1);
    const quantizationTable = readUint8(data, componentOffset + 2);

    components.push({
      id,
      horizontalSampling: (sampling >> 4) & 0x0f,
      verticalSampling: sampling & 0x0f,
      quantizationTable,
    });
  }

  return {
    length,
    precision,
    height,
    width,
    components,
    nextOffset: offset + length,
  };
}

/**
 * Parses a Define Quantization Table (DQT) marker.
 *
 * @param {Uint8Array} data - JPEG data buffer
 * @param {number} offset - Marker offset
 * @returns {{
 *   length: number,
 *   tables: Array<{
 *     id: number,
 *     precision: number,
 *     values: number[]
 *   }>,
 *   nextOffset: number
 * }} Parsed DQT data
 */
export function parseDQT(data, offset) {
  const length = readUint16BE(data, offset);
  const tables = [];
  let currentOffset = offset + 2;
  const endOffset = offset + length;

  while (currentOffset < endOffset) {
    const tableInfo = readUint8(data, currentOffset);
    const precision = (tableInfo >> 4) & 0x0f; // 0 = 8-bit, 1 = 16-bit
    const id = tableInfo & 0x0f;

    if (precision > 1) {
      throw new Error(`Invalid quantization table precision: ${precision}`);
    }

    if (id > 3) {
      throw new Error(`Invalid quantization table ID: ${id} (must be 0-3)`);
    }

    const _valueSize = precision === 0 ? 1 : 2;
    const values = [];

    currentOffset++; // Skip table info byte

    for (let i = 0; i < 64; i++) {
      if (currentOffset >= endOffset) {
        throw new Error("Unexpected end of DQT data");
      }

      let value;
      if (precision === 0) {
        value = readUint8(data, currentOffset);
        currentOffset++;
      } else {
        value = readUint16BE(data, currentOffset);
        currentOffset += 2;
      }

      if (value === 0) {
        throw new Error(`Invalid quantization value 0 at position ${i}`);
      }

      values.push(value);
    }

    tables.push({
      id,
      precision,
      values,
    });
  }

  return {
    length,
    tables,
    nextOffset: endOffset,
  };
}

/**
 * Parses a Define Huffman Table (DHT) marker.
 *
 * @param {Uint8Array} data - JPEG data buffer
 * @param {number} offset - Marker offset
 * @returns {{
 *   length: number,
 *   tables: Array<{
 *     class: number,
 *     id: number,
 *     codeLengths: number[],
 *     symbols: number[]
 *   }>,
 *   nextOffset: number
 * }} Parsed DHT data
 */
export function parseDHT(data, offset) {
  const length = readUint16BE(data, offset);
  const tables = [];
  let currentOffset = offset + 2;
  const endOffset = offset + length;

  while (currentOffset < endOffset) {
    const tableInfo = readUint8(data, currentOffset);
    const tableClass = (tableInfo >> 4) & 0x0f; // 0 = DC, 1 = AC
    const id = tableInfo & 0x0f;

    if (tableClass > 1) {
      throw new Error(`Invalid Huffman table class: ${tableClass} (must be 0 or 1)`);
    }

    if (id > 3) {
      throw new Error(`Invalid Huffman table ID: ${id} (must be 0-3)`);
    }

    currentOffset++; // Skip table info byte

    // Read code lengths (16 bytes)
    const codeLengths = [];
    let totalSymbols = 0;

    for (let i = 0; i < 16; i++) {
      if (currentOffset >= endOffset) {
        throw new Error("Unexpected end of DHT data while reading code lengths");
      }
      const length = readUint8(data, currentOffset++);
      codeLengths.push(length);
      totalSymbols += length;
    }

    // Read symbols
    const symbols = [];
    for (let i = 0; i < totalSymbols; i++) {
      if (currentOffset >= endOffset) {
        throw new Error("Unexpected end of DHT data while reading symbols");
      }
      symbols.push(readUint8(data, currentOffset++));
    }

    tables.push({
      class: tableClass,
      id,
      codeLengths,
      symbols,
    });
  }

  return {
    length,
    tables,
    nextOffset: endOffset,
  };
}

/**
 * Parses a Start of Scan (SOS) marker.
 *
 * @param {Uint8Array} data - JPEG data buffer
 * @param {number} offset - Marker offset
 * @returns {{
 *   length: number,
 *   components: Array<{
 *     id: number,
 *     dcTable: number,
 *     acTable: number
 *   }>,
 *   spectralStart: number,
 *   spectralEnd: number,
 *   approximation: number,
 *   nextOffset: number
 * }} Parsed SOS data
 */
export function parseSOS(data, offset) {
  const length = readUint16BE(data, offset);
  const numComponents = readUint8(data, offset + 2);

  if (numComponents < 1 || numComponents > 4) {
    throw new Error(`Invalid number of components in SOS: ${numComponents}`);
  }

  if (length !== 6 + numComponents * 2) {
    throw new Error(`Invalid SOS length: expected ${6 + numComponents * 2}, got ${length}`);
  }

  const components = [];
  for (let i = 0; i < numComponents; i++) {
    const componentOffset = offset + 3 + i * 2;
    const id = readUint8(data, componentOffset);
    const tables = readUint8(data, componentOffset + 1);

    components.push({
      id,
      dcTable: (tables >> 4) & 0x0f,
      acTable: tables & 0x0f,
    });
  }

  const spectralStart = readUint8(data, offset + 3 + numComponents * 2);
  const spectralEnd = readUint8(data, offset + 4 + numComponents * 2);
  const approximation = readUint8(data, offset + 5 + numComponents * 2);

  return {
    length,
    components,
    spectralStart,
    spectralEnd,
    approximation,
    nextOffset: offset + length,
  };
}

/**
 * Parses an application segment (APP0-APP15).
 *
 * @param {Uint8Array} data - JPEG data buffer
 * @param {number} offset - Marker offset
 * @returns {{
 *   length: number,
 *   identifier: string,
 *   data: Uint8Array,
 *   nextOffset: number
 * }} Parsed application segment
 */
export function parseAPP(data, offset) {
  const length = readUint16BE(data, offset);

  if (length < 2) {
    throw new Error(`Invalid APP segment length: ${length}`);
  }

  // Extract identifier (null-terminated string)
  let identifierEnd = offset + 2;
  while (identifierEnd < offset + length && data[identifierEnd] !== 0) {
    identifierEnd++;
  }

  const identifier = new TextDecoder("ascii").decode(data.slice(offset + 2, identifierEnd));
  const segmentData = data.slice(identifierEnd + 1, offset + length);

  return {
    length,
    identifier,
    data: segmentData,
    nextOffset: offset + length,
  };
}

/**
 * Parses a comment (COM) segment.
 *
 * @param {Uint8Array} data - JPEG data buffer
 * @param {number} offset - Marker offset
 * @returns {{
 *   length: number,
 *   comment: string,
 *   nextOffset: number
 * }} Parsed comment segment
 */
export function parseCOM(data, offset) {
  const length = readUint16BE(data, offset);

  if (length < 2) {
    throw new Error(`Invalid COM segment length: ${length}`);
  }

  const commentData = data.slice(offset + 2, offset + length);
  const comment = new TextDecoder("utf-8").decode(commentData);

  return {
    length,
    comment,
    nextOffset: offset + length,
  };
}

/**
 * Parses all JPEG headers and returns structured information.
 *
 * @param {Uint8Array} data - JPEG data buffer
 * @returns {{
 *   sof: Object | null,
 *   quantizationTables: Map<number, Object>,
 *   huffmanTables: Map<string, Object>,
 *   sos: Object | null,
 *   applicationSegments: Array<Object>,
 *   comments: Array<string>,
 *   scanDataOffset: number
 * }} Parsed JPEG structure
 *
 * @example
 * const jpegData = new Uint8Array(jpegFileBuffer);
 * const parsed = parseJPEGHeaders(jpegData);
 * console.log(`Image size: ${parsed.sof.width}x${parsed.sof.height}`);
 * console.log(`Components: ${parsed.sof.components.length}`);
 */
/**
 * @returns {{
 *   sof: {
 *     type: number,
 *     precision: number,
 *     height: number,
 *     width: number,
 *     components: Array<{
 *       id: number,
 *       horizontalSampling: number,
 *       verticalSampling: number,
 *       quantizationTable: number
 *     }>
 *   } | null,
 *   quantizationTables: Map<number, {
 *     id: number,
 *     precision: number,
 *     values: number[]
 *   }>,
 *   huffmanTables: Map<string, {
 *     class: number,
 *     id: number,
 *     codeLengths: number[],
 *     symbols: number[]
 *   }>,
 *   sos: {
 *     components: Array<{
 *       id: number,
 *       dcTable: number,
 *       acTable: number
 *     }>,
 *     spectralStart: number,
 *     spectralEnd: number,
 *     approximationHigh: number,
 *     approximationLow: number
 *   } | null,
 *   applicationSegments: Array<{
 *     marker: number,
 *     data: Uint8Array
 *   }>,
 *   comments: string[],
 *   scanDataOffset: number
 * }}
 */
/**
 * @param {Uint8Array} data - JPEG data buffer
 */
export function parseJPEGHeaders(data) {
  validateJPEGData(data);

  /** @type {{
   *   sof: {
   *     type: number,
   *     precision: number,
   *     height: number,
   *     width: number,
   *     components: Array<{
   *       id: number,
   *       horizontalSampling: number,
   *       verticalSampling: number,
   *       quantizationTable: number
   *     }>
   *   } | null,
   *   quantizationTables: Map<number, {
   *     id: number,
   *     precision: number,
   *     values: number[]
   *   }>,
   *   huffmanTables: Map<string, {
   *     class: number,
   *     id: number,
   *     codeLengths: number[],
   *     symbols: number[]
   *   }>,
   *   sos: {
   *     components: Array<{
   *       id: number,
   *       dcTable: number,
   *       acTable: number
   *     }>,
   *     spectralStart: number,
   *     spectralEnd: number,
   *     approximationHigh: number,
   *     approximationLow: number
   *   } | null,
   *   applicationSegments: Array<{
   *     marker: number,
   *     data: Uint8Array
   *   }>,
   *   comments: string[],
   *   scanDataOffset: number
   * }} */
  const result = {
    sof: null,
    quantizationTables: new Map(),
    huffmanTables: new Map(),
    sos: null,
    applicationSegments: [],
    comments: [],
    scanDataOffset: -1,
  };

  let offset = 2; // Skip SOI marker

  while (offset < data.length) {
    const markerInfo = findNextMarker(data, offset);

    if (!markerInfo.found) {
      break;
    }

    const { marker } = markerInfo;
    offset = markerInfo.offset + 2; // Skip marker bytes

    switch (marker) {
      case JPEG_MARKERS.SOF0:
      case JPEG_MARKERS.SOF1:
      case JPEG_MARKERS.SOF2: {
        if (result.sof !== null) {
          throw new Error("Multiple SOF markers found");
        }
        const sofData = parseSOF(data, offset);
        result.sof = {
          type: marker,
          precision: sofData.precision,
          height: sofData.height,
          width: sofData.width,
          components: sofData.components,
        };
        offset = sofData.nextOffset;
        break;
      }

      case JPEG_MARKERS.DQT: {
        const dqt = parseDQT(data, offset);
        for (const table of dqt.tables) {
          result.quantizationTables.set(table.id, table);
        }
        offset = dqt.nextOffset;
        break;
      }

      case JPEG_MARKERS.DHT: {
        const dht = parseDHT(data, offset);
        for (const table of dht.tables) {
          const key = `${table.class}-${table.id}`; // "0-0" for DC table 0, "1-1" for AC table 1
          result.huffmanTables.set(key, table);
        }
        offset = dht.nextOffset;
        break;
      }

      case JPEG_MARKERS.SOS: {
        if (result.sos !== null) {
          throw new Error("Multiple SOS markers found");
        }
        const sosData = parseSOS(data, offset);
        result.sos = {
          components: sosData.components,
          spectralStart: sosData.spectralStart,
          spectralEnd: sosData.spectralEnd,
          approximationHigh: (sosData.approximation >> 4) & 0x0f,
          approximationLow: sosData.approximation & 0x0f,
        };
        offset = sosData.nextOffset;
        result.scanDataOffset = offset;
        // SOS marks the start of compressed data, stop parsing headers
        return result;
      }

      case JPEG_MARKERS.APP0:
      case JPEG_MARKERS.APP1:
      case JPEG_MARKERS.APP2:
      case JPEG_MARKERS.APP3:
      case JPEG_MARKERS.APP4:
      case JPEG_MARKERS.APP5:
      case JPEG_MARKERS.APP6:
      case JPEG_MARKERS.APP7:
      case JPEG_MARKERS.APP8:
      case JPEG_MARKERS.APP9:
      case JPEG_MARKERS.APP10:
      case JPEG_MARKERS.APP11:
      case JPEG_MARKERS.APP12:
      case JPEG_MARKERS.APP13:
      case JPEG_MARKERS.APP14:
      case JPEG_MARKERS.APP15: {
        const app = parseAPP(data, offset);
        result.applicationSegments.push({
          marker,
          ...app,
        });
        offset = app.nextOffset;
        break;
      }

      case JPEG_MARKERS.COM: {
        const com = parseCOM(data, offset);
        result.comments.push(com.comment);
        offset = com.nextOffset;
        break;
      }

      case JPEG_MARKERS.EOI: {
        // End of image - should not appear before SOS
        throw new Error("Unexpected EOI marker before SOS");
      }

      default: {
        // Skip unknown markers
        if (offset < data.length - 1) {
          const segmentLength = readUint16BE(data, offset);
          offset += segmentLength;
        } else {
          offset = data.length;
        }
        break;
      }
    }
  }

  if (result.sof === null) {
    throw new Error("No SOF marker found");
  }

  if (result.sos === null) {
    throw new Error("No SOS marker found");
  }

  return result;
}

/**
 * Gets marker name from marker value.
 *
 * @param {number} marker - Marker value
 * @returns {string} Marker name or "UNKNOWN"
 */
export function getMarkerName(marker) {
  for (const [name, value] of Object.entries(JPEG_MARKERS)) {
    if (value === marker) {
      return name;
    }
  }
  return "UNKNOWN";
}

/**
 * Validates parsed JPEG structure for completeness.
 * @param {{
 *   sof: {
 *     type: number,
 *     precision: number,
 *     height: number,
 *     width: number,
 *     components: Array<{
 *       id: number,
 *       horizontalSampling: number,
 *       verticalSampling: number,
 *       quantizationTable: number
 *     }>
 *   } | null,
 *   quantizationTables: Map<number, {
 *     id: number,
 *     precision: number,
 *     values: number[]
 *   }>,
 *   huffmanTables: Map<string, {
 *     class: number,
 *     id: number,
 *     codeLengths: number[],
 *     symbols: number[]
 *   }>,
 *   sos: {
 *     components: Array<{
 *       id: number,
 *       dcTable: number,
 *       acTable: number
 *     }>,
 *     spectralStart: number,
 *     spectralEnd: number,
 *     approximationHigh: number,
 *     approximationLow: number
 *   } | null,
 *   applicationSegments: Array<{
 *     marker: number,
 *     data: Uint8Array
 *   }>,
 *   comments: string[],
 *   scanDataOffset: number
 * }} parsed - Parsed JPEG structure
 * @throws {Error} If structure is invalid or incomplete
 */
export function validateJPEGStructure(parsed) {
  if (!parsed.sof) {
    throw new Error("Missing Start of Frame (SOF) marker");
  }

  if (!parsed.sos) {
    throw new Error("Missing Start of Scan (SOS) marker");
  }

  if (parsed.scanDataOffset < 0) {
    throw new Error("Scan data offset not found");
  }

  // Validate that all components have required quantization tables
  for (const component of parsed.sof.components) {
    if (!parsed.quantizationTables.has(component.quantizationTable)) {
      throw new Error(`Missing quantization table ${component.quantizationTable} for component ${component.id}`);
    }
  }

  // Validate that all scan components have required Huffman tables
  for (const component of parsed.sos.components) {
    const dcKey = `0-${component.dcTable}`;
    const acKey = `1-${component.acTable}`;

    if (!parsed.huffmanTables.has(dcKey)) {
      throw new Error(`Missing DC Huffman table ${component.dcTable} for component ${component.id}`);
    }

    if (!parsed.huffmanTables.has(acKey)) {
      throw new Error(`Missing AC Huffman table ${component.acTable} for component ${component.id}`);
    }
  }
}
