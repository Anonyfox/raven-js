/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { escapeSql } from "./escape-sql.js";

/**
 * @packageDocumentation
 *
 * Processes SQL template literals by interpolating and escaping dynamic values.
 * This function takes the static parts of a template literal and the dynamic values,
 * then combines them while ensuring all dynamic values are properly escaped to
 * prevent SQL injection attacks.
 * // Basic usage
 * const tableName = 'users';
 * const userId = 42;
 * const query = processSQLTemplate`SELECT * FROM ${tableName} WHERE id = ${userId}`;
 * // Result: "SELECT * FROM users WHERE id = 42"
 * // With user input (automatically escaped)
 * const userInput = "O'Connor";
 * const query = processSQLTemplate`SELECT * FROM users WHERE name = '${userInput}'`;
 * // Result: "SELECT * FROM users WHERE name = 'O''Connor'"
 * // Complex query with multiple values
 * const table = 'orders';
 * const status = 'pending';
 * const limit = 10;
 * const query = processSQLTemplate`
 * SELECT * FROM ${table}
 * WHERE status = '${status}'
 * LIMIT ${limit}
 * `;
 * // Result: "SELECT * FROM orders WHERE status = 'pending' LIMIT 10"
 */
export const processSQLTemplate = (/** @type {TemplateStringsArray} */ strings, /** @type {any[]} */ ...values) => {
	const valuesLength = values.length;

	// Fast path: no values
	if (valuesLength === 0) {
		const result = strings[0];
		// Only trim if needed (optimization)
		return result.charAt(0) <= " " || result.charAt(result.length - 1) <= " "
			? result.trim()
			: result;
	}

	// Fast path: single value (using String.prototype.concat for better performance)
	if (valuesLength === 1) {
		const value = values[0];
		// Smart string conversion: avoid String() if already a string
		const stringValue = typeof value === "string" ? value : String(value);
		const escapedValue = escapeSql(stringValue);
		const result = strings[0].concat(escapedValue, strings[1]);
		// Only trim if needed (optimization)
		return result.charAt(0) <= " " || result.charAt(result.length - 1) <= " "
			? result.trim()
			: result;
	}

	// Fast path: small number of values (StringBuilder pattern)
	if (valuesLength <= 3) {
		let result = strings[0];
		for (let i = 0; i < valuesLength; i++) {
			const value = values[i];
			const stringValue = typeof value === "string" ? value : String(value);
			const escapedValue = escapeSql(stringValue);
			result += escapedValue + strings[i + 1];
		}
		// Only trim if needed (optimization)
		return result.charAt(0) <= " " || result.charAt(result.length - 1) <= " "
			? result.trim()
			: result;
	}

	// General case: exact array sizing for better performance
	const totalParts = strings.length + valuesLength;
	const parts = new Array(totalParts);
	let partsIndex = 0;

	// Start with the first static part
	parts[partsIndex++] = strings[0];

	// Process each dynamic value and append the corresponding static part
	for (let i = 0; i < valuesLength; i++) {
		const value = values[i];
		// Smart string conversion: avoid String() if already a string
		const stringValue = typeof value === "string" ? value : String(value);
		const escapedValue = escapeSql(stringValue);
		// Add the escaped value and the next static part
		parts[partsIndex++] = escapedValue;
		parts[partsIndex++] = strings[i + 1];
	}

	// Join and trim whitespace
	const result = parts.join("");
	// Only trim if needed (optimization)
	return result.charAt(0) <= " " || result.charAt(result.length - 1) <= " "
		? result.trim()
		: result;
};
