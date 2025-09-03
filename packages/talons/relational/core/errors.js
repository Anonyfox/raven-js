/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Error normalization and handling for database operations.
 *
 * Provides unified error handling across all database drivers with consistent
 * error shapes and driver-specific error code mapping. Enables clean error
 * handling in application code regardless of underlying database engine.
 */

/**
 * @typedef {Object} DatabaseError
 * @property {string} code - Normalized error code
 * @property {string} message - Error message
 * @property {string} driver - Database driver that generated the error
 * @property {string} [sqlState] - SQL state code (if available)
 * @property {string} [detail] - Additional error details
 * @property {Error} [cause] - Original error that caused this error
 */

/**
 * Standard database error codes (normalized across drivers)
 */
export const ERROR_CODES = {
	// Connection errors
	CONNECTION_FAILED: "CONNECTION_FAILED",
	CONNECTION_TIMEOUT: "CONNECTION_TIMEOUT",
	CONNECTION_LOST: "CONNECTION_LOST",
	AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",

	// Query errors
	SYNTAX_ERROR: "SYNTAX_ERROR",
	CONSTRAINT_VIOLATION: "CONSTRAINT_VIOLATION",
	UNIQUE_VIOLATION: "UNIQUE_VIOLATION",
	FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",
	NOT_NULL_VIOLATION: "NOT_NULL_VIOLATION",
	CHECK_VIOLATION: "CHECK_VIOLATION",

	// Data errors
	DATA_TYPE_MISMATCH: "DATA_TYPE_MISMATCH",
	NUMERIC_VALUE_OUT_OF_RANGE: "NUMERIC_VALUE_OUT_OF_RANGE",
	STRING_DATA_TOO_LONG: "STRING_DATA_TOO_LONG",
	INVALID_DATETIME: "INVALID_DATETIME",

	// Transaction errors
	TRANSACTION_ROLLBACK: "TRANSACTION_ROLLBACK",
	SERIALIZATION_FAILURE: "SERIALIZATION_FAILURE",
	DEADLOCK_DETECTED: "DEADLOCK_DETECTED",

	// Permission errors
	INSUFFICIENT_PRIVILEGE: "INSUFFICIENT_PRIVILEGE",

	// Resource errors
	DISK_FULL: "DISK_FULL",
	OUT_OF_MEMORY: "OUT_OF_MEMORY",
	TOO_MANY_CONNECTIONS: "TOO_MANY_CONNECTIONS",

	// Operation errors
	OPERATION_CANCELLED: "OPERATION_CANCELLED",
	OPERATION_TIMEOUT: "OPERATION_TIMEOUT",

	// Generic errors
	UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

/**
 * PostgreSQL error code mappings
 */
const PG_ERROR_MAPPINGS = {
	// Connection errors
	"08000": ERROR_CODES.CONNECTION_FAILED,
	"08003": ERROR_CODES.CONNECTION_LOST,
	"08006": ERROR_CODES.CONNECTION_FAILED,
	28000: ERROR_CODES.AUTHENTICATION_FAILED,
	"28P01": ERROR_CODES.AUTHENTICATION_FAILED,

	// Syntax errors
	42601: ERROR_CODES.SYNTAX_ERROR,
	42000: ERROR_CODES.SYNTAX_ERROR,

	// Constraint violations
	23000: ERROR_CODES.CONSTRAINT_VIOLATION,
	23505: ERROR_CODES.UNIQUE_VIOLATION,
	23503: ERROR_CODES.FOREIGN_KEY_VIOLATION,
	23502: ERROR_CODES.NOT_NULL_VIOLATION,
	23514: ERROR_CODES.CHECK_VIOLATION,

	// Data type errors
	22000: ERROR_CODES.DATA_TYPE_MISMATCH,
	22003: ERROR_CODES.NUMERIC_VALUE_OUT_OF_RANGE,
	22001: ERROR_CODES.STRING_DATA_TOO_LONG,
	22008: ERROR_CODES.INVALID_DATETIME,

	// Transaction errors
	25000: ERROR_CODES.TRANSACTION_ROLLBACK,
	40001: ERROR_CODES.SERIALIZATION_FAILURE,
	"40P01": ERROR_CODES.DEADLOCK_DETECTED,

	// Permission errors
	42501: ERROR_CODES.INSUFFICIENT_PRIVILEGE,

	// Resource errors
	53100: ERROR_CODES.DISK_FULL,
	53200: ERROR_CODES.OUT_OF_MEMORY,
	53300: ERROR_CODES.TOO_MANY_CONNECTIONS,

	// Operation cancelled
	57014: ERROR_CODES.OPERATION_CANCELLED,
};

/**
 * MySQL error code mappings
 */
const MYSQL_ERROR_MAPPINGS = {
	// Connection errors
	1040: ERROR_CODES.TOO_MANY_CONNECTIONS,
	1045: ERROR_CODES.AUTHENTICATION_FAILED,
	2002: ERROR_CODES.CONNECTION_FAILED,
	2003: ERROR_CODES.CONNECTION_FAILED,
	2006: ERROR_CODES.CONNECTION_LOST,
	2013: ERROR_CODES.CONNECTION_LOST,

	// Syntax errors
	1064: ERROR_CODES.SYNTAX_ERROR,
	1149: ERROR_CODES.SYNTAX_ERROR,

	// Constraint violations
	1062: ERROR_CODES.UNIQUE_VIOLATION,
	1452: ERROR_CODES.FOREIGN_KEY_VIOLATION,
	1048: ERROR_CODES.NOT_NULL_VIOLATION,
	4025: ERROR_CODES.CHECK_VIOLATION,

	// Data type errors
	1264: ERROR_CODES.NUMERIC_VALUE_OUT_OF_RANGE,
	1406: ERROR_CODES.STRING_DATA_TOO_LONG,
	1292: ERROR_CODES.INVALID_DATETIME,

	// Transaction errors
	1213: ERROR_CODES.DEADLOCK_DETECTED,
	1205: ERROR_CODES.OPERATION_TIMEOUT,

	// Permission errors
	1142: ERROR_CODES.INSUFFICIENT_PRIVILEGE,
	1143: ERROR_CODES.INSUFFICIENT_PRIVILEGE,

	// Resource errors
	1028: ERROR_CODES.DISK_FULL,
	1041: ERROR_CODES.OUT_OF_MEMORY,
};

/**
 * SQLite error code mappings
 */
const SQLITE_ERROR_MAPPINGS = {
	// Connection/database errors
	14: ERROR_CODES.CONNECTION_FAILED, // SQLITE_CANTOPEN

	// Constraint violations
	19: ERROR_CODES.CONSTRAINT_VIOLATION, // SQLITE_CONSTRAINT

	// Data type errors
	20: ERROR_CODES.DATA_TYPE_MISMATCH, // SQLITE_MISMATCH

	// Permission errors
	23: ERROR_CODES.AUTHENTICATION_FAILED, // SQLITE_AUTH

	// Resource errors
	7: ERROR_CODES.OUT_OF_MEMORY, // SQLITE_NOMEM
	13: ERROR_CODES.DISK_FULL, // SQLITE_FULL
};

/**
 * Database error class with normalized properties
 */
export class DatabaseError extends Error {
	/**
	 * @param {string} message - Error message
	 * @param {string} code - Normalized error code
	 * @param {string} driver - Database driver
	 * @param {string} [sqlState] - SQL state code
	 * @param {string} [detail] - Additional details
	 * @param {Error} [cause] - Original error
	 */
	constructor(message, code, driver, sqlState, detail, cause) {
		super(message);
		this.name = "DatabaseError";
		this.code = code;
		this.driver = driver;
		this.sqlState = sqlState;
		this.detail = detail;
		this.cause = cause;
	}

	/**
	 * Convert error to JSON representation
	 * @returns {Object} JSON representation
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			driver: this.driver,
			sqlState: this.sqlState,
			detail: this.detail,
		};
	}
}

/**
 * Normalize PostgreSQL error
 * @param {Error} error - Original PostgreSQL error
 * @returns {DatabaseError} Normalized error
 */
export function normalizePostgresError(error) {
	const sqlState = error.code;
	const code = PG_ERROR_MAPPINGS[sqlState] || ERROR_CODES.UNKNOWN_ERROR;

	let detail = error.detail;
	if (error.hint) {
		detail = detail ? `${detail}\nHint: ${error.hint}` : `Hint: ${error.hint}`;
	}

	return new DatabaseError(error.message, code, "pg", sqlState, detail, error);
}

/**
 * Normalize MySQL error
 * @param {Error} error - Original MySQL error
 * @returns {DatabaseError} Normalized error
 */
export function normalizeMysqlError(error) {
	const errno = error.errno || error.code;
	const code = MYSQL_ERROR_MAPPINGS[errno] || ERROR_CODES.UNKNOWN_ERROR;
	const sqlState = error.sqlState;

	return new DatabaseError(
		error.message,
		code,
		"mysql",
		sqlState,
		error.sql,
		error,
	);
}

/**
 * Normalize SQLite error
 * @param {Error} error - Original SQLite error
 * @returns {DatabaseError} Normalized error
 */
export function normalizeSqliteError(error) {
	// SQLite errors often have numeric codes in the message
	const codeMatch = error.message.match(/SQLITE_\w+\s*\((\d+)\)/);
	const errno = codeMatch ? Number.parseInt(codeMatch[1], 10) : null;
	const code = errno
		? SQLITE_ERROR_MAPPINGS[errno] || ERROR_CODES.UNKNOWN_ERROR
		: ERROR_CODES.UNKNOWN_ERROR;

	return new DatabaseError(error.message, code, "sqlite", null, null, error);
}

/**
 * Normalize connection timeout error
 * @param {string} driver - Database driver
 * @param {number} [timeout] - Timeout value in milliseconds
 * @returns {DatabaseError} Normalized error
 */
export function createConnectionTimeoutError(driver, timeout) {
	const message = timeout
		? `Connection timeout after ${timeout}ms`
		: "Connection timeout";

	return new DatabaseError(message, ERROR_CODES.CONNECTION_TIMEOUT, driver);
}

/**
 * Normalize operation timeout error
 * @param {string} driver - Database driver
 * @param {number} [timeout] - Timeout value in milliseconds
 * @returns {DatabaseError} Normalized error
 */
export function createOperationTimeoutError(driver, timeout) {
	const message = timeout
		? `Operation timeout after ${timeout}ms`
		: "Operation timeout";

	return new DatabaseError(message, ERROR_CODES.OPERATION_TIMEOUT, driver);
}

/**
 * Normalize operation cancelled error
 * @param {string} driver - Database driver
 * @returns {DatabaseError} Normalized error
 */
export function createOperationCancelledError(driver) {
	return new DatabaseError(
		"Operation was cancelled",
		ERROR_CODES.OPERATION_CANCELLED,
		driver,
	);
}

/**
 * Normalize generic database error
 * @param {Error} error - Original error
 * @param {string} driver - Database driver
 * @returns {DatabaseError} Normalized error
 */
export function normalizeError(error, driver) {
	// If already a DatabaseError, return as-is
	if (error instanceof DatabaseError) {
		return error;
	}

	// Handle AbortError (from AbortSignal)
	if (error.name === "AbortError") {
		return createOperationCancelledError(driver);
	}

	// Handle timeout errors
	if (error.name === "TimeoutError" || error.message?.includes("timeout")) {
		return createOperationTimeoutError(driver);
	}

	// Driver-specific error normalization
	switch (driver) {
		case "pg":
			return normalizePostgresError(error);
		case "mysql":
			return normalizeMysqlError(error);
		case "sqlite-node":
		case "sqlite-wasm":
			return normalizeSqliteError(error);
		default:
			return new DatabaseError(
				error.message || "Unknown database error",
				ERROR_CODES.UNKNOWN_ERROR,
				driver,
				null,
				null,
				error,
			);
	}
}

/**
 * Check if error is retryable (connection issues, temporary failures)
 * @param {DatabaseError} error - Database error to check
 * @returns {boolean} True if error might be retryable
 */
export function isRetryableError(error) {
	const retryableCodes = new Set([
		ERROR_CODES.CONNECTION_FAILED,
		ERROR_CODES.CONNECTION_LOST,
		ERROR_CODES.CONNECTION_TIMEOUT,
		ERROR_CODES.SERIALIZATION_FAILURE,
		ERROR_CODES.DEADLOCK_DETECTED,
		ERROR_CODES.TOO_MANY_CONNECTIONS,
	]);

	return retryableCodes.has(error.code);
}

/**
 * Check if error indicates connection is broken and should be discarded
 * @param {DatabaseError} error - Database error to check
 * @returns {boolean} True if connection should be discarded
 */
export function isConnectionError(error) {
	const connectionErrorCodes = new Set([
		ERROR_CODES.CONNECTION_FAILED,
		ERROR_CODES.CONNECTION_LOST,
		ERROR_CODES.CONNECTION_TIMEOUT,
		ERROR_CODES.AUTHENTICATION_FAILED,
	]);

	return connectionErrorCodes.has(error.code);
}
