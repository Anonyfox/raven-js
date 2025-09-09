/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com>
 */

/**
 * @file BMP identity tests - Verify pixel-perfect round-trip conversion.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { Image } from "../../image.js";

describe("BMP identity tests", () => {
  it("preserves exact pixel values through encode/decode cycle (24-bit)", async () => {
    // Create a 3x3 test pattern with specific RGB values
    const width = 3;
    const height = 3;
    const originalPixels = new Uint8Array(width * height * 4);

    // Create a specific pattern:
    // Row 0: Red(255,0,0), Green(0,255,0), Blue(0,0,255)
    // Row 1: Cyan(0,255,255), Magenta(255,0,255), Yellow(255,255,0)
    // Row 2: White(255,255,255), Black(0,0,0), Gray(128,128,128)
    const testPattern = [
      [255, 0, 0, 255], // Red
      [0, 255, 0, 255], // Green
      [0, 0, 255, 255], // Blue
      [0, 255, 255, 255], // Cyan
      [255, 0, 255, 255], // Magenta
      [255, 255, 0, 255], // Yellow
      [255, 255, 255, 255], // White
      [0, 0, 0, 255], // Black
      [128, 128, 128, 255], // Gray
    ];

    for (let i = 0; i < testPattern.length; i++) {
      originalPixels.set(testPattern[i], i * 4);
    }

    // Create original image
    const originalImage = new Image(originalPixels, width, height);

    // Encode to BMP (24-bit, no alpha)
    const bmpBuffer = await originalImage.toBmpBuffer({ hasAlpha: false });

    // Verify BMP file structure
    assert(bmpBuffer.length > 0, "BMP buffer should not be empty");
    assert.equal(bmpBuffer[0], 0x42, "Should start with 'B'");
    assert.equal(bmpBuffer[1], 0x4d, "Should start with 'M'");

    // Decode back from BMP
    const decodedImage = await Image.fromBmpBuffer(bmpBuffer);

    // Verify dimensions match
    assert.equal(decodedImage.width, width, "Width should match");
    assert.equal(decodedImage.height, height, "Height should match");

    // Verify every single pixel is identical
    assert.equal(originalPixels.length, decodedImage.pixels.length, "Pixel array lengths should match");

    for (let i = 0; i < originalPixels.length; i++) {
      assert.equal(
        originalPixels[i],
        decodedImage.pixels[i],
        `Pixel data mismatch at byte ${i}: expected ${originalPixels[i]}, got ${decodedImage.pixels[i]}`
      );
    }

    // Verify file-level identity (encode the same data twice, should be identical)
    const bmpBuffer2 = await originalImage.toBmpBuffer({ hasAlpha: false });
    assert.equal(bmpBuffer.length, bmpBuffer2.length, "File sizes should be identical");

    for (let i = 0; i < bmpBuffer.length; i++) {
      assert.equal(
        bmpBuffer[i],
        bmpBuffer2[i],
        `File byte mismatch at position ${i}: ${bmpBuffer[i]} vs ${bmpBuffer2[i]}`
      );
    }
  });

  it("preserves exact pixel values through encode/decode cycle (32-bit)", async () => {
    // Create a 2x2 test pattern with RGBA values
    const width = 2;
    const height = 2;
    const originalPixels = new Uint8Array(width * height * 4);

    // Create pattern with different alpha values:
    // Row 0: Opaque red, Semi-transparent green
    // Row 1: Transparent blue, Opaque white
    const testPattern = [
      [255, 0, 0, 255], // Opaque red
      [0, 255, 0, 128], // Semi-transparent green
      [0, 0, 255, 0], // Transparent blue
      [255, 255, 255, 255], // Opaque white
    ];

    for (let i = 0; i < testPattern.length; i++) {
      originalPixels.set(testPattern[i], i * 4);
    }

    // Create original image
    const originalImage = new Image(originalPixels, width, height);

    // Encode to BMP (32-bit, with alpha)
    const bmpBuffer = await originalImage.toBmpBuffer({ hasAlpha: true });

    // Verify BMP file structure
    assert(bmpBuffer.length > 0, "BMP buffer should not be empty");
    assert.equal(bmpBuffer[0], 0x42, "Should start with 'B'");
    assert.equal(bmpBuffer[1], 0x4d, "Should start with 'M'");

    // Check bit depth in BMP header (should be 32)
    const bitCount = bmpBuffer[28] | (bmpBuffer[29] << 8);
    assert.equal(bitCount, 32, "Should be 32-bit BMP");

    // Decode back from BMP
    const decodedImage = await Image.fromBmpBuffer(bmpBuffer);

    // Verify dimensions match
    assert.equal(decodedImage.width, width, "Width should match");
    assert.equal(decodedImage.height, height, "Height should match");

    // Verify every single pixel is identical
    assert.equal(originalPixels.length, decodedImage.pixels.length, "Pixel array lengths should match");

    for (let i = 0; i < originalPixels.length; i++) {
      assert.equal(
        originalPixels[i],
        decodedImage.pixels[i],
        `Pixel data mismatch at byte ${i}: expected ${originalPixels[i]}, got ${decodedImage.pixels[i]}`
      );
    }
  });

  it("produces identical files for identical input data", async () => {
    // Create identical images
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

    const image1 = new Image(pixels, width, height);
    const image2 = new Image(pixels, width, height);

    // Encode both to BMP
    const bmp1 = await image1.toBmpBuffer({ hasAlpha: false });
    const bmp2 = await image2.toBmpBuffer({ hasAlpha: false });

    // Files should be identical
    assert.equal(bmp1.length, bmp2.length, "File sizes should be identical");

    for (let i = 0; i < bmp1.length; i++) {
      assert.equal(bmp1[i], bmp2[i], `Byte mismatch at position ${i}: ${bmp1[i]} vs ${bmp2[i]}`);
    }
  });

  it("handles edge case: single pixel image", async () => {
    const width = 1;
    const height = 1;
    const pixels = new Uint8Array([128, 64, 192, 255]); // Specific color

    const originalImage = new Image(pixels, width, height);
    const bmpBuffer = await originalImage.toBmpBuffer({ hasAlpha: false });
    const decodedImage = await Image.fromBmpBuffer(bmpBuffer);

    // Verify pixel is preserved
    for (let i = 0; i < pixels.length; i++) {
      assert.equal(
        pixels[i],
        decodedImage.pixels[i],
        `Single pixel mismatch at byte ${i}: ${pixels[i]} vs ${decodedImage.pixels[i]}`
      );
    }
  });
});
