/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file MCU (Minimum Coded Unit) processing for JPEG compression.
 *
 * MCUs are 8x8 pixel blocks that form the basic unit of JPEG processing.
 * This module handles extracting blocks from images, processing them through
 * the JPEG pipeline, and reconstructing images from processed blocks.
 */

/**
 * Validates MCU processing parameters.
 *
 * @param {Uint8Array} pixels - Pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} channels - Number of channels (3 or 4)
 * @throws {Error} If parameters are invalid
 */
export function validateMCUParameters(pixels, width, height, channels = 4) {
  if (!(pixels instanceof Uint8Array)) {
    throw new Error("Pixels must be a Uint8Array");
  }

  if (typeof width !== "number" || width <= 0 || width % 1 !== 0) {
    throw new Error(`Width must be a positive integer (got ${width})`);
  }

  if (typeof height !== "number" || height <= 0 || height % 1 !== 0) {
    throw new Error(`Height must be a positive integer (got ${height})`);
  }

  if (channels !== 3 && channels !== 4) {
    throw new Error(`Channels must be 3 or 4 (got ${channels})`);
  }

  const expectedLength = width * height * channels;
  if (pixels.length !== expectedLength) {
    throw new Error(`Expected ${expectedLength} bytes for ${width}x${height}x${channels} image, got ${pixels.length}`);
  }
}

/**
 * Validates block coordinates and dimensions.
 *
 * @param {number} blockX - Block X coordinate (in 8x8 blocks)
 * @param {number} blockY - Block Y coordinate (in 8x8 blocks)
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @throws {Error} If coordinates are invalid
 */
export function validateBlockCoordinates(blockX, blockY, imageWidth, imageHeight) {
  if (typeof blockX !== "number" || blockX < 0 || blockX % 1 !== 0) {
    throw new Error(`Block X must be a non-negative integer (got ${blockX})`);
  }

  if (typeof blockY !== "number" || blockY < 0 || blockY % 1 !== 0) {
    throw new Error(`Block Y must be a non-negative integer (got ${blockY})`);
  }

  const maxBlockX = Math.ceil(imageWidth / 8);
  const maxBlockY = Math.ceil(imageHeight / 8);

  if (blockX >= maxBlockX) {
    throw new Error(`Block X ${blockX} exceeds image width (max ${maxBlockX - 1})`);
  }

  if (blockY >= maxBlockY) {
    throw new Error(`Block Y ${blockY} exceeds image height (max ${maxBlockY - 1})`);
  }
}

/**
 * Calculates MCU grid dimensions for an image.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {{
 *   blocksX: number,
 *   blocksY: number,
 *   totalBlocks: number,
 *   paddedWidth: number,
 *   paddedHeight: number
 * }} MCU grid information
 *
 * @example
 * const grid = calculateMCUGrid(100, 150);
 * // grid.blocksX = 13 (ceil(100/8))
 * // grid.blocksY = 19 (ceil(150/8))
 * // grid.paddedWidth = 104, grid.paddedHeight = 152
 */
export function calculateMCUGrid(width, height) {
  if (typeof width !== "number" || width <= 0) {
    throw new Error(`Width must be positive (got ${width})`);
  }
  if (typeof height !== "number" || height <= 0) {
    throw new Error(`Height must be positive (got ${height})`);
  }

  const blocksX = Math.ceil(width / 8);
  const blocksY = Math.ceil(height / 8);
  const totalBlocks = blocksX * blocksY;
  const paddedWidth = blocksX * 8;
  const paddedHeight = blocksY * 8;

  return {
    blocksX,
    blocksY,
    totalBlocks,
    paddedWidth,
    paddedHeight,
  };
}

/**
 * Extracts an 8x8 block from a single channel of image data.
 *
 * @param {Uint8Array} pixels - Image pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} blockX - Block X coordinate (0-based, in 8x8 blocks)
 * @param {number} blockY - Block Y coordinate (0-based, in 8x8 blocks)
 * @param {number} channel - Channel index (0=R/Y, 1=G/Cb, 2=B/Cr, 3=A)
 * @param {number} [channels=4] - Total number of channels per pixel
 * @param {number} [fillValue=0] - Value to use for padding if block extends beyond image
 * @returns {number[][]} 8x8 block as 2D array
 * @throws {Error} If parameters are invalid
 *
 * @example
 * const yBlock = extractBlock(ycbcrPixels, 640, 480, 0, 0, 0, 4); // Y channel, top-left block
 * const cbBlock = extractBlock(ycbcrPixels, 640, 480, 0, 0, 1, 4); // Cb channel, same block
 */
