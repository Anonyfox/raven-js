/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tabular data display function for terminal applications.
 *
 * Renders structured data as formatted tables with Unicode borders and auto-sizing columns.
 * Supports custom headers and configurable padding.
 */

/**
 * Render array of objects as formatted table with Unicode borders.
 *
 * Calculates column widths automatically and uses object keys as default headers.
 * Missing properties are displayed as empty strings.
 *
 * @param {Object[]} data - Array of objects to display as table rows
 * @param {Object} [options={}] - Configuration options
 * @param {string[]} [options.headers] - Custom column headers (defaults to object keys)
 * @param {number} [options.padding=2] - Cell padding spaces
 * @returns {void} Outputs table directly to console
 * @throws {TypeError} Data parameter must be array
 *
 * @example
 * ```javascript
 * const users = [
 *   { name: 'John', age: 30, city: 'NYC' },
 *   { name: 'Jane', age: 25, city: 'LA' }
 * ];
 * table(users);
 * // ┌──────┬─────┬─────┐
 * // │ name │ age │ city│
 * // ├──────┼─────┼─────┤
 * // │ John │ 30  │ NYC │
 * // │ Jane │ 25  │ LA  │
 * // └──────┴─────┴─────┘
 *
 * table(users, { headers: ['Name', 'Age', 'Location'] });
 * ```
 */
export function table(
	/** @type {Object[]} */ data,
	/** @type {Object} */ options = {},
) {
	if (!Array.isArray(data)) {
		throw new TypeError("Data must be an array");
	}

	if (data.length === 0) {
		console.log("No data to display");
		return;
	}

	const { padding = 2 } =
		/** @type {{padding?: number, headers?: string[]}} */ (options);

	// Get all unique keys from all objects
	const allKeys = [...new Set(data.flatMap(Object.keys))];
	const headers =
		/** @type {{headers?: string[]}} */ (options).headers || allKeys;

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
