/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG encoder - Pure function to encode RGBA pixels to JPEG buffer.
 *
 * Extracts JPEG encoding logic from JPEGImage class into a pure function
 * that takes RGBA pixel data, dimensions, and options, and returns a JPEG buffer.
 */

import { downsampleChroma } from "./downsample-chroma.js";
import { convertRgbToYcbcr } from "./encode-colorspace.js";
import { forwardDct2d } from "./forward-dct.js";
import { encodeHuffmanBlocks, getStandardHuffmanTable } from "./huffman-encode.js";
import { JPEG_MARKERS } from "./parse-markers.js";
import { batchQuantizeBlocks, getStandardQuantizationTable } from "./quantize.js";
import { applyPadding, calculatePadding, extractComponentBlocks } from "./segment-blocks.js";

/**
 * Simple helper to write JPEG marker with data.
 * @param {number} marker - JPEG marker code
 * @param {Uint8Array} data - Marker data
 * @returns {Uint8Array} Complete marker with header
 */
function writeMarker(marker, data) {
  const result = new Uint8Array(2 + (data.length > 0 ? 2 : 0) + data.length);
  let offset = 0;

  // Marker
  result[offset++] = 0xff;
  result[offset++] = marker & 0xff;

  // Length (if data present)
  if (data.length > 0) {
    const length = data.length + 2;
    result[offset++] = (length >> 8) & 0xff;
    result[offset++] = length & 0xff;
  }

  // Data
  result.set(data, offset);

  return result;
}

/**
 * Encode RGBA pixel data to JPEG buffer.
 *
 * @param {Uint8Array} pixels - RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {Object} [options] - JPEG encoding options
 * @param {number} [options.quality=75] - JPEG quality (1-100)
 * @param {boolean} [options.progressive=false] - Enable progressive encoding
 * @param {string} [options.subsampling="4:2:0"] - Chroma subsampling mode
 * @param {boolean} [options.optimize=false] - Optimize Huffman tables
 * @param {Array<Object>} [options.components] - Component configuration
 * @returns {Promise<Uint8Array>} JPEG encoded buffer
 * @throws {Error} If JPEG encoding fails
 *
 * @example
 * const pixels = new Uint8Array(width * height * 4); // RGBA data
 * const jpegBuffer = await encodeJPEG(pixels, width, height, { quality: 85 });
 * writeFileSync('output.jpg', jpegBuffer);
 */
