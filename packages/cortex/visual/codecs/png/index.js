/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file PNG codec - Pure encode/decode functions for PNG format.
 *
 * Provides functional interface for PNG processing:
 * - decodePNG: PNG buffer → RGBA pixels + metadata
 * - encodePNG: RGBA pixels → PNG buffer
 *
 * This replaces the previous PNGImage class with a cleaner functional approach
 * that separates format-specific logic from image manipulation operations.
 */

export { decodePNG } from "./decode.js";
export { encodePNG } from "./encode.js";
