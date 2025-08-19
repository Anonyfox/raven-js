/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @packageDocumentation
 *
 * A mapping of SQL special characters to their escaped counterparts.
 * This map handles the most common SQL injection vectors and special characters
 * that need escaping in SQL string literals.
 */
const sqlEscapeMap = {
	"'": "''", // Single quote - most common SQL injection vector
	"\\": "\\\\", // Backslash - escape character
	"\0": "\\0", // Null byte - can cause issues in some databases
	"\n": "\\n", // Newline - can break SQL statements
	"\r": "\\r", // Carriage return - can break SQL statements
	"\x1a": "\\Z", // Ctrl+Z (EOF) - can cause issues in some databases
};

/**
 * Escapes SQL special characters in a string to prevent SQL injection.
 *
 * This function handles the most common SQL injection vectors by escaping
 * special characters that could be used to break out of string literals
 * or cause parsing issues in SQL statements.
 *
 * **Note**: This is NOT a complete SQL injection prevention solution.
 * It only handles basic string escaping for common special characters.
 * For production use, consider using parameterized queries or ORMs.
 *
 * @param {any} str - The value to escape (will be converted to string).
 * @returns {string} The escaped string.
 *
 * @example
 * escapeSql("O'Connor"); // Returns "O''Connor"
 * escapeSql("path\\to\\file"); // Returns "path\\\\to\\\\file"
 * escapeSql("line1\nline2"); // Returns "line1\\nline2"
 * escapeSql("user' OR '1'='1"); // Returns "user'' OR ''1''=''1"
 *
 * @example
 * // Basic usage
 * const userInput = "O'Connor";
 * const query = `SELECT * FROM users WHERE name = '${escapeSql(userInput)}'`;
 * // Result: "SELECT * FROM users WHERE name = 'O''Connor'"
 *
 * @example
 * // Preventing basic injection attempts
 * const malicious = "'; DROP TABLE users; --";
 * const safe = escapeSql(malicious);
 * // Result: "''; DROP TABLE users; --"
 * // The single quotes are escaped, preventing string literal breakouts
 */
export const escapeSql = (str) => {
	// Convert to string first to handle non-string inputs
	const stringValue = String(str);

	// Use a more direct approach for better performance and branch coverage
	let result = "";
	for (let i = 0; i < stringValue.length; i++) {
		const char = stringValue[i];
		const escaped = /** @type {Record<string, string>} */ (sqlEscapeMap)[char];
		// This ensures the fallback branch is always tested
		result += escaped !== undefined ? escaped : char;
	}
	return result;
};
