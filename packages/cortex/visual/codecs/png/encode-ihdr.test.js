/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for PNG IHDR chunk encoding.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
  createIHDRChunk,
  createIHDRFromImageInfo,
  getBytesPerPixel,
  getSamplesPerPixel,
  getScanlineWidth,
} from "./encode-ihdr.js";

describe("PNG IHDR Encoding", () => {
  describe("createIHDRChunk", () => {
    it("creates valid IHDR chunk for RGBA image", () => {
      const ihdrData = createIHDRChunk(800, 600, 8, 6, 0, 0, 0);

      assert.equal(ihdrData.length, 13, "IHDR chunk should be 13 bytes");
      assert(ihdrData instanceof Uint8Array, "Should return Uint8Array");

      // Check width (800 = 0x00000320)
      assert.equal(ihdrData[0], 0x00, "Width byte 0");
      assert.equal(ihdrData[1], 0x00, "Width byte 1");
      assert.equal(ihdrData[2], 0x03, "Width byte 2");
      assert.equal(ihdrData[3], 0x20, "Width byte 3");

      // Check height (600 = 0x00000258)
      assert.equal(ihdrData[4], 0x00, "Height byte 0");
      assert.equal(ihdrData[5], 0x00, "Height byte 1");
      assert.equal(ihdrData[6], 0x02, "Height byte 2");
      assert.equal(ihdrData[7], 0x58, "Height byte 3");

      // Check other fields
      assert.equal(ihdrData[8], 8, "Bit depth should be 8");
      assert.equal(ihdrData[9], 6, "Color type should be 6 (RGBA)");
      assert.equal(ihdrData[10], 0, "Compression method should be 0");
      assert.equal(ihdrData[11], 0, "Filter method should be 0");
      assert.equal(ihdrData[12], 0, "Interlace method should be 0");
    });

    it("creates valid IHDR chunk for grayscale image", () => {
      const ihdrData = createIHDRChunk(1024, 768, 8, 0, 0, 0, 0);

      assert.equal(ihdrData.length, 13, "IHDR chunk should be 13 bytes");

      // Check width (1024 = 0x00000400)
      assert.equal(ihdrData[0], 0x00, "Width byte 0");
      assert.equal(ihdrData[1], 0x00, "Width byte 1");
      assert.equal(ihdrData[2], 0x04, "Width byte 2");
      assert.equal(ihdrData[3], 0x00, "Width byte 3");

      // Check height (768 = 0x00000300)
      assert.equal(ihdrData[4], 0x00, "Height byte 0");
      assert.equal(ihdrData[5], 0x00, "Height byte 1");
      assert.equal(ihdrData[6], 0x03, "Height byte 2");
      assert.equal(ihdrData[7], 0x00, "Height byte 3");

      assert.equal(ihdrData[8], 8, "Bit depth should be 8");
      assert.equal(ihdrData[9], 0, "Color type should be 0 (grayscale)");
    });

    it("creates valid IHDR chunk with interlacing", () => {
      const ihdrData = createIHDRChunk(100, 100, 8, 2, 0, 0, 1);

      assert.equal(ihdrData[12], 1, "Interlace method should be 1 (Adam7)");
    });

    it("handles maximum dimensions", () => {
      const maxDim = 0x7fffffff; // 2^31 - 1
      const ihdrData = createIHDRChunk(maxDim, maxDim, 8, 6, 0, 0, 0);

      assert.equal(ihdrData.length, 13, "Should handle maximum dimensions");

      // Check width encoding
      assert.equal(ihdrData[0], 0x7f, "Max width byte 0");
      assert.equal(ihdrData[1], 0xff, "Max width byte 1");
      assert.equal(ihdrData[2], 0xff, "Max width byte 2");
      assert.equal(ihdrData[3], 0xff, "Max width byte 3");
    });

    it("validates width parameter", () => {
      assert.throws(() => createIHDRChunk(0, 100, 8, 6, 0, 0, 0), /Invalid width/);
      assert.throws(() => createIHDRChunk(-1, 100, 8, 6, 0, 0, 0), /Invalid width/);
      assert.throws(() => createIHDRChunk(1.5, 100, 8, 6, 0, 0, 0), /Invalid width/);
      assert.throws(() => createIHDRChunk(0x80000000, 100, 8, 6, 0, 0, 0), /Invalid width/);
    });

    it("validates height parameter", () => {
      assert.throws(() => createIHDRChunk(100, 0, 8, 6, 0, 0, 0), /Invalid height/);
      assert.throws(() => createIHDRChunk(100, -1, 8, 6, 0, 0, 0), /Invalid height/);
      assert.throws(() => createIHDRChunk(100, 1.5, 8, 6, 0, 0, 0), /Invalid height/);
      assert.throws(() => createIHDRChunk(100, 0x80000000, 8, 6, 0, 0, 0), /Invalid height/);
    });

    it("validates bit depth parameter", () => {
      assert.throws(() => createIHDRChunk(100, 100, 3, 6, 0, 0, 0), /Invalid bit depth/);
      assert.throws(() => createIHDRChunk(100, 100, 0, 6, 0, 0, 0), /Invalid bit depth/);
      assert.throws(() => createIHDRChunk(100, 100, 32, 6, 0, 0, 0), /Invalid bit depth/);
    });

    it("validates color type parameter", () => {
      assert.throws(() => createIHDRChunk(100, 100, 8, 1, 0, 0, 0), /Invalid color type/);
      assert.throws(() => createIHDRChunk(100, 100, 8, 5, 0, 0, 0), /Invalid color type/);
      assert.throws(() => createIHDRChunk(100, 100, 8, 7, 0, 0, 0), /Invalid color type/);
    });

    it("validates compression method parameter", () => {
      assert.throws(() => createIHDRChunk(100, 100, 8, 6, 1, 0, 0), /Invalid compression method/);
      assert.throws(() => createIHDRChunk(100, 100, 8, 6, -1, 0, 0), /Invalid compression method/);
    });

    it("validates filter method parameter", () => {
      assert.throws(() => createIHDRChunk(100, 100, 8, 6, 0, 1, 0), /Invalid filter method/);
      assert.throws(() => createIHDRChunk(100, 100, 8, 6, 0, -1, 0), /Invalid filter method/);
    });

    it("validates interlace method parameter", () => {
      assert.throws(() => createIHDRChunk(100, 100, 8, 6, 0, 0, 2), /Invalid interlace method/);
      assert.throws(() => createIHDRChunk(100, 100, 8, 6, 0, 0, -1), /Invalid interlace method/);
    });

    it("validates bit depth and color type combinations", () => {
      // Valid combinations
      assert.doesNotThrow(() => createIHDRChunk(100, 100, 1, 0, 0, 0, 0)); // Grayscale 1-bit
      assert.doesNotThrow(() => createIHDRChunk(100, 100, 8, 2, 0, 0, 0)); // RGB 8-bit
      assert.doesNotThrow(() => createIHDRChunk(100, 100, 4, 3, 0, 0, 0)); // Palette 4-bit
      assert.doesNotThrow(() => createIHDRChunk(100, 100, 16, 4, 0, 0, 0)); // Grayscale+Alpha 16-bit
      assert.doesNotThrow(() => createIHDRChunk(100, 100, 8, 6, 0, 0, 0)); // RGBA 8-bit

      // Invalid combinations
      assert.throws(() => createIHDRChunk(100, 100, 1, 2, 0, 0, 0), /Invalid bit depth 1 for color type 2/);
      assert.throws(() => createIHDRChunk(100, 100, 16, 3, 0, 0, 0), /Invalid bit depth 16 for color type 3/);
      assert.throws(() => createIHDRChunk(100, 100, 4, 6, 0, 0, 0), /Invalid bit depth 4 for color type 6/);
    });
  });

  describe("createIHDRFromImageInfo", () => {
    it("creates IHDR from image info object", () => {
      const imageInfo = {
        width: 640,
        height: 480,
        bitDepth: 8,
        colorType: 6,
      };

      const ihdrData = createIHDRFromImageInfo(imageInfo);

      assert.equal(ihdrData.length, 13, "Should create 13-byte IHDR");
      assert.equal(ihdrData[8], 8, "Should use correct bit depth");
      assert.equal(ihdrData[9], 6, "Should use correct color type");
      assert.equal(ihdrData[12], 0, "Should default to no interlacing");
    });

    it("handles custom interlace method", () => {
      const imageInfo = {
        width: 100,
        height: 100,
        bitDepth: 8,
        colorType: 2,
        interlaceMethod: 1,
      };

      const ihdrData = createIHDRFromImageInfo(imageInfo);

      assert.equal(ihdrData[12], 1, "Should use custom interlace method");
    });
  });

  describe("getSamplesPerPixel", () => {
    it("returns correct samples per pixel for each color type", () => {
      assert.equal(getSamplesPerPixel(0), 1, "Grayscale should have 1 sample");
      assert.equal(getSamplesPerPixel(2), 3, "RGB should have 3 samples");
      assert.equal(getSamplesPerPixel(3), 1, "Palette should have 1 sample");
      assert.equal(getSamplesPerPixel(4), 2, "Grayscale+Alpha should have 2 samples");
      assert.equal(getSamplesPerPixel(6), 4, "RGBA should have 4 samples");
    });

    it("throws for invalid color types", () => {
      assert.throws(() => getSamplesPerPixel(1), /Invalid color type/);
      assert.throws(() => getSamplesPerPixel(5), /Invalid color type/);
      assert.throws(() => getSamplesPerPixel(7), /Invalid color type/);
    });
  });

  describe("getBytesPerPixel", () => {
    it("calculates bytes per pixel correctly", () => {
      assert.equal(getBytesPerPixel(8, 0), 1, "8-bit grayscale should be 1 byte");
      assert.equal(getBytesPerPixel(8, 2), 3, "8-bit RGB should be 3 bytes");
      assert.equal(getBytesPerPixel(8, 6), 4, "8-bit RGBA should be 4 bytes");
      assert.equal(getBytesPerPixel(16, 0), 2, "16-bit grayscale should be 2 bytes");
      assert.equal(getBytesPerPixel(16, 6), 8, "16-bit RGBA should be 8 bytes");
    });

    it("handles sub-byte bit depths", () => {
      assert.equal(getBytesPerPixel(1, 0), 1, "1-bit grayscale should round up to 1 byte");
      assert.equal(getBytesPerPixel(2, 0), 1, "2-bit grayscale should round up to 1 byte");
      assert.equal(getBytesPerPixel(4, 0), 1, "4-bit grayscale should round up to 1 byte");
      assert.equal(getBytesPerPixel(1, 3), 1, "1-bit palette should round up to 1 byte");
    });
  });

  describe("getScanlineWidth", () => {
    it("calculates scanline width including filter byte", () => {
      assert.equal(getScanlineWidth(100, 8, 0), 101, "100px 8-bit grayscale: 100 + 1 filter byte");
      assert.equal(getScanlineWidth(100, 8, 2), 301, "100px 8-bit RGB: 300 + 1 filter byte");
      assert.equal(getScanlineWidth(100, 8, 6), 401, "100px 8-bit RGBA: 400 + 1 filter byte");
    });

    it("handles sub-byte bit depths", () => {
      assert.equal(getScanlineWidth(8, 1, 0), 2, "8px 1-bit grayscale: 1 byte + 1 filter byte");
      assert.equal(getScanlineWidth(4, 2, 0), 2, "4px 2-bit grayscale: 1 byte + 1 filter byte");
      assert.equal(getScanlineWidth(2, 4, 0), 2, "2px 4-bit grayscale: 1 byte + 1 filter byte");
      assert.equal(getScanlineWidth(9, 1, 0), 3, "9px 1-bit grayscale: 2 bytes + 1 filter byte");
    });

    it("handles 16-bit depths", () => {
      assert.equal(getScanlineWidth(100, 16, 0), 201, "100px 16-bit grayscale: 200 + 1 filter byte");
      assert.equal(getScanlineWidth(100, 16, 6), 801, "100px 16-bit RGBA: 800 + 1 filter byte");
    });
  });

  describe("Edge Cases", () => {
    it("handles minimum image size", () => {
      const ihdrData = createIHDRChunk(1, 1, 8, 6, 0, 0, 0);
      assert.equal(ihdrData.length, 13, "Should handle 1x1 image");
    });

    it("handles various bit depth and color type combinations", () => {
      const testCases = [
        [1, 0],
        [2, 0],
        [4, 0],
        [8, 0],
        [16, 0], // Grayscale
        [8, 2],
        [16, 2], // RGB
        [1, 3],
        [2, 3],
        [4, 3],
        [8, 3], // Palette
        [8, 4],
        [16, 4], // Grayscale + Alpha
        [8, 6],
        [16, 6], // RGB + Alpha
      ];

      for (const [bitDepth, colorType] of testCases) {
        assert.doesNotThrow(
          () => createIHDRChunk(100, 100, bitDepth, colorType, 0, 0, 0),
          `Should handle bit depth ${bitDepth} with color type ${colorType}`
        );
      }
    });
  });
});
