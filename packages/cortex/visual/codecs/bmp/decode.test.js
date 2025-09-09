/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for BMP decode function.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { decodeBMP, encodeBMP } from "./index.js";

/**
 * Create a simple test BMP buffer (24-bit, 2x2 pixels)
 */
function createTestBmpBuffer() {
  // 2x2 pixel BMP with red, green, blue, white pattern
  const width = 2;
  const height = 2;
  const bitCount = 24;
  const _bytesPerPixel = 3;

  // Calculate sizes
  const rowSize = Math.floor((width * bitCount + 31) / 32) * 4; // 4-byte aligned
  const pixelDataSize = rowSize * height;
  const fileHeaderSize = 14;
  const infoHeaderSize = 40;
  const dataOffset = fileHeaderSize + infoHeaderSize;
  const totalSize = dataOffset + pixelDataSize;

  const buffer = new Uint8Array(totalSize);

  // BMP File Header
  buffer[0] = 0x42; // 'B'
  buffer[1] = 0x4d; // 'M'
  // bfSize (total size) - offset 2-5
  buffer[2] = totalSize & 0xff;
  buffer[3] = (totalSize >> 8) & 0xff;
  buffer[4] = (totalSize >> 16) & 0xff;
  buffer[5] = (totalSize >> 24) & 0xff;
  // bfReserved1/2 - offset 6-9 (0)
  // bfOffBits - offset 10-13
  buffer[10] = dataOffset & 0xff;
  buffer[11] = (dataOffset >> 8) & 0xff;
  buffer[12] = (dataOffset >> 16) & 0xff;
  buffer[13] = (dataOffset >> 24) & 0xff;

  // BMP Info Header
  const infoOffset = 14;
  // biSize - offset 14-17 (40)
  buffer[infoOffset] = 40;
  // biWidth - offset 18-21
  buffer[infoOffset + 4] = width & 0xff;
  buffer[infoOffset + 5] = (width >> 8) & 0xff;
  // biHeight - offset 22-25
  buffer[infoOffset + 8] = height & 0xff;
  buffer[infoOffset + 9] = (height >> 8) & 0xff;
  // biPlanes - offset 26-27 (1)
  buffer[infoOffset + 12] = 1;
  // biBitCount - offset 28-29 (24)
  buffer[infoOffset + 14] = bitCount;
  // biCompression - offset 30-33 (0)
  // biSizeImage - offset 34-37
  buffer[infoOffset + 20] = pixelDataSize & 0xff;
  buffer[infoOffset + 21] = (pixelDataSize >> 8) & 0xff;
  buffer[infoOffset + 22] = (pixelDataSize >> 16) & 0xff;
  buffer[infoOffset + 23] = (pixelDataSize >> 24) & 0xff;

  // Pixel data (BGR format, bottom-up)
  // Row 1 (bottom): Blue(255,0,0) Green(0,255,0)
  const row1Offset = dataOffset + 0 * rowSize;
  buffer[row1Offset] = 255; // B
  buffer[row1Offset + 1] = 0; // G
  buffer[row1Offset + 2] = 0; // R  <- Blue pixel
  buffer[row1Offset + 3] = 0; // B
  buffer[row1Offset + 4] = 255; // G
  buffer[row1Offset + 5] = 0; // R  <- Green pixel

  // Row 0 (top): White(255,255,255) Black(0,0,0)
  const row0Offset = dataOffset + 1 * rowSize;
  buffer[row0Offset] = 0; // B
  buffer[row0Offset + 1] = 0; // G
  buffer[row0Offset + 2] = 0; // R  <- Black pixel
  buffer[row0Offset + 3] = 255; // B
  buffer[row0Offset + 4] = 255; // G
  buffer[row0Offset + 5] = 255; // R  <- White pixel

  return buffer;
}

/**
 * Create a 32-bit test BMP buffer with alpha
 */
