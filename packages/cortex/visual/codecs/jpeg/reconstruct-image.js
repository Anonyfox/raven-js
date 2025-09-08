/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG image block reconstruction implementation.
 *
 * Implements ITU-T T.81 image reconstruction by assembling processed 8x8 pixel
 * blocks back into the final decoded image. Handles boundary conditions for
 * non-multiple-of-8 dimensions, manages different component layouts (Y/Cb/Cr),
 * and ensures proper pixel ordering with optimized memory access patterns.
 */

/**
 * Standard JPEG block size (8x8 pixels).
 * All DCT processing operates on 8x8 blocks.
 *
 * @type {number}
 */
export const BLOCK_SIZE = 8;

/**
 * Maximum reasonable image dimension.
 * Prevents memory exhaustion attacks.
 *
 * @type {number}
 */
export const MAX_IMAGE_DIMENSION = 65535;

/**
 * Component types for JPEG images.
 * Defines the different color components.
 */
export const COMPONENT_TYPES = {
  /** Luminance component */
  Y: "Y",
  /** Blue chroma component */
  CB: "Cb",
  /** Red chroma component */
  CR: "Cr",
  /** Cyan component (CMYK) */
  C: "C",
  /** Magenta component (CMYK) */
  M: "M",
  /** Yellow component (CMYK) */
  YK: "Yk",
  /** Black component (CMYK) */
  K: "K",
};

/**
 * Image layouts for different JPEG variants.
 * Defines how components are organized in memory.
 */
export const IMAGE_LAYOUTS = {
  /** Grayscale (Y only) */
  GRAYSCALE: "grayscale",
  /** YCbCr color */
  YCBCR: "ycbcr",
  /** RGB color */
  RGB: "rgb",
  /** CMYK color (print) */
  CMYK: "cmyk",
};

/**
 * Block assembly modes for different processing strategies.
 * Defines how blocks are combined into the final image.
 */
export const ASSEMBLY_MODES = {
  /** Sequential block-by-block assembly */
  SEQUENTIAL: "sequential",
  /** Interleaved MCU assembly */
  INTERLEAVED: "interleaved",
  /** Progressive multi-pass assembly */
  PROGRESSIVE: "progressive",
};

/**
 * Calculate block grid dimensions for an image.
 * Determines how many 8x8 blocks are needed to cover the image.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {{blocksWide: number, blocksHigh: number, totalBlocks: number}} Block grid dimensions
 * @throws {Error} If dimensions are invalid
 */
export function calculateBlockGrid(width, height) {
  if (typeof width !== "number" || typeof height !== "number") {
    throw new Error("Width and height must be numbers");
  }

  if (width <= 0 || height <= 0) {
    throw new Error("Width and height must be positive");
  }

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error(`Image dimensions exceed maximum ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}`);
  }

  const blocksWide = Math.ceil(width / BLOCK_SIZE);
  const blocksHigh = Math.ceil(height / BLOCK_SIZE);
  const totalBlocks = blocksWide * blocksHigh;

  return {
    blocksWide,
    blocksHigh,
    totalBlocks,
  };
}

/**
 * Calculate effective block dimensions considering image boundaries.
 * Handles partial blocks at image edges.
 *
 * @param {number} blockX - Block X coordinate (0-based)
 * @param {number} blockY - Block Y coordinate (0-based)
 * @param {number} imageWidth - Total image width
 * @param {number} imageHeight - Total image height
 * @returns {{width: number, height: number, paddedWidth: number, paddedHeight: number}} Block dimensions
 */
export function calculateBlockDimensions(blockX, blockY, imageWidth, imageHeight) {
  const startX = blockX * BLOCK_SIZE;
  const startY = blockY * BLOCK_SIZE;

  const width = Math.min(BLOCK_SIZE, imageWidth - startX);
  const height = Math.min(BLOCK_SIZE, imageHeight - startY);

  return {
    width,
    height,
    paddedWidth: BLOCK_SIZE,
    paddedHeight: BLOCK_SIZE,
  };
}

