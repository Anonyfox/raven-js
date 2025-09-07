/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Factory function for creating format-specific Image instances.
 *
 * Provides unified entry point for image creation, automatically selecting
 * the appropriate format-specific class based on MIME type. Eliminates
 * format guessing and ensures consistent API across all supported formats.
 */

import { GIFImage } from "./gif-image.js";
import { JPEGImage } from "./jpeg/index.js";
import { PNGImage } from "./png/index.js";
import { WebPImage } from "./webp-image.js";

/**
 * Create Image instance from buffer and MIME type.
 *
 * Factory function that instantiates the appropriate format-specific Image
 * class based on the provided MIME type. Supports PNG, JPEG, WebP, and GIF
 * formats with identical API surface.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - Raw image data
 * @param {string} mimeType - MIME type ('image/png'|'image/jpeg'|'image/webp'|'image/gif')
 * @returns {PNGImage|JPEGImage|WebPImage|GIFImage} Format-specific Image instance
 * @throws {Error} If MIME type is not supported
 *
 * @example
 * // Create PNG image
 * const pngImage = createImage(pngBuffer, 'image/png');
 *
 * @example
 * // Create JPEG image and convert to WebP
 * const jpegImage = createImage(jpegBuffer, 'image/jpeg');
 * const webpBuffer = jpegImage.resize(800, 600).toBuffer('image/webp');
 */
export function createImage(buffer, mimeType) {
  if (!buffer || (!(buffer instanceof ArrayBuffer) && !(buffer instanceof Uint8Array))) {
    throw new TypeError("Expected buffer to be ArrayBuffer or Uint8Array");
  }

  if (typeof mimeType !== "string") {
    throw new TypeError("Expected mimeType to be string");
  }

  switch (mimeType.toLowerCase()) {
    case "image/png":
      return /** @type {PNGImage} */ (new PNGImage(buffer, mimeType));
    case "image/jpeg":
    case "image/jpg":
      return /** @type {JPEGImage} */ (new JPEGImage(buffer, mimeType));
    case "image/webp":
      return /** @type {WebPImage} */ (new WebPImage(buffer, mimeType));
    case "image/gif":
      return /** @type {GIFImage} */ (new GIFImage(buffer, mimeType));
    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}
