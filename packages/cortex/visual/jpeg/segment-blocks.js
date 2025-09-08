/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Image segmentation into 8×8 blocks for JPEG encoding.
 *
 * Implements ITU-T T.81 block-based processing by dividing YCbCr image data
 * into 8×8 pixel blocks for DCT transformation. Handles boundary padding,
 * subsampling integration, and memory layout optimization for efficient
 * pipeline processing.
 */

/**
 * Standard JPEG block dimensions.
 * All JPEG processing uses 8×8 pixel blocks.
 */
export const BLOCK_SIZE = 8;

/**
 * Padding strategies for non-multiple-of-8 dimensions.
 * Different approaches for handling partial blocks.
 */
export const PADDING_MODES = {
  /** Fill with zero values */
  ZERO: "zero",
  /** Replicate edge pixels */
  EDGE: "edge",
  /** Reflect pixels across boundary */
  REFLECT: "reflect",
  /** Wrap around to opposite edge */
  WRAP: "wrap",
  /** Fill with neutral values (128 for chroma, 0 for luma) */
  NEUTRAL: "neutral",
};

/**
 * Block extraction modes.
 * Different strategies for block ordering and processing.
 */
export const EXTRACTION_MODES = {
  /** Standard raster scan order (left-to-right, top-to-bottom) */
  RASTER: "raster",
  /** Interleaved component processing */
  INTERLEAVED: "interleaved",
  /** Progressive scan order */
  PROGRESSIVE: "progressive",
  /** Optimized for cache efficiency */
  CACHE_OPTIMIZED: "cache_optimized",
};

/**
 * Component types for block processing.
 * Different handling for luminance vs chrominance.
 */
export const COMPONENT_TYPES = {
  /** Luminance component */
  LUMA: "luma",
  /** Chrominance components */
  CHROMA: "chroma",
};

/**
 * Subsampling factors for different JPEG modes.
 * Determines block counts for each component.
 * @type {{[key: string]: {horizontal: number, vertical: number}}}
 */
export const SUBSAMPLING_FACTORS = {
  "4:4:4": { horizontal: 1, vertical: 1 },
  "4:2:2": { horizontal: 2, vertical: 1 },
  "4:2:0": { horizontal: 2, vertical: 2 },
  "4:1:1": { horizontal: 4, vertical: 1 },
};

/**
 * Default segmentation options.
 * Standard settings for block extraction.
 */
export const DEFAULT_SEGMENTATION_OPTIONS = {
  paddingMode: PADDING_MODES.EDGE,
  extractionMode: EXTRACTION_MODES.RASTER,
  preserveBoundaries: true,
  optimizeMemory: true,
  validateBlocks: true,
};

/**
 * Calculate required padding for image dimensions.
 * Determines how many pixels need to be added to make dimensions divisible by 8.
 *
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {{
 *   paddedWidth: number,
 *   paddedHeight: number,
 *   horizontalPadding: number,
 *   verticalPadding: number,
 *   needsPadding: boolean
 * }} Padding requirements
 */
export function calculatePadding(width, height) {
  if (!Number.isInteger(width) || width <= 0) {
    throw new Error("Width must be positive integer");
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new Error("Height must be positive integer");
  }

  const horizontalPadding = (BLOCK_SIZE - (width % BLOCK_SIZE)) % BLOCK_SIZE;
  const verticalPadding = (BLOCK_SIZE - (height % BLOCK_SIZE)) % BLOCK_SIZE;

  const paddedWidth = width + horizontalPadding;
  const paddedHeight = height + verticalPadding;
  const needsPadding = horizontalPadding > 0 || verticalPadding > 0;

  return {
    paddedWidth,
    paddedHeight,
    horizontalPadding,
    verticalPadding,
    needsPadding,
  };
}

/**
 * Apply padding to image data.
 * Extends image data to make dimensions divisible by 8.
 *
 * @param {Uint8Array} data - Original image data
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} paddedWidth - Target padded width
 * @param {number} paddedHeight - Target padded height
 * @param {string} paddingMode - Padding strategy
 * @param {string} componentType - Component type (luma/chroma)
 * @returns {Uint8Array} Padded image data
 */
