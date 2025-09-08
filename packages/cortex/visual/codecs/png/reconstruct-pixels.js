/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Reconstructs PNG pixels from unfiltered scanline data.
 *
 * After PNG scanline filters are reversed, the raw pixel data needs to be
 * reconstructed into a usable RGBA format. This module handles:
 * - Bit depth conversion (1, 2, 4, 8, 16-bit to 8-bit)
 * - Color type conversion (grayscale, RGB, palette, alpha variants)
 * - Palette lookup for indexed color images
 * - Alpha channel handling and premultiplication
 * - Interlaced image reconstruction (Adam7)
 *
 * @param {Uint8Array} unfilteredData - Unfiltered scanline data
 * @param {{width: number, height: number, colorType: number, bitDepth: number, samplesPerPixel?: number}} ihdr - IHDR chunk information
 * @param {Uint8Array} [palette] - PLTE chunk data for indexed images
 * @param {Uint8Array} [transparency] - tRNS chunk data for transparency
 * @returns {Uint8Array} RGBA pixel data (4 bytes per pixel)
 *
 * @example
 * // Reconstruct RGB image pixels
 * const pixels = reconstructPixels(unfilteredData, ihdr);
 * console.log(`Reconstructed ${pixels.length / 4} pixels`);
 *
 * @example
 * // Reconstruct palette image with transparency
 * const pixels = reconstructPixels(unfilteredData, ihdr, palette, transparency);
 * console.log(`Palette image: ${ihdr.width}×${ihdr.height}`);
 */

/**
 * PNG color type constants.
 */
const COLOR_TYPE = {
  GRAYSCALE: 0, // Each pixel is a grayscale sample
  RGB: 2, // Each pixel is an R,G,B triple
  PALETTE: 3, // Each pixel is a palette index
  GRAYSCALE_ALPHA: 4, // Each pixel is a grayscale sample followed by alpha
  RGBA: 6, // Each pixel is an R,G,B triple followed by alpha
};

/**
 * Gets samples per pixel for a given color type.
 *
 * @param {number} colorType - PNG color type
 * @returns {number} Number of samples per pixel
 */
function getSamplesPerPixelFromColorType(colorType) {
  switch (colorType) {
    case COLOR_TYPE.GRAYSCALE:
      return 1;
    case COLOR_TYPE.RGB:
      return 3;
    case COLOR_TYPE.PALETTE:
      return 1;
    case COLOR_TYPE.GRAYSCALE_ALPHA:
      return 2;
    case COLOR_TYPE.RGBA:
      return 4;
    default:
      throw new Error(`Unknown color type: ${colorType}`);
  }
}

/**
 * Reconstructs PNG pixels from unfiltered scanline data.
 *
 * @param {Uint8Array} unfilteredData - Unfiltered scanline data
 * @param {{width: number, height: number, colorType: number, bitDepth: number, samplesPerPixel?: number, interlaceMethod?: number}} ihdr - IHDR chunk information
 * @param {Uint8Array} [palette] - PLTE chunk data for indexed images
 * @param {Uint8Array} [transparency] - tRNS chunk data for transparency
 * @returns {Uint8Array} RGBA pixel data (4 bytes per pixel)
 */
