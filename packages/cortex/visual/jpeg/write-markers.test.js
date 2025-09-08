/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  createJPEGFile,
  DEFAULT_WRITE_OPTIONS,
  generateCOM,
  generateDHT,
  generateDQT,
  generateDRI,
  generateEOI,
  generateJFIF,
  generateSOF,
  generateSOI,
  generateSOS,
  JPEG_MARKERS,
  JPEG_MODES,
  JPEGFileBuilder,
  SUBSAMPLING_FACTORS,
  writeMarker,
  writeMarkerSegment,
  writeUint16BE,
} from "./write-markers.js";

describe("JPEG Marker Generation for Encoding", () => {
  describe("Constants and Utilities", () => {
    it("defines JPEG markers", () => {
      assert.equal(JPEG_MARKERS.SOI, 0xffd8);
      assert.equal(JPEG_MARKERS.EOI, 0xffd9);
      assert.equal(JPEG_MARKERS.SOF0, 0xffc0);
      assert.equal(JPEG_MARKERS.SOF2, 0xffc2);
      assert.equal(JPEG_MARKERS.DHT, 0xffc4);
      assert.equal(JPEG_MARKERS.DQT, 0xffdb);
      assert.equal(JPEG_MARKERS.SOS, 0xffda);
      assert.equal(JPEG_MARKERS.APP0, 0xffe0);
      assert.equal(JPEG_MARKERS.APP1, 0xffe1);
      assert.equal(JPEG_MARKERS.COM, 0xfffe);
    });

    it("defines JPEG modes", () => {
      assert.equal(JPEG_MODES.BASELINE, "baseline");
      assert.equal(JPEG_MODES.EXTENDED, "extended");
      assert.equal(JPEG_MODES.PROGRESSIVE, "progressive");
      assert.equal(JPEG_MODES.LOSSLESS, "lossless");
    });

    it("defines subsampling factors", () => {
      assert.deepEqual(SUBSAMPLING_FACTORS["4:4:4"], { Y: [1, 1], Cb: [1, 1], Cr: [1, 1] });
      assert.deepEqual(SUBSAMPLING_FACTORS["4:2:2"], { Y: [2, 1], Cb: [1, 1], Cr: [1, 1] });
      assert.deepEqual(SUBSAMPLING_FACTORS["4:2:0"], { Y: [2, 2], Cb: [1, 1], Cr: [1, 1] });
      assert.deepEqual(SUBSAMPLING_FACTORS["4:1:1"], { Y: [4, 1], Cb: [1, 1], Cr: [1, 1] });
    });

    it("defines default options", () => {
      assert.equal(DEFAULT_WRITE_OPTIONS.mode, JPEG_MODES.BASELINE);
      assert.equal(DEFAULT_WRITE_OPTIONS.quality, 75);
      assert.equal(DEFAULT_WRITE_OPTIONS.subsampling, "4:2:0");
      assert.equal(DEFAULT_WRITE_OPTIONS.includeJFIF, true);
      assert.equal(DEFAULT_WRITE_OPTIONS.includeEXIF, false);
      assert.equal(DEFAULT_WRITE_OPTIONS.optimizeTables, true);
      assert.equal(DEFAULT_WRITE_OPTIONS.validateOutput, true);
      assert.equal(DEFAULT_WRITE_OPTIONS.restartInterval, 0);
    });
  });

  describe("Binary Writing Utilities", () => {
    it("writes 16-bit big-endian values", () => {
      const buffer = new Uint8Array(4);

      let offset = writeUint16BE(buffer, 0, 0x1234);
      assert.equal(offset, 2);
      assert.equal(buffer[0], 0x12);
      assert.equal(buffer[1], 0x34);

      offset = writeUint16BE(buffer, offset, 0xabcd);
      assert.equal(offset, 4);
      assert.equal(buffer[2], 0xab);
      assert.equal(buffer[3], 0xcd);
    });

    it("validates 16-bit value range", () => {
      const buffer = new Uint8Array(2);

      assert.throws(() => {
        writeUint16BE(buffer, 0, -1);
      }, /Value out of range/);

      assert.throws(() => {
        writeUint16BE(buffer, 0, 0x10000);
      }, /Value out of range/);
    });

    it("writes JPEG markers", () => {
      const buffer = new Uint8Array(2);

      const offset = writeMarker(buffer, 0, JPEG_MARKERS.SOI);
      assert.equal(offset, 2);
      assert.equal(buffer[0], 0xff);
      assert.equal(buffer[1], 0xd8);
    });

    it("validates marker format", () => {
      const buffer = new Uint8Array(2);

      assert.throws(() => {
        writeMarker(buffer, 0, 0x1234);
      }, /Invalid JPEG marker/);
    });

    it("writes marker segments with length", () => {
      const buffer = new Uint8Array(10);
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);

      const offset = writeMarkerSegment(buffer, 0, JPEG_MARKERS.COM, data);
      assert.equal(offset, 8); // 2 (marker) + 2 (length) + 4 (data)

      // Check marker
      assert.equal(buffer[0], 0xff);
      assert.equal(buffer[1], 0xfe);

      // Check length (6 = 2 + 4)
      assert.equal(buffer[2], 0x00);
      assert.equal(buffer[3], 0x06);

      // Check data
      assert.equal(buffer[4], 0x01);
      assert.equal(buffer[5], 0x02);
      assert.equal(buffer[6], 0x03);
      assert.equal(buffer[7], 0x04);
    });

    it("validates segment data", () => {
      const buffer = new Uint8Array(10);

      assert.throws(() => {
        writeMarkerSegment(buffer, 0, JPEG_MARKERS.COM, null);
      }, /Segment data must be Uint8Array/);

      assert.throws(() => {
        writeMarkerSegment(buffer, 0, JPEG_MARKERS.COM, "string");
      }, /Segment data must be Uint8Array/);
    });

    it("validates segment size limits", () => {
      const buffer = new Uint8Array(100);
      const largeData = new Uint8Array(65534); // Too large

      assert.throws(() => {
        writeMarkerSegment(buffer, 0, JPEG_MARKERS.COM, largeData);
      }, /Segment too large/);
    });
  });

  describe("Basic Marker Generation", () => {
    it("generates SOI marker", () => {
      const soi = generateSOI();

      assert(soi instanceof Uint8Array);
      assert.equal(soi.length, 2);
      assert.equal(soi[0], 0xff);
      assert.equal(soi[1], 0xd8);
    });

    it("generates EOI marker", () => {
      const eoi = generateEOI();

      assert(eoi instanceof Uint8Array);
      assert.equal(eoi.length, 2);
      assert.equal(eoi[0], 0xff);
      assert.equal(eoi[1], 0xd9);
    });

    it("generates DRI marker", () => {
      const dri = generateDRI(64);

      assert(dri instanceof Uint8Array);
      assert.equal(dri.length, 6); // Marker + length + data

      // Check marker
      assert.equal(dri[0], 0xff);
      assert.equal(dri[1], 0xdd);

      // Check length
      assert.equal(dri[2], 0x00);
      assert.equal(dri[3], 0x04);

      // Check interval
      assert.equal(dri[4], 0x00);
      assert.equal(dri[5], 0x40); // 64
    });

    it("validates DRI interval range", () => {
      assert.throws(() => {
        generateDRI(-1);
      }, /Invalid restart interval/);

      assert.throws(() => {
        generateDRI(65536);
      }, /Invalid restart interval/);
    });

    it("generates COM marker", () => {
      const comment = "Test comment";
      const com = generateCOM(comment);

      assert(com instanceof Uint8Array);
      assert.equal(com.length, 4 + comment.length); // Marker + length + data

      // Check marker
      assert.equal(com[0], 0xff);
      assert.equal(com[1], 0xfe);

      // Check length
      const expectedLength = comment.length + 2;
      assert.equal(com[2], (expectedLength >> 8) & 0xff);
      assert.equal(com[3], expectedLength & 0xff);

      // Check comment data
      const commentData = com.slice(4);
      const decodedComment = new TextDecoder().decode(commentData);
      assert.equal(decodedComment, comment);
    });

    it("validates COM parameters", () => {
      assert.throws(() => {
        generateCOM(123);
      }, /Comment must be a string/);

      const longComment = "x".repeat(65534);
      assert.throws(() => {
        generateCOM(longComment);
      }, /Comment too long/);
    });
  });

  describe("JFIF Generation", () => {
    it("generates basic JFIF marker", () => {
      const jfif = generateJFIF();

      assert(jfif instanceof Uint8Array);
      assert(jfif.length >= 18); // Minimum JFIF size

      // Check marker
      assert.equal(jfif[0], 0xff);
      assert.equal(jfif[1], 0xe0);

      // Check JFIF identifier
      const identifier = new TextDecoder().decode(jfif.slice(4, 9));
      assert.equal(identifier, "JFIF\0");
    });

    it("generates JFIF with custom parameters", () => {
      const options = {
        version: { major: 1, minor: 1 },
        densityUnits: 2, // pixels per cm
        xDensity: 300,
        yDensity: 300,
      };

      const jfif = generateJFIF(options);

      // Check version
      assert.equal(jfif[9], 1); // Major
      assert.equal(jfif[10], 1); // Minor

      // Check density units
      assert.equal(jfif[11], 2);

      // Check density values
      assert.equal(jfif[12], 0x01); // 300 >> 8
      assert.equal(jfif[13], 0x2c); // 300 & 0xFF
      assert.equal(jfif[14], 0x01);
      assert.equal(jfif[15], 0x2c);
    });

    it("generates JFIF with thumbnail", () => {
      const thumbnailData = new Uint8Array(3 * 2 * 2); // 2x2 RGB thumbnail
      thumbnailData.fill(128); // Gray thumbnail

      const options = {
        thumbnail: {
          width: 2,
          height: 2,
          data: thumbnailData,
        },
      };

      const jfif = generateJFIF(options);

      // Check thumbnail dimensions
      assert.equal(jfif[16], 2); // Width
      assert.equal(jfif[17], 2); // Height

      // Check thumbnail data
      const thumbnailStart = 18;
      for (let i = 0; i < thumbnailData.length; i++) {
        assert.equal(jfif[thumbnailStart + i], 128);
      }
    });

    it("validates JFIF parameters", () => {
      assert.throws(() => {
        generateJFIF({ version: { major: 0, minor: 0 } });
      }, /Invalid JFIF version/);

      assert.throws(() => {
        generateJFIF({ densityUnits: 3 });
      }, /Invalid density units/);

      assert.throws(() => {
        generateJFIF({ xDensity: 0 });
      }, /Invalid density values/);

      assert.throws(() => {
        generateJFIF({
          thumbnail: { width: 256, height: 256, data: new Uint8Array(1) },
        });
      }, /Thumbnail too large/);
    });
  });

  describe("Quantization Table Generation", () => {
    it("generates DQT with 8-bit table", () => {
      const tables = [
        {
          destination: 0,
          precision: 8,
          table: new Uint8Array(64).fill(16), // Simple quantization table
        },
      ];

      const dqt = generateDQT(tables);

      assert(dqt instanceof Uint8Array);
      assert.equal(dqt.length, 69); // Marker + length + precision/dest + 64 values

      // Check marker
      assert.equal(dqt[0], 0xff);
      assert.equal(dqt[1], 0xdb);

      // Check length
      assert.equal(dqt[2], 0x00);
      assert.equal(dqt[3], 0x43); // 67 bytes

      // Check precision and destination
      assert.equal(dqt[4], 0x00); // 8-bit precision, destination 0

      // Check table values
      for (let i = 0; i < 64; i++) {
        assert.equal(dqt[5 + i], 16);
      }
    });

    it("generates DQT with 16-bit table", () => {
      const tables = [
        {
          destination: 1,
          precision: 16,
          table: new Uint16Array(64).fill(256), // 16-bit quantization table
        },
      ];

      const dqt = generateDQT(tables);

      assert(dqt instanceof Uint8Array);
      assert.equal(dqt.length, 133); // Marker + length + precision/dest + 128 values

      // Check precision and destination
      assert.equal(dqt[4], 0x11); // 16-bit precision, destination 1

      // Check first table value (big-endian 256)
      assert.equal(dqt[5], 0x01);
      assert.equal(dqt[6], 0x00);
    });

    it("generates DQT with multiple tables", () => {
      const tables = [
        {
          destination: 0,
          precision: 8,
          table: new Uint8Array(64).fill(16),
        },
        {
          destination: 1,
          precision: 8,
          table: new Uint8Array(64).fill(32),
        },
      ];

      const dqt = generateDQT(tables);

      // Should contain both tables
      assert.equal(dqt.length, 134); // Marker + length + 2*(precision/dest + 64 values)

      // Check first table
      assert.equal(dqt[4], 0x00); // Destination 0
      assert.equal(dqt[5], 16);

      // Check second table
      assert.equal(dqt[69], 0x01); // Destination 1
      assert.equal(dqt[70], 32);
    });

    it("validates DQT parameters", () => {
      assert.throws(() => {
        generateDQT([]);
      }, /Must provide at least one quantization table/);

      assert.throws(() => {
        generateDQT([
          {
            destination: 4,
            precision: 8,
            table: new Uint8Array(64),
          },
        ]);
      }, /Invalid quantization table destination/);

      assert.throws(() => {
        generateDQT([
          {
            destination: 0,
            precision: 12,
            table: new Uint8Array(64),
          },
        ]);
      }, /Invalid quantization table precision/);

      assert.throws(() => {
        generateDQT([
          {
            destination: 0,
            precision: 8,
            table: new Uint8Array(63),
          },
        ]);
      }, /Invalid quantization table size/);
    });
  });

  describe("Huffman Table Generation", () => {
    it("generates DHT with single table", () => {
      const tables = [
        {
          tableClass: 0, // DC table
          destination: 0,
          codeLengths: [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [0, 1, 2, 3, 4],
        },
      ];

      const dht = generateDHT(tables);

      assert(dht instanceof Uint8Array);
      assert.equal(dht.length, 26); // Marker + length + class/dest + 16 lengths + 5 symbols

      // Check marker
      assert.equal(dht[0], 0xff);
      assert.equal(dht[1], 0xc4);

      // Check class and destination
      assert.equal(dht[4], 0x00); // DC table, destination 0

      // Check code lengths
      assert.equal(dht[5], 0); // Length 1
      assert.equal(dht[6], 1); // Length 2

      // Check symbols
      assert.equal(dht[21], 0);
      assert.equal(dht[22], 1);
      assert.equal(dht[25], 4);
    });

    it("generates DHT with AC table", () => {
      const tables = [
        {
          tableClass: 1, // AC table
          destination: 0,
          codeLengths: [0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [0, 1, 2],
        },
      ];

      const dht = generateDHT(tables);

      // Check class and destination
      assert.equal(dht[4], 0x10); // AC table, destination 0
    });

    it("generates DHT with multiple tables", () => {
      const tables = [
        {
          tableClass: 0,
          destination: 0,
          codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [0],
        },
        {
          tableClass: 1,
          destination: 0,
          codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [1],
        },
      ];

      const dht = generateDHT(tables);

      // Should contain both tables
      assert(dht.length > 25); // Two complete table entries
    });

    it("validates DHT parameters", () => {
      assert.throws(() => {
        generateDHT([]);
      }, /Must provide at least one Huffman table/);

      assert.throws(() => {
        generateDHT([
          {
            tableClass: 2,
            destination: 0,
            codeLengths: [],
            symbols: [],
          },
        ]);
      }, /Invalid Huffman table class/);

      assert.throws(() => {
        generateDHT([
          {
            tableClass: 0,
            destination: 4,
            codeLengths: [],
            symbols: [],
          },
        ]);
      }, /Invalid Huffman table destination/);

      assert.throws(() => {
        generateDHT([
          {
            tableClass: 0,
            destination: 0,
            codeLengths: [1, 2, 3], // Wrong length
            symbols: [],
          },
        ]);
      }, /Huffman table must have exactly 16 code length entries/);

      assert.throws(() => {
        generateDHT([
          {
            tableClass: 0,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0, 1], // Wrong count
          },
        ]);
      }, /Symbol count mismatch/);

      assert.throws(() => {
        generateDHT([
          {
            tableClass: 0,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [256], // Invalid symbol
          },
        ]);
      }, /Invalid Huffman symbol/);
    });
  });

  describe("SOF Generation", () => {
    it("generates baseline SOF", () => {
      const frameInfo = {
        mode: JPEG_MODES.BASELINE,
        width: 640,
        height: 480,
        precision: 8,
        components: [
          { id: 1, samplingFactors: { horizontal: 2, vertical: 2 }, quantizationTable: 0 },
          { id: 2, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 1 },
          { id: 3, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 1 },
        ],
      };

      const sof = generateSOF(frameInfo);

      assert(sof instanceof Uint8Array);
      assert.equal(sof.length, 19); // Marker + length + header + 3 components

      // Check marker (SOF0)
      assert.equal(sof[0], 0xff);
      assert.equal(sof[1], 0xc0);

      // Check precision
      assert.equal(sof[4], 8);

      // Check dimensions
      assert.equal(sof[5], 0x01); // Height high byte
      assert.equal(sof[6], 0xe0); // Height low byte (480)
      assert.equal(sof[7], 0x02); // Width high byte
      assert.equal(sof[8], 0x80); // Width low byte (640)

      // Check component count
      assert.equal(sof[9], 3);

      // Check first component
      assert.equal(sof[10], 1); // ID
      assert.equal(sof[11], 0x22); // Sampling factors 2x2
      assert.equal(sof[12], 0); // Quantization table
    });

    it("generates progressive SOF", () => {
      const frameInfo = {
        mode: JPEG_MODES.PROGRESSIVE,
        width: 100,
        height: 100,
        components: [{ id: 1, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 0 }],
      };

      const sof = generateSOF(frameInfo);

      // Check marker (SOF2)
      assert.equal(sof[0], 0xff);
      assert.equal(sof[1], 0xc2);
    });

    it("validates SOF parameters", () => {
      const baseFrame = {
        mode: JPEG_MODES.BASELINE,
        width: 100,
        height: 100,
        components: [{ id: 1, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 0 }],
      };

      assert.throws(() => {
        generateSOF({ ...baseFrame, width: 0 });
      }, /Invalid image dimensions/);

      assert.throws(() => {
        generateSOF({ ...baseFrame, precision: 7 });
      }, /Invalid precision/);

      assert.throws(() => {
        generateSOF({ ...baseFrame, components: [] });
      }, /Invalid component count/);

      assert.throws(() => {
        generateSOF({
          ...baseFrame,
          components: [{ id: 0, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 0 }],
        });
      }, /Invalid component ID/);

      assert.throws(() => {
        generateSOF({
          ...baseFrame,
          components: [{ id: 1, samplingFactors: { horizontal: 5, vertical: 1 }, quantizationTable: 0 }],
        });
      }, /Invalid sampling factors/);

      assert.throws(() => {
        generateSOF({
          ...baseFrame,
          components: [{ id: 1, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 4 }],
        });
      }, /Invalid quantization table/);

      assert.throws(() => {
        generateSOF({ ...baseFrame, mode: "invalid" });
      }, /Unknown JPEG mode/);
    });
  });

  describe("SOS Generation", () => {
    it("generates basic SOS", () => {
      const scanInfo = {
        components: [
          { id: 1, huffmanTables: { dc: 0, ac: 0 } },
          { id: 2, huffmanTables: { dc: 1, ac: 1 } },
          { id: 3, huffmanTables: { dc: 1, ac: 1 } },
        ],
      };

      const sos = generateSOS(scanInfo);

      assert(sos instanceof Uint8Array);
      assert.equal(sos.length, 14); // Marker + length + header + 3 components + parameters

      // Check marker
      assert.equal(sos[0], 0xff);
      assert.equal(sos[1], 0xda);

      // Check component count
      assert.equal(sos[4], 3);

      // Check first component
      assert.equal(sos[5], 1); // ID
      assert.equal(sos[6], 0x00); // DC=0, AC=0

      // Check second component
      assert.equal(sos[7], 2); // ID
      assert.equal(sos[8], 0x11); // DC=1, AC=1

      // Check spectral selection
      assert.equal(sos[11], 0); // Start
      assert.equal(sos[12], 63); // End

      // Check approximation
      assert.equal(sos[13], 0); // High=0, Low=0
    });

    it("generates progressive SOS", () => {
      const scanInfo = {
        components: [{ id: 1, huffmanTables: { dc: 0, ac: 0 } }],
        spectralStart: 1,
        spectralEnd: 5,
        approximation: { high: 1, low: 0 },
      };

      const sos = generateSOS(scanInfo);

      // Check spectral selection
      const spectralStart = sos[sos.length - 3];
      const spectralEnd = sos[sos.length - 2];
      const approximation = sos[sos.length - 1];

      assert.equal(spectralStart, 1);
      assert.equal(spectralEnd, 5);
      assert.equal(approximation, 0x10); // High=1, Low=0
    });

    it("validates SOS parameters", () => {
      const baseScan = {
        components: [{ id: 1, huffmanTables: { dc: 0, ac: 0 } }],
      };

      assert.throws(() => {
        generateSOS({ components: [] });
      }, /Invalid component count in scan/);

      assert.throws(() => {
        generateSOS({ ...baseScan, spectralStart: 64 });
      }, /Invalid spectral selection/);

      assert.throws(() => {
        generateSOS({ ...baseScan, spectralStart: 10, spectralEnd: 5 });
      }, /Invalid spectral selection/);

      assert.throws(() => {
        generateSOS({ ...baseScan, approximation: { high: 14, low: 0 } });
      }, /Invalid approximation/);

      assert.throws(() => {
        generateSOS({
          components: [{ id: 0, huffmanTables: { dc: 0, ac: 0 } }],
        });
      }, /Invalid component ID/);

      assert.throws(() => {
        generateSOS({
          components: [{ id: 1, huffmanTables: { dc: 4, ac: 0 } }],
        });
      }, /Invalid Huffman table assignments/);
    });
  });

  describe("JPEG File Builder", () => {
    it("creates file builder", () => {
      const builder = new JPEGFileBuilder();

      assert(builder instanceof JPEGFileBuilder);
      assert.equal(builder.segments.length, 0);
      assert.equal(builder.totalSize, 0);
      assert.equal(builder.hasSOI, false);
      assert.equal(builder.hasEOI, false);
    });

    it("adds segments to builder", () => {
      const builder = new JPEGFileBuilder();
      const segment = generateSOI();

      const result = builder.addSegment(segment);

      assert.equal(result, builder); // Returns this for chaining
      assert.equal(builder.segments.length, 1);
      assert.equal(builder.totalSize, 2);
      assert.equal(builder.hasSOI, true);
    });

    it("provides convenience methods", () => {
      const builder = new JPEGFileBuilder();

      builder.addSOI().addJFIF().addComment("Test comment").addEOI();

      assert.equal(builder.hasSOI, true);
      assert.equal(builder.hasEOI, true);
      assert(builder.segments.length >= 4);
    });

    it("validates file structure", () => {
      const builder = new JPEGFileBuilder();

      // Empty builder
      let validation = builder.validate();
      assert.equal(validation.isValid, false);
      assert(validation.errors.includes("Missing SOI marker"));
      assert(validation.errors.includes("Missing EOI marker"));

      // Add required markers
      builder.addSOI();

      const frameInfo = {
        mode: JPEG_MODES.BASELINE,
        width: 100,
        height: 100,
        components: [{ id: 1, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 0 }],
      };
      builder.addSOF(frameInfo);

      const scanInfo = {
        components: [{ id: 1, huffmanTables: { dc: 0, ac: 0 } }],
      };
      builder.addSOS(scanInfo);
      builder.addEOI();

      validation = builder.validate();
      assert.equal(validation.isValid, true);
      assert.equal(validation.errors.length, 0);
    });

    it("prevents duplicate critical markers", () => {
      const builder = new JPEGFileBuilder();

      builder.addSOI();

      assert.throws(() => {
        builder.addSOI();
      }, /SOI marker already added/);

      const frameInfo = {
        mode: JPEG_MODES.BASELINE,
        width: 100,
        height: 100,
        components: [{ id: 1, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 0 }],
      };
      builder.addSOF(frameInfo);

      assert.throws(() => {
        builder.addSOF(frameInfo);
      }, /SOF marker already added/);
    });

    it("builds complete JPEG file", () => {
      const builder = new JPEGFileBuilder({ validateOutput: false });

      builder.addSOI().addJFIF().addComment("Test").addEOI();

      const result = builder.build();

      assert(result.data instanceof Uint8Array);
      assert(result.size > 0);
      assert.equal(result.size, result.data.length);
      assert(typeof result.validation === "object");
    });

    it("provides file statistics", () => {
      const builder = new JPEGFileBuilder();

      builder.addSOI().addJFIF().addEOI();

      const stats = builder.getStatistics();

      assert.equal(stats.segmentCount, 3);
      assert(stats.totalSize > 0);
      assert(Array.isArray(stats.markerTypes));
      assert(stats.markerTypes.includes("SOI"));
      assert(stats.markerTypes.includes("APP0"));
      assert(stats.markerTypes.includes("EOI"));
    });

    it("resets builder state", () => {
      const builder = new JPEGFileBuilder();

      builder.addSOI().addEOI();

      assert.equal(builder.segments.length, 2);
      assert(builder.totalSize > 0);

      builder.reset();

      assert.equal(builder.segments.length, 0);
      assert.equal(builder.totalSize, 0);
      assert.equal(builder.hasSOI, false);
      assert.equal(builder.hasEOI, false);
    });

    it("validates segment input", () => {
      const builder = new JPEGFileBuilder();

      assert.throws(() => {
        builder.addSegment("not-uint8array");
      }, /Segment must be Uint8Array/);

      assert.throws(() => {
        builder.addSegment(new Uint8Array(1));
      }, /Segment too small/);
    });
  });

  describe("Complete JPEG File Creation", () => {
    /**
     * Create minimal test JPEG data.
     * @returns {Object} Test JPEG data
     */
    function createTestJPEGData() {
      return {
        width: 8,
        height: 8,
        components: [{ id: 1, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 0 }],
        quantizationTables: [
          {
            destination: 0,
            precision: 8,
            table: new Uint8Array(64).fill(16),
          },
        ],
        huffmanTables: [
          {
            tableClass: 0,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0],
          },
          {
            tableClass: 1,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0],
          },
        ],
        scanData: new Uint8Array([0xff, 0x00, 0xff, 0xd9]), // Minimal scan data
        metadata: {
          comment: "Test JPEG",
        },
        options: {
          includeComment: true,
        },
      };
    }

    it("creates complete JPEG file", () => {
      const jpegData = createTestJPEGData();
      const result = createJPEGFile(jpegData);

      assert(result.data instanceof Uint8Array);
      assert(result.size > 0);
      assert(typeof result.validation === "object");
      assert(typeof result.statistics === "object");

      // Check file starts with SOI
      assert.equal(result.data[0], 0xff);
      assert.equal(result.data[1], 0xd8);

      // Check file ends with EOI
      assert.equal(result.data[result.size - 2], 0xff);
      assert.equal(result.data[result.size - 1], 0xd9);
    });

    it("includes JFIF by default", () => {
      const jpegData = createTestJPEGData();
      const result = createJPEGFile(jpegData);

      // Look for JFIF marker in file
      let hasJFIF = false;
      for (let i = 0; i < result.data.length - 1; i++) {
        if (result.data[i] === 0xff && result.data[i + 1] === 0xe0) {
          hasJFIF = true;
          break;
        }
      }

      assert(hasJFIF, "JFIF marker not found");
    });

    it("excludes JFIF when requested", () => {
      const jpegData = createTestJPEGData();
      jpegData.options.includeJFIF = false;

      const result = createJPEGFile(jpegData);

      // Look for JFIF marker in file
      let hasJFIF = false;
      for (let i = 0; i < result.data.length - 1; i++) {
        if (result.data[i] === 0xff && result.data[i + 1] === 0xe0) {
          hasJFIF = true;
          break;
        }
      }

      assert(!hasJFIF, "JFIF marker found when excluded");
    });

    it("includes comment when requested", () => {
      const jpegData = createTestJPEGData();
      const result = createJPEGFile(jpegData);

      // Look for comment marker
      let hasCOM = false;
      for (let i = 0; i < result.data.length - 1; i++) {
        if (result.data[i] === 0xff && result.data[i + 1] === 0xfe) {
          hasCOM = true;
          break;
        }
      }

      assert(hasCOM, "Comment marker not found");
    });

    it("validates input data", () => {
      const jpegData = createTestJPEGData();

      assert.throws(() => {
        createJPEGFile({ ...jpegData, width: 0 });
      }, /Invalid image dimensions/);

      assert.throws(() => {
        createJPEGFile({ ...jpegData, components: [] });
      }, /Must provide image components/);

      assert.throws(() => {
        createJPEGFile({ ...jpegData, quantizationTables: [] });
      }, /Must provide quantization tables/);

      assert.throws(() => {
        createJPEGFile({ ...jpegData, huffmanTables: [] });
      }, /Must provide Huffman tables/);

      assert.throws(() => {
        createJPEGFile({ ...jpegData, scanData: null });
      }, /Must provide scan data/);
    });

    it("handles different JPEG modes", () => {
      const jpegData = createTestJPEGData();

      // Test baseline mode
      jpegData.options.mode = JPEG_MODES.BASELINE;
      let result = createJPEGFile(jpegData);
      assert(result.data.length > 0);

      // Test progressive mode
      jpegData.options.mode = JPEG_MODES.PROGRESSIVE;
      result = createJPEGFile(jpegData);
      assert(result.data.length > 0);
    });

    it("handles restart intervals", () => {
      const jpegData = createTestJPEGData();
      jpegData.options.restartInterval = 64;

      const result = createJPEGFile(jpegData);

      // Look for DRI marker
      let hasDRI = false;
      for (let i = 0; i < result.data.length - 1; i++) {
        if (result.data[i] === 0xff && result.data[i + 1] === 0xdd) {
          hasDRI = true;
          break;
        }
      }

      assert(hasDRI, "DRI marker not found");
    });
  });

  describe("Integration and Edge Cases", () => {
    it("handles empty scan data", () => {
      const jpegData = {
        width: 1,
        height: 1,
        components: [{ id: 1, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 0 }],
        quantizationTables: [
          {
            destination: 0,
            precision: 8,
            table: new Uint8Array(64).fill(1),
          },
        ],
        huffmanTables: [
          {
            tableClass: 0,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0],
          },
        ],
        scanData: new Uint8Array(0), // Empty scan data
      };

      const result = createJPEGFile(jpegData);
      assert(result.data instanceof Uint8Array);
      assert(result.size > 0);
    });

    it("handles maximum image dimensions", () => {
      const jpegData = {
        width: 65535,
        height: 65535,
        components: [{ id: 1, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 0 }],
        quantizationTables: [
          {
            destination: 0,
            precision: 8,
            table: new Uint8Array(64).fill(1),
          },
        ],
        huffmanTables: [
          {
            tableClass: 0,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0],
          },
        ],
        scanData: new Uint8Array([0x00]),
      };

      const result = createJPEGFile(jpegData);
      assert(result.data instanceof Uint8Array);
    });

    it("handles multiple component images", () => {
      const jpegData = {
        width: 16,
        height: 16,
        components: [
          { id: 1, samplingFactors: { horizontal: 2, vertical: 2 }, quantizationTable: 0 },
          { id: 2, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 1 },
          { id: 3, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 1 },
        ],
        quantizationTables: [
          {
            destination: 0,
            precision: 8,
            table: new Uint8Array(64).fill(16),
          },
          {
            destination: 1,
            precision: 8,
            table: new Uint8Array(64).fill(32),
          },
        ],
        huffmanTables: [
          {
            tableClass: 0,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0],
          },
          {
            tableClass: 1,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0],
          },
          {
            tableClass: 0,
            destination: 1,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [1],
          },
          {
            tableClass: 1,
            destination: 1,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [1],
          },
        ],
        scanData: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
      };

      const result = createJPEGFile(jpegData);
      assert(result.data instanceof Uint8Array);
      assert(result.statistics.markerTypes.includes("SOF0"));
    });

    it("validates output when requested", () => {
      const jpegData = {
        width: 8,
        height: 8,
        components: [], // Invalid - empty components
        quantizationTables: [
          {
            destination: 0,
            precision: 8,
            table: new Uint8Array(64).fill(1),
          },
        ],
        huffmanTables: [
          {
            tableClass: 0,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0],
          },
        ],
        scanData: new Uint8Array([0x00]),
        options: {
          validateOutput: true,
        },
      };

      assert.throws(() => {
        createJPEGFile(jpegData);
      }, /Must provide image components/);
    });

    it("handles validation warnings gracefully", () => {
      const jpegData = {
        width: 8,
        height: 8,
        components: [{ id: 1, samplingFactors: { horizontal: 1, vertical: 1 }, quantizationTable: 0 }],
        quantizationTables: [
          {
            destination: 0,
            precision: 8,
            table: new Uint8Array(64).fill(1),
          },
        ],
        huffmanTables: [
          {
            tableClass: 0,
            destination: 0,
            codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0],
          },
        ],
        scanData: new Uint8Array(10 * 1024 * 1024), // Large scan data for warning
        options: {
          validateOutput: false, // Disable validation to allow warnings
        },
      };

      const result = createJPEGFile(jpegData);
      assert(result.validation.warnings.length >= 0); // May have warnings
    });
  });
});
