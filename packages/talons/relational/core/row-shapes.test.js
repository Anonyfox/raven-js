/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for row shaping utilities
 */

import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
	createRowShaper,
	createStreamingRowShaper,
	mergeResults,
	sanitizeColumnName,
} from "./row-shapes.js";

describe("sanitizeColumnName", () => {
	it("sanitizes column names", () => {
		strictEqual(sanitizeColumnName("user_name"), "user_name");
		strictEqual(sanitizeColumnName("user-name"), "user_name");
		strictEqual(sanitizeColumnName("user name"), "user_name");
		strictEqual(sanitizeColumnName("123name"), "_123name");
		strictEqual(sanitizeColumnName(""), "_");
	});

	it("handles special characters", () => {
		strictEqual(sanitizeColumnName("user@name"), "user_name");
		strictEqual(sanitizeColumnName("user.name"), "user_name");
		strictEqual(sanitizeColumnName("user$name"), "user_name");
	});
});

describe("createRowShaper", () => {
	it("creates object shaper by default", () => {
		const columns = [
			{ name: "id", type: "integer" },
			{ name: "name", type: "string" },
		];
		const decoders = new Map([
			["id", (val) => val],
			["name", (val) => val],
		]);

		const shaper = createRowShaper(columns, {}, "pg", decoders);
		const result = shaper.createResult([[1, "John"]], 1);

		deepStrictEqual(result, {
			rows: [{ id: 1, name: "John" }],
			rowCount: 1,
			columns,
		});
	});

	it("creates array shaper when specified", () => {
		const columns = [
			{ name: "id", type: "integer" },
			{ name: "name", type: "string" },
		];
		const decoders = new Map([
			["id", (val) => val],
			["name", (val) => val],
		]);

		const shaper = createRowShaper(
			columns,
			{ rowMode: "array" },
			"pg",
			decoders,
		);
		const result = shaper.createResult([[1, "John"]], 1);

		deepStrictEqual(result, {
			rows: [[1, "John"]],
			rowCount: 1,
			columns,
		});
	});

	it("applies decoders to values", () => {
		const columns = [{ name: "count", type: "bigint" }];
		const decoders = new Map([["count", (val) => BigInt(val)]]);

		const shaper = createRowShaper(columns, {}, "pg", decoders);
		const result = shaper.createResult([["123"]], 1);

		deepStrictEqual(result, {
			rows: [{ count: 123n }],
			rowCount: 1,
			columns,
		});
	});

	it("handles null values", () => {
		const columns = [{ name: "optional", type: "string" }];
		const decoders = new Map([["optional", (val) => val]]);

		const shaper = createRowShaper(columns, {}, "pg", decoders);
		const result = shaper.createResult([[null]], 1);

		deepStrictEqual(result, {
			rows: [{ optional: null }],
			rowCount: 1,
			columns,
		});
	});
});

describe("createStreamingRowShaper", () => {
	it("creates streaming transformer", async () => {
		const columns = [{ name: "id", type: "integer" }];
		const decoders = new Map([["id", (val) => val]]);
		const baseShaper = createRowShaper(columns, {}, "pg", decoders);

		const streamShaper = createStreamingRowShaper(baseShaper);

		strictEqual(typeof streamShaper.transform, "function");
	});

	it("transforms streaming data", async () => {
		const columns = [{ name: "id", type: "integer" }];
		const decoders = new Map([["id", (val) => val]]);
		const baseShaper = createRowShaper(columns, {}, "pg", decoders);
		const streamShaper = createStreamingRowShaper(baseShaper);

		// Mock stream
		const mockStream = {
			async *[Symbol.asyncIterator]() {
				yield [1];
				yield [2];
				yield [3];
			},
		};

		const results = [];
		for await (const row of streamShaper.transform(mockStream)) {
			results.push(row);
		}

		deepStrictEqual(results, [{ id: 1 }, { id: 2 }, { id: 3 }]);
	});
});

describe("mergeResults", () => {
	it("merges multiple result sets", () => {
		const result1 = {
			rows: [{ id: 1 }, { id: 2 }],
			rowCount: 2,
			columns: [{ name: "id", type: "integer" }],
		};

		const result2 = {
			rows: [{ id: 3 }, { id: 4 }],
			rowCount: 2,
			columns: [{ name: "id", type: "integer" }],
		};

		const merged = mergeResults([result1, result2]);

		deepStrictEqual(merged, {
			rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
			rowCount: 4,
			columns: [{ name: "id", type: "integer" }],
		});
	});

	it("handles empty results", () => {
		const merged = mergeResults([]);

		deepStrictEqual(merged, {
			rows: [],
			rowCount: 0,
			columns: [],
		});
	});
});