export async function encodeJPEG(pixels, width, height, options = {}) {
  const {
    quality: rawQuality = 75,
    progressive = false,
    subsampling = "4:2:0",
    optimize: _optimize = false,
    components = null,
  } = options;

  // Clamp quality to valid range (1-100)
  const quality = Math.max(1, Math.min(100, Math.round(rawQuality)));

  // Validate input parameters
  if (!pixels || pixels.length === 0) {
    throw new Error("No pixel data provided for encoding");
  }

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`Invalid width: ${width} (must be positive integer)`);
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`Invalid height: ${height} (must be positive integer)`);
  }

  const expectedPixelCount = width * height * 4; // RGBA = 4 bytes per pixel
  if (pixels.length !== expectedPixelCount) {
    throw new Error(
      `Pixel data length mismatch: expected ${expectedPixelCount} bytes for ${width}×${height} RGBA, got ${pixels.length}`
    );
  }

  try {
    // Step 1: Convert RGB to YCbCr color space
    const ycbcrData = convertRgbToYcbcr(pixels, width, height, 4, {
      standard: "bt601",
      range: "full",
    });

    // Step 2: Downsample chroma components (if subsampling enabled)
    let { yData, cbData, crData } = ycbcrData;
    if (subsampling !== "4:4:4") {
      const downsampledChroma = downsampleChroma(yData, cbData, crData, width, height, {
        mode: subsampling,
        filter: "bilinear",
        preserveEdges: true,
      });
      cbData = downsampledChroma.cbData;
      crData = downsampledChroma.crData;
    }

    // Step 3: Apply padding to make dimensions divisible by 8
    const { paddedWidth, paddedHeight } = calculatePadding(width, height);

    const paddedYData = applyPadding(yData, width, height, paddedWidth, paddedHeight, "edge", "LUMA");

    // For chroma components, calculate padding based on their actual dimensions after downsampling
    let cbWidth = width,
      cbHeight = height,
      crWidth = width,
      crHeight = height;
    if (subsampling !== "4:4:4") {
      // Get the actual chroma dimensions from downsampling result
      const downsamplingResult = downsampleChroma(yData, ycbcrData.cbData, ycbcrData.crData, width, height, {
        mode: subsampling,
        filter: "bilinear",
        preserveEdges: true,
      });
      cbWidth = downsamplingResult.cbWidth;
      cbHeight = downsamplingResult.cbHeight;
      crWidth = downsamplingResult.crWidth;
      crHeight = downsamplingResult.crHeight;
    }

    const { paddedWidth: cbPaddedWidth, paddedHeight: cbPaddedHeight } = calculatePadding(cbWidth, cbHeight);
    const { paddedWidth: crPaddedWidth, paddedHeight: crPaddedHeight } = calculatePadding(crWidth, crHeight);

    const paddedCbData = applyPadding(cbData, cbWidth, cbHeight, cbPaddedWidth, cbPaddedHeight, "edge", "CHROMA");
    const paddedCrData = applyPadding(crData, crWidth, crHeight, crPaddedWidth, crPaddedHeight, "edge", "CHROMA");

    // Step 4: Segment into 8x8 blocks
    const yBlocks = extractComponentBlocks(paddedYData, paddedWidth, paddedHeight, "raster");
    const cbBlocks = extractComponentBlocks(paddedCbData, cbPaddedWidth, cbPaddedHeight, "raster");
    const crBlocks = extractComponentBlocks(paddedCrData, crPaddedWidth, crPaddedHeight, "raster");

    // Step 5: Apply Forward DCT to each block
    const yDctBlocks = yBlocks.blocks.map((block) => forwardDct2d(block, { precision: "high" }));
    const cbDctBlocks = cbBlocks.blocks.map((block) => forwardDct2d(block, { precision: "high" }));
    const crDctBlocks = crBlocks.blocks.map((block) => forwardDct2d(block, { precision: "high" }));

    // Step 6: Get quantization tables
    const yQuantTableRaw = getStandardQuantizationTable("luminance", quality);
    const cQuantTableRaw = getStandardQuantizationTable("chrominance", quality);

    // Extract the actual table values (convert object with numeric keys to Uint8Array)
    const yQuantTableArray = Array.isArray(yQuantTableRaw)
      ? yQuantTableRaw
      : Array.from({ length: 64 }, (_, i) => yQuantTableRaw[i]);
    const cQuantTableArray = Array.isArray(cQuantTableRaw)
      ? cQuantTableRaw
      : Array.from({ length: 64 }, (_, i) => cQuantTableRaw[i]);

    // Convert to Uint8Array as required by the quantization function
    const yQuantTable = new Uint8Array(yQuantTableArray);
    const cQuantTable = new Uint8Array(cQuantTableArray);

    // Step 7: Quantize DCT coefficients
    const yQuantizedResult = batchQuantizeBlocks(yDctBlocks, yQuantTable, { roundingMode: "nearest" });
    const yQuantizedBlocks = yQuantizedResult.quantizedBlocks;

    const cbQuantizedResult = batchQuantizeBlocks(cbDctBlocks, cQuantTable, { roundingMode: "nearest" });
    const cbQuantizedBlocks = cbQuantizedResult.quantizedBlocks;

    const crQuantizedResult = batchQuantizeBlocks(crDctBlocks, cQuantTable, { roundingMode: "nearest" });
    const crQuantizedBlocks = crQuantizedResult.quantizedBlocks;

    // Step 8: Get Huffman tables
    const huffmanTables = {
      dcLuminance: getStandardHuffmanTable("dc", "luminance"),
      acLuminance: getStandardHuffmanTable("ac", "luminance"),
      dcChrominance: getStandardHuffmanTable("dc", "chrominance"),
      acChrominance: getStandardHuffmanTable("ac", "chrominance"),
    };

    // Step 9: Huffman encode the quantized coefficients
    const yEncodedData = encodeHuffmanBlocks(yQuantizedBlocks, {
      dcTable: huffmanTables.dcLuminance,
      acTable: huffmanTables.acLuminance,
    });
    const cbEncodedData = encodeHuffmanBlocks(cbQuantizedBlocks, {
      dcTable: huffmanTables.dcChrominance,
      acTable: huffmanTables.acChrominance,
    });
    const crEncodedData = encodeHuffmanBlocks(crQuantizedBlocks, {
      dcTable: huffmanTables.dcChrominance,
      acTable: huffmanTables.acChrominance,
    });

    // Step 10: Combine entropy data (extract encodedData from results)
    const yEncodedBytes = /** @type {Uint8Array} */ (yEncodedData.encodedData || yEncodedData);
    const cbEncodedBytes = /** @type {Uint8Array} */ (cbEncodedData.encodedData || cbEncodedData);
    const crEncodedBytes = /** @type {Uint8Array} */ (crEncodedData.encodedData || crEncodedData);

    const entropyData = new Uint8Array(yEncodedBytes.length + cbEncodedBytes.length + crEncodedBytes.length);
    let offset = 0;
    entropyData.set(yEncodedBytes, offset);
    offset += yEncodedBytes.length;
    entropyData.set(cbEncodedBytes, offset);
    offset += cbEncodedBytes.length;
    entropyData.set(crEncodedBytes, offset);

    // Step 11: Assemble final JPEG file
    const jpegBuffer = assembleJPEGFile({
      width,
      height,
      quality,
      progressive,
      subsampling,
      entropyData,
      components,
      quantizationTables: [
        { id: 0, precision: 0, values: yQuantTable },
        { id: 1, precision: 0, values: cQuantTable },
      ],
      huffmanTables: [
        huffmanTables.dcLuminance,
        huffmanTables.acLuminance,
        huffmanTables.dcChrominance,
        huffmanTables.acChrominance,
      ],
    });

    console.log(`✓ Successfully encoded JPEG: ${width}×${height}`);
    console.log(`  - Quality: ${quality}`);
    console.log(`  - Progressive: ${progressive}`);
    console.log(`  - Subsampling: ${subsampling}`);
    console.log(`  - Output size: ${jpegBuffer.length} bytes`);

    return jpegBuffer;
  } catch (error) {
    throw new Error(`JPEG encoding failed: ${error?.message || error?.toString() || "Unknown error"}`);
  }
}

