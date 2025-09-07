/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file JPEG pixel decoding pipeline.
 *
 * This module combines all JPEG decoding components into a complete pipeline
 * that can decode JPEG compressed data into pixel arrays. It handles the full
 * process from Huffman decoding through IDCT and color space conversion.
 */

import { convertYCbCrAToRGBA } from "./color-conversion.js";
import { inverseDCT } from "./dct-transform.js";
import { BitStream, decodeBlock, HuffmanTable } from "./huffman-decode.js";
import { dequantizeBlock } from "./quantization.js";

/**
 * JPEG zigzag order for coefficient reordering.
 * Coefficients are stored in zigzag order in the JPEG stream.
 */
const ZIGZAG_ORDER = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47,
  55, 62, 63,
];

/**
 * Inverse zigzag order for converting from zigzag to natural order.
 */
const INVERSE_ZIGZAG_ORDER = new Array(64);
for (let i = 0; i < 64; i++) {
  INVERSE_ZIGZAG_ORDER[ZIGZAG_ORDER[i]] = i;
}

/**
 * Reorders coefficients from zigzag order to natural 8x8 order.
 *
 * @param {number[]} zigzagCoeffs - Coefficients in zigzag order (64 elements)
 * @returns {number[][]} Coefficients in 8x8 natural order
 */
export function zigzagToBlock(zigzagCoeffs) {
  if (!Array.isArray(zigzagCoeffs) || zigzagCoeffs.length !== 64) {
    throw new Error("Zigzag coefficients must be an array of 64 elements");
  }

  const block = Array(8)
    .fill()
    .map(() => Array(8).fill(0));

  for (let i = 0; i < 64; i++) {
    const row = Math.floor(ZIGZAG_ORDER[i] / 8);
    const col = ZIGZAG_ORDER[i] % 8;
    block[row][col] = zigzagCoeffs[i];
  }

  return block;
}

/**
 * Reorders coefficients from natural 8x8 order to zigzag order.
 *
 * @param {number[][]} block - Coefficients in 8x8 natural order
 * @returns {number[]} Coefficients in zigzag order (64 elements)
 */
export function blockToZigzag(block) {
  if (!Array.isArray(block) || block.length !== 8) {
    throw new Error("Block must be an 8x8 array");
  }

  for (let i = 0; i < 8; i++) {
    if (!Array.isArray(block[i]) || block[i].length !== 8) {
      throw new Error(`Block row ${i} must have 8 elements`);
    }
  }

  const zigzagCoeffs = new Array(64);

  for (let i = 0; i < 64; i++) {
    const row = Math.floor(ZIGZAG_ORDER[i] / 8);
    const col = ZIGZAG_ORDER[i] % 8;
    zigzagCoeffs[i] = block[row][col];
  }

  return zigzagCoeffs;
}

/**
 * Decodes a single 8x8 coefficient block through the complete pipeline.
 *
 * @param {HuffmanTable} dcTable - DC Huffman table
 * @param {HuffmanTable} acTable - AC Huffman table
 * @param {BitStream} bitStream - Bit stream for reading coefficients
 * @param {number[][]} quantTable - Quantization table (8x8)
 * @param {number} previousDC - Previous DC value for difference decoding
 * @returns {{
 *   pixelBlock: number[][],
 *   dcValue: number
 * }} Decoded pixel block and new DC value
 */
export function decodePixelBlock(dcTable, acTable, bitStream, quantTable, previousDC) {
  // 1. Decode Huffman coefficients
  const { coefficients, dcValue } = decodeBlock(dcTable, acTable, bitStream, previousDC);

  // 2. Reorder from zigzag to natural order
  const coeffBlock = zigzagToBlock(coefficients);

  // 3. Dequantize coefficients
  const dequantizedBlock = dequantizeBlock(coeffBlock, quantTable);

  // 4. Apply inverse DCT
  const pixelBlock = inverseDCT(dequantizedBlock);

  // 5. Level shift (add 128 to convert from signed to unsigned)
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      pixelBlock[i][j] = Math.max(0, Math.min(255, Math.round(pixelBlock[i][j] + 128)));
    }
  }

  return {
    pixelBlock,
    dcValue,
  };
}

