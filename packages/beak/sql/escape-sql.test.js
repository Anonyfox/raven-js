import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { escapeSql } from "./escape-sql.js";

describe("escapeSql", () => {
	it("escapes single quotes", () => {
		assert.equal(escapeSql("O'Connor"), "O''Connor");
		assert.equal(escapeSql("'quoted'"), "''quoted''");
		assert.equal(escapeSql("multiple'quotes'here"), "multiple''quotes''here");
	});

	it("escapes backslashes", () => {
		assert.equal(escapeSql("path\\to\\file"), "path\\\\to\\\\file");
		assert.equal(escapeSql("\\start"), "\\\\start");
		assert.equal(escapeSql("end\\"), "end\\\\");
	});

	it("escapes null bytes", () => {
		assert.equal(escapeSql("test\0null"), "test\\0null");
		assert.equal(escapeSql("\0start"), "\\0start");
	});

	it("escapes newlines", () => {
		assert.equal(escapeSql("line1\nline2"), "line1\\nline2");
		assert.equal(escapeSql("multi\n\nlines"), "multi\\n\\nlines");
	});

	it("escapes carriage returns", () => {
		assert.equal(escapeSql("windows\r\nlines"), "windows\\r\\nlines");
		assert.equal(escapeSql("mac\rlines"), "mac\\rlines");
	});

	it("escapes EOF/Ctrl+Z characters", () => {
		assert.equal(escapeSql("text\x1amore"), "text\\Zmore");
		assert.equal(escapeSql("\x1a"), "\\Z");
	});

	it("handles strings without special characters", () => {
		assert.equal(escapeSql("normal text"), "normal text");
		assert.equal(escapeSql("123456"), "123456");
		assert.equal(escapeSql(""), "");
	});

	it("handles multiple escape characters together", () => {
		assert.equal(escapeSql("'\\\n\r\0\x1a"), "''\\\\\\n\\r\\0\\Z");
	});

	it("handles type coercion", () => {
		assert.equal(escapeSql(42), "42");
		assert.equal(escapeSql(null), "null");
		assert.equal(escapeSql(undefined), "undefined");
		assert.equal(escapeSql(true), "true");
		assert.equal(escapeSql(false), "false");
	});

	it("handles objects and arrays", () => {
		assert.equal(escapeSql(["a", "b"]), "a,b");
		assert.equal(escapeSql({ toString: () => "custom" }), "custom");
	});

	it("handles SQL injection attempts", () => {
		const injection = "'; DROP TABLE users; --";
		const expected = "''; DROP TABLE users; --";
		assert.equal(escapeSql(injection), expected);
	});

	it("handles complex injection with multiple escape chars", () => {
		const injection = "admin'/*\0*/UNION/*\n*/SELECT/*\r*/password--";
		const expected = "admin''/*\\0*/UNION/*\\n*/SELECT/*\\r*/password--";
		assert.equal(escapeSql(injection), expected);
	});

	it("handles zero-length string", () => {
		assert.equal(escapeSql(""), "");
	});

	it("handles string with only escape characters", () => {
		assert.equal(escapeSql("'\\\n\r\0\x1a"), "''\\\\\\n\\r\\0\\Z");
	});

	it("performance test: large string with no escapes", () => {
		const largeString = "a".repeat(10000);
		assert.equal(escapeSql(largeString), largeString);
	});

	it("performance test: large string with many escapes", () => {
		const manyQuotes = "'".repeat(1000);
		const expected = "''".repeat(1000);
		assert.equal(escapeSql(manyQuotes), expected);
	});
});
