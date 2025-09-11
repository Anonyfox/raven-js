/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for VP8L LZ77 Decoder
 *
 * Validates LZ77 backward references, overlap-safe copying, and color cache.
 * Tests cover overlapping copies, bounds checking, and length/distance decoding.
 *
 * @fileoverview Comprehensive test suite for LZ77 primitives
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  batchLZ77Copy,
  createColorCache,
  decodeLZ77Distance,
  decodeLZ77Length,
  lz77Copy,
  validateLZ77Copy,
} from "./lz77.js";

describe("VP8L LZ77 Decoder", () => {
  describe("lz77Copy", () => {
    it("copies non-overlapping data", () => {
      const dst = new Uint32Array([0x11111111, 0x22222222, 0x33333333, 0x00000000, 0x00000000]);

      lz77Copy(dst, 3, 2, 2); // Copy 2 pixels from distance 2

      assert.equal(dst[3], 0x22222222); // Copy of dst[1]
      assert.equal(dst[4], 0x33333333); // Copy of dst[2]
    });

    it("handles overlapping copies correctly", () => {
      const dst = new Uint32Array([0x11111111, 0x00000000, 0x00000000, 0x00000000, 0x00000000]);

      lz77Copy(dst, 1, 1, 3); // Copy from distance 1, length 3 (overlapping)

      // Should copy dst[0] to dst[1], then dst[1] to dst[2], then dst[2] to dst[3]
      assert.equal(dst[1], 0x11111111); // Copy of dst[0]
      assert.equal(dst[2], 0x11111111); // Copy of dst[1] (which is now dst[0])
      assert.equal(dst[3], 0x11111111); // Copy of dst[2] (which is now dst[0])
    });

    it("handles pattern replication", () => {
      const dst = new Uint32Array([0xaabbccdd, 0xeeff0011, 0x00000000, 0x00000000, 0x00000000, 0x00000000]);

      lz77Copy(dst, 2, 2, 4); // Copy pattern of length 2, repeated

      assert.equal(dst[2], 0xaabbccdd); // Copy of dst[0]
      assert.equal(dst[3], 0xeeff0011); // Copy of dst[1]
      assert.equal(dst[4], 0xaabbccdd); // Copy of dst[2] (which is dst[0])
      assert.equal(dst[5], 0xeeff0011); // Copy of dst[3] (which is dst[1])
    });

    it("validates destination array type", () => {
      assert.throws(() => lz77Copy([], 0, 1, 1), /LZ77: destination must be Uint32Array/);
      assert.throws(() => lz77Copy(new Uint8Array(4), 0, 1, 1), /LZ77: destination must be Uint32Array/);
    });

    it("validates position bounds", () => {
      const dst = new Uint32Array(5);

      assert.throws(() => lz77Copy(dst, -1, 1, 1), /LZ77: invalid destination position -1/);
      assert.throws(() => lz77Copy(dst, 5, 1, 1), /LZ77: invalid destination position 5/);
      assert.throws(() => lz77Copy(dst, 1.5, 1, 1), /LZ77: invalid destination position 1.5/);
    });

    it("validates distance bounds", () => {
      const dst = new Uint32Array(5);

      assert.throws(() => lz77Copy(dst, 2, 0, 1), /LZ77: invalid distance 0/);
      assert.throws(() => lz77Copy(dst, 2, 32769, 1), /LZ77: invalid distance 32769/);
      assert.throws(() => lz77Copy(dst, 2, -1, 1), /LZ77: invalid distance -1/);
    });

    it("validates length bounds", () => {
      const dst = new Uint32Array(5);

      assert.throws(() => lz77Copy(dst, 2, 1, 0), /LZ77: invalid length 0/);
      assert.throws(() => lz77Copy(dst, 2, 1, 4097), /LZ77: invalid length 4097/);
      assert.throws(() => lz77Copy(dst, 2, 1, -1), /LZ77: invalid length -1/);
    });

    it("prevents copying from before array start", () => {
      const dst = new Uint32Array(5);

      assert.throws(() => lz77Copy(dst, 1, 3, 1), /LZ77: distance 3 exceeds available data at position 1/);
    });

    it("prevents copying beyond array end", () => {
      const dst = new Uint32Array(5);

      assert.throws(() => lz77Copy(dst, 3, 1, 3), /LZ77: copy would exceed destination bounds/);
    });

    it("handles maximum valid parameters", () => {
      const dst = new Uint32Array(4096);
      dst.fill(0x12345678);

      // Copy maximum length from maximum available distance
      assert.doesNotThrow(() => lz77Copy(dst, 4095, 4095, 1));
      assert.equal(dst[4095], 0x12345678);
    });
  });

  describe("decodeLZ77Length", () => {
    it("decodes direct lengths", () => {
      assert.equal(decodeLZ77Length(0), 1); // Code 0 -> length 1
      assert.equal(decodeLZ77Length(10), 11); // Code 10 -> length 11
      assert.equal(decodeLZ77Length(255), 256); // Code 255 -> length 256
    });

    it("decodes lengths with extra bits", () => {
      const mockReader = {
        readBits: (n) => {
          if (n === 1) return 1; // Return 1 for 1-bit reads
          if (n === 2) return 3; // Return 3 for 2-bit reads
          return 0;
        },
      };

      assert.equal(decodeLZ77Length(259, mockReader), 7); // Base 6 + 1 extra bit = 7
      assert.equal(decodeLZ77Length(261, mockReader), 13); // Base 10 + 3 extra bits = 13
    });

    it("handles zero extra bits", () => {
      assert.equal(decodeLZ77Length(256), 3); // Code 256 -> length 3 (no extra bits)
      assert.equal(decodeLZ77Length(257), 4); // Code 257 -> length 4 (no extra bits)
    });

    it("validates length codes", () => {
      assert.throws(() => decodeLZ77Length(-1), /LZ77: invalid length code -1/);
      assert.throws(() => decodeLZ77Length(1.5), /LZ77: invalid length code 1.5/);
    });

    it("rejects unsupported length codes", () => {
      assert.throws(() => decodeLZ77Length(300), /LZ77: unsupported length code 300/);
    });

    it("requires reader for codes with extra bits", () => {
      assert.throws(() => decodeLZ77Length(259), /LZ77: reader required for length codes with extra bits/);
      assert.throws(() => decodeLZ77Length(261, {}), /LZ77: reader required for length codes with extra bits/);
    });
  });

  describe("decodeLZ77Distance", () => {
    it("decodes direct distances", () => {
      assert.equal(decodeLZ77Distance(0), 1); // Code 0 -> distance 1
      assert.equal(decodeLZ77Distance(1), 2); // Code 1 -> distance 2
      assert.equal(decodeLZ77Distance(2), 3); // Code 2 -> distance 3
      assert.equal(decodeLZ77Distance(3), 4); // Code 3 -> distance 4
    });

    it("decodes distances with extra bits", () => {
      const mockReader = {
        readBits: (n) => {
          if (n === 1) return 1; // Return 1 for 1-bit reads
          if (n === 2) return 2; // Return 2 for 2-bit reads
          return 0;
        },
      };

      // Code 4: extraBits = 1, baseDistance = 5, extra = 1 -> 6
      assert.equal(decodeLZ77Distance(4, mockReader), 6);

      // Code 6: extraBits = 2, baseDistance = 9, extra = 2 -> 11
      assert.equal(decodeLZ77Distance(6, mockReader), 11);
    });

    it("validates distance codes", () => {
      assert.throws(() => decodeLZ77Distance(-1), /LZ77: invalid distance code -1/);
      assert.throws(() => decodeLZ77Distance(1.5), /LZ77: invalid distance code 1.5/);
    });

    it("requires reader for codes with extra bits", () => {
      assert.throws(() => decodeLZ77Distance(4), /LZ77: reader required for distance codes with extra bits/);
      assert.throws(() => decodeLZ77Distance(5, {}), /LZ77: reader required for distance codes with extra bits/);
    });
  });

  describe("validateLZ77Copy", () => {
    it("validates correct parameters", () => {
      const dst = new Uint32Array(10);
      const result = validateLZ77Copy(dst, 5, 3, 2);

      assert.ok(result.valid);
      assert.equal(result.srcPos, 2);
      assert.equal(result.endPos, 7);
    });

    it("detects invalid destination", () => {
      const result = validateLZ77Copy([], 0, 1, 1);
      assert.ok(!result.valid);
      assert.ok(result.error.includes("destination must be Uint32Array"));
    });

    it("detects invalid position", () => {
      const dst = new Uint32Array(5);
      const result = validateLZ77Copy(dst, 10, 1, 1);
      assert.ok(!result.valid);
      assert.ok(result.error.includes("invalid position"));
    });

    it("detects invalid distance", () => {
      const dst = new Uint32Array(5);
      const result = validateLZ77Copy(dst, 2, 0, 1);
      assert.ok(!result.valid);
      assert.ok(result.error.includes("invalid distance"));
    });

    it("detects distance exceeding data", () => {
      const dst = new Uint32Array(5);
      const result = validateLZ77Copy(dst, 1, 3, 1);
      assert.ok(!result.valid);
      assert.ok(result.error.includes("distance exceeds available data"));
    });

    it("detects bounds overflow", () => {
      const dst = new Uint32Array(5);
      const result = validateLZ77Copy(dst, 3, 1, 3);
      assert.ok(!result.valid);
      assert.ok(result.error.includes("copy exceeds bounds"));
    });
  });

  describe("batchLZ77Copy", () => {
    it("performs multiple copy operations", () => {
      const dst = new Uint32Array([0x11111111, 0x22222222, 0x00000000, 0x00000000, 0x00000000]);
      const operations = [
        { pos: 2, distance: 1, length: 1 }, // Copy dst[1] to dst[2]
        { pos: 3, distance: 2, length: 2 }, // Copy dst[1:2] to dst[3:4]
      ];

      batchLZ77Copy(dst, operations);

      assert.equal(dst[2], 0x22222222); // Copy of dst[1]
      assert.equal(dst[3], 0x22222222); // Copy of dst[1]
      assert.equal(dst[4], 0x22222222); // Copy of dst[2] (which is dst[1])
    });

    it("validates operations array", () => {
      const dst = new Uint32Array(5);
      assert.throws(() => batchLZ77Copy(dst, null), /LZ77: operations must be array/);
      assert.throws(() => batchLZ77Copy(dst, "invalid"), /LZ77: operations must be array/);
    });

    it("validates individual operations", () => {
      const dst = new Uint32Array(5);
      const invalidOps = [null, { pos: 0, distance: 1 }]; // Missing length

      assert.throws(() => batchLZ77Copy(dst, invalidOps), /LZ77: invalid operation at index 0/);
    });

    it("reports operation-specific errors", () => {
      const dst = new Uint32Array(5);
      const operations = [
        { pos: 1, distance: 1, length: 1 }, // Valid
        { pos: 0, distance: 5, length: 1 }, // Invalid distance
      ];

      assert.throws(() => batchLZ77Copy(dst, operations), /LZ77: operation 1 failed/);
    });
  });

  describe("createColorCache", () => {
    it("creates cache with correct size", () => {
      const cache = createColorCache(3); // 2^3 = 8 entries
      assert.equal(cache.size(), 8);
    });

    it("stores and retrieves colors", () => {
      const cache = createColorCache(2); // 4 entries
      const color = 0xffaabbcc;

      const index = cache.set(color);
      assert.equal(cache.get(index), color);
    });

    it("handles cache wraparound", () => {
      const cache = createColorCache(1); // 2 entries
      const color1 = 0x11111111;
      const color2 = 0x22222222;
      const color3 = 0x33333333;

      const idx1 = cache.set(color1); // Index 0
      const idx2 = cache.set(color2); // Index 1
      const idx3 = cache.set(color3); // Index 0 (wraparound)

      assert.equal(idx1, 0);
      assert.equal(idx2, 1);
      assert.equal(idx3, 0);
      assert.equal(cache.get(0), color3); // Overwrote color1
      assert.equal(cache.get(1), color2); // Still color2
    });

    it("calculates color indices", () => {
      const cache = createColorCache(4); // 16 entries
      const color = 0x12345678;

      const index = cache.indexOf(color);
      assert.ok(index >= 0 && index < 16);

      // Same color should give same index
      assert.equal(cache.indexOf(color), index);
    });

    it("validates cache size", () => {
      assert.throws(() => createColorCache(-1), /LZ77: invalid cache bits -1/);
      assert.throws(() => createColorCache(12), /LZ77: invalid cache bits 12/);
      assert.throws(() => createColorCache(1.5), /LZ77: invalid cache bits 1.5/);
    });

    it("validates cache access", () => {
      const cache = createColorCache(2); // 4 entries

      assert.throws(() => cache.get(-1), /ColorCache: invalid index -1/);
      assert.throws(() => cache.get(4), /ColorCache: invalid index 4/);
      assert.throws(() => cache.get(1.5), /ColorCache: invalid index 1.5/);
    });

    it("clears cache correctly", () => {
      const cache = createColorCache(2);
      cache.set(0x11111111);
      cache.set(0x22222222);

      cache.clear();

      assert.equal(cache.get(0), 0);
      assert.equal(cache.get(1), 0);
    });

    it("handles maximum cache size", () => {
      const cache = createColorCache(11); // 2^11 = 2048 entries
      assert.equal(cache.size(), 2048);

      // Should handle large cache efficiently
      for (let i = 0; i < 100; i++) {
        cache.set(i);
      }
      assert.doesNotThrow(() => cache.get(50));
    });
  });

  describe("Edge Cases and Performance", () => {
    it("handles single pixel copies", () => {
      const dst = new Uint32Array([0x12345678, 0x00000000]);
      lz77Copy(dst, 1, 1, 1);
      assert.equal(dst[1], 0x12345678);
    });

    it("handles maximum length copies", () => {
      const dst = new Uint32Array(8192); // Large enough for max copy
      dst.fill(0xdeadbeef, 0, 4096);

      lz77Copy(dst, 4096, 4096, 4096); // Max length copy

      // Check a few positions
      assert.equal(dst[4096], 0xdeadbeef);
      assert.equal(dst[8191], 0xdeadbeef);
    });

    it("processes large batches efficiently", () => {
      const dst = new Uint32Array(1000);
      dst.fill(0xcafebabe, 0, 100);

      const operations = [];
      for (let i = 100; i < 900; i += 10) {
        operations.push({ pos: i, distance: 50, length: 10 });
      }

      const start = process.hrtime.bigint();
      batchLZ77Copy(dst, operations);
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // ms

      assert.ok(elapsed < 50, `Batch copy took ${elapsed}ms, should be <50ms`);
      assert.equal(dst[100], 0xcafebabe); // First copy
      assert.equal(dst[890], 0xcafebabe); // Last copy
    });

    it("maintains deterministic color cache behavior", () => {
      const cache1 = createColorCache(3);
      const cache2 = createColorCache(3);
      const colors = [0x11111111, 0x22222222, 0x33333333];

      for (const color of colors) {
        const idx1 = cache1.set(color);
        const idx2 = cache2.set(color);
        assert.equal(idx1, idx2);
        assert.equal(cache1.indexOf(color), cache2.indexOf(color));
      }
    });

    it("handles overlapping copies with various patterns", () => {
      const testCases = [
        { distance: 1, length: 5 }, // Repeat single pixel
        { distance: 2, length: 6 }, // Repeat 2-pixel pattern
        { distance: 3, length: 9 }, // Repeat 3-pixel pattern
      ];

      for (const { distance, length } of testCases) {
        const dst = new Uint32Array(20);
        // Set up initial pattern
        for (let i = 0; i < distance; i++) {
          dst[i] = 0x10000000 + i;
        }

        lz77Copy(dst, distance, distance, length);

        // Verify pattern replication
        for (let i = 0; i < length; i++) {
          const expected = dst[i % distance];
          assert.equal(
            dst[distance + i],
            expected,
            `Mismatch at position ${distance + i} for distance=${distance}, length=${length}`
          );
        }
      }
    });
  });
});
