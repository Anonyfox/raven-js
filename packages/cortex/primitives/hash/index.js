/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Hash function primitives for fast, non-cryptographic hashing.
 *
 * Provides FNV hash family implementations optimized for JavaScript.
 * All functions are pure, stateless primitives suitable for feature hashing,
 * checksums, hash tables, and similarity algorithms.
 */

export { fnv1a32 } from "./fnv1a32.js";
export { fnv1a64 } from "./fnv1a64.js";
export { fnv32 } from "./fnv32.js";
