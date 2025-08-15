import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { stringify } from "./stringify.js";

describe("stringify", () => {
	describe("primitive values", () => {
		it("should stringify strings", () => {
			assert.equal(stringify("hello"), "hello");
			assert.equal(stringify(""), "");
			assert.equal(stringify("123"), "123");
		});

		it("should stringify numbers", () => {
			assert.equal(stringify(42), "42");
			assert.equal(stringify(0), "0");
			assert.equal(stringify(-1), "-1");
			assert.equal(stringify(3.14), "3.14");
			assert.equal(stringify(Infinity), "Infinity");
			assert.equal(stringify(-Infinity), "-Infinity");
			assert.equal(stringify(NaN), "NaN");
		});

		it("should stringify booleans", () => {
			assert.equal(stringify(true), "true");
			assert.equal(stringify(false), "false");
		});

		it("should stringify null and undefined", () => {
			assert.equal(stringify(null), "null");
			assert.equal(stringify(undefined), "undefined");
		});

		it("should stringify symbols", () => {
			const sym = Symbol("test");
			assert.equal(stringify(sym), "Symbol(test)");
		});

		it("should stringify bigints", () => {
			assert.equal(stringify(123n), "123");
			assert.equal(stringify(BigInt(456)), "456");
		});
	});

	describe("arrays", () => {
		it("should join array elements with empty string", () => {
			assert.equal(stringify([1, 2, 3]), "123");
			assert.equal(stringify(["a", "b", "c"]), "abc");
			assert.equal(stringify([1, "hello", true]), "1hellotrue");
		});

		it("should handle empty arrays", () => {
			assert.equal(stringify([]), "");
		});

		it("should handle arrays with single element", () => {
			assert.equal(stringify([42]), "42");
			assert.equal(stringify(["hello"]), "hello");
		});

		it("should handle nested arrays", () => {
			assert.equal(
				stringify([
					[1, 2],
					[3, 4],
				]),
				"1,23,4",
			);
			assert.equal(stringify([["a"], ["b"]]), "ab");
		});

		it("should handle arrays with mixed types", () => {
			assert.equal(
				stringify([1, "hello", true, null, undefined]),
				"1hellotrue",
			);
		});

		it("should handle arrays with objects", () => {
			assert.equal(
				stringify([{ key: "value" }, "test"]),
				"[object Object]test",
			);
		});

		it("should handle arrays with functions", () => {
			const func = () => "test";
			assert.equal(stringify([func, "hello"]), '() => "test"hello');
		});

		it("should handle sparse arrays", () => {
			const sparse = [];
			sparse[0] = "first";
			sparse[2] = "third";
			assert.equal(stringify(sparse), "firstthird");
		});

		it("should handle arrays with holes", () => {
			const arrayWithHoles = [1];
			arrayWithHoles[2] = 3;
			assert.equal(stringify(arrayWithHoles), "13");
		});
	});

	describe("objects", () => {
		it("should stringify plain objects", () => {
			assert.equal(stringify({ key: "value" }), "[object Object]");
			assert.equal(stringify({}), "[object Object]");
		});

		it("should stringify objects with custom toString", () => {
			const obj = {
				toString() {
					return "custom string";
				},
			};
			assert.equal(stringify(obj), "custom string");
		});

		it("should stringify Date objects", () => {
			const date = new Date("2023-01-01T00:00:00.000Z");
			assert.equal(stringify(date), date.toString());
		});

		it("should stringify RegExp objects", () => {
			const regex = /test/g;
			assert.equal(stringify(regex), "/test/g");
		});

		it("should stringify Error objects", () => {
			const error = new Error("test error");
			assert.equal(stringify(error), error.toString());
		});
	});

	describe("functions", () => {
		it("should stringify function declarations", () => {
			function testFunc() {
				return "test";
			}
			assert.equal(stringify(testFunc), testFunc.toString());
		});

		it("should stringify arrow functions", () => {
			const arrowFunc = () => "test";
			assert.equal(stringify(arrowFunc), '() => "test"');
		});

		it("should stringify function expressions", () => {
			const funcExpr = () => "test";
			assert.equal(stringify(funcExpr), funcExpr.toString());
		});

		it("should stringify functions with parameters", () => {
			const funcWithParams = (a, b) => a + b;
			assert.equal(stringify(funcWithParams), "(a, b) => a + b");
		});
	});

	describe("edge cases", () => {
		it("should handle very large arrays", () => {
			const largeArray = Array(1000).fill("a");
			const result = stringify(largeArray);
			assert.equal(result, "a".repeat(1000));
		});

		it("should handle arrays with very long strings", () => {
			const longString = "x".repeat(1000);
			const result = stringify([longString, "short"]);
			assert.equal(result, `${longString}short`);
		});

		it("should handle circular references in objects", () => {
			const circular = {};
			circular.self = circular;
			assert.equal(stringify(circular), "[object Object]");
		});

		it("should handle circular references in arrays", () => {
			const circular = [];
			circular[0] = circular;
			assert.equal(stringify(circular), "");
		});

		it("should handle objects with null prototype", () => {
			const obj = Object.create(null);
			obj.key = "value";
			// This will throw an error because objects with null prototype can't be converted to string
			assert.throws(() => stringify(obj), TypeError);
		});

		it("should handle objects with custom prototype", () => {
			const proto = { toString: () => "custom" };
			const obj = Object.create(proto);
			assert.equal(stringify(obj), "custom");
		});
	});

	describe("special values", () => {
		it("should handle zero values", () => {
			assert.equal(stringify(0), "0");
			assert.equal(stringify(-0), "0");
		});

		it("should handle empty strings", () => {
			assert.equal(stringify(""), "");
		});

		it("should handle whitespace strings", () => {
			assert.equal(stringify(" "), " ");
			assert.equal(stringify("\t\n"), "\t\n");
		});

		it("should handle unicode strings", () => {
			assert.equal(stringify("🚀"), "🚀");
			assert.equal(stringify("café"), "café");
		});
	});

	describe("performance characteristics", () => {
		it("should handle many nested levels efficiently", () => {
			let deepArray = ["deepest"];
			for (let i = 0; i < 100; i++) {
				deepArray = [deepArray];
			}
			const result = stringify(deepArray);
			assert.equal(result, "deepest");
		});

		it("should handle wide arrays efficiently", () => {
			const wideArray = Array(1000).fill("item");
			const result = stringify(wideArray);
			assert.equal(result, "item".repeat(1000));
		});
	});
});
