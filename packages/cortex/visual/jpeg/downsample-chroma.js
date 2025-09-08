/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Chroma subsampling for JPEG encoding.
 *
 * Implements ITU-T T.81 chroma subsampling modes (4:4:4, 4:2:2, 4:2:0, 4:1:1)
 * with anti-aliasing filters and boundary handling. Reduces chrominance data
 * while preserving perceptual quality through human visual system-aware
 * filtering and adaptive processing.
 */

/**
 * Chroma subsampling modes.
 * Different subsampling ratios for compression efficiency.
 */
export const SUBSAMPLING_MODES = {
  /** 4:4:4 - No subsampling (full resolution) */
  YUV444: "4:4:4",
  /** 4:2:2 - Horizontal subsampling (half horizontal resolution) */
  YUV422: "4:2:2",
  /** 4:2:0 - Horizontal + vertical subsampling (quarter resolution) */
  YUV420: "4:2:0",
  /** 4:1:1 - Aggressive horizontal subsampling (quarter horizontal resolution) */
  YUV411: "4:1:1",
};

/**
 * Anti-aliasing filter types.
 * Different filtering strategies for subsampling quality.
 */
export const FILTER_TYPES = {
  /** Simple box filter (averaging) */
  BOX: "box",
  /** Bilinear interpolation filter */
  BILINEAR: "bilinear",
  /** Lanczos resampling filter */
  LANCZOS: "lanczos",
  /** Gaussian blur filter */
  GAUSSIAN: "gaussian",
};

/**
 * Boundary handling modes.
 * Different strategies for edge pixels.
 */
export const BOUNDARY_MODES = {
  /** Reflect edge pixels */
  REFLECT: "reflect",
  /** Zero-pad missing pixels */
  ZERO: "zero",
  /** Replicate edge pixels */
  REPLICATE: "replicate",
  /** Wrap around to opposite edge */
  WRAP: "wrap",
};

/**
 * Quality assessment modes.
 * Different quality evaluation strategies.
 */
export const QUALITY_MODES = {
  /** Fast quality estimation */
  FAST: "fast",
  /** Comprehensive quality analysis */
  FULL: "full",
  /** Perceptual quality weighting */
  PERCEPTUAL: "perceptual",
};

/**
 * Subsampling factors for each mode.
 * Horizontal and vertical reduction factors.
 */
export const SUBSAMPLING_FACTORS = {
  [SUBSAMPLING_MODES.YUV444]: { horizontal: 1, vertical: 1 },
  [SUBSAMPLING_MODES.YUV422]: { horizontal: 2, vertical: 1 },
  [SUBSAMPLING_MODES.YUV420]: { horizontal: 2, vertical: 2 },
  [SUBSAMPLING_MODES.YUV411]: { horizontal: 4, vertical: 1 },
};

/**
 * Default subsampling options.
 * Standard settings for chroma downsampling.
 */
export const DEFAULT_SUBSAMPLING_OPTIONS = {
  mode: SUBSAMPLING_MODES.YUV420,
  filter: FILTER_TYPES.BOX,
  boundary: BOUNDARY_MODES.REFLECT,
  quality: QUALITY_MODES.FAST,
  preserveEdges: false,
  adaptiveMode: false,
};

/**
 * Apply box filter to image region.
 * Simple averaging filter for fast subsampling.
 *
 * @param {Uint8Array} data - Source image data
 * @param {number} width - Source width
 * @param {number} height - Source height
 * @param {number} x - Region x coordinate
 * @param {number} y - Region y coordinate
 * @param {number} blockWidth - Filter block width
 * @param {number} blockHeight - Filter block height
 * @param {string} boundaryMode - Boundary handling mode
 * @returns {number} Filtered value
 */
