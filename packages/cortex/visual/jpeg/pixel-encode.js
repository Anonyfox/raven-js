/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file JPEG pixel encoding pipeline.
 *
 * This module combines all JPEG encoding components into a complete pipeline
 * that can encode pixel arrays into JPEG compressed data. It handles the full
 * process from color space conversion through DCT, quantization, and Huffman encoding.
 */

import { convertRGBAToYCbCrA } from "./color-conversion.js";
import { forwardDCT } from "./dct-transform.js";
import { createJPEGHeaders, createStandardJPEGStructure } from "./header-creation.js";
import { BitWriter, createStandardHuffmanEncoder, encodeBlock, HuffmanEncoder } from "./huffman-encode.js";
import { separateChannels } from "./mcu-processing.js";
import { blockToZigzag } from "./pixel-decode.js";
import { quantizeBlock } from "./quantization.js";

/**
 * Encode RGBA pixels to JPEG format.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} [options={}] - Encoding options
 * @param {number} [options.quality=85] - JPEG quality (1-100)
 * @param {string} [options.colorSpace="ycbcr"] - Color space ("grayscale" or "ycbcr")
 * @returns {Uint8Array} Encoded JPEG data
 *
 * @example
 * const pixels = new Uint8Array(width * height * 4); // RGBA data
 * const jpegData = encodeJPEGPixels(pixels, width, height, { quality: 90 });
 */
/**
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {{quality?: number, colorSpace?: string}} options - Encoding options
 */
export function encodeJPEGPixels(pixels, width, height, options = {}) {
  const { quality = 85, colorSpace = "ycbcr" } = options;

  // Validate inputs
  validateEncodeParameters(pixels, width, height, options);

  // Create JPEG structure
  const jpegStructure = createStandardJPEGStructure({
    width,
    height,
    quality,
    colorSpace,
  });

  // Convert color space and separate into channels
  let channels;
  if (colorSpace === "ycbcr") {
    // Convert RGBA to YCbCr and separate channels
    const ycbcrPixels = convertRGBAToYCbCrA(pixels, width, height);
    const separated = separateChannels(ycbcrPixels, width, height, 4); // YCbCrA format
    // Remove alpha channel for JPEG encoding
    channels = separated.channelBlocks.slice(0, 3); // Keep only Y, Cb, Cr
  } else {
    // Convert RGBA to grayscale and create single channel
    const grayscalePixels = convertRGBAToGrayscale(pixels, width, height);

    // Convert GA format to RGBA format for separateChannels compatibility
    const rgbaGrayscale = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const gray = grayscalePixels[i * 2];
      const alpha = grayscalePixels[i * 2 + 1];
      rgbaGrayscale[i * 4] = gray; // R = gray
      rgbaGrayscale[i * 4 + 1] = gray; // G = gray
      rgbaGrayscale[i * 4 + 2] = gray; // B = gray
      rgbaGrayscale[i * 4 + 3] = alpha; // A = alpha
    }

    const separated = separateChannels(rgbaGrayscale, width, height, 4); // RGBA format
    // Use only the first channel (all channels are identical for grayscale)
    channels = [separated.channelBlocks[0]]; // Keep only grayscale channel
  }

  // Encode each channel
  const encodedChannels = [];
  for (let i = 0; i < channels.length; i++) {
    const channelBlocks = channels[i];
    const quantTable = jpegStructure.quantizationTables[i === 0 ? 0 : 1]; // Luminance or chrominance
    const encodedChannel = encodeChannel(channelBlocks, quantTable);
    encodedChannels.push(encodedChannel);
  }

  // Create Huffman encoders
  const dcEncoders = [];
  const acEncoders = [];

  for (const component of jpegStructure.scan.components) {
    const dcTableId = component.dcTable;
    const acTableId = component.acTable;

    const dcTableType = dcTableId === 0 ? "dc-luminance" : "dc-chrominance";
    const acTableType = acTableId === 0 ? "ac-luminance" : "ac-chrominance";

    dcEncoders.push(createStandardHuffmanEncoder(dcTableType));
    acEncoders.push(createStandardHuffmanEncoder(acTableType));
  }

  // Encode scan data
  const scanData = encodeScanData(encodedChannels, dcEncoders, acEncoders);

  // Create complete JPEG file
  const headers = createJPEGHeaders(jpegStructure);
  const eoi = new Uint8Array([0xff, 0xd9]); // EOI marker

  // Combine headers + scan data + EOI
  const totalLength = headers.length + scanData.length + eoi.length;
  const jpegData = new Uint8Array(totalLength);
  let offset = 0;

  jpegData.set(headers, offset);
  offset += headers.length;

  jpegData.set(scanData, offset);
  offset += scanData.length;

  jpegData.set(eoi, offset);

  return jpegData;
}