export function applyPadding(data, width, height, paddedWidth, paddedHeight, paddingMode, componentType) {
  if (!(data instanceof Uint8Array)) {
    throw new Error("Data must be Uint8Array");
  }

  if (data.length < width * height) {
    throw new Error("Insufficient data for specified dimensions");
  }

  if (paddedWidth < width || paddedHeight < height) {
    throw new Error("Padded dimensions must be >= original dimensions");
  }

  // If no padding needed, return copy of original data
  if (paddedWidth === width && paddedHeight === height) {
    return new Uint8Array(data.subarray(0, width * height));
  }

  const paddedData = new Uint8Array(paddedWidth * paddedHeight);
  const neutralValue = componentType === COMPONENT_TYPES.CHROMA ? 128 : 0;

  // Copy original data
  for (let y = 0; y < height; y++) {
    const srcOffset = y * width;
    const dstOffset = y * paddedWidth;
    paddedData.set(data.subarray(srcOffset, srcOffset + width), dstOffset);
  }

  // Apply padding
  switch (paddingMode) {
    case PADDING_MODES.ZERO:
      // Already initialized to zero
      break;

    case PADDING_MODES.NEUTRAL:
      // Fill padding areas with neutral value
      for (let y = 0; y < paddedHeight; y++) {
        for (let x = width; x < paddedWidth; x++) {
          paddedData[y * paddedWidth + x] = neutralValue;
        }
      }
      for (let y = height; y < paddedHeight; y++) {
        for (let x = 0; x < paddedWidth; x++) {
          paddedData[y * paddedWidth + x] = neutralValue;
        }
      }
      break;

    case PADDING_MODES.EDGE:
      // Replicate edge pixels
      for (let y = 0; y < height; y++) {
        const edgeValue = paddedData[y * paddedWidth + (width - 1)];
        for (let x = width; x < paddedWidth; x++) {
          paddedData[y * paddedWidth + x] = edgeValue;
        }
      }
      // Replicate bottom edge
      for (let y = height; y < paddedHeight; y++) {
        for (let x = 0; x < paddedWidth; x++) {
          paddedData[y * paddedWidth + x] = paddedData[(height - 1) * paddedWidth + x];
        }
      }
      break;

    case PADDING_MODES.REFLECT:
      // Reflect pixels across boundary
      for (let y = 0; y < height; y++) {
        for (let x = width; x < paddedWidth; x++) {
          const reflectX = width - 1 - ((x - width) % width);
          paddedData[y * paddedWidth + x] = paddedData[y * paddedWidth + reflectX];
        }
      }
      // Reflect vertically
      for (let y = height; y < paddedHeight; y++) {
        const reflectY = height - 1 - ((y - height) % height);
        for (let x = 0; x < paddedWidth; x++) {
          paddedData[y * paddedWidth + x] = paddedData[reflectY * paddedWidth + x];
        }
      }
      break;

    case PADDING_MODES.WRAP:
      // Wrap around to opposite edge
      for (let y = 0; y < height; y++) {
        for (let x = width; x < paddedWidth; x++) {
          const wrapX = (x - width) % width;
          paddedData[y * paddedWidth + x] = paddedData[y * paddedWidth + wrapX];
        }
      }
      // Wrap vertically
      for (let y = height; y < paddedHeight; y++) {
        const wrapY = (y - height) % height;
        for (let x = 0; x < paddedWidth; x++) {
          paddedData[y * paddedWidth + x] = paddedData[wrapY * paddedWidth + x];
        }
      }
      break;

    default:
      throw new Error(`Unknown padding mode: ${paddingMode}`);
  }

  return paddedData;
}

/**
 * Extract single 8×8 block from image data.
 * Extracts a specific block at given block coordinates.
 *
 * @param {Uint8Array} data - Image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} blockX - Block x coordinate (in blocks, not pixels)
 * @param {number} blockY - Block y coordinate (in blocks, not pixels)
 * @returns {Uint8Array} 8×8 block data (64 values)
 */
