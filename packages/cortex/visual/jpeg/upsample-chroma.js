/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG chroma upsampling implementation.
 *
 * Implements ITU-T T.81 Annex A.1.1 chroma upsampling to restore full resolution
 * chroma components from subsampled YCbCr data. Supports all standard JPEG
 * subsampling modes (4:4:4, 4:2:2, 4:2:0, 4:1:1) with multiple interpolation
 * algorithms and boundary handling strategies for optimal quality and performance.
 */

/**
 * Standard JPEG subsampling modes.
 * Defines the relationship between Y, Cb, and Cr component sampling.
 */
export const SUBSAMPLING_MODES = {
  /** No subsampling - full resolution for all components */
  YUV444: { horizontal: 1, vertical: 1, description: "4:4:4 (no subsampling)" },
  /** Horizontal 2:1 subsampling */
  YUV422: { horizontal: 2, vertical: 1, description: "4:2:2 (horizontal 2:1)" },
  /** Both horizontal and vertical 2:1 subsampling */
  YUV420: { horizontal: 2, vertical: 2, description: "4:2:0 (2:1 both directions)" },
  /** Horizontal 4:1 subsampling */
  YUV411: { horizontal: 4, vertical: 1, description: "4:1:1 (horizontal 4:1)" },
};

/**
 * Interpolation methods for chroma upsampling.
 * Different quality/performance trade-offs.
 */
export const INTERPOLATION_METHODS = {
  /** Nearest neighbor - fastest, lowest quality */
  NEAREST: "nearest",
  /** Bilinear interpolation - good balance */
  BILINEAR: "bilinear",
  /** Bicubic interpolation - higher quality */
  BICUBIC: "bicubic",
};

/**
 * Boundary handling strategies for edge pixels.
 * Determines how to handle pixels outside image boundaries.
 */
export const BOUNDARY_MODES = {
  /** Replicate edge pixels */
  REPLICATE: "replicate",
  /** Mirror pixels at boundaries */
  MIRROR: "mirror",
  /** Use zero/neutral values */
  ZERO: "zero",
};

/**
 * Determine subsampling mode from sampling factors.
 * Analyzes horizontal and vertical sampling factors to identify mode.
 *
 * @param {number} yHorizontal - Y component horizontal sampling factor
 * @param {number} yVertical - Y component vertical sampling factor
 * @param {number} cbHorizontal - Cb component horizontal sampling factor
 * @param {number} cbVertical - Cb component vertical sampling factor
 * @param {number} crHorizontal - Cr component horizontal sampling factor
 * @param {number} crVertical - Cr component vertical sampling factor
 * @returns {Object} Subsampling mode information
 */
export function determineSubsamplingMode(yHorizontal, yVertical, cbHorizontal, cbVertical, crHorizontal, crVertical) {
  // Validate inputs
  if (
    yHorizontal <= 0 ||
    yVertical <= 0 ||
    cbHorizontal <= 0 ||
    cbVertical <= 0 ||
    crHorizontal <= 0 ||
    crVertical <= 0
  ) {
    throw new Error("Sampling factors must be positive integers");
  }

  // Ensure Cb and Cr have same sampling (standard JPEG requirement)
  if (cbHorizontal !== crHorizontal || cbVertical !== crVertical) {
    throw new Error("Cb and Cr components must have identical sampling factors");
  }

  // Calculate subsampling ratios
  const horizontalRatio = yHorizontal / cbHorizontal;
  const verticalRatio = yVertical / cbVertical;

  // Identify standard modes
  if (horizontalRatio === 1 && verticalRatio === 1) {
    return {
      mode: "YUV444",
      horizontalRatio: 1,
      verticalRatio: 1,
      ...SUBSAMPLING_MODES.YUV444,
    };
  }

  if (horizontalRatio === 2 && verticalRatio === 1) {
    return {
      mode: "YUV422",
      horizontalRatio: 2,
      verticalRatio: 1,
      ...SUBSAMPLING_MODES.YUV422,
    };
  }

  if (horizontalRatio === 2 && verticalRatio === 2) {
    return {
      mode: "YUV420",
      horizontalRatio: 2,
      verticalRatio: 2,
      ...SUBSAMPLING_MODES.YUV420,
    };
  }

  if (horizontalRatio === 4 && verticalRatio === 1) {
    return {
      mode: "YUV411",
      horizontalRatio: 4,
      verticalRatio: 1,
      ...SUBSAMPLING_MODES.YUV411,
    };
  }

  // Non-standard subsampling
  return {
    mode: "CUSTOM",
    horizontalRatio,
    verticalRatio,
    horizontal: Math.round(horizontalRatio),
    vertical: Math.round(verticalRatio),
    description: `Custom ${horizontalRatio}:1 horizontal, ${verticalRatio}:1 vertical`,
  };
}