export function reconstructPixels(unfilteredData, ihdr, palette, transparency) {
  // Parameter validation
  if (!(unfilteredData instanceof Uint8Array)) {
    throw new TypeError("unfilteredData must be a Uint8Array");
  }
  if (!ihdr || typeof ihdr !== "object") {
    throw new TypeError("ihdr must be an object");
  }
  if (!validateReconstructionParameters(unfilteredData, ihdr)) {
    throw new Error("Invalid reconstruction parameters");
  }

  const { width, height, colorType, bitDepth } = ihdr;
  // Calculate samplesPerPixel if not provided (for test compatibility)
  const samplesPerPixel = ihdr.samplesPerPixel || getSamplesPerPixelFromColorType(colorType);

  // Handle interlaced images
  if (ihdr.interlaceMethod === 1) {
    const deinterlacedData = deinterlaceAdam7(unfilteredData, ihdr);
    return reconstructPixels(deinterlacedData, { ...ihdr, interlaceMethod: 0 }, palette, transparency);
  }

  // Convert bit depth to 8-bit if needed
  let pixelData = unfilteredData;
  if (bitDepth !== 8) {
    pixelData = convertBitDepth(unfilteredData, bitDepth, samplesPerPixel);
  }

  // Convert to RGBA based on color type
  let rgbaData;
  switch (colorType) {
    case COLOR_TYPE.GRAYSCALE:
      rgbaData = convertGrayscaleToRGBA(pixelData, width, height, false);
      break;
    case COLOR_TYPE.RGB:
      rgbaData = convertRGBToRGBA(pixelData, width, height);
      break;
    case COLOR_TYPE.PALETTE:
      if (!palette) {
        throw new Error("PLTE chunk required for palette images");
      }
      rgbaData = convertPaletteToRGBA(pixelData, width, height, palette, transparency);
      break;
    case COLOR_TYPE.GRAYSCALE_ALPHA:
      rgbaData = convertGrayscaleToRGBA(pixelData, width, height, true);
      break;
    case COLOR_TYPE.RGBA:
      // Already RGBA, just copy
      rgbaData = new Uint8Array(pixelData);
      break;
    default:
      throw new Error(`Unsupported color type: ${colorType}`);
  }

  // Apply transparency from tRNS chunk if present (for non-alpha color types)
  if (transparency && colorType !== COLOR_TYPE.GRAYSCALE_ALPHA && colorType !== COLOR_TYPE.RGBA) {
    rgbaData = applyTransparency(rgbaData, transparency, colorType);
  }

  return rgbaData;
}

/**
 * Converts bit depth to 8-bit values.
 *
 * @param {Uint8Array} data - Raw pixel data
 * @param {number} bitDepth - Source bit depth (1, 2, 4, 8, 16)
 * @param {number} samplesPerPixel - Number of samples per pixel
 * @returns {Uint8Array} 8-bit normalized data
 */
export function convertBitDepth(data, bitDepth, samplesPerPixel) {
  // Parameter validation
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("data must be a Uint8Array");
  }
  if (typeof bitDepth !== "number" || ![1, 2, 4, 8, 16].includes(bitDepth)) {
    throw new Error(`Invalid bit depth: ${bitDepth}. Must be 1, 2, 4, 8, or 16`);
  }
  if (typeof samplesPerPixel !== "number" || samplesPerPixel < 1 || samplesPerPixel > 4) {
    throw new Error(`Invalid samplesPerPixel: ${samplesPerPixel}. Must be 1-4`);
  }

  // If already 8-bit, return as-is
  if (bitDepth === 8) {
    return new Uint8Array(data);
  }

  // Handle 16-bit to 8-bit conversion
  if (bitDepth === 16) {
    // Each 16-bit sample becomes one 8-bit sample
    const result = new Uint8Array(data.length / 2);
    for (let i = 0; i < result.length; i++) {
      // Take the high byte (most significant) for 16->8 bit conversion
      result[i] = data[i * 2];
    }
    return result;
  }

  // Handle sub-byte bit depths (1, 2, 4 bits)
  if (bitDepth < 8) {
    const pixelsPerByte = 8 / bitDepth;
    const maxValue = (1 << bitDepth) - 1; // 2^bitDepth - 1
    const scale = 255 / maxValue; // Scale factor to 8-bit

    const totalPixels = data.length * pixelsPerByte;
    const result = new Uint8Array(totalPixels * samplesPerPixel);

    let resultIndex = 0;

    for (let byteIndex = 0; byteIndex < data.length; byteIndex++) {
      const byte = data[byteIndex];

      // Extract pixels from this byte
      for (let pixelInByte = 0; pixelInByte < pixelsPerByte; pixelInByte++) {
        const shift = (pixelsPerByte - 1 - pixelInByte) * bitDepth;
        const mask = maxValue << shift;
        const value = (byte & mask) >> shift;
        const scaledValue = Math.round(value * scale);

        // Replicate the value for all samples in this pixel
        for (let sample = 0; sample < samplesPerPixel; sample++) {
          if (resultIndex < result.length) {
            result[resultIndex++] = scaledValue;
          }
        }
      }
    }

    return result;
  }

  // Should never reach here
  throw new Error(`Unsupported bit depth: ${bitDepth}`);
}

