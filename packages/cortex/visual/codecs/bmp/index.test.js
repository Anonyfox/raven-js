/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com>
 */

/**
 * @file Tests for BMP codec index exports.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { decodeBMP, encodeBMP } from "./index.js";

describe("BMP codec exports", () => {
  it("exports decodeBMP function", () => {
    assert(typeof decodeBMP === "function", "Should export decodeBMP function");
  });

  it("exports encodeBMP function", () => {
    assert(typeof encodeBMP === "function", "Should export encodeBMP function");
  });

  it("functions work together correctly", () => {
    // Create simple RGBA data
    const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]); // Red, Green
    const width = 2;
    const height = 1;

    // Encode
    const bmpBuffer = encodeBMP(pixels, width, height, { hasAlpha: false });

    // Decode
    const decoded = decodeBMP(bmpBuffer);

    // Verify round-trip
    assert.equal(decoded.width, width);
    assert.equal(decoded.height, height);
    assert.equal(decoded.pixels.length, pixels.length);
  });
});
