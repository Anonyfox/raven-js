/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for visual module API surface.
 *
 * Tests the new codec-based architecture with pure functions
 * for encoding and decoding different image formats.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { decodeJPEG, decodePNG, encodePNG, Image } from "./index.js";

describe("Visual module exports", () => {
  it("exports base Image class", () => {
    assert.equal(typeof Image, "function", "Should export Image class");
  });

  it("exports PNG codec functions", () => {
    assert.equal(typeof decodePNG, "function", "Should export decodePNG function");
    assert.equal(typeof encodePNG, "function", "Should export encodePNG function");
  });

  it("exports JPEG codec functions", () => {
    assert.equal(typeof decodeJPEG, "function", "Should export decodeJPEG function");
  });

  it("Image class has expected methods", () => {
    const image = new Image();
    assert.equal(typeof image.resize, "function", "Should have resize method");
    assert.equal(typeof image.crop, "function", "Should have crop method");
    assert.equal(typeof image.rotate, "function", "Should have rotate method");
    assert.equal(typeof image.flip, "function", "Should have flip method");
    // Image class exists and has basic structure
    assert(image instanceof Image, "Should be instance of Image class");
  });
});
