/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file FNV-1a 64-bit hash function primitive.
 *
 * 64-bit variant of FNV-1a hash using BigInt for collision-resistant hashing.
 * Provides larger hash space than 32-bit version, reducing collision probability
 * for applications requiring high-quality hash distribution.
 */

/**
 * FNV-1a 64-bit hash function using BigInt.
 *
 * High-precision variant of FNV-1a with 64-bit hash space for reduced
 * collision probability. Uses BigInt arithmetic for exact 64-bit operations
 * without JavaScript number precision limitations.
 *
 * @param {string} str - String to hash
 * @param {bigint} [seed=0xcbf29ce484222325n] - FNV offset basis seed (64-bit)
 * @returns {bigint} Unsigned 64-bit hash value as BigInt
 *
 * @example
 * // Basic 64-bit string hashing
 * const hash = fnv1a64('hello world');
 * console.log(hash.toString(16)); // hex representation
 *
 * @example
 * // Custom seed for hash families
 * const familyA = fnv1a64('data', 0x1234567890abcdefn);
 * const familyB = fnv1a64('data', 0xfedcba0987654321n);
 * console.log(familyA !== familyB); // true
 */
export function fnv1a64(str, seed = 0xcbf29ce484222325n) {
	let hash = seed;
	const prime = 0x100000001b3n; // FNV prime (64-bit): 1099511628211
	const mask = 0xffffffffffffffffn; // 64-bit mask

	for (let i = 0; i < str.length; i++) {
		// FNV-1a: XOR then multiply
		hash ^= BigInt(str.charCodeAt(i));
		hash = (hash * prime) & mask; // Keep within 64-bit bounds
	}

	return hash;
}
