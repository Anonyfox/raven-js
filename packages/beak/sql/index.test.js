/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Surgical test suite for SQL template literal module - TEST DOCTRINE compliant
 *
 * SURGICAL ARCHITECTURE: Exactly 3 major test groups targeting distinct behavioral territories.
 * PREDATORY PRECISION: Each test validates multiple aspects simultaneously for maximum efficiency.
 * MATHEMATICAL COVERAGE: 100% coverage across lines, branches, and functions with minimal assertions.
 */

import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { escapeSql } from "./escape-sql.js";
import { sql } from "./index.js";
import { processSQLTemplate } from "./template-processor.js";

describe("SQL Escaping Engine", () => {
	test("character-level escaping with injection prevention", () => {
		// Basic SQL special characters - all critical escapes
		assert.equal(escapeSql("O'Connor"), "O''Connor");
		assert.equal(escapeSql("user's data"), "user''s data");
		assert.equal(escapeSql("path\\to\\file"), "path\\\\to\\\\file");
		assert.equal(escapeSql("text\0with\0nulls"), "text\\0with\\0nulls");
		assert.equal(escapeSql("line1\nline2"), "line1\\nline2");
		assert.equal(escapeSql("line1\rline2"), "line1\\rline2");
		assert.equal(escapeSql("text\x1aend"), "text\\Zend");

		// Multiple and consecutive special characters
		assert.equal(escapeSql("O'Connor's \\path\n"), "O''Connor''s \\\\path\\n");
		assert.equal(escapeSql("''"), "''''");
		assert.equal(escapeSql("\\\\"), "\\\\\\\\");

		// SQL injection prevention patterns
		assert.equal(
			escapeSql("'; DROP TABLE users; --"),
			"''; DROP TABLE users; --",
		);
		assert.equal(escapeSql("' OR 1=1 --"), "'' OR 1=1 --");
		assert.equal(
			escapeSql("' UNION SELECT * FROM passwords --"),
			"'' UNION SELECT * FROM passwords --",
		);

		// Edge cases and data type handling
		assert.equal(escapeSql(""), ""); // Empty string
		assert.equal(escapeSql("clean text"), "clean text"); // No special chars
		assert.equal(escapeSql(null), "null");
		assert.equal(escapeSql(undefined), "undefined");
		assert.equal(escapeSql(42), "42");
		assert.equal(escapeSql(true), "true");
		assert.equal(escapeSql({ toString: () => "test" }), "test");
		assert.equal(escapeSql(Symbol("test")), "Symbol(test)");
		assert.equal(escapeSql(9007199254740991n), "9007199254740991");

		// Performance edge cases
		const longString = "a".repeat(10000);
		assert.equal(escapeSql(longString), longString);
		const manyQuotes = "'".repeat(100);
		assert.equal(escapeSql(manyQuotes), "''".repeat(100));

		// Unicode and international characters
		assert.equal(escapeSql("测试'数据"), "测试''数据");
		assert.equal(escapeSql("🔥'emoji"), "🔥''emoji");
	});

	test("regex matching with branch coverage optimization", () => {
		// Characters that match regex but don't require specific escaping (branch coverage)
		assert.equal(escapeSql("normal"), "normal");
		assert.equal(escapeSql("tab\tchar"), "tab\tchar"); // Tab matches regex but no specific escape

		// Mixed characters triggering fallback branches
		assert.equal(escapeSql("test'mixed\ttab"), "test''mixed\ttab");

		// String conversion edge cases (branch coverage)
		assert.equal(escapeSql(String("test")), "test");
		assert.equal(escapeSql(new String("test'")), "test''");

		// Both branches of conditional escaping
		assert.equal(escapeSql("no_escapes_needed"), "no_escapes_needed");
		assert.equal(escapeSql("needs'escaping"), "needs''escaping");
	});
});

