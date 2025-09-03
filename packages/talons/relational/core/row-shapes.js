/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Row shaping utilities for converting database results to object or array format.
 *
 * Provides high-performance row shaping with precomputed column maps and stable
 * constructors for monomorphic optimization. Handles both object and array output
 * formats with consistent property naming and value decoding.
 */

import { decodeRow } from "./codecs.js";
import { ObjectFactory } from "./utils.js";

/**
 * @typedef {Object} RowShapeOptions
 * @property {'object'|'array'} [shape='object'] - Output shape for rows
 * @property {boolean} [dateAsString=true] - Return dates as strings
 * @property {string} [bigint='bigint'] - How to handle bigint values
 * @property {string} [json='parse'] - How to handle JSON values
 * @property {boolean} [meta=false] - Include metadata in results
 */

/**
 * @typedef {Object} ColumnInfo
 * @property {string} name - Column name
 * @property {string} type - Database-specific type
 * @property {number} [index] - Column index in result set
 */

/**
 * @typedef {Object} QueryResult
 * @property {Array} rows - Shaped row data
 * @property {number} [rowCount] - Number of affected rows
 * @property {ColumnInfo[]} [columns] - Column metadata (if meta=true)
 */

/**
 * Row shaper class for efficient row transformation
 */
export class RowShaper {
	/**
	 * @param {ColumnInfo[]} columns - Column information
	 * @param {RowShapeOptions} options - Shaping options
	 * @param {string} driver - Database driver name
	 * @param {Map<string, Function>} decoders - Column decoder map
	 */
	constructor(columns, options, driver, decoders) {
		this.columns = columns;
		this.options = options;
		this.driver = driver;
		this.decoders = decoders;
		this.shape = options.shape || "object";

		// Create object factory for monomorphic optimization
		if (this.shape === "object") {
			this.objectFactory = new ObjectFactory(columns.map((col) => col.name));
		}

		// Precompute column map for fast property access
		this.columnMap = new Map();
		for (let i = 0; i < columns.length; i++) {
			this.columnMap.set(columns[i].name, i);
		}
	}

	/**
	 * Shape a single row
	 * @param {any[]} values - Raw values from database
	 * @returns {Object|Array} Shaped row
	 */
	shapeRow(values) {
		// Decode values first
		const decodedValues = decodeRow(values, this.columns, this.decoders);

		if (this.shape === "array") {
			return decodedValues;
		}

		// Use object factory for consistent object shape
		return this.objectFactory.create(decodedValues);
	}

	/**
	 * Shape multiple rows
	 * @param {Array<any[]>} rows - Array of raw value arrays
	 * @returns {Array<Object|Array>} Array of shaped rows
	 */
	shapeRows(rows) {
		return rows.map((row) => this.shapeRow(row));
	}

	/**
	 * Create query result with shaped rows and optional metadata
	 * @param {Array<any[]>} rows - Raw rows from database
	 * @param {number} [rowCount] - Number of affected rows
	 * @returns {QueryResult} Shaped query result
	 */
	createResult(rows, rowCount) {
		const result = {
			rows: this.shapeRows(rows),
		};

		if (typeof rowCount === "number") {
			result.rowCount = rowCount;
		}

		if (this.options.meta) {
			result.columns = this.columns.map((col) => ({
				name: col.name,
				type: col.type,
			}));
		}

		return result;
	}

	/**
	 * Get column index by name
	 * @param {string} name - Column name
	 * @returns {number} Column index or -1 if not found
	 */
	getColumnIndex(name) {
		return this.columnMap.get(name) ?? -1;
	}

	/**
	 * Get column information by name
	 * @param {string} name - Column name
	 * @returns {ColumnInfo|undefined} Column information
	 */
	getColumn(name) {
		const index = this.getColumnIndex(name);
		return index >= 0 ? this.columns[index] : undefined;
	}
}

/**
 * Create a row shaper for given columns and options
 * @param {ColumnInfo[]} columns - Column information
 * @param {RowShapeOptions} options - Shaping options
 * @param {string} driver - Database driver name
 * @param {Map<string, Function>} decoders - Column decoder map
 * @returns {RowShaper} Row shaper instance
 */
export function createRowShaper(columns, options, driver, decoders) {
	return new RowShaper(columns, options, driver, decoders);
}

/**
 * Streaming row shaper for async iteration
 */
export class StreamingRowShaper {
	/**
	 * @param {RowShaper} shaper - Base row shaper
	 */
	constructor(shaper) {
		this.shaper = shaper;
	}

	/**
	 * Transform async iterable of raw rows to shaped rows
	 * @param {AsyncIterable<any[]>} rawRows - Async iterable of raw rows
	 * @returns {AsyncIterable<Object|Array>} Async iterable of shaped rows
	 */
	async *transform(rawRows) {
		for await (const row of rawRows) {
			yield this.shaper.shapeRow(row);
		}
	}