export function extractBlock(data, width, height, blockX, blockY) {
  if (!(data instanceof Uint8Array)) {
    throw new Error("Data must be Uint8Array");
  }

  if (!Number.isInteger(blockX) || blockX < 0) {
    throw new Error("Block X must be non-negative integer");
  }

  if (!Number.isInteger(blockY) || blockY < 0) {
    throw new Error("Block Y must be non-negative integer");
  }

  const pixelX = blockX * BLOCK_SIZE;
  const pixelY = blockY * BLOCK_SIZE;

  if (pixelX + BLOCK_SIZE > width || pixelY + BLOCK_SIZE > height) {
    throw new Error("Block extends beyond image boundaries");
  }

  const block = new Uint8Array(BLOCK_SIZE * BLOCK_SIZE);

  for (let y = 0; y < BLOCK_SIZE; y++) {
    const srcOffset = (pixelY + y) * width + pixelX;
    const dstOffset = y * BLOCK_SIZE;
    block.set(data.subarray(srcOffset, srcOffset + BLOCK_SIZE), dstOffset);
  }

  return block;
}

/**
 * Extract all blocks from component data.
 * Segments entire component into 8×8 blocks with specified ordering.
 *
 * @param {Uint8Array} data - Component image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} extractionMode - Block extraction order
 * @returns {{
 *   blocks: Uint8Array[],
 *   blocksHorizontal: number,
 *   blocksVertical: number,
 *   totalBlocks: number
 * }} Extracted blocks and metadata
 */
export function extractComponentBlocks(data, width, height, extractionMode = EXTRACTION_MODES.RASTER) {
  if (!(data instanceof Uint8Array)) {
    throw new Error("Data must be Uint8Array");
  }

  if (width % BLOCK_SIZE !== 0 || height % BLOCK_SIZE !== 0) {
    throw new Error("Dimensions must be divisible by 8 (apply padding first)");
  }

  const blocksHorizontal = width / BLOCK_SIZE;
  const blocksVertical = height / BLOCK_SIZE;
  const totalBlocks = blocksHorizontal * blocksVertical;

  const blocks = [];

  switch (extractionMode) {
    case EXTRACTION_MODES.RASTER: {
      // Standard left-to-right, top-to-bottom order
      for (let blockY = 0; blockY < blocksVertical; blockY++) {
        for (let blockX = 0; blockX < blocksHorizontal; blockX++) {
          const block = extractBlock(data, width, height, blockX, blockY);
          blocks.push(block);
        }
      }
      break;
    }

    case EXTRACTION_MODES.CACHE_OPTIMIZED: {
      // Process blocks in cache-friendly order (small tiles)
      const tileSize = 4; // Process 4×4 blocks at a time
      for (let tileY = 0; tileY < blocksVertical; tileY += tileSize) {
        for (let tileX = 0; tileX < blocksHorizontal; tileX += tileSize) {
          for (let blockY = tileY; blockY < Math.min(tileY + tileSize, blocksVertical); blockY++) {
            for (let blockX = tileX; blockX < Math.min(tileX + tileSize, blocksHorizontal); blockX++) {
              const block = extractBlock(data, width, height, blockX, blockY);
              blocks.push(block);
            }
          }
        }
      }
      break;
    }

    case EXTRACTION_MODES.PROGRESSIVE: {
      // Order optimized for progressive JPEG (frequency-based)
      // For now, use raster order (can be enhanced for specific progressive patterns)
      for (let blockY = 0; blockY < blocksVertical; blockY++) {
        for (let blockX = 0; blockX < blocksHorizontal; blockX++) {
          const block = extractBlock(data, width, height, blockX, blockY);
          blocks.push(block);
        }
      }
      break;
    }

    case EXTRACTION_MODES.INTERLEAVED: {
      // Interleaved order (useful for multi-component processing)
      for (let blockY = 0; blockY < blocksVertical; blockY++) {
        for (let blockX = 0; blockX < blocksHorizontal; blockX++) {
          const block = extractBlock(data, width, height, blockX, blockY);
          blocks.push(block);
        }
      }
      break;
    }

    default:
      throw new Error(`Unknown extraction mode: ${extractionMode}`);
  }

  return {
    blocks,
    blocksHorizontal,
    blocksVertical,
    totalBlocks,
  };
}

