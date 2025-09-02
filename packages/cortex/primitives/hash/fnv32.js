/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file FNV-1 32-bit hash function primitive.
 *
 * Classic FNV-1 hash implementation with multiply-then-XOR pattern.
 * Slightly different characteristics from FNV-1a, used in legacy applications
 * and specific algorithms that require FNV-1 ordering.
 */

/**
 * FNV-1 32-bit hash function.
 *
 * Original Fowler-Noll-Vo hash with multiply-then-XOR pattern.
 * Different from FNV-1a in operation order, providing alternative
 * hash distribution characteristics for specific use cases.
 *
 * @param {string} str - String to hash
 * @param {number} [seed=2166136261] - FNV offset basis seed (32-bit)
 * @returns {number} Unsigned 32-bit hash value
 *
 * @example
 * // Basic FNV-1 hashing
 * const hash = fnv32('hello world');
 * console.log(hash); // different from fnv1a32 result
 *
 * @example
 * // Consistent with SimHash legacy usage
 * const hash = fnv32('feature', 2166136261);
 */
export function fnv32(str, seed = 2166136261) {
	let hash = seed;
	const prime = 16777619; // FNV prime (32-bit): 0x01000193

	for (let i = 0; i < str.length; i++) {
		// FNV-1: Multiply then XOR (original order)
		hash = Math.imul(hash, prime);
		hash ^= str.charCodeAt(i);
	}

	return hash >>> 0; // Convert to unsigned 32-bit integer
}
