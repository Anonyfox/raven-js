/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Primitive functions for foundational computational operations.
 *
 * Domain-agnostic building blocks including hash functions, mathematical
 * operations, and other atomic algorithms used across cortex modules.
 * All primitives are pure functions with no side effects.
 */

export { fnv1a32, fnv1a64, fnv32 } from "./hash/index.js";