/**
 * Copy a block of pixels into target image buffer.
 * Handles boundary conditions and partial blocks.
 *
 * @param {Uint8Array} blockData - 64-element block data
 * @param {Uint8Array} imageBuffer - Target image buffer
 * @param {number} blockX - Block X coordinate
 * @param {number} blockY - Block Y coordinate
 * @param {number} imageWidth - Image width
 * @param {number} imageHeight - Image height
 * @throws {Error} If parameters are invalid
 */
export function copyBlockToImage(blockData, imageBuffer, blockX, blockY, imageWidth, imageHeight) {
  // Validate inputs
  if (!(blockData instanceof Uint8Array) || blockData.length !== 64) {
    throw new Error("Block data must be 64-element Uint8Array");
  }

  if (!(imageBuffer instanceof Uint8Array)) {
    throw new Error("Image buffer must be Uint8Array");
  }

  if (imageBuffer.length !== imageWidth * imageHeight) {
    throw new Error("Image buffer size doesn't match dimensions");
  }

  if (blockX < 0 || blockY < 0) {
    throw new Error("Block coordinates must be non-negative");
  }

  const blockDims = calculateBlockDimensions(blockX, blockY, imageWidth, imageHeight);
  const startX = blockX * BLOCK_SIZE;
  const startY = blockY * BLOCK_SIZE;

  // Copy pixels from block to image, handling partial blocks
  for (let y = 0; y < blockDims.height; y++) {
    for (let x = 0; x < blockDims.width; x++) {
      const blockIndex = y * BLOCK_SIZE + x;
      const imageIndex = (startY + y) * imageWidth + (startX + x);

      imageBuffer[imageIndex] = blockData[blockIndex];
    }
  }
}

/**
 * Reconstruct single-component (grayscale) image from blocks.
 * Assembles Y-component blocks into final grayscale image.
 *
 * @param {Uint8Array[]} blocks - Array of 64-element block arrays
 * @param {number} imageWidth - Final image width
 * @param {number} imageHeight - Final image height
 * @returns {Uint8Array} Reconstructed grayscale image
 * @throws {Error} If parameters are invalid
 */
export function reconstructGrayscaleImage(blocks, imageWidth, imageHeight) {
  // Validate inputs
  if (!Array.isArray(blocks)) {
    throw new Error("Blocks must be an array");
  }

  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new Error("Image dimensions must be positive");
  }

  const grid = calculateBlockGrid(imageWidth, imageHeight);

  if (blocks.length !== grid.totalBlocks) {
    throw new Error(`Expected ${grid.totalBlocks} blocks, got ${blocks.length}`);
  }

  // Create output image buffer
  const imageBuffer = new Uint8Array(imageWidth * imageHeight);

  // Copy each block to its position in the image
  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const blockY = Math.floor(blockIndex / grid.blocksWide);
    const blockX = blockIndex % grid.blocksWide;

    copyBlockToImage(blocks[blockIndex], imageBuffer, blockX, blockY, imageWidth, imageHeight);
  }

  return imageBuffer;
}

/**
 * Reconstruct multi-component image from separate component planes.
 * Combines Y, Cb, Cr planes into final color image.
 *
 * @param {Uint8Array} yPlane - Luminance plane
 * @param {Uint8Array} cbPlane - Blue chroma plane
 * @param {Uint8Array} crPlane - Red chroma plane
 * @param {number} imageWidth - Final image width
 * @param {number} imageHeight - Final image height
 * @param {string} [outputFormat="rgb"] - Output format (rgb, ycbcr)
 * @returns {Uint8Array} Reconstructed color image (RGB or YCbCr interleaved)
 * @throws {Error} If parameters are invalid
 */
