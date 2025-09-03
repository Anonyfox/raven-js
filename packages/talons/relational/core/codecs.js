/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shared data type decoders for database values across all drivers.
 *
 * Provides consistent type conversion and decoding logic for all supported
 * database types. Handles platform-specific differences in data representation
 * while maintaining a unified interface for application code.
 */

/**
 * @typedef {Object} CodecOptions
 * @property {boolean} [dateAsString=true] - Return dates as strings instead of Date objects
 * @property {string} [bigint='bigint'] - How to handle bigint values ('bigint'|'string')
 * @property {string} [json='parse'] - How to handle JSON values ('parse'|'string')
 */

/**
 * @typedef {Object} ColumnInfo
 * @property {string} name - Column name
 * @property {string} type - Database-specific type name
 * @property {number} [length] - Column length/precision
 * @property {boolean} [nullable] - Whether column can be null
 * @property {any} [default] - Default value
 */

/**
 * Standard database type categories
 */
export const TYPE_CATEGORIES = {
	INTEGER: "integer",
	BIGINT: "bigint",
	DECIMAL: "decimal",
	FLOAT: "float",
	BOOLEAN: "boolean",
	STRING: "string",
	BINARY: "binary",
	DATE: "date",
	TIMESTAMP: "timestamp",
	TIME: "time",
	JSON: "json",
	UUID: "uuid",
	ARRAY: "array",
	UNKNOWN: "unknown",
};

/**
 * PostgreSQL type OID mappings to standard types
 */
const PG_TYPE_MAPPINGS = {
	16: TYPE_CATEGORIES.BOOLEAN, // bool
	20: TYPE_CATEGORIES.BIGINT, // int8
	21: TYPE_CATEGORIES.INTEGER, // int2
	23: TYPE_CATEGORIES.INTEGER, // int4
	25: TYPE_CATEGORIES.STRING, // text
	114: TYPE_CATEGORIES.JSON, // json
	700: TYPE_CATEGORIES.FLOAT, // float4
	701: TYPE_CATEGORIES.FLOAT, // float8
	1043: TYPE_CATEGORIES.STRING, // varchar
	1082: TYPE_CATEGORIES.DATE, // date
	1114: TYPE_CATEGORIES.TIMESTAMP, // timestamp
	1184: TYPE_CATEGORIES.TIMESTAMP, // timestamptz
	1700: TYPE_CATEGORIES.DECIMAL, // numeric
	2950: TYPE_CATEGORIES.UUID, // uuid
	3802: TYPE_CATEGORIES.JSON, // jsonb
	17: TYPE_CATEGORIES.BINARY, // bytea
};

/**
 * MySQL type name mappings to standard types
 */
const MYSQL_TYPE_MAPPINGS = {
	TINYINT: TYPE_CATEGORIES.INTEGER,
	SMALLINT: TYPE_CATEGORIES.INTEGER,
	MEDIUMINT: TYPE_CATEGORIES.INTEGER,
	INT: TYPE_CATEGORIES.INTEGER,
	INTEGER: TYPE_CATEGORIES.INTEGER,
	BIGINT: TYPE_CATEGORIES.BIGINT,
	DECIMAL: TYPE_CATEGORIES.DECIMAL,
	NUMERIC: TYPE_CATEGORIES.DECIMAL,
	FLOAT: TYPE_CATEGORIES.FLOAT,
	DOUBLE: TYPE_CATEGORIES.FLOAT,
	BIT: TYPE_CATEGORIES.BOOLEAN,
	CHAR: TYPE_CATEGORIES.STRING,
	VARCHAR: TYPE_CATEGORIES.STRING,
	TEXT: TYPE_CATEGORIES.STRING,
	TINYTEXT: TYPE_CATEGORIES.STRING,
	MEDIUMTEXT: TYPE_CATEGORIES.STRING,
	LONGTEXT: TYPE_CATEGORIES.STRING,
	BINARY: TYPE_CATEGORIES.BINARY,
	VARBINARY: TYPE_CATEGORIES.BINARY,
	BLOB: TYPE_CATEGORIES.BINARY,
	TINYBLOB: TYPE_CATEGORIES.BINARY,
	MEDIUMBLOB: TYPE_CATEGORIES.BINARY,
	LONGBLOB: TYPE_CATEGORIES.BINARY,
	DATE: TYPE_CATEGORIES.DATE,
	TIME: TYPE_CATEGORIES.TIME,
	DATETIME: TYPE_CATEGORIES.TIMESTAMP,
	TIMESTAMP: TYPE_CATEGORIES.TIMESTAMP,
	JSON: TYPE_CATEGORIES.JSON,
};