export function applyBoxFilter(data, width, height, x, y, blockWidth, blockHeight, boundaryMode) {
  let sum = 0;
  let count = 0;

  for (let dy = 0; dy < blockHeight; dy++) {
    for (let dx = 0; dx < blockWidth; dx++) {
      const srcX = x + dx;
      const srcY = y + dy;

      let pixelX = srcX;
      let pixelY = srcY;

      // Handle boundary conditions
      if (srcX < 0 || srcX >= width || srcY < 0 || srcY >= height) {
        switch (boundaryMode) {
          case BOUNDARY_MODES.REFLECT:
            pixelX = srcX < 0 ? -srcX - 1 : srcX >= width ? 2 * width - srcX - 1 : srcX;
            pixelY = srcY < 0 ? -srcY - 1 : srcY >= height ? 2 * height - srcY - 1 : srcY;
            break;

          case BOUNDARY_MODES.REPLICATE:
            pixelX = Math.max(0, Math.min(width - 1, srcX));
            pixelY = Math.max(0, Math.min(height - 1, srcY));
            break;

          case BOUNDARY_MODES.WRAP:
            pixelX = ((srcX % width) + width) % width;
            pixelY = ((srcY % height) + height) % height;
            break;

          case BOUNDARY_MODES.ZERO:
            if (srcX < 0 || srcX >= width || srcY < 0 || srcY >= height) {
              continue; // Skip out-of-bounds pixels
            }
            break;

          default:
            continue;
        }
      }

      const index = pixelY * width + pixelX;
      if (index >= 0 && index < data.length) {
        sum += data[index];
        count++;
      }
    }
  }

  return count > 0 ? Math.round(sum / count) : 0;
}

/**
 * Apply bilinear filter to image region.
 * Linear interpolation filter for smooth subsampling.
 *
 * @param {Uint8Array} data - Source image data
 * @param {number} width - Source width
 * @param {number} height - Source height
 * @param {number} x - Sample x coordinate (can be fractional)
 * @param {number} y - Sample y coordinate (can be fractional)
 * @param {string} boundaryMode - Boundary handling mode
 * @returns {number} Interpolated value
 */
export function applyBilinearFilter(data, width, height, x, y, boundaryMode) {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = x1 + 1;
  const y2 = y1 + 1;

  const fx = x - x1;
  const fy = y - y1;

  // Get pixel values with boundary handling
  const getPixel = (/** @type {number} */ px, /** @type {number} */ py) => {
    let pixelX = px;
    let pixelY = py;

    if (px < 0 || px >= width || py < 0 || py >= height) {
      switch (boundaryMode) {
        case BOUNDARY_MODES.REFLECT:
          pixelX = px < 0 ? -px - 1 : px >= width ? 2 * width - px - 1 : px;
          pixelY = py < 0 ? -py - 1 : py >= height ? 2 * height - py - 1 : py;
          break;

        case BOUNDARY_MODES.REPLICATE:
          pixelX = Math.max(0, Math.min(width - 1, px));
          pixelY = Math.max(0, Math.min(height - 1, py));
          break;

        case BOUNDARY_MODES.WRAP:
          pixelX = ((px % width) + width) % width;
          pixelY = ((py % height) + height) % height;
          break;

        case BOUNDARY_MODES.ZERO:
          return px < 0 || px >= width || py < 0 || py >= height ? 0 : data[py * width + px];

        default:
          return 0;
      }
    }

    const index = pixelY * width + pixelX;
    return index >= 0 && index < data.length ? data[index] : 0;
  };

  const p11 = getPixel(x1, y1);
  const p21 = getPixel(x2, y1);
  const p12 = getPixel(x1, y2);
  const p22 = getPixel(x2, y2);

  // Bilinear interpolation
  const top = p11 * (1 - fx) + p21 * fx;
  const bottom = p12 * (1 - fx) + p22 * fx;
  const result = top * (1 - fy) + bottom * fy;

  return Math.round(result);
}

