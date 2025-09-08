/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  CHROMA_SUBSAMPLING,
  decodeSOF,
  getComponentBlocksPerMCU,
  getComponentById,
  getSOFSummary,
  getSOFType,
  isSOFMarker,
} from "./decode-sof.js";

describe("JPEG SOF Decoder", () => {
  describe("SOF Type Detection", () => {
    it("identifies all SOF marker types", () => {
      assert.equal(getSOFType(0xc0).name, "Baseline DCT");
      assert.equal(getSOFType(0xc1).name, "Extended Sequential DCT");
      assert.equal(getSOFType(0xc2).name, "Progressive DCT");
      assert.equal(getSOFType(0xc3).name, "Lossless Sequential");
      assert.equal(getSOFType(0xcf).name, "Differential Lossless Sequential (Arithmetic)");
    });

    it("returns null for non-SOF markers", () => {
      assert.equal(getSOFType(0xc4), null); // DHT
      assert.equal(getSOFType(0xda), null); // SOS
      assert.equal(getSOFType(0xe0), null); // APP0
    });

    it("detects SOF markers correctly", () => {
      assert.equal(isSOFMarker(0xc0), true);
      assert.equal(isSOFMarker(0xc2), true);
      assert.equal(isSOFMarker(0xcf), true);
      assert.equal(isSOFMarker(0xc4), false);
      assert.equal(isSOFMarker(0xda), false);
    });

    it("provides correct SOF type characteristics", () => {
      const sof0 = getSOFType(0xc0);
      assert.equal(sof0.progressive, false);
      assert.equal(sof0.lossless, false);
      assert.equal(sof0.coding, "huffman");
      assert.deepEqual(sof0.precision, [8]);

      const sof2 = getSOFType(0xc2);
      assert.equal(sof2.progressive, true);
      assert.equal(sof2.lossless, false);
      assert.deepEqual(sof2.precision, [8, 12]);

      const sof11 = getSOFType(0xcb);
      assert.equal(sof11.lossless, true);
      assert.equal(sof11.coding, "arithmetic");
    });
  });

  describe("Chroma Subsampling Patterns", () => {
    it("defines standard subsampling patterns", () => {
      assert.equal(CHROMA_SUBSAMPLING["1,1,1,1,1,1"], "4:4:4");
      assert.equal(CHROMA_SUBSAMPLING["2,1,1,1,1,1"], "4:2:2");
      assert.equal(CHROMA_SUBSAMPLING["2,2,1,1,1,1"], "4:2:0");
      assert.equal(CHROMA_SUBSAMPLING["4,1,1,1,1,1"], "4:1:1");
    });
  });

  describe("Basic SOF Decoding", () => {
    it("decodes minimal grayscale SOF0", () => {
      // SOF0: 8-bit, 16x16, 1 component (Y=1, sampling=1x1, qtable=0)
      const data = new Uint8Array([
        0x08, // Precision: 8 bits
        0x00,
        0x10, // Height: 16
        0x00,
        0x10, // Width: 16
        0x01, // Component count: 1
        0x01,
        0x11,
        0x00, // Component 1: ID=1, sampling=1x1, qtable=0
      ]);

      const sof = decodeSOF(data, 0xc0);

      assert.equal(sof.precision, 8);
      assert.equal(sof.width, 16);
      assert.equal(sof.height, 16);
      assert.equal(sof.componentCount, 1);
      assert.equal(sof.components.length, 1);
      assert.equal(sof.components[0].id, 1);
      assert.equal(sof.components[0].horizontalSampling, 1);
      assert.equal(sof.components[0].verticalSampling, 1);
      assert.equal(sof.components[0].quantizationTable, 0);
      assert.equal(sof.sofType.name, "Baseline DCT");
    });

    it("decodes YCbCr SOF0 with 4:2:0 subsampling", () => {
      // SOF0: 8-bit, 32x24, 3 components (Y=2x2, Cb=1x1, Cr=1x1)
      const data = new Uint8Array([
        0x08, // Precision: 8 bits
        0x00,
        0x18, // Height: 24
        0x00,
        0x20, // Width: 32
        0x03, // Component count: 3
        0x01,
        0x22,
        0x00, // Y: ID=1, sampling=2x2, qtable=0
        0x02,
        0x11,
        0x01, // Cb: ID=2, sampling=1x1, qtable=1
        0x03,
        0x11,
        0x01, // Cr: ID=3, sampling=1x1, qtable=1
      ]);

      const sof = decodeSOF(data, 0xc0);

      assert.equal(sof.componentCount, 3);
      assert.equal(sof.chromaSubsampling, "4:2:0");
      assert.equal(sof.maxSampling.maxHorizontal, 2);
      assert.equal(sof.maxSampling.maxVertical, 2);
      assert.equal(sof.mcuDimensions.width, 16); // 2 * 8
      assert.equal(sof.mcuDimensions.height, 16); // 2 * 8
      assert.equal(sof.mcuCounts.horizontal, 2); // ceil(32/16)
      assert.equal(sof.mcuCounts.vertical, 2); // ceil(24/16)
      assert.equal(sof.mcuCounts.total, 4);
    });

    it("decodes progressive SOF2", () => {
      // SOF2: 8-bit, 64x64, 3 components
      const data = new Uint8Array([
        0x08, // Precision: 8 bits
        0x00,
        0x40, // Height: 64
        0x00,
        0x40, // Width: 64
        0x03, // Component count: 3
        0x01,
        0x11,
        0x00, // Y: ID=1, sampling=1x1, qtable=0
        0x02,
        0x11,
        0x01, // Cb: ID=2, sampling=1x1, qtable=1
        0x03,
        0x11,
        0x01, // Cr: ID=3, sampling=1x1, qtable=1
      ]);

      const sof = decodeSOF(data, 0xc2);

      assert.equal(sof.sofType.progressive, true);
      assert.equal(sof.chromaSubsampling, "4:4:4");
    });

    it("decodes 12-bit extended SOF1", () => {
      // SOF1: 12-bit, 100x100, 1 component
      const data = new Uint8Array([
        0x0c, // Precision: 12 bits
        0x00,
        0x64, // Height: 100
        0x00,
        0x64, // Width: 100
        0x01, // Component count: 1
        0x01,
        0x11,
        0x00, // Component 1: ID=1, sampling=1x1, qtable=0
      ]);

      const sof = decodeSOF(data, 0xc1);

      assert.equal(sof.precision, 12);
      assert.equal(sof.sofType.name, "Extended Sequential DCT");
    });
  });

  describe("Error Handling", () => {
    it("throws on invalid buffer type", () => {
      assert.throws(() => {
        decodeSOF(null, 0xc0);
      }, TypeError);

      assert.throws(() => {
        decodeSOF("not a buffer", 0xc0);
      }, TypeError);
    });

    it("throws on invalid marker code type", () => {
      const data = new Uint8Array([0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x01, 0x11, 0x00]);

      assert.throws(() => {
        decodeSOF(data, "not a number");
      }, TypeError);
    });

    it("throws on non-SOF marker code", () => {
      const data = new Uint8Array([0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x01, 0x11, 0x00]);

      assert.throws(() => {
        decodeSOF(data, 0xc4); // DHT marker
      }, /Invalid SOF marker code/);
    });

    it("throws on buffer too short", () => {
      const data = new Uint8Array([0x08, 0x00, 0x10]); // Only 3 bytes

      assert.throws(() => {
        decodeSOF(data, 0xc0);
      }, /SOF data too short/);
    });

    it("throws on invalid precision for SOF type", () => {
      // SOF0 with 12-bit precision (not allowed)
      const data = new Uint8Array([
        0x0c, // Invalid precision for SOF0
        0x00,
        0x10,
        0x00,
        0x10,
        0x01,
        0x01,
        0x11,
        0x00,
      ]);

      assert.throws(() => {
        decodeSOF(data, 0xc0);
      }, /Invalid precision 12 for Baseline DCT/);
    });

    it("throws on zero dimensions", () => {
      // Zero width
      const data1 = new Uint8Array([0x08, 0x00, 0x10, 0x00, 0x00, 0x01, 0x01, 0x11, 0x00]);

      assert.throws(() => {
        decodeSOF(data1, 0xc0);
      }, /Invalid width: 0/);

      // Zero height
      const data2 = new Uint8Array([0x08, 0x00, 0x00, 0x00, 0x10, 0x01, 0x01, 0x11, 0x00]);

      assert.throws(() => {
        decodeSOF(data2, 0xc0);
      }, /Invalid height: 0/);
    });

    it("throws on invalid component count", () => {
      // Zero components
      const data1 = new Uint8Array([0x08, 0x00, 0x10, 0x00, 0x10, 0x00]);

      assert.throws(() => {
        decodeSOF(data1, 0xc0);
      }, /Invalid component count: 0/);
    });

    it("throws on data length mismatch", () => {
      // Claims 1 component but provides data for 2
      const data = new Uint8Array([
        0x08,
        0x00,
        0x10,
        0x00,
        0x10,
        0x01, // Header claims 1 component
        0x01,
        0x11,
        0x00, // Component 1
        0x02,
        0x11,
        0x01, // Extra component data
      ]);

      assert.throws(() => {
        decodeSOF(data, 0xc0);
      }, /SOF data length mismatch/);
    });

    it("throws on invalid component parameters", () => {
      // Invalid component ID (0)
      const data1 = new Uint8Array([0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x00, 0x11, 0x00]);

      assert.throws(() => {
        decodeSOF(data1, 0xc0);
      }, /Component 0: invalid ID 0/);

      // Invalid horizontal sampling (0)
      const data2 = new Uint8Array([0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x01, 0x01, 0x00]);

      assert.throws(() => {
        decodeSOF(data2, 0xc0);
      }, /Component 0: invalid horizontal sampling 0/);

      // Invalid vertical sampling (5)
      const data3 = new Uint8Array([0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x01, 0x15, 0x00]);

      assert.throws(() => {
        decodeSOF(data3, 0xc0);
      }, /Component 0: invalid vertical sampling 5/);

      // Invalid quantization table (4)
      const data4 = new Uint8Array([0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x01, 0x11, 0x04]);

      assert.throws(() => {
        decodeSOF(data4, 0xc0);
      }, /Component 0: invalid quantization table 4/);
    });

    it("throws on duplicate component IDs", () => {
      const data = new Uint8Array([
        0x08,
        0x00,
        0x10,
        0x00,
        0x10,
        0x02, // 2 components
        0x01,
        0x11,
        0x00, // Component 1
        0x01,
        0x11,
        0x01, // Duplicate ID 1
      ]);

      assert.throws(() => {
        decodeSOF(data, 0xc0);
      }, /Duplicate component ID: 1/);
    });
  });

  describe("Component Utilities", () => {
    let sof;

    beforeEach(() => {
      // YCbCr 4:2:0 image
      const data = new Uint8Array([
        0x08, 0x00, 0x20, 0x00, 0x20, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ]);
      sof = decodeSOF(data, 0xc0);
    });

    it("finds components by ID", () => {
      const yComponent = getComponentById(sof.components, 1);
      assert.equal(yComponent.id, 1);
      assert.equal(yComponent.horizontalSampling, 2);
      assert.equal(yComponent.verticalSampling, 2);

      const cbComponent = getComponentById(sof.components, 2);
      assert.equal(cbComponent.id, 2);
      assert.equal(cbComponent.horizontalSampling, 1);

      const nonExistent = getComponentById(sof.components, 99);
      assert.equal(nonExistent, null);
    });

    it("throws on invalid component search parameters", () => {
      assert.throws(() => {
        getComponentById("not array", 1);
      }, TypeError);

      assert.throws(() => {
        getComponentById(sof.components, "not number");
      }, TypeError);
    });

    it("calculates blocks per MCU for components", () => {
      const yComponent = getComponentById(sof.components, 1);
      const cbComponent = getComponentById(sof.components, 2);

      const yBlocks = getComponentBlocksPerMCU(yComponent, sof.maxSampling);
      const cbBlocks = getComponentBlocksPerMCU(cbComponent, sof.maxSampling);

      assert.equal(yBlocks, 4); // 2x2 sampling
      assert.equal(cbBlocks, 1); // 1x1 sampling
    });

    it("throws on invalid blocks per MCU parameters", () => {
      assert.throws(() => {
        getComponentBlocksPerMCU(null, sof.maxSampling);
      }, TypeError);

      assert.throws(() => {
        getComponentBlocksPerMCU(sof.components[0], null);
      }, TypeError);
    });
  });

  describe("MCU Calculations", () => {
    it("calculates MCU dimensions correctly", () => {
      // 4:2:0 subsampling (max 2x2)
      const data420 = new Uint8Array([
        0x08, 0x00, 0x20, 0x00, 0x20, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ]);
      const sof420 = decodeSOF(data420, 0xc0);

      assert.equal(sof420.mcuDimensions.width, 16); // 2 * 8
      assert.equal(sof420.mcuDimensions.height, 16); // 2 * 8

      // 4:4:4 subsampling (max 1x1)
      const data444 = new Uint8Array([
        0x08, 0x00, 0x20, 0x00, 0x20, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ]);
      const sof444 = decodeSOF(data444, 0xc0);

      assert.equal(sof444.mcuDimensions.width, 8); // 1 * 8
      assert.equal(sof444.mcuDimensions.height, 8); // 1 * 8
    });

    it("calculates MCU counts with partial MCUs", () => {
      // 33x17 image with 16x16 MCUs
      const data = new Uint8Array([
        0x08, 0x00, 0x11, 0x00, 0x21, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ]);
      const sof = decodeSOF(data, 0xc0);

      assert.equal(sof.mcuCounts.horizontal, 3); // ceil(33/16)
      assert.equal(sof.mcuCounts.vertical, 2); // ceil(17/16)
      assert.equal(sof.mcuCounts.total, 6); // 3 * 2
    });
  });

  describe("Subsampling Detection", () => {
    it("detects standard subsampling patterns", () => {
      // 4:4:4
      const data444 = new Uint8Array([
        0x08, 0x00, 0x20, 0x00, 0x20, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ]);
      const sof444 = decodeSOF(data444, 0xc0);
      assert.equal(sof444.chromaSubsampling, "4:4:4");

      // 4:2:2
      const data422 = new Uint8Array([
        0x08, 0x00, 0x20, 0x00, 0x20, 0x03, 0x01, 0x21, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ]);
      const sof422 = decodeSOF(data422, 0xc0);
      assert.equal(sof422.chromaSubsampling, "4:2:2");

      // 4:2:0
      const data420 = new Uint8Array([
        0x08, 0x00, 0x20, 0x00, 0x20, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ]);
      const sof420 = decodeSOF(data420, 0xc0);
      assert.equal(sof420.chromaSubsampling, "4:2:0");
    });

    it("detects custom subsampling patterns", () => {
      // Non-standard pattern
      const data = new Uint8Array([
        0x08, 0x00, 0x20, 0x00, 0x20, 0x03, 0x01, 0x31, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ]);
      const sof = decodeSOF(data, 0xc0);
      assert.equal(sof.chromaSubsampling, "Custom");
    });

    it("handles non-YCbCr component counts", () => {
      // Grayscale
      const dataGray = new Uint8Array([0x08, 0x00, 0x20, 0x00, 0x20, 0x01, 0x01, 0x11, 0x00]);
      const sofGray = decodeSOF(dataGray, 0xc0);
      assert.equal(sofGray.chromaSubsampling, "Custom");

      // CMYK
      const dataCMYK = new Uint8Array([
        0x08, 0x00, 0x20, 0x00, 0x20, 0x04, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0x04, 0x11, 0x01,
      ]);
      const sofCMYK = decodeSOF(dataCMYK, 0xc0);
      assert.equal(sofCMYK.chromaSubsampling, "Custom");
    });
  });

  describe("SOF Summary", () => {
    it("generates comprehensive summary", () => {
      const data = new Uint8Array([
        0x08, 0x01, 0x00, 0x01, 0x40, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ]);
      const sof = decodeSOF(data, 0xc2); // Progressive

      const summary = getSOFSummary(sof);

      assert(summary.description.includes("320x256"));
      assert(summary.description.includes("Progressive DCT"));
      assert(summary.description.includes("8-bit"));
      assert(summary.description.includes("3 components"));

      assert(summary.chromaInfo.includes("4:2:0"));
      assert(summary.mcuInfo.includes("16x16 pixels"));

      assert.equal(summary.features.progressive, true);
      assert.equal(summary.features.lossless, false);
      assert.equal(summary.features.differential, false);
      assert.equal(summary.features.arithmetic, false);
    });
  });

  describe("Edge Cases", () => {
    it("handles maximum dimensions", () => {
      const data = new Uint8Array([
        0x08,
        0xff,
        0xff,
        0xff,
        0xff,
        0x01,
        0x01,
        0x11,
        0x00, // 65535x65535
      ]);

      const sof = decodeSOF(data, 0xc0);
      assert.equal(sof.width, 65535);
      assert.equal(sof.height, 65535);
    });

    it("handles maximum sampling factors", () => {
      const data = new Uint8Array([
        0x08,
        0x00,
        0x20,
        0x00,
        0x20,
        0x01,
        0x01,
        0x44,
        0x00, // 4x4 sampling
      ]);

      const sof = decodeSOF(data, 0xc0);
      assert.equal(sof.components[0].horizontalSampling, 4);
      assert.equal(sof.components[0].verticalSampling, 4);
      assert.equal(sof.mcuDimensions.width, 32); // 4 * 8
      assert.equal(sof.mcuDimensions.height, 32); // 4 * 8
    });

    it("handles unusual component counts", () => {
      // 5 components (unusual but valid)
      const data = new Uint8Array([
        0x08, 0x00, 0x20, 0x00, 0x20, 0x05, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0x04, 0x11, 0x02,
        0x05, 0x11, 0x03,
      ]);

      const sof = decodeSOF(data, 0xc1); // Extended allows more flexibility
      assert.equal(sof.componentCount, 5);
      assert.equal(sof.components.length, 5);
    });

    it("handles lossless precision range", () => {
      // SOF3 with 16-bit precision
      const data = new Uint8Array([0x10, 0x00, 0x20, 0x00, 0x20, 0x01, 0x01, 0x11, 0x00]);

      const sof = decodeSOF(data, 0xc3);
      assert.equal(sof.precision, 16);
      assert.equal(sof.sofType.lossless, true);
    });

    it("handles arithmetic coding variants", () => {
      const data = new Uint8Array([0x08, 0x00, 0x20, 0x00, 0x20, 0x01, 0x01, 0x11, 0x00]);

      const sof = decodeSOF(data, 0xc9); // Arithmetic coding
      assert.equal(sof.sofType.coding, "arithmetic");
    });

    it("handles differential modes", () => {
      const data = new Uint8Array([0x08, 0x00, 0x20, 0x00, 0x20, 0x01, 0x01, 0x11, 0x00]);

      const sof = decodeSOF(data, 0xc5); // Differential
      assert.equal(sof.sofType.differential, true);
    });
  });

  describe("Performance Edge Cases", () => {
    it("handles large images efficiently", () => {
      // Large image with many components
      const data = new Uint8Array([
        0x08,
        0xff,
        0xff,
        0xff,
        0xff,
        0x04, // 65535x65535, 4 components
        0x01,
        0x11,
        0x00,
        0x02,
        0x11,
        0x01,
        0x03,
        0x11,
        0x01,
        0x04,
        0x11,
        0x02,
      ]);

      const sof = decodeSOF(data, 0xc1);
      assert.equal(sof.mcuCounts.total, Math.ceil(65535 / 8) * Math.ceil(65535 / 8));
    });

    it("handles complex subsampling patterns", () => {
      // Mixed sampling factors
      const data = new Uint8Array([
        0x08,
        0x00,
        0x40,
        0x00,
        0x40,
        0x04,
        0x01,
        0x42,
        0x00, // Y: 4x2
        0x02,
        0x21,
        0x01, // Cb: 2x1
        0x03,
        0x12,
        0x01, // Cr: 1x2
        0x04,
        0x11,
        0x02, // K: 1x1
      ]);

      const sof = decodeSOF(data, 0xc1);
      assert.equal(sof.maxSampling.maxHorizontal, 4);
      assert.equal(sof.maxSampling.maxVertical, 2);
      assert.equal(sof.chromaSubsampling, "Custom");
    });
  });
});
