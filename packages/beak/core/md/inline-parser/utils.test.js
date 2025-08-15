import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import {
	ensureInlineParserAdvances,
	findNextSpecialChar,
	handleNoSpecialChars,
	handleTextContent,
} from "./utils.js";

describe("Inline Parser Utils", () => {
	describe("handleTextContent", () => {
		it("should add text content when node start is greater than current", () => {
			/** @type {Array<import('../types.js').InlineNode>} */
			const ast = [];
			handleTextContent("hello world", 0, 5, ast);
			assert.deepEqual(ast, [{ type: NODE_TYPES.TEXT, content: "hello" }]);
		});

		it("should not add text content when node start equals current", () => {
			/** @type {Array<import('../types.js').InlineNode>} */
			const ast = [];
			handleTextContent("hello world", 5, 5, ast);
			assert.deepEqual(ast, []);
		});

		it("should not add text content when node start is less than current", () => {
			/** @type {Array<import('../types.js').InlineNode>} */
			const ast = [];
			handleTextContent("hello world", 5, 3, ast);
			assert.deepEqual(ast, []);
		});

		it("should not add empty text content", () => {
			/** @type {Array<import('../types.js').InlineNode>} */
			const ast = [];
			handleTextContent("hello world", 5, 5, ast);
			assert.deepEqual(ast, []);
		});

		it("should handle edge case with empty string", () => {
			/** @type {Array<import('../types.js').InlineNode>} */
			const ast = [];
			handleTextContent("", 0, 1, ast);
			assert.deepEqual(ast, []);
		});
	});

	describe("handleNoSpecialChars", () => {
		it("should add remaining text content and return text length", () => {
			/** @type {Array<import('../types.js').InlineNode>} */
			const ast = [];
			const result = handleNoSpecialChars("hello world", 6, ast);
			assert.equal(result, 11);
			assert.deepEqual(ast, [{ type: NODE_TYPES.TEXT, content: "world" }]);
		});

		it("should handle case when current is at end", () => {
			/** @type {Array<import('../types.js').InlineNode>} */
			const ast = [];
			const result = handleNoSpecialChars("hello world", 11, ast);
			assert.equal(result, 11);
			assert.deepEqual(ast, []);
		});

		it("should handle empty string", () => {
			/** @type {Array<import('../types.js').InlineNode>} */
			const ast = [];
			const result = handleNoSpecialChars("", 0, ast);
			assert.equal(result, 0);
			assert.deepEqual(ast, []);
		});

		it("should handle single character", () => {
			/** @type {Array<import('../types.js').InlineNode>} */
			const ast = [];
			const result = handleNoSpecialChars("a", 0, ast);
			assert.equal(result, 1);
			assert.deepEqual(ast, [{ type: NODE_TYPES.TEXT, content: "a" }]);
		});
	});

	describe("ensureInlineParserAdvances", () => {
		it("should advance when current equals startPosition", () => {
			const result = ensureInlineParserAdvances(5, 5);
			assert.equal(result, 6);
		});

		it("should advance when current is less than startPosition", () => {
			const result = ensureInlineParserAdvances(3, 5);
			assert.equal(result, 6);
		});

		it("should not change when current is greater than startPosition", () => {
			const result = ensureInlineParserAdvances(7, 5);
			assert.equal(result, 7);
		});

		it("should handle edge case with zero values", () => {
			const result = ensureInlineParserAdvances(0, 0);
			assert.equal(result, 1);
		});

		it("should handle negative values", () => {
			const result = ensureInlineParserAdvances(-1, 0);
			assert.equal(result, 1);
		});
	});

	describe("findNextSpecialChar", () => {
		it("should find asterisk", () => {
			const result = findNextSpecialChar("hello *world", 0);
			assert.equal(result, 6);
		});

		it("should find backtick", () => {
			const result = findNextSpecialChar("hello `world", 0);
			assert.equal(result, 6);
		});

		it("should find bracket", () => {
			const result = findNextSpecialChar("hello [world", 0);
			assert.equal(result, 6);
		});

		it("should find exclamation mark", () => {
			const result = findNextSpecialChar("hello !world", 0);
			assert.equal(result, 6);
		});

		it("should return -1 when no special characters found", () => {
			const result = findNextSpecialChar("hello world", 0);
			assert.equal(result, -1);
		});

		it("should find first special character when multiple exist", () => {
			const result = findNextSpecialChar("hello *world`test", 0);
			assert.equal(result, 6);
		});

		it("should start search from specified position", () => {
			const result = findNextSpecialChar("hello *world", 7);
			assert.equal(result, -1);
		});
	});
});
