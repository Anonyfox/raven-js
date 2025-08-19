import assert from "node:assert";
import { describe, it } from "node:test";
import { sql } from "./index.js";

describe("core/sql/index.js", () => {
	it("should export sql function", () => {
		assert.strictEqual(typeof sql, "function");
	});

	it("should handle basic SQL template", () => {
		const result = sql`SELECT * FROM users`;
		assert.strictEqual(typeof result, "string");
		assert.strictEqual(result.trim(), "SELECT * FROM users");
	});

	it("should handle interpolated values", () => {
		const userId = 42;
		const result = sql`SELECT * FROM users WHERE id = ${userId}`;
		assert.strictEqual(typeof result, "string");
		assert(result.includes("42"));
		assert(result.includes("SELECT"));
	});

	it("should sanitize string values", () => {
		const userInput = "O'Connor";
		const result = sql`SELECT * FROM users WHERE name = '${userInput}'`;
		assert.strictEqual(typeof result, "string");
		assert(result.includes("O''Connor")); // Should escape the apostrophe
	});

	it("should handle multiple interpolations", () => {
		const table = "orders";
		const status = "pending";
		const limit = 10;
		const result = sql`SELECT * FROM ${table} WHERE status = '${status}' LIMIT ${limit}`;
		assert.strictEqual(typeof result, "string");
		assert(result.includes("orders"));
		assert(result.includes("pending"));
		assert(result.includes("10"));
	});

	it("should handle different data types", () => {
		const id = 123;
		const name = "John Doe";
		const isActive = true;
		const lastLogin = null;
		const result = sql`INSERT INTO users (id, name, active, last_login) VALUES (${id}, '${name}', ${isActive}, ${lastLogin})`;
		assert.strictEqual(typeof result, "string");
		assert(result.includes("123"));
		assert(result.includes("John Doe"));
		assert(result.includes("true"));
		assert(result.includes("null"));
	});
});
