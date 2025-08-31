import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { processSQLTemplate } from "./template-processor.js";

// Helper to create template strings array for testing
const createTemplate = (strings, ...values) => {
	const stringsArray = strings.slice();
	stringsArray.raw = strings.slice();
	return processSQLTemplate(stringsArray, ...values);
};

describe("processSQLTemplate", () => {
	it("handles zero interpolations (tier 1)", () => {
		const result = createTemplate(["SELECT * FROM users"]);
		assert.equal(result, "SELECT * FROM users");
	});

	it("trims whitespace on zero interpolations when needed", () => {
		const result = createTemplate(["  SELECT * FROM users  "]);
		assert.equal(result, "SELECT * FROM users");
	});

	it("skips trim on zero interpolations when not needed", () => {
		const result = createTemplate(["SELECT * FROM users"]);
		assert.equal(result, "SELECT * FROM users");
	});

	it("handles single interpolation (tier 2)", () => {
		const result = createTemplate(["SELECT * FROM ", ""], "users");
		assert.equal(result, "SELECT * FROM users");
	});

	it("escapes values in single interpolation", () => {
		const result = createTemplate(
			["SELECT * FROM ", " WHERE name = 'test'"],
			"table'name",
		);
		assert.equal(result, "SELECT * FROM table''name WHERE name = 'test'");
	});

	it("trims whitespace on single interpolation", () => {
		const result = createTemplate(["  SELECT * FROM ", "  "], "users");
		assert.equal(result, "SELECT * FROM users");
	});

	it("handles two interpolations (tier 3)", () => {
		const result = createTemplate(
			["SELECT * FROM ", " WHERE id = ", ""],
			"users",
			123,
		);
		assert.equal(result, "SELECT * FROM users WHERE id = 123");
	});

	it("handles three interpolations (tier 3)", () => {
		const result = createTemplate(
			["SELECT ", " FROM ", " WHERE id = ", ""],
			"name",
			"users",
			123,
		);
		assert.equal(result, "SELECT name FROM users WHERE id = 123");
	});

	it("escapes values in multiple interpolations", () => {
		const result = createTemplate(
			["SELECT * FROM ", " WHERE name = '", "'"],
			"users",
			"O'Connor",
		);
		assert.equal(result, "SELECT * FROM users WHERE name = 'O''Connor'");
	});

	it("handles four or more interpolations (tier 4)", () => {
		const result = createTemplate(
			["INSERT INTO ", " (", ", ", ", ", ") VALUES (1)"],
			"users",
			"name",
			"email",
			"status",
		);
		assert.equal(result, "INSERT INTO users (name, email, status) VALUES (1)");
	});

	it("handles many interpolations efficiently", () => {
		const values = new Array(10).fill().map((_, i) => `col${i}`);
		const strings = ["SELECT "];
		for (let i = 0; i < values.length; i++) {
			strings.push(i === values.length - 1 ? " FROM table" : ", ");
		}

		const result = createTemplate(strings, ...values);
		assert(result.includes("SELECT col0, col1, col2"));
		assert(result.includes("FROM table"));
	});

	it("converts non-string values to strings", () => {
		const result = createTemplate(
			["SELECT * FROM users WHERE id = ", " AND active = ", ""],
			123,
			true,
		);
		assert.equal(
			result,
			"SELECT * FROM users WHERE id = 123 AND active = true",
		);
	});

	it("handles null and undefined values", () => {
		const result = createTemplate(
			["SELECT * FROM users WHERE name = '", "' OR email = '", "'"],
			null,
			undefined,
		);
		assert.equal(
			result,
			"SELECT * FROM users WHERE name = 'null' OR email = 'undefined'",
		);
	});

	it("handles complex SQL injection attempts", () => {
		const result = createTemplate(
			["SELECT * FROM users WHERE name = '", "'"],
			"'; DROP TABLE users; --",
		);
		assert.equal(
			result,
			"SELECT * FROM users WHERE name = '''; DROP TABLE users; --'",
		);
	});

	it("handles arrays and objects", () => {
		const result = createTemplate(
			["SELECT * FROM ", " WHERE data = '", "'"],
			["users", "posts"],
			{ type: "admin" },
		);
		assert.equal(
			result,
			"SELECT * FROM users,posts WHERE data = '[object Object]'",
		);
	});

	it("handles mixed escape characters", () => {
		const dangerous = "test'\\\n\r\0\x1a";
		const result = createTemplate(["SELECT '", "'"], dangerous);
		assert.equal(result, "SELECT 'test''\\\\\\n\\r\\0\\Z'");
	});

	it("handles empty strings", () => {
		const result = createTemplate(["SELECT '", "'"], "");
		assert.equal(result, "SELECT ''");
	});

	it("maintains performance for large queries", () => {
		const largeParts = new Array(100).fill("part");
		const strings = new Array(largeParts.length + 1).fill(", ");
		strings[0] = "SELECT ";
		strings[strings.length - 1] = " FROM table";

		const result = createTemplate(strings, ...largeParts);
		assert(result.includes("SELECT part"));
		assert(result.includes("FROM table"));
	});

	it("handles edge case: single character interpolations", () => {
		const result = createTemplate(["a", "b", "c"], "X", "Y");
		assert.equal(result, "aXbYc");
	});

	it("preserves internal whitespace", () => {
		const result = createTemplate(
			["SELECT   *   FROM   ", "   WHERE   id   =   ", ""],
			"users",
			123,
		);
		assert.equal(result, "SELECT   *   FROM   users   WHERE   id   =   123");
	});

	it("handles all performance tiers consistently", () => {
		const base = "SELECT * FROM table";

		// Tier 1: 0 values
		assert.equal(createTemplate([base]), base);

		// Tier 2: 1 value
		assert.equal(createTemplate([base, ""], ""), base);

		// Tier 3: 2 values
		assert.equal(createTemplate([base, "", ""], "", ""), base);

		// Tier 4: 4 values
		assert.equal(createTemplate([base, "", "", "", ""], "", "", "", ""), base);
	});
});
