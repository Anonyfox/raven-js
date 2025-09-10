/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Enhanced JPEG upsampling algorithms.
 *
 * Provides multiple upsampling algorithms (nearest neighbor, linear,
 * cubic) for chroma components to match luma resolution. Includes
 * performance optimizations, edge case handling, and quality options.
 */

/**
 * Upsample chroma plane to match luma resolution using nearest neighbor.
 *
 * @param {Uint8Array} input - Input chroma plane
 * @param {number} inputWidth - Input chroma width
 * @param {number} inputHeight - Input chroma height
 * @param {number} horizontalScale - Horizontal upsampling factor
 * @param {number} verticalScale - Vertical upsampling factor
 * @param {Uint8Array} output - Output buffer (pre-allocated)
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 */
export function upsampleNearest(
  input,
  inputWidth,
  inputHeight,
  horizontalScale,
  verticalScale,
  output,
  outputWidth,
  outputHeight
) {
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      // Map output coordinates to input coordinates
      const inputX = Math.floor(x / horizontalScale);
      const inputY = Math.floor(y / verticalScale);

      // Clamp to input bounds
      const clampedX = Math.min(inputX, inputWidth - 1);
      const clampedY = Math.min(inputY, inputHeight - 1);

      // Copy nearest neighbor
      const inputIndex = clampedY * inputWidth + clampedX;
      const outputIndex = y * outputWidth + x;
      output[outputIndex] = input[inputIndex];
    }
  }
}

/**
 * Upsample chroma plane using linear interpolation.
 *
 * @param {Uint8Array} input - Input chroma plane
 * @param {number} inputWidth - Input chroma width
 * @param {number} inputHeight - Input chroma height
 * @param {number} horizontalScale - Horizontal upsampling factor
 * @param {number} verticalScale - Vertical upsampling factor
 * @param {Uint8Array} output - Output buffer (pre-allocated)
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 */
export function upsampleLinear(
  input,
  inputWidth,
  inputHeight,
  horizontalScale,
  verticalScale,
  output,
  outputWidth,
  outputHeight
) {
  // Horizontal upsampling first
  const tempWidth = outputWidth;
  const tempHeight = inputHeight;
  const temp = new Uint8Array(tempWidth * tempHeight);

  // Horizontal pass
  for (let y = 0; y < inputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const inputX = x / horizontalScale;
      const leftX = Math.floor(inputX);
      const rightX = Math.min(Math.ceil(inputX), inputWidth - 1);
      const fracX = inputX - leftX;

      // Linear interpolation
      const leftVal = input[y * inputWidth + leftX];
      const rightVal = input[y * inputWidth + rightX];
      const interpolated = leftVal + fracX * (rightVal - leftVal);

      temp[y * tempWidth + x] = Math.round(interpolated);
    }
  }

  // Vertical pass
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const inputY = y / verticalScale;
      const topY = Math.floor(inputY);
      const bottomY = Math.min(Math.ceil(inputY), tempHeight - 1);
      const fracY = inputY - topY;

      // Linear interpolation
      const topVal = temp[topY * tempWidth + x];
      const bottomVal = temp[bottomY * tempWidth + x];
      const interpolated = topVal + fracY * (bottomVal - topVal);

      output[y * outputWidth + x] = Math.round(interpolated);
    }
  }
}

/**
 * Upsample single component plane.
 *
 * @param {Uint8Array} input - Input chroma plane
 * @param {number} inputWidth - Input chroma width
 * @param {number} inputHeight - Input chroma height
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 * @param {boolean} useLinear - Whether to use linear interpolation (default: false)
 * @returns {Uint8Array} Upsampled plane
 */
export function upsamplePlane(input, inputWidth, inputHeight, outputWidth, outputHeight, useLinear = false) {
  // Calculate scaling factors
  const horizontalScale = outputWidth / inputWidth;
  const verticalScale = outputHeight / inputHeight;

  // No upsampling needed
  if (horizontalScale === 1 && verticalScale === 1) {
    return input.slice();
  }

  const output = new Uint8Array(outputWidth * outputHeight);

  if (useLinear) {
    upsampleLinear(input, inputWidth, inputHeight, horizontalScale, verticalScale, output, outputWidth, outputHeight);
  } else {
    upsampleNearest(input, inputWidth, inputHeight, horizontalScale, verticalScale, output, outputWidth, outputHeight);
  }

  return output;
}

