/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for JPEG header creation.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  createAPP0,
  createDHT,
  createDQT,
  createEOI,
  createJPEGHeaders,
  createSOF0,
  createSOI,
  createSOS,
  createStandardJPEGStructure,
} from "./header-creation.js";
import { JPEG_MARKERS } from "./header-parsing.js";
import { createStandardHuffmanTable } from "./huffman-decode.js";

describe("JPEG Header Creation", () => {
  describe("createSOI", () => {
    it("creates correct SOI marker", () => {
      const soi = createSOI();

      assert.equal(soi.length, 2);
      assert.equal(soi[0], 0xff);
      assert.equal(soi[1], 0xd8);
    });
  });

  describe("createEOI", () => {
    it("creates correct EOI marker", () => {
      const eoi = createEOI();

      assert.equal(eoi.length, 2);
      assert.equal(eoi[0], 0xff);
      assert.equal(eoi[1], 0xd9);
    });
  });

  describe("createAPP0", () => {
    it("creates default JFIF APP0 marker", () => {
      const app0 = createAPP0();

      assert.equal(app0.length, 18); // 2 + 16
      assert.equal(app0[0], 0xff);
      assert.equal(app0[1], 0xe0); // APP0 marker
      assert.equal(app0[2], 0x00);
      assert.equal(app0[3], 0x10); // Length = 16

      // Check JFIF identifier
      const jfifId = new TextDecoder().decode(app0.slice(4, 9));
      assert.equal(jfifId, "JFIF\0");

      // Check version
      assert.equal(app0[9], 1); // Major version
      assert.equal(app0[10], 1); // Minor version

      // Check units
      assert.equal(app0[11], 0); // No units

      // Check density
      assert.equal(app0[12], 0x00);
      assert.equal(app0[13], 0x01); // X density = 1
      assert.equal(app0[14], 0x00);
      assert.equal(app0[15], 0x01); // Y density = 1

      // Check thumbnail dimensions
      assert.equal(app0[16], 0); // Thumbnail width
      assert.equal(app0[17], 0); // Thumbnail height
    });

    it("creates custom JFIF APP0 marker", () => {
      const options = {
        majorVersion: 1,
        minorVersion: 2,
        units: 1,
        xDensity: 300,
        yDensity: 300,
        thumbnailWidth: 0,
        thumbnailHeight: 0,
      };

      const app0 = createAPP0(options);

      assert.equal(app0[9], 1); // Major version
      assert.equal(app0[10], 2); // Minor version
      assert.equal(app0[11], 1); // Units = dots/inch
      assert.equal(app0[12], 0x01);
      assert.equal(app0[13], 0x2c); // X density = 300
      assert.equal(app0[14], 0x01);
      assert.equal(app0[15], 0x2c); // Y density = 300
    });

    it("validates parameters", () => {
      assert.throws(() => createAPP0({ majorVersion: 0 }), /Invalid major version/);
      assert.throws(() => createAPP0({ majorVersion: 256 }), /Invalid major version/);
      assert.throws(() => createAPP0({ minorVersion: -1 }), /Invalid minor version/);
      assert.throws(() => createAPP0({ minorVersion: 256 }), /Invalid minor version/);
      assert.throws(() => createAPP0({ units: -1 }), /Invalid units/);
      assert.throws(() => createAPP0({ units: 3 }), /Invalid units/);
      assert.throws(() => createAPP0({ xDensity: 0 }), /Invalid X density/);
      assert.throws(() => createAPP0({ xDensity: 65536 }), /Invalid X density/);
      assert.throws(() => createAPP0({ yDensity: 0 }), /Invalid Y density/);
      assert.throws(() => createAPP0({ yDensity: 65536 }), /Invalid Y density/);
      assert.throws(() => createAPP0({ thumbnailWidth: -1 }), /Invalid thumbnail width/);
      assert.throws(() => createAPP0({ thumbnailWidth: 256 }), /Invalid thumbnail width/);
      assert.throws(() => createAPP0({ thumbnailHeight: -1 }), /Invalid thumbnail height/);
      assert.throws(() => createAPP0({ thumbnailHeight: 256 }), /Invalid thumbnail height/);
    });
  });

  describe("createDQT", () => {
    it("creates single quantization table", () => {
      const tables = [
        {
          id: 0,
          precision: 0,
          values: Array.from({ length: 64 }, (_, i) => i + 1),
        },
      ];

      const dqt = createDQT(tables);

      assert.equal(dqt[0], 0xff);
      assert.equal(dqt[1], 0xdb); // DQT marker
      assert.equal(dqt[2], 0x00);
      assert.equal(dqt[3], 0x43); // Length = 67 (2 + 1 + 64)

      assert.equal(dqt[4], 0x00); // Precision=0, ID=0

      // Check first few quantization values
      assert.equal(dqt[5], 1);
      assert.equal(dqt[6], 2);
      assert.equal(dqt[7], 3);
    });

    it("creates multiple quantization tables", () => {
      const tables = [
        {
          id: 0,
          precision: 0,
          values: Array.from({ length: 64 }, () => 16),
        },
        {
          id: 1,
          precision: 0,
          values: Array.from({ length: 64 }, () => 32),
        },
      ];

      const dqt = createDQT(tables);

      assert.equal(dqt[0], 0xff);
      assert.equal(dqt[1], 0xdb); // DQT marker

      const length = (dqt[2] << 8) | dqt[3];
      assert.equal(length, 2 + 2 * (1 + 64)); // 2 + 2 * 65 = 132

      // Check first table
      assert.equal(dqt[4], 0x00); // Precision=0, ID=0
      assert.equal(dqt[5], 16); // First value

      // Check second table
      const secondTableOffset = 4 + 1 + 64;
      assert.equal(dqt[secondTableOffset], 0x01); // Precision=0, ID=1
      assert.equal(dqt[secondTableOffset + 1], 32); // First value
    });

    it("handles 16-bit precision", () => {
      const tables = [
        {
          id: 0,
          precision: 1,
          values: Array.from({ length: 64 }, (_, i) => 256 + i),
        },
      ];

      const dqt = createDQT(tables);

      assert.equal(dqt[4], 0x10); // Precision=1, ID=0

      // Check 16-bit values
      assert.equal(dqt[5], 0x01); // High byte of 256
      assert.equal(dqt[6], 0x00); // Low byte of 256
      assert.equal(dqt[7], 0x01); // High byte of 257
      assert.equal(dqt[8], 0x01); // Low byte of 257
    });

    it("validates quantization tables", () => {
      assert.throws(() => createDQT([]), /non-empty array/);
      assert.throws(() => createDQT("not array"), /non-empty array/);

      const invalidTable = {
        id: 4, // Invalid ID
        precision: 0,
        values: Array.from({ length: 64 }, () => 1),
      };
      assert.throws(() => createDQT([invalidTable]), /Invalid quantization table ID/);
    });
  });

  describe("createDHT", () => {
    it("creates single Huffman table", () => {
      const tables = [
        {
          class: 0,
          id: 0,
          codeLengths: [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          symbols: [0, 1],
        },
      ];

      const dht = createDHT(tables);

      assert.equal(dht[0], 0xff);
      assert.equal(dht[1], 0xc4); // DHT marker
      assert.equal(dht[2], 0x00);
      assert.equal(dht[3], 0x15); // Length = 21 (2 + 1 + 16 + 2)

      assert.equal(dht[4], 0x00); // Class=0, ID=0

      // Check code lengths
      assert.equal(dht[5], 0); // Length 1: 0 codes
      assert.equal(dht[6], 1); // Length 2: 1 code
      assert.equal(dht[7], 1); // Length 3: 1 code

      // Check symbols (after marker + length + class/id + 16 code lengths)
      const symbolOffset = 4 + 1 + 16; // 21
      assert.equal(dht[symbolOffset], 0); // First symbol
      assert.equal(dht[symbolOffset + 1], 1); // Second symbol
    });

    it("creates multiple Huffman tables", () => {
      const dcTable = createStandardHuffmanTable("dc-luminance");
      const acTable = createStandardHuffmanTable("ac-luminance");

      const tables = [
        {
          class: 0,
          id: 0,
          ...dcTable,
        },
        {
          class: 1,
          id: 0,
          ...acTable,
        },
      ];

      const dht = createDHT(tables);

      assert.equal(dht[0], 0xff);
      assert.equal(dht[1], 0xc4); // DHT marker

      // Should contain both tables
      assert(dht.length > 50); // Should be reasonably large with both tables
    });

    it("validates Huffman tables", () => {
      assert.throws(() => createDHT([]), /non-empty array/);
      assert.throws(() => createDHT("not array"), /non-empty array/);

      const invalidTable = {
        class: 2, // Invalid class
        id: 0,
        codeLengths: Array(16).fill(0),
        symbols: [],
      };
      assert.throws(() => createDHT([invalidTable]), /Invalid Huffman table class/);
    });
  });

  describe("createSOF0", () => {
    it("creates grayscale SOF0 marker", () => {
      const frameInfo = {
        width: 640,
        height: 480,
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

      const sof0 = createSOF0(frameInfo);

      assert.equal(sof0[0], 0xff);
      assert.equal(sof0[1], 0xc0); // SOF0 marker
      assert.equal(sof0[2], 0x00);
      assert.equal(sof0[3], 0x0b); // Length = 11 (8 + 1 * 3)

      assert.equal(sof0[4], 8); // Precision

      // Height
      assert.equal(sof0[5], 0x01);
      assert.equal(sof0[6], 0xe0); // 480

      // Width
      assert.equal(sof0[7], 0x02);
      assert.equal(sof0[8], 0x80); // 640

      assert.equal(sof0[9], 1); // Number of components

      // Component 1
      assert.equal(sof0[10], 1); // ID
      assert.equal(sof0[11], 0x11); // Sampling factors
      assert.equal(sof0[12], 0); // Quantization table
    });

    it("creates color SOF0 marker", () => {
      const frameInfo = {
        width: 320,
        height: 240,
        precision: 8,
        components: [
          {
            id: 1,
            horizontalSampling: 2,
            verticalSampling: 2,
            quantizationTable: 0,
          },
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
          },
        ],
      };

      const sof0 = createSOF0(frameInfo);

      assert.equal(sof0[9], 3); // Number of components

      // Component 1 (Y)
      assert.equal(sof0[10], 1); // ID
      assert.equal(sof0[11], 0x22); // Sampling factors 2x2
      assert.equal(sof0[12], 0); // Quantization table

      // Component 2 (Cb)
      assert.equal(sof0[13], 2); // ID
      assert.equal(sof0[14], 0x11); // Sampling factors 1x1
      assert.equal(sof0[15], 1); // Quantization table

      // Component 3 (Cr)
      assert.equal(sof0[16], 3); // ID
      assert.equal(sof0[17], 0x11); // Sampling factors 1x1
      assert.equal(sof0[18], 1); // Quantization table
    });

    it("validates frame info", () => {
      assert.throws(() => createSOF0(null), /Frame info must be an object/);

      const invalidFrame = {
        width: 0, // Invalid
        height: 480,
        components: [{ id: 1, horizontalSampling: 1, verticalSampling: 1, quantizationTable: 0 }],
      };
      assert.throws(() => createSOF0(invalidFrame), /Invalid frame width/);
    });
  });

  describe("createSOS", () => {
    it("creates grayscale SOS marker", () => {
      const scanInfo = {
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

      const sos = createSOS(scanInfo);

      assert.equal(sos[0], 0xff);
      assert.equal(sos[1], 0xda); // SOS marker
      assert.equal(sos[2], 0x00);
      assert.equal(sos[3], 0x08); // Length = 8 (6 + 1 * 2)

      assert.equal(sos[4], 1); // Number of components

      // Component 1
      assert.equal(sos[5], 1); // ID
      assert.equal(sos[6], 0x00); // DC=0, AC=0

      // Spectral selection
      assert.equal(sos[7], 0); // Start
      assert.equal(sos[8], 63); // End

      // Successive approximation
      assert.equal(sos[9], 0x00); // High=0, Low=0
    });

    it("creates color SOS marker", () => {
      const scanInfo = {
        components: [
          {
            id: 1,
            dcTable: 0,
            acTable: 0,
          },
          {
            id: 2,
            dcTable: 1,
            acTable: 1,
          },
          {
            id: 3,
            dcTable: 1,
            acTable: 1,
          },
        ],
      };

      const sos = createSOS(scanInfo);

      assert.equal(sos[4], 3); // Number of components

      // Component 1 (Y)
      assert.equal(sos[5], 1); // ID
      assert.equal(sos[6], 0x00); // DC=0, AC=0

      // Component 2 (Cb)
      assert.equal(sos[7], 2); // ID
      assert.equal(sos[8], 0x11); // DC=1, AC=1

      // Component 3 (Cr)
      assert.equal(sos[9], 3); // ID
      assert.equal(sos[10], 0x11); // DC=1, AC=1
    });

    it("validates scan info", () => {
      assert.throws(() => createSOS(null), /Scan info must be an object/);

      const invalidScan = {
        components: [], // Empty
      };
      assert.throws(() => createSOS(invalidScan), /non-empty array/);
    });
  });

  describe("createJPEGHeaders", () => {
    it("creates complete JPEG headers", () => {
      const jpegInfo = {
        frame: {
          width: 8,
          height: 8,
          precision: 8,
          components: [
            {
              id: 1,
              horizontalSampling: 1,
              verticalSampling: 1,
              quantizationTable: 0,
            },
          ],
        },
        scan: {
          components: [
            {
              id: 1,
              dcTable: 0,
              acTable: 0,
            },
          ],
        },
        quantizationTables: [
          {
            id: 0,
            precision: 0,
            values: Array.from({ length: 64 }, () => 16),
          },
        ],
        huffmanTables: [
          {
            class: 0,
            id: 0,
            codeLengths: [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0, 1],
          },
          {
            class: 1,
            id: 0,
            codeLengths: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            symbols: [0, 1],
          },
        ],
        app0: {
          majorVersion: 1,
          minorVersion: 1,
        },
      };

      const headers = createJPEGHeaders(jpegInfo);

      // Should start with SOI
      assert.equal(headers[0], 0xff);
      assert.equal(headers[1], 0xd8);

      // Should contain APP0
      assert(headers.includes(0xe0));

      // Should contain DQT
      assert(headers.includes(0xdb));

      // Should contain SOF0
      assert(headers.includes(0xc0));

      // Should contain DHT
      assert(headers.includes(0xc4));

      // Should contain SOS
      assert(headers.includes(0xda));

      // Should be reasonably sized
      assert(headers.length > 50);
    });

    it("validates JPEG info", () => {
      assert.throws(() => createJPEGHeaders(null), /JPEG info must be an object/);
      assert.throws(() => createJPEGHeaders({}), /must include frame information/);
    });
  });

  describe("createStandardJPEGStructure", () => {
    it("creates grayscale JPEG structure", () => {
      const structure = createStandardJPEGStructure({
        width: 640,
        height: 480,
        quality: 85,
        colorSpace: "grayscale",
      });

      assert.equal(structure.frame.width, 640);
      assert.equal(structure.frame.height, 480);
      assert.equal(structure.frame.components.length, 1);

      assert.equal(structure.scan.components.length, 1);

      assert.equal(structure.quantizationTables.length, 1);
      assert.equal(structure.quantizationTables[0].id, 0);

      assert.equal(structure.huffmanTables.length, 2); // DC and AC for luminance
    });

    it("creates color JPEG structure", () => {
      const structure = createStandardJPEGStructure({
        width: 320,
        height: 240,
        quality: 75,
        colorSpace: "ycbcr",
      });

      assert.equal(structure.frame.components.length, 3);
      assert.equal(structure.scan.components.length, 3);
      assert.equal(structure.quantizationTables.length, 2); // Luminance and chrominance
      assert.equal(structure.huffmanTables.length, 4); // DC/AC for both luminance and chrominance
    });

    it("validates parameters", () => {
      assert.throws(() => createStandardJPEGStructure({ width: 0, height: 100 }), /Invalid width/);
      assert.throws(() => createStandardJPEGStructure({ width: 100, height: 0 }), /Invalid height/);
      assert.throws(() => createStandardJPEGStructure({ width: 100, height: 100, quality: 0 }), /Invalid quality/);
      assert.throws(
        () => createStandardJPEGStructure({ width: 100, height: 100, colorSpace: "rgb" }),
        /Invalid color space/
      );
    });

    it("creates different quality structures", () => {
      const lowQuality = createStandardJPEGStructure({
        width: 100,
        height: 100,
        quality: 10,
        colorSpace: "grayscale",
      });

      const highQuality = createStandardJPEGStructure({
        width: 100,
        height: 100,
        quality: 95,
        colorSpace: "grayscale",
      });

      // Low quality should have larger quantization values
      const lowQTable = lowQuality.quantizationTables[0].values;
      const highQTable = highQuality.quantizationTables[0].values;

      // At least some values should be different
      let hasDifference = false;
      for (let i = 0; i < 64; i++) {
        if (lowQTable[i] !== highQTable[i]) {
          hasDifference = true;
          break;
        }
      }
      assert(hasDifference, "Quality should affect quantization tables");
    });
  });

  describe("Integration Tests", () => {
    it("creates headers that can be parsed", () => {
      const structure = createStandardJPEGStructure({
        width: 64,
        height: 64,
        quality: 85,
        colorSpace: "grayscale",
      });

      const headers = createJPEGHeaders(structure);

      // Headers should be valid JPEG format
      assert.equal(headers[0], 0xff);
      assert.equal(headers[1], 0xd8); // SOI

      // Should contain all required markers
      const markers = [];
      for (let i = 0; i < headers.length - 1; i++) {
        if (headers[i] === 0xff && headers[i + 1] !== 0x00) {
          markers.push((headers[i] << 8) | headers[i + 1]);
        }
      }

      assert(markers.includes(JPEG_MARKERS.SOI));
      assert(markers.includes(JPEG_MARKERS.APP0));
      assert(markers.includes(JPEG_MARKERS.DQT));
      assert(markers.includes(JPEG_MARKERS.SOF0));
      assert(markers.includes(JPEG_MARKERS.DHT));
      assert(markers.includes(JPEG_MARKERS.SOS));
    });

    it("creates consistent structures for same parameters", () => {
      const structure1 = createStandardJPEGStructure({
        width: 100,
        height: 100,
        quality: 85,
        colorSpace: "ycbcr",
      });

      const structure2 = createStandardJPEGStructure({
        width: 100,
        height: 100,
        quality: 85,
        colorSpace: "ycbcr",
      });

      // Should have same structure
      assert.equal(structure1.frame.components.length, structure2.frame.components.length);
      assert.equal(structure1.quantizationTables.length, structure2.quantizationTables.length);
      assert.equal(structure1.huffmanTables.length, structure2.huffmanTables.length);

      // Quantization tables should be identical
      for (let i = 0; i < structure1.quantizationTables.length; i++) {
        const table1 = structure1.quantizationTables[i];
        const table2 = structure2.quantizationTables[i];
        assert.deepEqual(table1.values, table2.values);
      }
    });
  });

  describe("Error Handling", () => {
    it("handles invalid quantization table values", () => {
      const invalidTable = {
        id: 0,
        precision: 0,
        values: Array.from({ length: 64 }, () => 0), // Invalid: values must be >= 1
      };

      assert.throws(() => createDQT([invalidTable]), /Invalid quantization value/);
    });

    it("handles invalid Huffman table symbols", () => {
      const invalidTable = {
        class: 0,
        id: 0,
        codeLengths: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        symbols: [0, 1], // Mismatch: should have 1 symbol, not 2
      };

      assert.throws(() => createDHT([invalidTable]), /Symbol count mismatch/);
    });

    it("handles frame component validation", () => {
      const invalidFrame = {
        width: 100,
        height: 100,
        components: [
          {
            id: 1,
            horizontalSampling: 5, // Invalid: must be 1-4
            verticalSampling: 1,
            quantizationTable: 0,
          },
        ],
      };

      assert.throws(() => createSOF0(invalidFrame), /Invalid component.*horizontal sampling/);
    });

    it("handles scan component validation", () => {
      const invalidScan = {
        components: [
          {
            id: 1,
            dcTable: 4, // Invalid: must be 0-3
            acTable: 0,
          },
        ],
      };

      assert.throws(() => createSOS(invalidScan), /Invalid scan component.*DC table/);
    });
  });

  describe("Performance", () => {
    it("creates headers efficiently", () => {
      const structure = createStandardJPEGStructure({
        width: 1920,
        height: 1080,
        quality: 85,
        colorSpace: "ycbcr",
      });

      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        createJPEGHeaders(structure);
      }

      const endTime = Date.now();

      assert(endTime - startTime < 100, `Header creation took ${endTime - startTime}ms`);
    });

    it("creates standard structures efficiently", () => {
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        createStandardJPEGStructure({
          width: 640,
          height: 480,
          quality: 85,
          colorSpace: "ycbcr",
        });
      }

      const endTime = Date.now();

      assert(endTime - startTime < 200, `Standard structure creation took ${endTime - startTime}ms`);
    });
  });
});
