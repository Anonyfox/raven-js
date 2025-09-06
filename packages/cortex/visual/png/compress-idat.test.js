/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for PNG IDAT compression with DEFLATE.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
  benchmarkCompressionLevels,
  compressToIDATChunks,
  compressWithDEFLATE,
  createIDATChunks,
  estimateCompressionRatio,
  optimizeCompressionSettings,
  validateCompressedData,
} from "./compress-idat.js";

describe("PNG IDAT Compression", () => {
  describe("compressWithDEFLATE", () => {
    it("compresses data successfully", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const compressed = await compressWithDEFLATE(testData);

      assert(compressed instanceof Uint8Array, "Should return Uint8Array");
      assert(compressed.length > 0, "Should produce compressed data");
      assert(compressed.length < testData.length + 20, "Should not expand data significantly");
    });

    it("handles empty data", async () => {
      const emptyData = new Uint8Array(0);
      const compressed = await compressWithDEFLATE(emptyData);

      assert(compressed instanceof Uint8Array, "Should return Uint8Array");
      assert(compressed.length > 0, "Should produce zlib header even for empty data");
    });

    it("compresses repetitive data efficiently", async () => {
      const repetitiveData = new Uint8Array(1000).fill(42);
      const compressed = await compressWithDEFLATE(repetitiveData);

      assert(compressed.length < repetitiveData.length / 10, "Should compress repetitive data well");
    });

    it("handles different compression levels", async () => {
      const testData = new Uint8Array(100).fill(123);

      const level0 = await compressWithDEFLATE(testData, 0);
      const level9 = await compressWithDEFLATE(testData, 9);

      assert(level0.length >= level9.length, "Higher compression level should not increase size");
    });

    it("validates parameters", async () => {
      const testData = new Uint8Array([1, 2, 3]);

      await assert.rejects(() => compressWithDEFLATE("not uint8array"), TypeError);
      await assert.rejects(() => compressWithDEFLATE(testData, -1), /level must be an integer/);
      await assert.rejects(() => compressWithDEFLATE(testData, 10), /level must be an integer/);
      await assert.rejects(() => compressWithDEFLATE(testData, 1.5), /level must be an integer/);
    });

    it("produces valid zlib format", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const compressed = await compressWithDEFLATE(testData);

      assert(validateCompressedData(compressed), "Should produce valid zlib format");
    });
  });

  describe("createIDATChunks", () => {
    it("splits data into chunks correctly", () => {
      const data = new Uint8Array(1000).fill(42);
      const chunks = createIDATChunks(data, 300);

      assert.equal(chunks.length, 4, "Should create 4 chunks for 1000 bytes with 300-byte limit");
      assert.equal(chunks[0].length, 300, "First chunk should be 300 bytes");
      assert.equal(chunks[1].length, 300, "Second chunk should be 300 bytes");
      assert.equal(chunks[2].length, 300, "Third chunk should be 300 bytes");
      assert.equal(chunks[3].length, 100, "Last chunk should be 100 bytes");
    });

    it("handles data smaller than chunk size", () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const chunks = createIDATChunks(data, 1000);

      assert.equal(chunks.length, 1, "Should create single chunk");
      assert.equal(chunks[0].length, 5, "Chunk should contain all data");
      assert.deepEqual(chunks[0], data, "Chunk should match original data");
    });

    it("handles empty data", () => {
      const data = new Uint8Array(0);
      const chunks = createIDATChunks(data, 1000);

      assert.equal(chunks.length, 1, "Should create single chunk for empty data");
      assert.equal(chunks[0].length, 0, "Chunk should be empty");
    });

    it("uses default chunk size", () => {
      const data = new Uint8Array(100000); // 100KB
      const chunks = createIDATChunks(data);

      assert(chunks.length >= 2, "Should split large data with default chunk size");
      assert(chunks[0].length <= 65536, "Chunks should not exceed default size");
    });

    it("validates parameters", () => {
      const data = new Uint8Array([1, 2, 3]);

      assert.throws(() => createIDATChunks("not uint8array"), TypeError);
      assert.throws(() => createIDATChunks(data, 0), /maxChunkSize must be a positive integer/);
      assert.throws(() => createIDATChunks(data, -1), /maxChunkSize must be a positive integer/);
      assert.throws(() => createIDATChunks(data, 1.5), /maxChunkSize must be a positive integer/);
    });
  });

  describe("compressToIDATChunks", () => {
    it("compresses and chunks data", async () => {
      const testData = new Uint8Array(1000).fill(42);
      const chunks = await compressToIDATChunks(testData, { maxChunkSize: 100 });

      assert(Array.isArray(chunks), "Should return array of chunks");
      assert(chunks.length > 0, "Should create at least one chunk");
      assert(
        chunks.every((chunk) => chunk instanceof Uint8Array),
        "All chunks should be Uint8Array"
      );
    });

    it("handles compression options", async () => {
      const testData = new Uint8Array(100).fill(123);

      const defaultChunks = await compressToIDATChunks(testData);
      const level0Chunks = await compressToIDATChunks(testData, { level: 0 });
      const level9Chunks = await compressToIDATChunks(testData, { level: 9 });

      assert(defaultChunks.length > 0, "Default compression should work");
      assert(level0Chunks.length > 0, "Level 0 compression should work");
      assert(level9Chunks.length > 0, "Level 9 compression should work");
    });

    it("validates parameters", async () => {
      await assert.rejects(() => compressToIDATChunks("not uint8array"), TypeError);
    });
  });

  describe("estimateCompressionRatio", () => {
    it("calculates compression ratio correctly", async () => {
      const repetitiveData = new Uint8Array(1000).fill(42);
      const stats = await estimateCompressionRatio(repetitiveData);

      assert.equal(stats.originalSize, 1000, "Should report correct original size");
      assert(stats.compressedSize > 0, "Should report compressed size");
      assert(stats.ratio > 0 && stats.ratio < 1, "Should have good compression ratio for repetitive data");
      assert.equal(stats.compressedSize / stats.originalSize, stats.ratio, "Ratio should match calculation");
    });

    it("handles random data", async () => {
      const randomData = new Uint8Array(1000);
      for (let i = 0; i < randomData.length; i++) {
        randomData[i] = Math.floor(Math.random() * 256);
      }

      const stats = await estimateCompressionRatio(randomData);

      assert(stats.ratio > 0.8, "Random data should not compress well");
      assert(stats.ratio <= 1.2, "Should not expand significantly");
    });

    it("handles empty data", async () => {
      const emptyData = new Uint8Array(0);
      const stats = await estimateCompressionRatio(emptyData);

      assert.equal(stats.originalSize, 0, "Should report zero original size");
      assert.equal(stats.compressedSize, 0, "Should report zero compressed size");
      assert.equal(stats.ratio, 0, "Should report zero ratio");
    });

    it("validates parameters", async () => {
      await assert.rejects(() => estimateCompressionRatio("not uint8array"), TypeError);
    });
  });

  describe("validateCompressedData", () => {
    it("validates correct zlib format", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const compressed = await compressWithDEFLATE(testData);

      assert(validateCompressedData(compressed), "Should validate correct zlib data");
    });

    it("rejects invalid data", () => {
      assert(!validateCompressedData(new Uint8Array([1, 2, 3])), "Should reject too short data");
      assert(!validateCompressedData(new Uint8Array([0, 0, 0, 0, 0, 0])), "Should reject invalid header");
      assert(!validateCompressedData("not uint8array"), "Should reject non-Uint8Array");
    });

    it("checks zlib header fields", () => {
      // Valid zlib header: CMF=0x78, FLG=0x9C (common values)
      const validHeader = new Uint8Array([0x78, 0x9c, 0x01, 0x00, 0x00, 0xff, 0xff]);
      assert(validateCompressedData(validHeader), "Should accept valid zlib header");

      // Invalid compression method
      const invalidCM = new Uint8Array([0x79, 0x9c, 0x01, 0x00, 0x00, 0xff, 0xff]);
      assert(!validateCompressedData(invalidCM), "Should reject invalid compression method");

      // Invalid checksum
      const invalidChecksum = new Uint8Array([0x78, 0x9d, 0x01, 0x00, 0x00, 0xff, 0xff]);
      assert(!validateCompressedData(invalidChecksum), "Should reject invalid checksum");
    });
  });

  describe("benchmarkCompressionLevels", () => {
    it("benchmarks all compression levels", async () => {
      const testData = new Uint8Array(1000).fill(42);
      const results = await benchmarkCompressionLevels(testData);

      assert.equal(results.length, 10, "Should test levels 0-9");
      assert(
        results.every((r) => typeof r.level === "number"),
        "Should report level"
      );
      assert(
        results.every((r) => typeof r.size === "number"),
        "Should report size"
      );
      assert(
        results.every((r) => typeof r.time === "number"),
        "Should report time"
      );
      assert(
        results.every((r) => r.level >= 0 && r.level <= 9),
        "Levels should be 0-9"
      );
    });

    it("shows compression trade-offs", async () => {
      const testData = new Uint8Array(1000).fill(123);
      const results = await benchmarkCompressionLevels(testData);

      const level0 = results.find((r) => r.level === 0);
      const level9 = results.find((r) => r.level === 9);

      // Note: Timing can be variable, so we focus on compression ratio
      assert(level0.size >= level9.size, "Level 9 should compress better than or equal to level 0");
      assert(level0.time >= 0 && level9.time >= 0, "Both levels should report valid times");
    });

    it("validates parameters", async () => {
      await assert.rejects(() => benchmarkCompressionLevels("not uint8array"), TypeError);
    });
  });

  describe("optimizeCompressionSettings", () => {
    it("finds optimal compression level", async () => {
      const testData = new Uint8Array(1000).fill(42);
      const optimal = await optimizeCompressionSettings(testData);

      assert(typeof optimal.level === "number", "Should return level");
      assert(optimal.level >= 0 && optimal.level <= 9, "Level should be 0-9");
      assert(typeof optimal.expectedSize === "number", "Should return expected size");
      assert(typeof optimal.expectedTime === "number", "Should return expected time");
    });

    it("respects constraints", async () => {
      const testData = new Uint8Array(100).fill(123);
      const optimal = await optimizeCompressionSettings(testData, {
        targetRatio: 0.1,
        maxTime: 10,
      });

      assert(optimal.level >= 0, "Should find valid level even with strict constraints");
    });

    it("validates parameters", async () => {
      await assert.rejects(() => optimizeCompressionSettings("not uint8array"), TypeError);
    });
  });

  describe("Integration Tests", () => {
    it("compresses realistic PNG scanline data", async () => {
      // Simulate filtered scanline data for 100x100 RGBA image
      const width = 100;
      const height = 100;
      const bytesPerPixel = 4;
      const scanlineWidth = width * bytesPerPixel + 1; // +1 for filter byte
      const totalSize = height * scanlineWidth;

      const filteredData = new Uint8Array(totalSize);
      let offset = 0;

      // Fill with realistic filtered data
      for (let y = 0; y < height; y++) {
        filteredData[offset++] = 1; // Sub filter

        for (let x = 0; x < width; x++) {
          // Simulate filtered RGBA values (small differences)
          filteredData[offset++] = (x + y) % 32; // R
          filteredData[offset++] = (x * 2) % 16; // G
          filteredData[offset++] = (y * 3) % 8; // B
          filteredData[offset++] = 0; // A (no change)
        }
      }

      const chunks = await compressToIDATChunks(filteredData);

      assert(chunks.length > 0, "Should create IDAT chunks");
      assert(
        chunks.every((chunk) => chunk.length > 0),
        "All chunks should have data"
      );

      // Calculate total compressed size
      const totalCompressed = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const compressionRatio = totalCompressed / totalSize;

      assert(compressionRatio < 0.8, "Should achieve reasonable compression on filtered data");
    });

    it("handles large images efficiently", async () => {
      // Simulate 500x500 RGB image
      const width = 500;
      const height = 500;
      const bytesPerPixel = 3;
      const scanlineWidth = width * bytesPerPixel + 1;
      const totalSize = height * scanlineWidth;

      const filteredData = new Uint8Array(totalSize);
      filteredData.fill(0); // Simulate None filter with black image

      const startTime = performance.now();
      const chunks = await compressToIDATChunks(filteredData, { level: 1 }); // Fast compression
      const endTime = performance.now();

      assert(chunks.length > 0, "Should create chunks for large image");
      assert(endTime - startTime < 1000, "Should compress large image reasonably fast");

      // Check chunk sizes are reasonable
      assert(
        chunks.every((chunk) => chunk.length <= 65536),
        "Chunks should respect size limit"
      );
    });

    it("produces deterministic results", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const chunks1 = await compressToIDATChunks(testData, { level: 6 });
      const chunks2 = await compressToIDATChunks(testData, { level: 6 });

      assert.equal(chunks1.length, chunks2.length, "Should produce same number of chunks");
      for (let i = 0; i < chunks1.length; i++) {
        assert.deepEqual(chunks1[i], chunks2[i], `Chunk ${i} should be identical`);
      }
    });
  });
});