/**
 * Decodes all blocks for a single component (Y, Cb, or Cr).
 *
 * @param {HuffmanTable} dcTable - DC Huffman table for this component
 * @param {HuffmanTable} acTable - AC Huffman table for this component
 * @param {BitStream} bitStream - Bit stream for reading coefficients
 * @param {number[][]} quantTable - Quantization table for this component
 * @param {number} blocksX - Number of blocks horizontally
 * @param {number} blocksY - Number of blocks vertically
 * @returns {number[][][]} Array of decoded 8x8 pixel blocks
 */
export function decodeComponentBlocks(dcTable, acTable, bitStream, quantTable, blocksX, blocksY) {
  const blocks = [];
  let previousDC = 0;

  const totalBlocks = blocksX * blocksY;

  for (let i = 0; i < totalBlocks; i++) {
    const { pixelBlock, dcValue } = decodePixelBlock(dcTable, acTable, bitStream, quantTable, previousDC);
    blocks.push(pixelBlock);
    previousDC = dcValue;
  }

  return blocks;
}

/**
 * Decodes JPEG scan data into component blocks.
 * @param {{
 *   sof: {
 *     type: number,
 *     precision: number,
 *     height: number,
 *     width: number,
 *     components: Array<{
 *       id: number,
 *       horizontalSampling: number,
 *       verticalSampling: number,
 *       quantizationTable: number
 *     }>
 *   },
 *   sos: {
 *     components: Array<{
 *       id: number,
 *       dcTable: number,
 *       acTable: number
 *     }>,
 *     spectralStart: number,
 *     spectralEnd: number,
 *     approximationHigh: number,
 *     approximationLow: number
 *   },
 *   huffmanTables: Map<string, {
 *     class: number,
 *     id: number,
 *     codeLengths: number[],
 *     symbols: number[]
 *   }>,
 *   quantizationTables: Map<number, {
 *     id: number,
 *     precision: number,
 *     values: number[]
 *   }>,
 *   scanDataOffset: number
 * }} jpegStructure - JPEG structure
 * @param {Uint8Array} jpegData - JPEG data
 * @returns {{
 *   components: Uint8Array[],
 *   width: number,
 *   height: number,
 *   componentInfo: Array<{
 *     id: number,
 *     quantizationTable: number,
 *     dcTable: number,
 *     acTable: number
 *   }>
 * }} Decoded component data
 */
export function decodeScanData(jpegStructure, jpegData) {
  const { sof, sos, huffmanTables, quantizationTables, scanDataOffset } = jpegStructure;

  if (!sof || !sos || scanDataOffset < 0) {
    throw new Error("Invalid JPEG structure: missing required data");
  }

  const { width, height, components: sofComponents } = sof;
  const { components: sosComponents } = sos;

  // Calculate MCU grid
  const blocksX = Math.ceil(width / 8);
  const blocksY = Math.ceil(height / 8);

  // Create bit stream from scan data
  const bitStream = new BitStream(jpegData, scanDataOffset);

  // Decode each component
  const componentPixelArrays = [];
  const componentInfo = [];

  for (const sosComponent of sosComponents) {
    // Find corresponding SOF component
    const sofComponent = sofComponents.find((/** @type {{id: number}} */ c) => c.id === sosComponent.id);
    if (!sofComponent) {
      throw new Error(`Component ${sosComponent.id} not found in SOF`);
    }

    // Get Huffman tables
    const dcKey = `0-${sosComponent.dcTable}`;
    const acKey = `1-${sosComponent.acTable}`;

    const dcTableData = huffmanTables.get(dcKey);
    const acTableData = huffmanTables.get(acKey);

    if (!dcTableData || !acTableData) {
      throw new Error(`Missing Huffman tables for component ${sosComponent.id}`);
    }

    const dcTable = new HuffmanTable(dcTableData);
    const acTable = new HuffmanTable(acTableData);

    // Get quantization table
    const quantTableData = quantizationTables.get(sofComponent.quantizationTable);
    if (!quantTableData) {
      throw new Error(`Missing quantization table ${sofComponent.quantizationTable} for component ${sosComponent.id}`);
    }

    // Convert quantization table to 8x8 format
    const quantTable = Array(8)
      .fill()
      .map(() => Array(8).fill(0));

    for (let i = 0; i < 64; i++) {
      const row = Math.floor(i / 8);
      const col = i % 8;
      quantTable[row][col] = quantTableData.values[i];
    }

    // Decode component blocks
    const blocks = decodeComponentBlocks(dcTable, acTable, bitStream, quantTable, blocksX, blocksY);

    // Convert blocks to pixel array
    const paddedWidth = blocksX * 8;
    const paddedHeight = blocksY * 8;
    const pixelArray = new Uint8Array(paddedWidth * paddedHeight);

    let blockIndex = 0;
    for (let blockY = 0; blockY < blocksY; blockY++) {
      for (let blockX = 0; blockX < blocksX; blockX++) {
        const block = blocks[blockIndex++];

        // Copy block to pixel array
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const pixelX = blockX * 8 + x;
            const pixelY = blockY * 8 + y;

            if (pixelX < width && pixelY < height) {
              const pixelIndex = pixelY * width + pixelX;
              pixelArray[pixelIndex] = block[y][x];
            }
          }
        }
      }
    }

    componentPixelArrays.push(pixelArray);
    componentInfo.push({
      id: sosComponent.id,
      quantizationTable: sofComponent.quantizationTable,
      dcTable: sosComponent.dcTable,
      acTable: sosComponent.acTable,
    });
  }

  return {
    components: componentPixelArrays,
    width,
    height,
    componentInfo,
  };
}

