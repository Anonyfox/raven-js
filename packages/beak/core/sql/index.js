/**
 * A mapping of SQL special characters to their escaped counterparts.
 *
 * @type {Object.<string, string>}
 */
const sqlEscapeMap = {
	"'": "''",
	"\\": "\\\\",
	"\0": "\\0",
	"\n": "\\n",
	"\r": "\\r",
	"\x1a": "\\Z",
};

/**
 * Escapes SQL special characters in a string to prevent SQL injection.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
const escapeSql = (str) =>
	str.replace(/[\x00\x0a\x0d\x1a'\\]/g, (char) => sqlEscapeMap[char] || char);

/**
 * The main template tag function for creating SQL queries.
 * It escapes dynamic values to prevent SQL injection.
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...*} values - The dynamic values to be interpolated.
 * @returns {string} The rendered SQL query as a string.
 *
 * @example
 * import { sql } from '@raven-js/beak';
 *
 * const tableName = 'users';
 * const userId = 42;
 * const query = sql`
 *   SELECT * FROM ${tableName}
 *   WHERE id = ${userId};
 * `;
 * // Result: "SELECT * FROM users WHERE id = 42;"
 */
export const sql = (strings, ...values) => {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		result += escapeSql(String(values[i])) + strings[i + 1];
	}
	return result.trim();
};