/**
 * Calculate block counts for subsampled components.
 * Determines how many blocks each component will have based on subsampling.
 *
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height
 * @param {string} subsamplingMode - Subsampling mode (4:4:4, 4:2:2, etc.)
 * @returns {{
 *   luma: {width: number, height: number, blocks: number},
 *   chroma: {width: number, height: number, blocks: number},
 *   totalBlocks: number
 * }} Block counts for each component type
 */
export function calculateBlockCounts(imageWidth, imageHeight, subsamplingMode) {
  const factors = SUBSAMPLING_FACTORS[subsamplingMode];
  if (!factors) {
    throw new Error(`Unknown subsampling mode: ${subsamplingMode}`);
  }

  // Calculate padded dimensions
  const padding = calculatePadding(imageWidth, imageHeight);
  const lumaWidth = padding.paddedWidth;
  const lumaHeight = padding.paddedHeight;

  // Luma blocks (always full resolution)
  const lumaBlocksH = lumaWidth / BLOCK_SIZE;
  const lumaBlocksV = lumaHeight / BLOCK_SIZE;
  const lumaBlocks = lumaBlocksH * lumaBlocksV;

  // Chroma dimensions after subsampling
  const chromaWidth = lumaWidth / factors.horizontal;
  const chromaHeight = lumaHeight / factors.vertical;

  // Chroma blocks
  const chromaBlocksH = chromaWidth / BLOCK_SIZE;
  const chromaBlocksV = chromaHeight / BLOCK_SIZE;
  const chromaBlocks = chromaBlocksH * chromaBlocksV;

  const totalBlocks = lumaBlocks + 2 * chromaBlocks; // Y + Cb + Cr

  return {
    luma: {
      width: lumaBlocksH,
      height: lumaBlocksV,
      blocks: lumaBlocks,
    },
    chroma: {
      width: chromaBlocksH,
      height: chromaBlocksV,
      blocks: chromaBlocks,
    },
    totalBlocks,
  };
}

/**
 * Segment YCbCr image data into 8×8 blocks.
 * Complete segmentation pipeline with padding, subsampling, and block extraction.
 *
 * @param {Uint8Array} yData - Luminance component data
 * @param {Uint8Array} cbData - Blue-difference chroma component data
 * @param {Uint8Array} crData - Red-difference chroma component data
 * @param {number} yWidth - Luminance width
 * @param {number} yHeight - Luminance height
 * @param {number} cbWidth - Chroma width
 * @param {number} cbHeight - Chroma height
 * @param {number} crWidth - Chroma width (should match cbWidth)
 * @param {number} crHeight - Chroma height (should match cbHeight)
 * @param {Object} options - Segmentation options
 * @returns {{
 *   yBlocks: Uint8Array[],
 *   cbBlocks: Uint8Array[],
 *   crBlocks: Uint8Array[],
 *   yBlocksH: number,
 *   yBlocksV: number,
 *   cbBlocksH: number,
 *   cbBlocksV: number,
 *   crBlocksH: number,
 *   crBlocksV: number,
 *   metadata: Object
 * }} Segmented blocks and metadata
 */
