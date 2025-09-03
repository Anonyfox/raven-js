/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for relational database error handling
 */

import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { describe, it } from "node:test";
import {
	ERROR_CODES,
	DatabaseError,
	normalizeError,
	isRetryableError,
	isConnectionError,
} from "./errors.js";

describe("ERROR_CODES", () => {
	it("contains all expected error codes", () => {
		ok(ERROR_CODES.CONNECTION_FAILED);
		ok(ERROR_CODES.QUERY_TIMEOUT);
		ok(ERROR_CODES.SYNTAX_ERROR);
		ok(ERROR_CODES.CONSTRAINT_VIOLATION);
		ok(ERROR_CODES.DUPLICATE_KEY);
		ok(ERROR_CODES.FOREIGN_KEY_VIOLATION);
		ok(ERROR_CODES.NOT_NULL_VIOLATION);
		ok(ERROR_CODES.CHECK_VIOLATION);
		ok(ERROR_CODES.PERMISSION_DENIED);
		ok(ERROR_CODES.UNKNOWN);
	});
});

describe("DatabaseError", () => {
	it("creates error with all properties", () => {
		const error = new DatabaseError("Test error", {
			code: ERROR_CODES.SYNTAX_ERROR,
			driver: "pg",
			sqlState: "42601",
			detail: "syntax error at position 5",
			originalError: new Error("Original"),
		});

		strictEqual(error.message, "Test error");
		strictEqual(error.code, ERROR_CODES.SYNTAX_ERROR);
		strictEqual(error.driver, "pg");
		strictEqual(error.sqlState, "42601");
		strictEqual(error.detail, "syntax error at position 5");
		ok(error.originalError instanceof Error);
		ok(error instanceof Error);
		ok(error instanceof DatabaseError);
	});

	it("works with minimal properties", () => {
		const error = new DatabaseError("Simple error");

		strictEqual(error.message, "Simple error");
		strictEqual(error.code, ERROR_CODES.UNKNOWN);
		strictEqual(error.driver, "unknown");
		strictEqual(error.sqlState, null);
		strictEqual(error.detail, null);
		strictEqual(error.originalError, null);
	});
});

describe("normalizeError", () => {
	it("normalizes PostgreSQL errors", () => {
		const pgError = new Error("duplicate key value violates unique constraint");
		pgError.code = "23505";

		const normalized = normalizeError(pgError, "pg");

		ok(normalized instanceof DatabaseError);
		strictEqual(normalized.code, ERROR_CODES.DUPLICATE_KEY);
		strictEqual(normalized.driver, "pg");
		strictEqual(normalized.sqlState, "23505");
	});

	it("normalizes MySQL errors", () => {
		const mysqlError = new Error("Duplicate entry 'test' for key 'PRIMARY'");
		mysqlError.errno = 1062;

		const normalized = normalizeError(mysqlError, "mysql");

		ok(normalized instanceof DatabaseError);
		strictEqual(normalized.code, ERROR_CODES.DUPLICATE_KEY);
		strictEqual(normalized.driver, "mysql");
	});

	it("normalizes SQLite errors", () => {
		const sqliteError = new Error("UNIQUE constraint failed: users.email");
		sqliteError.code = "SQLITE_CONSTRAINT_UNIQUE";

		const normalized = normalizeError(sqliteError, "sqlite-node");

		ok(normalized instanceof DatabaseError);
		strictEqual(normalized.code, ERROR_CODES.DUPLICATE_KEY);
		strictEqual(normalized.driver, "sqlite-node");
	});

	it("handles unknown errors", () => {
		const unknownError = new Error("Some random error");

		const normalized = normalizeError(unknownError, "pg");

		ok(normalized instanceof DatabaseError);
		strictEqual(normalized.code, ERROR_CODES.UNKNOWN);
		strictEqual(normalized.driver, "pg");
	});

	it("preserves DatabaseError instances", () => {
		const dbError = new DatabaseError("Already normalized", {
			code: ERROR_CODES.SYNTAX_ERROR,
			driver: "mysql",
		});

		const normalized = normalizeError(dbError, "pg");

		strictEqual(normalized, dbError); // Should be the same instance
		strictEqual(normalized.driver, "mysql"); // Should not change driver
	});
});

describe("isRetryableError", () => {
	it("identifies retryable errors", () => {
		const connectionError = new DatabaseError("Connection failed", {
			code: ERROR_CODES.CONNECTION_FAILED,
		});

		const timeoutError = new DatabaseError("Query timeout", {
			code: ERROR_CODES.QUERY_TIMEOUT,
		});

		ok(isRetryableError(connectionError));
		ok(isRetryableError(timeoutError));
	});

	it("identifies non-retryable errors", () => {
		const syntaxError = new DatabaseError("Syntax error", {
			code: ERROR_CODES.SYNTAX_ERROR,
		});

		const duplicateError = new DatabaseError("Duplicate key", {
			code: ERROR_CODES.DUPLICATE_KEY,
		});

		strictEqual(isRetryableError(syntaxError), false);
		strictEqual(isRetryableError(duplicateError), false);
	});
});

describe("isConnectionError", () => {
	it("identifies connection errors", () => {
		const connectionError = new DatabaseError("Connection failed", {
			code: ERROR_CODES.CONNECTION_FAILED,
		});

		const authError = new DatabaseError("Permission denied", {
			code: ERROR_CODES.PERMISSION_DENIED,
		});

		ok(isConnectionError(connectionError));
		ok(isConnectionError(authError));
	});

	it("identifies non-connection errors", () => {
		const syntaxError = new DatabaseError("Syntax error", {
			code: ERROR_CODES.SYNTAX_ERROR,
		});

		const duplicateError = new DatabaseError("Duplicate key", {
			code: ERROR_CODES.DUPLICATE_KEY,
		});

		strictEqual(isConnectionError(syntaxError), false);
		strictEqual(isConnectionError(duplicateError), false);
	});
});