/**
 * Enhanced upsampling with cubic interpolation for higher quality.
 *
 * @param {Uint8Array} input - Input chroma plane
 * @param {number} inputWidth - Input chroma width
 * @param {number} inputHeight - Input chroma height
 * @param {number} horizontalScale - Horizontal upsampling factor
 * @param {number} verticalScale - Vertical upsampling factor
 * @param {Uint8Array} output - Output buffer (pre-allocated)
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 */
export function upsampleCubic(
  input,
  inputWidth,
  inputHeight,
  horizontalScale,
  verticalScale,
  output,
  outputWidth,
  outputHeight
) {
  // Cubic interpolation kernel (Catmull-Rom spline)
  /**
   * @param {number} t - Distance parameter
   * @returns {number} Kernel weight
   */
  const cubicKernel = (t) => {
    const t2 = t * t;
    const t3 = t2 * t;
    if (t < 1) return 1.5 * t3 - 2.5 * t2 + 1;
    if (t < 2) return -0.5 * t3 + 2.5 * t2 - 4 * t + 2;
    return 0;
  };

  // Horizontal pass
  const tempWidth = outputWidth;
  const tempHeight = inputHeight;
  const temp = new Uint8Array(tempWidth * tempHeight);

  for (let y = 0; y < inputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const inputX = x / horizontalScale;
      const baseX = Math.floor(inputX);
      const fracX = inputX - baseX;

      let sum = 0;
      let weightSum = 0;

      // Sample 4 neighboring pixels for cubic interpolation
      for (let i = -1; i <= 2; i++) {
        const sampleX = Math.max(0, Math.min(inputWidth - 1, baseX + i));
        const weight = cubicKernel(Math.abs(fracX - i));
        sum += input[y * inputWidth + sampleX] * weight;
        weightSum += weight;
      }

      temp[y * tempWidth + x] =
        weightSum > 0
          ? Math.round(sum / weightSum)
          : input[y * inputWidth + Math.max(0, Math.min(inputWidth - 1, baseX))];
    }
  }

  // Vertical pass
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const inputY = y / verticalScale;
      const baseY = Math.floor(inputY);
      const fracY = inputY - baseY;

      let sum = 0;
      let weightSum = 0;

      // Sample 4 neighboring pixels for cubic interpolation
      for (let i = -1; i <= 2; i++) {
        const sampleY = Math.max(0, Math.min(tempHeight - 1, baseY + i));
        const weight = cubicKernel(Math.abs(fracY - i));
        sum += temp[sampleY * tempWidth + x] * weight;
        weightSum += weight;
      }

      output[y * outputWidth + x] =
        weightSum > 0
          ? Math.round(sum / weightSum)
          : temp[Math.max(0, Math.min(tempHeight - 1, baseY)) * tempWidth + x];
    }
  }
}

/**
 * Optimized nearest neighbor for integer scaling factors.
 *
 * @param {Uint8Array} input - Input chroma plane
 * @param {number} inputWidth - Input chroma width
 * @param {number} inputHeight - Input chroma height
 * @param {number} scaleFactor - Integer scaling factor (2, 4, etc.)
 * @param {Uint8Array} output - Output buffer (pre-allocated)
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 */
export function upsampleNearestInteger(input, inputWidth, inputHeight, scaleFactor, output, outputWidth, outputHeight) {
  // Optimized for integer scaling (much faster)
  for (let y = 0; y < inputHeight; y++) {
    for (let x = 0; x < inputWidth; x++) {
      const value = input[y * inputWidth + x];

      // Fill the scaleFactor x scaleFactor block in output
      for (let dy = 0; dy < scaleFactor; dy++) {
        for (let dx = 0; dx < scaleFactor; dx++) {
          const outX = x * scaleFactor + dx;
          const outY = y * scaleFactor + dy;
          if (outX < outputWidth && outY < outputHeight) {
            output[outY * outputWidth + outX] = value;
          }
        }
      }
    }
  }
}

/**
 * Enhanced linear interpolation with better edge handling.
 *
 * @param {Uint8Array} input - Input chroma plane
 * @param {number} inputWidth - Input chroma width
 * @param {number} inputHeight - Input chroma height
 * @param {number} horizontalScale - Horizontal upsampling factor
 * @param {number} verticalScale - Vertical upsampling factor
 * @param {Uint8Array} output - Output buffer (pre-allocated)
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 */
export function upsampleLinearEnhanced(
  input,
  inputWidth,
  inputHeight,
  horizontalScale,
  verticalScale,
  output,
  outputWidth,
  outputHeight
) {
  // Single-pass bilinear interpolation (more cache-friendly)
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      // Calculate input coordinates with sub-pixel precision
      const inputX = (x + 0.5) / horizontalScale - 0.5;
      const inputY = (y + 0.5) / verticalScale - 0.5;

      // Find the four surrounding pixels
      const x0 = Math.max(0, Math.min(inputWidth - 2, Math.floor(inputX)));
      const y0 = Math.max(0, Math.min(inputHeight - 2, Math.floor(inputY)));
      const x1 = x0 + 1;
      const y1 = y0 + 1;

      // Calculate interpolation weights
      const wx = inputX - x0;
      const wy = inputY - y0;

      // Bilinear interpolation
      const val00 = input[y0 * inputWidth + x0];
      const val01 = input[y0 * inputWidth + x1];
      const val10 = input[y1 * inputWidth + x0];
      const val11 = input[y1 * inputWidth + x1];

      // Interpolate horizontally first
      const top = val00 + wx * (val01 - val00);
      const bottom = val10 + wx * (val11 - val10);

      // Then vertically
      const interpolated = top + wy * (bottom - top);

      output[y * outputWidth + x] = Math.round(Math.max(0, Math.min(255, interpolated)));
    }
  }
}