	/**
	 * Transform async iterable with batching for better performance
	 * @param {AsyncIterable<any[]>} rawRows - Async iterable of raw rows
	 * @param {number} [batchSize=100] - Number of rows to process per batch
	 * @returns {AsyncIterable<Array<Object|Array>>} Async iterable of row batches
	 */
	async *transformBatched(rawRows, batchSize = 100) {
		let batch = [];

		for await (const row of rawRows) {
			batch.push(this.shaper.shapeRow(row));

			if (batch.length >= batchSize) {
				yield batch;
				batch = [];
			}
		}

		if (batch.length > 0) {
			yield batch;
		}
	}

	/**
	 * Transform and collect all rows into array
	 * @param {AsyncIterable<any[]>} rawRows - Async iterable of raw rows
	 * @returns {Promise<Array<Object|Array>>} Array of shaped rows
	 */
	async collectAll(rawRows) {
		const rows = [];
		for await (const row of this.transform(rawRows)) {
			rows.push(row);
		}
		return rows;
	}
}

/**
 * Create a streaming row shaper
 * @param {RowShaper} shaper - Base row shaper
 * @returns {StreamingRowShaper} Streaming row shaper
 */
export function createStreamingRowShaper(shaper) {
	return new StreamingRowShaper(shaper);
}

/**
 * Utility to sanitize column names for JavaScript property access
 * @param {string} name - Original column name
 * @returns {string} Sanitized property name
 */
export function sanitizeColumnName(name) {
	// Replace invalid characters with underscores
	let sanitized = name.replace(/[^a-zA-Z0-9_$]/g, "_");

	// Ensure it starts with a letter or underscore
	if (!/^[a-zA-Z_$]/.test(sanitized)) {
		sanitized = "_" + sanitized;
	}

	// Avoid JavaScript reserved words
	const reservedWords = new Set([
		"break",
		"case",
		"catch",
		"class",
		"const",
		"continue",
		"debugger",
		"default",
		"delete",
		"do",
		"else",
		"export",
		"extends",
		"finally",
		"for",
		"function",
		"if",
		"import",
		"in",
		"instanceof",
		"new",
		"return",
		"super",
		"switch",
		"this",
		"throw",
		"try",
		"typeof",
		"var",
		"void",
		"while",
		"with",
		"yield",
		"let",
		"static",
		"enum",
		"implements",
		"interface",
		"package",
		"private",
		"protected",
		"public",
		"abstract",
		"boolean",
		"byte",
		"char",
		"double",
		"final",
		"float",
		"goto",
		"int",
		"long",
		"native",
		"short",
		"synchronized",
		"throws",
		"transient",
		"volatile",
	]);

	if (reservedWords.has(sanitized)) {
		sanitized = "_" + sanitized;
	}

	return sanitized;
}

/**
 * Normalize column information with sanitized names
 * @param {Array} columns - Raw column information from driver
 * @param {string} driver - Database driver name
 * @returns {ColumnInfo[]} Normalized column information
 */
export function normalizeColumns(columns, driver) {
	return columns.map((col, index) => {
		// Handle different column info formats from drivers
		let name, type;

		if (typeof col === "string") {
			name = col;
			type = "unknown";
		} else if (col && typeof col === "object") {
			name = col.name || col.column || col.field || `col_${index}`;
			type = col.type || col.dataType || col.data_type || "unknown";
		} else {
			name = `col_${index}`;
			type = "unknown";
		}

		return {
			name: sanitizeColumnName(name),
			type: String(type),
			index,
			originalName: name, // Keep original for reference
		};
	});
}

/**
 * Create a minimal row shaper for simple cases
 * @param {string[]} columnNames - Column names
 * @param {RowShapeOptions} [options={}] - Shaping options
 * @returns {Function} Simple row shaping function
 */
export function createSimpleRowShaper(columnNames, options = {}) {
	const shape = options.shape || "object";

	if (shape === "array") {
		return (values) => values;
	}

	// Create object factory for consistent shapes
	const factory = new ObjectFactory(columnNames.map(sanitizeColumnName));

	return (values) => factory.create(values);
}

/**
 * Merge multiple result sets with compatible schemas
 * @param {QueryResult[]} results - Array of query results to merge
 * @returns {QueryResult} Merged result
 */
export function mergeResults(results) {
	if (results.length === 0) {
		return { rows: [], rowCount: 0 };
	}

	if (results.length === 1) {
		return results[0];
	}

	// Merge rows from all results
	const allRows = [];
	let totalRowCount = 0;

	for (const result of results) {
		allRows.push(...result.rows);
		if (typeof result.rowCount === "number") {
			totalRowCount += result.rowCount;
		}
	}

	const merged = {
		rows: allRows,
		rowCount: totalRowCount,
	};

	// Include columns metadata from first result if available
	if (results[0].columns) {
		merged.columns = results[0].columns;
	}

	return merged;
}
