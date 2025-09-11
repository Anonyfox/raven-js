/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JPEG zig-zag index mapping utilities.
 *
 * Provides the standard 8×8 zig-zag order mapping from serialized index
 * to natural [row,col] index, represented as a single Uint8Array of length 64
 * that maps zigzagIndex -> naturalIndex (row*8 + col).
 */

/**
 * Standard JPEG zig-zag order mapping (zigzag index -> natural index).
 * Source: ITU T.81 Annex K.
 * @type {Uint8Array}
 */
export const zigZagToNatural = new Uint8Array([
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47,
  55, 62, 63,
]);