/**
 * Encode a single channel (Y, Cb, or Cr) into DCT coefficient blocks.
 *
 * @param {number[][][]} channelBlocks - Array of 8x8 blocks for this channel
 * @param {{id: number, precision: number, values: number[]}} quantTable - Quantization table
 * @returns {number[][]} Array of quantized coefficient blocks (zigzag order)
 */
export function encodeChannel(channelBlocks, quantTable) {
  // channelBlocks is already an array of 8x8 blocks from separateChannels

  const encodedBlocks = [];

  for (const /** @type {number[][]} */ block of channelBlocks) {
    // Level shift (subtract 128 to center around 0)
    const levelShiftedBlock = Array(8)
      .fill()
      .map(() => Array(8).fill(0));

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        levelShiftedBlock[i][j] = block[i][j] - 128;
      }
    }

    // Apply forward DCT
    const dctBlock = forwardDCT(levelShiftedBlock);

    // Convert quantization table to 8x8 format
    const quantTable8x8 = Array(8)
      .fill()
      .map(() => Array(8).fill(0));

    for (let i = 0; i < 64; i++) {
      const row = Math.floor(i / 8);
      const col = i % 8;
      quantTable8x8[row][col] = quantTable.values[i];
    }

    // Quantize coefficients
    const quantizedBlock = quantizeBlock(dctBlock, quantTable8x8);

    // Convert to zigzag order
    const zigzagCoeffs = blockToZigzag(quantizedBlock);

    encodedBlocks.push(zigzagCoeffs);
  }

  return encodedBlocks;
}

/**
 * Encode scan data using Huffman encoding.
 *
 * @param {number[][][]} encodedChannels - Array of encoded channel blocks
 * @param {HuffmanEncoder[]} dcEncoders - DC Huffman encoders
 * @param {HuffmanEncoder[]} acEncoders - AC Huffman encoders
 * @returns {Uint8Array} Encoded scan data
 */
export function encodeScanData(encodedChannels, dcEncoders, acEncoders) {
  const bitWriter = new BitWriter();
  const previousDCs = new Array(encodedChannels.length).fill(0);

  // Determine the number of blocks (assuming all channels have same number of blocks)
  const blockCount = encodedChannels[0].length;

  // Encode blocks in interleaved order (for multi-component images)
  for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
    for (let channelIndex = 0; channelIndex < encodedChannels.length; channelIndex++) {
      const zigzagCoeffs = encodedChannels[channelIndex][blockIndex]; // Already in zigzag order
      const dcEncoder = dcEncoders[channelIndex];
      const acEncoder = acEncoders[channelIndex];

      // Encode block
      const newDC = encodeBlock(dcEncoder, acEncoder, bitWriter, zigzagCoeffs, previousDCs[channelIndex]);
      previousDCs[channelIndex] = newDC;
    }
  }

  return bitWriter.flush();
}

/**
 * Convert RGBA pixels to grayscale.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8Array} Grayscale pixel data with alpha (GA format)
 */
export function convertRGBAToGrayscale(pixels, width, height) {
  const grayscalePixels = new Uint8Array(width * height * 2); // GA format

  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    const a = pixels[i * 4 + 3];

    // ITU-R BT.709 luminance formula
    const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

    grayscalePixels[i * 2] = gray;
    grayscalePixels[i * 2 + 1] = a;
  }

  return grayscalePixels;
}

/**
 * Validates encoding parameters.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {{quality?: number, colorSpace?: string}} options - Encoding options
 * @throws {Error} If parameters are invalid
 */
