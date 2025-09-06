/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PNG signature validation helper.
 *
 * Validates PNG file signature according to PNG specification.
 * The PNG signature is exactly 8 bytes: [137, 80, 78, 71, 13, 10, 26, 10]
 * This signature serves multiple purposes:
 * - Identifies the file as PNG format
 * - Detects transmission errors that alter newline sequences
 * - Provides early detection of file corruption
 */

/**
 * PNG file signature as defined in PNG specification.
 *
 * Bytes breakdown:
 * - 137: High bit set to detect systems that clear bit 7
 * - 80, 78, 71: ASCII "PNG"
 * - 13, 10: DOS line ending to detect DOS/Unix newline conversion
 * - 26: DOS EOF character to stop file display under DOS
 * - 10: Unix line ending to detect Unix/DOS newline conversion
 */
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

/**
 * Validate PNG file signature.
 *
 * Checks if the first 8 bytes of a buffer match the PNG signature.
 * This is the first validation step for any PNG file processing.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - Buffer containing potential PNG data
 * @returns {boolean} True if buffer starts with valid PNG signature
 * @throws {TypeError} If buffer is not ArrayBuffer or Uint8Array
 *
 * @example
 * // Valid PNG signature
 * const pngData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...]);
 * const isValid = validatePNGSignature(pngData); // true
 *
 * @example
 * // Invalid signature
 * const invalidData = new Uint8Array([255, 216, 255, 224, ...]);
 * const isValid = validatePNGSignature(invalidData); // false
 *
 * @example
 * // Buffer too short
 * const shortBuffer = new Uint8Array([137, 80, 78]);
 * const isValid = validatePNGSignature(shortBuffer); // false
 */
export function validatePNGSignature(buffer) {
  if (!buffer || (!(buffer instanceof ArrayBuffer) && !(buffer instanceof Uint8Array))) {
    throw new TypeError("Expected buffer to be ArrayBuffer or Uint8Array");
  }

  // Convert ArrayBuffer to Uint8Array if needed
  const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  // PNG signature is exactly 8 bytes
  if (data.length < PNG_SIGNATURE.length) {
    return false;
  }

  // Compare each byte of the signature
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (data[i] !== PNG_SIGNATURE[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Get PNG signature bytes for reference.
 *
 * Returns a copy of the PNG signature array. Useful for testing
 * or generating valid PNG file headers.
 *
 * @returns {Uint8Array} Copy of PNG signature bytes
 *
 * @example
 * // Get signature for file generation
 * const signature = getPNGSignature();
 * console.log(Array.from(signature)); // [137, 80, 78, 71, 13, 10, 26, 10]
 */
export function getPNGSignature() {
  return new Uint8Array(PNG_SIGNATURE);
}
