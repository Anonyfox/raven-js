/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file BMP codec - Pure encode/decode functions for BMP format.
 *
 * Provides functional interface for BMP processing:
 * - decodeBMP: BMP buffer → RGBA pixels + metadata
 * - encodeBMP: RGBA pixels → BMP buffer
 *
 * Supports both 24-bit (BGR) and 32-bit (BGRA) uncompressed BMP files.
 */

export { decodeBMP } from "./decode.js";
export { encodeBMP } from "./encode.js";
