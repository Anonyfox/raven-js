/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file WebP codec - Pure decode function for WebP format.
 *
 * Provides functional interface for WebP processing:
 * - decodeWEBP: WebP buffer → RGBA pixels + metadata
 *
 * Supports VP8 lossy, VP8L lossless, VP8X extended features including alpha,
 * ICC/EXIF/XMP metadata. Animation parsing (reject with clear error).
 * Zero dependencies, pure JavaScript implementation.
 *
 * @example
 * import { decodeWEBP } from './codecs/webp/index.js';
 *
 * const result = decodeWEBP(webpBuffer);
 * console.log(`Decoded ${result.width}x${result.height} image`);
 * console.log('Metadata:', result.metadata);
 */

export { decodeWEBP } from "./decode.js";
