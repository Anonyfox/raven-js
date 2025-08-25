import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { splitIntoLines } from "./utils.js";

describe("Utils", () => {
	describe("splitIntoLines", () => {
		it("should split text with newlines", () => {
			const result = splitIntoLines("line1\nline2\nline3");
			assert.deepEqual(result, ["line1", "line2", "line3"]);
		});

		it("should split text with carriage returns", () => {
			const result = splitIntoLines("line1\r\nline2\r\nline3");
			assert.deepEqual(result, ["line1", "line2", "line3"]);
		});

		it("should handle single line", () => {
			const result = splitIntoLines("single line");
			assert.deepEqual(result, ["single line"]);
		});

		it("should handle empty string", () => {
			const result = splitIntoLines("");
			assert.deepEqual(result, [""]);
		});

		it("should handle non-string input", () => {
			// @ts-expect-error - Testing invalid input
			const result = splitIntoLines(123);
			assert.deepEqual(result, []);
		});
	});
});
