/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JPEG decode function.
 */

import assert from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { decodeJPEG } from "./decode.js";

describe("JPEG decode function", () => {
  it("decodes valid JPEG buffer to RGBA pixels", async () => {
    // Use the test JPEG from the media folder
    const jpegBuffer = readFileSync("../../../media/integration-example-small.jpeg");

    const result = await decodeJPEG(jpegBuffer);

    assert(result.pixels instanceof Uint8Array, "Should return Uint8Array pixels");
    assert(typeof result.width === "number" && result.width > 0, "Should return valid width");
    assert(typeof result.height === "number" && result.height > 0, "Should return valid height");
    assert(typeof result.metadata === "object", "Should return metadata object");

    // Check pixel data size matches dimensions (RGBA = 4 bytes per pixel)
    const expectedPixelCount = result.width * result.height * 4;
    assert.equal(result.pixels.length, expectedPixelCount, "Pixel data size should match dimensions");
  });

  it("throws error for invalid JPEG signature", async () => {
    const invalidBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

    await assert.rejects(
      async () => await decodeJPEG(invalidBuffer),
      /JPEG decoding failed/,
      "Should reject invalid JPEG signature"
    );
  });

  it("throws error for empty buffer", async () => {
    const emptyBuffer = new Uint8Array(0);

    await assert.rejects(
      async () => await decodeJPEG(emptyBuffer),
      /JPEG decoding failed/,
      "Should reject empty buffer"
    );
  });

  it("handles ArrayBuffer input", async () => {
    const jpegBuffer = readFileSync("../../../media/integration-example-small.jpeg");
    const arrayBuffer = jpegBuffer.buffer.slice(jpegBuffer.byteOffset, jpegBuffer.byteOffset + jpegBuffer.byteLength);

    const result = await decodeJPEG(arrayBuffer);

    assert(result.pixels instanceof Uint8Array, "Should handle ArrayBuffer input");
    assert(result.width > 0 && result.height > 0, "Should decode successfully from ArrayBuffer");
  });

  it("returns valid metadata", async () => {
    const jpegBuffer = readFileSync("../../../media/integration-example-small.jpeg");

    const { metadata } = await decodeJPEG(jpegBuffer);

    assert(typeof metadata.progressive === "boolean", "Should include progressive flag");
    assert(typeof metadata.precision === "number", "Should include precision");
    assert(typeof metadata.components === "number", "Should include component count");
    assert(typeof metadata.quality === "string", "Should include quality info");
  });
});