/**
 * Apply Gaussian filter to image region.
 * Smooth falloff filter for high-quality subsampling.
 *
 * @param {Uint8Array} data - Source image data
 * @param {number} width - Source width
 * @param {number} height - Source height
 * @param {number} x - Region center x coordinate
 * @param {number} y - Region center y coordinate
 * @param {number} radius - Filter radius
 * @param {number} sigma - Gaussian standard deviation
 * @param {string} boundaryMode - Boundary handling mode
 * @returns {number} Filtered value
 */
export function applyGaussianFilter(data, width, height, x, y, radius, sigma, boundaryMode) {
  let sum = 0;
  let weightSum = 0;

  const sigma2 = 2 * sigma * sigma;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const srcX = x + dx;
      const srcY = y + dy;

      let pixelX = srcX;
      let pixelY = srcY;

      // Handle boundary conditions
      if (srcX < 0 || srcX >= width || srcY < 0 || srcY >= height) {
        switch (boundaryMode) {
          case BOUNDARY_MODES.REFLECT:
            pixelX = srcX < 0 ? -srcX - 1 : srcX >= width ? 2 * width - srcX - 1 : srcX;
            pixelY = srcY < 0 ? -srcY - 1 : srcY >= height ? 2 * height - srcY - 1 : srcY;
            break;

          case BOUNDARY_MODES.REPLICATE:
            pixelX = Math.max(0, Math.min(width - 1, srcX));
            pixelY = Math.max(0, Math.min(height - 1, srcY));
            break;

          case BOUNDARY_MODES.WRAP:
            pixelX = ((srcX % width) + width) % width;
            pixelY = ((srcY % height) + height) % height;
            break;

          case BOUNDARY_MODES.ZERO:
            if (srcX < 0 || srcX >= width || srcY < 0 || srcY >= height) {
              continue;
            }
            break;

          default:
            continue;
        }
      }

      const index = pixelY * width + pixelX;
      if (index >= 0 && index < data.length) {
        const distance2 = dx * dx + dy * dy;
        const weight = Math.exp(-distance2 / sigma2);
        sum += data[index] * weight;
        weightSum += weight;
      }
    }
  }

  return weightSum > 0 ? Math.round(sum / weightSum) : 0;
}

/**
 * Detect edges in chroma data for edge-aware processing.
 * Simple gradient-based edge detection.
 *
 * @param {Uint8Array} data - Chroma component data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} threshold - Edge detection threshold
 * @returns {Uint8Array} Edge map (0 = no edge, 255 = edge)
 */
export function detectEdges(data, width, height, threshold = 30) {
  const edges = new Uint8Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;

      // Sobel gradient calculation
      const gx =
        -data[(y - 1) * width + (x - 1)] +
        data[(y - 1) * width + (x + 1)] +
        -2 * data[y * width + (x - 1)] +
        2 * data[y * width + (x + 1)] +
        -data[(y + 1) * width + (x - 1)] +
        data[(y + 1) * width + (x + 1)];

      const gy =
        -data[(y - 1) * width + (x - 1)] -
        2 * data[(y - 1) * width + x] -
        data[(y - 1) * width + (x + 1)] +
        data[(y + 1) * width + (x - 1)] +
        2 * data[(y + 1) * width + x] +
        data[(y + 1) * width + (x + 1)];

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[index] = magnitude > threshold ? 255 : 0;
    }
  }

  return edges;
}

/**
 * Analyze chroma content for adaptive subsampling.
 * Determines optimal subsampling mode based on content characteristics.
 *
 * @param {Uint8Array} cbData - Cb component data
 * @param {Uint8Array} crData - Cr component data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {{
 *   recommendedMode: string,
 *   chromaActivity: number,
 *   edgeDensity: number,
 *   colorComplexity: number,
 *   qualityImpact: Object<string, number>
 * }} Content analysis results
 */
