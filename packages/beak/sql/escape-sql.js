/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * SQL character escape mapping for string literal sanitization.
 *
 * Maps dangerous characters to their SQL-safe escaped equivalents. Covers the six
 * critical characters that can break SQL string literals or cause parsing failures.
 *
 * **Performance**: Direct object lookup (O(1)) vs regex replacement patterns.
 * Character-by-character scanning enables precise branch coverage and optimizes
 * for strings with few/no special characters.
 *
 * @type {Readonly<Record<string, string>>}
 */
const sqlEscapeMap = {
	"'": "''", // Single quote → doubled quote (SQL string literal escape)
	"\\": "\\\\", // Backslash → doubled backslash (escape character)
	"\0": "\\0", // NULL byte → \0 (prevents binary injection)
	"\n": "\\n", // Newline → \n (prevents statement breakage)
	"\r": "\\r", // Carriage return → \r (prevents statement breakage)
	"\x1a": "\\Z", // EOF/Ctrl+Z → \Z (prevents query termination)
};

/**
 * Escapes SQL special characters in any value to prevent string literal breakouts.
 *
 * Converts input to string then character-scans for the six critical SQL injection
 * vectors. Uses direct object lookup for maximum performance with mixed content.
 *
 * **Security Boundary**: Prevents string literal escapes and binary injection.
 * Does NOT validate SQL logic, prevent parameter tampering, or block logical
 * injection patterns. Use parameterized queries for complete injection prevention.
 *
 * **Performance**: O(n) character scanning with O(1) lookup per character.
 * Optimized for strings with 0-few special characters (common case).
 *
 * @param {unknown} str - Value to escape (converted via String() coercion)
 * @returns {string} SQL-safe string with dangerous characters escaped
 *
 * @example
 * // Basic usage
 * escapeSql("O'Connor");
 * // → "O''Connor"
 *
 * @example
 * // Edge case: type coercion
 * escapeSql(42);       // → "42"
 * escapeSql(null);     // → "null"
 * escapeSql(['a','b']); // → "a,b"
 *
 * @example
 * // Edge case: injection neutralization
 * escapeSql("'; DROP TABLE users; --");
 * // → "''; DROP TABLE users; --"
 */
export const escapeSql = (str) => {
	// String coercion handles all JavaScript types consistently
	const stringValue = String(str);

	// Character-by-character scanning for optimal branch coverage testing
	let result = "";
	for (let i = 0; i < stringValue.length; i++) {
		const char = stringValue[i];
		const escaped = /** @type {Record<string, string>} */ (sqlEscapeMap)[char];
		// Explicit undefined check ensures both branches testable: escape vs passthrough
		result += escaped !== undefined ? escaped : char;
	}
	return result;
};