/**
 * Get pixel value with boundary handling.
 * Handles access to pixels outside image boundaries.
 *
 * @param {Uint8Array} data - Image data array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} x - X coordinate (may be outside bounds)
 * @param {number} y - Y coordinate (may be outside bounds)
 * @param {string} boundaryMode - Boundary handling mode
 * @returns {number} Pixel value with boundary handling applied
 * @private
 */
function getPixelWithBoundary(data, width, height, x, y, boundaryMode) {
  // Handle boundary conditions
  let clampedX = x;
  let clampedY = y;

  switch (boundaryMode) {
    case BOUNDARY_MODES.REPLICATE:
      clampedX = Math.max(0, Math.min(width - 1, x));
      clampedY = Math.max(0, Math.min(height - 1, y));
      break;

    case BOUNDARY_MODES.MIRROR:
      if (x < 0) clampedX = -x - 1;
      else if (x >= width) clampedX = 2 * width - x - 1;
      else clampedX = x;

      if (y < 0) clampedY = -y - 1;
      else if (y >= height) clampedY = 2 * height - y - 1;
      else clampedY = y;

      // Ensure still within bounds after mirroring
      clampedX = Math.max(0, Math.min(width - 1, clampedX));
      clampedY = Math.max(0, Math.min(height - 1, clampedY));
      break;

    case BOUNDARY_MODES.ZERO:
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return 128; // Neutral chroma value
      }
      clampedX = x;
      clampedY = y;
      break;

    default:
      throw new Error(`Unknown boundary mode: ${boundaryMode}`);
  }

  return data[clampedY * width + clampedX];
}

/**
 * Perform nearest neighbor upsampling.
 * Fastest method - simply replicates pixels.
 *
 * @param {Uint8Array} input - Input subsampled data
 * @param {number} inputWidth - Input width
 * @param {number} inputHeight - Input height
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 * @param {string} boundaryMode - Boundary handling mode
 * @returns {Uint8Array} Upsampled data
 * @private
 */
function upsampleNearest(input, inputWidth, inputHeight, outputWidth, outputHeight, boundaryMode) {
  const output = new Uint8Array(outputWidth * outputHeight);
  const scaleX = inputWidth / outputWidth;
  const scaleY = inputHeight / outputHeight;

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);

      const pixelValue = getPixelWithBoundary(input, inputWidth, inputHeight, srcX, srcY, boundaryMode);
      output[y * outputWidth + x] = pixelValue;
    }
  }

  return output;
}

/**
 * Perform bilinear upsampling.
 * Good quality/performance balance using linear interpolation.
 *
 * @param {Uint8Array} input - Input subsampled data
 * @param {number} inputWidth - Input width
 * @param {number} inputHeight - Input height
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 * @param {string} boundaryMode - Boundary handling mode
 * @returns {Uint8Array} Upsampled data
 * @private
 */
