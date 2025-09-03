/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for data type codecs
 */

import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
	createDecoderMap,
	decodeBigInt,
	decodeBoolean,
	decodeDate,
	decodeJson,
	normalizeType,
} from "./codecs.js";

describe("normalizeType", () => {
	it("normalizes PostgreSQL types", () => {
		strictEqual(normalizeType("int4", "pg"), "integer");
		strictEqual(normalizeType("int8", "pg"), "bigint");
		strictEqual(normalizeType("varchar", "pg"), "string");
		strictEqual(normalizeType("timestamptz", "pg"), "timestamp");
	});

	it("normalizes MySQL types", () => {
		strictEqual(normalizeType("int", "mysql"), "integer");
		strictEqual(normalizeType("bigint", "mysql"), "bigint");
		strictEqual(normalizeType("varchar", "mysql"), "string");
		strictEqual(normalizeType("datetime", "mysql"), "timestamp");
	});

	it("normalizes SQLite types", () => {
		strictEqual(normalizeType("INTEGER", "sqlite-node"), "integer");
		strictEqual(normalizeType("TEXT", "sqlite-wasm"), "string");
		strictEqual(normalizeType("REAL", "sqlite-node"), "float");
	});
});

describe("decodeBigInt", () => {
	it("decodes bigint values correctly", () => {
		strictEqual(decodeBigInt("123", { bigintMode: "bigint" }), 123n);
		strictEqual(decodeBigInt("123", { bigintMode: "string" }), "123");
		strictEqual(decodeBigInt("123", {}), 123n); // Default to bigint
	});

	it("handles null values", () => {
		strictEqual(decodeBigInt(null, {}), null);
		strictEqual(decodeBigInt(undefined, {}), null);
	});
});

describe("decodeBoolean", () => {
	it("decodes various boolean representations", () => {
		strictEqual(decodeBoolean("t"), true);
		strictEqual(decodeBoolean("f"), false);
		strictEqual(decodeBoolean("true"), true);
		strictEqual(decodeBoolean("false"), false);
		strictEqual(decodeBoolean(1), true);
		strictEqual(decodeBoolean(0), false);
	});

	it("handles null values", () => {
		strictEqual(decodeBoolean(null), null);
		strictEqual(decodeBoolean(undefined), null);
	});
});

describe("decodeDate", () => {
	it("decodes date strings", () => {
		const dateStr = "2023-01-01T12:00:00.000Z";
		const decoded = decodeDate(dateStr, { dateMode: "date" });
		ok(decoded instanceof Date);
		strictEqual(decoded.toISOString(), dateStr);
	});

	it("keeps strings when dateMode is string", () => {
		const dateStr = "2023-01-01T12:00:00.000Z";
		const decoded = decodeDate(dateStr, { dateMode: "string" });
		strictEqual(decoded, dateStr);
	});

	it("handles null values", () => {
		strictEqual(decodeDate(null, {}), null);
	});
});

describe("decodeJson", () => {
	it("parses JSON when jsonMode is object", () => {
		const jsonStr = '{"name":"test","value":123}';
		const decoded = decodeJson(jsonStr, { jsonMode: "object" });
		deepStrictEqual(decoded, { name: "test", value: 123 });
	});

	it("keeps string when jsonMode is string", () => {
		const jsonStr = '{"name":"test"}';
		const decoded = decodeJson(jsonStr, { jsonMode: "string" });
		strictEqual(decoded, jsonStr);
	});

	it("handles invalid JSON gracefully", () => {
		const invalidJson = "{invalid json}";
		const decoded = decodeJson(invalidJson, { jsonMode: "object" });
		strictEqual(decoded, invalidJson); // Falls back to string
	});
});

describe("createDecoderMap", () => {
	it("creates decoder map for columns", () => {
		const columns = [
			{ name: "id", type: "int4" },
			{ name: "name", type: "varchar" },
			{ name: "created_at", type: "timestamptz" },
		];

		const decoders = createDecoderMap(columns, "pg", {});

		strictEqual(typeof decoders.get("id"), "function");
		strictEqual(typeof decoders.get("name"), "function");
		strictEqual(typeof decoders.get("created_at"), "function");
	});

	it("handles unknown types gracefully", () => {
		const columns = [{ name: "unknown_col", type: "unknown_type" }];
		const decoders = createDecoderMap(columns, "pg", {});

		const decoder = decoders.get("unknown_col");
		strictEqual(typeof decoder, "function");
		strictEqual(decoder("test"), "test"); // Should pass through
	});
});