/**
 * Converts grayscale pixels to RGBA.
 *
 * @param {Uint8Array} grayscaleData - Grayscale pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {boolean} hasAlpha - Whether grayscale includes alpha channel
 * @returns {Uint8Array} RGBA pixel data
 */
export function convertGrayscaleToRGBA(grayscaleData, width, height, hasAlpha) {
  if (!(grayscaleData instanceof Uint8Array)) {
    throw new TypeError("grayscaleData must be a Uint8Array");
  }
  if (typeof width !== "number" || width <= 0) {
    throw new Error("width must be a positive number");
  }
  if (typeof height !== "number" || height <= 0) {
    throw new Error("height must be a positive number");
  }
  if (typeof hasAlpha !== "boolean") {
    throw new TypeError("hasAlpha must be a boolean");
  }

  const samplesPerPixel = hasAlpha ? 2 : 1;
  const expectedSize = width * height * samplesPerPixel;
  if (grayscaleData.length !== expectedSize) {
    throw new Error(`Grayscale data size mismatch. Expected ${expectedSize}, got ${grayscaleData.length}`);
  }

  const rgbaData = new Uint8Array(width * height * 4);
  let grayIndex = 0;
  let rgbaIndex = 0;

  for (let i = 0; i < width * height; i++) {
    const grayValue = grayscaleData[grayIndex++];
    const alphaValue = hasAlpha ? grayscaleData[grayIndex++] : 255;

    // Set RGB to grayscale value
    rgbaData[rgbaIndex++] = grayValue; // R
    rgbaData[rgbaIndex++] = grayValue; // G
    rgbaData[rgbaIndex++] = grayValue; // B
    rgbaData[rgbaIndex++] = alphaValue; // A
  }

  return rgbaData;
}

/**
 * Converts RGB pixels to RGBA (adds alpha channel).
 *
 * @param {Uint8Array} rgbData - RGB pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8Array} RGBA pixel data
 */
export function convertRGBToRGBA(rgbData, width, height) {
  if (!(rgbData instanceof Uint8Array)) {
    throw new TypeError("rgbData must be a Uint8Array");
  }
  if (typeof width !== "number" || width <= 0) {
    throw new Error("width must be a positive number");
  }
  if (typeof height !== "number" || height <= 0) {
    throw new Error("height must be a positive number");
  }

  const expectedRGBSize = width * height * 3;
  if (rgbData.length !== expectedRGBSize) {
    throw new Error(`RGB data size mismatch. Expected ${expectedRGBSize}, got ${rgbData.length}`);
  }

  const rgbaData = new Uint8Array(width * height * 4);
  let rgbIndex = 0;
  let rgbaIndex = 0;

  for (let i = 0; i < width * height; i++) {
    // Copy RGB values
    rgbaData[rgbaIndex++] = rgbData[rgbIndex++]; // R
    rgbaData[rgbaIndex++] = rgbData[rgbIndex++]; // G
    rgbaData[rgbaIndex++] = rgbData[rgbIndex++]; // B
    rgbaData[rgbaIndex++] = 255; // A (fully opaque)
  }

  return rgbaData;
}

/**
 * Converts palette indices to RGBA using PLTE and tRNS chunks.
 *
 * @param {Uint8Array} indexData - Palette index data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint8Array} palette - PLTE chunk data (RGB triplets)
 * @param {Uint8Array} [transparency] - tRNS chunk data (alpha values)
 * @returns {Uint8Array} RGBA pixel data
 */