function upsampleBilinear(input, inputWidth, inputHeight, outputWidth, outputHeight, boundaryMode) {
  const output = new Uint8Array(outputWidth * outputHeight);
  const scaleX = outputWidth > 1 ? (inputWidth - 1) / (outputWidth - 1) : 0;
  const scaleY = outputHeight > 1 ? (inputHeight - 1) / (outputHeight - 1) : 0;

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const srcX = x * scaleX;
      const srcY = y * scaleY;

      const x1 = Math.floor(srcX);
      const y1 = Math.floor(srcY);
      const x2 = x1 + 1;
      const y2 = y1 + 1;

      const dx = srcX - x1;
      const dy = srcY - y1;

      // Get four corner pixels
      const p11 = getPixelWithBoundary(input, inputWidth, inputHeight, x1, y1, boundaryMode);
      const p12 = getPixelWithBoundary(input, inputWidth, inputHeight, x1, y2, boundaryMode);
      const p21 = getPixelWithBoundary(input, inputWidth, inputHeight, x2, y1, boundaryMode);
      const p22 = getPixelWithBoundary(input, inputWidth, inputHeight, x2, y2, boundaryMode);

      // Bilinear interpolation
      const interpolated = p11 * (1 - dx) * (1 - dy) + p21 * dx * (1 - dy) + p12 * (1 - dx) * dy + p22 * dx * dy;

      output[y * outputWidth + x] = Math.round(Math.max(0, Math.min(255, interpolated)));
    }
  }

  return output;
}

/**
 * Perform bicubic upsampling.
 * Higher quality using cubic interpolation.
 *
 * @param {Uint8Array} input - Input subsampled data
 * @param {number} inputWidth - Input width
 * @param {number} inputHeight - Input height
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 * @param {string} boundaryMode - Boundary handling mode
 * @returns {Uint8Array} Upsampled data
 * @private
 */
function upsampleBicubic(input, inputWidth, inputHeight, outputWidth, outputHeight, boundaryMode) {
  const output = new Uint8Array(outputWidth * outputHeight);
  const scaleX = outputWidth > 1 ? (inputWidth - 1) / (outputWidth - 1) : 0;
  const scaleY = outputHeight > 1 ? (inputHeight - 1) / (outputHeight - 1) : 0;

  // Bicubic kernel function
  /** @param {number} t */
  const bicubicKernel = (t) => {
    const a = -0.5; // Catmull-Rom parameter
    const absT = Math.abs(t);
    if (absT <= 1) {
      return (a + 2) * absT * absT * absT - (a + 3) * absT * absT + 1;
    }
    if (absT <= 2) {
      return a * absT * absT * absT - 5 * a * absT * absT + 8 * a * absT - 4 * a;
    }
    return 0;
  };

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const srcX = x * scaleX;
      const srcY = y * scaleY;

      const centerX = Math.floor(srcX);
      const centerY = Math.floor(srcY);

      const dx = srcX - centerX;
      const dy = srcY - centerY;

      let interpolated = 0;
      let weightSum = 0;

      // Sample 4x4 neighborhood
      for (let j = -1; j <= 2; j++) {
        for (let i = -1; i <= 2; i++) {
          const sampleX = centerX + i;
          const sampleY = centerY + j;

          const pixelValue = getPixelWithBoundary(input, inputWidth, inputHeight, sampleX, sampleY, boundaryMode);

          const weightX = bicubicKernel(i - dx);
          const weightY = bicubicKernel(j - dy);
          const weight = weightX * weightY;

          interpolated += pixelValue * weight;
          weightSum += weight;
        }
      }

      // Normalize and clamp
      const result = weightSum > 0 ? interpolated / weightSum : 128;
      output[y * outputWidth + x] = Math.round(Math.max(0, Math.min(255, result)));
    }
  }

  return output;
}

/**
 * Upsample chroma component to match luminance resolution.
 * Restores full resolution from subsampled chroma data.
 *
 * @param {Uint8Array} chromaData - Subsampled chroma component data
 * @param {number} chromaWidth - Subsampled chroma width
 * @param {number} chromaHeight - Subsampled chroma height
 * @param {number} targetWidth - Target output width (typically luminance width)
 * @param {number} targetHeight - Target output height (typically luminance height)
 * @param {string} [method=INTERPOLATION_METHODS.BILINEAR] - Interpolation method
 * @param {string} [boundaryMode=BOUNDARY_MODES.REPLICATE] - Boundary handling mode
 * @returns {Uint8Array} Upsampled chroma data at target resolution
 * @throws {Error} If inputs are invalid
 */