/**
 * SQLite type name mappings to standard types
 */
const SQLITE_TYPE_MAPPINGS = {
	INTEGER: TYPE_CATEGORIES.INTEGER,
	REAL: TYPE_CATEGORIES.FLOAT,
	TEXT: TYPE_CATEGORIES.STRING,
	BLOB: TYPE_CATEGORIES.BINARY,
	NUMERIC: TYPE_CATEGORIES.DECIMAL,
	BOOLEAN: TYPE_CATEGORIES.BOOLEAN,
	DATE: TYPE_CATEGORIES.DATE,
	DATETIME: TYPE_CATEGORIES.TIMESTAMP,
	TIMESTAMP: TYPE_CATEGORIES.TIMESTAMP,
	JSON: TYPE_CATEGORIES.JSON,
};

/**
 * Normalize database type to standard category
 * @param {string|number} dbType - Database-specific type (name or OID)
 * @param {string} driver - Database driver ('pg'|'mysql'|'sqlite-node'|'sqlite-wasm')
 * @returns {string} Standard type category
 */
export function normalizeType(dbType, driver) {
	switch (driver) {
		case "pg":
			return PG_TYPE_MAPPINGS[dbType] || TYPE_CATEGORIES.UNKNOWN;
		case "mysql":
			return (
				MYSQL_TYPE_MAPPINGS[String(dbType).toUpperCase()] ||
				TYPE_CATEGORIES.UNKNOWN
			);
		case "sqlite-node":
		case "sqlite-wasm":
			return (
				SQLITE_TYPE_MAPPINGS[String(dbType).toUpperCase()] ||
				TYPE_CATEGORIES.UNKNOWN
			);
		default:
			return TYPE_CATEGORIES.UNKNOWN;
	}
}

/**
 * Decode integer value
 * @param {any} value - Raw value from database
 * @returns {number|null} Decoded integer
 */
export function decodeInteger(value) {
	if (value === null || value === undefined) return null;
	return Number(value);
}

/**
 * Decode bigint value
 * @param {any} value - Raw value from database
 * @param {CodecOptions} options - Codec options
 * @returns {bigint|string|null} Decoded bigint
 */
export function decodeBigint(value, options) {
	if (value === null || value === undefined) return null;

	const bigintValue = typeof value === "bigint" ? value : BigInt(value);

	return options.bigint === "string" ? String(bigintValue) : bigintValue;
}

/**
 * Decode decimal/numeric value (always returned as string for precision)
 * @param {any} value - Raw value from database
 * @returns {string|null} Decoded decimal as string
 */
export function decodeDecimal(value) {
	if (value === null || value === undefined) return null;
	return String(value);
}

/**
 * Decode floating point value
 * @param {any} value - Raw value from database
 * @returns {number|null} Decoded float
 */
export function decodeFloat(value) {
	if (value === null || value === undefined) return null;
	return Number(value);
}

/**
 * Decode boolean value
 * @param {any} value - Raw value from database
 * @returns {boolean|null} Decoded boolean
 */
