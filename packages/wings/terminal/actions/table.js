/**
 * @file Table display function for terminal interfaces
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * Pure function for displaying tabular data in terminal applications.
 * Uses simple ASCII characters for cross-platform compatibility.
 */

/**
 * Display data in a formatted table.
 *
 * This function takes an array of objects and displays them as a
 * formatted table with headers and aligned columns. It automatically
 * calculates column widths and handles text alignment.
 *
 * **Pure Function**: No side effects except stdout write.
 * **Alignment**: Left-aligned text, handles varying column widths.
 * **Headers**: Uses object keys as column headers.
 *
 * @param {Object[]} data - Array of objects to display as table rows
 * @param {Object} [options] - Table formatting options
 * @param {string[]} [options.headers] - Custom header names (defaults to object keys)
 * @param {number} [options.padding] - Column padding (default: 2)
 *
 * @example
 * ```javascript
 * import { table } from '@raven-js/wings/terminal';
 *
 * const users = [
 *   { name: 'John', age: 30, city: 'New York' },
 *   { name: 'Jane', age: 25, city: 'Los Angeles' },
 *   { name: 'Bob', age: 35, city: 'Chicago' }
 * ];
 *
 * table(users);
 * // Output:
 * // ┌──────┬─────┬─────────────┐
 * // │ name │ age │ city        │
 * // ├──────┼─────┼─────────────┤
 * // │ John │ 30  │ New York    │
 * // │ Jane │ 25  │ Los Angeles │
 * // │ Bob  │ 35  │ Chicago     │
 * // └──────┴─────┴─────────────┘
 *
 * // With custom headers
 * table(users, { headers: ['Name', 'Age', 'Location'] });
 * ```
 */
export function table(data, options = {}) {
	if (!Array.isArray(data)) {
		throw new TypeError("Data must be an array");
	}

	if (data.length === 0) {
		console.log("No data to display");
		return;
	}

	const { padding = 2 } = options;

	// Get all unique keys from all objects
	const allKeys = [...new Set(data.flatMap(Object.keys))];
	const headers = options.headers || allKeys;

	if (headers.length === 0) {
		console.log("No columns to display");
		return;
	}

	// Calculate column widths
	const columnWidths = headers.map((header, index) => {
		const key = allKeys[index] || header;
		const values = data.map((row) =>
			String(/** @type {Record<string, any>} */ (row)[key] || ""),
		);
		const maxValueWidth = Math.max(...values.map((v) => v.length));
		return Math.max(header.length, maxValueWidth) + padding;
	});

	// Table drawing characters
	const chars = {
		topLeft: "┌",
		topRight: "┐",
		bottomLeft: "└",
		bottomRight: "┘",
		horizontal: "─",
		vertical: "│",
		topJoin: "┬",
		bottomJoin: "┴",
		leftJoin: "├",
		rightJoin: "┤",
		cross: "┼",
	};

	// Helper function to create horizontal line
	/**
	 * @param {string} left
	 * @param {string} join
	 * @param {string} right
	 */
	function createHorizontalLine(left, join, right) {
		let line = left;
		for (let i = 0; i < columnWidths.length; i++) {
			line += chars.horizontal.repeat(columnWidths[i]);
			if (i < columnWidths.length - 1) {
				line += join;
			}
		}
		line += right;
		return line;
	}

	// Helper function to create data row
	/**
	 * @param {Record<string, any>} rowData
	 */
	function createDataRow(rowData) {
		let row = chars.vertical;
		for (let i = 0; i < headers.length; i++) {
			const key = allKeys[i] || headers[i];
			const value = String(rowData[key] || "");
			const paddedValue =
				value.padEnd(columnWidths[i] - padding) + " ".repeat(padding);
			row += paddedValue + chars.vertical;
		}
		return row;
	}

	// Build and print table
	const lines = [];

	// Top border
	lines.push(
		createHorizontalLine(chars.topLeft, chars.topJoin, chars.topRight),
	);

	// Header row
	const headerRow = createDataRow(
		Object.fromEntries(
			headers.map((header, i) => [allKeys[i] || header, header]),
		),
	);
	lines.push(headerRow);

	// Header separator
	lines.push(
		createHorizontalLine(chars.leftJoin, chars.cross, chars.rightJoin),
	);

	// Data rows
	for (const row of data) {
		lines.push(createDataRow(row));
	}

	// Bottom border
	lines.push(
		createHorizontalLine(chars.bottomLeft, chars.bottomJoin, chars.bottomRight),
	);

	// Print all lines
	for (const line of lines) {
		console.log(line);
	}
}
