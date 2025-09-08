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
  analyzeChromaContent,
  applyBilinearFilter,
  applyBoxFilter,
  applyGaussianFilter,
  BOUNDARY_MODES,
  DEFAULT_SUBSAMPLING_OPTIONS,
  detectEdges,
  downsampleChroma,
  estimateQualityImpact,
  FILTER_TYPES,
  QUALITY_MODES,
  SUBSAMPLING_FACTORS,
  SUBSAMPLING_MODES,
  SubsamplingMetrics,
  subsampleChromaComponent,
} from "./downsample-chroma.js";

describe("Chroma Subsampling for JPEG Encoding", () => {
  describe("Constants and Definitions", () => {
    it("defines subsampling modes", () => {
      assert.equal(SUBSAMPLING_MODES.YUV444, "4:4:4");
      assert.equal(SUBSAMPLING_MODES.YUV422, "4:2:2");
      assert.equal(SUBSAMPLING_MODES.YUV420, "4:2:0");
      assert.equal(SUBSAMPLING_MODES.YUV411, "4:1:1");
    });

    it("defines filter types", () => {
      assert.equal(FILTER_TYPES.BOX, "box");
      assert.equal(FILTER_TYPES.BILINEAR, "bilinear");
      assert.equal(FILTER_TYPES.LANCZOS, "lanczos");
      assert.equal(FILTER_TYPES.GAUSSIAN, "gaussian");
    });

    it("defines boundary modes", () => {
      assert.equal(BOUNDARY_MODES.REFLECT, "reflect");
      assert.equal(BOUNDARY_MODES.ZERO, "zero");
      assert.equal(BOUNDARY_MODES.REPLICATE, "replicate");
      assert.equal(BOUNDARY_MODES.WRAP, "wrap");
    });

    it("defines quality modes", () => {
      assert.equal(QUALITY_MODES.FAST, "fast");
      assert.equal(QUALITY_MODES.FULL, "full");
      assert.equal(QUALITY_MODES.PERCEPTUAL, "perceptual");
    });

    it("defines subsampling factors", () => {
      assert.deepEqual(SUBSAMPLING_FACTORS[SUBSAMPLING_MODES.YUV444], { horizontal: 1, vertical: 1 });
      assert.deepEqual(SUBSAMPLING_FACTORS[SUBSAMPLING_MODES.YUV422], { horizontal: 2, vertical: 1 });
      assert.deepEqual(SUBSAMPLING_FACTORS[SUBSAMPLING_MODES.YUV420], { horizontal: 2, vertical: 2 });
      assert.deepEqual(SUBSAMPLING_FACTORS[SUBSAMPLING_MODES.YUV411], { horizontal: 4, vertical: 1 });
    });

    it("defines default options", () => {
      assert.equal(DEFAULT_SUBSAMPLING_OPTIONS.mode, SUBSAMPLING_MODES.YUV420);
      assert.equal(DEFAULT_SUBSAMPLING_OPTIONS.filter, FILTER_TYPES.BOX);
      assert.equal(DEFAULT_SUBSAMPLING_OPTIONS.boundary, BOUNDARY_MODES.REFLECT);
      assert.equal(DEFAULT_SUBSAMPLING_OPTIONS.quality, QUALITY_MODES.FAST);
      assert.equal(DEFAULT_SUBSAMPLING_OPTIONS.preserveEdges, false);
      assert.equal(DEFAULT_SUBSAMPLING_OPTIONS.adaptiveMode, false);
    });
  });

  describe("Filter Functions", () => {
    /**
     * Create test image data.
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {Uint8Array} Test image data
     */
    function createTestData(width, height) {
      const data = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Create gradient pattern
          data[y * width + x] = ((x + y) * 255) / (width + height - 2);
        }
      }
      return data;
    }

    describe("Box Filter", () => {
      it("applies box filter correctly", () => {
        const data = new Uint8Array([0, 50, 100, 150, 200, 255, 128, 64, 32, 96, 160, 224, 16, 80, 144, 208]);

        const result = applyBoxFilter(data, 4, 4, 0, 0, 2, 2, BOUNDARY_MODES.ZERO);

        // Should average top-left 2x2 block: (0 + 50 + 200 + 255) / 4 = 126.25 ≈ 126
        assert(Math.abs(result - 126) <= 1);
      });

      it("handles boundary conditions", () => {
        const data = new Uint8Array([100, 200, 150, 250]);

        // Test reflect boundary
        const reflectResult = applyBoxFilter(data, 2, 2, -1, -1, 2, 2, BOUNDARY_MODES.REFLECT);
        assert(typeof reflectResult === "number");
        assert(reflectResult >= 0 && reflectResult <= 255);

        // Test replicate boundary
        const replicateResult = applyBoxFilter(data, 2, 2, -1, -1, 2, 2, BOUNDARY_MODES.REPLICATE);
        assert(typeof replicateResult === "number");
        assert(replicateResult >= 0 && replicateResult <= 255);

        // Test zero boundary
        const zeroResult = applyBoxFilter(data, 2, 2, -1, -1, 2, 2, BOUNDARY_MODES.ZERO);
        assert(typeof zeroResult === "number");
        assert(zeroResult >= 0 && zeroResult <= 255);
      });

      it("handles edge cases", () => {
        const data = new Uint8Array([255]);

        const result = applyBoxFilter(data, 1, 1, 0, 0, 1, 1, BOUNDARY_MODES.ZERO);
        assert.equal(result, 255);
      });
    });

    describe("Bilinear Filter", () => {
      it("applies bilinear interpolation", () => {
        const data = new Uint8Array([0, 100, 200, 255]);

        // Sample at center (0.5, 0.5)
        const result = applyBilinearFilter(data, 2, 2, 0.5, 0.5, BOUNDARY_MODES.ZERO);

        // Should interpolate: (0 + 100 + 200 + 255) / 4 = 138.75 ≈ 139
        assert(Math.abs(result - 139) <= 1);
      });

      it("handles fractional coordinates", () => {
        const data = new Uint8Array([0, 255, 128, 64]);

        const result1 = applyBilinearFilter(data, 2, 2, 0.25, 0.25, BOUNDARY_MODES.ZERO);
        const result2 = applyBilinearFilter(data, 2, 2, 0.75, 0.75, BOUNDARY_MODES.ZERO);

        assert(typeof result1 === "number");
        assert(typeof result2 === "number");
        assert(result1 >= 0 && result1 <= 255);
        assert(result2 >= 0 && result2 <= 255);
      });

      it("handles boundary modes", () => {
        const data = new Uint8Array([100, 200, 150, 250]);

        const reflectResult = applyBilinearFilter(data, 2, 2, -0.5, -0.5, BOUNDARY_MODES.REFLECT);
        const replicateResult = applyBilinearFilter(data, 2, 2, 2.5, 2.5, BOUNDARY_MODES.REPLICATE);

        assert(typeof reflectResult === "number");
        assert(typeof replicateResult === "number");
      });
    });

    describe("Gaussian Filter", () => {
      it("applies Gaussian filter", () => {
        const data = createTestData(5, 5);

        const result = applyGaussianFilter(data, 5, 5, 2, 2, 2, 1.0, BOUNDARY_MODES.REFLECT);

        assert(typeof result === "number");
        assert(result >= 0 && result <= 255);
      });

      it("handles different sigma values", () => {
        const data = new Uint8Array([0, 128, 255, 128, 255, 128, 255, 128, 0]);

        const smallSigma = applyGaussianFilter(data, 3, 3, 1, 1, 1, 0.5, BOUNDARY_MODES.ZERO);
        const largeSigma = applyGaussianFilter(data, 3, 3, 1, 1, 1, 2.0, BOUNDARY_MODES.ZERO);

        // Larger sigma should produce more smoothing
        assert(typeof smallSigma === "number");
        assert(typeof largeSigma === "number");
      });

      it("handles boundary conditions", () => {
        const data = new Uint8Array([100, 200, 150, 250]);

        const result = applyGaussianFilter(data, 2, 2, 0, 0, 1, 1.0, BOUNDARY_MODES.REFLECT);

        assert(typeof result === "number");
        assert(result >= 0 && result <= 255);
      });
    });
  });

  describe("Edge Detection", () => {
    it("detects edges in image data", () => {
      // Create image with sharp edge
      const data = new Uint8Array([0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255]);

      const edges = detectEdges(data, 4, 4, 30);

      assert(edges instanceof Uint8Array);
      assert.equal(edges.length, 16);

      // Should detect vertical edge in the middle
      const hasEdge = Array.from(edges).some((value) => value > 0);
      assert(hasEdge);
    });

    it("handles different thresholds", () => {
      const data = new Uint8Array([100, 110, 120, 130, 105, 115, 125, 135, 110, 120, 130, 140, 115, 125, 135, 145]);

      const lowThreshold = detectEdges(data, 4, 4, 5);
      const highThreshold = detectEdges(data, 4, 4, 50);

      assert(lowThreshold instanceof Uint8Array);
      assert(highThreshold instanceof Uint8Array);

      // Low threshold should detect more edges
      const lowEdgeCount = Array.from(lowThreshold).filter((v) => v > 0).length;
      const highEdgeCount = Array.from(highThreshold).filter((v) => v > 0).length;

      assert(lowEdgeCount >= highEdgeCount);
    });

    it("handles uniform regions", () => {
      const data = new Uint8Array(16).fill(128);

      const edges = detectEdges(data, 4, 4, 30);

      // Uniform region should have no edges
      const edgeCount = Array.from(edges).filter((v) => v > 0).length;
      assert.equal(edgeCount, 0);
    });
  });

  describe("Chroma Content Analysis", () => {
    /**
     * Create test chroma data.
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {string} pattern - Pattern type
     * @returns {{cbData: Uint8Array, crData: Uint8Array}} Test chroma data
     */
    function createTestChromaData(width, height, pattern = "gradient") {
      const pixelCount = width * height;
      const cbData = new Uint8Array(pixelCount);
      const crData = new Uint8Array(pixelCount);

      for (let i = 0; i < pixelCount; i++) {
        switch (pattern) {
          case "uniform":
            cbData[i] = 128;
            crData[i] = 128;
            break;

          case "gradient":
            cbData[i] = (i % width) * (255 / width);
            crData[i] = Math.floor(i / width) * (255 / height);
            break;

          case "high-activity":
            cbData[i] = Math.random() * 255;
            crData[i] = Math.random() * 255;
            break;

          case "edges":
            cbData[i] = i % width < width / 2 ? 64 : 192;
            crData[i] = Math.floor(i / width) < height / 2 ? 64 : 192;
            break;

          default:
            cbData[i] = 128;
            crData[i] = 128;
        }
      }

      return { cbData, crData };
    }

    it("analyzes uniform chroma content", () => {
      const { cbData, crData } = createTestChromaData(8, 8, "uniform");

      const analysis = analyzeChromaContent(cbData, crData, 8, 8);

      assert(typeof analysis === "object");
      assert(typeof analysis.recommendedMode === "string");
      assert(typeof analysis.chromaActivity === "number");
      assert(typeof analysis.edgeDensity === "number");
      assert(typeof analysis.colorComplexity === "number");
      assert(typeof analysis.qualityImpact === "object");

      // Uniform content should have low activity
      assert(analysis.chromaActivity < 10);
      assert(analysis.edgeDensity < 0.1);
      assert(analysis.recommendedMode === SUBSAMPLING_MODES.YUV420);
    });

    it("analyzes high-activity chroma content", () => {
      const { cbData, crData } = createTestChromaData(8, 8, "high-activity");

      const analysis = analyzeChromaContent(cbData, crData, 8, 8);

      // High activity content should have higher metrics
      assert(analysis.chromaActivity > 0);
      assert(typeof analysis.recommendedMode === "string");
    });

    it("analyzes edge-rich content", () => {
      const { cbData, crData } = createTestChromaData(8, 8, "edges");

      const analysis = analyzeChromaContent(cbData, crData, 8, 8);

      // Edge-rich content should have higher edge density
      assert(analysis.edgeDensity > 0);
      assert(analysis.colorComplexity > 0);
    });

    it("provides quality impact estimates", () => {
      const { cbData, crData } = createTestChromaData(4, 4, "gradient");

      const analysis = analyzeChromaContent(cbData, crData, 4, 4);

      // Should have quality impact for all modes
      assert(typeof analysis.qualityImpact[SUBSAMPLING_MODES.YUV444] === "number");
      assert(typeof analysis.qualityImpact[SUBSAMPLING_MODES.YUV422] === "number");
      assert(typeof analysis.qualityImpact[SUBSAMPLING_MODES.YUV420] === "number");
      assert(typeof analysis.qualityImpact[SUBSAMPLING_MODES.YUV411] === "number");

      // More aggressive subsampling should have higher quality impact
      assert(analysis.qualityImpact[SUBSAMPLING_MODES.YUV444] <= analysis.qualityImpact[SUBSAMPLING_MODES.YUV422]);
      assert(analysis.qualityImpact[SUBSAMPLING_MODES.YUV422] <= analysis.qualityImpact[SUBSAMPLING_MODES.YUV420]);
    });
  });

  describe("Component Subsampling", () => {
    it("subsamples chroma component with 4:2:0 mode", () => {
      const data = new Uint8Array([100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250]);

      const result = subsampleChromaComponent(
        data,
        4,
        4,
        SUBSAMPLING_MODES.YUV420,
        FILTER_TYPES.BOX,
        BOUNDARY_MODES.ZERO
      );

      assert(result.data instanceof Uint8Array);
      assert.equal(result.width, 2); // 4/2 = 2
      assert.equal(result.height, 2); // 4/2 = 2
      assert.equal(result.data.length, 4); // 2x2
      assert.equal(result.compressionRatio, 4); // 16/4 = 4
    });

    it("subsamples chroma component with 4:2:2 mode", () => {
      const data = new Uint8Array(16).fill(128);

      const result = subsampleChromaComponent(
        data,
        4,
        4,
        SUBSAMPLING_MODES.YUV422,
        FILTER_TYPES.BOX,
        BOUNDARY_MODES.ZERO
      );

      assert.equal(result.width, 2); // 4/2 = 2
      assert.equal(result.height, 4); // 4/1 = 4
      assert.equal(result.data.length, 8); // 2x4
      assert.equal(result.compressionRatio, 2); // 16/8 = 2
    });

    it("handles 4:4:4 mode (no subsampling)", () => {
      const data = new Uint8Array(16).fill(200);

      const result = subsampleChromaComponent(
        data,
        4,
        4,
        SUBSAMPLING_MODES.YUV444,
        FILTER_TYPES.BOX,
        BOUNDARY_MODES.ZERO
      );

      assert.equal(result.width, 4);
      assert.equal(result.height, 4);
      assert.equal(result.data.length, 16);
      assert.equal(result.compressionRatio, 1); // No compression

      // Data should be identical
      assert.deepEqual(Array.from(result.data), Array.from(data));
    });

    it("handles different filter types", () => {
      const data = new Uint8Array([0, 255, 0, 255, 255, 0, 255, 0, 0, 255, 0, 255, 255, 0, 255, 0]);

      const boxResult = subsampleChromaComponent(
        data,
        4,
        4,
        SUBSAMPLING_MODES.YUV420,
        FILTER_TYPES.BOX,
        BOUNDARY_MODES.ZERO
      );

      const bilinearResult = subsampleChromaComponent(
        data,
        4,
        4,
        SUBSAMPLING_MODES.YUV420,
        FILTER_TYPES.BILINEAR,
        BOUNDARY_MODES.ZERO
      );

      const gaussianResult = subsampleChromaComponent(
        data,
        4,
        4,
        SUBSAMPLING_MODES.YUV420,
        FILTER_TYPES.GAUSSIAN,
        BOUNDARY_MODES.ZERO
      );

      assert(boxResult.data instanceof Uint8Array);
      assert(bilinearResult.data instanceof Uint8Array);
      assert(gaussianResult.data instanceof Uint8Array);

      // All should have same dimensions for same subsampling mode
      assert.equal(boxResult.width, bilinearResult.width);
      assert.equal(boxResult.height, bilinearResult.height);
      assert.equal(bilinearResult.width, gaussianResult.width);
      assert.equal(bilinearResult.height, gaussianResult.height);
    });

    it("preserves edges when requested", () => {
      const data = new Uint8Array([0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255]);

      const normalResult = subsampleChromaComponent(
        data,
        4,
        4,
        SUBSAMPLING_MODES.YUV420,
        FILTER_TYPES.BOX,
        BOUNDARY_MODES.ZERO,
        false
      );

      const edgePreservingResult = subsampleChromaComponent(
        data,
        4,
        4,
        SUBSAMPLING_MODES.YUV420,
        FILTER_TYPES.BOX,
        BOUNDARY_MODES.ZERO,
        true
      );

      assert(normalResult.data instanceof Uint8Array);
      assert(edgePreservingResult.data instanceof Uint8Array);
      assert.equal(normalResult.data.length, edgePreservingResult.data.length);
    });

    it("throws on unsupported mode", () => {
      const data = new Uint8Array([100, 200, 150, 250]);

      assert.throws(() => {
        subsampleChromaComponent(data, 2, 2, "invalid-mode", FILTER_TYPES.BOX, BOUNDARY_MODES.ZERO);
      }, /Unsupported subsampling mode/);
    });

    it("throws on unsupported filter", () => {
      const data = new Uint8Array([100, 200, 150, 250]);

      assert.throws(() => {
        subsampleChromaComponent(data, 2, 2, SUBSAMPLING_MODES.YUV420, "invalid-filter", BOUNDARY_MODES.ZERO);
      }, /Unsupported filter type/);
    });
  });

  describe("Full YCbCr Subsampling", () => {
    /**
     * Create test YCbCr data.
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {{yData: Uint8Array, cbData: Uint8Array, crData: Uint8Array}} Test YCbCr data
     */
    function createTestYCbCrData(width, height) {
      const pixelCount = width * height;
      const yData = new Uint8Array(pixelCount);
      const cbData = new Uint8Array(pixelCount);
      const crData = new Uint8Array(pixelCount);

      for (let i = 0; i < pixelCount; i++) {
        yData[i] = i % 256; // Varying luminance
        cbData[i] = 128 + ((i % 64) - 32); // Varying chroma
        crData[i] = 128 + (((i * 2) % 64) - 32); // Varying chroma
      }

      return { yData, cbData, crData };
    }

    it("performs full YCbCr subsampling", () => {
      const { yData, cbData, crData } = createTestYCbCrData(8, 8);

      const result = downsampleChroma(yData, cbData, crData, 8, 8);

      assert(result.yData instanceof Uint8Array);
      assert(result.cbData instanceof Uint8Array);
      assert(result.crData instanceof Uint8Array);

      // Y component should be unchanged
      assert.equal(result.yWidth, 8);
      assert.equal(result.yHeight, 8);
      assert.equal(result.yData.length, 64);

      // Cb and Cr should be subsampled (default 4:2:0)
      assert.equal(result.cbWidth, 4); // 8/2 = 4
      assert.equal(result.cbHeight, 4); // 8/2 = 4
      assert.equal(result.cbData.length, 16); // 4x4
      assert.equal(result.crWidth, 4);
      assert.equal(result.crHeight, 4);
      assert.equal(result.crData.length, 16);

      // Should have metadata
      assert(typeof result.metadata === "object");
      assert(typeof result.metadata.overallCompressionRatio === "number");
      assert(result.metadata.overallCompressionRatio > 1);
    });

    it("handles different subsampling modes", () => {
      const { yData, cbData, crData } = createTestYCbCrData(8, 8);

      const yuv444Result = downsampleChroma(yData, cbData, crData, 8, 8, {
        mode: SUBSAMPLING_MODES.YUV444,
      });

      const yuv422Result = downsampleChroma(yData, cbData, crData, 8, 8, {
        mode: SUBSAMPLING_MODES.YUV422,
      });

      const yuv420Result = downsampleChroma(yData, cbData, crData, 8, 8, {
        mode: SUBSAMPLING_MODES.YUV420,
      });

      // 4:4:4 - no subsampling
      assert.equal(yuv444Result.cbWidth, 8);
      assert.equal(yuv444Result.cbHeight, 8);

      // 4:2:2 - horizontal subsampling
      assert.equal(yuv422Result.cbWidth, 4);
      assert.equal(yuv422Result.cbHeight, 8);

      // 4:2:0 - horizontal + vertical subsampling
      assert.equal(yuv420Result.cbWidth, 4);
      assert.equal(yuv420Result.cbHeight, 4);

      // Compression ratios should increase with more aggressive subsampling
      assert(yuv444Result.metadata.overallCompressionRatio <= yuv422Result.metadata.overallCompressionRatio);
      assert(yuv422Result.metadata.overallCompressionRatio <= yuv420Result.metadata.overallCompressionRatio);
    });

    it("uses adaptive mode selection", () => {
      const { yData, cbData, crData } = createTestYCbCrData(8, 8);

      const result = downsampleChroma(yData, cbData, crData, 8, 8, {
        adaptiveMode: true,
      });

      assert(typeof result.metadata.mode === "string");
      assert(Object.values(SUBSAMPLING_MODES).includes(result.metadata.mode));
    });

    it("validates input parameters", () => {
      const { yData, cbData, crData } = createTestYCbCrData(4, 4);

      assert.throws(() => {
        downsampleChroma("not-array", cbData, crData, 4, 4);
      }, /YCbCr data must be Uint8Array instances/);

      assert.throws(() => {
        downsampleChroma(yData, cbData, crData, 0, 4);
      }, /Width must be positive integer/);

      assert.throws(() => {
        downsampleChroma(yData, cbData, crData, 4, -1);
      }, /Height must be positive integer/);

      assert.throws(() => {
        downsampleChroma(new Uint8Array(8), cbData, crData, 4, 4);
      }, /Insufficient YCbCr data/);
    });

    it("handles edge cases", () => {
      // Single pixel image
      const yData = new Uint8Array([100]);
      const cbData = new Uint8Array([128]);
      const crData = new Uint8Array([128]);

      const result = downsampleChroma(yData, cbData, crData, 1, 1);

      assert.equal(result.yData.length, 1);
      assert.equal(result.cbData.length, 1);
      assert.equal(result.crData.length, 1);
    });

    it("provides comprehensive metadata", () => {
      const { yData, cbData, crData } = createTestYCbCrData(8, 8);

      const result = downsampleChroma(yData, cbData, crData, 8, 8);

      const metadata = result.metadata;
      assert(typeof metadata.mode === "string");
      assert(typeof metadata.filter === "string");
      assert(typeof metadata.boundary === "string");
      assert(typeof metadata.originalSize === "number");
      assert(typeof metadata.compressedSize === "number");
      assert(typeof metadata.overallCompressionRatio === "number");
      assert(typeof metadata.processingTime === "number");
      assert(typeof metadata.dataSavings === "number");

      assert(metadata.originalSize > metadata.compressedSize);
      assert(metadata.overallCompressionRatio > 1);
      assert(metadata.dataSavings > 0);
    });
  });

  describe("Subsampling Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new SubsamplingMetrics();

      assert.equal(metrics.operationsPerformed, 0);
      assert.equal(metrics.totalPixelsProcessed, 0);
      assert.equal(metrics.totalDataSaved, 0);
      assert.equal(metrics.totalProcessingTime, 0);
      assert.deepEqual(metrics.modeUsage, {});
      assert.deepEqual(metrics.filterUsage, {});
      assert.deepEqual(metrics.compressionRatios, []);
      assert.deepEqual(metrics.processingTimes, []);
      assert.deepEqual(metrics.errors, []);
    });

    it("records subsampling operations", () => {
      const metrics = new SubsamplingMetrics();

      const metadata = {
        mode: SUBSAMPLING_MODES.YUV420,
        filter: FILTER_TYPES.BOX,
        originalSize: 192, // 64 pixels * 3 components
        compressedSize: 96, // Y=64 + Cb=16 + Cr=16
        overallCompressionRatio: 2.0,
        processingTime: 5.5,
        dataSavings: 50.0,
      };

      metrics.recordOperation(metadata);

      assert.equal(metrics.operationsPerformed, 1);
      assert.equal(metrics.totalPixelsProcessed, 64);
      assert.equal(metrics.totalDataSaved, 96);
      assert.equal(metrics.totalProcessingTime, 5.5);
      assert.equal(metrics.modeUsage[SUBSAMPLING_MODES.YUV420], 1);
      assert.equal(metrics.filterUsage[FILTER_TYPES.BOX], 1);
      assert.equal(metrics.compressionRatios[0], 2.0);
      assert.equal(metrics.processingTimes[0], 5.5);
    });

    it("records errors", () => {
      const metrics = new SubsamplingMetrics();

      metrics.recordError("Test error 1");
      metrics.recordError("Test error 2");

      assert.equal(metrics.errors.length, 2);
      assert.equal(metrics.errors[0], "Test error 1");
      assert.equal(metrics.errors[1], "Test error 2");
    });

    it("generates summary statistics", () => {
      const metrics = new SubsamplingMetrics();

      metrics.recordOperation({
        mode: SUBSAMPLING_MODES.YUV420,
        filter: FILTER_TYPES.BOX,
        originalSize: 300,
        compressedSize: 150,
        overallCompressionRatio: 2.0,
        processingTime: 10,
        dataSavings: 50.0,
      });

      metrics.recordOperation({
        mode: SUBSAMPLING_MODES.YUV422,
        filter: FILTER_TYPES.BILINEAR,
        originalSize: 600,
        compressedSize: 400,
        overallCompressionRatio: 1.5,
        processingTime: 20,
        dataSavings: 33.33,
      });

      metrics.recordError("Test error");

      const summary = metrics.getSummary();

      assert.equal(summary.operationsPerformed, 2);
      assert.equal(summary.totalPixelsProcessed, 300); // (300+600)/3
      assert.equal(summary.averageCompressionRatio, 1.75); // (2.0+1.5)/2
      assert.equal(summary.averageProcessingTime, 15); // (10+20)/2
      assert.equal(summary.errorCount, 1);
      assert(summary.description.includes("2 operations"));
      assert(typeof summary.pixelsPerSecond === "number");
    });

    it("resets metrics", () => {
      const metrics = new SubsamplingMetrics();

      metrics.recordOperation({
        mode: SUBSAMPLING_MODES.YUV420,
        filter: FILTER_TYPES.BOX,
        originalSize: 192,
        compressedSize: 96,
        overallCompressionRatio: 2.0,
        processingTime: 5,
        dataSavings: 50.0,
      });

      metrics.recordError("Test error");

      assert.equal(metrics.operationsPerformed, 1);
      assert.equal(metrics.errors.length, 1);

      metrics.reset();

      assert.equal(metrics.operationsPerformed, 0);
      assert.equal(metrics.errors.length, 0);
      assert.deepEqual(metrics.modeUsage, {});
    });
  });

  describe("Quality Impact Estimation", () => {
    it("estimates quality impact for different modes", () => {
      const cbData = new Uint8Array(16).fill(128);
      const crData = new Uint8Array(16).fill(128);

      const yuv444Impact = estimateQualityImpact(cbData, crData, 4, 4, SUBSAMPLING_MODES.YUV444);
      const yuv422Impact = estimateQualityImpact(cbData, crData, 4, 4, SUBSAMPLING_MODES.YUV422);
      const yuv420Impact = estimateQualityImpact(cbData, crData, 4, 4, SUBSAMPLING_MODES.YUV420);
      const yuv411Impact = estimateQualityImpact(cbData, crData, 4, 4, SUBSAMPLING_MODES.YUV411);

      // Quality scores should decrease with more aggressive subsampling
      assert(yuv444Impact.qualityScore >= yuv422Impact.qualityScore);
      assert(yuv422Impact.qualityScore >= yuv420Impact.qualityScore);
      assert(yuv420Impact.qualityScore >= yuv411Impact.qualityScore);

      // All should have proper structure
      for (const impact of [yuv444Impact, yuv422Impact, yuv420Impact, yuv411Impact]) {
        assert(typeof impact.qualityScore === "number");
        assert(Array.isArray(impact.expectedArtifacts));
        assert(Array.isArray(impact.recommendations));
        assert(typeof impact.suitability === "string");
        assert(impact.qualityScore >= 0 && impact.qualityScore <= 100);
      }
    });

    it("provides appropriate recommendations", () => {
      // Create high-activity chroma data
      const cbData = new Uint8Array(64);
      const crData = new Uint8Array(64);

      for (let i = 0; i < 64; i++) {
        cbData[i] = i % 2 === 0 ? 64 : 192; // High contrast
        crData[i] = i % 2 === 0 ? 192 : 64; // High contrast
      }

      const impact = estimateQualityImpact(cbData, crData, 8, 8, SUBSAMPLING_MODES.YUV420);

      assert(typeof impact.qualityScore === "number");
      assert(Array.isArray(impact.expectedArtifacts));
      assert(Array.isArray(impact.recommendations));
      assert(typeof impact.suitability === "string");
    });

    it("handles edge cases", () => {
      // Single pixel
      const cbData = new Uint8Array([128]);
      const crData = new Uint8Array([128]);

      const impact = estimateQualityImpact(cbData, crData, 1, 1, SUBSAMPLING_MODES.YUV420);

      assert(typeof impact.qualityScore === "number");
      assert(impact.qualityScore >= 0 && impact.qualityScore <= 100);
    });
  });

  describe("Integration and Performance", () => {
    it("handles large images efficiently", () => {
      const width = 64;
      const height = 64;
      const pixelCount = width * height;

      const yData = new Uint8Array(pixelCount);
      const cbData = new Uint8Array(pixelCount);
      const crData = new Uint8Array(pixelCount);

      // Fill with test pattern
      for (let i = 0; i < pixelCount; i++) {
        yData[i] = i % 256;
        cbData[i] = (i * 2) % 256;
        crData[i] = (i * 3) % 256;
      }

      const startTime = performance.now();
      const result = downsampleChroma(yData, cbData, crData, width, height);
      const endTime = performance.now();

      assert(result.yData instanceof Uint8Array);
      assert(result.cbData instanceof Uint8Array);
      assert(result.crData instanceof Uint8Array);
      assert(result.metadata.processingTime > 0);
      assert(endTime - startTime < 1000); // Should complete within 1 second
    });

    it("maintains data integrity", () => {
      const { yData, cbData, crData } = createTestYCbCrData(8, 8);

      const result = downsampleChroma(yData, cbData, crData, 8, 8);

      // Y data should be identical
      assert.deepEqual(Array.from(result.yData), Array.from(yData));

      // All output values should be in valid range
      for (const value of result.cbData) {
        assert(value >= 0 && value <= 255);
      }
      for (const value of result.crData) {
        assert(value >= 0 && value <= 255);
      }
    });

    it("handles odd dimensions", () => {
      const yData = new Uint8Array(15).fill(100); // 3x5
      const cbData = new Uint8Array(15).fill(128);
      const crData = new Uint8Array(15).fill(128);

      const result = downsampleChroma(yData, cbData, crData, 3, 5);

      assert(result.yData instanceof Uint8Array);
      assert(result.cbData instanceof Uint8Array);
      assert(result.crData instanceof Uint8Array);
      assert(result.metadata.overallCompressionRatio >= 1);
    });

    it("works with all option combinations", () => {
      const { yData, cbData, crData } = createTestYCbCrData(4, 4);

      const options = {
        mode: SUBSAMPLING_MODES.YUV422,
        filter: FILTER_TYPES.GAUSSIAN,
        boundary: BOUNDARY_MODES.REPLICATE,
        quality: QUALITY_MODES.FULL,
        preserveEdges: true,
        adaptiveMode: false,
      };

      const result = downsampleChroma(yData, cbData, crData, 4, 4, options);

      assert(result.yData instanceof Uint8Array);
      assert(result.cbData instanceof Uint8Array);
      assert(result.crData instanceof Uint8Array);
      assert.equal(result.metadata.mode, SUBSAMPLING_MODES.YUV422);
      assert.equal(result.metadata.filter, FILTER_TYPES.GAUSSIAN);
      assert.equal(result.metadata.boundary, BOUNDARY_MODES.REPLICATE);
    });

    /**
     * Create test YCbCr data.
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {{yData: Uint8Array, cbData: Uint8Array, crData: Uint8Array}} Test YCbCr data
     */
    function createTestYCbCrData(width, height) {
      const pixelCount = width * height;
      const yData = new Uint8Array(pixelCount);
      const cbData = new Uint8Array(pixelCount);
      const crData = new Uint8Array(pixelCount);

      for (let i = 0; i < pixelCount; i++) {
        yData[i] = i % 256;
        cbData[i] = 128 + ((i % 64) - 32);
        crData[i] = 128 + (((i * 2) % 64) - 32);
      }

      return { yData, cbData, crData };
    }
  });
});