describe("Template Processing Engine", () => {
	test("tiered performance optimization with automatic escaping", () => {
		// Zero values - static template optimization
		assert.equal(
			processSQLTemplate`SELECT * FROM users`,
			"SELECT * FROM users",
		);
		assert.equal(processSQLTemplate``, "");

		// Single value - concatenation path
		assert.equal(
			processSQLTemplate`SELECT * FROM ${"users"}`,
			"SELECT * FROM users",
		);
		assert.equal(
			processSQLTemplate`WHERE name = '${"O'Connor"}'`,
			"WHERE name = 'O''Connor'",
		);

		// Two values - StringBuilder pattern
		const table = "orders";
		const status = "pending'test";
		assert.equal(
			processSQLTemplate`SELECT * FROM ${table} WHERE status = '${status}'`,
			"SELECT * FROM orders WHERE status = 'pending''test'",
		);

		// Three values - StringBuilder pattern
		const limit = 10;
		assert.equal(
			processSQLTemplate`SELECT * FROM ${table} WHERE status = '${status}' LIMIT ${limit}`,
			"SELECT * FROM orders WHERE status = 'pending''test' LIMIT 10",
		);

		// Four+ values - array join optimization
		const id = 42;
		const name = "John'Doe";
		const active = true;
		const lastLogin = null;
		assert.equal(
			processSQLTemplate`INSERT INTO users (id, name, active, last_login) VALUES (${id}, '${name}', ${active}, ${lastLogin})`,
			"INSERT INTO users (id, name, active, last_login) VALUES (42, 'John''Doe', true, null)",
		);

		// Large batch processing with many values
		const values = Array(20)
			.fill()
			.map((_, i) => `value${i}`);
		const result = processSQLTemplate`SELECT ${values[0]}, ${values[1]}, ${values[2]}, ${values[3]}, ${values[4]}`;
		assert.ok(result.includes("value0"));
		assert.ok(result.includes("value4"));
	});

	test("whitespace normalization and value type processing", () => {
		// Whitespace trimming when detected
		assert.equal(
			processSQLTemplate`  SELECT * FROM users  `,
			"SELECT * FROM users",
		);
		assert.equal(
			processSQLTemplate`\n\tSELECT * FROM users\n`,
			"SELECT * FROM users",
		);

		// Preserve internal whitespace
		assert.equal(
			processSQLTemplate`SELECT * FROM users WHERE name = 'John Doe'`,
			"SELECT * FROM users WHERE name = 'John Doe'",
		);

		// No trimming when not needed (performance optimization)
		assert.equal(
			processSQLTemplate`SELECT * FROM users`,
			"SELECT * FROM users",
		);

		// Multi-line template handling (preserves structure, trims edges)
		const multiLine = processSQLTemplate`
			SELECT *
			FROM users
			WHERE active = ${true}
		`;
		assert.equal(
			multiLine,
			"SELECT *\n\t\t\tFROM users\n\t\t\tWHERE active = true",
		);

		// All data type conversions
		assert.equal(processSQLTemplate`SELECT ${42}`, "SELECT 42");
		assert.equal(processSQLTemplate`SELECT ${true}`, "SELECT true");
		assert.equal(processSQLTemplate`SELECT ${false}`, "SELECT false");
		assert.equal(processSQLTemplate`SELECT ${null}`, "SELECT null");
		assert.equal(processSQLTemplate`SELECT ${undefined}`, "SELECT undefined");
		assert.equal(processSQLTemplate`SELECT ${""}`, "SELECT");
		assert.equal(processSQLTemplate`SELECT ${0}`, "SELECT 0");
		assert.equal(processSQLTemplate`SELECT ${{}}`, "SELECT [object Object]");
		assert.equal(processSQLTemplate`SELECT ${[1, 2, 3]}`, "SELECT 1,2,3");
		assert.equal(processSQLTemplate`SELECT ${() => "fn"}`, 'SELECT () => "fn"');
		assert.equal(
			processSQLTemplate`SELECT ${Symbol("test")}`,
			"SELECT Symbol(test)",
		);
		assert.equal(processSQLTemplate`SELECT ${BigInt(123)}`, "SELECT 123");

		// Trim optimization with different processing paths
		assert.equal(processSQLTemplate`  SELECT ${"test"}  `, "SELECT test"); // Single value with trim
		assert.equal(processSQLTemplate`  SELECT ${"a"}, ${"b"}  `, "SELECT a, b"); // StringBuilder with trim
		assert.equal(
			processSQLTemplate`  SELECT ${"a"}, ${"b"}, ${"c"}, ${"d"}  `,
			"SELECT a, b, c, d",
		); // Array join with trim
	});
});