export function convertPaletteToRGBA(indexData, width, height, palette, transparency) {
  if (!(indexData instanceof Uint8Array)) {
    throw new TypeError("indexData must be a Uint8Array");
  }
  if (typeof width !== "number" || width <= 0) {
    throw new Error("width must be a positive number");
  }
  if (typeof height !== "number" || height <= 0) {
    throw new Error("height must be a positive number");
  }
  if (!(palette instanceof Uint8Array)) {
    throw new TypeError("palette must be a Uint8Array");
  }
  if (palette.length % 3 !== 0) {
    throw new Error("palette length must be a multiple of 3 (RGB triplets)");
  }

  const expectedSize = width * height;
  if (indexData.length !== expectedSize) {
    throw new Error(`Index data size mismatch. Expected ${expectedSize}, got ${indexData.length}`);
  }

  const paletteEntries = palette.length / 3;
  const rgbaData = new Uint8Array(width * height * 4);
  let rgbaIndex = 0;

  for (let i = 0; i < indexData.length; i++) {
    const index = indexData[i];

    if (index >= paletteEntries) {
      throw new Error(`Palette index ${index} out of range (max: ${paletteEntries - 1})`);
    }

    const paletteOffset = index * 3;
    const r = palette[paletteOffset];
    const g = palette[paletteOffset + 1];
    const b = palette[paletteOffset + 2];
    const a = transparency && index < transparency.length ? transparency[index] : 255;

    rgbaData[rgbaIndex++] = r;
    rgbaData[rgbaIndex++] = g;
    rgbaData[rgbaIndex++] = b;
    rgbaData[rgbaIndex++] = a;
  }

  return rgbaData;
}

/**
 * Reconstructs interlaced PNG using Adam7 algorithm.
 *
 * @param {Uint8Array} interlacedData - Interlaced scanline data
 * @param {{width: number, height: number, colorType: number, bitDepth: number, samplesPerPixel?: number}} ihdr - IHDR chunk information
 * @returns {Uint8Array} Deinterlaced pixel data
 */
export function deinterlaceAdam7(interlacedData, ihdr) {
  const { width, height, bitDepth, colorType } = ihdr;
  const samplesPerPixel = ihdr.samplesPerPixel || getSamplesPerPixelFromColorType(colorType);
  const bytesPerPixel = Math.ceil((bitDepth * samplesPerPixel) / 8);

  // Adam7 pass parameters: [startX, startY, stepX, stepY]
  const passes = [
    [0, 0, 8, 8], // Pass 1: every 8th pixel starting at (0,0)
    [4, 0, 8, 8], // Pass 2: every 8th pixel starting at (4,0)
    [0, 4, 4, 8], // Pass 3: every 4th pixel starting at (0,4)
    [2, 0, 4, 4], // Pass 4: every 4th pixel starting at (2,0)
    [0, 2, 2, 4], // Pass 5: every 2nd pixel starting at (0,2)
    [1, 0, 2, 2], // Pass 6: every 2nd pixel starting at (1,0)
    [0, 1, 1, 2], // Pass 7: every pixel starting at (0,1)
  ];

  // Create output buffer for deinterlaced data
  const outputSize = height * width * bytesPerPixel;
  const output = new Uint8Array(outputSize);

  let inputOffset = 0;

  for (let passIndex = 0; passIndex < passes.length; passIndex++) {
    const [startX, startY, stepX, stepY] = passes[passIndex];

    // Calculate pass dimensions
    const passWidth = Math.ceil((width - startX) / stepX);
    const passHeight = Math.ceil((height - startY) / stepY);

    if (passWidth <= 0 || passHeight <= 0) {
      continue; // Skip empty passes
    }

    // Calculate bytes per scanline for this pass
    const passBytesPerPixel = bytesPerPixel;
    const passScanlineBytes = passWidth * passBytesPerPixel;

    // Process each scanline in this pass
    for (let passY = 0; passY < passHeight; passY++) {
      const actualY = startY + passY * stepY;

      if (actualY >= height) break;

      // Process each pixel in this scanline
      for (let passX = 0; passX < passWidth; passX++) {
        const actualX = startX + passX * stepX;

        if (actualX >= width) break;

        // Copy pixel data from interlaced input to correct position in output
        const inputPixelOffset = inputOffset + passX * passBytesPerPixel;
        const outputPixelOffset = (actualY * width + actualX) * bytesPerPixel;

        for (let b = 0; b < bytesPerPixel; b++) {
          if (inputPixelOffset + b < interlacedData.length) {
            output[outputPixelOffset + b] = interlacedData[inputPixelOffset + b];
          }
        }
      }

      // Move to next scanline in interlaced data
      inputOffset += passScanlineBytes;
    }
  }

  return output;
}

