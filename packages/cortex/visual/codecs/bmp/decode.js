/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file BMP decoder - Pure function to decode BMP buffer to RGBA pixels.
 *
 * Decodes Windows BMP format into RGBA pixel data. Supports both 24-bit (BGR)
 * and 32-bit (BGRA) uncompressed BMP files. BMP stores pixels bottom-up,
 * so vertical flipping is performed during decode.
 */

/**
 * Read little-endian 32-bit integer from buffer.
 *
 * @param {Uint8Array} buffer - Buffer to read from
 * @param {number} offset - Byte offset
 * @returns {number} 32-bit integer value
 */
function readUint32LE(buffer, offset) {
  return (buffer[offset + 3] << 24) | (buffer[offset + 2] << 16) | (buffer[offset + 1] << 8) | buffer[offset];
}

/**
 * Read little-endian 16-bit integer from buffer.
 *
 * @param {Uint8Array} buffer - Buffer to read from
 * @param {number} offset - Byte offset
 * @returns {number} 16-bit integer value
 */
function readUint16LE(buffer, offset) {
  return (buffer[offset + 1] << 8) | buffer[offset];
}

/**
 * Decode BMP buffer to RGBA pixel data.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - BMP file buffer
 * @returns {{pixels: Uint8Array, width: number, height: number, metadata: Object}} Decoded image data
 * @throws {Error} If BMP decoding fails
 *
 * @example
 * const bmpBuffer = readFileSync('image.bmp');
 * const { pixels, width, height, metadata } = decodeBMP(bmpBuffer);
 * console.log(`Decoded ${width}×${height} BMP with ${pixels.length} RGBA bytes`);
 */