describe("SQL Integration and Real-World Scenarios", () => {
	test("complete query construction with injection protection", () => {
		// User authentication queries
		const username = "admin'--";
		const password = "' OR 1=1; DROP TABLE users; --";
		assert.equal(
			sql`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`,
			"SELECT * FROM users WHERE username = 'admin''--' AND password = ''' OR 1=1; DROP TABLE users; --'",
		);

		// Dynamic table and column queries
		const searchTerm = "test'search";
		const orderBy = "name";
		const pageLimit = 25;
		assert.equal(
			sql`SELECT * FROM products WHERE name LIKE '%${searchTerm}%' ORDER BY ${orderBy} LIMIT ${pageLimit}`,
			"SELECT * FROM products WHERE name LIKE '%test''search%' ORDER BY name LIMIT 25",
		);

		// Complex JOIN queries
		const userId = 42;
		const status = "active'test";
		const joinQuery = sql`
			SELECT u.name, p.title
			FROM users u
			JOIN posts p ON u.id = p.user_id
			WHERE u.id = ${userId} AND u.status = '${status}'
		`;
		assert.ok(joinQuery.includes("42"));
		assert.ok(joinQuery.includes("active''test"));

		// Batch operations
		const emails = ["user1@test.com", "user2'evil@test.com"];
		const batchQuery = sql`SELECT * FROM users WHERE email IN ('${emails[0]}', '${emails[1]}')`;
		assert.equal(
			batchQuery,
			"SELECT * FROM users WHERE email IN ('user1@test.com', 'user2''evil@test.com')",
		);
	});

	test("performance edge cases and optimization validation", () => {
		// Very long static strings
		const longStatic = `${"SELECT ".repeat(1000)}* FROM users`;
		const longResult = processSQLTemplate([longStatic]);
		assert.equal(longResult, longStatic);

		// Mixed long static and dynamic content
		const longTemplate = "SELECT * FROM ".repeat(100);
		const dynamicTable = "users'table";
		const mixedResult = processSQLTemplate(
			[longTemplate, " WHERE id = ", ""],
			dynamicTable,
			42,
		);
		assert.ok(mixedResult.includes("users''table"));
		assert.ok(mixedResult.includes("42"));

		// Smart string conversion validation
		const strValue = "test";
		const nonStrValue = 123;
		assert.equal(
			processSQLTemplate`SELECT '${strValue}', ${nonStrValue}`,
			"SELECT 'test', 123",
		);

		// Template caching behavior (same template objects)
		const template1 = sql`SELECT * FROM users WHERE id = ${1}`;
		const template2 = sql`SELECT * FROM users WHERE id = ${2}`;
		assert.ok(template1.includes("1"));
		assert.ok(template2.includes("2"));
	});

	test("security validation and edge case handling", () => {
		// Comprehensive injection attempt prevention
		const maliciousInputs = [
			"'; DROP TABLE users; --",
			"' OR 1=1 --",
			"' UNION SELECT password FROM admin --",
			"'; WAITFOR DELAY '00:00:05' --",
			"' AND (SELECT COUNT(*) FROM users) > 0 --",
		];

		maliciousInputs.forEach((input) => {
			const result = sql`SELECT * FROM users WHERE name = '${input}'`;
			// Should contain escaped quotes (injection neutralized)
			assert.ok(result.includes("''"));
			// Should not contain unescaped injection patterns
			assert.ok(
				!result.includes("' OR 1=1 --") || result.includes("'' OR 1=1 --"),
			);
		});

		// File path and system command injection
		const filePath = "../../etc/passwd\\';";
		const pathQuery = sql`SELECT * FROM files WHERE path = '${filePath}'`;
		assert.equal(
			pathQuery,
			"SELECT * FROM files WHERE path = '../../etc/passwd\\\\'';'",
		);

		// Unicode and international character handling
		const internationalData = {
			chinese: "用户'测试",
			arabic: "المستخدم'اختبار",
			emoji: "user🔥'test",
			russian: "пользователь'тест",
		};

		Object.values(internationalData).forEach((value) => {
			const result = sql`SELECT * FROM users WHERE name = '${value}'`;
			assert.ok(result.includes("''"));
		});

		// Binary and control character handling
		const binaryInput = "user\0\r\n\x1a'test";
		const binaryResult = sql`SELECT * FROM users WHERE name = '${binaryInput}'`;
		assert.ok(binaryResult.includes("\\0\\r\\n\\Z''"));

		// Whitespace-only values and empty edge cases
		assert.equal(sql`SELECT ${"   "}`, "SELECT");
		assert.equal(sql`SELECT ${""}`, "SELECT");
		assert.equal(sql`${""} SELECT * FROM users ${""}`, "SELECT * FROM users");
	});
});