export function validateEncodeParameters(pixels, width, height, options) {
  if (!(pixels instanceof Uint8Array)) {
    throw new Error("Pixels must be a Uint8Array");
  }

  if (typeof width !== "number" || width <= 0 || width > 65535) {
    throw new Error(`Invalid width: ${width} (must be 1-65535)`);
  }

  if (typeof height !== "number" || height <= 0 || height > 65535) {
    throw new Error(`Invalid height: ${height} (must be 1-65535)`);
  }

  const expectedLength = width * height * 4;
  if (pixels.length !== expectedLength) {
    throw new Error(`Invalid pixel array length: expected ${expectedLength}, got ${pixels.length}`);
  }

  if (options.quality !== undefined) {
    if (typeof options.quality !== "number" || options.quality < 1 || options.quality > 100) {
      throw new Error(`Invalid quality: ${options.quality} (must be 1-100)`);
    }
  }

  if (options.colorSpace !== undefined) {
    if (options.colorSpace !== "grayscale" && options.colorSpace !== "ycbcr") {
      throw new Error(`Invalid color space: ${options.colorSpace} (must be "grayscale" or "ycbcr")`);
    }
  }
}

/**
 * Create test pixel data for encoding validation.
 *
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} pattern - Pattern type ("solid", "gradient", "checkerboard", "noise")
 * @param {{r?: number, g?: number, b?: number, a?: number, size?: number}} options - Pattern options
 * @returns {Uint8Array} Test pixel data (RGBA format)
 */
export function createTestPixelData(width, height, pattern, options = {}) {
  const pixels = new Uint8Array(width * height * 4);

  switch (pattern) {
    case "solid": {
      const { r = 128, g = 128, b = 128, a = 255 } = options;
      for (let i = 0; i < width * height; i++) {
        pixels[i * 4] = r;
        pixels[i * 4 + 1] = g;
        pixels[i * 4 + 2] = b;
        pixels[i * 4 + 3] = a;
      }
      break;
    }

    case "gradient": {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          pixels[i * 4] = Math.floor((x / (width - 1)) * 255); // R gradient
          pixels[i * 4 + 1] = Math.floor((y / (height - 1)) * 255); // G gradient
          pixels[i * 4 + 2] = 128; // Constant B
          pixels[i * 4 + 3] = 255; // Full alpha
        }
      }
      break;
    }

    case "checkerboard": {
      const { size = 8 } = options;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          const checkX = Math.floor(x / size);
          const checkY = Math.floor(y / size);
          const isWhite = (checkX + checkY) % 2 === 0;
          const value = isWhite ? 255 : 0;

          pixels[i * 4] = value;
          pixels[i * 4 + 1] = value;
          pixels[i * 4 + 2] = value;
          pixels[i * 4 + 3] = 255;
        }
      }
      break;
    }

    case "noise": {
      for (let i = 0; i < width * height; i++) {
        pixels[i * 4] = Math.floor(Math.random() * 256);
        pixels[i * 4 + 1] = Math.floor(Math.random() * 256);
        pixels[i * 4 + 2] = Math.floor(Math.random() * 256);
        pixels[i * 4 + 3] = 255;
      }
      break;
    }

    default:
      throw new Error(`Unknown pattern: ${pattern}`);
  }

  return pixels;
}

/**
 * Analyze encoded JPEG data.
 *
 * @param {Uint8Array} jpegData - Encoded JPEG data
 * @returns {{
 *   fileSize: number,
 *   compressionRatio: number,
 *   hasValidMarkers: boolean,
 *   markers: number[]
 * }} Analysis results
 */
export function analyzeEncodedJPEG(jpegData) {
  const fileSize = jpegData.length;
  const markers = [];

  // Find all JPEG markers
  for (let i = 0; i < jpegData.length - 1; i++) {
    if (jpegData[i] === 0xff && jpegData[i + 1] !== 0x00) {
      const marker = (jpegData[i] << 8) | jpegData[i + 1];
      markers.push(marker);
    }
  }

  // Check for required markers
  const hasSOI = markers.includes(0xffd8);
  const hasEOI = markers.includes(0xffd9);
  const hasSOF = markers.some((m) => m >= 0xffc0 && m <= 0xffc3);
  const hasSOS = markers.includes(0xffda);

  const hasValidMarkers = hasSOI && hasEOI && hasSOF && hasSOS;

  return {
    fileSize,
    compressionRatio: 0, // Will be calculated by caller if original size is known
    hasValidMarkers,
    markers,
  };
}

/**
 * Estimate encoding parameters for target file size.
 *
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} targetSizeKB - Target file size in KB
 * @param {string} [colorSpace="ycbcr"] - Color space
 * @returns {{
 *   estimatedQuality: number,
 *   estimatedSize: number,
 *   compressionRatio: number
 * }} Estimation results
 */
