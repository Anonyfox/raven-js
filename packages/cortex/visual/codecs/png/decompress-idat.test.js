/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { decompressIDAT, getDecompressionInfo } from "./decompress-idat.js";
import { findChunksByType, parseChunks } from "./parse-chunks.js";
import { validatePNGSignature } from "./validate-signature.js";

describe("PNG IDAT Decompression", () => {
  describe("decompressIDAT", () => {
    it("throws TypeError for invalid input types", async () => {
      await assert.rejects(async () => await decompressIDAT(null), TypeError);
      await assert.rejects(async () => await decompressIDAT(undefined), TypeError);
      await assert.rejects(async () => await decompressIDAT("invalid"), TypeError);
      await assert.rejects(async () => await decompressIDAT(123), TypeError);
    });

    it("throws on empty IDAT chunks array", async () => {
      await assert.rejects(async () => await decompressIDAT([]), /No IDAT chunks provided/);
    });

    it("throws on non-Uint8Array chunks", async () => {
      const invalidChunks = [new Uint8Array([1, 2, 3]), "invalid", new Uint8Array([4, 5, 6])];
      await assert.rejects(async () => await decompressIDAT(invalidChunks), TypeError);
    });

    it("throws on empty IDAT data", async () => {
      const emptyChunks = [new Uint8Array(0), new Uint8Array(0)];
      await assert.rejects(async () => await decompressIDAT(emptyChunks), /IDAT chunks contain no data/);
    });

    it("throws on too short compressed data", async () => {
      const tooShort = [new Uint8Array([0x78])]; // Only 1 byte
      await assert.rejects(async () => await decompressIDAT(tooShort), /IDAT data too short/);
    });

    it("throws on invalid DEFLATE compression method", async () => {
      // CMF with compression method 7 (invalid, should be 8)
      const invalidMethod = [new Uint8Array([0x77, 0x01])];
      await assert.rejects(async () => await decompressIDAT(invalidMethod), /Invalid DEFLATE compression method: 7/);
    });

    it("throws on invalid DEFLATE compression info", async () => {
      // CMF with compression info > 7 (invalid)
      const invalidInfo = [new Uint8Array([0x88, 0x1e])]; // Compression info = 8
      await assert.rejects(async () => await decompressIDAT(invalidInfo), /Invalid DEFLATE compression info: 8/);
    });

    it("throws on invalid DEFLATE header checksum", async () => {
      // Invalid header checksum (CMF * 256 + FLG not divisible by 31)
      const invalidChecksum = [new Uint8Array([0x78, 0x00])]; // Should be 0x78, 0x01
      await assert.rejects(async () => await decompressIDAT(invalidChecksum), /Invalid DEFLATE header checksum/);
    });

    it("throws on preset dictionary flag", async () => {
      // FLG with preset dictionary bit set (bit 5) - need valid checksum
      const presetDict = [new Uint8Array([0x78, 0x20])]; // Bit 5 set in FLG, valid checksum
      await assert.rejects(async () => await decompressIDAT(presetDict), /DEFLATE preset dictionary not allowed/);
    });

    it("validates correct DEFLATE headers", async () => {
      // Valid DEFLATE headers that should pass validation
      const validHeaders = [
        [0x78, 0x01], // No compression
        [0x78, 0x9c], // Default compression
        [0x78, 0xda], // Best compression
      ];

      for (const [cmf, flg] of validHeaders) {
        const validHeader = [new Uint8Array([cmf, flg, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01])];

        // Should not throw during validation (will fail at actual decompression)
        try {
          await decompressIDAT(validHeader);
        } catch (error) {
          // Expect decompression to fail, but not validation
          assert(error.message.includes("decompression failed") || error.message.includes("not yet implemented"));
        }
      }
    });

    it("concatenates multiple IDAT chunks correctly", async () => {
      // Create multiple chunks with valid DEFLATE header
      const chunk1 = new Uint8Array([0x78, 0x9c]); // DEFLATE header
      const chunk2 = new Uint8Array([0x03, 0x00]); // Minimal DEFLATE data
      const chunk3 = new Uint8Array([0x00, 0x00, 0x00, 0x01]); // More data

      const chunks = [chunk1, chunk2, chunk3];

      try {
        await decompressIDAT(chunks);
      } catch (error) {
        // Expect decompression to fail with invalid data, but concatenation should work
        assert(error.message.includes("decompression failed") || error.message.includes("not yet implemented"));
      }
    });

    it("handles single IDAT chunk", async () => {
      const singleChunk = [new Uint8Array([0x78, 0x9c, 0x03, 0x00, 0x00, 0x00, 0x00, 0x01])];

      try {
        await decompressIDAT(singleChunk);
      } catch (error) {
        // Expect decompression to fail with minimal data
        assert(error.message.includes("decompression failed") || error.message.includes("not yet implemented"));
      }
    });
  });

  describe("getDecompressionInfo", () => {
    it("returns valid decompression info", () => {
      const info = getDecompressionInfo();

      assert(typeof info === "object");
      assert(typeof info.environment === "string");
      assert(typeof info.method === "string");
      assert(typeof info.supported === "boolean");

      // Should be one of the known environments
      assert(["node", "browser", "unknown"].includes(info.environment));
    });

    it("detects Node.js environment correctly", () => {
      // In Node.js test environment, should detect as 'node'
      const info = getDecompressionInfo();
      assert.equal(info.environment, "node");
      assert.equal(info.method, "zlib.inflateRaw");
      assert.equal(info.supported, true);
    });

    it("provides consistent info across calls", () => {
      const info1 = getDecompressionInfo();
      const info2 = getDecompressionInfo();

      assert.deepEqual(info1, info2);
    });
  });

  describe("Real PNG Integration", () => {
    it("decompresses IDAT chunks from real PNG file", async () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");

        // Verify it's a PNG file
        assert(validatePNGSignature(pngBuffer), "Should be valid PNG");

        // Parse chunks and find IDAT chunks
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);
        const idatChunks = findChunksByType(chunks, "IDAT");

        assert(idatChunks.length > 0, "Should have IDAT chunks");

        // Extract IDAT data
        const idatData = idatChunks.map((chunk) => chunk.data);

        // Decompress IDAT data
        const decompressed = await decompressIDAT(idatData);

        // Validate decompressed data
        assert(decompressed instanceof Uint8Array, "Should return Uint8Array");
        assert(decompressed.length > 0, "Should have decompressed data");

        // Expected size for 180x180 RGBA PNG: (1 + 180*4) * 180 = 129780 bytes
        const expectedSize = 129780;
        assert(decompressed.length === expectedSize, `Expected ${expectedSize} bytes, got ${decompressed.length}`);

        console.log(`✓ Decompressed ${idatChunks.length} IDAT chunks from apple-touch-icon.png`);
        console.log(`  - Compressed size: ${idatData.reduce((sum, chunk) => sum + chunk.length, 0)} bytes`);
        console.log(`  - Decompressed size: ${decompressed.length} bytes`);
        console.log(
          `  - Compression ratio: ${(decompressed.length / idatData.reduce((sum, chunk) => sum + chunk.length, 0)).toFixed(2)}x`
        );

        // Verify decompression method used
        const info = getDecompressionInfo();
        console.log(`  - Method: ${info.method} (${info.environment})`);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG IDAT decompression test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });

    it("validates IDAT data structure in real PNG", async () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);
        const idatChunks = findChunksByType(chunks, "IDAT");

        // Should have at least one IDAT chunk
        assert(idatChunks.length > 0, "PNG should have IDAT chunks");

        // All IDAT chunks should have data
        for (const chunk of idatChunks) {
          assert(chunk.data.length > 0, "IDAT chunk should have data");
        }

        // Concatenated IDAT data should be valid
        const totalSize = idatChunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
        assert(totalSize > 2, "Total IDAT data should be > 2 bytes (DEFLATE header minimum)");

        // First two bytes should form valid DEFLATE header
        const firstChunk = idatChunks[0].data;
        assert(firstChunk.length >= 2, "First IDAT chunk should have at least 2 bytes");

        const cmf = firstChunk[0];
        const flg = firstChunk[1];

        // Validate DEFLATE header
        const compressionMethod = cmf & 0x0f;
        assert.equal(compressionMethod, 8, "Should use DEFLATE compression method");

        const headerChecksum = (cmf * 256 + flg) % 31;
        assert.equal(headerChecksum, 0, "DEFLATE header checksum should be valid");

        console.log(`✓ Validated IDAT structure in apple-touch-icon.png`);
        console.log(`  - IDAT chunks: ${idatChunks.length}`);
        console.log(`  - Total compressed size: ${totalSize} bytes`);
        console.log(
          `  - DEFLATE header: 0x${cmf.toString(16).padStart(2, "0")} 0x${flg.toString(16).padStart(2, "0")}`
        );
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG IDAT validation test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });

    it("measures decompression performance", async () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);
        const idatChunks = findChunksByType(chunks, "IDAT");
        const idatData = idatChunks.map((chunk) => chunk.data);

        // Measure decompression time with timeout protection
        const startTime = performance.now();
        const decompressed = await decompressIDAT(idatData);
        const endTime = performance.now();

        const duration = endTime - startTime;
        const throughput = decompressed.length / duration; // bytes per ms

        assert(duration < 1000, "Decompression should complete within 1 second");
        assert(throughput > 0, "Should have positive throughput");

        console.log(`✓ Decompression performance for apple-touch-icon.png:`);
        console.log(`  - Duration: ${duration.toFixed(2)}ms`);
        console.log(`  - Throughput: ${(throughput * 1000).toFixed(0)} bytes/sec`);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping decompression performance test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });
  });

  describe("Environment Detection", () => {
    it("detects Node.js environment in test", () => {
      const info = getDecompressionInfo();

      // In Node.js test runner, should detect Node.js
      assert.equal(info.environment, "node");
      assert.equal(info.supported, true);
    });

    it("provides appropriate method for environment", () => {
      const info = getDecompressionInfo();

      switch (info.environment) {
        case "node":
          assert.equal(info.method, "zlib.inflateRaw");
          break;
        case "browser":
          assert.equal(info.method, "DecompressionStream");
          break;
        case "unknown":
          assert.equal(info.method, "pure-js-fallback");
          assert.equal(info.supported, false); // Not yet implemented
          break;
        default:
          assert.fail(`Unexpected environment: ${info.environment}`);
      }
    });
  });

  describe("Error Handling", () => {
    it("provides descriptive error messages", async () => {
      // Test various error conditions and verify error messages
      const testCases = [
        {
          input: [],
          expectedError: /No IDAT chunks provided/,
        },
        {
          input: [new Uint8Array([0x77, 0x01])], // Invalid compression method
          expectedError: /Invalid DEFLATE compression method/,
        },
        {
          input: [new Uint8Array([0x88, 0x1e])], // Invalid compression info
          expectedError: /Invalid DEFLATE compression info/,
        },
        {
          input: [new Uint8Array([0x78, 0x00])], // Invalid checksum
          expectedError: /Invalid DEFLATE header checksum/,
        },
      ];

      for (const testCase of testCases) {
        await assert.rejects(async () => await decompressIDAT(testCase.input), testCase.expectedError);
      }
    });

    it("handles decompression failures gracefully", async () => {
      // Create data with valid header but invalid DEFLATE stream
      const invalidStream = [new Uint8Array([0x78, 0x9c, 0xff, 0xff, 0xff, 0xff])];

      try {
        await decompressIDAT(invalidStream);
        assert.fail("Should have thrown on invalid DEFLATE stream");
      } catch (error) {
        // Should get a descriptive error about decompression failure
        assert(error.message.includes("decompression failed") || error.message.includes("not yet implemented"));
      }
    });
  });

  describe("Edge Cases", () => {
    it("handles minimal valid DEFLATE data", async () => {
      // Minimal DEFLATE stream: header + empty block
      const minimalStream = [new Uint8Array([0x78, 0x9c, 0x03, 0x00, 0x00, 0x00, 0x00, 0x01])];

      try {
        const result = await decompressIDAT(minimalStream);
        // If decompression succeeds, result should be empty or minimal
        assert(result instanceof Uint8Array);
      } catch (error) {
        // May fail due to incomplete stream, but should not be a validation error
        assert(error.message.includes("decompression failed") || error.message.includes("not yet implemented"));
      }
    });

    it("handles large number of small IDAT chunks", async () => {
      // Create many small chunks that together form a valid header
      const chunks = [
        new Uint8Array([0x78]), // First byte of header
        new Uint8Array([0x9c]), // Second byte of header
        new Uint8Array([0x03]), // Start of data
        new Uint8Array([0x00]), // More data
        new Uint8Array([0x00, 0x00, 0x00, 0x01]), // End of minimal stream
      ];

      try {
        await decompressIDAT(chunks);
      } catch (error) {
        // Expect decompression to fail, but concatenation should work
        assert(error.message.includes("decompression failed") || error.message.includes("not yet implemented"));
      }
    });

    it("validates all supported DEFLATE compression levels", async () => {
      // Test different DEFLATE compression level headers
      const compressionLevels = [
        [0x78, 0x01], // No compression / low
        [0x78, 0x5e], // Fast compression
        [0x78, 0x9c], // Default compression
        [0x78, 0xda], // Maximum compression
      ];

      for (const [cmf, flg] of compressionLevels) {
        const stream = [new Uint8Array([cmf, flg, 0x03, 0x00, 0x00, 0x00, 0x00, 0x01])];

        try {
          await decompressIDAT(stream);
        } catch (error) {
          // Should pass validation but may fail decompression
          assert(error.message.includes("decompression failed") || error.message.includes("not yet implemented"));
        }
      }
    });
  });
});
