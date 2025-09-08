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
  BOUNDARY_MODES,
  ChromaUpsamplingMetrics,
  calculateChromaDimensions,
  determineSubsamplingMode,
  getUpsamplingummary,
  INTERPOLATION_METHODS,
  SUBSAMPLING_MODES,
  upsampleChroma,
  upsampleChromaComponents,
} from "./upsample-chroma.js";

describe("JPEG Chroma Upsampling", () => {
  describe("Constants and Mode Detection", () => {
    it("defines correct subsampling modes", () => {
      assert.equal(SUBSAMPLING_MODES.YUV444.horizontal, 1);
      assert.equal(SUBSAMPLING_MODES.YUV444.vertical, 1);
      assert.equal(SUBSAMPLING_MODES.YUV422.horizontal, 2);
      assert.equal(SUBSAMPLING_MODES.YUV422.vertical, 1);
      assert.equal(SUBSAMPLING_MODES.YUV420.horizontal, 2);
      assert.equal(SUBSAMPLING_MODES.YUV420.vertical, 2);
      assert.equal(SUBSAMPLING_MODES.YUV411.horizontal, 4);
      assert.equal(SUBSAMPLING_MODES.YUV411.vertical, 1);
    });

    it("defines correct interpolation methods", () => {
      assert.equal(INTERPOLATION_METHODS.NEAREST, "nearest");
      assert.equal(INTERPOLATION_METHODS.BILINEAR, "bilinear");
      assert.equal(INTERPOLATION_METHODS.BICUBIC, "bicubic");
    });

    it("defines correct boundary modes", () => {
      assert.equal(BOUNDARY_MODES.REPLICATE, "replicate");
      assert.equal(BOUNDARY_MODES.MIRROR, "mirror");
      assert.equal(BOUNDARY_MODES.ZERO, "zero");
    });

    it("determines 4:4:4 subsampling mode", () => {
      const mode = determineSubsamplingMode(2, 2, 2, 2, 2, 2);

      assert.equal(mode.mode, "YUV444");
      assert.equal(mode.horizontalRatio, 1);
      assert.equal(mode.verticalRatio, 1);
      assert(mode.description.includes("4:4:4"));
    });

    it("determines 4:2:2 subsampling mode", () => {
      const mode = determineSubsamplingMode(2, 1, 1, 1, 1, 1);

      assert.equal(mode.mode, "YUV422");
      assert.equal(mode.horizontalRatio, 2);
      assert.equal(mode.verticalRatio, 1);
      assert(mode.description.includes("4:2:2"));
    });

    it("determines 4:2:0 subsampling mode", () => {
      const mode = determineSubsamplingMode(2, 2, 1, 1, 1, 1);

      assert.equal(mode.mode, "YUV420");
      assert.equal(mode.horizontalRatio, 2);
      assert.equal(mode.verticalRatio, 2);
      assert(mode.description.includes("4:2:0"));
    });

    it("determines 4:1:1 subsampling mode", () => {
      const mode = determineSubsamplingMode(4, 1, 1, 1, 1, 1);

      assert.equal(mode.mode, "YUV411");
      assert.equal(mode.horizontalRatio, 4);
      assert.equal(mode.verticalRatio, 1);
      assert(mode.description.includes("4:1:1"));
    });

    it("determines custom subsampling mode", () => {
      const mode = determineSubsamplingMode(3, 2, 1, 1, 1, 1);

      assert.equal(mode.mode, "CUSTOM");
      assert.equal(mode.horizontalRatio, 3);
      assert.equal(mode.verticalRatio, 2);
      assert(mode.description.includes("Custom"));
    });

    it("throws on invalid sampling factors", () => {
      assert.throws(() => {
        determineSubsamplingMode(0, 1, 1, 1, 1, 1);
      }, /Sampling factors must be positive integers/);

      assert.throws(() => {
        determineSubsamplingMode(2, 1, 1, 1, 2, 1); // Cb/Cr mismatch
      }, /Cb and Cr components must have identical sampling factors/);
    });
  });

  describe("Chroma Dimension Calculation", () => {
    it("calculates dimensions for 4:4:4", () => {
      const mode = { horizontalRatio: 1, verticalRatio: 1 };
      const dims = calculateChromaDimensions(640, 480, mode);

      assert.equal(dims.width, 640);
      assert.equal(dims.height, 480);
    });

    it("calculates dimensions for 4:2:2", () => {
      const mode = { horizontalRatio: 2, verticalRatio: 1 };
      const dims = calculateChromaDimensions(640, 480, mode);

      assert.equal(dims.width, 320);
      assert.equal(dims.height, 480);
    });

    it("calculates dimensions for 4:2:0", () => {
      const mode = { horizontalRatio: 2, verticalRatio: 2 };
      const dims = calculateChromaDimensions(640, 480, mode);

      assert.equal(dims.width, 320);
      assert.equal(dims.height, 240);
    });

    it("handles odd dimensions", () => {
      const mode = { horizontalRatio: 2, verticalRatio: 2 };
      const dims = calculateChromaDimensions(641, 481, mode);

      assert.equal(dims.width, 321); // ceil(641/2)
      assert.equal(dims.height, 241); // ceil(481/2)
    });

    it("throws on invalid inputs", () => {
      const mode = { horizontalRatio: 2, verticalRatio: 2 };

      assert.throws(() => {
        calculateChromaDimensions(0, 480, mode);
      }, /Luminance dimensions must be positive/);

      assert.throws(() => {
        calculateChromaDimensions(640, 480, null);
      }, /Invalid subsampling mode/);
    });
  });

  describe("Nearest Neighbor Upsampling", () => {
    it("performs 2x upsampling", () => {
      // 2x2 input -> 4x4 output
      const input = new Uint8Array([100, 150, 200, 250]);
      const result = upsampleChroma(input, 2, 2, 4, 4, INTERPOLATION_METHODS.NEAREST);

      assert.equal(result.length, 16);

      // Each input pixel should be replicated in 2x2 blocks
      assert.equal(result[0], 100); // Top-left of first block
      assert.equal(result[1], 100);
      assert.equal(result[4], 100);
      assert.equal(result[5], 100);

      assert.equal(result[2], 150); // Top-left of second block
      assert.equal(result[3], 150);
    });

    it("handles non-integer scaling", () => {
      // 2x2 -> 3x3 (non-integer scale)
      const input = new Uint8Array([100, 150, 200, 250]);
      const result = upsampleChroma(input, 2, 2, 3, 3, INTERPOLATION_METHODS.NEAREST);

      assert.equal(result.length, 9);
      // Should produce valid pixel values
      for (let i = 0; i < 9; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });

    it("handles 1D upsampling", () => {
      // 4x1 -> 8x1 (horizontal only)
      const input = new Uint8Array([100, 120, 140, 160]);
      const result = upsampleChroma(input, 4, 1, 8, 1, INTERPOLATION_METHODS.NEAREST);

      assert.equal(result.length, 8);
      assert.equal(result[0], 100);
      assert.equal(result[1], 100);
      assert.equal(result[2], 120);
      assert.equal(result[3], 120);
    });
  });

  describe("Bilinear Upsampling", () => {
    it("performs smooth 2x upsampling", () => {
      // 2x2 input with gradient
      const input = new Uint8Array([0, 100, 150, 255]);
      const result = upsampleChroma(input, 2, 2, 4, 4, INTERPOLATION_METHODS.BILINEAR);

      assert.equal(result.length, 16);

      // Corner pixels should match exactly
      assert.equal(result[0], 0); // Top-left
      assert.equal(result[3], 100); // Top-right
      assert.equal(result[12], 150); // Bottom-left
      assert.equal(result[15], 255); // Bottom-right

      // Interior pixels should be interpolated
      assert(result[5] > 0 && result[5] < 255); // Should be interpolated
      assert(result[6] > 0 && result[6] < 255);
    });

    it("produces smooth gradients", () => {
      // Linear gradient input
      const input = new Uint8Array([0, 255]);
      const result = upsampleChroma(input, 2, 1, 4, 1, INTERPOLATION_METHODS.BILINEAR);

      assert.equal(result.length, 4);
      assert.equal(result[0], 0);
      assert.equal(result[3], 255);

      // Middle values should be interpolated
      assert(result[1] > result[0]);
      assert(result[2] > result[1]);
      assert(result[1] < result[3]);
      assert(result[2] < result[3]);
    });

    it("handles single pixel input", () => {
      const input = new Uint8Array([128]);
      const result = upsampleChroma(input, 1, 1, 3, 3, INTERPOLATION_METHODS.BILINEAR);

      assert.equal(result.length, 9);
      // All output pixels should be the same as input
      for (let i = 0; i < 9; i++) {
        assert.equal(result[i], 128);
      }
    });
  });

  describe("Bicubic Upsampling", () => {
    it("performs high-quality upsampling", () => {
      // 3x3 input for bicubic (needs neighborhood)
      const input = new Uint8Array([0, 50, 100, 75, 128, 175, 150, 200, 255]);

      const result = upsampleChroma(input, 3, 3, 6, 6, INTERPOLATION_METHODS.BICUBIC);

      assert.equal(result.length, 36);

      // Should produce valid pixel values
      for (let i = 0; i < 36; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }

      // Corner pixels should be close to original (within rounding)
      assert(Math.abs(result[0] - 0) <= 1);
      assert(Math.abs(result[35] - 255) <= 1);
    });

    it("handles edge cases gracefully", () => {
      // 2x2 input (minimal for bicubic)
      const input = new Uint8Array([64, 192, 96, 160]);
      const result = upsampleChroma(input, 2, 2, 4, 4, INTERPOLATION_METHODS.BICUBIC);

      assert.equal(result.length, 16);

      // Should produce valid pixel values (bicubic can overshoot)
      for (let i = 0; i < 16; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });
  });

  describe("Boundary Handling", () => {
    it("handles replicate boundary mode", () => {
      const input = new Uint8Array([100, 200]);
      const result = upsampleChroma(input, 1, 2, 3, 4, INTERPOLATION_METHODS.BILINEAR, BOUNDARY_MODES.REPLICATE);

      assert.equal(result.length, 12);
      // Should produce valid results without boundary artifacts
      for (let i = 0; i < 12; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });

    it("handles mirror boundary mode", () => {
      const input = new Uint8Array([50, 150]);
      const result = upsampleChroma(input, 2, 1, 4, 2, INTERPOLATION_METHODS.BILINEAR, BOUNDARY_MODES.MIRROR);

      assert.equal(result.length, 8);
      // Should produce valid results
      for (let i = 0; i < 8; i++) {
        assert(result[i] >= 0 && result[i] <= 255);
      }
    });

    it("handles zero boundary mode", () => {
      const input = new Uint8Array([100]);
      const result = upsampleChroma(input, 1, 1, 3, 3, INTERPOLATION_METHODS.BILINEAR, BOUNDARY_MODES.ZERO);

      assert.equal(result.length, 9);
      // Center pixel should be original, edges should blend toward 128
      assert.equal(result[4], 100); // Center
    });
  });

  describe("Component Upsampling", () => {
    it("upsamples both Cb and Cr components", () => {
      const cbData = new Uint8Array([100, 120, 140, 160]);
      const crData = new Uint8Array([80, 100, 120, 140]);

      const result = upsampleChromaComponents(cbData, crData, 2, 2, 4, 4);

      assert.equal(result.cb.length, 16);
      assert.equal(result.cr.length, 16);

      // Both components should be upsampled
      assert.notDeepEqual(result.cb, cbData);
      assert.notDeepEqual(result.cr, crData);

      // Should produce valid pixel values
      for (let i = 0; i < 16; i++) {
        assert(result.cb[i] >= 0 && result.cb[i] <= 255);
        assert(result.cr[i] >= 0 && result.cr[i] <= 255);
      }
    });

    it("handles no upsampling needed", () => {
      const cbData = new Uint8Array([100, 120, 140, 160]);
      const crData = new Uint8Array([80, 100, 120, 140]);

      const result = upsampleChromaComponents(cbData, crData, 2, 2, 2, 2);

      // Should return copies of original data
      assert.deepEqual(result.cb, cbData);
      assert.deepEqual(result.cr, crData);
      assert.notEqual(result.cb, cbData); // Should be different array instances
      assert.notEqual(result.cr, crData);
    });

    it("throws on mismatched component lengths", () => {
      const cbData = new Uint8Array([100, 120]);
      const crData = new Uint8Array([80, 100, 120]);

      assert.throws(() => {
        upsampleChromaComponents(cbData, crData, 2, 1, 4, 2);
      }, /Cb and Cr data must have same length/);
    });
  });

  describe("Error Handling and Validation", () => {
    it("throws on invalid chroma data type", () => {
      assert.throws(() => {
        upsampleChroma([100, 120], 2, 1, 4, 2);
      }, /Expected chroma data to be Uint8Array/);
    });

    it("throws on dimension mismatch", () => {
      const data = new Uint8Array([100, 120, 140]);

      assert.throws(() => {
        upsampleChroma(data, 2, 2, 4, 4); // 3 elements but claiming 2x2 = 4
      }, /doesn't match dimensions/);
    });

    it("throws on invalid dimensions", () => {
      const data = new Uint8Array([100]);

      assert.throws(() => {
        upsampleChroma(data, 0, 1, 2, 2);
      }, /All dimensions must be positive/);

      assert.throws(() => {
        upsampleChroma(data, 1, 1, -1, 2);
      }, /All dimensions must be positive/);
    });

    it("throws on unknown interpolation method", () => {
      const data = new Uint8Array([100]);

      assert.throws(() => {
        upsampleChroma(data, 1, 1, 2, 2, "unknown");
      }, /Unknown interpolation method/);
    });

    it("throws on unknown boundary mode", () => {
      const data = new Uint8Array([100]);

      assert.throws(() => {
        upsampleChroma(data, 1, 1, 2, 2, INTERPOLATION_METHODS.BILINEAR, "unknown");
      }, /Unknown boundary mode/);
    });
  });

  describe("Quality Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new ChromaUpsamplingMetrics();

      assert.equal(metrics.componentsProcessed, 0);
      assert.equal(metrics.totalPixelsProcessed, 0);
      assert.deepEqual(metrics.methodUsage, {});
    });

    it("records upsampling operations", () => {
      const metrics = new ChromaUpsamplingMetrics();

      metrics.recordOperation(4, 16, INTERPOLATION_METHODS.BILINEAR);
      metrics.recordOperation(9, 36, INTERPOLATION_METHODS.BICUBIC);

      assert.equal(metrics.componentsProcessed, 2);
      assert.equal(metrics.totalPixelsProcessed, 52); // 16 + 36

      const summary = metrics.getSummary();
      assert.equal(summary.componentsProcessed, 2);
      assert.equal(summary.methodUsage[INTERPOLATION_METHODS.BILINEAR], 1);
      assert.equal(summary.methodUsage[INTERPOLATION_METHODS.BICUBIC], 1);
    });

    it("tracks most used method", () => {
      const metrics = new ChromaUpsamplingMetrics();

      metrics.recordOperation(4, 16, INTERPOLATION_METHODS.BILINEAR);
      metrics.recordOperation(4, 16, INTERPOLATION_METHODS.BILINEAR);
      metrics.recordOperation(4, 16, INTERPOLATION_METHODS.NEAREST);

      const summary = metrics.getSummary();
      assert.equal(summary.mostUsedMethod, INTERPOLATION_METHODS.BILINEAR);
    });

    it("resets metrics", () => {
      const metrics = new ChromaUpsamplingMetrics();

      metrics.recordOperation(4, 16, INTERPOLATION_METHODS.BILINEAR);
      assert.equal(metrics.componentsProcessed, 1);

      metrics.reset();
      assert.equal(metrics.componentsProcessed, 0);
      assert.equal(metrics.totalPixelsProcessed, 0);
      assert.deepEqual(metrics.methodUsage, {});
    });
  });

  describe("Summary Generation", () => {
    it("generates upsampling summary", () => {
      const mode = { description: "4:2:0 (2:1 both directions)" };
      const summary = getUpsamplingummary(160, 120, 320, 240, INTERPOLATION_METHODS.BILINEAR, mode);

      assert.equal(summary.inputDimensions, "160x120");
      assert.equal(summary.outputDimensions, "320x240");
      assert.equal(summary.inputPixels, 19200);
      assert.equal(summary.outputPixels, 76800);
      assert.equal(summary.upsamplingRatio, 4);
      assert.equal(summary.method, INTERPOLATION_METHODS.BILINEAR);
      assert(summary.description.includes("4x"));
    });

    it("handles missing subsampling mode", () => {
      const summary = getUpsamplingummary(160, 120, 320, 240, INTERPOLATION_METHODS.NEAREST);

      assert.equal(summary.subsamplingMode, "unknown");
      assert(summary.description.includes("160x120"));
    });
  });

  describe("Real-world Scenarios", () => {
    it("handles typical 4:2:0 JPEG upsampling", () => {
      // Simulate typical JPEG 4:2:0 chroma data
      const chromaWidth = 160;
      const chromaHeight = 120;
      const targetWidth = 320;
      const targetHeight = 240;

      // Create test chroma data with gradient
      const chromaData = new Uint8Array(chromaWidth * chromaHeight);
      for (let y = 0; y < chromaHeight; y++) {
        for (let x = 0; x < chromaWidth; x++) {
          chromaData[y * chromaWidth + x] = Math.floor((x / chromaWidth) * 255);
        }
      }

      const result = upsampleChroma(chromaData, chromaWidth, chromaHeight, targetWidth, targetHeight);

      assert.equal(result.length, targetWidth * targetHeight);

      // Should maintain gradient characteristics
      assert(result[0] < result[targetWidth - 1]); // Left < Right
      assert(result[0] < result[result.length - 1]); // First < Last
    });

    it("handles 4:2:2 video-style upsampling", () => {
      // Simulate 4:2:2 chroma (common in video)
      const chromaWidth = 160;
      const chromaHeight = 240;
      const targetWidth = 320;
      const targetHeight = 240;

      const chromaData = new Uint8Array(chromaWidth * chromaHeight);
      chromaData.fill(128); // Neutral chroma

      const result = upsampleChroma(chromaData, chromaWidth, chromaHeight, targetWidth, targetHeight);

      assert.equal(result.length, targetWidth * targetHeight);

      // All pixels should be neutral chroma (within interpolation tolerance)
      for (let i = 0; i < result.length; i++) {
        assert(Math.abs(result[i] - 128) <= 1);
      }
    });

    it("preserves detail in high-frequency content", () => {
      // Create checkerboard pattern
      const chromaData = new Uint8Array(16); // 4x4
      for (let i = 0; i < 16; i++) {
        const x = i % 4;
        const y = Math.floor(i / 4);
        chromaData[i] = (x + y) % 2 === 0 ? 64 : 192;
      }

      const result = upsampleChroma(chromaData, 4, 4, 8, 8, INTERPOLATION_METHODS.BICUBIC);

      assert.equal(result.length, 64);

      // Should have variation (not all the same value)
      const minValue = Math.min(...result);
      const maxValue = Math.max(...result);
      assert(maxValue - minValue > 50); // Should preserve contrast
    });
  });
});