export function estimateEncodingParameters(width, height, targetSizeKB, colorSpace = "ycbcr") {
  const pixelCount = width * height;
  const originalSizeBytes = pixelCount * (colorSpace === "ycbcr" ? 3 : 1); // RGB or grayscale
  const targetSizeBytes = targetSizeKB * 1024;

  const compressionRatio = originalSizeBytes / targetSizeBytes;

  // Rough quality estimation based on compression ratio
  // Higher compression ratio = lower quality needed
  let estimatedQuality;
  if (compressionRatio <= 2) {
    estimatedQuality = 95; // Very high quality
  } else if (compressionRatio <= 5) {
    estimatedQuality = 85; // High quality
  } else if (compressionRatio <= 10) {
    estimatedQuality = 70; // Medium quality
  } else if (compressionRatio <= 20) {
    estimatedQuality = 50; // Low quality
  } else {
    estimatedQuality = 25; // Very low quality
  }

  // Estimate actual size (rough approximation)
  const baseSize = pixelCount * 0.5; // Base compression
  const qualityFactor = estimatedQuality / 100;
  const estimatedSize = Math.floor(baseSize * (1 + qualityFactor));

  return {
    estimatedQuality: Math.max(1, Math.min(100, estimatedQuality)),
    estimatedSize,
    compressionRatio,
  };
}

/**
 * Optimize encoding quality for best visual quality within size constraints.
 *
 * @param {Uint8Array} pixels - RGBA pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} maxSizeKB - Maximum file size in KB
 * @param {Object} [options={}] - Optimization options
 * @param {string} [options.colorSpace="ycbcr"] - Color space
 * @param {number} [options.minQuality=10] - Minimum acceptable quality
 * @param {number} [options.maxQuality=95] - Maximum quality to try
 * @returns {{
 *   jpegData: Uint8Array,
 *   quality: number,
 *   fileSize: number,
 *   compressionRatio: number
 * }} Optimized encoding result
 */
export function optimizeEncoding(pixels, width, height, maxSizeKB, options = {}) {
  const { colorSpace = "ycbcr", minQuality = 10, maxQuality = 95 } = options;

  const maxSizeBytes = maxSizeKB * 1024;
  const originalSize = width * height * (colorSpace === "ycbcr" ? 3 : 1);

  let bestResult = null;
  let low = minQuality;
  let high = maxQuality;

  // Binary search for optimal quality
  while (low <= high) {
    const quality = Math.floor((low + high) / 2);

    try {
      const jpegData = encodeJPEGPixels(pixels, width, height, { quality, colorSpace });

      if (jpegData.length <= maxSizeBytes) {
        // This quality fits, try higher quality
        bestResult = {
          jpegData,
          quality,
          fileSize: jpegData.length,
          compressionRatio: originalSize / jpegData.length,
        };
        low = quality + 1;
      } else {
        // This quality is too large, try lower quality
        high = quality - 1;
      }
    } catch (_error) {
      // If encoding fails, try lower quality
      high = quality - 1;
    }
  }

  if (!bestResult) {
    // Fallback: encode with minimum quality
    const jpegData = encodeJPEGPixels(pixels, width, height, { quality: minQuality, colorSpace });
    bestResult = {
      jpegData,
      quality: minQuality,
      fileSize: jpegData.length,
      compressionRatio: originalSize / jpegData.length,
    };
  }

  return bestResult;
}

/**
 * Batch encode multiple images with consistent settings.
 *
 * @param {Array<{pixels: Uint8Array, width: number, height: number}>} images - Images to encode
 * @param {Object} [options={}] - Encoding options
 * @param {number} [options.quality=85] - JPEG quality
 * @param {string} [options.colorSpace="ycbcr"] - Color space
 * @param {boolean} [options.parallel=false] - Enable parallel processing (not implemented)
 * @returns {Uint8Array[]} Array of encoded JPEG data
 */
export function batchEncode(images, options = {}) {
  const { quality = 85, colorSpace = "ycbcr" } = options;

  const results = [];

  for (const image of images) {
    try {
      const jpegData = encodeJPEGPixels(image.pixels, image.width, image.height, { quality, colorSpace });
      results.push(jpegData);
    } catch (error) {
      throw new Error(`Failed to encode image ${results.length}: ${error.message}`);
    }
  }

  return results;
}
