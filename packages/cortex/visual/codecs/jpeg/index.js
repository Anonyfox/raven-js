/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG codec - Pure decode function for JPEG format.
 *
 * Provides functional interface for JPEG processing:
 * - decodeJPEG: JPEG buffer → RGBA pixels + metadata
 *
 * Supports baseline and progressive JPEG with full color space support,
 * metadata extraction, and performance optimizations.
 *
 * @example
 * import { decodeJPEG } from './codecs/jpeg/index.js';
 *
 * const result = await decodeJPEG(jpegBuffer);
 * console.log(`Decoded ${result.width}x${result.height} image`);
 * console.log('Metadata:', result.metadata);
 */

export { decodeJPEG } from "./decode.js";