export function extractBlock(pixels, width, height, blockX, blockY, channel, channels = 4, fillValue = 0) {
  validateMCUParameters(pixels, width, height, channels);
  validateBlockCoordinates(blockX, blockY, width, height);

  if (typeof channel !== "number" || channel < 0 || channel >= channels) {
    throw new Error(`Channel must be 0-${channels - 1} (got ${channel})`);
  }

  const block = Array(8)
    .fill()
    .map(() => Array(8).fill(fillValue));

  const startX = blockX * 8;
  const startY = blockY * 8;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const pixelX = startX + x;
      const pixelY = startY + y;

      if (pixelX < width && pixelY < height) {
        const pixelIndex = (pixelY * width + pixelX) * channels + channel;
        block[y][x] = pixels[pixelIndex];
      }
      // else: use fillValue (already set)
    }
  }

  return block;
}

/**
 * Places an 8x8 block back into a single channel of image data.
 *
 * @param {Uint8Array} pixels - Image pixel data (modified in place)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} blockX - Block X coordinate (0-based, in 8x8 blocks)
 * @param {number} blockY - Block Y coordinate (0-based, in 8x8 blocks)
 * @param {number} channel - Channel index (0=R/Y, 1=G/Cb, 2=B/Cr, 3=A)
 * @param {number[][]} block - 8x8 block data
 * @param {number} [channels=4] - Total number of channels per pixel
 * @throws {Error} If parameters are invalid
 *
 * @example
 * placeBlock(ycbcrPixels, 640, 480, 0, 0, 0, processedYBlock, 4); // Place Y channel
 * placeBlock(ycbcrPixels, 640, 480, 0, 0, 1, processedCbBlock, 4); // Place Cb channel
 */
export function placeBlock(pixels, width, height, blockX, blockY, channel, block, channels = 4) {
  validateMCUParameters(pixels, width, height, channels);
  validateBlockCoordinates(blockX, blockY, width, height);

  if (typeof channel !== "number" || channel < 0 || channel >= channels) {
    throw new Error(`Channel must be 0-${channels - 1} (got ${channel})`);
  }

  if (!Array.isArray(block) || block.length !== 8) {
    throw new Error("Block must be an 8x8 array");
  }

  for (let i = 0; i < 8; i++) {
    if (!Array.isArray(block[i]) || block[i].length !== 8) {
      throw new Error(`Block row ${i} must have 8 elements`);
    }
  }

  const startX = blockX * 8;
  const startY = blockY * 8;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const pixelX = startX + x;
      const pixelY = startY + y;

      if (pixelX < width && pixelY < height) {
        const pixelIndex = (pixelY * width + pixelX) * channels + channel;
        // Clamp values to valid range [0, 255]
        pixels[pixelIndex] = Math.max(0, Math.min(255, Math.round(block[y][x])));
      }
      // Ignore pixels outside image bounds
    }
  }
}

/**
 * Extracts all blocks from a single channel of an image.
 *
 * @param {Uint8Array} pixels - Image pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} channel - Channel index to extract
 * @param {number} [channels=4] - Total number of channels per pixel
 * @param {number} [fillValue=0] - Value for padding
 * @returns {{
 *   blocks: number[][][],
 *   blocksX: number,
 *   blocksY: number
 * }} All blocks from the channel
 *
 * @example
 * const yChannel = extractAllBlocks(ycbcrPixels, 640, 480, 0, 4);
 * // yChannel.blocks[0] = top-left block, yChannel.blocks[1] = next block, etc.
 */
export function extractAllBlocks(pixels, width, height, channel, channels = 4, fillValue = 0) {
  validateMCUParameters(pixels, width, height, channels);

  const grid = calculateMCUGrid(width, height);
  const blocks = [];

  for (let blockY = 0; blockY < grid.blocksY; blockY++) {
    for (let blockX = 0; blockX < grid.blocksX; blockX++) {
      const block = extractBlock(pixels, width, height, blockX, blockY, channel, channels, fillValue);
      blocks.push(block);
    }
  }

  return {
    blocks,
    blocksX: grid.blocksX,
    blocksY: grid.blocksY,
  };
}