/**
 * Applies transparency from tRNS chunk to RGB images.
 *
 * @param {Uint8Array} rgbaData - RGBA pixel data
 * @param {Uint8Array} transparency - tRNS chunk data
 * @param {number} colorType - PNG color type
 * @returns {Uint8Array} RGBA data with transparency applied
 */
export function applyTransparency(rgbaData, transparency, colorType) {
  if (!(rgbaData instanceof Uint8Array)) {
    throw new TypeError("rgbaData must be a Uint8Array");
  }
  if (!(transparency instanceof Uint8Array)) {
    throw new TypeError("transparency must be a Uint8Array");
  }
  if (typeof colorType !== "number") {
    throw new TypeError("colorType must be a number");
  }

  // Create a copy to avoid mutating the original
  const result = new Uint8Array(rgbaData);

  switch (colorType) {
    case COLOR_TYPE.GRAYSCALE: {
      // For grayscale, tRNS contains a single 16-bit value (2 bytes)
      if (transparency.length !== 2) {
        throw new Error(`Invalid tRNS length for grayscale: expected 2, got ${transparency.length}`);
      }

      // Read the transparent gray value (16-bit big-endian, but we only use high byte for 8-bit)
      const transparentGray = transparency[0];

      // Apply transparency to matching pixels
      for (let i = 0; i < result.length; i += 4) {
        const gray = result[i]; // R, G, B should all be the same for grayscale
        if (gray === transparentGray) {
          result[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      break;
    }

    case COLOR_TYPE.RGB: {
      // For RGB, tRNS contains three 16-bit values (6 bytes total)
      if (transparency.length !== 6) {
        throw new Error(`Invalid tRNS length for RGB: expected 6, got ${transparency.length}`);
      }

      // Read the transparent RGB values (16-bit big-endian, but we only use high bytes for 8-bit)
      const transparentR = transparency[0];
      const transparentG = transparency[2];
      const transparentB = transparency[4];

      // Apply transparency to matching pixels
      for (let i = 0; i < result.length; i += 4) {
        const r = result[i];
        const g = result[i + 1];
        const b = result[i + 2];

        if (r === transparentR && g === transparentG && b === transparentB) {
          result[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      break;
    }

    case COLOR_TYPE.PALETTE: {
      // For palette, tRNS contains alpha values for palette entries
      // This should already be handled in convertPaletteToRGBA, but we can double-check
      console.warn("tRNS for palette images should be handled during palette conversion");
      break;
    }

    default:
      throw new Error(`tRNS transparency not applicable for color type ${colorType}`);
  }

  return result;
}

/**
 * Validates pixel reconstruction parameters.
 *
 * @param {Uint8Array} unfilteredData - Unfiltered scanline data
 * @param {{width: number, height: number, colorType: number, bitDepth: number, samplesPerPixel?: number}} ihdr - IHDR chunk information
 * @returns {boolean} True if parameters are valid
 */
export function validateReconstructionParameters(unfilteredData, ihdr) {
  // Basic type validation
  if (!(unfilteredData instanceof Uint8Array)) {
    return false;
  }
  if (!ihdr || typeof ihdr !== "object") {
    return false;
  }

  // Required IHDR properties
  if (
    typeof ihdr.width !== "number" ||
    typeof ihdr.height !== "number" ||
    typeof ihdr.colorType !== "number" ||
    typeof ihdr.bitDepth !== "number"
  ) {
    return false;
  }

  // samplesPerPixel is optional for basic validation (can be calculated from colorType)
  if (ihdr.samplesPerPixel !== undefined && typeof ihdr.samplesPerPixel !== "number") {
    return false;
  }

  // Validate ranges
  if (ihdr.width <= 0 || ihdr.height <= 0) {
    return false;
  }
  if (![1, 2, 4, 8, 16].includes(ihdr.bitDepth)) {
    return false;
  }
  if (![0, 2, 3, 4, 6].includes(ihdr.colorType)) {
    return false;
  }

  // Validate samplesPerPixel if provided
  const expectedSamplesPerPixel = getSamplesPerPixelFromColorType(ihdr.colorType);
  if (ihdr.samplesPerPixel !== undefined && ihdr.samplesPerPixel !== expectedSamplesPerPixel) {
    return false;
  }

  // Validate data size (basic check)
  if (unfilteredData.length === 0) {
    return false;
  }

  return true;
}

/**
 * Gets the expected pixel data size for given image parameters.
 *
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} colorType - PNG color type
 * @param {number} bitDepth - PNG bit depth
 * @returns {number} Expected pixel data size in bytes
 */
export function getExpectedPixelDataSize(width, height, colorType, bitDepth) {
  if (typeof width !== "number" || width <= 0) {
    throw new Error("width must be a positive number");
  }
  if (typeof height !== "number" || height <= 0) {
    throw new Error("height must be a positive number");
  }
  if (typeof colorType !== "number" || ![0, 2, 3, 4, 6].includes(colorType)) {
    throw new Error(`Invalid color type: ${colorType}`);
  }
  if (typeof bitDepth !== "number" || ![1, 2, 4, 8, 16].includes(bitDepth)) {
    throw new Error(`Invalid bit depth: ${bitDepth}`);
  }

  const samplesPerPixel = getSamplesPerPixelFromColorType(colorType);
  const bitsPerPixel = samplesPerPixel * bitDepth;
  const bytesPerScanline = Math.ceil((width * bitsPerPixel) / 8);

  // Add 1 byte per scanline for the filter type
  const totalBytes = height * (bytesPerScanline + 1);

  return totalBytes;
}

/**
 * Analyzes pixel data statistics for debugging.
 *
 * @param {Uint8Array} pixelData - RGBA pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Pixel statistics
 */
export function analyzePixelData(pixelData, width, height) {
  if (!(pixelData instanceof Uint8Array)) {
    throw new TypeError("pixelData must be a Uint8Array");
  }
  if (typeof width !== "number" || width <= 0) {
    throw new Error("width must be a positive number");
  }
  if (typeof height !== "number" || height <= 0) {
    throw new Error("height must be a positive number");
  }

  const expectedSize = width * height * 4;
  if (pixelData.length !== expectedSize) {
    throw new Error(`Pixel data size mismatch. Expected ${expectedSize}, got ${pixelData.length}`);
  }

  const totalPixels = width * height;
  let totalRed = 0;
  let totalGreen = 0;
  let totalBlue = 0;
  let totalAlpha = 0;
  let hasTransparency = false;
  let minValue = 255;
  let maxValue = 0;

  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];
    const a = pixelData[i + 3];

    totalRed += r;
    totalGreen += g;
    totalBlue += b;
    totalAlpha += a;

    if (a < 255) {
      hasTransparency = true;
    }

    // Track color range (excluding alpha)
    minValue = Math.min(minValue, r, g, b);
    maxValue = Math.max(maxValue, r, g, b);
  }

  return {
    totalPixels,
    averageRed: Math.round(totalRed / totalPixels),
    averageGreen: Math.round(totalGreen / totalPixels),
    averageBlue: Math.round(totalBlue / totalPixels),
    averageAlpha: Math.round(totalAlpha / totalPixels),
    hasTransparency,
    colorRange: { min: minValue, max: maxValue },
  };
}
