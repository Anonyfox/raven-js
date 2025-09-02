/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file FNV-1a 32-bit hash function primitive.
 *
 * Fast, non-cryptographic hash function with excellent distribution properties.
 * FNV-1a variant processes bytes in alternating XOR-multiply order for better
 * avalanche characteristics compared to FNV-1. Optimized for V8 with Math.imul.
 */

/**
 * FNV-1a 32-bit hash function.
 *
 * Fowler-Noll-Vo hash variant with alternating XOR-multiply pattern.
 * Provides fast hashing with good distribution for hash tables, checksums,
 * and feature hashing applications.
 *
 * @param {string} str - String to hash
 * @param {number} [seed=0x811c9dc5] - FNV offset basis seed (32-bit)
 * @returns {number} Unsigned 32-bit hash value
 *
 * @example
 * // Basic string hashing
 * const hash = fnv1a32('hello world');
 * console.log(hash); // 1335831723
 *
 * @example
 * // Custom seed for domain separation
 * const hash1 = fnv1a32('data', 0x12345678);
 * const hash2 = fnv1a32('data', 0x87654321);
 * console.log(hash1 !== hash2); // true - different seeds produce different hashes
 */
export function fnv1a32(str, seed = 0x811c9dc5) {
	let hash = seed;
	const prime = 0x01000193; // FNV prime (32-bit): 16777619

	for (let i = 0; i < str.length; i++) {
		// FNV-1a: XOR then multiply (alternating order vs FNV-1)
		hash ^= str.charCodeAt(i);
		hash = Math.imul(hash, prime); // V8-optimized 32-bit multiply
	}

	return hash >>> 0; // Convert to unsigned 32-bit integer
}