export function decodeBoolean(value) {
	if (value === null || value === undefined) return null;

	// Handle various boolean representations
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	if (typeof value === "string") {
		const lower = value.toLowerCase();
		if (lower === "true" || lower === "t" || lower === "1") return true;
		if (lower === "false" || lower === "f" || lower === "0") return false;
	}

	return Boolean(value);
}

/**
 * Decode string value
 * @param {any} value - Raw value from database
 * @returns {string|null} Decoded string
 */
export function decodeString(value) {
	if (value === null || value === undefined) return null;
	return String(value);
}

/**
 * Decode binary data
 * @param {any} value - Raw value from database
 * @returns {Uint8Array|null} Decoded binary data
 */
export function decodeBinary(value) {
	if (value === null || value === undefined) return null;

	if (value instanceof Uint8Array) return value;
	if (value instanceof ArrayBuffer) return new Uint8Array(value);
	if (Array.isArray(value)) return new Uint8Array(value);

	// Handle hex string representation
	if (typeof value === "string" && /^[0-9a-fA-F]+$/.test(value)) {
		const bytes = new Uint8Array(value.length / 2);
		for (let i = 0; i < value.length; i += 2) {
			bytes[i / 2] = Number.parseInt(value.slice(i, i + 2), 16);
		}
		return bytes;
	}

	// Fallback: encode string as UTF-8
	return new TextEncoder().encode(String(value));
}

/**
 * Decode date value
 * @param {any} value - Raw value from database
 * @param {CodecOptions} options - Codec options
 * @returns {Date|string|null} Decoded date
 */
export function decodeDate(value, options) {
	if (value === null || value === undefined) return null;

	let dateValue;
	if (value instanceof Date) {
		dateValue = value;
	} else if (typeof value === "string") {
		dateValue = new Date(value);
	} else if (typeof value === "number") {
		dateValue = new Date(value);
	} else {
		dateValue = new Date(String(value));
	}

	// Check if date is valid
	if (Number.isNaN(dateValue.getTime())) {
		return String(value); // Return original value if unparseable
	}

	return options.dateAsString
		? dateValue.toISOString().split("T")[0]
		: dateValue;
}

/**
 * Decode timestamp value
 * @param {any} value - Raw value from database
 * @param {CodecOptions} options - Codec options
 * @returns {Date|string|null} Decoded timestamp
 */
export function decodeTimestamp(value, options) {
	if (value === null || value === undefined) return null;

	let dateValue;
	if (value instanceof Date) {
		dateValue = value;
	} else if (typeof value === "string") {
		dateValue = new Date(value);
	} else if (typeof value === "number") {
		dateValue = new Date(value);
	} else {
		dateValue = new Date(String(value));
	}

	// Check if date is valid
	if (Number.isNaN(dateValue.getTime())) {
		return String(value); // Return original value if unparseable
	}

	return options.dateAsString ? dateValue.toISOString() : dateValue;
}

/**
 * Decode time value
 * @param {any} value - Raw value from database
 * @returns {string|null} Decoded time as string
 */
export function decodeTime(value) {
	if (value === null || value === undefined) return null;
	return String(value);
}

/**
 * Decode JSON value
 * @param {any} value - Raw value from database
 * @param {CodecOptions} options - Codec options
 * @returns {any|string|null} Decoded JSON value
 */
export function decodeJson(value, options) {
	if (value === null || value === undefined) return null;

	if (options.json === "string") {
		return typeof value === "string" ? value : JSON.stringify(value);
	}

	// Parse JSON if string, otherwise return as-is
	if (typeof value === "string") {
		try {
			return JSON.parse(value);
		} catch {
			return value; // Return original string if not valid JSON
		}
	}

	return value;
}

/**
 * Decode UUID value
 * @param {any} value - Raw value from database
 * @returns {string|null} Decoded UUID as string
 */
export function decodeUuid(value) {
	if (value === null || value === undefined) return null;
	return String(value);
}

/**
 * Decode array value (PostgreSQL arrays)
 * @param {any} value - Raw value from database
 * @param {CodecOptions} options - Codec options
 * @returns {Array|string|null} Decoded array
 */