export function segmentYcbcrBlocks(
  yData,
  cbData,
  crData,
  yWidth,
  yHeight,
  cbWidth,
  cbHeight,
  crWidth,
  crHeight,
  options = {}
) {
  // Validate inputs
  if (!(yData instanceof Uint8Array) || !(cbData instanceof Uint8Array) || !(crData instanceof Uint8Array)) {
    throw new Error("YCbCr data must be Uint8Array instances");
  }

  if (!Number.isInteger(yWidth) || yWidth <= 0 || !Number.isInteger(yHeight) || yHeight <= 0) {
    throw new Error("Luma dimensions must be positive integers");
  }

  if (!Number.isInteger(cbWidth) || cbWidth <= 0 || !Number.isInteger(cbHeight) || cbHeight <= 0) {
    throw new Error("Chroma dimensions must be positive integers");
  }

  if (crWidth !== cbWidth || crHeight !== cbHeight) {
    throw new Error("Cb and Cr dimensions must match");
  }

  const pixelCount = yWidth * yHeight;
  const chromaPixelCount = cbWidth * cbHeight;

  if (yData.length < pixelCount) {
    throw new Error("Insufficient Y data");
  }
  if (cbData.length < chromaPixelCount || crData.length < chromaPixelCount) {
    throw new Error("Insufficient chroma data");
  }

  // Merge options with defaults
  const opts = { ...DEFAULT_SEGMENTATION_OPTIONS, ...options };

  const startTime = performance.now();

  // Calculate padding requirements
  const yPadding = calculatePadding(yWidth, yHeight);
  const cbPadding = calculatePadding(cbWidth, cbHeight);
  const crPadding = calculatePadding(crWidth, crHeight);

  // Apply padding if needed
  const paddedYData = yPadding.needsPadding
    ? applyPadding(
        yData,
        yWidth,
        yHeight,
        yPadding.paddedWidth,
        yPadding.paddedHeight,
        opts.paddingMode,
        COMPONENT_TYPES.LUMA
      )
    : new Uint8Array(yData.subarray(0, pixelCount));

  const paddedCbData = cbPadding.needsPadding
    ? applyPadding(
        cbData,
        cbWidth,
        cbHeight,
        cbPadding.paddedWidth,
        cbPadding.paddedHeight,
        opts.paddingMode,
        COMPONENT_TYPES.CHROMA
      )
    : new Uint8Array(cbData.subarray(0, chromaPixelCount));

  const paddedCrData = crPadding.needsPadding
    ? applyPadding(
        crData,
        crWidth,
        crHeight,
        crPadding.paddedWidth,
        crPadding.paddedHeight,
        opts.paddingMode,
        COMPONENT_TYPES.CHROMA
      )
    : new Uint8Array(crData.subarray(0, chromaPixelCount));

  // Extract blocks from each component
  const yResult = extractComponentBlocks(paddedYData, yPadding.paddedWidth, yPadding.paddedHeight, opts.extractionMode);
  const cbResult = extractComponentBlocks(
    paddedCbData,
    cbPadding.paddedWidth,
    cbPadding.paddedHeight,
    opts.extractionMode
  );
  const crResult = extractComponentBlocks(
    paddedCrData,
    crPadding.paddedWidth,
    crPadding.paddedHeight,
    opts.extractionMode
  );

  // Validate block extraction if requested
  if (opts.validateBlocks) {
    const expectedYBlocks = (yPadding.paddedWidth / BLOCK_SIZE) * (yPadding.paddedHeight / BLOCK_SIZE);
    const expectedCbBlocks = (cbPadding.paddedWidth / BLOCK_SIZE) * (cbPadding.paddedHeight / BLOCK_SIZE);
    const expectedCrBlocks = (crPadding.paddedWidth / BLOCK_SIZE) * (crPadding.paddedHeight / BLOCK_SIZE);

    if (yResult.totalBlocks !== expectedYBlocks) {
      throw new Error(`Y block count mismatch: expected ${expectedYBlocks}, got ${yResult.totalBlocks}`);
    }
    if (cbResult.totalBlocks !== expectedCbBlocks) {
      throw new Error(`Cb block count mismatch: expected ${expectedCbBlocks}, got ${cbResult.totalBlocks}`);
    }
    if (crResult.totalBlocks !== expectedCrBlocks) {
      throw new Error(`Cr block count mismatch: expected ${expectedCrBlocks}, got ${crResult.totalBlocks}`);
    }
  }

  const processingTime = performance.now() - startTime;

  // Calculate memory usage
  const originalSize = yData.length + cbData.length + crData.length;
  const paddedSize = paddedYData.length + paddedCbData.length + paddedCrData.length;
  const blockSize = yResult.blocks.length * 64 + cbResult.blocks.length * 64 + crResult.blocks.length * 64;

  const metadata = {
    paddingMode: opts.paddingMode,
    extractionMode: opts.extractionMode,
    originalDimensions: {
      yWidth,
      yHeight,
      cbWidth,
      cbHeight,
      crWidth,
      crHeight,
    },
    paddedDimensions: {
      yWidth: yPadding.paddedWidth,
      yHeight: yPadding.paddedHeight,
      cbWidth: cbPadding.paddedWidth,
      cbHeight: cbPadding.paddedHeight,
      crWidth: crPadding.paddedWidth,
      crHeight: crPadding.paddedHeight,
    },
    padding: {
      y: yPadding,
      cb: cbPadding,
      cr: crPadding,
    },
    blockCounts: {
      y: yResult.totalBlocks,
      cb: cbResult.totalBlocks,
      cr: crResult.totalBlocks,
      total: yResult.totalBlocks + cbResult.totalBlocks + crResult.totalBlocks,
    },
    memoryUsage: {
      originalSize,
      paddedSize,
      blockSize,
      overhead: blockSize - originalSize,
    },
    processingTime,
  };

  return {
    yBlocks: yResult.blocks,
    cbBlocks: cbResult.blocks,
    crBlocks: crResult.blocks,
    yBlocksH: yResult.blocksHorizontal,
    yBlocksV: yResult.blocksVertical,
    cbBlocksH: cbResult.blocksHorizontal,
    cbBlocksV: cbResult.blocksVertical,
    crBlocksH: crResult.blocksHorizontal,
    crBlocksV: crResult.blocksVertical,
    metadata,
  };
}