export function reconstructColorImage(yPlane, cbPlane, crPlane, imageWidth, imageHeight, outputFormat = "rgb") {
  // Validate inputs
  if (!(yPlane instanceof Uint8Array) || !(cbPlane instanceof Uint8Array) || !(crPlane instanceof Uint8Array)) {
    throw new Error("All planes must be Uint8Array");
  }

  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new Error("Image dimensions must be positive");
  }

  const pixelCount = imageWidth * imageHeight;

  if (yPlane.length !== pixelCount || cbPlane.length !== pixelCount || crPlane.length !== pixelCount) {
    throw new Error("All planes must match image dimensions");
  }

  if (!["rgb", "ycbcr"].includes(outputFormat)) {
    throw new Error("Output format must be 'rgb' or 'ycbcr'");
  }

  // Create output buffer (3 bytes per pixel)
  const outputBuffer = new Uint8Array(pixelCount * 3);

  // Interleave the planes
  for (let i = 0; i < pixelCount; i++) {
    const outputIndex = i * 3;

    if (outputFormat === "ycbcr") {
      // Direct YCbCr output
      outputBuffer[outputIndex] = yPlane[i];
      outputBuffer[outputIndex + 1] = cbPlane[i];
      outputBuffer[outputIndex + 2] = crPlane[i];
    } else {
      // RGB output (conversion would be done by colorspace-convert module)
      // For now, just pass through YCbCr - actual RGB conversion happens elsewhere
      outputBuffer[outputIndex] = yPlane[i];
      outputBuffer[outputIndex + 1] = cbPlane[i];
      outputBuffer[outputIndex + 2] = crPlane[i];
    }
  }

  return outputBuffer;
}

/**
 * Reconstruct image from block arrays for each component.
 * Handles different component configurations and subsampling.
 *
 * @param {Object<string, Uint8Array[]>} componentBlocks - Object containing block arrays for each component
 * @param {number} imageWidth - Final image width
 * @param {number} imageHeight - Final image height
 * @param {{outputFormat?: string, assemblyMode?: string, layout?: string}} [options={}] - Reconstruction options
 * @returns {Uint8Array} Reconstructed image data
 * @throws {Error} If parameters are invalid
 */
export function reconstructFromComponentBlocks(componentBlocks, imageWidth, imageHeight, options = {}) {
  // Validate inputs
  if (!componentBlocks || typeof componentBlocks !== "object") {
    throw new Error("Component blocks must be an object");
  }

  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new Error("Image dimensions must be positive");
  }

  const { outputFormat = "rgb", layout = IMAGE_LAYOUTS.YCBCR } = options;

  // Handle different layouts
  switch (layout) {
    case IMAGE_LAYOUTS.GRAYSCALE: {
      if (!componentBlocks.Y) {
        throw new Error("Grayscale layout requires Y component");
      }
      return reconstructGrayscaleImage(componentBlocks.Y, imageWidth, imageHeight);
    }

    case IMAGE_LAYOUTS.YCBCR: {
      if (!componentBlocks.Y || !componentBlocks.Cb || !componentBlocks.Cr) {
        throw new Error("YCbCr layout requires Y, Cb, and Cr components");
      }

      // Reconstruct each component plane
      const yPlane = reconstructGrayscaleImage(componentBlocks.Y, imageWidth, imageHeight);
      const cbPlane = reconstructGrayscaleImage(componentBlocks.Cb, imageWidth, imageHeight);
      const crPlane = reconstructGrayscaleImage(componentBlocks.Cr, imageWidth, imageHeight);

      return reconstructColorImage(yPlane, cbPlane, crPlane, imageWidth, imageHeight, outputFormat);
    }

    case IMAGE_LAYOUTS.RGB: {
      if (!componentBlocks.R || !componentBlocks.G || !componentBlocks.B) {
        throw new Error("RGB layout requires R, G, and B components");
      }

      // Reconstruct RGB components
      const rPlane = reconstructGrayscaleImage(componentBlocks.R, imageWidth, imageHeight);
      const gPlane = reconstructGrayscaleImage(componentBlocks.G, imageWidth, imageHeight);
      const bPlane = reconstructGrayscaleImage(componentBlocks.B, imageWidth, imageHeight);

      return reconstructColorImage(rPlane, gPlane, bPlane, imageWidth, imageHeight, "rgb");
    }

    case IMAGE_LAYOUTS.CMYK: {
      if (!componentBlocks.C || !componentBlocks.M || !componentBlocks.Y || !componentBlocks.K) {
        throw new Error("CMYK layout requires C, M, Y, and K components");
      }

      // Reconstruct CMYK components
      const cPlane = reconstructGrayscaleImage(componentBlocks.C, imageWidth, imageHeight);
      const mPlane = reconstructGrayscaleImage(componentBlocks.M, imageWidth, imageHeight);
      const yPlane = reconstructGrayscaleImage(componentBlocks.Y, imageWidth, imageHeight);
      const kPlane = reconstructGrayscaleImage(componentBlocks.K, imageWidth, imageHeight);

      // Create CMYK interleaved output
      const pixelCount = imageWidth * imageHeight;
      const outputBuffer = new Uint8Array(pixelCount * 4);

      for (let i = 0; i < pixelCount; i++) {
        const outputIndex = i * 4;
        outputBuffer[outputIndex] = cPlane[i];
        outputBuffer[outputIndex + 1] = mPlane[i];
        outputBuffer[outputIndex + 2] = yPlane[i];
        outputBuffer[outputIndex + 3] = kPlane[i];
      }

      return outputBuffer;
    }

    default:
      throw new Error(`Unknown layout: ${layout}`);
  }
}

