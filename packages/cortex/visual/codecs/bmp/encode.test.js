/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for BMP encode function.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { decodeBMP, encodeBMP } from "./index.js";

describe("BMP encode function", () => {
  it("encodes RGBA pixels to 24-bit BMP buffer", () => {
    const width = 2;
    const height = 2;
    const pixels = new Uint8Array([
      255,
      0,
      0,
      255, // Red
      0,
      255,
      0,
      255, // Green
      0,
      0,
      255,
      255, // Blue
      255,
      255,
      255,
      255, // White
    ]);

    const result = encodeBMP(pixels, width, height, { hasAlpha: false });

    assert(result instanceof Uint8Array, "Should return Uint8Array buffer");
    assert(result.length > 0, "Should return non-empty buffer");

    // Verify BMP file header
    assert.equal(result[0], 0x42, "Should start with 'B'");
    assert.equal(result[1], 0x4d, "Should start with 'M'");

    // Verify file size
    const fileSize = result[2] | (result[3] << 8) | (result[4] << 16) | (result[5] << 24);
    assert.equal(fileSize, result.length, "File size should match buffer length");

    // Verify data offset
    const dataOffset = result[10] | (result[11] << 8) | (result[12] << 16) | (result[13] << 24);
    assert.equal(dataOffset, 54, "Data offset should be 54 for standard BMP");

    // Verify info header
    const infoOffset = 14;
    const headerSize =
      result[infoOffset] |
      (result[infoOffset + 1] << 8) |
      (result[infoOffset + 2] << 16) |
      (result[infoOffset + 3] << 24);
    assert.equal(headerSize, 40, "Info header size should be 40");

    const bmpWidth =
      result[infoOffset + 4] |
      (result[infoOffset + 5] << 8) |
      (result[infoOffset + 6] << 16) |
      (result[infoOffset + 7] << 24);
    assert.equal(bmpWidth, width, "Width should match");

    const bmpHeight =
      result[infoOffset + 8] |
      (result[infoOffset + 9] << 8) |
      (result[infoOffset + 10] << 16) |
      (result[infoOffset + 11] << 24);
    assert.equal(bmpHeight, height, "Height should match");

    const bitCount = result[infoOffset + 14] | (result[infoOffset + 15] << 8);
    assert.equal(bitCount, 24, "Should be 24-bit BMP");

    const compression =
      result[infoOffset + 16] |
      (result[infoOffset + 17] << 8) |
      (result[infoOffset + 18] << 16) |
      (result[infoOffset + 19] << 24);
    assert.equal(compression, 0, "Should be uncompressed");

    // Verify pixel data exists
    assert(result.length > dataOffset, "Should have pixel data after header");
  });

  it("encodes RGBA pixels to 32-bit BMP buffer with alpha", () => {
    const width = 2;
    const height = 1;
    const pixels = new Uint8Array([
      255,
      0,
      0,
      128, // Semi-transparent red
      0,
      255,
      0,
      255, // Opaque green
    ]);

    const result = encodeBMP(pixels, width, height, { hasAlpha: true });

    // Verify it's 32-bit
    const bitCount = result[28] | (result[29] << 8);
    assert.equal(bitCount, 32, "Should be 32-bit BMP when hasAlpha is true");

    // Verify file can be decoded back
    const decoded = decodeBMP(result);
    assert.equal(decoded.width, width);
    assert.equal(decoded.height, height);
    assert.equal(decoded.metadata.hasAlpha, true);
  });

  it("throws error for empty pixel data", () => {
    const emptyPixels = new Uint8Array(0);

    assert.throws(
      () => encodeBMP(emptyPixels, 0, 0),
      /BMP encoding failed.*No pixel data provided/,
      "Should reject empty pixel data"
    );
  });

  it("throws error for invalid dimensions", () => {
    const pixels = new Uint8Array([255, 0, 0, 255]);

    assert.throws(() => encodeBMP(pixels, 0, 1), /BMP encoding failed.*Invalid width: 0/, "Should reject zero width");

    assert.throws(
      () => encodeBMP(pixels, 1, -1),
      /BMP encoding failed.*Invalid height: -1/,
      "Should reject negative height"
    );
  });

  it("throws error for mismatched pixel data size", () => {
    const wrongSizePixels = new Uint8Array([255, 0, 0, 255]); // Only 1 pixel, but expecting 2x2 = 4 pixels

    assert.throws(
      () => encodeBMP(wrongSizePixels, 2, 2),
      /BMP encoding failed.*Pixel data length mismatch/,
      "Should reject mismatched pixel data size"
    );
  });

  it("handles resolution parameters", () => {
    const width = 1;
    const height = 1;
    const pixels = new Uint8Array([255, 0, 0, 255]);

    const result = encodeBMP(pixels, width, height, {
      hasAlpha: false,
      xResolution: 300,
      yResolution: 300,
    });

    const infoOffset = 14;
    const xRes =
      result[infoOffset + 24] |
      (result[infoOffset + 25] << 8) |
      (result[infoOffset + 26] << 16) |
      (result[infoOffset + 27] << 24);
    const yRes =
      result[infoOffset + 28] |
      (result[infoOffset + 29] << 8) |
      (result[infoOffset + 30] << 16) |
      (result[infoOffset + 31] << 24);

    assert.equal(xRes, 300, "Should set X resolution");
    assert.equal(yRes, 300, "Should set Y resolution");
  });

  it("creates BMP with correct row padding", () => {
    const width = 3; // 3 pixels * 3 bytes = 9 bytes per row, needs padding to 12 bytes
    const height = 1;
    const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);

    const result = encodeBMP(pixels, width, height, { hasAlpha: false });

    // Row size should be padded to 4-byte boundary: ceil(9/4)*4 = 12
    const rowSize = 12;
    const pixelDataSize = rowSize * height;
    const expectedTotalSize = 54 + pixelDataSize; // 54 = headers

    assert.equal(result.length, expectedTotalSize, "Should have correct total size with padding");

    // Verify data offset
    const dataOffset = result[10] | (result[11] << 8) | (result[12] << 16) | (result[13] << 24);
    assert.equal(dataOffset, 54, "Data offset should account for headers");
  });

  it("stores pixels in bottom-up order", () => {
    const width = 1;
    const height = 2;
    const pixels = new Uint8Array([
      255,
      0,
      0,
      255, // Top pixel: Red
      0,
      255,
      0,
      255, // Bottom pixel: Green
    ]);

    const result = encodeBMP(pixels, width, height, { hasAlpha: false });

    const dataOffset = 54; // Standard BMP headers
    const rowSize = 4; // 1 pixel * 3 bytes + 1 byte padding

    // Bottom row should be first (Green pixel)
    assert.equal(result[dataOffset], 0, "Bottom row B");
    assert.equal(result[dataOffset + 1], 255, "Bottom row G");
    assert.equal(result[dataOffset + 2], 0, "Bottom row R");

    // Top row should be second (Red pixel: 255, 0, 0 -> BGR: 0, 0, 255)
    assert.equal(result[dataOffset + rowSize], 0, "Top row B");
    assert.equal(result[dataOffset + rowSize + 1], 0, "Top row G");
    assert.equal(result[dataOffset + rowSize + 2], 255, "Top row R");
  });

  it("converts RGBA to BGR format correctly", () => {
    const width = 1;
    const height = 1;
    const pixels = new Uint8Array([64, 128, 192, 255]); // RGBA: Dusty blue with full alpha

    const result = encodeBMP(pixels, width, height, { hasAlpha: false });

    const dataOffset = 54;
    // Should be stored as BGR: 192, 128, 64
    assert.equal(result[dataOffset], 192, "Should store B");
    assert.equal(result[dataOffset + 1], 128, "Should store G");
    assert.equal(result[dataOffset + 2], 64, "Should store R");
  });

  it("converts RGBA to BGRA format correctly", () => {
    const width = 1;
    const height = 1;
    const pixels = new Uint8Array([64, 128, 192, 200]); // RGBA: Dusty blue with semi-transparent alpha

    const result = encodeBMP(pixels, width, height, { hasAlpha: true });

    const dataOffset = 54;
    // Should be stored as BGRA: 192, 128, 64, 200
    assert.equal(result[dataOffset], 192, "Should store B");
    assert.equal(result[dataOffset + 1], 128, "Should store G");
    assert.equal(result[dataOffset + 2], 64, "Should store R");
    assert.equal(result[dataOffset + 3], 200, "Should store A");
  });
});