function createTestBmpBuffer32() {
  const width = 2;
  const height = 2;
  const bitCount = 32;
  const bytesPerPixel = 4;

  const rowSize = width * bytesPerPixel; // 32-bit doesn't need padding
  const pixelDataSize = rowSize * height;
  const fileHeaderSize = 14;
  const infoHeaderSize = 40;
  const dataOffset = fileHeaderSize + infoHeaderSize;
  const totalSize = dataOffset + pixelDataSize;

  const buffer = new Uint8Array(totalSize);

  // BMP File Header
  buffer[0] = 0x42;
  buffer[1] = 0x4d;
  buffer[2] = totalSize & 0xff;
  buffer[3] = (totalSize >> 8) & 0xff;
  buffer[4] = (totalSize >> 16) & 0xff;
  buffer[5] = (totalSize >> 24) & 0xff;
  buffer[10] = dataOffset & 0xff;
  buffer[11] = (dataOffset >> 8) & 0xff;
  buffer[12] = (dataOffset >> 16) & 0xff;
  buffer[13] = (dataOffset >> 24) & 0xff;

  // BMP Info Header
  const infoOffset = 14;
  buffer[infoOffset] = 40;
  buffer[infoOffset + 4] = width & 0xff;
  buffer[infoOffset + 5] = (width >> 8) & 0xff;
  buffer[infoOffset + 8] = height & 0xff;
  buffer[infoOffset + 9] = (height >> 8) & 0xff;
  buffer[infoOffset + 12] = 1;
  buffer[infoOffset + 14] = bitCount;
  buffer[infoOffset + 20] = pixelDataSize & 0xff;
  buffer[infoOffset + 21] = (pixelDataSize >> 8) & 0xff;
  buffer[infoOffset + 22] = (pixelDataSize >> 16) & 0xff;
  buffer[infoOffset + 23] = (pixelDataSize >> 24) & 0xff;

  // Pixel data (BGRA format, bottom-up)
  const dataStart = dataOffset;
  // Row 1: Semi-transparent red, semi-transparent green
  buffer[dataStart] = 255;
  buffer[dataStart + 1] = 0;
  buffer[dataStart + 2] = 0;
  buffer[dataStart + 3] = 128; // BGRA
  buffer[dataStart + 4] = 0;
  buffer[dataStart + 5] = 255;
  buffer[dataStart + 6] = 0;
  buffer[dataStart + 7] = 128;
  // Row 0: Opaque white, transparent
  buffer[dataStart + 8] = 255;
  buffer[dataStart + 9] = 255;
  buffer[dataStart + 10] = 255;
  buffer[dataStart + 11] = 255;
  buffer[dataStart + 12] = 0;
  buffer[dataStart + 13] = 0;
  buffer[dataStart + 14] = 0;
  buffer[dataStart + 15] = 0;

  return buffer;
}

