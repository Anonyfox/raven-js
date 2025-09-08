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
  analyzeProgressiveScan,
  determineProgressiveScanType,
  PROGRESSIVE_LIMITS,
  PROGRESSIVE_SCAN_TYPES,
  PROGRESSIVE_STATES,
  ProgressiveDecoder,
  ProgressiveMetrics,
  validateProgressiveScanParameters,
} from "./progressive-decode.js";

describe("Progressive JPEG Decoding", () => {
  describe("Constants and Definitions", () => {
    it("defines progressive scan types", () => {
      assert.equal(PROGRESSIVE_SCAN_TYPES.DC_FIRST, "dc_first");
      assert.equal(PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE, "ac_progressive");
      assert.equal(PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT, "sa_refinement");
      assert.equal(PROGRESSIVE_SCAN_TYPES.COMBINED, "combined");
      assert.equal(PROGRESSIVE_SCAN_TYPES.SEQUENTIAL, "sequential");
    });

    it("defines progressive states", () => {
      assert.equal(PROGRESSIVE_STATES.INITIAL, "initial");
      assert.equal(PROGRESSIVE_STATES.DC_PROCESSING, "dc_processing");
      assert.equal(PROGRESSIVE_STATES.AC_PROCESSING, "ac_processing");
      assert.equal(PROGRESSIVE_STATES.REFINEMENT, "refinement");
      assert.equal(PROGRESSIVE_STATES.COMPLETED, "completed");
      assert.equal(PROGRESSIVE_STATES.ERROR, "error");
    });

    it("defines progressive limits", () => {
      assert.equal(PROGRESSIVE_LIMITS.MAX_SPECTRAL_START, 63);
      assert.equal(PROGRESSIVE_LIMITS.MAX_SPECTRAL_END, 63);
      assert.equal(PROGRESSIVE_LIMITS.MAX_APPROXIMATION_HIGH, 13);
      assert.equal(PROGRESSIVE_LIMITS.MAX_APPROXIMATION_LOW, 0);
      assert.equal(PROGRESSIVE_LIMITS.MAX_SCANS, 64);
    });
  });

  describe("Progressive Scan Type Detection", () => {
    it("detects sequential scan", () => {
      const scanType = determineProgressiveScanType(0, 63, 0, 0, 3);
      assert.equal(scanType, PROGRESSIVE_SCAN_TYPES.SEQUENTIAL);
    });

    it("detects DC-first scan", () => {
      const scanType = determineProgressiveScanType(0, 0, 0, 0, 1);
      assert.equal(scanType, PROGRESSIVE_SCAN_TYPES.DC_FIRST);
    });

    it("detects AC progressive scan", () => {
      const scanType = determineProgressiveScanType(1, 5, 0, 0, 1);
      assert.equal(scanType, PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE);
    });

    it("detects successive approximation refinement", () => {
      const scanType = determineProgressiveScanType(0, 0, 1, 0, 1);
      assert.equal(scanType, PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT);
    });

    it("detects combined progressive scan", () => {
      const scanType = determineProgressiveScanType(1, 10, 2, 1, 1);
      assert.equal(scanType, PROGRESSIVE_SCAN_TYPES.COMBINED);
    });

    it("throws on invalid parameter types", () => {
      assert.throws(() => {
        determineProgressiveScanType("0", 63, 0, 0, 3);
      }, /Progressive scan parameters must be numbers/);
    });
  });

  describe("Progressive Scan Parameter Validation", () => {
    it("validates correct parameters", () => {
      assert.doesNotThrow(() => {
        validateProgressiveScanParameters(0, 63, 0, 0);
      });

      assert.doesNotThrow(() => {
        validateProgressiveScanParameters(1, 5, 2, 1);
      });
    });

    it("throws on invalid spectral start", () => {
      assert.throws(() => {
        validateProgressiveScanParameters(-1, 63, 0, 0);
      }, /Invalid spectral start/);

      assert.throws(() => {
        validateProgressiveScanParameters(64, 63, 0, 0);
      }, /Invalid spectral start/);
    });

    it("throws on invalid spectral end", () => {
      assert.throws(() => {
        validateProgressiveScanParameters(0, -1, 0, 0);
      }, /Invalid spectral end/);

      assert.throws(() => {
        validateProgressiveScanParameters(0, 64, 0, 0);
      }, /Invalid spectral end/);
    });

    it("throws on invalid spectral range", () => {
      assert.throws(() => {
        validateProgressiveScanParameters(10, 5, 0, 0);
      }, /Spectral start 10 cannot be greater than spectral end 5/);
    });

    it("throws on invalid approximation high", () => {
      assert.throws(() => {
        validateProgressiveScanParameters(0, 63, -1, 0);
      }, /Invalid approximation high/);

      assert.throws(() => {
        validateProgressiveScanParameters(0, 63, 14, 0);
      }, /Invalid approximation high/);
    });

    it("throws on invalid approximation low", () => {
      assert.throws(() => {
        validateProgressiveScanParameters(0, 63, 2, -1);
      }, /Invalid approximation low/);

      assert.throws(() => {
        validateProgressiveScanParameters(0, 63, 2, 3);
      }, /Invalid successive approximation/);
    });

    it("validates sequential scan parameters", () => {
      assert.throws(() => {
        validateProgressiveScanParameters(0, 63, 1, 0);
      }, /Sequential scan must have Ah=0, Al=0/);
    });
  });

  describe("Progressive Decoder", () => {
    /**
     * Create test components for progressive decoder.
     * @returns {Array} Test components
     */
    function createTestComponents() {
      return [
        { id: 1, samplingFactorH: 2, samplingFactorV: 2 }, // Y component
        { id: 2, samplingFactorH: 1, samplingFactorV: 1 }, // Cb component
        { id: 3, samplingFactorH: 1, samplingFactorV: 1 }, // Cr component
      ];
    }

    /**
     * Create test scan data.
     * @param {Object} params - Scan parameters
     * @returns {Object} Test scan data
     */
    function createTestScanData(params = {}) {
      const {
        spectralStart = 0,
        spectralEnd = 0,
        approximationHigh = 0,
        approximationLow = 0,
        componentIds = [1],
        blockCount = 4,
      } = params;

      const coefficients = new Map();

      for (const componentId of componentIds) {
        const blocks = [];
        for (let i = 0; i < blockCount; i++) {
          const block = new Int16Array(64);
          // Add some test coefficient data
          if (spectralStart === 0 && spectralEnd === 0) {
            // DC scan
            block[0] = 100 + i * 10; // DC coefficient
          } else if (spectralStart > 0) {
            // AC scan
            for (let k = spectralStart; k <= spectralEnd; k++) {
              block[k] = (k + i) * 5;
            }
          } else {
            // Full scan
            for (let k = 0; k < 64; k++) {
              block[k] = k + i;
            }
          }
          blocks.push(block);
        }
        coefficients.set(componentId, blocks);
      }

      return {
        spectralStart,
        spectralEnd,
        approximationHigh,
        approximationLow,
        componentIds,
        coefficients,
      };
    }

    it("creates progressive decoder", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(640, 480, components);

      assert.equal(decoder.imageWidth, 640);
      assert.equal(decoder.imageHeight, 480);
      assert.equal(decoder.components.length, 3);
      assert.equal(decoder.state, PROGRESSIVE_STATES.INITIAL);
      assert.equal(decoder.scansProcessed, 0);
    });

    it("throws on invalid constructor parameters", () => {
      const components = createTestComponents();

      assert.throws(() => {
        new ProgressiveDecoder(0, 480, components);
      }, /Image width must be positive integer/);

      assert.throws(() => {
        new ProgressiveDecoder(640, -1, components);
      }, /Image height must be positive integer/);

      assert.throws(() => {
        new ProgressiveDecoder(640, 480, []);
      }, /Components must be non-empty array/);
    });

    it("initializes coefficient buffers", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);

      const buffers = decoder.getCoefficientBuffers();
      assert.equal(buffers.size, 3);

      // Check Y component (2x2 sampling)
      const yBlocks = buffers.get(1);
      assert(Array.isArray(yBlocks));
      assert(yBlocks.length > 0);
      assert(yBlocks[0] instanceof Int16Array);
      assert.equal(yBlocks[0].length, 64);

      // Check Cb component (1x1 sampling)
      const cbBlocks = buffers.get(2);
      assert(Array.isArray(cbBlocks));
      assert(cbBlocks.length > 0);
    });

    it("processes DC-first scan", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);
      const scanData = createTestScanData({
        spectralStart: 0,
        spectralEnd: 0,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
      });

      const result = decoder.processScan(scanData);

      assert.equal(result.scanType, PROGRESSIVE_SCAN_TYPES.DC_FIRST);
      assert(result.qualityImprovement > 0);
      assert(result.completionPercentage > 0);
      assert.equal(result.intermediateAvailable, true);
      assert.equal(decoder.state, PROGRESSIVE_STATES.DC_PROCESSING);
    });

    it("processes AC progressive scan", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);
      const scanData = createTestScanData({
        spectralStart: 1,
        spectralEnd: 5,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
      });

      const result = decoder.processScan(scanData);

      assert.equal(result.scanType, PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE);
      assert(result.qualityImprovement > 0);
      assert(result.completionPercentage > 0);
      assert.equal(decoder.state, PROGRESSIVE_STATES.AC_PROCESSING);
    });

    it("processes successive approximation refinement scan", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);

      // First process initial DC scan with successive approximation
      const initialScan = createTestScanData({
        spectralStart: 0,
        spectralEnd: 0,
        approximationHigh: 0,
        approximationLow: 2, // Start with 2-bit reduced precision
        componentIds: [1],
      });
      decoder.processScan(initialScan);

      // Then process refinement scan
      const refinementScan = createTestScanData({
        spectralStart: 0,
        spectralEnd: 0,
        approximationHigh: 1,
        approximationLow: 0, // Refine with 1-bit precision improvement
        componentIds: [1],
      });

      const result = decoder.processScan(refinementScan);

      assert.equal(result.scanType, PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT);
      assert(result.qualityImprovement >= 0);
      assert.equal(decoder.state, PROGRESSIVE_STATES.REFINEMENT);
    });

    it("processes sequential scan", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);
      const scanData = createTestScanData({
        spectralStart: 0,
        spectralEnd: 63,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1, 2, 3],
      });

      const result = decoder.processScan(scanData);

      assert.equal(result.scanType, PROGRESSIVE_SCAN_TYPES.SEQUENTIAL);
      assert.equal(result.qualityImprovement, 100);
      assert.equal(result.completionPercentage, 100);
      assert.equal(result.intermediateAvailable, true);
      assert.equal(decoder.state, PROGRESSIVE_STATES.COMPLETED);
    });

    it("validates scan sequence", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);
      const scanData = createTestScanData();

      // Process same scan twice
      decoder.processScan(scanData);

      assert.throws(() => {
        decoder.processScan(scanData);
      }, /Duplicate progressive scan/);
    });

    it("handles missing coefficient data", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);
      const scanData = createTestScanData({ componentIds: [1] });

      // Remove coefficient data
      scanData.coefficients.delete(1);

      assert.throws(() => {
        decoder.processScan(scanData);
      }, /Missing coefficient data for component 1/);
    });

    it("generates summary information", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);

      const initialSummary = decoder.getSummary();
      assert.equal(initialSummary.state, PROGRESSIVE_STATES.INITIAL);
      assert.equal(initialSummary.scansProcessed, 0);
      assert.equal(initialSummary.completionPercentage, 0);
      assert.equal(initialSummary.canGenerateIntermediate, false);

      // Process a scan
      const scanData = createTestScanData();
      decoder.processScan(scanData);

      const updatedSummary = decoder.getSummary();
      assert.equal(updatedSummary.scansProcessed, 1);
      assert(updatedSummary.completionPercentage > 0);
      assert.equal(updatedSummary.canGenerateIntermediate, true);
      assert(updatedSummary.scanTypes.includes(PROGRESSIVE_SCAN_TYPES.DC_FIRST));
    });

    it("resets decoder state", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);

      // Process some scans
      const scanData = createTestScanData();
      decoder.processScan(scanData);

      assert.equal(decoder.scansProcessed, 1);
      assert.equal(decoder.state, PROGRESSIVE_STATES.DC_PROCESSING);

      // Reset decoder
      decoder.reset();

      assert.equal(decoder.scansProcessed, 0);
      assert.equal(decoder.state, PROGRESSIVE_STATES.INITIAL);
      assert.equal(decoder.scanHistory.length, 0);

      // Check coefficient buffers are cleared
      const buffers = decoder.getCoefficientBuffers();
      for (const [, blocks] of buffers) {
        for (const block of blocks) {
          assert(block.every((coeff) => coeff === 0));
        }
      }
    });

    it("handles error states", () => {
      const components = createTestComponents();
      const decoder = new ProgressiveDecoder(16, 16, components);

      // Invalid scan parameters
      const invalidScan = {
        spectralStart: 70, // Invalid
        spectralEnd: 0,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
        coefficients: new Map(),
      };

      assert.throws(() => {
        decoder.processScan(invalidScan);
      });

      assert.equal(decoder.state, PROGRESSIVE_STATES.ERROR);
      assert(decoder.errors.length > 0);
    });
  });

  describe("Progressive Metrics", () => {
    it("creates progressive metrics analyzer", () => {
      const metrics = new ProgressiveMetrics();

      assert.equal(metrics.totalScans, 0);
      assert.equal(metrics.dcScans, 0);
      assert.equal(metrics.acScans, 0);
      assert.equal(metrics.refinementScans, 0);
      assert.equal(metrics.averageQualityImprovement, 0);
      assert.equal(metrics.totalDecodeTime, 0);
      assert.equal(metrics.errors.length, 0);
    });

    it("records scan processing", () => {
      const metrics = new ProgressiveMetrics();

      metrics.recordScan(PROGRESSIVE_SCAN_TYPES.DC_FIRST, 30, 10);
      metrics.recordScan(PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE, 20, 15);
      metrics.recordScan(PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT, 5, 5);

      assert.equal(metrics.totalScans, 3);
      assert.equal(metrics.dcScans, 1);
      assert.equal(metrics.acScans, 1);
      assert.equal(metrics.refinementScans, 1);
      assert.equal(metrics.totalDecodeTime, 30);
      assert.equal(metrics.averageQualityImprovement, (30 + 20 + 5) / 3);
    });

    it("records errors", () => {
      const metrics = new ProgressiveMetrics();

      metrics.recordError("Test error 1");
      metrics.recordError("Test error 2");

      assert.equal(metrics.errors.length, 2);
      assert.equal(metrics.errors[0], "Test error 1");
      assert.equal(metrics.errors[1], "Test error 2");
    });

    it("generates summary statistics", () => {
      const metrics = new ProgressiveMetrics();

      metrics.recordScan(PROGRESSIVE_SCAN_TYPES.DC_FIRST, 40, 10);
      metrics.recordScan(PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE, 20, 20);
      metrics.recordError("Test error");

      const summary = metrics.getSummary();

      assert.equal(summary.totalScans, 2);
      assert.equal(summary.averageQualityImprovement, 30);
      assert.equal(summary.totalDecodeTime, 30);
      assert.equal(summary.averageTimePerScan, 15);
      assert.equal(summary.errorCount, 1);
      assert(summary.efficiency > 0);
      assert(summary.description.includes("2 scans"));
    });

    it("resets metrics", () => {
      const metrics = new ProgressiveMetrics();

      metrics.recordScan(PROGRESSIVE_SCAN_TYPES.DC_FIRST, 30, 10);
      metrics.recordError("Test error");

      assert.equal(metrics.totalScans, 1);
      assert.equal(metrics.errors.length, 1);

      metrics.reset();

      assert.equal(metrics.totalScans, 0);
      assert.equal(metrics.errors.length, 0);
      assert.equal(metrics.averageQualityImprovement, 0);
    });
  });

  describe("Progressive Scan Analysis", () => {
    it("analyzes DC-first scan", () => {
      const scanParameters = {
        spectralStart: 0,
        spectralEnd: 0,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
      };

      const analysis = analyzeProgressiveScan(scanParameters);

      assert.equal(analysis.scanType, PROGRESSIVE_SCAN_TYPES.DC_FIRST);
      assert.equal(analysis.frequencyRange, "DC only");
      assert.equal(analysis.approximationLevel, "Full precision");
      assert.equal(analysis.componentCount, 1);
      assert.equal(analysis.qualityImpact, "High (preview quality)");
      assert.equal(analysis.displaySuitability, "Excellent for preview");
    });

    it("analyzes AC progressive scan", () => {
      const scanParameters = {
        spectralStart: 1,
        spectralEnd: 5,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1, 2],
      };

      const analysis = analyzeProgressiveScan(scanParameters);

      assert.equal(analysis.scanType, PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE);
      assert.equal(analysis.frequencyRange, "Low frequency AC");
      assert.equal(analysis.approximationLevel, "Full precision");
      assert.equal(analysis.componentCount, 2);
      assert.equal(analysis.qualityImpact, "Medium-High (structural detail)");
      assert.equal(analysis.displaySuitability, "Good for progressive display");
    });

    it("analyzes successive approximation scan", () => {
      const scanParameters = {
        spectralStart: 0,
        spectralEnd: 0,
        approximationHigh: 2,
        approximationLow: 1,
        componentIds: [1],
      };

      const analysis = analyzeProgressiveScan(scanParameters);

      assert.equal(analysis.scanType, PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT);
      assert.equal(analysis.frequencyRange, "DC only");
      assert.equal(analysis.approximationLevel, "3-bit precision");
      assert.equal(analysis.qualityImpact, "Low-Medium (precision refinement)");
    });

    it("analyzes sequential scan", () => {
      const scanParameters = {
        spectralStart: 0,
        spectralEnd: 63,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1, 2, 3],
      };

      const analysis = analyzeProgressiveScan(scanParameters);

      assert.equal(analysis.scanType, PROGRESSIVE_SCAN_TYPES.SEQUENTIAL);
      assert.equal(analysis.frequencyRange, "Full spectrum");
      assert.equal(analysis.approximationLevel, "Full precision");
      assert.equal(analysis.componentCount, 3);
      assert.equal(analysis.displaySuitability, "Complete image");
    });

    it("analyzes mid-frequency AC scan", () => {
      const scanParameters = {
        spectralStart: 6,
        spectralEnd: 15,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
      };

      const analysis = analyzeProgressiveScan(scanParameters);

      assert.equal(analysis.frequencyRange, "Mid frequency AC");
      assert.equal(analysis.displaySuitability, "Detail enhancement");
    });

    it("analyzes high-frequency AC scan", () => {
      const scanParameters = {
        spectralStart: 20,
        spectralEnd: 63,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
      };

      const analysis = analyzeProgressiveScan(scanParameters);

      assert.equal(analysis.frequencyRange, "High frequency AC");
      assert.equal(analysis.qualityImpact, "Medium (detail enhancement)");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles maximum progressive scan limits", () => {
      const components = [{ id: 1, samplingFactorH: 1, samplingFactorV: 1 }];
      const decoder = new ProgressiveDecoder(16, 16, components);

      // Test maximum spectral range
      const maxSpectralScan = createTestScanData({
        spectralStart: PROGRESSIVE_LIMITS.MAX_SPECTRAL_START,
        spectralEnd: PROGRESSIVE_LIMITS.MAX_SPECTRAL_END,
        componentIds: [1],
      });

      assert.doesNotThrow(() => {
        decoder.processScan(maxSpectralScan);
      });

      function createTestScanData(params = {}) {
        const {
          spectralStart = 0,
          spectralEnd = 0,
          approximationHigh = 0,
          approximationLow = 0,
          componentIds = [1],
        } = params;

        const coefficients = new Map();
        for (const componentId of componentIds) {
          coefficients.set(componentId, [new Int16Array(64)]);
        }

        return {
          spectralStart,
          spectralEnd,
          approximationHigh,
          approximationLow,
          componentIds,
          coefficients,
        };
      }
    });

    it("handles empty coefficient blocks", () => {
      const components = [{ id: 1, samplingFactorH: 1, samplingFactorV: 1 }];
      const decoder = new ProgressiveDecoder(8, 8, components);

      const emptyScan = {
        spectralStart: 0,
        spectralEnd: 0,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
        coefficients: new Map([[1, []]]), // Empty blocks array
      };

      const result = decoder.processScan(emptyScan);
      assert.equal(result.qualityImprovement, 0);
    });

    it("handles large image dimensions", () => {
      const components = [{ id: 1, samplingFactorH: 1, samplingFactorV: 1 }];
      const decoder = new ProgressiveDecoder(4096, 4096, components);

      assert.equal(decoder.imageWidth, 4096);
      assert.equal(decoder.imageHeight, 4096);
      assert(decoder.coefficientBuffers.get(1).length > 0);
    });

    it("handles complex subsampling patterns", () => {
      const components = [
        { id: 1, samplingFactorH: 4, samplingFactorV: 2 }, // Complex Y sampling
        { id: 2, samplingFactorH: 1, samplingFactorV: 1 }, // Cb
        { id: 3, samplingFactorH: 2, samplingFactorV: 1 }, // Cr with different sampling
      ];

      const decoder = new ProgressiveDecoder(64, 32, components);

      // Verify coefficient buffers are created properly
      const buffers = decoder.getCoefficientBuffers();
      assert.equal(buffers.size, 3);

      for (const [_componentId, blocks] of buffers) {
        assert(Array.isArray(blocks));
        assert(blocks.length > 0);
        for (const block of blocks) {
          assert(block instanceof Int16Array);
          assert.equal(block.length, 64);
        }
      }
    });

    it("handles progressive scan parameter edge cases", () => {
      // Test boundary values
      assert.doesNotThrow(() => {
        validateProgressiveScanParameters(0, 0, 0, 0);
      });

      assert.doesNotThrow(() => {
        validateProgressiveScanParameters(63, 63, 13, 0);
      });

      // Test edge case combinations
      assert.doesNotThrow(() => {
        validateProgressiveScanParameters(1, 1, 5, 4);
      });
    });

    it("handles coefficient buffer overflow protection", () => {
      const components = [{ id: 1, samplingFactorH: 1, samplingFactorV: 1 }];
      const decoder = new ProgressiveDecoder(8, 8, components);

      // Create scan with more blocks than buffer can hold
      const oversizedScan = {
        spectralStart: 0,
        spectralEnd: 0,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
        coefficients: new Map(),
      };

      // Create many more blocks than expected
      const manyBlocks = [];
      for (let i = 0; i < 1000; i++) {
        const block = new Int16Array(64);
        block[0] = i; // DC coefficient
        manyBlocks.push(block);
      }
      oversizedScan.coefficients.set(1, manyBlocks);

      // Should handle gracefully without crashing
      assert.doesNotThrow(() => {
        decoder.processScan(oversizedScan);
      });
    });

    it("validates scan type detection edge cases", () => {
      // Test mixed DC/AC with successive approximation
      const mixedScan = determineProgressiveScanType(0, 10, 1, 0, 1);
      assert.equal(mixedScan, PROGRESSIVE_SCAN_TYPES.SA_REFINEMENT);

      // Test single coefficient AC scan
      const singleAcScan = determineProgressiveScanType(1, 1, 0, 0, 1);
      assert.equal(singleAcScan, PROGRESSIVE_SCAN_TYPES.AC_PROGRESSIVE);
    });

    it("handles quality progression calculation edge cases", () => {
      const components = [{ id: 1, samplingFactorH: 1, samplingFactorV: 1 }];
      const decoder = new ProgressiveDecoder(8, 8, components);

      // Process multiple scans and check quality progression
      const dcScan = {
        spectralStart: 0,
        spectralEnd: 0,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
        coefficients: new Map([[1, [new Int16Array(64)]]]),
      };

      const result1 = decoder.processScan(dcScan);
      assert(result1.completionPercentage > 0);

      const acScan = {
        spectralStart: 1,
        spectralEnd: 63,
        approximationHigh: 0,
        approximationLow: 0,
        componentIds: [1],
        coefficients: new Map([[1, [new Int16Array(64)]]]),
      };

      const result2 = decoder.processScan(acScan);
      assert(result2.completionPercentage >= result1.completionPercentage);
    });
  });
});