/**
 * Converts decoded component data to RGBA pixel array.
 *
 * @param {{
 *   components: Uint8Array[],
 *   width: number,
 *   height: number,
 *   componentInfo: Array<{
 *     id: number,
 *     quantizationTable: number,
 *     dcTable: number,
 *     acTable: number
 *   }>
 * }} decodedData - Decoded component data from decodeScanData
 * @returns {Uint8Array} RGBA pixel array
 */
export function componentsToRGBA(decodedData) {
  const { components, width, height } = decodedData;

  if (components.length === 1) {
    // Grayscale image
    const grayscale = components[0];
    const rgba = new Uint8Array(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      const gray = grayscale[i];
      rgba[i * 4] = gray; // R
      rgba[i * 4 + 1] = gray; // G
      rgba[i * 4 + 2] = gray; // B
      rgba[i * 4 + 3] = 255; // A
    }

    return rgba;
  } else if (components.length === 3) {
    // YCbCr color image
    const [y, cb, cr] = components;
    const ycbcra = new Uint8Array(width * height * 4);

    // Interleave YCbCr components with alpha
    for (let i = 0; i < width * height; i++) {
      ycbcra[i * 4] = y[i]; // Y
      ycbcra[i * 4 + 1] = cb[i]; // Cb
      ycbcra[i * 4 + 2] = cr[i]; // Cr
      ycbcra[i * 4 + 3] = 255; // A
    }

    // Convert YCbCrA to RGBA
    return convertYCbCrAToRGBA(ycbcra, width, height);
  } else {
    throw new Error(`Unsupported number of components: ${components.length} (expected 1 or 3)`);
  }
}

/**
 * Complete JPEG pixel decoding pipeline.
 *
 * @param {Uint8Array} jpegData - Complete JPEG file data
 * @param {Object} jpegStructure - Parsed JPEG structure from parseJPEGHeaders
 * @returns {{
 *   pixels: Uint8Array,
 *   width: number,
 *   height: number,
 *   components: number
 * }} Decoded RGBA pixel data
 *
 * @example
 * const jpegData = new Uint8Array(jpegFileBuffer);
 * const jpegStructure = parseJPEGHeaders(jpegData);
 * const decoded = decodeJPEGPixels(jpegData, jpegStructure);
 * console.log(`Decoded ${decoded.width}x${decoded.height} image with ${decoded.components} components`);
 */
/**
 * @param {Uint8Array} jpegData - JPEG data buffer
 * @param {{
 *   sof: {
 *     type: number,
 *     precision: number,
 *     height: number,
 *     width: number,
 *     components: Array<{
 *       id: number,
 *       horizontalSampling: number,
 *       verticalSampling: number,
 *       quantizationTable: number
 *     }>
 *   },
 *   sos: {
 *     components: Array<{
 *       id: number,
 *       dcTable: number,
 *       acTable: number
 *     }>,
 *     spectralStart: number,
 *     spectralEnd: number,
 *     approximationHigh: number,
 *     approximationLow: number
 *   },
 *   huffmanTables: Map<string, {
 *     class: number,
 *     id: number,
 *     codeLengths: number[],
 *     symbols: number[]
 *   }>,
 *   quantizationTables: Map<number, {
 *     id: number,
 *     precision: number,
 *     values: number[]
 *   }>,
 *   scanDataOffset: number
 * }} jpegStructure - Parsed JPEG structure
 */