/**
 * Places all blocks back into a single channel of an image.
 *
 * @param {Uint8Array} pixels - Image pixel data (modified in place)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} channel - Channel index to place blocks into
 * @param {number[][][]} blocks - Array of 8x8 blocks
 * @param {number} blocksX - Number of blocks horizontally
 * @param {number} [channels=4] - Total number of channels per pixel
 * @throws {Error} If parameters are invalid
 *
 * @example
 * placeAllBlocks(ycbcrPixels, 640, 480, 0, processedYBlocks, 80, 4);
 */
export function placeAllBlocks(pixels, width, height, channel, blocks, blocksX, channels = 4) {
  validateMCUParameters(pixels, width, height, channels);

  if (!Array.isArray(blocks)) {
    throw new Error("Blocks must be an array");
  }

  if (typeof blocksX !== "number" || blocksX <= 0) {
    throw new Error(`BlocksX must be positive (got ${blocksX})`);
  }

  let blockIndex = 0;
  const blocksY = Math.ceil(blocks.length / blocksX);

  for (let blockY = 0; blockY < blocksY; blockY++) {
    for (let blockX = 0; blockX < blocksX; blockX++) {
      if (blockIndex < blocks.length) {
        placeBlock(pixels, width, height, blockX, blockY, channel, blocks[blockIndex], channels);
        blockIndex++;
      }
    }
  }
}

/**
 * Separates multi-channel image into individual channel blocks.
 *
 * @param {Uint8Array} pixels - Multi-channel pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} [channels=4] - Number of channels (3=RGB, 4=RGBA)
 * @returns {{
 *   channelBlocks: number[][][][],
 *   blocksX: number,
 *   blocksY: number,
 *   grid: Object
 * }} Separated channel blocks
 *
 * @example
 * const separated = separateChannels(ycbcrPixels, 640, 480, 4);
 * const yBlocks = separated.channelBlocks[0]; // All Y blocks
 * const cbBlocks = separated.channelBlocks[1]; // All Cb blocks
 * const crBlocks = separated.channelBlocks[2]; // All Cr blocks
 * const aBlocks = separated.channelBlocks[3]; // All Alpha blocks
 */
export function separateChannels(pixels, width, height, channels = 4) {
  validateMCUParameters(pixels, width, height, channels);

  const grid = calculateMCUGrid(width, height);
  const channelBlocks = [];

  // Extract blocks for each channel
  for (let channel = 0; channel < channels; channel++) {
    const channelData = extractAllBlocks(pixels, width, height, channel, channels);
    channelBlocks.push(channelData.blocks);
  }

  return {
    channelBlocks,
    blocksX: grid.blocksX,
    blocksY: grid.blocksY,
    grid,
  };
}

/**
 * Combines individual channel blocks back into multi-channel image.
 *
 * @param {number[][][][]} channelBlocks - Array of channel block arrays
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} blocksX - Number of blocks horizontally
 * @param {number} [channels=4] - Number of channels
 * @returns {Uint8Array} Combined multi-channel pixel data
 *
 * @example
 * const combinedPixels = combineChannels([yBlocks, cbBlocks, crBlocks, aBlocks], 640, 480, 80, 4);
 */
export function combineChannels(channelBlocks, width, height, blocksX, channels = 4) {
  if (!Array.isArray(channelBlocks) || channelBlocks.length !== channels) {
    throw new Error(`ChannelBlocks must be an array of ${channels} channel arrays`);
  }

  const pixels = new Uint8Array(width * height * channels);

  // Place blocks for each channel
  for (let channel = 0; channel < channels; channel++) {
    placeAllBlocks(pixels, width, height, channel, channelBlocks[channel], blocksX, channels);
  }

  return pixels;
}

/**
 * Applies a function to all blocks in a channel.
 *
 * @param {number[][][]} blocks - Array of 8x8 blocks
 * @param {Function} processFn - Function to apply to each block
 * @returns {number[][][]} Processed blocks
 *
 * @example
 * // Apply DCT to all Y blocks
 * const dctBlocks = processBlocks(yBlocks, forwardDCT);
 *
 * // Apply quantization to all DCT blocks
 * const quantizedBlocks = processBlocks(dctBlocks, block => quantizeBlock(block, quantTable));
 */