export function analyzeChromaContent(cbData, crData, width, height) {
  const pixelCount = width * height;

  // Calculate chroma activity (variance)
  let cbSum = 0;
  let crSum = 0;
  let cbVariance = 0;
  let crVariance = 0;

  for (let i = 0; i < pixelCount; i++) {
    cbSum += cbData[i];
    crSum += crData[i];
  }

  const cbMean = cbSum / pixelCount;
  const crMean = crSum / pixelCount;

  for (let i = 0; i < pixelCount; i++) {
    cbVariance += (cbData[i] - cbMean) ** 2;
    crVariance += (crData[i] - crMean) ** 2;
  }

  cbVariance /= pixelCount;
  crVariance /= pixelCount;

  const chromaActivity = Math.sqrt(cbVariance + crVariance);

  // Detect edges for complexity analysis
  const cbEdges = detectEdges(cbData, width, height);
  const crEdges = detectEdges(crData, width, height);

  let edgeCount = 0;
  for (let i = 0; i < pixelCount; i++) {
    if (cbEdges[i] > 0 || crEdges[i] > 0) {
      edgeCount++;
    }
  }

  const edgeDensity = edgeCount / pixelCount;

  // Calculate color complexity (range utilization)
  let cbMin = 255;
  let cbMax = 0;
  let crMin = 255;
  let crMax = 0;

  for (let i = 0; i < pixelCount; i++) {
    cbMin = Math.min(cbMin, cbData[i]);
    cbMax = Math.max(cbMax, cbData[i]);
    crMin = Math.min(crMin, crData[i]);
    crMax = Math.max(crMax, crData[i]);
  }

  const colorComplexity = (cbMax - cbMin + (crMax - crMin)) / 510; // Normalized to 0-1

  // Quality impact estimation for different modes
  const qualityImpact = {
    [SUBSAMPLING_MODES.YUV444]: 0, // No quality loss
    [SUBSAMPLING_MODES.YUV422]: chromaActivity * 0.3 + edgeDensity * 0.4,
    [SUBSAMPLING_MODES.YUV420]: chromaActivity * 0.6 + edgeDensity * 0.8,
    [SUBSAMPLING_MODES.YUV411]: chromaActivity * 0.8 + edgeDensity * 1.0,
  };

  // Recommend mode based on content characteristics
  let recommendedMode = SUBSAMPLING_MODES.YUV420; // Default

  if (chromaActivity < 10 && edgeDensity < 0.1) {
    recommendedMode = SUBSAMPLING_MODES.YUV420; // Low activity - aggressive subsampling OK
  } else if (chromaActivity < 20 && edgeDensity < 0.2) {
    recommendedMode = SUBSAMPLING_MODES.YUV422; // Medium activity - moderate subsampling
  } else if (chromaActivity > 40 || edgeDensity > 0.3) {
    recommendedMode = SUBSAMPLING_MODES.YUV444; // High activity - preserve quality
  }

  return {
    recommendedMode,
    chromaActivity,
    edgeDensity,
    colorComplexity,
    qualityImpact,
  };
}

/**
 * Subsample chroma component using specified mode and filter.
 * Reduces chroma resolution according to subsampling parameters.
 *
 * @param {Uint8Array} data - Source chroma component data
 * @param {number} width - Source width
 * @param {number} height - Source height
 * @param {string} mode - Subsampling mode
 * @param {string} filter - Filter type
 * @param {string} boundary - Boundary handling mode
 * @param {boolean} preserveEdges - Enable edge-aware processing
 * @returns {{
 *   data: Uint8Array,
 *   width: number,
 *   height: number,
 *   compressionRatio: number
 * }} Subsampled chroma data
 */