export function decodeJPEGPixels(jpegData, jpegStructure) {
  // Validate inputs
  if (!(jpegData instanceof Uint8Array)) {
    throw new Error("JPEG data must be a Uint8Array");
  }

  if (!jpegStructure || !jpegStructure.sof || !jpegStructure.sos) {
    throw new Error("Invalid JPEG structure");
  }

  // Decode scan data into components
  const decodedData = decodeScanData(jpegStructure, jpegData);

  // Convert components to RGBA
  const rgbaPixels = componentsToRGBA(decodedData);

  return {
    pixels: rgbaPixels,
    width: decodedData.width,
    height: decodedData.height,
    components: decodedData.components.length,
  };
}

/**
 * Validates decoded pixel data for correctness.
 *
 * @param {{
 *   pixels: Uint8Array,
 *   width: number,
 *   height: number,
 *   components: number
 * }} decodedData - Decoded pixel data
 * @throws {Error} If data is invalid
 */
export function validateDecodedPixels(decodedData) {
  const { pixels, width, height, components } = decodedData;

  if (!(pixels instanceof Uint8Array)) {
    throw new Error("Pixels must be a Uint8Array");
  }

  if (typeof width !== "number" || width <= 0) {
    throw new Error(`Invalid width: ${width}`);
  }

  if (typeof height !== "number" || height <= 0) {
    throw new Error(`Invalid height: ${height}`);
  }

  if (typeof components !== "number" || components < 1 || components > 4) {
    throw new Error(`Invalid component count: ${components}`);
  }

  const expectedLength = width * height * 4; // Always RGBA output
  if (pixels.length !== expectedLength) {
    throw new Error(`Invalid pixel array length: expected ${expectedLength}, got ${pixels.length}`);
  }
}

/**
 * Creates a test JPEG structure for validation.
 *
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} [components=3] - Number of components (1 or 3)
 * @returns {Object} Test JPEG structure
 */
export function createTestJPEGStructure(width, height, components = 3) {
  if (components !== 1 && components !== 3) {
    throw new Error("Components must be 1 (grayscale) or 3 (color)");
  }

  // Create minimal test structure
  const structure = {
    sof: {
      width,
      height,
      precision: 8,
      /** @type {Array<{id: number, horizontalSampling: number, verticalSampling: number, quantizationTable: number}>} */
      components: [],
    },
    sos: {
      /** @type {Array<{id: number, dcTable: number, acTable: number}>} */
      components: [],
    },
    quantizationTables: new Map(),
    huffmanTables: new Map(),
    scanDataOffset: 100, // Dummy offset
  };

  // Add components
  for (let i = 0; i < components; i++) {
    const componentId = i + 1;
    structure.sof.components.push({
      id: componentId,
      horizontalSampling: 1,
      verticalSampling: 1,
      quantizationTable: i === 0 ? 0 : 1, // Luminance or chrominance
    });

    structure.sos.components.push({
      id: componentId,
      dcTable: i === 0 ? 0 : 1,
      acTable: i === 0 ? 0 : 1,
    });
  }

  return structure;
}

/**
 * Analyzes decoded pixel data for debugging.
 *
 * @param {{pixels: Uint8Array}} decodedData - Decoded pixel data
 * @returns {{
 *   pixelCount: number,
 *   minValue: number,
 *   maxValue: number,
 *   avgValue: number,
 *   histogram: number[]
 * }} Analysis results
 */
export function analyzeDecodedPixels(decodedData) {
  const { pixels } = decodedData;

  let minValue = 255;
  let maxValue = 0;
  let sum = 0;
  const histogram = new Array(256).fill(0);

  // Analyze RGB channels only (skip alpha)
  for (let i = 0; i < pixels.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const value = pixels[i + c];
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
      sum += value;
      histogram[value]++;
    }
  }

  const pixelCount = pixels.length / 4;
  const avgValue = sum / (pixelCount * 3);

  return {
    pixelCount,
    minValue,
    maxValue,
    avgValue,
    histogram,
  };
}