export function decodeArray(value, options) {
	if (value === null || value === undefined) return null;

	// If already an array, return as-is
	if (Array.isArray(value)) return value;

	// Try to parse PostgreSQL array format
	if (typeof value === "string") {
		try {
			// Simple array parsing (handles basic cases)
			if (value.startsWith("{") && value.endsWith("}")) {
				const content = value.slice(1, -1);
				if (content === "") return [];

				// Split by comma, handling quoted values
				const items = [];
				let current = "";
				let inQuotes = false;
				let escaped = false;

				for (const char of content) {
					if (escaped) {
						current += char;
						escaped = false;
					} else if (char === "\\") {
						escaped = true;
					} else if (char === '"') {
						inQuotes = !inQuotes;
					} else if (char === "," && !inQuotes) {
						items.push(current.trim());
						current = "";
					} else {
						current += char;
					}
				}
				if (current) items.push(current.trim());

				return items.map((item) => {
					// Remove quotes and handle null
					if (item === "NULL") return null;
					if (item.startsWith('"') && item.endsWith('"')) {
						return item.slice(1, -1).replace(/\\"/g, '"');
					}
					return item;
				});
			}
		} catch {
			// Fall through to return string
		}
	}

	return String(value);
}

/**
 * Create a decoder function for a column
 * @param {ColumnInfo} column - Column information
 * @param {string} driver - Database driver
 * @param {CodecOptions} options - Codec options
 * @returns {Function} Decoder function
 */
export function createColumnDecoder(column, driver, options) {
	const typeCategory = normalizeType(column.type, driver);

	switch (typeCategory) {
		case TYPE_CATEGORIES.INTEGER:
			return (value) => decodeInteger(value);
		case TYPE_CATEGORIES.BIGINT:
			return (value) => decodeBigint(value, options);
		case TYPE_CATEGORIES.DECIMAL:
			return (value) => decodeDecimal(value);
		case TYPE_CATEGORIES.FLOAT:
			return (value) => decodeFloat(value);
		case TYPE_CATEGORIES.BOOLEAN:
			return (value) => decodeBoolean(value);
		case TYPE_CATEGORIES.STRING:
			return (value) => decodeString(value);
		case TYPE_CATEGORIES.BINARY:
			return (value) => decodeBinary(value);
		case TYPE_CATEGORIES.DATE:
			return (value) => decodeDate(value, options);
		case TYPE_CATEGORIES.TIMESTAMP:
			return (value) => decodeTimestamp(value, options);
		case TYPE_CATEGORIES.TIME:
			return (value) => decodeTime(value);
		case TYPE_CATEGORIES.JSON:
			return (value) => decodeJson(value, options);
		case TYPE_CATEGORIES.UUID:
			return (value) => decodeUuid(value);
		case TYPE_CATEGORIES.ARRAY:
			return (value) => decodeArray(value, options);
		default:
			return (value) => value; // Return as-is for unknown types
	}
}

/**
 * Create a decoder map for multiple columns
 * @param {ColumnInfo[]} columns - Column information array
 * @param {string} driver - Database driver
 * @param {CodecOptions} options - Codec options
 * @returns {Map<string, Function>} Map of column name to decoder function
 */
export function createDecoderMap(columns, driver, options) {
	const decoders = new Map();

	for (const column of columns) {
		decoders.set(column.name, createColumnDecoder(column, driver, options));
	}

	return decoders;
}

/**
 * Decode a row of values using decoder map
 * @param {any[]} values - Raw values from database
 * @param {ColumnInfo[]} columns - Column information
 * @param {Map<string, Function>} decoders - Decoder map
 * @returns {any[]} Decoded values
 */
export function decodeRow(values, columns, decoders) {
	return values.map((value, index) => {
		const column = columns[index];
		const decoder = decoders.get(column.name);
		return decoder ? decoder(value) : value;
	});
}