describe("BMP decode function", () => {
  it("decodes valid 24-bit BMP buffer to RGBA pixels", () => {
    const bmpBuffer = createTestBmpBuffer();
    const result = decodeBMP(bmpBuffer);

    assert(result.pixels instanceof Uint8Array, "Should return Uint8Array pixels");
    assert.equal(result.width, 2, "Should decode correct width");
    assert.equal(result.height, 2, "Should decode correct height");
    assert(typeof result.metadata === "object", "Should return metadata object");

    // Check pixel data size
    const expectedPixelCount = 2 * 2 * 4; // 2x2 RGBA
    assert.equal(result.pixels.length, expectedPixelCount, "Pixel data size should match dimensions");

    // Check metadata
    assert.equal(result.metadata.format, "bmp");
    assert.equal(result.metadata.bitDepth, 24);
    assert.equal(result.metadata.compression, "none");
    assert.equal(result.metadata.hasAlpha, false);

    // Check pixel values (should be RGBA)
    // Top-left: Black -> (0, 0, 0, 255)
    assert.equal(result.pixels[0], 0); // R
    assert.equal(result.pixels[1], 0); // G
    assert.equal(result.pixels[2], 0); // B
    assert.equal(result.pixels[3], 255); // A

    // Top-right: White -> (255, 255, 255, 255)
    assert.equal(result.pixels[4], 255); // R
    assert.equal(result.pixels[5], 255); // G
    assert.equal(result.pixels[6], 255); // B
    assert.equal(result.pixels[7], 255); // A

    // Bottom-left: Blue -> (0, 0, 255, 255)
    assert.equal(result.pixels[8], 0); // R
    assert.equal(result.pixels[9], 0); // G
    assert.equal(result.pixels[10], 255); // B
    assert.equal(result.pixels[11], 255); // A

    // Bottom-right: Green -> (0, 255, 0, 255)
    assert.equal(result.pixels[12], 0); // R
    assert.equal(result.pixels[13], 255); // G
    assert.equal(result.pixels[14], 0); // B
    assert.equal(result.pixels[15], 255); // A
  });

  it("decodes valid 32-bit BMP buffer to RGBA pixels", () => {
    const bmpBuffer = createTestBmpBuffer32();
    const result = decodeBMP(bmpBuffer);

    assert.equal(result.width, 2, "Should decode correct width");
    assert.equal(result.height, 2, "Should decode correct height");
    assert.equal(result.metadata.bitDepth, 32);
    assert.equal(result.metadata.hasAlpha, true);

    // Check pixel values with alpha
    // Top-left: Opaque white -> (255, 255, 255, 255)
    assert.equal(result.pixels[0], 255);
    assert.equal(result.pixels[1], 255);
    assert.equal(result.pixels[2], 255);
    assert.equal(result.pixels[3], 255);

    // Top-right: Transparent -> (0, 0, 0, 0)
    assert.equal(result.pixels[4], 0);
    assert.equal(result.pixels[5], 0);
    assert.equal(result.pixels[6], 0);
    assert.equal(result.pixels[7], 0);

    // Bottom-left: Semi-transparent red -> (0, 0, 255, 128)
    assert.equal(result.pixels[8], 0);
    assert.equal(result.pixels[9], 0);
    assert.equal(result.pixels[10], 255);
    assert.equal(result.pixels[11], 128);

    // Bottom-right: Semi-transparent green -> (0, 255, 0, 128)
    assert.equal(result.pixels[12], 0);
    assert.equal(result.pixels[13], 255);
    assert.equal(result.pixels[14], 0);
    assert.equal(result.pixels[15], 128);
  });

  it("throws error for invalid BMP signature", () => {
    // Create buffer large enough to pass size check but with invalid signature
    const invalidBuffer = new Uint8Array(60); // 60 bytes should be enough
    invalidBuffer[0] = 0x00; // Invalid signature (should be 'B')
    invalidBuffer[1] = 0x01; // Invalid signature (should be 'M')

    assert.throws(
      () => decodeBMP(invalidBuffer),
      /BMP decoding failed.*Invalid BMP signature/,
      "Should reject invalid BMP signature"
    );
  });

  it("throws error for empty buffer", () => {
    const emptyBuffer = new Uint8Array(0);

    assert.throws(
      () => decodeBMP(emptyBuffer),
      /BMP decoding failed.*BMP file too small/,
      "Should reject empty buffer"
    );
  });

  it("throws error for buffer too small", () => {
    const smallBuffer = new Uint8Array(10);

    assert.throws(
      () => decodeBMP(smallBuffer),
      /BMP decoding failed.*BMP file too small/,
      "Should reject buffer too small"
    );
  });

  it("throws error for unsupported bit depth", () => {
    const bmpBuffer = createTestBmpBuffer();
    // Modify bit depth to unsupported value (16)
    bmpBuffer[28] = 16; // biBitCount

    assert.throws(
      () => decodeBMP(bmpBuffer),
      /BMP decoding failed.*Unsupported BMP bit depth: 16/,
      "Should reject unsupported bit depth"
    );
  });

  it("throws error for compressed BMP", () => {
    const bmpBuffer = createTestBmpBuffer();
    // Set compression to 1 (RLE)
    bmpBuffer[30] = 1; // biCompression

    assert.throws(
      () => decodeBMP(bmpBuffer),
      /BMP decoding failed.*Unsupported BMP compression: 1/,
      "Should reject compressed BMP"
    );
  });

  it("handles ArrayBuffer input", () => {
    const bmpBuffer = createTestBmpBuffer();
    const arrayBuffer = bmpBuffer.buffer.slice(bmpBuffer.byteOffset, bmpBuffer.byteOffset + bmpBuffer.byteLength);

    const result = decodeBMP(arrayBuffer);

    assert(result.pixels instanceof Uint8Array, "Should handle ArrayBuffer input");
    assert.equal(result.width, 2, "Should decode successfully from ArrayBuffer");
    assert.equal(result.height, 2, "Should decode successfully from ArrayBuffer");
  });

  it("round-trips through encode/decode correctly", () => {
    // Create RGBA pixels
    const width = 3;
    const height = 2;
    const pixels = new Uint8Array(width * height * 4);
    // Fill with test pattern: Red, Green, Blue, White, Black, Magenta
    pixels.set([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255], 0); // Row 0
    pixels.set([255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 255, 255], 12); // Row 1

    // Encode to BMP (24-bit)
    const bmpBuffer = encodeBMP(pixels, width, height, { hasAlpha: false });

    // Decode back
    const decoded = decodeBMP(bmpBuffer);

    // Should match original dimensions
    assert.equal(decoded.width, width);
    assert.equal(decoded.height, height);

    // Check that RGB values match (alpha ignored in 24-bit)
    for (let i = 0; i < pixels.length; i += 4) {
      assert.equal(decoded.pixels[i], pixels[i], `R mismatch at pixel ${i / 4}`);
      assert.equal(decoded.pixels[i + 1], pixels[i + 1], `G mismatch at pixel ${i / 4}`);
      assert.equal(decoded.pixels[i + 2], pixels[i + 2], `B mismatch at pixel ${i / 4}`);
      assert.equal(decoded.pixels[i + 3], 255, `A should be 255 in 24-bit BMP at pixel ${i / 4}`);
    }
  });
});
