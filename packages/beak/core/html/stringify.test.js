import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { stringify } from "./stringify.js";

describe("stringify", () => {
	describe("basic values", () => {
		it("should stringify strings", () => {
			assert.equal(stringify("hello"), "hello");
			assert.equal(stringify(""), "");
			assert.equal(stringify("🦜"), "🦜");
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

		it("should stringify objects", () => {
			assert.equal(stringify({ key: "value" }), "[object Object]");
			assert.equal(stringify({}), "[object Object]");
		});

		it("should stringify functions", () => {
			const func = () => {};
			const result = stringify(func);
			// Functions get converted to their string representation
			assert.ok(result.length > 0);
			assert.ok(typeof result === "string");
		});

		it("should stringify symbols", () => {
			const sym = Symbol("test");
			const result = stringify(sym);
			assert.ok(result.includes("Symbol"));
		});
	});

	describe("arrays", () => {
		it("should flatten and join simple arrays", () => {
			assert.equal(stringify([1, 2, 3]), "123");
			assert.equal(stringify(["a", "b", "c"]), "abc");
			assert.equal(stringify([1, "two", 3]), "1two3");
			assert.equal(stringify([]), "");
		});

		it("should handle nested arrays", () => {
			assert.equal(stringify([1, [2, 3], 4]), "1234");
			assert.equal(
				stringify([
					[1, 2],
					[3, 4],
				]),
				"1234",
			);
			assert.equal(stringify([1, [2, [3, 4]], 5]), "12345");
		});

		it("should handle deeply nested arrays", () => {
			assert.equal(stringify([1, [2, [3, [4, 5]]]]), "12345");
			assert.equal(stringify([[[[1]]]]), "1");
		});

		it("should handle mixed nested content", () => {
			assert.equal(
				stringify([1, [2, "hello"], [3, [4, "world"]]]),
				"12hello34world",
			);
			assert.equal(
				stringify(["a", [1, 2], "b", [true, false]]),
				"a12btruefalse",
			);
		});

		it("should handle arrays with falsy values", () => {
			assert.equal(
				stringify([null, undefined, false, 0, ""]),
				"nullundefinedfalse0",
			);
			assert.equal(stringify([1, null, 2, undefined, 3]), "1null2undefined3");
		});

		it("should handle arrays with objects and functions", () => {
			const obj = { key: "value" };
			const func = () => {};
			const result = stringify([1, obj, 2, func, 3]);
			assert.ok(result.includes("1"));
			assert.ok(result.includes("[object Object]"));
			assert.ok(result.includes("2"));
			assert.ok(result.includes("3"));
			assert.ok(typeof result === "string");
		});

		it("should handle sparse arrays", () => {
			const sparse = [1];
			sparse[2] = 3;
			assert.equal(stringify(sparse), "1undefined3");
		});

		it("should handle arrays with holes", () => {
			const arr = new Array(3);
			arr[0] = 1;
			arr[2] = 3;
			assert.equal(stringify(arr), "1undefined3");
		});
	});

	describe("edge cases", () => {
		it("should handle very large arrays", () => {
			const largeArray = Array.from({ length: 1000 }, (_, i) => i);
			const result = stringify(largeArray);
			assert.equal(result.length, 2890); // 1+2+3+...+999 = 499500, but we're stringifying each number
			assert.ok(result.includes("999"));
		});

		it("should handle circular references gracefully", () => {
			/** @type {Array<*>} */
			const circular = [];
			circular.push(circular);
			const result = stringify(circular);
			assert.equal(result, "[Circular]");
		});

		it("should handle nested circular references", () => {
			/** @type {Array<*>} */
			const outer = [];
			/** @type {Array<*>} */
			const inner = [];
			outer.push(inner);
			inner.push(outer);
			const result = stringify(outer);
			assert.equal(result, "[Circular]");
		});

		it("should handle complex circular reference scenarios", () => {
			/** @type {Array<*>} */
			const a = [];
			/** @type {Array<*>} */
			const b = [];
			/** @type {Array<*>} */
			const c = [];
			a.push(b);
			b.push(c);
			c.push(a);
			const result = stringify(a);
			assert.equal(result, "[Circular]");
		});

		it("should handle self-referencing arrays", () => {
			/** @type {Array<*>} */
			const selfRef = [];
			selfRef.push("hello");
			selfRef.push(selfRef);
			selfRef.push("world");
			const result = stringify(selfRef);
			assert.equal(result, "hello[Circular]world");
		});

		it("should handle nested self-referencing arrays", () => {
			/** @type {Array<*>} */
			const outer = [];
			/** @type {Array<*>} */
			const inner = [];
			outer.push("start");
			outer.push(inner);
			inner.push("middle");
			inner.push(outer);
			inner.push("end");
			const result = stringify(outer);
			assert.equal(result, "startmiddle[Circular]end");
		});

		it("should handle arrays with very long strings", () => {
			const longString = "a".repeat(10000);
			const result = stringify([longString, "b", longString]);
			assert.equal(result.length, 20001); // 10000 + 1 + 10000
			assert.ok(result.startsWith("a"));
			assert.ok(result.endsWith("a"));
		});

		it("should handle arrays with mixed types including nested arrays", () => {
			const mixed = [
				1,
				"hello",
				[2, 3],
				null,
				[4, [5, 6]],
				undefined,
				true,
				[false, [7, 8, 9]],
			];
			const result = stringify(mixed);
			assert.equal(result, "1hello23null456undefinedtruefalse789");
		});

		it("should handle edge case with empty nested arrays", () => {
			/** @type {Array<Array<*>>} */
			const emptyNested = [[], [], []];
			const result = stringify(emptyNested);
			assert.equal(result, "");
		});

		it("should handle edge case with sparse arrays and holes", () => {
			const sparse = [1];
			sparse[2] = 3;
			sparse[4] = 5;
			const result = stringify(sparse);
			assert.equal(result, "1undefined3undefined5");
		});

		it("should handle edge case with deeply nested empty arrays", () => {
			/** @type {*} */
			const deeplyEmpty = [[[[[]]]]];
			const result = stringify(deeplyEmpty);
			assert.equal(result, "");
		});

		it("should handle edge case with mixed empty and non-empty arrays", () => {
			/** @type {Array<* | string>} */
			const mixed = [[], "hello", [], "world", []];
			const result = stringify(mixed);
			assert.equal(result, "helloworld");
		});

		it("should handle edge case with circular reference in nested structure", () => {
			/** @type {Array<*>} */
			const outer = [];
			/** @type {Array<*>} */
			const inner = [];
			outer.push("start");
			outer.push(inner);
			inner.push("middle");
			inner.push(outer);
			inner.push("end");
			const result = stringify(outer);
			assert.equal(result, "startmiddle[Circular]end");
		});
	});

	describe("performance characteristics", () => {
		it("should handle many nested levels efficiently", () => {
			/** @type {*} */
			let deeplyNested = 1;
			for (let i = 0; i < 100; i++) {
				deeplyNested = [deeplyNested];
			}
			const result = stringify(deeplyNested);
			assert.equal(result, "1");
		});

		it("should handle wide arrays efficiently", () => {
			const wideArray = Array.from({ length: 1000 }, (_, i) => i);
			const result = stringify(wideArray);
			assert.ok(result.length > 0);
			assert.ok(result.includes("999"));
		});
	});
});