/**
 * Block segmentation quality and performance metrics.
 * Tracks segmentation operations and performance characteristics.
 */
export class SegmentationMetrics {
  /**
   * Create segmentation metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.operationsPerformed = 0;
    /** @type {number} */
    this.totalPixelsProcessed = 0;
    /** @type {number} */
    this.totalBlocksExtracted = 0;
    /** @type {number} */
    this.totalPaddingApplied = 0;
    /** @type {number} */
    this.totalProcessingTime = 0;
    /** @type {Object<string, number>} */
    this.paddingModeUsage = {};
    /** @type {Object<string, number>} */
    this.extractionModeUsage = {};
    /** @type {number[]} */
    this.processingTimes = [];
    /** @type {string[]} */
    this.errors = [];
  }

  /**
   * Record segmentation operation.
   *
   * @param {{
   *   paddingMode: string,
   *   extractionMode: string,
   *   originalSize: number,
   *   paddedSize: number,
   *   blockSize: number,
   *   processingTime: number,
   *   blockCounts: {total: number}
   * }} metadata - Segmentation metadata
   */
  recordOperation(metadata) {
    this.operationsPerformed++;
    this.totalPixelsProcessed += metadata.originalSize;
    this.totalBlocksExtracted += metadata.blockCounts.total;
    this.totalPaddingApplied += metadata.paddedSize - metadata.originalSize;
    this.totalProcessingTime += metadata.processingTime;

    this.paddingModeUsage[metadata.paddingMode] = (this.paddingModeUsage[metadata.paddingMode] || 0) + 1;
    this.extractionModeUsage[metadata.extractionMode] = (this.extractionModeUsage[metadata.extractionMode] || 0) + 1;

    this.processingTimes.push(metadata.processingTime);
  }

  /**
   * Record segmentation error.
   *
   * @param {string} error - Error message
   */
  recordError(error) {
    this.errors.push(error);
  }

  /**
   * Get segmentation metrics summary.
   *
   * @returns {{
   *   operationsPerformed: number,
   *   totalPixelsProcessed: number,
   *   totalBlocksExtracted: number,
   *   averageBlocksPerOperation: number,
   *   paddingRatio: number,
   *   averageProcessingTime: number,
   *   pixelsPerSecond: number,
   *   paddingModeDistribution: Object<string, number>,
   *   extractionModeDistribution: Object<string, number>,
   *   errorCount: number,
   *   description: string
   * }} Metrics summary
   */
  getSummary() {
    const averageBlocksPerOperation =
      this.operationsPerformed > 0 ? Math.round(this.totalBlocksExtracted / this.operationsPerformed) : 0;

    const paddingRatio = this.totalPixelsProcessed > 0 ? this.totalPaddingApplied / this.totalPixelsProcessed : 0;

    const averageProcessingTime =
      this.operationsPerformed > 0 ? this.totalProcessingTime / this.operationsPerformed : 0;

    const pixelsPerSecond =
      this.totalProcessingTime > 0 ? Math.round((this.totalPixelsProcessed / this.totalProcessingTime) * 1000) : 0;

    return {
      operationsPerformed: this.operationsPerformed,
      totalPixelsProcessed: this.totalPixelsProcessed,
      totalBlocksExtracted: this.totalBlocksExtracted,
      averageBlocksPerOperation,
      paddingRatio: Math.round(paddingRatio * 10000) / 100, // Percentage with 2 decimals
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      pixelsPerSecond,
      paddingModeDistribution: { ...this.paddingModeUsage },
      extractionModeDistribution: { ...this.extractionModeUsage },
      errorCount: this.errors.length,
      description: `Block segmentation: ${this.operationsPerformed} operations, ${this.totalBlocksExtracted.toLocaleString()} blocks, ${pixelsPerSecond.toLocaleString()} px/s`,
    };
  }

  /**
   * Reset segmentation metrics.
   */
  reset() {
    this.operationsPerformed = 0;
    this.totalPixelsProcessed = 0;
    this.totalBlocksExtracted = 0;
    this.totalPaddingApplied = 0;
    this.totalProcessingTime = 0;
    this.paddingModeUsage = {};
    this.extractionModeUsage = {};
    this.processingTimes = [];
    this.errors = [];
  }
}

