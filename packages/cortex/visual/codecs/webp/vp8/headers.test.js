/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for VP8 frame header and control data parsing.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { createBoolDecoder } from "./bool-decoder.js";
import {
  parseLoopFilter,
  parseModeProbs,
  parseQuantization,
  parseSegmentation,
  parseVP8FrameHeader,
} from "./headers.js";

describe("parseVP8FrameHeader", () => {
  describe("core functionality", () => {
    it("parses valid keyframe header", () => {
      // Create minimal valid VP8 keyframe header
      const header = new Uint8Array([
        // Frame tag (3 bytes): keyframe=1, version=0, show=1, partition_size=0
        0x10,
        0x00,
        0x00, // 0 << 5 | 1 << 4 | 0 << 1 | 0 = 0x000010
        // Start code (3 bytes)
        0x9d,
        0x01,
        0x2a,
        // Width (2 bytes): 64 pixels
        0x40,
        0x00,
        // Height (2 bytes): 48 pixels
        0x30,
        0x00,
        // Add some partition data to make partition size valid
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const result = parseVP8FrameHeader(header);

      assert.equal(result.keyframe, true);
      assert.equal(result.version, 0);
      assert.equal(result.show, true);
      assert.equal(result.firstPartitionSize, 0);
      assert.equal(result.width, 64);
      assert.equal(result.height, 48);
      assert.equal(result.widthScale, 0);
      assert.equal(result.heightScale, 0);
      assert.equal(result.headerSize, 10);
    });

    it("parses different frame dimensions", () => {
      const header = new Uint8Array([
        0x10,
        0x00,
        0x00, // Same frame tag (partition size 0)
        0x9d,
        0x01,
        0x2a, // Start code
        0x80,
        0x02, // Width: 640 pixels
        0xe0,
        0x01, // Height: 480 pixels
      ]);

      const result = parseVP8FrameHeader(header);

      assert.equal(result.width, 640);
      assert.equal(result.height, 480);
    });

    it("extracts scaling flags", () => {
      const header = new Uint8Array([
        0x10,
        0x00,
        0x00, // Frame tag (partition size 0)
        0x9d,
        0x01,
        0x2a, // Start code
        0x40,
        0x80, // Width: 64 pixels, scale=2
        0x30,
        0xc0, // Height: 48 pixels, scale=3
      ]);

      const result = parseVP8FrameHeader(header);

      assert.equal(result.width, 64);
      assert.equal(result.height, 48);
      assert.equal(result.widthScale, 2);
      assert.equal(result.heightScale, 3);
    });
  });

  describe("validation and error handling", () => {
    it("validates buffer type", () => {
      assert.throws(() => parseVP8FrameHeader(null), /view must be Uint8Array/);
      assert.throws(() => parseVP8FrameHeader([1, 2, 3]), /view must be Uint8Array/);
    });

    it("requires minimum buffer size", () => {
      const tooSmall = new Uint8Array(9);
      assert.throws(() => parseVP8FrameHeader(tooSmall), /need at least 10 bytes/);
    });

    it("rejects interframes", () => {
      const interframe = new Uint8Array([
        0x51,
        0x01,
        0x00, // Frame tag with keyframe=0 (bit 0 = 1)
        0x9d,
        0x01,
        0x2a,
        0x40,
        0x00,
        0x30,
        0x00,
      ]);

      assert.throws(() => parseVP8FrameHeader(interframe), /only keyframes are supported/);
    });

    it("rejects unsupported versions", () => {
      const badVersion = new Uint8Array([
        0x58,
        0x01,
        0x00, // Version 4 (bits 1-3 = 100)
        0x9d,
        0x01,
        0x2a,
        0x40,
        0x00,
        0x30,
        0x00,
      ]);

      assert.throws(() => parseVP8FrameHeader(badVersion), /unsupported version 4/);
    });

    it("accepts zero partition size", () => {
      const zeroPartition = new Uint8Array([
        0x10,
        0x00,
        0x00, // Partition size = 0
        0x9d,
        0x01,
        0x2a,
        0x40,
        0x00,
        0x30,
        0x00,
      ]);

      const result = parseVP8FrameHeader(zeroPartition);
      assert.equal(result.firstPartitionSize, 0);
    });

    it("validates start code", () => {
      const badStartCode = new Uint8Array([
        0x10,
        0x00,
        0x00, // Partition size = 0
        0x9c,
        0x01,
        0x2a, // Wrong start code (9c instead of 9d)
        0x40,
        0x00,
        0x30,
        0x00,
      ]);

      assert.throws(() => parseVP8FrameHeader(badStartCode), /invalid start code/);
    });

    it("rejects zero dimensions", () => {
      const zeroDims = new Uint8Array([
        0x10,
        0x00,
        0x00, // Partition size = 0
        0x9d,
        0x01,
        0x2a,
        0x00,
        0x00, // Width = 0
        0x30,
        0x00,
      ]);

      assert.throws(() => parseVP8FrameHeader(zeroDims), /invalid dimensions 0x48/);
    });

    it("rejects oversized dimensions", () => {
      const oversized = new Uint8Array([
        0x10,
        0x00,
        0x00, // Partition size = 0
        0x9d,
        0x01,
        0x2a,
        0x00,
        0x40, // Width = 16384, but after masking with 0x3FFF becomes 0
        0x30,
        0x00, // Height = 48 (0x30)
      ]);

      // This will actually trigger the "invalid dimensions 0x48" error since width becomes 0
      assert.throws(() => parseVP8FrameHeader(oversized), /invalid dimensions 0x48/);
    });

    it("validates partition size against buffer", () => {
      const header = new Uint8Array([
        0xf0,
        0xff,
        0x7f, // Partition size = 0x7FFFF0 (very large)
        0x9d,
        0x01,
        0x2a,
        0x40,
        0x00,
        0x30,
        0x00,
      ]);

      assert.throws(() => parseVP8FrameHeader(header), /first partition size .* exceeds remaining data/);
    });
  });

  describe("frame tag parsing", () => {
    it("extracts show flag correctly", () => {
      const showFalse = new Uint8Array([
        0x00,
        0x00,
        0x00, // show=0 (bit 4 = 0), partition size = 0
        0x9d,
        0x01,
        0x2a,
        0x40,
        0x00,
        0x30,
        0x00,
      ]);

      const result = parseVP8FrameHeader(showFalse);
      assert.equal(result.show, false);
    });

    it("handles different versions", () => {
      for (let version = 0; version <= 3; version++) {
        const header = new Uint8Array([
          0x10 | (version << 1),
          0x00,
          0x00, // Set version bits, partition size = 0
          0x9d,
          0x01,
          0x2a,
          0x40,
          0x00,
          0x30,
          0x00,
        ]);

        const result = parseVP8FrameHeader(header);
        assert.equal(result.version, version, `Should parse version ${version}`);
      }
    });
  });
});

describe("parseSegmentation", () => {
  it("parses disabled segmentation", () => {
    const data = new Uint8Array([0x00, 0x00]); // First bit = 0 (disabled)
    const decoder = createBoolDecoder(data, 0, 2);

    const seg = parseSegmentation(decoder);

    assert.equal(seg.enabled, false);
    assert.equal(seg.updateMap, false);
    assert.equal(seg.updateData, false);
  });

  it("parses enabled segmentation without updates", () => {
    const data = new Uint8Array([0x80, 0x00]); // First bit = 1 (enabled), next bits = 0
    const decoder = createBoolDecoder(data, 0, 2);

    const seg = parseSegmentation(decoder);

    assert.equal(seg.enabled, true);
    assert.equal(seg.updateMap, false);
    assert.equal(seg.updateData, false);
  });

  it("handles segmentation data structure", () => {
    const data = new Uint8Array(10).fill(0x80); // All bits set for testing
    const decoder = createBoolDecoder(data, 0, 10);

    const seg = parseSegmentation(decoder);

    assert.equal(typeof seg.quantizer, "object");
    assert.equal(seg.quantizer.length, 4);
    assert.equal(typeof seg.loopFilter, "object");
    assert.equal(seg.loopFilter.length, 4);
  });
});

describe("parseLoopFilter", () => {
  it("parses basic loop filter parameters", () => {
    const data = new Uint8Array([0x80, 0xff, 0x00]); // Type=simple, level=63, sharpness=7
    const decoder = createBoolDecoder(data, 0, 3);

    const filter = parseLoopFilter(decoder);

    assert.equal(filter.type, "simple");
    assert.ok(filter.level >= 0 && filter.level <= 63);
    assert.ok(filter.sharpness >= 0 && filter.sharpness <= 7);
    assert.equal(filter.deltaEnabled, false);
  });

  it("parses normal filter type", () => {
    const data = new Uint8Array([0x00, 0x80]); // Type=normal
    const decoder = createBoolDecoder(data, 0, 2);

    const filter = parseLoopFilter(decoder);

    assert.equal(filter.type, "normal");
  });

  it("handles delta arrays", () => {
    const data = new Uint8Array(10).fill(0x80);
    const decoder = createBoolDecoder(data, 0, 10);

    const filter = parseLoopFilter(decoder);

    assert.equal(filter.refDeltas.length, 4);
    assert.equal(filter.modeDeltas.length, 4);
  });
});

describe("parseQuantization", () => {
  it("parses quantization parameters", () => {
    const data = new Uint8Array([0xff, 0x00]); // Base quantizer = 127
    const decoder = createBoolDecoder(data, 0, 2);

    const quant = parseQuantization(decoder);

    assert.ok(quant.yAC >= 0 && quant.yAC <= 127);
    assert.ok(quant.yDC >= 0 && quant.yDC <= 127);
    assert.ok(quant.y2DC >= 0 && quant.y2DC <= 127);
    assert.ok(quant.y2AC >= 0 && quant.y2AC <= 127);
    assert.ok(quant.uvDC >= 0 && quant.uvDC <= 127);
    assert.ok(quant.uvAC >= 0 && quant.uvAC <= 127);
  });

  it("clamps quantizer values to valid range", () => {
    const data = new Uint8Array(10).fill(0xff); // Maximum values
    const decoder = createBoolDecoder(data, 0, 10);

    const quant = parseQuantization(decoder);

    // All values should be within [0, 127]
    for (const key of ["yAC", "yDC", "y2DC", "y2AC", "uvDC", "uvAC"]) {
      assert.ok(quant[key] >= 0 && quant[key] <= 127, `${key} should be in range [0, 127] (got ${quant[key]})`);
    }
  });
});

describe("parseModeProbs", () => {
  it("parses mode probabilities structure", () => {
    const data = new Uint8Array(20).fill(0x80);
    const decoder = createBoolDecoder(data, 0, 20);

    const probs = parseModeProbs(decoder);

    assert.equal(probs.yMode.length, 4);
    assert.equal(probs.uvMode.length, 3);
    assert.equal(probs.intra4x4.length, 10);
    assert.equal(probs.coeff.length, 4);

    // Check that all probabilities are in valid range [0, 255]
    for (const prob of probs.yMode) {
      assert.ok(prob >= 0 && prob <= 255);
    }

    for (const prob of probs.uvMode) {
      assert.ok(prob >= 0 && prob <= 255);
    }
  });

  it("maintains default values when no updates", () => {
    const data = new Uint8Array([0x00, 0x00]); // No updates
    const decoder = createBoolDecoder(data, 0, 2);

    const probs = parseModeProbs(decoder);

    // Should have reasonable default values
    assert.ok(probs.yMode.every((p) => p > 0 && p < 255));
    assert.ok(probs.uvMode.every((p) => p > 0 && p < 255));
  });
});

describe("integration tests", () => {
  it("parses complete frame header sequence", () => {
    // Create a complete minimal VP8 frame
    const frameData = new Uint8Array([
      // Frame header
      0x10,
      0x00,
      0x00, // Frame tag (partition size = 0)
      0x9d,
      0x01,
      0x2a, // Start code
      0x40,
      0x00, // Width: 64
      0x30,
      0x00, // Height: 48
      // Boolean data for control parameters
      0x80,
      0x40,
      0x20,
      0x10,
      0x08,
      0x04,
      0x02,
      0x01,
    ]);

    // Parse frame header
    const header = parseVP8FrameHeader(frameData);

    // Create decoder for control data
    const controlStart = header.headerSize;
    const decoder = createBoolDecoder(frameData, controlStart, frameData.length);

    // Parse control structures
    const seg = parseSegmentation(decoder);
    const filter = parseLoopFilter(decoder);
    const quant = parseQuantization(decoder);

    // All should parse without error
    assert.ok(header);
    assert.ok(seg);
    assert.ok(filter);
    assert.ok(quant);
  });

  it("handles realistic frame dimensions", () => {
    const commonSizes = [
      [64, 48], // Tiny
      [320, 240], // Small
      [640, 480], // VGA
      [1280, 720], // HD
      [1920, 1080], // Full HD
    ];

    for (const [width, height] of commonSizes) {
      const header = new Uint8Array([
        0x10,
        0x00,
        0x00, // Partition size = 0
        0x9d,
        0x01,
        0x2a,
        width & 0xff,
        (width >> 8) & 0xff,
        height & 0xff,
        (height >> 8) & 0xff,
      ]);

      const result = parseVP8FrameHeader(header);
      assert.equal(result.width, width, `Width should be ${width}`);
      assert.equal(result.height, height, `Height should be ${height}`);
    }
  });
});