export function upsampleChroma(
  chromaData,
  chromaWidth,
  chromaHeight,
  targetWidth,
  targetHeight,
  method = INTERPOLATION_METHODS.BILINEAR,
  boundaryMode = BOUNDARY_MODES.REPLICATE
) {
  // Validate inputs
  if (!(chromaData instanceof Uint8Array)) {
    throw new Error("Expected chroma data to be Uint8Array");
  }

  if (chromaWidth <= 0 || chromaHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    throw new Error("All dimensions must be positive");
  }

  if (chromaData.length !== chromaWidth * chromaHeight) {
    throw new Error(`Chroma data length ${chromaData.length} doesn't match dimensions ${chromaWidth}x${chromaHeight}`);
  }

  // No upsampling needed
  if (chromaWidth === targetWidth && chromaHeight === targetHeight) {
    return new Uint8Array(chromaData);
  }

  // Validate method
  if (!Object.values(INTERPOLATION_METHODS).includes(method)) {
    throw new Error(`Unknown interpolation method: ${method}`);
  }

  // Validate boundary mode
  if (!Object.values(BOUNDARY_MODES).includes(boundaryMode)) {
    throw new Error(`Unknown boundary mode: ${boundaryMode}`);
  }

  // Apply appropriate upsampling method
  switch (method) {
    case INTERPOLATION_METHODS.NEAREST:
      return upsampleNearest(chromaData, chromaWidth, chromaHeight, targetWidth, targetHeight, boundaryMode);

    case INTERPOLATION_METHODS.BILINEAR:
      return upsampleBilinear(chromaData, chromaWidth, chromaHeight, targetWidth, targetHeight, boundaryMode);

    case INTERPOLATION_METHODS.BICUBIC:
      return upsampleBicubic(chromaData, chromaWidth, chromaHeight, targetWidth, targetHeight, boundaryMode);

    default:
      throw new Error(`Unimplemented interpolation method: ${method}`);
  }
}

/**
 * Upsample both Cb and Cr components simultaneously.
 * Efficient batch processing for both chroma components.
 *
 * @param {Uint8Array} cbData - Subsampled Cb component data
 * @param {Uint8Array} crData - Subsampled Cr component data
 * @param {number} chromaWidth - Subsampled chroma width
 * @param {number} chromaHeight - Subsampled chroma height
 * @param {number} targetWidth - Target output width
 * @param {number} targetHeight - Target output height
 * @param {string} [method=INTERPOLATION_METHODS.BILINEAR] - Interpolation method
 * @param {string} [boundaryMode=BOUNDARY_MODES.REPLICATE] - Boundary handling mode
 * @returns {{cb: Uint8Array, cr: Uint8Array}} Upsampled Cb and Cr data
 * @throws {Error} If inputs are invalid
 */
export function upsampleChromaComponents(
  cbData,
  crData,
  chromaWidth,
  chromaHeight,
  targetWidth,
  targetHeight,
  method = INTERPOLATION_METHODS.BILINEAR,
  boundaryMode = BOUNDARY_MODES.REPLICATE
) {
  // Validate inputs
  if (!(cbData instanceof Uint8Array) || !(crData instanceof Uint8Array)) {
    throw new Error("Expected chroma data to be Uint8Array");
  }

  if (cbData.length !== crData.length) {
    throw new Error("Cb and Cr data must have same length");
  }

  // Upsample both components
  const upsampledCb = upsampleChroma(
    cbData,
    chromaWidth,
    chromaHeight,
    targetWidth,
    targetHeight,
    method,
    boundaryMode
  );
  const upsampledCr = upsampleChroma(
    crData,
    chromaWidth,
    chromaHeight,
    targetWidth,
    targetHeight,
    method,
    boundaryMode
  );

  return {
    cb: upsampledCb,
    cr: upsampledCr,
  };
}

/**
 * Calculate required chroma dimensions from subsampling mode.
 * Determines the dimensions of subsampled chroma components.
 *
 * @param {number} luminanceWidth - Luminance component width
 * @param {number} luminanceHeight - Luminance component height
 * @param {{horizontalRatio: number, verticalRatio: number}} subsamplingMode - Subsampling mode information
 * @returns {{width: number, height: number}} Chroma component dimensions
 */
