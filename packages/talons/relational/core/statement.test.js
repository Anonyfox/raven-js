/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for prepared statement wrapper
 */

import { strictEqual, deepStrictEqual, ok, rejects } from "node:assert";
import { describe, it } from "node:test";
import { createStatement, createStatementCache } from "./statement.js";

// Mock driver statement
const createMockDriverStatement = (shouldFail = false) => ({
	id: "test-stmt",
	sql: "SELECT * FROM users WHERE id = ?",
	columns: [{ name: "id", type: "integer" }, { name: "name", type: "string" }],
	execute: async (params) => {
		if (shouldFail) throw new Error("Statement execution failed");
		return {
			rows: [[1, "John"]],
			rowCount: 1,
			columns: [{ name: "id", type: "integer" }, { name: "name", type: "string" }],
		};
	},
	stream: async function* (params) {
		if (shouldFail) throw new Error("Statement streaming failed");
		yield [1, "John"];
	},
	close: async () => {},
});

describe("createStatement", () => {
	it("creates statement wrapper", () => {
		const driverStmt = createMockDriverStatement();
		const stmt = createStatement(driverStmt, "SELECT * FROM users", "pg", {});

		strictEqual(stmt.id, "test-stmt");
		strictEqual(stmt.sql, "SELECT * FROM users");
		strictEqual(typeof stmt.execute, "function");
		strictEqual(typeof stmt.stream, "function");
		strictEqual(typeof stmt.close, "function");
	});

	it("executes statement with parameters", async () => {
		const driverStmt = createMockDriverStatement();
		const stmt = createStatement(driverStmt, "SELECT * FROM users", "pg", {});

		const result = await stmt.execute([1]);

		ok(result.rows);
		ok(result.columns);
		strictEqual(result.rowCount, 1);
	});

	it("streams statement results", async () => {
		const driverStmt = createMockDriverStatement();
		const stmt = createStatement(driverStmt, "SELECT * FROM users", "pg", {});

		const results = [];
		for await (const row of stmt.stream([1])) {
			results.push(row);
		}

		strictEqual(results.length, 1);
		deepStrictEqual(results[0], [1, "John"]);
	});

	it("handles execution errors", async () => {
		const driverStmt = createMockDriverStatement(true);
		const stmt = createStatement(driverStmt, "SELECT * FROM users", "pg", {});

		await rejects(
			() => stmt.execute([1]),
			(error) => error.message.includes("Statement execution failed")
		);
	});

	it("handles streaming errors", async () => {
		const driverStmt = createMockDriverStatement(true);
		const stmt = createStatement(driverStmt, "SELECT * FROM users", "pg", {});

		await rejects(async () => {
			for await (const row of stmt.stream([1])) {
				// Should not reach here
			}
		}, (error) => error.message.includes("Statement streaming failed"));
	});

	it("closes statement", async () => {
		const driverStmt = createMockDriverStatement();
		const stmt = createStatement(driverStmt, "SELECT * FROM users", "pg", {});

		await stmt.close(); // Should not throw
	});
});

describe("createStatementCache", () => {
	it("creates LRU cache for statements", () => {
		const cache = createStatementCache(2);

		strictEqual(typeof cache.get, "function");
		strictEqual(typeof cache.set, "function");
		strictEqual(typeof cache.delete, "function");
		strictEqual(typeof cache.clear, "function");
	});

	it("caches and retrieves statements", () => {
		const cache = createStatementCache(2);
		const stmt = createMockDriverStatement();

		cache.set("SELECT 1", stmt);
		const retrieved = cache.get("SELECT 1");

		strictEqual(retrieved, stmt);
	});

	it("evicts statements when cache is full", () => {
		const cache = createStatementCache(2);
		const stmt1 = createMockDriverStatement();
		const stmt2 = createMockDriverStatement();
		const stmt3 = createMockDriverStatement();

		cache.set("SELECT 1", stmt1);
		cache.set("SELECT 2", stmt2);
		cache.set("SELECT 3", stmt3); // Should evict stmt1

		strictEqual(cache.get("SELECT 1"), undefined);
		strictEqual(cache.get("SELECT 2"), stmt2);
		strictEqual(cache.get("SELECT 3"), stmt3);
	});
});