export function decodeBMP(buffer) {
  // Convert to Uint8Array if needed
  const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  try {
    // Validate minimum file size
    if (data.length < 54) {
      // 14 (file header) + 40 (info header)
      throw new Error("BMP file too small to be valid");
    }

    // Step 1: Parse BMP file header (BITMAPFILEHEADER)
    const fileHeader = {
      type: String.fromCharCode(data[0], data[1]), // Should be "BM"
      size: readUint32LE(data, 2),
      reserved1: readUint16LE(data, 6),
      reserved2: readUint16LE(data, 8),
      dataOffset: readUint32LE(data, 10), // Offset to pixel data
    };

    // Validate BMP signature
    if (fileHeader.type !== "BM") {
      throw new Error(`Invalid BMP signature: "${fileHeader.type}" (expected "BM")`);
    }

    // Step 2: Parse BMP info header (BITMAPINFOHEADER)
    const infoOffset = 14;
    const infoHeader = {
      size: readUint32LE(data, infoOffset), // Should be 40 for BITMAPINFOHEADER
      width: readUint32LE(data, infoOffset + 4),
      height: readUint32LE(data, infoOffset + 8), // Can be negative for top-down
      planes: readUint16LE(data, infoOffset + 12), // Should be 1
      bitCount: readUint16LE(data, infoOffset + 14), // 24 or 32
      compression: readUint32LE(data, infoOffset + 16), // Should be 0 (uncompressed)
      sizeImage: readUint32LE(data, infoOffset + 20),
      xPelsPerMeter: readUint32LE(data, infoOffset + 24),
      yPelsPerMeter: readUint32LE(data, infoOffset + 28),
      clrUsed: readUint32LE(data, infoOffset + 32),
      clrImportant: readUint32LE(data, infoOffset + 36),
    };

    // Validate info header
    if (infoHeader.size !== 40) {
      throw new Error(`Unsupported BMP info header size: ${infoHeader.size} (expected 40)`);
    }

    if (infoHeader.planes !== 1) {
      throw new Error(`Invalid BMP planes: ${infoHeader.planes} (expected 1)`);
    }

    if (infoHeader.bitCount !== 24 && infoHeader.bitCount !== 32) {
      throw new Error(`Unsupported BMP bit depth: ${infoHeader.bitCount} (expected 24 or 32)`);
    }

    if (infoHeader.compression !== 0) {
      throw new Error(`Unsupported BMP compression: ${infoHeader.compression} (expected 0 for uncompressed)`);
    }

    // Handle negative height (top-down BMP)
    const actualHeight = Math.abs(infoHeader.height);
    const isTopDown = infoHeader.height < 0;

    // Step 3: Calculate pixel data properties
    const bytesPerPixel = infoHeader.bitCount / 8; // 3 for 24-bit, 4 for 32-bit
    const rowSize = Math.floor((infoHeader.width * infoHeader.bitCount + 31) / 32) * 4; // 4-byte aligned
    const pixelDataSize = rowSize * actualHeight;

    // Validate pixel data offset and size
    if (fileHeader.dataOffset >= data.length) {
      throw new Error(`Invalid pixel data offset: ${fileHeader.dataOffset} (file size: ${data.length})`);
    }

    const expectedSize = fileHeader.dataOffset + pixelDataSize;
    if (expectedSize > data.length) {
      throw new Error(`Incomplete BMP file: expected ${expectedSize} bytes, got ${data.length}`);
    }

    // Step 4: Extract and convert pixel data
    const pixels = new Uint8Array(infoHeader.width * actualHeight * 4); // Always RGBA output
    const pixelData = data.slice(fileHeader.dataOffset, fileHeader.dataOffset + pixelDataSize);

    let pixelIndex = 0;

    // BMP stores rows bottom-up (unless top-down flag is set)
    const startRow = isTopDown ? 0 : actualHeight - 1;
    const endRow = isTopDown ? actualHeight : -1;
    const rowStep = isTopDown ? 1 : -1;

    for (let row = startRow; row !== endRow; row += rowStep) {
      const rowOffset = row * rowSize;

      for (let col = 0; col < infoHeader.width; col++) {
        const pixelOffset = rowOffset + col * bytesPerPixel;

        if (pixelOffset + bytesPerPixel > pixelData.length) {
          throw new Error(`Pixel data corruption at row ${row}, col ${col}`);
        }

        // Read BGR/BGRA values
        const b = pixelData[pixelOffset];
        const g = pixelData[pixelOffset + 1];
        const r = pixelData[pixelOffset + 2];
        const a = infoHeader.bitCount === 32 ? pixelData[pixelOffset + 3] : 255;

        // Convert to RGBA
        pixels[pixelIndex++] = r; // R
        pixels[pixelIndex++] = g; // G
        pixels[pixelIndex++] = b; // B
        pixels[pixelIndex++] = a; // A
      }
    }

    // Step 5: Create metadata
    const metadata = {
      format: "bmp",
      bitDepth: infoHeader.bitCount,
      compression: "none",
      hasAlpha: infoHeader.bitCount === 32,
      resolution: {
        x: infoHeader.xPelsPerMeter,
        y: infoHeader.yPelsPerMeter,
      },
      colors: {
        used: infoHeader.clrUsed,
        important: infoHeader.clrImportant,
      },
    };

    console.log(`✓ Successfully decoded BMP: ${infoHeader.width}×${actualHeight}`);
    console.log(`  - Bit depth: ${infoHeader.bitCount}, Format: ${infoHeader.bitCount === 32 ? "BGRA" : "BGR"}`);
    console.log(`  - Row size: ${rowSize} bytes (4-byte aligned)`);
    console.log(`  - Reconstructed pixels: ${pixels.length} bytes (${pixels.length / 4} RGBA pixels)`);
    console.log(`  - Orientation: ${isTopDown ? "top-down" : "bottom-up"}`);

    return {
      pixels,
      width: infoHeader.width,
      height: actualHeight,
      metadata,
    };
  } catch (error) {
    throw new Error(`BMP decoding failed: ${error.message}`);
  }
}
