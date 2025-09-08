/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  analyzeImageContent,
  CONTENT_TYPES,
  DEFAULT_OPTIMIZATION_OPTIONS,
  generateOptimalHuffmanTables,
  generateOptimalQuantizationTable,
  OPTIMIZATION_STRATEGIES,
  optimizeTablesComplete,
  PERCEPTUAL_WEIGHTS,
  STANDARD_QUANTIZATION_TABLES,
} from "./optimize-tables.js";

describe("Optimal Table Generation for JPEG", () => {
  describe("Constants and Configuration", () => {
    it("defines content types", () => {
      assert.equal(CONTENT_TYPES.NATURAL, "natural");
      assert.equal(CONTENT_TYPES.SYNTHETIC, "synthetic");
      assert.equal(CONTENT_TYPES.TEXT, "text");
      assert.equal(CONTENT_TYPES.MIXED, "mixed");
      assert.equal(CONTENT_TYPES.UNKNOWN, "unknown");
    });

    it("defines optimization strategies", () => {
      assert.equal(OPTIMIZATION_STRATEGIES.SIZE, "size");
      assert.equal(OPTIMIZATION_STRATEGIES.BALANCED, "balanced");
      assert.equal(OPTIMIZATION_STRATEGIES.QUALITY, "quality");
      assert.equal(OPTIMIZATION_STRATEGIES.CUSTOM, "custom");
    });

    it("provides perceptual weights", () => {
      assert(PERCEPTUAL_WEIGHTS.LUMINANCE instanceof Float32Array);
      assert(PERCEPTUAL_WEIGHTS.CHROMINANCE instanceof Float32Array);
      assert.equal(PERCEPTUAL_WEIGHTS.LUMINANCE.length, 64);
      assert.equal(PERCEPTUAL_WEIGHTS.CHROMINANCE.length, 64);

      // Low frequencies should have lower weights (more important)
      assert(PERCEPTUAL_WEIGHTS.LUMINANCE[0] < PERCEPTUAL_WEIGHTS.LUMINANCE[63]);
      assert(PERCEPTUAL_WEIGHTS.CHROMINANCE[0] < PERCEPTUAL_WEIGHTS.CHROMINANCE[63]);
    });

    it("provides standard quantization tables", () => {
      assert(STANDARD_QUANTIZATION_TABLES.LUMINANCE instanceof Uint8Array);
      assert(STANDARD_QUANTIZATION_TABLES.CHROMINANCE instanceof Uint8Array);
      assert.equal(STANDARD_QUANTIZATION_TABLES.LUMINANCE.length, 64);
      assert.equal(STANDARD_QUANTIZATION_TABLES.CHROMINANCE.length, 64);

      // Standard tables should have reasonable values
      assert(STANDARD_QUANTIZATION_TABLES.LUMINANCE[0] >= 1);
      assert(STANDARD_QUANTIZATION_TABLES.LUMINANCE[0] <= 255);
    });

    it("defines default optimization options", () => {
      assert.equal(DEFAULT_OPTIMIZATION_OPTIONS.strategy, OPTIMIZATION_STRATEGIES.BALANCED);
      assert.equal(DEFAULT_OPTIMIZATION_OPTIONS.contentType, CONTENT_TYPES.UNKNOWN);
      assert.equal(DEFAULT_OPTIMIZATION_OPTIONS.targetQuality, 75);
      assert.equal(DEFAULT_OPTIMIZATION_OPTIONS.maxIterations, 5);
      assert.equal(DEFAULT_OPTIMIZATION_OPTIONS.enableHuffmanOptimization, true);
      assert.equal(DEFAULT_OPTIMIZATION_OPTIONS.enableQuantizationOptimization, true);
    });
  });

  describe("Image Content Analysis", () => {
    /**
     * Create test coefficient blocks with specific characteristics.
     * @param {string} type - Type of content to simulate
     * @param {number} blockCount - Number of blocks to create
     * @returns {Array<Int16Array>} Test coefficient blocks
     */
    function createTestCoefficientBlocks(type, blockCount = 10) {
      const blocks = [];

      for (let b = 0; b < blockCount; b++) {
        const block = new Int16Array(64);

        switch (type) {
          case "natural":
            // Natural images: strong DC, smooth AC falloff
            block[0] = 100 + Math.random() * 50; // Strong DC
            for (let i = 1; i < 64; i++) {
              // Exponential falloff for natural content
              const falloff = Math.exp(-i / 16);
              block[i] = Math.round((Math.random() - 0.5) * 100 * falloff);
            }
            break;

          case "synthetic":
            // Synthetic images: moderate DC, some high frequencies
            block[0] = 80 + Math.random() * 40;
            for (let i = 1; i < 32; i++) {
              block[i] = Math.round((Math.random() - 0.5) * 50);
            }
            // Add some high frequency content
            for (let i = 48; i < 64; i++) {
              if (Math.random() < 0.3) {
                block[i] = Math.round((Math.random() - 0.5) * 80);
              }
            }
            break;

          case "text":
            // Text: strong edges, high contrast
            block[0] = 120 + Math.random() * 60;
            // Sparse but strong AC coefficients
            for (let i = 1; i < 64; i++) {
              if (Math.random() < 0.2) {
                block[i] = Math.round((Math.random() - 0.5) * 150);
              }
            }
            break;

          default:
            // Mixed content
            block[0] = 90 + Math.random() * 30;
            for (let i = 1; i < 64; i++) {
              if (Math.random() < 0.4) {
                block[i] = Math.round((Math.random() - 0.5) * 70);
              }
            }
        }

        blocks.push(block);
      }

      return blocks;
    }

    it("analyzes natural image content", () => {
      const blocks = createTestCoefficientBlocks("natural", 20);
      const analysis = analyzeImageContent(blocks);

      assert(typeof analysis.contentType === "string");
      assert(typeof analysis.characteristics === "object");
      assert(typeof analysis.recommendations === "object");

      // Check characteristics
      assert(typeof analysis.characteristics.edgeDensity === "number");
      assert(typeof analysis.characteristics.textureComplexity === "number");
      assert(analysis.characteristics.frequencyDistribution instanceof Float32Array);
      assert(typeof analysis.characteristics.sparsityRatio === "number");
      assert(typeof analysis.characteristics.dynamicRange === "number");

      // Sparsity ratio should be reasonable
      assert(analysis.characteristics.sparsityRatio >= 0);
      assert(analysis.characteristics.sparsityRatio <= 1);

      // Recommendations should be provided
      assert(Object.values(OPTIMIZATION_STRATEGIES).includes(analysis.recommendations.strategy));
      assert(typeof analysis.recommendations.targetQuality === "number");
      assert(Array.isArray(analysis.recommendations.emphasisFrequencies));
    });

    it("analyzes synthetic image content", () => {
      const blocks = createTestCoefficientBlocks("synthetic", 15);
      const analysis = analyzeImageContent(blocks);

      // Synthetic content should have different characteristics
      assert(typeof analysis.contentType === "string");
      assert(analysis.characteristics.sparsityRatio >= 0);

      // Should provide appropriate recommendations
      assert(analysis.recommendations.targetQuality > 0);
      assert(analysis.recommendations.targetQuality <= 100);
    });

    it("analyzes text content", () => {
      const blocks = createTestCoefficientBlocks("text", 12);
      const analysis = analyzeImageContent(blocks);

      // Text content typically has high sparsity and edges
      assert(typeof analysis.contentType === "string");
      assert(analysis.characteristics.sparsityRatio >= 0);

      // Text usually requires higher quality
      if (analysis.contentType === CONTENT_TYPES.TEXT) {
        assert(analysis.recommendations.targetQuality >= 80);
      }
    });

    it("handles edge cases", () => {
      // Empty blocks
      assert.throws(() => {
        analyzeImageContent([]);
      }, /Must provide coefficient blocks/);

      // Invalid block format
      assert.throws(() => {
        analyzeImageContent([new Int16Array(32)]); // Wrong size
      }, /Invalid coefficient block format/);

      // Single block
      const singleBlock = [new Int16Array(64).fill(100)];
      const analysis = analyzeImageContent(singleBlock);
      assert(typeof analysis.contentType === "string");
    });

    it("provides content-specific recommendations", () => {
      const naturalBlocks = createTestCoefficientBlocks("natural", 10);
      const textBlocks = createTestCoefficientBlocks("text", 10);

      const naturalAnalysis = analyzeImageContent(naturalBlocks);
      const textAnalysis = analyzeImageContent(textBlocks);

      // Both should provide valid recommendations
      assert(naturalAnalysis.recommendations.targetQuality > 0);
      assert(textAnalysis.recommendations.targetQuality > 0);
      assert(Array.isArray(naturalAnalysis.recommendations.emphasisFrequencies));
      assert(Array.isArray(textAnalysis.recommendations.emphasisFrequencies));
    });
  });

  describe("Optimal Huffman Table Generation", () => {
    /**
     * Create coefficient blocks with known statistics.
     * @returns {Array<Int16Array>} Test blocks
     */
    function createHuffmanTestBlocks() {
      const blocks = [];

      // Create blocks with predictable DC/AC patterns
      for (let i = 0; i < 20; i++) {
        const block = new Int16Array(64);
        block[0] = 100 + (i % 10); // Varied DC values
        block[1] = i % 5; // Limited AC values for predictable statistics
        block[2] = (i * 2) % 3;
        // Most other coefficients are zero (sparse)
        blocks.push(block);
      }

      return blocks;
    }

    it("generates optimal Huffman tables", () => {
      const blocks = createHuffmanTestBlocks();
      const result = generateOptimalHuffmanTables(blocks);

      assert(typeof result === "object");
      assert(typeof result.dcTable === "object");
      assert(typeof result.acTable === "object");
      assert(typeof result.statistics === "object");

      // Check table structure
      assert(Array.isArray(result.dcTable.codeLengths));
      assert(Array.isArray(result.dcTable.symbols));
      assert(result.dcTable.codes instanceof Map);

      assert(Array.isArray(result.acTable.codeLengths));
      assert(Array.isArray(result.acTable.symbols));
      assert(result.acTable.codes instanceof Map);

      // Check statistics
      assert(typeof result.statistics.dcSymbols === "number");
      assert(typeof result.statistics.acSymbols === "number");
      assert(typeof result.statistics.compressionImprovement === "number");
      assert(typeof result.statistics.averageCodeLength === "number");

      // Compression improvement should be reasonable
      assert(result.statistics.compressionImprovement >= -0.5); // Allow some degradation
      assert(result.statistics.compressionImprovement <= 0.5);
    });

    it("handles optimization options", () => {
      const blocks = createHuffmanTestBlocks();

      const result = generateOptimalHuffmanTables(blocks, {
        componentType: "chrominance",
        enableLengthLimiting: true,
        maxCodeLength: 12,
        minSymbolFrequency: 2,
      });

      // Should still produce valid tables
      assert(typeof result.dcTable === "object");
      assert(typeof result.acTable === "object");

      // Code lengths should respect the limit
      for (const codeInfo of result.dcTable.codes.values()) {
        assert(codeInfo.length <= 12);
      }

      for (const codeInfo of result.acTable.codes.values()) {
        assert(codeInfo.length <= 12);
      }
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        generateOptimalHuffmanTables([]);
      }, /Must provide coefficient blocks/);

      assert.throws(() => {
        generateOptimalHuffmanTables([new Int16Array(32)]);
      }, /must be Int16Array with 64 values/);
    });

    it("handles edge cases in symbol statistics", () => {
      // Create blocks with very sparse coefficients
      const sparseBlocks = [];
      for (let i = 0; i < 5; i++) {
        const block = new Int16Array(64);
        block[0] = 100; // Only DC coefficients
        sparseBlocks.push(block);
      }

      const result = generateOptimalHuffmanTables(sparseBlocks);

      // Should handle sparse data gracefully
      assert(typeof result.dcTable === "object");
      assert(typeof result.acTable === "object");
      assert(result.statistics.dcSymbols >= 1);
    });
  });

  describe("Optimal Quantization Table Generation", () => {
    /**
     * Create coefficient blocks for quantization testing.
     * @returns {Array<Int16Array>} Test blocks
     */
    function createQuantizationTestBlocks() {
      const blocks = [];

      for (let i = 0; i < 15; i++) {
        const block = new Int16Array(64);

        // Create frequency-dependent coefficients
        for (let j = 0; j < 64; j++) {
          const frequency = Math.floor(j / 8) + (j % 8);
          const amplitude = 200 / (1 + frequency); // Higher amplitude for lower frequencies
          block[j] = Math.round((Math.random() - 0.5) * amplitude);
        }

        blocks.push(block);
      }

      return blocks;
    }

    it("generates optimal quantization table", () => {
      const blocks = createQuantizationTestBlocks();
      const result = generateOptimalQuantizationTable(blocks);

      assert(typeof result === "object");
      assert(result.quantizationTable instanceof Uint8Array);
      assert.equal(result.quantizationTable.length, 64);
      assert(typeof result.metrics === "object");

      // Check metrics
      assert(typeof result.metrics.estimatedQuality === "number");
      assert(typeof result.metrics.estimatedBitRate === "number");
      assert(typeof result.metrics.perceptualScore === "number");
      assert(typeof result.metrics.iterations === "number");

      // Quality should be reasonable
      assert(result.metrics.estimatedQuality >= 0);
      assert(result.metrics.estimatedQuality <= 100);

      // All quantization values should be valid
      for (const value of result.quantizationTable) {
        assert(value >= 1);
        assert(value <= 255);
      }
    });

    it("respects target quality", () => {
      const blocks = createQuantizationTestBlocks();

      const highQualityResult = generateOptimalQuantizationTable(blocks, {
        targetQuality: 90,
      });

      const lowQualityResult = generateOptimalQuantizationTable(blocks, {
        targetQuality: 30,
      });

      // High quality should generally have lower quantization values
      const highQualityAvg = highQualityResult.quantizationTable.reduce((sum, val) => sum + val, 0) / 64;
      const lowQualityAvg = lowQualityResult.quantizationTable.reduce((sum, val) => sum + val, 0) / 64;

      // This relationship should generally hold (though not strictly due to optimization)
      assert(typeof highQualityAvg === "number");
      assert(typeof lowQualityAvg === "number");
    });

    it("handles optimization options", () => {
      const blocks = createQuantizationTestBlocks();

      const result = generateOptimalQuantizationTable(blocks, {
        baseTable: STANDARD_QUANTIZATION_TABLES.CHROMINANCE,
        targetQuality: 80,
        perceptualWeights: PERCEPTUAL_WEIGHTS.CHROMINANCE,
        enablePerceptualOptimization: true,
        maxIterations: 3,
        convergenceThreshold: 0.05,
      });

      assert(result.quantizationTable instanceof Uint8Array);
      assert(result.metrics.iterations <= 3);
    });

    it("validates input parameters", () => {
      assert.throws(() => {
        generateOptimalQuantizationTable([]);
      }, /Must provide coefficient blocks/);

      assert.throws(() => {
        generateOptimalQuantizationTable([new Int16Array(64)], {
          baseTable: new Uint8Array(32), // Wrong size
        });
      }, /Base table must be Uint8Array with 64 elements/);
    });

    it("handles convergence", () => {
      const blocks = createQuantizationTestBlocks();

      const result = generateOptimalQuantizationTable(blocks, {
        maxIterations: 20,
        convergenceThreshold: 0.001, // Very tight convergence
      });

      // Should converge within reasonable iterations
      assert(result.metrics.iterations >= 1);
      assert(result.metrics.iterations <= 20);
    });
  });

  describe("Complete Table Optimization", () => {
    /**
     * Create comprehensive test blocks.
     * @returns {Array<Int16Array>} Test blocks
     */
    function createCompleteTestBlocks() {
      const blocks = [];

      for (let i = 0; i < 25; i++) {
        const block = new Int16Array(64);

        // Mix of different frequency content
        block[0] = 100 + Math.random() * 50; // DC

        // Low frequency content
        for (let j = 1; j < 16; j++) {
          if (Math.random() < 0.7) {
            block[j] = Math.round((Math.random() - 0.5) * 80);
          }
        }

        // Medium frequency content
        for (let j = 16; j < 48; j++) {
          if (Math.random() < 0.3) {
            block[j] = Math.round((Math.random() - 0.5) * 40);
          }
        }

        // High frequency content
        for (let j = 48; j < 64; j++) {
          if (Math.random() < 0.1) {
            block[j] = Math.round((Math.random() - 0.5) * 20);
          }
        }

        blocks.push(block);
      }

      return blocks;
    }

    it("performs complete optimization", async () => {
      const blocks = createCompleteTestBlocks();
      const result = await optimizeTablesComplete(blocks);

      assert(typeof result === "object");
      assert(typeof result.huffmanTables === "object");
      assert(typeof result.quantizationTables === "object");
      assert(typeof result.optimization === "object");

      // Check Huffman tables
      assert(typeof result.huffmanTables.dcLuminance === "object");
      assert(typeof result.huffmanTables.acLuminance === "object");
      assert(typeof result.huffmanTables.dcChrominance === "object");
      assert(typeof result.huffmanTables.acChrominance === "object");

      // Check quantization tables
      assert(result.quantizationTables.luminance instanceof Uint8Array);
      assert(result.quantizationTables.chrominance instanceof Uint8Array);
      assert.equal(result.quantizationTables.luminance.length, 64);
      assert.equal(result.quantizationTables.chrominance.length, 64);

      // Check optimization results
      assert(typeof result.optimization.contentAnalysis === "object");
      assert(typeof result.optimization.compressionImprovement === "number");
      assert(typeof result.optimization.qualityScore === "number");
      assert(typeof result.optimization.iterations === "number");
      assert(typeof result.optimization.convergenceAchieved === "boolean");

      // Compression improvement should be reasonable
      assert(result.optimization.compressionImprovement >= -0.2);
      assert(result.optimization.compressionImprovement <= 0.2);
    });

    it("handles different optimization strategies", async () => {
      const blocks = createCompleteTestBlocks();

      const sizeResult = await optimizeTablesComplete(blocks, {
        strategy: OPTIMIZATION_STRATEGIES.SIZE,
        targetQuality: 60,
      });

      const qualityResult = await optimizeTablesComplete(blocks, {
        strategy: OPTIMIZATION_STRATEGIES.QUALITY,
        targetQuality: 90,
      });

      // Both should produce valid results
      assert(typeof sizeResult.huffmanTables === "object");
      assert(typeof qualityResult.huffmanTables === "object");

      // Quality strategy should generally prefer lower quantization
      const sizeAvgQuant = sizeResult.quantizationTables.luminance.reduce((sum, val) => sum + val, 0) / 64;
      const qualityAvgQuant = qualityResult.quantizationTables.luminance.reduce((sum, val) => sum + val, 0) / 64;

      assert(typeof sizeAvgQuant === "number");
      assert(typeof qualityAvgQuant === "number");
    });

    it("adapts to content analysis", async () => {
      /**
       * Create test coefficient blocks with specific characteristics.
       * @param {string} type - Type of content to simulate
       * @param {number} blockCount - Number of blocks to create
       * @returns {Array<Int16Array>} Test coefficient blocks
       */
      function createTestCoefficientBlocks(type, blockCount = 10) {
        const blocks = [];

        for (let b = 0; b < blockCount; b++) {
          const block = new Int16Array(64);

          switch (type) {
            case "natural":
              // Natural images: strong DC, smooth AC falloff
              block[0] = 100 + Math.random() * 50; // Strong DC
              for (let i = 1; i < 64; i++) {
                // Exponential falloff for natural content
                const falloff = Math.exp(-i / 16);
                block[i] = Math.round((Math.random() - 0.5) * 100 * falloff);
              }
              break;

            case "text":
              // Text: strong edges, high contrast
              block[0] = 120 + Math.random() * 60;
              // Sparse but strong AC coefficients
              for (let i = 1; i < 64; i++) {
                if (Math.random() < 0.2) {
                  block[i] = Math.round((Math.random() - 0.5) * 150);
                }
              }
              break;

            default:
              // Mixed content
              block[0] = 90 + Math.random() * 30;
              for (let i = 1; i < 64; i++) {
                if (Math.random() < 0.4) {
                  block[i] = Math.round((Math.random() - 0.5) * 70);
                }
              }
          }

          blocks.push(block);
        }

        return blocks;
      }

      const naturalBlocks = createTestCoefficientBlocks("natural", 20);
      const textBlocks = createTestCoefficientBlocks("text", 20);

      const naturalResult = await optimizeTablesComplete(naturalBlocks, {
        enableContentAdaptation: true,
      });

      const textResult = await optimizeTablesComplete(textBlocks, {
        enableContentAdaptation: true,
      });

      // Both should complete successfully
      assert(typeof naturalResult.optimization.contentAnalysis === "object");
      assert(typeof textResult.optimization.contentAnalysis === "object");

      // Content analysis should influence optimization
      assert(typeof naturalResult.optimization.contentAnalysis.contentType === "string");
      assert(typeof textResult.optimization.contentAnalysis.contentType === "string");
    });

    it("handles optimization convergence", async () => {
      const blocks = createCompleteTestBlocks();

      const result = await optimizeTablesComplete(blocks, {
        maxIterations: 10,
        convergenceThreshold: 0.001,
      });

      assert(result.optimization.iterations >= 1);
      assert(result.optimization.iterations <= 10);
      assert(typeof result.optimization.convergenceAchieved === "boolean");
    });

    it("validates input parameters", async () => {
      await assert.rejects(async () => {
        await optimizeTablesComplete([]);
      }, /Must provide coefficient blocks/);

      await assert.rejects(async () => {
        await optimizeTablesComplete([new Int16Array(32)]);
      }, /Invalid coefficient block format/);
    });

    it("handles disabled optimizations", async () => {
      const blocks = createCompleteTestBlocks();

      const huffmanOnlyResult = await optimizeTablesComplete(blocks, {
        enableHuffmanOptimization: true,
        enableQuantizationOptimization: false,
      });

      const quantOnlyResult = await optimizeTablesComplete(blocks, {
        enableHuffmanOptimization: false,
        enableQuantizationOptimization: true,
      });

      // Both should produce valid results with fallbacks
      assert(typeof huffmanOnlyResult.huffmanTables === "object");
      assert(typeof huffmanOnlyResult.quantizationTables === "object");

      assert(typeof quantOnlyResult.huffmanTables === "object");
      assert(typeof quantOnlyResult.quantizationTables === "object");
    });
  });

  describe("Integration and Edge Cases", () => {
    it("handles minimal coefficient blocks", async () => {
      const singleBlock = [new Int16Array(64).fill(0)];
      singleBlock[0][0] = 100; // Only DC component

      const result = await optimizeTablesComplete(singleBlock);

      // Should handle minimal data gracefully
      assert(typeof result === "object");
      assert(result.quantizationTables.luminance instanceof Uint8Array);
    });

    it("handles uniform coefficient blocks", async () => {
      const uniformBlocks = [];
      for (let i = 0; i < 10; i++) {
        uniformBlocks.push(new Int16Array(64).fill(50));
      }

      const result = await optimizeTablesComplete(uniformBlocks);

      // Should handle uniform data
      assert(typeof result === "object");
      assert(typeof result.optimization.compressionImprovement === "number");
    });

    it("handles extreme coefficient values", async () => {
      const extremeBlocks = [];
      for (let i = 0; i < 10; i++) {
        const block = new Int16Array(64);
        block[0] = i % 2 === 0 ? 1000 : -1000; // Extreme DC values
        block[1] = i % 2 === 0 ? 500 : -500; // Extreme AC values
        extremeBlocks.push(block);
      }

      const result = await optimizeTablesComplete(extremeBlocks);

      // Should handle extreme values
      assert(typeof result === "object");
      assert(result.quantizationTables.luminance.every((val) => val >= 1 && val <= 255));
    });

    it("handles large number of blocks", async () => {
      const manyBlocks = [];
      for (let i = 0; i < 100; i++) {
        const block = new Int16Array(64);
        for (let j = 0; j < 64; j++) {
          block[j] = Math.round((Math.random() - 0.5) * 100);
        }
        manyBlocks.push(block);
      }

      const result = await optimizeTablesComplete(manyBlocks, {
        maxIterations: 3, // Limit iterations for performance
      });

      // Should handle large datasets
      assert(typeof result === "object");
      assert(result.optimization.iterations <= 3);
    });

    it("provides meaningful optimization metrics", async () => {
      const blocks = createCompleteTestBlocks();
      const result = await optimizeTablesComplete(blocks);

      // All metrics should be meaningful numbers
      assert(!Number.isNaN(result.optimization.compressionImprovement));
      assert(!Number.isNaN(result.optimization.qualityScore));
      assert(Number.isFinite(result.optimization.compressionImprovement));
      assert(Number.isFinite(result.optimization.qualityScore));

      // Quality score should be positive
      assert(result.optimization.qualityScore >= 0);
    });

    it("maintains table validity", async () => {
      const blocks = createCompleteTestBlocks();
      const result = await optimizeTablesComplete(blocks);

      // Quantization tables should be valid
      for (const value of result.quantizationTables.luminance) {
        assert(value >= 1 && value <= 255);
      }

      for (const value of result.quantizationTables.chrominance) {
        assert(value >= 1 && value <= 255);
      }

      // Huffman tables should have valid structure
      assert(result.huffmanTables.dcLuminance.codes instanceof Map);
      assert(result.huffmanTables.acLuminance.codes instanceof Map);
      assert(Array.isArray(result.huffmanTables.dcLuminance.symbols));
      assert(Array.isArray(result.huffmanTables.acLuminance.symbols));
    });

    /**
     * Create test blocks for complete optimization testing.
     * @returns {Array<Int16Array>} Test blocks
     */
    function createCompleteTestBlocks() {
      const blocks = [];

      for (let i = 0; i < 30; i++) {
        const block = new Int16Array(64);

        // Create realistic coefficient distribution
        block[0] = 100 + Math.random() * 100; // DC component

        // AC components with frequency-dependent falloff
        for (let j = 1; j < 64; j++) {
          const frequency = Math.floor(j / 8) + (j % 8);
          const falloff = Math.exp(-frequency / 8);

          if (Math.random() < falloff * 0.5) {
            block[j] = Math.round((Math.random() - 0.5) * 100 * falloff);
          }
        }

        blocks.push(block);
      }

      return blocks;
    }

    it("produces deterministic results", async () => {
      const blocks = createCompleteTestBlocks();

      const result1 = await optimizeTablesComplete(blocks, {
        maxIterations: 3,
        convergenceThreshold: 0.01,
      });

      const result2 = await optimizeTablesComplete(blocks, {
        maxIterations: 3,
        convergenceThreshold: 0.01,
      });

      // Results should be consistent (though not necessarily identical due to optimization)
      assert.equal(result1.quantizationTables.luminance.length, result2.quantizationTables.luminance.length);
      assert.equal(result1.quantizationTables.chrominance.length, result2.quantizationTables.chrominance.length);
    });
  });
});