export function processBlocks(blocks, processFn) {
  if (!Array.isArray(blocks)) {
    throw new Error("Blocks must be an array");
  }

  if (typeof processFn !== "function") {
    throw new Error("ProcessFn must be a function");
  }

  return blocks.map((block, index) => {
    try {
      return processFn(block, index);
    } catch (error) {
      throw new Error(`Error processing block ${index}: ${error.message}`);
    }
  });
}

/**
 * Creates a test MCU pattern for validation.
 *
 * @param {string} pattern - Pattern type ("gradient", "checkerboard", "solid")
 * @param {number} [width=16] - Pattern width (should be multiple of 8)
 * @param {number} [height=16] - Pattern height (should be multiple of 8)
 * @param {number} [channels=4] - Number of channels
 * @returns {Uint8Array} Test pattern pixel data
 *
 * @example
 * const testPattern = createMCUTestPattern("gradient", 64, 64, 4);
 * const separated = separateChannels(testPattern, 64, 64, 4);
 * // Use for testing MCU processing pipeline
 */
export function createMCUTestPattern(pattern, width = 16, height = 16, channels = 4) {
  if (width % 8 !== 0 || height % 8 !== 0) {
    throw new Error("Width and height should be multiples of 8 for clean MCU testing");
  }

  const pixels = new Uint8Array(width * height * channels);

  switch (pattern) {
    case "gradient": {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * channels;
          pixels[index] = Math.floor((x / (width - 1)) * 255); // R/Y gradient
          pixels[index + 1] = Math.floor((y / (height - 1)) * 255); // G/Cb gradient
          pixels[index + 2] = 128; // Constant B/Cr
          if (channels === 4) pixels[index + 3] = 255; // Alpha
        }
      }
      break;
    }

    case "checkerboard": {
      const blockSize = 8;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * channels;
          const blockX = Math.floor(x / blockSize);
          const blockY = Math.floor(y / blockSize);
          const value = ((blockX + blockY) % 2) * 255;

          pixels[index] = value; // R/Y
          pixels[index + 1] = value; // G/Cb
          pixels[index + 2] = value; // B/Cr
          if (channels === 4) pixels[index + 3] = 255; // Alpha
        }
      }
      break;
    }

    case "solid": {
      for (let i = 0; i < pixels.length; i += channels) {
        pixels[i] = 128; // R/Y
        pixels[i + 1] = 64; // G/Cb
        pixels[i + 2] = 192; // B/Cr
        if (channels === 4) pixels[i + 3] = 255; // Alpha
      }
      break;
    }

    default:
      throw new Error(`Unknown test pattern: ${pattern}`);
  }

  return pixels;
}

/**
 * Analyzes MCU processing results for validation.
 *
 * @param {Uint8Array} originalPixels - Original pixel data
 * @param {Uint8Array} processedPixels - Processed pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} [channels=4] - Number of channels
 * @returns {{
 *   maxError: number,
 *   avgError: number,
 *   rmseError: number,
 *   channelErrors: number[]
 * }} Analysis results
 */
export function analyzeMCUProcessing(originalPixels, processedPixels, width, height, channels = 4) {
  validateMCUParameters(originalPixels, width, height, channels);
  validateMCUParameters(processedPixels, width, height, channels);

  let maxError = 0;
  let totalError = 0;
  let squaredError = 0;
  const channelErrors = new Array(channels).fill(0);
  const pixelCount = width * height;

  for (let i = 0; i < originalPixels.length; i++) {
    const original = originalPixels[i];
    const processed = processedPixels[i];
    const error = Math.abs(original - processed);
    const channel = i % channels;

    maxError = Math.max(maxError, error);
    totalError += error;
    squaredError += error * error;
    channelErrors[channel] += error;
  }

  // Normalize channel errors
  for (let c = 0; c < channels; c++) {
    channelErrors[c] /= pixelCount;
  }

  const avgError = totalError / originalPixels.length;
  const rmseError = Math.sqrt(squaredError / originalPixels.length);

  return {
    maxError,
    avgError,
    rmseError,
    channelErrors,
  };
}
