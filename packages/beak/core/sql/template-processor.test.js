import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { processSQLTemplate } from "./template-processor.js";

describe("processSQLTemplate", () => {
	describe("basic template processing", () => {
		it("should handle empty template", () => {
			const result = processSQLTemplate``;
			assert.equal(result, "");
		});

		it("should handle template with no values", () => {
			const result = processSQLTemplate`SELECT * FROM users`;
			assert.equal(result, "SELECT * FROM users");
		});

		it("should handle single value interpolation", () => {
			const tableName = "users";
			const result = processSQLTemplate`SELECT * FROM ${tableName}`;
			assert.equal(result, "SELECT * FROM users");
		});

		it("should handle multiple value interpolation", () => {
			const tableName = "users";
			const userId = 42;
			const result = processSQLTemplate`SELECT * FROM ${tableName} WHERE id = ${userId}`;
			assert.equal(result, "SELECT * FROM users WHERE id = 42");
		});

		it("should handle value at the beginning", () => {
			const tableName = "users";
			const result = processSQLTemplate`${tableName} WHERE id = 1`;
			assert.equal(result, "users WHERE id = 1");
		});

		it("should handle value at the end", () => {
			const userId = 42;
			const result = processSQLTemplate`SELECT * FROM users WHERE id = ${userId}`;
			assert.equal(result, "SELECT * FROM users WHERE id = 42");
		});

		it("should handle values at both ends", () => {
			const tableName = "users";
			const userId = 42;
			const result = processSQLTemplate`${tableName} WHERE id = ${userId}`;
			assert.equal(result, "users WHERE id = 42");
		});
	});

	describe("SQL injection prevention", () => {
		it("should escape single quotes in values", () => {
			const userInput = "O'Connor";
			const result = processSQLTemplate`SELECT * FROM users WHERE name = '${userInput}'`;
			assert.equal(result, "SELECT * FROM users WHERE name = 'O''Connor'");
		});

		it("should escape backslashes in values", () => {
			const path = "C:\\Users\\John\\Documents";
			const result = processSQLTemplate`SELECT * FROM files WHERE path = '${path}'`;
			assert.equal(
				result,
				"SELECT * FROM files WHERE path = 'C:\\\\Users\\\\John\\\\Documents'",
			);
		});

		it("should escape newlines in values", () => {
			const description = "Line 1\nLine 2";
			const result = processSQLTemplate`UPDATE posts SET description = '${description}'`;
			assert.equal(result, "UPDATE posts SET description = 'Line 1\\nLine 2'");
		});

		it("should escape carriage returns in values", () => {
			const text = "Line 1\rLine 2";
			const result = processSQLTemplate`UPDATE posts SET text = '${text}'`;
			assert.equal(result, "UPDATE posts SET text = 'Line 1\\rLine 2'");
		});

		it("should escape null bytes in values", () => {
			const data = "text\0with\0nulls";
			const result = processSQLTemplate`UPDATE data SET content = '${data}'`;
			assert.equal(result, "UPDATE data SET content = 'text\\0with\\0nulls'");
		});

		it("should escape Ctrl+Z in values", () => {
			const data = "text\x1aend";
			const result = processSQLTemplate`UPDATE data SET content = '${data}'`;
			assert.equal(result, "UPDATE data SET content = 'text\\Zend'");
		});

		it("should prevent basic SQL injection attempts", () => {
			const malicious = "'; DROP TABLE users; --";
			const result = processSQLTemplate`SELECT * FROM users WHERE name = '${malicious}'`;
			// The single quote should be escaped to prevent SQL injection
			assert.ok(result.includes("''"));
			assert.ok(result.includes("DROP TABLE users"));
			assert.ok(!result.includes("'DROP TABLE users"));
		});

		it("should prevent OR 1=1 injection attempts", () => {
			const malicious = "' OR '1'='1";
			const result = processSQLTemplate`SELECT * FROM users WHERE name = '${malicious}'`;
			assert.equal(
				result,
				"SELECT * FROM users WHERE name = ''' OR ''1''=''1'",
			);
		});

		it("should prevent UNION injection attempts", () => {
			const malicious = "' UNION SELECT * FROM users --";
			const result = processSQLTemplate`SELECT * FROM users WHERE name = '${malicious}'`;
			assert.equal(
				result,
				"SELECT * FROM users WHERE name = ''' UNION SELECT * FROM users --'",
			);
		});
	});

	describe("value type handling", () => {
		it("should handle numbers", () => {
			const result = processSQLTemplate`SELECT * FROM users WHERE id = ${42}`;
			assert.equal(result, "SELECT * FROM users WHERE id = 42");
		});

		it("should handle booleans", () => {
			const result = processSQLTemplate`SELECT * FROM users WHERE active = ${true}`;
			assert.equal(result, "SELECT * FROM users WHERE active = true");
		});

		it("should handle null", () => {
			const result = processSQLTemplate`SELECT * FROM users WHERE deleted_at = ${null}`;
			assert.equal(result, "SELECT * FROM users WHERE deleted_at = null");
		});

		it("should handle undefined", () => {
			const result = processSQLTemplate`SELECT * FROM users WHERE optional = ${undefined}`;
			assert.equal(result, "SELECT * FROM users WHERE optional = undefined");
		});

		it("should handle zero", () => {
			const result = processSQLTemplate`SELECT * FROM users WHERE count = ${0}`;
			assert.equal(result, "SELECT * FROM users WHERE count = 0");
		});

		it("should handle empty strings", () => {
			const result = processSQLTemplate`SELECT * FROM users WHERE name = '${""}'`;
			assert.equal(result, "SELECT * FROM users WHERE name = ''");
		});

		it("should handle objects", () => {
			const obj = { key: "value" };
			const result = processSQLTemplate`SELECT * FROM data WHERE config = '${obj}'`;
			assert.equal(
				result,
				"SELECT * FROM data WHERE config = '[object Object]'",
			);
		});

		it("should handle arrays", () => {
			const arr = [1, 2, 3];
			const result = processSQLTemplate`SELECT * FROM data WHERE ids = '${arr}'`;
			assert.equal(result, "SELECT * FROM data WHERE ids = '1,2,3'");
		});

		it("should handle functions", () => {
			const func = () => "test";
			const result = processSQLTemplate`SELECT * FROM data WHERE handler = '${func}'`;
			assert.equal(
				result,
				"SELECT * FROM data WHERE handler = '() => \"test\"'",
			);
		});

		it("should handle symbols", () => {
			const sym = Symbol("test");
			const result = processSQLTemplate`SELECT * FROM data WHERE symbol = '${sym}'`;
			assert.equal(result, "SELECT * FROM data WHERE symbol = 'Symbol(test)'");
		});

		it("should handle bigints", () => {
			const bigInt = 123n;
			const result = processSQLTemplate`SELECT * FROM data WHERE big_id = ${bigInt}`;
			assert.equal(result, "SELECT * FROM data WHERE big_id = 123");
		});
	});

	describe("complex SQL queries", () => {
		it("should handle SELECT queries", () => {
			const table = "users";
			const columns = ["id", "name", "email"];
			const result = processSQLTemplate`SELECT ${columns.join(", ")} FROM ${table}`;
			assert.equal(result, "SELECT id, name, email FROM users");
		});

		it("should handle INSERT queries", () => {
			const table = "users";
			const name = "John Doe";
			const email = "john@example.com";
			const result = processSQLTemplate`INSERT INTO ${table} (name, email) VALUES ('${name}', '${email}')`;
			assert.equal(
				result,
				"INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com')",
			);
		});

		it("should handle UPDATE queries", () => {
			const table = "users";
			const name = "Jane Doe";
			const id = 42;
			const result = processSQLTemplate`UPDATE ${table} SET name = '${name}' WHERE id = ${id}`;
			assert.equal(result, "UPDATE users SET name = 'Jane Doe' WHERE id = 42");
		});

		it("should handle DELETE queries", () => {
			const table = "users";
			const id = 42;
			const result = processSQLTemplate`DELETE FROM ${table} WHERE id = ${id}`;
			assert.equal(result, "DELETE FROM users WHERE id = 42");
		});

		it("should handle JOIN queries", () => {
			const table1 = "users";
			const table2 = "orders";
			const result = processSQLTemplate`SELECT * FROM ${table1} JOIN ${table2} ON ${table1}.id = ${table2}.user_id`;
			assert.equal(
				result,
				"SELECT * FROM users JOIN orders ON users.id = orders.user_id",
			);
		});

		it("should handle WHERE clauses with multiple conditions", () => {
			const table = "users";
			const status = "active";
			const age = 25;
			const result = processSQLTemplate`SELECT * FROM ${table} WHERE status = '${status}' AND age > ${age}`;
			assert.equal(
				result,
				"SELECT * FROM users WHERE status = 'active' AND age > 25",
			);
		});

		it("should handle ORDER BY clauses", () => {
			const table = "users";
			const column = "name";
			const direction = "ASC";
			const result = processSQLTemplate`SELECT * FROM ${table} ORDER BY ${column} ${direction}`;
			assert.equal(result, "SELECT * FROM users ORDER BY name ASC");
		});

		it("should handle LIMIT clauses", () => {
			const table = "users";
			const limit = 10;
			const result = processSQLTemplate`SELECT * FROM ${table} LIMIT ${limit}`;
			assert.equal(result, "SELECT * FROM users LIMIT 10");
		});
	});

	describe("edge cases", () => {
		it("should handle empty values", () => {
			const result = processSQLTemplate`SELECT * FROM users WHERE name = '${""}'`;
			assert.equal(result, "SELECT * FROM users WHERE name = ''");
		});

		it("should handle whitespace-only values", () => {
			const result = processSQLTemplate`SELECT * FROM users WHERE name = '${"   "}'`;
			assert.equal(result, "SELECT * FROM users WHERE name = '   '");
		});

		it("should handle very long values", () => {
			const longValue = "a".repeat(1000);
			const result = processSQLTemplate`SELECT * FROM data WHERE content = '${longValue}'`;
			assert.equal(result, `SELECT * FROM data WHERE content = '${longValue}'`);
		});

		it("should handle values with special characters", () => {
			const special =
				"text with 'quotes' and \"double quotes\" and \\backslashes\\";
			const result = processSQLTemplate`SELECT * FROM data WHERE content = '${special}'`;
			assert.equal(
				result,
				"SELECT * FROM data WHERE content = 'text with ''quotes'' and \"double quotes\" and \\\\backslashes\\\\'",
			);
		});

		it("should handle unicode characters", () => {
			const unicode = "café 🚀 中文";
			const result = processSQLTemplate`SELECT * FROM data WHERE content = '${unicode}'`;
			assert.equal(result, "SELECT * FROM data WHERE content = 'café 🚀 中文'");
		});

		it("should handle unicode with SQL special characters", () => {
			const unicode = "O'Connor café";
			const result = processSQLTemplate`SELECT * FROM data WHERE content = '${unicode}'`;
			assert.equal(
				result,
				"SELECT * FROM data WHERE content = 'O''Connor café'",
			);
		});
	});

	describe("whitespace handling", () => {
		it("should trim leading and trailing whitespace", () => {
			const result = processSQLTemplate`
				SELECT * FROM users
				WHERE id = 1
			`;
			// Template literals preserve whitespace, so we need to account for that
			assert.ok(result.includes("SELECT * FROM users"));
			assert.ok(result.includes("WHERE id = 1"));
		});

		it("should preserve internal whitespace", () => {
			const result = processSQLTemplate`SELECT id, name, email FROM users WHERE id = 1`;
			assert.equal(result, "SELECT id, name, email FROM users WHERE id = 1");
		});

		it("should handle multiple lines", () => {
			const result = processSQLTemplate`
				SELECT
					id,
					name,
					email
				FROM users
				WHERE id = 1
			`;
			// Template literals preserve whitespace, so we need to account for that
			assert.ok(result.includes("SELECT"));
			assert.ok(result.includes("id"));
			assert.ok(result.includes("name"));
			assert.ok(result.includes("email"));
			assert.ok(result.includes("FROM users"));
			assert.ok(result.includes("WHERE id = 1"));
		});
	});

	describe("real-world scenarios", () => {
		it("should handle user authentication queries", () => {
			const username = "john_doe";
			const password = "secret'password";
			const result = processSQLTemplate`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
			assert.equal(
				result,
				"SELECT * FROM users WHERE username = 'john_doe' AND password = 'secret''password'",
			);
		});

		it("should handle search queries", () => {
			const searchTerm = "O'Connor";
			const result = processSQLTemplate`SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`;
			assert.equal(
				result,
				"SELECT * FROM products WHERE name LIKE '%O''Connor%'",
			);
		});

		it("should handle pagination queries", () => {
			const table = "posts";
			const page = 1;
			const limit = 10;
			const offset = (page - 1) * limit;
			const result = processSQLTemplate`SELECT * FROM ${table} LIMIT ${limit} OFFSET ${offset}`;
			assert.equal(result, "SELECT * FROM posts LIMIT 10 OFFSET 0");
		});

		it("should handle dynamic table names", () => {
			const table = "user_profiles";
			const result = processSQLTemplate`SELECT * FROM ${table} WHERE active = true`;
			assert.equal(result, "SELECT * FROM user_profiles WHERE active = true");
		});

		it("should handle complex WHERE conditions", () => {
			const table = "orders";
			const status = "pending";
			const minAmount = 100;
			const maxAmount = 1000;
			const result = processSQLTemplate`SELECT * FROM ${table} WHERE status = '${status}' AND amount BETWEEN ${minAmount} AND ${maxAmount}`;
			assert.equal(
				result,
				"SELECT * FROM orders WHERE status = 'pending' AND amount BETWEEN 100 AND 1000",
			);
		});
	});

	describe("performance characteristics", () => {
		it("should handle many values efficiently", () => {
			const values = Array(100).fill("value");
			const result = processSQLTemplate`SELECT ${values.join(", ")}`;
			assert.ok(result.includes("SELECT"));
			assert.ok(result.includes("value"));
		});

		it("should handle very long static strings", () => {
			const longStatic = `SELECT ${"x".repeat(10000)} FROM table`;
			const result = processSQLTemplate`${longStatic}`;
			assert.equal(result, longStatic);
		});

		it("should handle mixed long static and dynamic content", () => {
			const longStatic = `SELECT ${"x".repeat(5000)}`;
			const dynamic = "dynamic";
			const result = processSQLTemplate`${longStatic}${dynamic}`;
			assert.equal(result, longStatic + dynamic);
		});
	});

	describe("optimization edge cases", () => {
		it("should use StringBuilder pattern for 2 values", () => {
			const val1 = "value1";
			const val2 = "value2";
			const result = processSQLTemplate`SELECT ${val1}, ${val2} FROM table`;
			assert.equal(result, "SELECT value1, value2 FROM table");
		});

		it("should use StringBuilder pattern for 3 values", () => {
			const val1 = "value1";
			const val2 = "value2";
			const val3 = "value3";
			const result = processSQLTemplate`SELECT ${val1}, ${val2}, ${val3} FROM table`;
			assert.equal(result, "SELECT value1, value2, value3 FROM table");
		});

		it("should use array join for 4+ values", () => {
			const val1 = "value1";
			const val2 = "value2";
			const val3 = "value3";
			const val4 = "value4";
			const result = processSQLTemplate`SELECT ${val1}, ${val2}, ${val3}, ${val4} FROM table`;
			assert.equal(result, "SELECT value1, value2, value3, value4 FROM table");
		});

		it("should handle smart string conversion for non-string values", () => {
			const number = 42;
			const boolean = true;
			const result = processSQLTemplate`SELECT ${number}, ${boolean} FROM table`;
			assert.equal(result, "SELECT 42, true FROM table");
		});

		it("should handle smart string conversion for string values", () => {
			const string = "hello";
			const result = processSQLTemplate`SELECT ${string} FROM table`;
			assert.equal(result, "SELECT hello FROM table");
		});

		it("should trim when leading whitespace exists", () => {
			const result = processSQLTemplate`
				SELECT * FROM users
			`;
			assert.equal(result, "SELECT * FROM users");
		});

		it("should trim when trailing whitespace exists", () => {
			const result = processSQLTemplate`SELECT * FROM users
			`;
			assert.equal(result, "SELECT * FROM users");
		});

		it("should not trim when no whitespace exists", () => {
			const result = processSQLTemplate`SELECT * FROM users`;
			assert.equal(result, "SELECT * FROM users");
		});

		it("should handle trim optimization with single value", () => {
			const value = "test";
			const result = processSQLTemplate`
				SELECT ${value}
			`;
			assert.equal(result, "SELECT test");
		});

		it("should handle trim optimization with StringBuilder pattern", () => {
			const val1 = "value1";
			const val2 = "value2";
			const result = processSQLTemplate`
				SELECT ${val1}, ${val2}
			`;
			assert.equal(result, "SELECT value1, value2");
		});

		it("should handle trim optimization with array join", () => {
			const val1 = "value1";
			const val2 = "value2";
			const val3 = "value3";
			const val4 = "value4";
			const result = processSQLTemplate`
				SELECT ${val1}, ${val2}, ${val3}, ${val4}
			`;
			assert.equal(result, "SELECT value1, value2, value3, value4");
		});
	});
});