/**
 * Extract region of interest from reconstructed image.
 * Useful for partial decoding or tiled processing.
 *
 * @param {Uint8Array} imageData - Source image data
 * @param {number} imageWidth - Source image width
 * @param {number} imageHeight - Source image height
 * @param {number} roiX - ROI X coordinate
 * @param {number} roiY - ROI Y coordinate
 * @param {number} roiWidth - ROI width
 * @param {number} roiHeight - ROI height
 * @param {number} [bytesPerPixel=1] - Bytes per pixel (1 for grayscale, 3 for RGB)
 * @returns {Uint8Array} Extracted region data
 * @throws {Error} If parameters are invalid
 */
export function extractRegion(imageData, imageWidth, imageHeight, roiX, roiY, roiWidth, roiHeight, bytesPerPixel = 1) {
  // Validate inputs
  if (!(imageData instanceof Uint8Array)) {
    throw new Error("Image data must be Uint8Array");
  }

  if (imageWidth <= 0 || imageHeight <= 0 || roiWidth <= 0 || roiHeight <= 0) {
    throw new Error("All dimensions must be positive");
  }

  if (roiX < 0 || roiY < 0) {
    throw new Error("ROI coordinates must be non-negative");
  }

  if (roiX + roiWidth > imageWidth || roiY + roiHeight > imageHeight) {
    throw new Error("ROI extends beyond image boundaries");
  }

  if (![1, 3, 4].includes(bytesPerPixel)) {
    throw new Error("Bytes per pixel must be 1, 3, or 4");
  }

  if (imageData.length !== imageWidth * imageHeight * bytesPerPixel) {
    throw new Error("Image data size doesn't match dimensions");
  }

  // Extract region
  const regionData = new Uint8Array(roiWidth * roiHeight * bytesPerPixel);

  for (let y = 0; y < roiHeight; y++) {
    for (let x = 0; x < roiWidth; x++) {
      const srcIndex = ((roiY + y) * imageWidth + (roiX + x)) * bytesPerPixel;
      const dstIndex = (y * roiWidth + x) * bytesPerPixel;

      for (let c = 0; c < bytesPerPixel; c++) {
        regionData[dstIndex + c] = imageData[srcIndex + c];
      }
    }
  }

  return regionData;
}

/**
 * Image reconstruction quality metrics.
 * Analyzes reconstruction process and results.
 */
export class ReconstructionMetrics {
  /**
   * Create reconstruction metrics analyzer.
   */
  constructor() {
    /** @type {number} */
    this.blocksProcessed = 0;
    /** @type {number} */
    this.pixelsProcessed = 0;
    /** @type {number} */
    this.partialBlocks = 0;
    /** @type {Object<string, number>} */
    this.componentCounts = {};
    /** @type {Object<string, number>} */
    this.layoutUsage = {};
    /** @type {number} */
    this.totalReconstructionTime = 0;
  }