export function calculateChromaDimensions(luminanceWidth, luminanceHeight, subsamplingMode) {
  if (luminanceWidth <= 0 || luminanceHeight <= 0) {
    throw new Error("Luminance dimensions must be positive");
  }

  if (
    !subsamplingMode ||
    typeof subsamplingMode.horizontalRatio !== "number" ||
    typeof subsamplingMode.verticalRatio !== "number"
  ) {
    throw new Error("Invalid subsampling mode");
  }

  const chromaWidth = Math.ceil(luminanceWidth / subsamplingMode.horizontalRatio);
  const chromaHeight = Math.ceil(luminanceHeight / subsamplingMode.verticalRatio);

  return {
    width: chromaWidth,
    height: chromaHeight,
  };
}

/**
 * Chroma upsampling quality metrics.
 * Analyzes quality of upsampling operations.
 */
export class ChromaUpsamplingMetrics {
  /**
   * Create chroma upsampling metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.componentsProcessed = 0;
    /** @type {number} */
    this.totalPixelsProcessed = 0;
    /** @type {Object<string, number>} */
    this.methodUsage = {};
    /** @type {number} */
    this.averageUpsamplingRatio = 0;
  }

  /**
   * Record upsampling operation.
   *
   * @param {number} inputPixels - Number of input pixels
   * @param {number} outputPixels - Number of output pixels
   * @param {string} method - Interpolation method used
   */
  recordOperation(inputPixels, outputPixels, method) {
    this.componentsProcessed++;
    this.totalPixelsProcessed += outputPixels;

    // Track method usage
    this.methodUsage[method] = (this.methodUsage[method] || 0) + 1;

    // Update average upsampling ratio
    const ratio = outputPixels / inputPixels;
    this.averageUpsamplingRatio =
      (this.averageUpsamplingRatio * (this.componentsProcessed - 1) + ratio) / this.componentsProcessed;
  }

  /**
   * Get metrics summary.
   *
   * @returns {Object} Metrics summary
   */
  getSummary() {
    const mostUsedMethod = Object.keys(this.methodUsage).reduce(
      (a, b) => (this.methodUsage[a] > this.methodUsage[b] ? a : b),
      "none"
    );

    return {
      componentsProcessed: this.componentsProcessed,
      totalPixelsProcessed: this.totalPixelsProcessed,
      averageUpsamplingRatio: Math.round(this.averageUpsamplingRatio * 100) / 100,
      methodUsage: { ...this.methodUsage },
      mostUsedMethod,
      description: `Chroma upsampling: ${this.componentsProcessed} components, ${this.totalPixelsProcessed} pixels, avg ratio ${Math.round(this.averageUpsamplingRatio * 100) / 100}x`,
    };
  }

  /**
   * Reset metrics.
   */
  reset() {
    this.componentsProcessed = 0;
    this.totalPixelsProcessed = 0;
    this.methodUsage = {};
    this.averageUpsamplingRatio = 0;
  }
}

/**
 * Get summary information about chroma upsampling operation.
 * Provides debugging and analysis information.
 *
 * @param {number} inputWidth - Input chroma width
 * @param {number} inputHeight - Input chroma height
 * @param {number} outputWidth - Output width
 * @param {number} outputHeight - Output height
 * @param {string} method - Interpolation method used
 * @param {{description?: string, mode?: string}} [subsamplingMode] - Subsampling mode information
 * @returns {Object} Summary information
 */
export function getUpsamplingummary(inputWidth, inputHeight, outputWidth, outputHeight, method, subsamplingMode) {
  const inputPixels = inputWidth * inputHeight;
  const outputPixels = outputWidth * outputHeight;
  const upsamplingRatio = outputPixels / inputPixels;

  return {
    inputDimensions: `${inputWidth}x${inputHeight}`,
    outputDimensions: `${outputWidth}x${outputHeight}`,
    inputPixels,
    outputPixels,
    upsamplingRatio: Math.round(upsamplingRatio * 100) / 100,
    method,
    subsamplingMode: subsamplingMode ? subsamplingMode.description || subsamplingMode.mode : "unknown",
    description: `Chroma upsampling: ${inputWidth}x${inputHeight} → ${outputWidth}x${outputHeight} (${Math.round(upsamplingRatio * 100) / 100}x) using ${method}`,
  };
}
