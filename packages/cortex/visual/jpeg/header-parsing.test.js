/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for JPEG header parsing.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  findNextMarker,
  getMarkerName,
  JPEG_MARKERS,
  parseAPP,
  parseCOM,
  parseDHT,
  parseDQT,
  parseJPEGHeaders,
  parseSOF,
  parseSOS,
  readUint8,
  readUint16BE,
  validateJPEGData,
  validateJPEGStructure,
} from "./header-parsing.js";

describe("JPEG Header Parsing", () => {
  describe("JPEG_MARKERS", () => {
    it("defines all required markers", () => {
      assert.equal(JPEG_MARKERS.SOI, 0xffd8);
      assert.equal(JPEG_MARKERS.EOI, 0xffd9);
      assert.equal(JPEG_MARKERS.SOF0, 0xffc0);
      assert.equal(JPEG_MARKERS.DHT, 0xffc4);
      assert.equal(JPEG_MARKERS.DQT, 0xffdb);
      assert.equal(JPEG_MARKERS.SOS, 0xffda);
      assert.equal(JPEG_MARKERS.APP0, 0xffe0);
      assert.equal(JPEG_MARKERS.COM, 0xfffe);
    });

    it("has unique marker values", () => {
      const values = Object.values(JPEG_MARKERS);
      const uniqueValues = new Set(values);
      assert.equal(values.length, uniqueValues.size, "All marker values should be unique");
    });
  });

  describe("validateJPEGData", () => {
    it("accepts valid JPEG data", () => {
      const validData = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]); // SOI + EOI
      assert.doesNotThrow(() => validateJPEGData(validData));
    });

    it("rejects non-Uint8Array data", () => {
      assert.throws(() => validateJPEGData([]), /Uint8Array/);
      assert.throws(() => validateJPEGData("invalid"), /Uint8Array/);
    });

    it("rejects too short data", () => {
      const shortData = new Uint8Array([0xff, 0xd8]); // Only 2 bytes
      assert.throws(() => validateJPEGData(shortData), /too short/);
    });

    it("rejects data without SOI marker", () => {
      const invalidData = new Uint8Array([0x00, 0x00, 0xff, 0xd9]);
      assert.throws(() => validateJPEGData(invalidData), /missing SOI marker/);
    });
  });

  describe("readUint16BE and readUint8", () => {
    it("reads 16-bit big-endian values correctly", () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      assert.equal(readUint16BE(data, 0), 0x1234);
      assert.equal(readUint16BE(data, 1), 0x3456);
      assert.equal(readUint16BE(data, 2), 0x5678);
    });

    it("reads 8-bit values correctly", () => {
      const data = new Uint8Array([0x12, 0x34, 0x56]);
      assert.equal(readUint8(data, 0), 0x12);
      assert.equal(readUint8(data, 1), 0x34);
      assert.equal(readUint8(data, 2), 0x56);
    });

    it("validates bounds for 16-bit reads", () => {
      const data = new Uint8Array([0x12, 0x34]);
      assert.throws(() => readUint16BE(data, -1), /out of bounds/);
      assert.throws(() => readUint16BE(data, 1), /out of bounds/); // Would read beyond end
      assert.throws(() => readUint16BE(data, 2), /out of bounds/);
    });

    it("validates bounds for 8-bit reads", () => {
      const data = new Uint8Array([0x12]);
      assert.throws(() => readUint8(data, -1), /out of bounds/);
      assert.throws(() => readUint8(data, 1), /out of bounds/);
    });
  });

  describe("findNextMarker", () => {
    it("finds markers correctly", () => {
      const data = new Uint8Array([0x00, 0x01, 0xff, 0xd8, 0x02, 0x03]);
      const result = findNextMarker(data, 0);

      assert.equal(result.found, true);
      assert.equal(result.marker, 0xffd8);
      assert.equal(result.offset, 2);
    });

    it("skips padding bytes (0xFF 0x00)", () => {
      const data = new Uint8Array([0xff, 0x00, 0xff, 0xd8]);
      const result = findNextMarker(data, 0);

      assert.equal(result.found, true);
      assert.equal(result.marker, 0xffd8);
      assert.equal(result.offset, 2);
    });

    it("skips fill bytes (multiple 0xFF)", () => {
      const data = new Uint8Array([0xff, 0xff, 0xff, 0xd8]);
      const result = findNextMarker(data, 0);

      assert.equal(result.found, true);
      assert.equal(result.marker, 0xffd8);
      assert.equal(result.offset, 2);
    });

    it("returns not found when no marker exists", () => {
      const data = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const result = findNextMarker(data, 0);

      assert.equal(result.found, false);
      assert.equal(result.offset, data.length);
    });

    it("starts search from specified offset", () => {
      const data = new Uint8Array([0xff, 0xd8, 0x00, 0xff, 0xd9]);
      const result = findNextMarker(data, 2);

      assert.equal(result.found, true);
      assert.equal(result.marker, 0xffd9);
      assert.equal(result.offset, 3);
    });
  });

  describe("parseSOF", () => {
    it("parses SOF0 marker correctly", () => {
      // SOF0: length=17, precision=8, height=100, width=200, components=3
      const data = new Uint8Array([
        0x00,
        0x11, // Length: 17
        0x08, // Precision: 8
        0x00,
        0x64, // Height: 100
        0x00,
        0xc8, // Width: 200
        0x03, // Components: 3
        // Component 1: ID=1, sampling=0x22, quantization=0
        0x01,
        0x22,
        0x00,
        // Component 2: ID=2, sampling=0x11, quantization=1
        0x02,
        0x11,
        0x01,
        // Component 3: ID=3, sampling=0x11, quantization=1
        0x03,
        0x11,
        0x01,
      ]);

      const result = parseSOF(data, 0);

      assert.equal(result.length, 17);
      assert.equal(result.precision, 8);
      assert.equal(result.height, 100);
      assert.equal(result.width, 200);
      assert.equal(result.components.length, 3);

      // Check first component
      assert.equal(result.components[0].id, 1);
      assert.equal(result.components[0].horizontalSampling, 2);
      assert.equal(result.components[0].verticalSampling, 2);
      assert.equal(result.components[0].quantizationTable, 0);

      // Check second component
      assert.equal(result.components[1].id, 2);
      assert.equal(result.components[1].horizontalSampling, 1);
      assert.equal(result.components[1].verticalSampling, 1);
      assert.equal(result.components[1].quantizationTable, 1);

      assert.equal(result.nextOffset, 17);
    });

    it("validates SOF length", () => {
      const invalidData = new Uint8Array([
        0x00,
        0x10, // Length: 16 (too short for 3 components)
        0x08, // Precision: 8
        0x00,
        0x64, // Height: 100
        0x00,
        0xc8, // Width: 200
        0x03, // Components: 3
      ]);

      assert.throws(() => parseSOF(invalidData, 0), /Invalid SOF length/);
    });

    it("validates precision", () => {
      const invalidData = new Uint8Array([
        0x00,
        0x0b, // Length: 11
        0x0c, // Precision: 12 (unsupported)
        0x00,
        0x64, // Height: 100
        0x00,
        0xc8, // Width: 200
        0x01, // Components: 1
        0x01,
        0x11,
        0x00,
      ]);

      assert.throws(() => parseSOF(invalidData, 0), /Unsupported precision/);
    });

    it("validates number of components", () => {
      const invalidData = new Uint8Array([
        0x00,
        0x08, // Length: 8
        0x08, // Precision: 8
        0x00,
        0x64, // Height: 100
        0x00,
        0xc8, // Width: 200
        0x00, // Components: 0 (invalid)
      ]);

      assert.throws(() => parseSOF(invalidData, 0), /Invalid number of components/);
    });
  });

  describe("parseDQT", () => {
    it("parses single quantization table", () => {
      // Create minimal DQT with 8-bit precision
      const tableValues = Array.from({ length: 64 }, (_, i) => i + 1); // 1-64
      const data = new Uint8Array([
        0x00,
        0x43, // Length: 67 (2 + 1 + 64)
        0x00, // Table info: precision=0, id=0
        ...tableValues,
      ]);

      const result = parseDQT(data, 0);

      assert.equal(result.length, 67);
      assert.equal(result.tables.length, 1);

      const table = result.tables[0];
      assert.equal(table.id, 0);
      assert.equal(table.precision, 0);
      assert.equal(table.values.length, 64);
      assert.equal(table.values[0], 1);
      assert.equal(table.values[63], 64);

      assert.equal(result.nextOffset, 67);
    });

    it("parses multiple quantization tables", () => {
      const table1Values = Array.from({ length: 64 }, () => 16);
      const table2Values = Array.from({ length: 64 }, () => 32);

      const data = new Uint8Array([
        0x00,
        0x84, // Length: 132 (2 + 65 + 65)
        0x00, // Table 1: precision=0, id=0
        ...table1Values,
        0x01, // Table 2: precision=0, id=1
        ...table2Values,
      ]);

      const result = parseDQT(data, 0);

      assert.equal(result.tables.length, 2);
      assert.equal(result.tables[0].id, 0);
      assert.equal(result.tables[1].id, 1);
      assert.equal(result.tables[0].values[0], 16);
      assert.equal(result.tables[1].values[0], 32);
    });

    it("validates quantization table precision", () => {
      const data = new Uint8Array([
        0x00,
        0x03, // Length: 3
        0x20, // Table info: precision=2 (invalid), id=0
      ]);

      assert.throws(() => parseDQT(data, 0), /Invalid quantization table precision/);
    });

    it("validates quantization table ID", () => {
      const data = new Uint8Array([
        0x00,
        0x03, // Length: 3
        0x04, // Table info: precision=0, id=4 (invalid)
      ]);

      assert.throws(() => parseDQT(data, 0), /Invalid quantization table ID/);
    });

    it("validates quantization values are non-zero", () => {
      const tableValues = Array.from({ length: 64 }, (_, i) => (i === 5 ? 0 : i + 1));
      const data = new Uint8Array([
        0x00,
        0x43, // Length: 67
        0x00, // Table info: precision=0, id=0
        ...tableValues,
      ]);

      assert.throws(() => parseDQT(data, 0), /Invalid quantization value 0/);
    });
  });

  describe("parseDHT", () => {
    it("parses Huffman table correctly", () => {
      const codeLengths = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]; // 12 symbols total
      const symbols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

      const data = new Uint8Array([
        0x00,
        0x1f, // Length: 31 (2 + 1 + 16 + 12)
        0x00, // Table info: class=0 (DC), id=0
        ...codeLengths,
        ...symbols,
      ]);

      const result = parseDHT(data, 0);

      assert.equal(result.length, 31);
      assert.equal(result.tables.length, 1);

      const table = result.tables[0];
      assert.equal(table.class, 0); // DC table
      assert.equal(table.id, 0);
      assert.deepEqual(table.codeLengths, codeLengths);
      assert.deepEqual(table.symbols, symbols);

      assert.equal(result.nextOffset, 31);
    });

    it("parses multiple Huffman tables", () => {
      const dcCodeLengths = [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 2 symbols
      const dcSymbols = [0, 1];
      const acCodeLengths = [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 2 symbols
      const acSymbols = [0, 1];

      const totalLength = 2 + (1 + 16 + dcSymbols.length) + (1 + 16 + acSymbols.length);
      const data = new Uint8Array([
        0x00,
        totalLength, // Length: calculated dynamically
        0x00, // DC table: class=0, id=0
        ...dcCodeLengths,
        ...dcSymbols,
        0x10, // AC table: class=1, id=0
        ...acCodeLengths,
        ...acSymbols,
      ]);

      const result = parseDHT(data, 0);

      assert.equal(result.tables.length, 2);
      assert.equal(result.tables[0].class, 0); // DC
      assert.equal(result.tables[1].class, 1); // AC
    });

    it("validates Huffman table class", () => {
      const data = new Uint8Array([
        0x00,
        0x13, // Length: 19
        0x20, // Table info: class=2 (invalid), id=0
      ]);

      assert.throws(() => parseDHT(data, 0), /Invalid Huffman table class/);
    });

    it("validates Huffman table ID", () => {
      const data = new Uint8Array([
        0x00,
        0x13, // Length: 19
        0x04, // Table info: class=0, id=4 (invalid)
      ]);

      assert.throws(() => parseDHT(data, 0), /Invalid Huffman table ID/);
    });
  });

  describe("parseSOS", () => {
    it("parses Start of Scan correctly", () => {
      const data = new Uint8Array([
        0x00,
        0x0c, // Length: 12
        0x03, // Components: 3
        // Component 1: id=1, DC table=0, AC table=0
        0x01,
        0x00,
        // Component 2: id=2, DC table=1, AC table=1
        0x02,
        0x11,
        // Component 3: id=3, DC table=1, AC table=1
        0x03,
        0x11,
        0x00, // Spectral start: 0
        0x3f, // Spectral end: 63
        0x00, // Approximation: 0
      ]);

      const result = parseSOS(data, 0);

      assert.equal(result.length, 12);
      assert.equal(result.components.length, 3);

      // Check components
      assert.equal(result.components[0].id, 1);
      assert.equal(result.components[0].dcTable, 0);
      assert.equal(result.components[0].acTable, 0);

      assert.equal(result.components[1].id, 2);
      assert.equal(result.components[1].dcTable, 1);
      assert.equal(result.components[1].acTable, 1);

      assert.equal(result.spectralStart, 0);
      assert.equal(result.spectralEnd, 63);
      assert.equal(result.approximation, 0);

      assert.equal(result.nextOffset, 12);
    });

    it("validates number of components", () => {
      const data = new Uint8Array([
        0x00,
        0x06, // Length: 6
        0x00, // Components: 0 (invalid)
      ]);

      assert.throws(() => parseSOS(data, 0), /Invalid number of components/);
    });

    it("validates SOS length", () => {
      const data = new Uint8Array([
        0x00,
        0x08, // Length: 8 (too short for 3 components)
        0x03, // Components: 3
      ]);

      assert.throws(() => parseSOS(data, 0), /Invalid SOS length/);
    });
  });

  describe("parseAPP", () => {
    it("parses application segment correctly", () => {
      const identifier = "JFIF";
      const appData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const data = new Uint8Array([
        0x00,
        0x0b, // Length: 11 (2 + 5 + 4)
        0x4a,
        0x46,
        0x49,
        0x46, // "JFIF"
        0x00, // Null terminator
        ...appData,
      ]);

      const result = parseAPP(data, 0);

      assert.equal(result.length, 11);
      assert.equal(result.identifier, identifier);
      assert.deepEqual(result.data, appData);
      assert.equal(result.nextOffset, 11);
    });

    it("validates APP segment length", () => {
      const data = new Uint8Array([0x00, 0x01]); // Length: 1 (too short)

      assert.throws(() => parseAPP(data, 0), /Invalid APP segment length/);
    });
  });

  describe("parseCOM", () => {
    it("parses comment segment correctly", () => {
      const comment = "Test comment";
      const commentBytes = new TextEncoder().encode(comment);
      const data = new Uint8Array([
        0x00,
        0x02 + commentBytes.length, // Length: 2 + comment length
        ...commentBytes,
      ]);

      const result = parseCOM(data, 0);

      assert.equal(result.length, 2 + commentBytes.length);
      assert.equal(result.comment, comment);
      assert.equal(result.nextOffset, 2 + commentBytes.length);
    });

    it("validates COM segment length", () => {
      const data = new Uint8Array([0x00, 0x01]); // Length: 1 (too short)

      assert.throws(() => parseCOM(data, 0), /Invalid COM segment length/);
    });
  });

  describe("parseJPEGHeaders", () => {
    it("parses complete JPEG structure", () => {
      // Create minimal valid JPEG structure
      const data = new Uint8Array([
        // SOI
        0xff,
        0xd8,
        // DQT (minimal quantization table)
        0xff,
        0xdb,
        0x00,
        0x43, // Length: 67
        0x00, // Table info: precision=0, id=0
        ...Array.from({ length: 64 }, (_, i) => i + 1),
        // SOF0
        0xff,
        0xc0,
        0x00,
        0x11, // Length: 17
        0x08, // Precision: 8
        0x00,
        0x64, // Height: 100
        0x00,
        0xc8, // Width: 200
        0x03, // Components: 3
        0x01,
        0x22,
        0x00, // Component 1
        0x02,
        0x11,
        0x01, // Component 2
        0x03,
        0x11,
        0x01, // Component 3
        // DHT (minimal Huffman table)
        0xff,
        0xc4,
        0x00,
        0x15, // Length: 21
        0x00, // DC table 0
        0x00,
        0x01,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // Code lengths
        0x00,
        0x01, // Symbols
        // SOS
        0xff,
        0xda,
        0x00,
        0x0c, // Length: 12
        0x03, // Components: 3
        0x01,
        0x00, // Component 1
        0x02,
        0x11, // Component 2
        0x03,
        0x11, // Component 3
        0x00, // Spectral start
        0x3f, // Spectral end
        0x00, // Approximation
        // Scan data would follow...
      ]);

      const result = parseJPEGHeaders(data);

      assert(result.sof !== null);
      assert.equal(result.sof.width, 200);
      assert.equal(result.sof.height, 100);
      assert.equal(result.sof.components.length, 3);

      assert.equal(result.quantizationTables.size, 1);
      assert(result.quantizationTables.has(0));

      assert.equal(result.huffmanTables.size, 1);
      assert(result.huffmanTables.has("0-0"));

      assert(result.sos !== null);
      assert.equal(result.sos.components.length, 3);

      assert(result.scanDataOffset > 0);
    });

    it("handles application segments and comments", () => {
      const data = new Uint8Array([
        // SOI
        0xff,
        0xd8,
        // APP0
        0xff,
        0xe0,
        0x00,
        0x07, // Length: 7
        0x4a,
        0x46,
        0x49,
        0x46, // "JFIF"
        0x00, // Null terminator
        // COM
        0xff,
        0xfe,
        0x00,
        0x05, // Length: 5
        0x48,
        0x69, // "Hi"
        0x21, // "!"
        // Minimal structure to make it valid...
        // (SOF, DQT, DHT, SOS would follow)
      ]);

      // This will fail because it's incomplete, but we can test the parsing
      // of APP and COM segments by checking the error message
      assert.throws(() => parseJPEGHeaders(data), /No SOF marker found/);
    });

    it("validates required markers", () => {
      const incompleteData = new Uint8Array([0xff, 0xd8, 0x00, 0x00]); // SOI + some data but no SOF

      assert.throws(() => parseJPEGHeaders(incompleteData), /No SOF marker found/);
    });

    it("rejects multiple SOF markers", () => {
      const data = new Uint8Array([
        0xff,
        0xd8, // SOI
        0xff,
        0xc0, // SOF0
        0x00,
        0x0b, // Length: 11
        0x08, // Precision: 8
        0x00,
        0x01, // Height: 1
        0x00,
        0x01, // Width: 1
        0x01, // Components: 1
        0x01,
        0x11,
        0x00, // Component 1
        0xff,
        0xc0, // Another SOF0 (invalid)
        0x00,
        0x0b, // Length: 11
        0x08, // Precision: 8
        0x00,
        0x01, // Height: 1
        0x00,
        0x01, // Width: 1
        0x01, // Components: 1
        0x01,
        0x11,
        0x00, // Component 1
      ]);

      assert.throws(() => parseJPEGHeaders(data), /Multiple SOF markers/);
    });
  });

  describe("getMarkerName", () => {
    it("returns correct marker names", () => {
      assert.equal(getMarkerName(JPEG_MARKERS.SOI), "SOI");
      assert.equal(getMarkerName(JPEG_MARKERS.EOI), "EOI");
      assert.equal(getMarkerName(JPEG_MARKERS.SOF0), "SOF0");
      assert.equal(getMarkerName(JPEG_MARKERS.DHT), "DHT");
      assert.equal(getMarkerName(JPEG_MARKERS.DQT), "DQT");
      assert.equal(getMarkerName(JPEG_MARKERS.SOS), "SOS");
    });

    it("returns UNKNOWN for unknown markers", () => {
      assert.equal(getMarkerName(0x1234), "UNKNOWN");
      assert.equal(getMarkerName(0xffff), "UNKNOWN");
    });
  });

  describe("validateJPEGStructure", () => {
    it("accepts valid JPEG structure", () => {
      const validStructure = {
        sof: {
          components: [
            { id: 1, quantizationTable: 0 },
            { id: 2, quantizationTable: 1 },
          ],
        },
        sos: {
          components: [
            { id: 1, dcTable: 0, acTable: 0 },
            { id: 2, dcTable: 1, acTable: 1 },
          ],
        },
        quantizationTables: new Map([
          [0, { id: 0, values: [] }],
          [1, { id: 1, values: [] }],
        ]),
        huffmanTables: new Map([
          ["0-0", { class: 0, id: 0 }],
          ["1-0", { class: 1, id: 0 }],
          ["0-1", { class: 0, id: 1 }],
          ["1-1", { class: 1, id: 1 }],
        ]),
        scanDataOffset: 100,
      };

      assert.doesNotThrow(() => validateJPEGStructure(validStructure));
    });

    it("rejects structure missing SOF", () => {
      const invalidStructure = {
        sof: null,
        sos: {},
        scanDataOffset: 100,
      };

      assert.throws(() => validateJPEGStructure(invalidStructure), /Missing Start of Frame/);
    });

    it("rejects structure missing SOS", () => {
      const invalidStructure = {
        sof: {},
        sos: null,
        scanDataOffset: 100,
      };

      assert.throws(() => validateJPEGStructure(invalidStructure), /Missing Start of Scan/);
    });

    it("rejects structure missing quantization tables", () => {
      const invalidStructure = {
        sof: {
          components: [{ id: 1, quantizationTable: 0 }],
        },
        sos: {
          components: [{ id: 1, dcTable: 0, acTable: 0 }],
        },
        quantizationTables: new Map(), // Empty
        huffmanTables: new Map([
          ["0-0", {}],
          ["1-0", {}],
        ]),
        scanDataOffset: 100,
      };

      assert.throws(() => validateJPEGStructure(invalidStructure), /Missing quantization table/);
    });

    it("rejects structure missing Huffman tables", () => {
      const invalidStructure = {
        sof: {
          components: [{ id: 1, quantizationTable: 0 }],
        },
        sos: {
          components: [{ id: 1, dcTable: 0, acTable: 0 }],
        },
        quantizationTables: new Map([[0, {}]]),
        huffmanTables: new Map(), // Empty
        scanDataOffset: 100,
      };

      assert.throws(() => validateJPEGStructure(invalidStructure), /Missing DC Huffman table/);
    });
  });

  describe("Performance", () => {
    it("handles large JPEG headers efficiently", () => {
      // Create a JPEG with many application segments but simpler structure
      const segments = [];

      // SOI
      segments.push(0xff, 0xd8);

      // Add many APP segments
      for (let i = 0; i < 20; i++) {
        segments.push(0xff, 0xe0); // APP0
        segments.push(0x00, 0x07); // Length: 7
        segments.push(0x54, 0x65, 0x73, 0x74); // "Test"
        segments.push(0x00); // Null terminator
        segments.push(i % 256); // Some data
      }

      // Add required markers (minimal)
      // DQT
      segments.push(0xff, 0xdb);
      segments.push(0x00, 0x43); // Length: 67
      segments.push(0x00); // Table info
      for (let i = 0; i < 64; i++) {
        segments.push((i % 255) + 1); // Non-zero values
      }

      // SOF0
      segments.push(0xff, 0xc0);
      segments.push(0x00, 0x0b); // Length: 11
      segments.push(0x08); // Precision
      segments.push(0x00, 0x10); // Height: 16
      segments.push(0x00, 0x10); // Width: 16
      segments.push(0x01); // Components: 1
      segments.push(0x01, 0x11, 0x00); // Component 1

      // DHT (simple valid table)
      segments.push(0xff, 0xc4);
      segments.push(0x00, 0x15); // Length: 21
      segments.push(0x00); // DC table 0
      // Code lengths: 1 symbol at length 2
      segments.push(0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00);
      segments.push(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
      segments.push(0x00, 0x01); // Symbols

      // SOS
      segments.push(0xff, 0xda);
      segments.push(0x00, 0x08); // Length: 8
      segments.push(0x01); // Components: 1
      segments.push(0x01, 0x00); // Component 1
      segments.push(0x00, 0x3f, 0x00); // Spectral range

      const data = new Uint8Array(segments);

      // Should parse without timeout
      const result = parseJPEGHeaders(data);

      assert(result.sof !== null);
      assert.equal(result.applicationSegments.length, 20);
      assert(result.scanDataOffset > 0);
    });
  });
});