  /**
   * Record block processing operation.
   *
   * @param {number} blockCount - Number of blocks processed
   * @param {number} pixelCount - Number of pixels processed
   * @param {number} partialCount - Number of partial blocks
   * @param {string} layout - Image layout used
   */
  recordProcessing(blockCount, pixelCount, partialCount, layout) {
    this.blocksProcessed += blockCount;
    this.pixelsProcessed += pixelCount;
    this.partialBlocks += partialCount;
    this.layoutUsage[layout] = (this.layoutUsage[layout] || 0) + 1;
  }

  /**
   * Record component processing.
   *
   * @param {string} component - Component type
   * @param {number} blockCount - Number of blocks for this component
   */
  recordComponent(component, blockCount) {
    this.componentCounts[component] = (this.componentCounts[component] || 0) + blockCount;
  }

  /**
   * Record processing time.
   *
   * @param {number} timeMs - Processing time in milliseconds
   */
  recordTime(timeMs) {
    this.totalReconstructionTime += timeMs;
  }

  /**
   * Get metrics summary.
   *
   * @returns {Object} Metrics summary
   */
  getSummary() {
    const averageBlocksPerImage =
      this.layoutUsage.total > 0 ? this.blocksProcessed / Object.keys(this.layoutUsage).length : 0;
    const partialBlockRatio = this.blocksProcessed > 0 ? this.partialBlocks / this.blocksProcessed : 0;

    const mostUsedLayout = Object.keys(this.layoutUsage).reduce(
      (a, b) => (this.layoutUsage[a] > this.layoutUsage[b] ? a : b),
      "none"
    );

    return {
      blocksProcessed: this.blocksProcessed,
      pixelsProcessed: this.pixelsProcessed,
      partialBlocks: this.partialBlocks,
      partialBlockRatio: Math.round(partialBlockRatio * 1000) / 1000,
      componentCounts: { ...this.componentCounts },
      layoutUsage: { ...this.layoutUsage },
      mostUsedLayout,
      averageBlocksPerImage: Math.round(averageBlocksPerImage * 100) / 100,
      totalReconstructionTime: this.totalReconstructionTime,
      description: `Reconstruction: ${this.blocksProcessed} blocks, ${this.pixelsProcessed} pixels, ${this.partialBlocks} partial blocks`,
    };
  }

  /**
   * Reset metrics.
   */
  reset() {
    this.blocksProcessed = 0;
    this.pixelsProcessed = 0;
    this.partialBlocks = 0;
    this.componentCounts = {};
    this.layoutUsage = {};
    this.totalReconstructionTime = 0;
  }
}

/**
 * Get summary information about image reconstruction.
 * Provides debugging and analysis information.
 *
 * @param {number} imageWidth - Image width
 * @param {number} imageHeight - Image height
 * @param {number} blockCount - Number of blocks processed
 * @param {string} layout - Image layout used
 * @param {{assemblyMode?: string, outputFormat?: string}} [options={}] - Additional options
 * @returns {Object} Summary information
 */
export function getReconstructionSummary(imageWidth, imageHeight, blockCount, layout, options = {}) {
  const grid = calculateBlockGrid(imageWidth, imageHeight);
  const pixelCount = imageWidth * imageHeight;
  const partialBlocks = grid.totalBlocks - Math.floor(imageWidth / BLOCK_SIZE) * Math.floor(imageHeight / BLOCK_SIZE);

  const { assemblyMode = ASSEMBLY_MODES.SEQUENTIAL, outputFormat = "rgb" } = options;

  return {
    imageWidth,
    imageHeight,
    pixelCount,
    blockCount,
    expectedBlocks: grid.totalBlocks,
    blocksWide: grid.blocksWide,
    blocksHigh: grid.blocksHigh,
    partialBlocks,
    layout,
    assemblyMode,
    outputFormat,
    compressionRatio: pixelCount > 0 ? blockCount / (pixelCount / 64) : 0,
    description: `Image reconstruction: ${imageWidth}x${imageHeight} (${pixelCount} pixels) from ${blockCount} blocks using ${layout} layout`,
  };
}