/**
 * Assemble complete JPEG file from components.
 *
 * @param {Object} params - JPEG file parameters
 * @returns {Uint8Array} Complete JPEG file buffer
 * @private
 */
function assembleJPEGFile(params) {
  const { width, height, progressive, entropyData, quantizationTables, huffmanTables, components } =
    /** @type {any} */ (params);

  const markers = [];

  // SOI marker
  markers.push(writeMarker(JPEG_MARKERS.SOI, new Uint8Array(0)));

  // Add quantization tables (if available)
  if (quantizationTables && quantizationTables.length > 0) {
    for (const table of quantizationTables) {
      if (table?.values) {
        const dqtData = new Uint8Array(65);
        dqtData[0] = ((table.precision || 0) << 4) | (table.id || 0);
        dqtData.set(table.values, 1);
        markers.push(writeMarker(JPEG_MARKERS.DQT, dqtData));
      }
    }
  }

  // Add Huffman tables (if available)
  if (huffmanTables && huffmanTables.length > 0) {
    // Map the standard tables to proper DHT format
    const tableMap = [
      { table: huffmanTables[0], class: 0, id: 0 }, // DC Luminance
      { table: huffmanTables[1], class: 1, id: 0 }, // AC Luminance
      { table: huffmanTables[2], class: 0, id: 1 }, // DC Chrominance
      { table: huffmanTables[3], class: 1, id: 1 }, // AC Chrominance
    ];

    for (const { table, class: tableClass, id } of tableMap) {
      if (table?.symbols && table?.codeLengths) {
        // DHT data: 1 byte header + 16 bytes code lengths + symbols
        const dhtData = new Uint8Array(17 + table.symbols.length);
        dhtData[0] = (tableClass << 4) | id;

        // Code lengths: skip the first element if it's 17 elements (includes count)
        const lengths = table.codeLengths.length === 17 ? table.codeLengths.slice(1) : table.codeLengths;
        dhtData.set(lengths.slice(0, 16), 1);
        dhtData.set(table.symbols, 17);
        markers.push(writeMarker(JPEG_MARKERS.DHT, dhtData));
      }
    }
  }

  // SOF marker (use default structure if components not available)
  const componentCount = components && components.length > 0 ? components.length : 3;
  const sofData = new Uint8Array(6 + componentCount * 3);
  let offset = 0;
  sofData[offset++] = 8; // Precision
  sofData[offset++] = (height >> 8) & 0xff;
  sofData[offset++] = height & 0xff;
  sofData[offset++] = (width >> 8) & 0xff;
  sofData[offset++] = width & 0xff;
  sofData[offset++] = componentCount;

  if (components && components.length > 0) {
    for (const component of components) {
      const comp = /** @type {any} */ (component);
      sofData[offset++] = comp.id || 1;
      sofData[offset++] = ((comp.horizontalSampling || 1) << 4) | (comp.verticalSampling || 1);
      sofData[offset++] = comp.quantizationTableId || 0;
    }
  } else {
    // Default YCbCr components
    sofData[offset++] = 1;
    sofData[offset++] = 0x22;
    sofData[offset++] = 0; // Y: quantization table 0
    sofData[offset++] = 2;
    sofData[offset++] = 0x11;
    sofData[offset++] = 1; // Cb: quantization table 1
    sofData[offset++] = 3;
    sofData[offset++] = 0x11;
    sofData[offset++] = 1; // Cr: quantization table 1
  }

  const sofMarker = progressive ? JPEG_MARKERS.SOF2 : JPEG_MARKERS.SOF0;
  markers.push(writeMarker(sofMarker, sofData));

  // SOS marker
  const sosData = new Uint8Array(4 + componentCount * 2);
  offset = 0;
  sosData[offset++] = componentCount;

  if (components && components.length > 0) {
    for (const component of components) {
      const comp = /** @type {any} */ (component);
      sosData[offset++] = comp.id || 1;
      sosData[offset++] = ((comp.dcTableId || 0) << 4) | (comp.acTableId || 0);
    }
  } else {
    // Default component mapping with proper Huffman table IDs
    sosData[offset++] = 1;
    sosData[offset++] = 0x00; // Y: DC table 0, AC table 0
    sosData[offset++] = 2;
    sosData[offset++] = 0x11; // Cb: DC table 1, AC table 1
    sosData[offset++] = 3;
    sosData[offset++] = 0x11; // Cr: DC table 1, AC table 1
  }

  sosData[offset++] = 0; // Start of spectral selection
  sosData[offset++] = 63; // End of spectral selection
  sosData[offset++] = 0; // Successive approximation

  markers.push(writeMarker(JPEG_MARKERS.SOS, sosData));

  // Add entropy data
  markers.push(entropyData);

  // EOI marker
  markers.push(writeMarker(JPEG_MARKERS.EOI, new Uint8Array(0)));

  // Concatenate all markers
  const totalLength = markers.reduce((sum, marker) => sum + marker.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;

  for (const marker of markers) {
    result.set(marker, pos);
    pos += marker.length;
  }

  return result;
}
