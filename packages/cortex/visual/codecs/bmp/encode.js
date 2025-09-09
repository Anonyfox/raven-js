/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file BMP encoder - Pure function to encode RGBA pixels to BMP buffer.
 *
 * Encodes RGBA pixel data to Windows BMP format. Supports both 24-bit (BGR)
 * and 32-bit (BGRA) uncompressed BMP files. Pixels are stored bottom-up
 * with 4-byte row alignment as per BMP specification.
 */

/**
 * Write little-endian 32-bit integer to buffer.
 *
 * @param {Uint8Array} buffer - Buffer to write to
 * @param {number} offset - Byte offset
 * @param {number} value - 32-bit integer value
 */
function writeUint32LE(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >> 8) & 0xff;
  buffer[offset + 2] = (value >> 16) & 0xff;
  buffer[offset + 3] = (value >> 24) & 0xff;
}

/**
 * Write little-endian 16-bit integer to buffer.
 *
 * @param {Uint8Array} buffer - Buffer to write to
 * @param {number} offset - Byte offset
 * @param {number} value - 16-bit integer value
 */
function writeUint16LE(buffer, offset, value) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >> 8) & 0xff;
}

/**
 * Encode RGBA pixel data to BMP buffer.
 *
 * @param {Uint8Array} pixels - RGBA pixel data (4 bytes per pixel)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {Object} [options] - BMP encoding options
 * @param {boolean} [options.hasAlpha=false] - Whether to preserve alpha channel (32-bit BMP)
 * @param {number} [options.xResolution=0] - Horizontal resolution in pixels per meter
 * @param {number} [options.yResolution=0] - Vertical resolution in pixels per meter
 * @returns {Uint8Array} BMP encoded buffer
 * @throws {Error} If BMP encoding fails
 *
 * @example
 * const pixels = new Uint8Array(width * height * 4); // RGBA data
 * const bmpBuffer = encodeBMP(pixels, width, height, { hasAlpha: true });
 * writeFileSync('output.bmp', bmpBuffer);
 */
export function encodeBMP(pixels, width, height, options = {}) {
  const { hasAlpha = false, xResolution = 0, yResolution = 0 } = options;

  // Validate input parameters
  if (!pixels || pixels.length === 0) {
    throw new Error("BMP encoding failed: No pixel data provided for encoding");
  }

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`BMP encoding failed: Invalid width: ${width} (must be positive integer)`);
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`BMP encoding failed: Invalid height: ${height} (must be positive integer)`);
  }

  const expectedPixelCount = width * height * 4; // RGBA = 4 bytes per pixel
  if (pixels.length !== expectedPixelCount) {
    throw new Error(
      `BMP encoding failed: Pixel data length mismatch: expected ${expectedPixelCount} bytes for ${width}×${height} RGBA, got ${pixels.length}`
    );
  }

  try {
    // Determine BMP format
    const bitCount = hasAlpha ? 32 : 24; // 32-bit for BGRA, 24-bit for BGR
    const bytesPerPixel = bitCount / 8;

    // Calculate row size (must be 4-byte aligned)
    const rowSize = Math.floor((width * bitCount + 31) / 32) * 4;
    const pixelDataSize = rowSize * height;

    // Calculate file size
    const fileHeaderSize = 14; // BITMAPFILEHEADER
    const infoHeaderSize = 40; // BITMAPINFOHEADER
    const dataOffset = fileHeaderSize + infoHeaderSize;
    const totalSize = dataOffset + pixelDataSize;

    // Create output buffer
    const buffer = new Uint8Array(totalSize);

    // Step 1: Write BMP file header (BITMAPFILEHEADER)
    buffer[0] = 0x42; // 'B'
    buffer[1] = 0x4d; // 'M'
    writeUint32LE(buffer, 2, totalSize); // bfSize
    writeUint16LE(buffer, 6, 0); // bfReserved1
    writeUint16LE(buffer, 8, 0); // bfReserved2
    writeUint32LE(buffer, 10, dataOffset); // bfOffBits

    // Step 2: Write BMP info header (BITMAPINFOHEADER)
    const infoOffset = fileHeaderSize;
    writeUint32LE(buffer, infoOffset, infoHeaderSize); // biSize
    writeUint32LE(buffer, infoOffset + 4, width); // biWidth
    writeUint32LE(buffer, infoOffset + 8, height); // biHeight (positive = bottom-up)
    writeUint16LE(buffer, infoOffset + 12, 1); // biPlanes
    writeUint16LE(buffer, infoOffset + 14, bitCount); // biBitCount
    writeUint32LE(buffer, infoOffset + 16, 0); // biCompression (uncompressed)
    writeUint32LE(buffer, infoOffset + 20, pixelDataSize); // biSizeImage
    writeUint32LE(buffer, infoOffset + 24, xResolution); // biXPelsPerMeter
    writeUint32LE(buffer, infoOffset + 28, yResolution); // biYPelsPerMeter
    writeUint32LE(buffer, infoOffset + 32, 0); // biClrUsed
    writeUint32LE(buffer, infoOffset + 36, 0); // biClrImportant

    // Step 3: Convert and write pixel data (bottom-up order)
    let pixelIndex = 0;

    for (let row = height - 1; row >= 0; row--) {
      // Bottom-up
      const rowOffset = dataOffset + row * rowSize;

      for (let col = 0; col < width; col++) {
        const pixelOffset = rowOffset + col * bytesPerPixel;

        // Read RGBA from input
        const r = pixels[pixelIndex++];
        const g = pixels[pixelIndex++];
        const b = pixels[pixelIndex++];
        const a = pixels[pixelIndex++];

        // Write as BGR/BGRA to output
        buffer[pixelOffset] = b; // B
        buffer[pixelOffset + 1] = g; // G
        buffer[pixelOffset + 2] = r; // R
        if (bitCount === 32) {
          buffer[pixelOffset + 3] = a; // A
        }
      }

      // Pad row to 4-byte boundary (already handled by rowSize calculation)
      // The remaining bytes in the row are already zero-initialized
    }

    console.log(`✓ Successfully encoded BMP: ${width}×${height}`);
    console.log(`  - Bit depth: ${bitCount}, Format: ${bitCount === 32 ? "BGRA" : "BGR"}`);
    console.log(`  - Row size: ${rowSize} bytes (4-byte aligned)`);
    console.log(`  - Pixel data size: ${pixelDataSize} bytes`);
    console.log(`  - Total file size: ${totalSize} bytes`);

    return buffer;
  } catch (error) {
    throw new Error(`BMP encoding failed: ${error.message}`);
  }
}