export function subsampleChromaComponent(data, width, height, mode, filter, boundary, preserveEdges = false) {
  const factors = SUBSAMPLING_FACTORS[mode];
  if (!factors) {
    throw new Error(`Unsupported subsampling mode: ${mode}`);
  }

  const newWidth = Math.ceil(width / factors.horizontal);
  const newHeight = Math.ceil(height / factors.vertical);
  const subsampledData = new Uint8Array(newWidth * newHeight);

  // Edge detection for edge-aware processing
  let edges = null;
  if (preserveEdges) {
    edges = detectEdges(data, width, height);
  }

  // Subsample using specified filter
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = x * factors.horizontal;
      const srcY = y * factors.vertical;
      const dstIndex = y * newWidth + x;

      let value;

      switch (filter) {
        case FILTER_TYPES.BOX:
          value = applyBoxFilter(data, width, height, srcX, srcY, factors.horizontal, factors.vertical, boundary);
          break;

        case FILTER_TYPES.BILINEAR: {
          // Sample at center of subsampling block
          const centerX = srcX + (factors.horizontal - 1) / 2;
          const centerY = srcY + (factors.vertical - 1) / 2;
          value = applyBilinearFilter(data, width, height, centerX, centerY, boundary);
          break;
        }

        case FILTER_TYPES.GAUSSIAN: {
          const radius = Math.max(factors.horizontal, factors.vertical);
          const sigma = radius / 3; // 3-sigma rule
          value = applyGaussianFilter(
            data,
            width,
            height,
            srcX + Math.floor(factors.horizontal / 2),
            srcY + Math.floor(factors.vertical / 2),
            radius,
            sigma,
            boundary
          );
          break;
        }

        case FILTER_TYPES.LANCZOS: {
          // Simplified Lanczos - use bilinear for now
          const lanczosX = srcX + (factors.horizontal - 1) / 2;
          const lanczosY = srcY + (factors.vertical - 1) / 2;
          value = applyBilinearFilter(data, width, height, lanczosX, lanczosY, boundary);
          break;
        }

        default:
          throw new Error(`Unsupported filter type: ${filter}`);
      }

      // Edge preservation adjustment
      if (preserveEdges && edges) {
        const edgeIndex = Math.min(srcY * width + srcX, edges.length - 1);
        if (edges[edgeIndex] > 0) {
          // Preserve original value for edge pixels
          const originalIndex = Math.min(srcY * width + srcX, data.length - 1);
          value = data[originalIndex];
        }
      }

      subsampledData[dstIndex] = Math.max(0, Math.min(255, value));
    }
  }

  const compressionRatio = (width * height) / (newWidth * newHeight);

  return {
    data: subsampledData,
    width: newWidth,
    height: newHeight,
    compressionRatio,
  };
}

/**
 * Perform chroma subsampling on YCbCr image data.
 * Applies subsampling to Cb and Cr components while preserving Y.
 *
 * @param {Uint8Array} yData - Luminance component data
 * @param {Uint8Array} cbData - Blue-difference chroma component data
 * @param {Uint8Array} crData - Red-difference chroma component data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} options - Subsampling options
 * @returns {{
 *   yData: Uint8Array,
 *   cbData: Uint8Array,
 *   crData: Uint8Array,
 *   yWidth: number,
 *   yHeight: number,
 *   cbWidth: number,
 *   cbHeight: number,
 *   crWidth: number,
 *   crHeight: number,
 *   metadata: Object
 * }} Subsampled YCbCr data and metadata
 */
