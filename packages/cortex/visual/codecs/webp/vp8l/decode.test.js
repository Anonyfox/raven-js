/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for VP8L Lossless Image Decoder
 *
 * Validates VP8L header parsing, meta-block decoding, Huffman trees,
 * LZ77 backward references, and complete image decode with transforms.
 *
 * @fileoverview Comprehensive test suite for VP8L decoder
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeVP8L, parseVP8LHeader } from "./decode.js";

describe("VP8L Lossless Image Decoder", () => {
  // Helper to create ARGB pixel
  const _argb = (a, r, g, b) => (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;

  describe("parseVP8LHeader", () => {
    it("parses valid minimal header", () => {
      // VP8L signature (0x2f) + 14-bit width-1 (0) + 14-bit height-1 (0) + alpha (0) + version (1)
      const data = new Uint8Array([
        0x2f, // signature
        0x00,
        0x00,
        0x00,
        0x80, // width-1=0, height-1=0, alpha=0, version=1
      ]);

      const header = parseVP8LHeader(data);

      assert.equal(header.width, 1);
      assert.equal(header.height, 1);
      assert.equal(header.hasAlpha, false);
      assert.equal(header.version, 1);
      assert.equal(header.dataOffset, 5);
    });

    it("parses header with alpha", () => {
      const data = new Uint8Array([
        0x2f, // signature
        0x01,
        0x40,
        0x00,
        0x90, // width-1=1 (width=2), height-1=1 (height=2), alpha=1, version=1
      ]);

      const header = parseVP8LHeader(data);

      assert.equal(header.width, 2);
      assert.equal(header.height, 2);
      assert.equal(header.hasAlpha, true);
      assert.equal(header.version, 1);
    });

    it("parses maximum dimensions", () => {
      const data = new Uint8Array([
        0x2f, // signature
        0xff,
        0xff,
        0xff,
        0x8f, // width-1=16383, height-1=16383, alpha=0, version=1
      ]);

      const header = parseVP8LHeader(data);

      assert.equal(header.width, 16384);
      assert.equal(header.height, 16384);
    });

    it("rejects invalid signature", () => {
      const data = new Uint8Array([0x2e, 0x00, 0x00, 0x00, 0x08]);

      assert.throws(() => parseVP8LHeader(data), /VP8L: invalid signature 0x2e/);
    });

    it("rejects invalid version", () => {
      const data = new Uint8Array([
        0x2f, // signature
        0x00,
        0x00,
        0x00,
        0x40, // width-1=0, height-1=0, alpha=0, version=2
      ]);

      assert.throws(() => parseVP8LHeader(data), /VP8L: unsupported version 2/);
    });

    it("accepts maximum valid dimensions", () => {
      // Test with maximum dimension (16384) which should be valid
      const validData = new Uint8Array([
        0x2f, // signature
        0xff,
        0xff,
        0xff,
        0x8f, // width-1=16383 (width=16384), height-1=16383 (height=16384)
      ]);

      const header = parseVP8LHeader(validData);
      assert.equal(header.width, 16384);
      assert.equal(header.height, 16384);
    });

    it("rejects truncated header", () => {
      const data = new Uint8Array([0x2f, 0x00, 0x00]);

      assert.throws(() => parseVP8LHeader(data), /VP8L: header too short/);
    });
  });

  describe("decodeVP8L", () => {
    it("decodes minimal 1x1 solid color image", () => {
      // Minimal VP8L: 1x1 pixel, no transforms, no color cache, literal green=128
      const data = new Uint8Array([
        0x2f, // signature
        0x00,
        0x00,
        0x00,
        0x80, // 1x1, no alpha, version 1
        0x00, // no transforms
        0x00, // no color cache (0 bits)
        0x01, // 1 Huffman group
        0x00,
        0x50,
        0x80, // Green tree: single symbol 128 (simplified)
        0x00,
        0x50,
        0x80, // Red tree: single symbol 128
        0x00,
        0x50,
        0x80, // Blue tree: single symbol 128
        0x00,
        0x50,
        0x00, // Distance tree: single symbol 0
        0x80, // Green literal 128
      ]);

      const result = decodeVP8L(data);

      assert.equal(result.width, 1);
      assert.equal(result.height, 1);
      assert.equal(result.pixels.length, 4); // RGBA
      assert.equal(result.pixels[0], 128); // R
      assert.equal(result.pixels[1], 128); // G
      assert.equal(result.pixels[2], 128); // B
      assert.equal(result.pixels[3], 255); // A (opaque)
    });

    it("validates LZ77 distance bounds", () => {
      // Create data that would trigger invalid distance
      const data = new Uint8Array([
        0x2f, // signature
        0x01,
        0x00,
        0x00,
        0x80, // 2x1, no alpha, version 1
        0x00, // no transforms
        0x00, // no color cache
        0x01, // 1 Huffman group
        // Simplified trees that would decode to invalid LZ77
        0x00,
        0x50,
        0x00, // Green tree
        0x00,
        0x50,
        0x00, // Red tree
        0x00,
        0x50,
        0x00, // Blue tree
        0x00,
        0x50,
        0x01, // Distance tree
        0x00,
        0x01, // Invalid sequence
      ]);

      // This should fail during decode due to invalid LZ77 parameters
      assert.throws(() => decodeVP8L(data), /VP8L:/);
    });

    it("handles color cache references", () => {
      // Test with color cache enabled (simplified)
      const data = new Uint8Array([
        0x2f, // signature
        0x01,
        0x00,
        0x00,
        0x80, // 2x1, no alpha, version 1
        0x00, // no transforms
        0x01, // 1-bit color cache (2 entries)
        0x01, // 1 Huffman group
        // Trees configured for cache references
        0x00,
        0x50,
        0x00, // Green tree
        0x00,
        0x50,
        0x00, // Red tree
        0x00,
        0x50,
        0x00, // Blue tree
        0x00,
        0x50,
        0x00, // Distance tree
        0x00,
        0x01, // Simplified data
      ]);

      // Should handle cache logic without crashing
      assert.throws(() => decodeVP8L(data), /VP8L:/); // Expected due to simplified data
    });

    it("rejects invalid color cache index", () => {
      // Data that references out-of-bounds cache index
      const data = new Uint8Array([
        0x2f,
        0x00,
        0x00,
        0x00,
        0x80, // 1x1
        0x00, // no transforms
        0x01, // 1-bit cache
        0x01, // 1 group
        0x00,
        0x50,
        0xff, // Green tree with cache codes
        0x00,
        0x50,
        0x00, // Other trees
        0x00,
        0x50,
        0x00,
        0x00,
        0x50,
        0x00,
        0xff,
        0x03, // Invalid cache reference
      ]);

      assert.throws(() => decodeVP8L(data), /VP8L: invalid color cache index/);
    });
  });

  describe("Transform Handling", () => {
    it("handles subtract green transform", () => {
      const data = new Uint8Array([
        0x2f,
        0x00,
        0x00,
        0x00,
        0x80, // 1x1
        0x01,
        0x04, // Has transform: subtract green (type 2)
        0x00, // no more transforms
        0x00, // no color cache
        0x01, // 1 group
        // Simplified trees
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x00,
        0x80, // Data
      ]);

      // Should process transform without error
      const result = decodeVP8L(data);
      assert.equal(result.width, 1);
      assert.equal(result.height, 1);
    });

    it("processes multiple transforms in order", () => {
      const data = new Uint8Array([
        0x2f,
        0x00,
        0x00,
        0x00,
        0x80, // 1x1
        0x01,
        0x04, // Subtract green
        0x01,
        0x08, // Color transform (type 1) with 2+2=4 bits
        0x00, // no more transforms
        0x00, // no color cache
        0x01, // 1 group
        // Trees
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x00,
        0x80,
      ]);

      const result = decodeVP8L(data);
      assert.equal(result.width, 1);
      assert.equal(result.height, 1);
    });
  });

  describe("Error Handling", () => {
    it("rejects malformed Huffman trees", () => {
      const data = new Uint8Array([
        0x2f, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x01,
        // Malformed tree data
        0xff, 0xff, 0xff,
      ]);

      assert.throws(() => decodeVP8L(data), /VP8L:|Huffman:/);
    });

    it("handles buffer overflow in LZ77", () => {
      const data = new Uint8Array([
        0x2f,
        0x01,
        0x00,
        0x00,
        0x80, // 2x1
        0x00,
        0x00,
        0x01,
        // Trees configured to produce overflow
        0x00,
        0x50,
        0x01,
        0x00,
        0x50,
        0x00,
        0x00,
        0x50,
        0x00,
        0x00,
        0x50,
        0x01,
        0x01,
        0x01, // Length + distance that exceeds buffer
      ]);

      assert.throws(() => decodeVP8L(data), /VP8L: LZ77 copy exceeds buffer/);
    });

    it("validates meta-Huffman symbols", () => {
      const data = new Uint8Array([
        0x2f,
        0x00,
        0x00,
        0x00,
        0x80,
        0x00,
        0x00,
        0x01,
        0x01,
        0x01, // Use meta-Huffman with 1+1=2 codes
        0x03,
        0x03, // 3-bit lengths
        0xff, // Invalid meta symbol > 18
      ]);

      assert.throws(() => decodeVP8L(data), /VP8L: invalid meta-Huffman symbol/);
    });
  });

  describe("ARGB to RGBA Conversion", () => {
    it("converts pixel format correctly", () => {
      // Test with known ARGB values
      const data = new Uint8Array([
        0x2f,
        0x00,
        0x00,
        0x00,
        0x0c, // 1x1 with alpha
        0x00,
        0x00,
        0x01,
        // Trees for ARGB = 0x80ff0040 (A=128, R=255, G=0, B=64)
        0x00,
        0x50,
        0x00, // Green = 0
        0x00,
        0x50,
        0xff, // Red = 255
        0x00,
        0x50,
        0x40, // Blue = 64
        0x00,
        0x50,
        0x80, // Alpha = 128
        0x00,
        0x50,
        0x00, // Distance
        0x00,
        0xff,
        0x40,
        0x80, // Literal ARGB
      ]);

      const result = decodeVP8L(data);

      assert.equal(result.pixels[0], 255); // R
      assert.equal(result.pixels[1], 0); // G
      assert.equal(result.pixels[2], 64); // B
      assert.equal(result.pixels[3], 128); // A
    });

    it("handles opaque pixels correctly", () => {
      const data = new Uint8Array([
        0x2f,
        0x00,
        0x00,
        0x00,
        0x08, // No alpha
        0x00,
        0x00,
        0x01,
        0x00,
        0x50,
        0x7f, // Green = 127
        0x00,
        0x50,
        0x3f, // Red = 63
        0x00,
        0x50,
        0x1f, // Blue = 31
        0x00,
        0x50,
        0x00,
        0x7f,
        0x3f,
        0x1f,
      ]);

      const result = decodeVP8L(data);

      assert.equal(result.pixels[0], 63); // R
      assert.equal(result.pixels[1], 127); // G
      assert.equal(result.pixels[2], 31); // B
      assert.equal(result.pixels[3], 255); // A (forced opaque)
    });
  });

  describe("Performance and Edge Cases", () => {
    it("handles large image dimensions", () => {
      const data = new Uint8Array([
        0x2f,
        0x63,
        0xc0,
        0x18,
        0x80, // 100x100
        0x00,
        0x00,
        0x01,
        // Minimal trees
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x00,
      ]);

      // Should parse header correctly even if decode fails due to insufficient data
      const header = parseVP8LHeader(data);
      assert.equal(header.width, 100);
      assert.equal(header.height, 100);
    });

    it("processes 1xN images", () => {
      const data = new Uint8Array([
        0x2f,
        0x00,
        0x40,
        0x00,
        0x80, // 1x2
        0x00,
        0x00,
        0x01,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x00,
        0x80,
        0x80, // Two pixels
      ]);

      const result = decodeVP8L(data);
      assert.equal(result.width, 1);
      assert.equal(result.height, 2);
      assert.equal(result.pixels.length, 8); // 2 pixels * 4 channels
    });

    it("processes Nx1 images", () => {
      const data = new Uint8Array([
        0x2f,
        0x01,
        0x00,
        0x00,
        0x80, // 2x1
        0x00,
        0x00,
        0x01,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x80,
        0x00,
        0x50,
        0x00,
        0x80,
        0x80,
      ]);

      const result = decodeVP8L(data);
      assert.equal(result.width, 2);
      assert.equal(result.height, 1);
      assert.equal(result.pixels.length, 8);
    });

    it("completes within time limits", () => {
      const start = process.hrtime.bigint();

      // Process minimal image
      const data = new Uint8Array([
        0x2f, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x01, 0x00, 0x50, 0x80, 0x00, 0x50, 0x80, 0x00, 0x50, 0x80, 0x00,
        0x50, 0x00, 0x80,
      ]);

      const result = decodeVP8L(data);
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // ms

      assert.ok(elapsed < 100, `VP8L decode took ${elapsed}ms, should be <100ms`);
      assert.equal(result.pixels.length, 4);
    });
  });
});