/**
 * Validate block data integrity.
 * Checks that extracted blocks contain valid data.
 *
 * @param {Uint8Array[]} blocks - Array of 8×8 blocks
 * @param {string} _componentType - Component type (luma/chroma)
 * @returns {{
 *   isValid: boolean,
 *   blockCount: number,
 *   invalidBlocks: number[],
 *   statistics: {
 *     minValue: number,
 *     maxValue: number,
 *     meanValue: number,
 *     valueRange: number
 *   }
 * }} Validation results
 */
export function validateBlocks(blocks, _componentType = COMPONENT_TYPES.LUMA) {
  if (!Array.isArray(blocks)) {
    throw new Error("Blocks must be an array");
  }

  const invalidBlocks = [];
  let totalValues = 0;
  let valueSum = 0;
  let minValue = 255;
  let maxValue = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Check block is Uint8Array with correct size
    if (!(block instanceof Uint8Array) || block.length !== 64) {
      invalidBlocks.push(i);
      continue;
    }

    // Analyze block values
    for (let j = 0; j < 64; j++) {
      const value = block[j];
      if (value < 0 || value > 255) {
        invalidBlocks.push(i);
        break;
      }
      valueSum += value;
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
      totalValues++;
    }
  }

  const meanValue = totalValues > 0 ? valueSum / totalValues : 0;
  const valueRange = maxValue - minValue;
  const isValid = invalidBlocks.length === 0;

  return {
    isValid,
    blockCount: blocks.length,
    invalidBlocks,
    statistics: {
      minValue,
      maxValue,
      meanValue: Math.round(meanValue * 100) / 100,
      valueRange,
    },
  };
}

/**
 * Optimize block memory layout.
 * Reorganizes blocks for better cache performance.
 *
 * @param {Uint8Array[]} blocks - Array of blocks to optimize
 * @param {number} blocksHorizontal - Number of blocks horizontally
 * @param {number} blocksVertical - Number of blocks vertically
 * @param {string} _optimizationMode - Optimization strategy (unused)
 * @returns {{
 *   optimizedBlocks: Uint8Array[],
 *   reorderMap: number[],
 *   cacheEfficiency: number
 * }} Optimized block layout
 */
export function optimizeBlockLayout(blocks, blocksHorizontal, blocksVertical, _optimizationMode = "cache") {
  if (!Array.isArray(blocks)) {
    throw new Error("Blocks must be an array");
  }

  const expectedBlocks = blocksHorizontal * blocksVertical;
  if (blocks.length !== expectedBlocks) {
    throw new Error(`Block count mismatch: expected ${expectedBlocks}, got ${blocks.length}`);
  }

  // For now, return blocks in original order
  // Can be enhanced with specific optimization strategies
  const optimizedBlocks = [...blocks];
  const reorderMap = Array.from({ length: blocks.length }, (_, i) => i);
  const cacheEfficiency = 1.0; // Placeholder

  return {
    optimizedBlocks,
    reorderMap,
    cacheEfficiency,
  };
}
