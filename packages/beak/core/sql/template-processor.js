/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { escapeSql } from "./escape-sql.js";

/**
 * Processes SQL template literals with automatic value escaping and performance optimization.
 *
 * Template literal processor that interleaves static strings with escaped dynamic values.
 * Implements four performance tiers based on interpolation count: specialized paths for
 * 0, 1, 2-3, and 4+ values optimize for common usage patterns.
 *
 * **Performance Optimization**: Different algorithms by value count:
 * - 0 values: Direct string return with conditional trim
 * - 1 value: String concatenation (fastest for single interpolation)
 * - 2-3 values: StringBuilder pattern (optimal for few values)
 * - 4+ values: Pre-sized array join (scales with many interpolations)
 *
 * **Security**: All dynamic values pass through escapeSql() automatically.
 * **Whitespace**: Trims leading/trailing whitespace only when detected (performance).
 *
 * @param {TemplateStringsArray} strings - Static template string parts
 * @param {...unknown} values - Dynamic values to interpolate and escape
 * @returns {string} Complete SQL query with escaped values and trimmed whitespace
 *
 * @example
 * // Zero values - direct return path
 * processSQLTemplate`SELECT * FROM users` // → "SELECT * FROM users"
 *
 * @example
 * // Single value - concatenation path
 * processSQLTemplate`SELECT * FROM ${tableName}` // → "SELECT * FROM users"
 *
 * @example
 * // Multiple values - optimized for count
 * processSQLTemplate`SELECT * FROM ${table} WHERE status = '${status}' LIMIT ${limit}`
 * // → "SELECT * FROM orders WHERE status = 'pending' LIMIT 10"
 *
 * @example
 * // Critical edge case: whitespace detection
 * processSQLTemplate`SELECT * FROM users` // → "SELECT * FROM users" (no trim)
 * processSQLTemplate`  SELECT * FROM users  ` // → "SELECT * FROM users" (trimmed)
 *
 * @example
 * // Dangerous pattern: massive batch operations
 * const queries = range(10000).map(i => processSQLTemplate`INSERT INTO logs VALUES (${i})`);
 * // Each call allocates separately - for massive batches, consider direct string building
 */
export const processSQLTemplate = (
	/** @type {TemplateStringsArray} */ strings,
	/** @type {unknown[]} */ ...values
) => {
	const valuesLength = values.length;

	// Performance tier 1: Zero interpolations - direct string path
	if (valuesLength === 0) {
		const result = strings[0];
		// Conditional trim: check edge characters before expensive trim operation
		return result.charAt(0) <= " " || result.charAt(result.length - 1) <= " "
			? result.trim()
			: result;
	}

	// Performance tier 2: Single interpolation - concatenation (fastest)
	if (valuesLength === 1) {
		const value = values[0];
		// Type-aware string conversion: avoid String() overhead for strings
		const stringValue = typeof value === "string" ? value : String(value);
		const escapedValue = escapeSql(stringValue);
		const result = strings[0].concat(escapedValue, strings[1]);
		// Conditional trim optimization
		return result.charAt(0) <= " " || result.charAt(result.length - 1) <= " "
			? result.trim()
			: result;
	}

	// Performance tier 3: Few interpolations - StringBuilder pattern (2-3 values)
	if (valuesLength <= 3) {
		let result = strings[0];
		for (let i = 0; i < valuesLength; i++) {
			const value = values[i];
			const stringValue = typeof value === "string" ? value : String(value);
			const escapedValue = escapeSql(stringValue);
			result += escapedValue + strings[i + 1];
		}
		// Conditional trim optimization
		return result.charAt(0) <= " " || result.charAt(result.length - 1) <= " "
			? result.trim()
			: result;
	}

	// Performance tier 4: Many interpolations - pre-sized array join (4+ values)
	const totalParts = strings.length + valuesLength;
	const parts = new Array(totalParts);
	let partsIndex = 0;

	// Interleave static strings with escaped dynamic values
	parts[partsIndex++] = strings[0];

	for (let i = 0; i < valuesLength; i++) {
		const value = values[i];
		// Type-aware string conversion
		const stringValue = typeof value === "string" ? value : String(value);
		const escapedValue = escapeSql(stringValue);
		// Alternating pattern: value, then next static string
		parts[partsIndex++] = escapedValue;
		parts[partsIndex++] = strings[i + 1];
	}

	// Array join with conditional trim
	const result = parts.join("");
	return result.charAt(0) <= " " || result.charAt(result.length - 1) <= " "
		? result.trim()
		: result;
};