export function downsampleChroma(yData, cbData, crData, width, height, options = {}) {
  // Validate inputs
  if (!(yData instanceof Uint8Array) || !(cbData instanceof Uint8Array) || !(crData instanceof Uint8Array)) {
    throw new Error("YCbCr data must be Uint8Array instances");
  }

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error("Width must be positive integer");
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error("Height must be positive integer");
  }

  const pixelCount = width * height;

  if (yData.length < pixelCount || cbData.length < pixelCount || crData.length < pixelCount) {
    throw new Error("Insufficient YCbCr data for specified dimensions");
  }

  // Merge options with defaults
  const opts = { ...DEFAULT_SUBSAMPLING_OPTIONS, ...options };

  // Adaptive mode selection
  let mode = opts.mode;
  if (opts.adaptiveMode) {
    const analysis = analyzeChromaContent(cbData, crData, width, height);
    mode = analysis.recommendedMode;
  }

  const startTime = performance.now();

  // Y component is never subsampled
  const resultYData = new Uint8Array(yData.subarray(0, pixelCount));

  // Subsample Cb and Cr components
  const cbResult = subsampleChromaComponent(
    cbData,
    width,
    height,
    mode,
    opts.filter,
    opts.boundary,
    opts.preserveEdges
  );

  const crResult = subsampleChromaComponent(
    crData,
    width,
    height,
    mode,
    opts.filter,
    opts.boundary,
    opts.preserveEdges
  );

  const processingTime = performance.now() - startTime;

  // Calculate compression statistics
  const originalSize = pixelCount * 3; // Y + Cb + Cr
  const compressedSize = pixelCount + cbResult.data.length + crResult.data.length;
  const overallCompressionRatio = originalSize / compressedSize;

  const metadata = {
    mode,
    filter: opts.filter,
    boundary: opts.boundary,
    preserveEdges: opts.preserveEdges,
    adaptiveMode: opts.adaptiveMode,
    originalSize,
    compressedSize,
    overallCompressionRatio,
    cbCompressionRatio: cbResult.compressionRatio,
    crCompressionRatio: crResult.compressionRatio,
    processingTime,
    dataSavings: ((originalSize - compressedSize) / originalSize) * 100, // Percentage
  };

  return {
    yData: resultYData,
    cbData: cbResult.data,
    crData: crResult.data,
    yWidth: width,
    yHeight: height,
    cbWidth: cbResult.width,
    cbHeight: cbResult.height,
    crWidth: crResult.width,
    crHeight: crResult.height,
    metadata,
  };
}

/**
 * Chroma subsampling quality and performance metrics.
 * Tracks subsampling operations and quality impact.
 */
export class SubsamplingMetrics {
  /**
   * Create subsampling metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.operationsPerformed = 0;
    /** @type {number} */
    this.totalPixelsProcessed = 0;
    /** @type {number} */
    this.totalDataSaved = 0;
    /** @type {number} */
    this.totalProcessingTime = 0;
    /** @type {Object<string, number>} */
    this.modeUsage = {};
    /** @type {Object<string, number>} */
    this.filterUsage = {};
    /** @type {number[]} */
    this.compressionRatios = [];
    /** @type {number[]} */
    this.processingTimes = [];
    /** @type {string[]} */
    this.errors = [];
  }

  /**
   * Record subsampling operation.
   *
   * @param {{
   *   mode: string,
   *   filter: string,
   *   originalSize: number,
   *   compressedSize: number,
   *   overallCompressionRatio: number,
   *   processingTime: number,
   *   dataSavings: number
   * }} metadata - Subsampling metadata
   */
  recordOperation(metadata) {
    this.operationsPerformed++;
    this.totalPixelsProcessed += metadata.originalSize / 3; // Assuming YCbCr
    this.totalDataSaved += metadata.originalSize - metadata.compressedSize;
    this.totalProcessingTime += metadata.processingTime;

    this.modeUsage[metadata.mode] = (this.modeUsage[metadata.mode] || 0) + 1;
    this.filterUsage[metadata.filter] = (this.filterUsage[metadata.filter] || 0) + 1;

    this.compressionRatios.push(metadata.overallCompressionRatio);
    this.processingTimes.push(metadata.processingTime);
  }

  /**
   * Record subsampling error.
   *
   * @param {string} error - Error message
   */
  recordError(error) {
    this.errors.push(error);
  }

  /**
   * Get subsampling metrics summary.
   *
   * @returns {{
   *   operationsPerformed: number,
   *   totalPixelsProcessed: number,
   *   averageCompressionRatio: number,
   *   averageDataSavings: number,
   *   averageProcessingTime: number,
   *   pixelsPerSecond: number,
   *   modeDistribution: Object<string, number>,
   *   filterDistribution: Object<string, number>,
   *   errorCount: number,
   *   description: string
   * }} Metrics summary
   */
  getSummary() {
    const averageCompressionRatio =
      this.compressionRatios.length > 0
        ? this.compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / this.compressionRatios.length
        : 0;

    const averageDataSavings =
      this.totalPixelsProcessed > 0 ? (this.totalDataSaved / (this.totalPixelsProcessed * 3)) * 100 : 0;

    const averageProcessingTime =
      this.operationsPerformed > 0 ? this.totalProcessingTime / this.operationsPerformed : 0;

    const pixelsPerSecond =
      this.totalProcessingTime > 0 ? Math.round((this.totalPixelsProcessed / this.totalProcessingTime) * 1000) : 0;

    return {
      operationsPerformed: this.operationsPerformed,
      totalPixelsProcessed: this.totalPixelsProcessed,
      averageCompressionRatio: Math.round(averageCompressionRatio * 100) / 100,
      averageDataSavings: Math.round(averageDataSavings * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      pixelsPerSecond,
      modeDistribution: { ...this.modeUsage },
      filterDistribution: { ...this.filterUsage },
      errorCount: this.errors.length,
      description: `Chroma subsampling: ${this.operationsPerformed} operations, ${this.totalPixelsProcessed.toLocaleString()} pixels, ${averageDataSavings.toFixed(1)}% data savings`,
    };
  }

  /**
   * Reset subsampling metrics.
   */
  reset() {
    this.operationsPerformed = 0;
    this.totalPixelsProcessed = 0;
    this.totalDataSaved = 0;
    this.totalProcessingTime = 0;
    this.modeUsage = {};
    this.filterUsage = {};
    this.compressionRatios = [];
    this.processingTimes = [];
    this.errors = [];
  }
}

