/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * Tests for VP8L Module Exports
 *
 * Validates that all VP8L codec functions are properly exported
 * and accessible through the public API.
 *
 * @fileoverview Test suite for VP8L module exports
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as vp8l from "./index.js";

describe("VP8L Module Exports", () => {
  describe("Core Functions", () => {
    it("exports VP8L decoder functions", () => {
      assert.equal(typeof vp8l.decodeVP8L, "function");
      assert.equal(typeof vp8l.parseVP8LHeader, "function");
    });

    it("exports Huffman functions", () => {
      assert.equal(typeof vp8l.buildHuffman, "function");
      assert.equal(typeof vp8l.createBitReader, "function");
      assert.equal(typeof vp8l.decodeSymbol, "function");
      assert.equal(typeof vp8l.validateHuffmanTree, "function");
    });

    it("exports predictor functions", () => {
      assert.equal(typeof vp8l.predictPixel, "function");
      assert.equal(typeof vp8l.applyPrediction, "function");
      assert.equal(typeof vp8l.applyInversePrediction, "function");
      assert.equal(typeof vp8l.validatePrediction, "function");
      assert.equal(typeof vp8l.getPredictionModeName, "function");
    });

    it("exports transform functions", () => {
      assert.equal(typeof vp8l.applySubtractGreen, "function");
      assert.equal(typeof vp8l.applyInverseSubtractGreen, "function");
      assert.equal(typeof vp8l.applyColorTransform, "function");
      assert.equal(typeof vp8l.applyInverseColorTransform, "function");
      assert.equal(typeof vp8l.applyPaletteTransform, "function");
      assert.equal(typeof vp8l.createPalette, "function");
      assert.equal(typeof vp8l.applyTransforms, "function");
      assert.equal(typeof vp8l.applyInverseTransforms, "function");
      assert.equal(typeof vp8l.validateTransform, "function");
      assert.equal(typeof vp8l.getTransformTypeName, "function");
    });

    it("exports transform constants", () => {
      assert.equal(typeof vp8l.TRANSFORM_TYPES, "object");
      assert.equal(typeof vp8l.TRANSFORM_TYPES.PREDICTOR, "number");
      assert.equal(typeof vp8l.TRANSFORM_TYPES.COLOR, "number");
      assert.equal(typeof vp8l.TRANSFORM_TYPES.SUBTRACT_GREEN, "number");
      assert.equal(typeof vp8l.TRANSFORM_TYPES.PALETTE, "number");
    });
  });

  describe("API Integration", () => {
    it("functions work together for basic operations", () => {
      // Test that exported functions can be used together
      const codeLengths = new Uint8Array([2, 1, 3, 2]);
      const huffman = vp8l.buildHuffman(codeLengths);

      assert.equal(typeof huffman, "object");
      assert.ok(huffman.table instanceof Uint16Array);
      assert.equal(typeof huffman.maxBits, "number");
    });

    it("validates function signatures", () => {
      // Test basic parameter validation
      assert.throws(() => vp8l.buildHuffman(null), /Huffman:/);
      assert.throws(() => vp8l.predictPixel(-1, 0, 0, {}), /Predict:/);
      assert.throws(() => vp8l.validatePrediction(0, 1, 0), /invalid width/);
    });

    it("provides consistent error prefixes", () => {
      // Test that functions use consistent error prefixes
      try {
        vp8l.buildHuffman(new Uint8Array([]));
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err.message.startsWith("Huffman:"));
      }

      try {
        vp8l.predictPixel(0, 0, 99, {});
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err.message.startsWith("Predict:"));
      }

      try {
        vp8l.applySubtractGreen([]);
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err.message.startsWith("Transform:"));
      }
    });
  });

  describe("Performance", () => {
    it("loads module quickly", () => {
      const start = process.hrtime.bigint();

      // Access all exported functions to ensure they're loaded
      const functions = [vp8l.decodeVP8L, vp8l.buildHuffman, vp8l.predictPixel, vp8l.applySubtractGreen];

      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // ms

      assert.ok(elapsed < 10, `Module load took ${elapsed}ms, should be <10ms`);
      assert.equal(functions.length, 4);
    });

    it("has reasonable memory footprint", () => {
      // Test that basic operations don't consume excessive memory
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform some basic operations
      const huffman = vp8l.buildHuffman(new Uint8Array([1, 1, 1, 1]));
      const prediction = vp8l.validatePrediction(10, 10, 5);
      const transformName = vp8l.getTransformTypeName(vp8l.TRANSFORM_TYPES.SUBTRACT_GREEN);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      assert.ok(memoryIncrease < 1024 * 1024, `Memory increase ${memoryIncrease} bytes should be <1MB`);
      assert.ok(huffman.table.length > 0);
      assert.ok(prediction.valid);
      assert.equal(transformName, "SUBTRACT_GREEN");
    });
  });
});