/**
 * Upsampling quality options
 */
export const UPSAMPLE_QUALITY = {
  FASTEST: "fastest", // Nearest neighbor
  FAST: "fast", // Nearest neighbor (integer optimized)
  GOOD: "good", // Linear interpolation
  BEST: "best", // Cubic interpolation
};

/**
 * Enhanced plane upsampling with quality selection.
 *
 * @param {Uint8Array} input - Input chroma plane
 * @param {number} inputWidth - Input chroma width
 * @param {number} inputHeight - Input chroma height
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 * @param {string} quality - Quality option ('fastest', 'fast', 'good', 'best')
 * @returns {Uint8Array} Upsampled plane
 */
export function upsamplePlaneQuality(
  input,
  inputWidth,
  inputHeight,
  outputWidth,
  outputHeight,
  quality = UPSAMPLE_QUALITY.FAST
) {
  // Calculate scaling factors
  const horizontalScale = outputWidth / inputWidth;
  const verticalScale = outputHeight / inputHeight;

  // No upsampling needed
  if (horizontalScale === 1 && verticalScale === 1) {
    return input.slice();
  }

  const output = new Uint8Array(outputWidth * outputHeight);

  // Select algorithm based on quality preference
  switch (quality) {
    case UPSAMPLE_QUALITY.FASTEST:
      upsampleNearest(
        input,
        inputWidth,
        inputHeight,
        horizontalScale,
        verticalScale,
        output,
        outputWidth,
        outputHeight
      );
      break;

    case UPSAMPLE_QUALITY.FAST:
      // Use optimized integer scaling if applicable
      if (Number.isInteger(horizontalScale) && Number.isInteger(verticalScale) && horizontalScale === verticalScale) {
        upsampleNearestInteger(input, inputWidth, inputHeight, horizontalScale, output, outputWidth, outputHeight);
      } else {
        upsampleNearest(
          input,
          inputWidth,
          inputHeight,
          horizontalScale,
          verticalScale,
          output,
          outputWidth,
          outputHeight
        );
      }
      break;

    case UPSAMPLE_QUALITY.GOOD:
      upsampleLinearEnhanced(
        input,
        inputWidth,
        inputHeight,
        horizontalScale,
        verticalScale,
        output,
        outputWidth,
        outputHeight
      );
      break;

    case UPSAMPLE_QUALITY.BEST:
      upsampleCubic(input, inputWidth, inputHeight, horizontalScale, verticalScale, output, outputWidth, outputHeight);
      break;

    default:
      upsampleNearest(
        input,
        inputWidth,
        inputHeight,
        horizontalScale,
        verticalScale,
        output,
        outputWidth,
        outputHeight
      );
  }

  return output;
}

/**
 * Calculate subsampling factors for component.
 *
 * @param {number} horizontalSampling - Horizontal sampling factor (1-4)
 * @param {number} verticalSampling - Vertical sampling factor (1-4)
 * @param {number} maxHorizontalSampling - Maximum horizontal sampling in frame
 * @param {number} maxVerticalSampling - Maximum vertical sampling in frame
 * @returns {Object} Scaling factors
 */
export function getSubsamplingFactors(
  horizontalSampling,
  verticalSampling,
  maxHorizontalSampling,
  maxVerticalSampling
) {
  return {
    horizontalScale: maxHorizontalSampling / horizontalSampling,
    verticalScale: maxVerticalSampling / verticalSampling,
  };
}

/**
 * Detect if scaling factors are integer values for optimization.
 *
 * @param {number} horizontalScale - Horizontal scaling factor
 * @param {number} verticalScale - Vertical scaling factor
 * @returns {boolean} True if both scales are integers
 */
export function isIntegerScaling(horizontalScale, verticalScale) {
  return Number.isInteger(horizontalScale) && Number.isInteger(verticalScale) && horizontalScale === verticalScale;
}