/**
 * Estimate quality impact of chroma subsampling.
 * Analyzes potential quality loss from subsampling operation.
 *
 * @param {Uint8Array} cbData - Original Cb component data
 * @param {Uint8Array} crData - Original Cr component data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} mode - Subsampling mode
 * @param {Object} _options - Analysis options (unused)
 * @returns {{
 *   qualityScore: number,
 *   expectedArtifacts: string[],
 *   recommendations: string[],
 *   suitability: string
 * }} Quality impact assessment
 */
export function estimateQualityImpact(cbData, crData, width, height, mode, _options = {}) {
  const analysis = analyzeChromaContent(cbData, crData, width, height);
  const qualityImpact = analysis.qualityImpact[mode] || 0;

  // Calculate quality score (0-100, higher is better)
  const qualityScore = Math.max(0, 100 - qualityImpact * 100);

  const expectedArtifacts = [];
  const recommendations = [];

  // Analyze potential artifacts
  if (mode === SUBSAMPLING_MODES.YUV420 || mode === SUBSAMPLING_MODES.YUV411) {
    if (analysis.edgeDensity > 0.2) {
      expectedArtifacts.push("Color bleeding at sharp edges");
      recommendations.push("Consider edge-preserving filters");
    }
    if (analysis.chromaActivity > 30) {
      expectedArtifacts.push("Loss of fine color details");
      recommendations.push("Use higher quality subsampling mode");
    }
  }

  if (mode === SUBSAMPLING_MODES.YUV411) {
    expectedArtifacts.push("Horizontal color smearing");
    if (analysis.colorComplexity > 0.7) {
      recommendations.push("Avoid 4:1:1 subsampling for colorful content");
    }
  }

  // Determine suitability
  let suitability;
  if (qualityScore > 85) {
    suitability = "Excellent - minimal quality impact";
  } else if (qualityScore > 70) {
    suitability = "Good - acceptable quality trade-off";
  } else if (qualityScore > 50) {
    suitability = "Fair - noticeable quality reduction";
  } else {
    suitability = "Poor - significant quality loss expected";
  }

  return {
    qualityScore: Math.round(qualityScore),
    expectedArtifacts,
    recommendations,
    suitability,
  };
}
