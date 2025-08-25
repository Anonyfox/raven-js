import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { tryParseLink } from "./link-parser.js";

describe("Link Parser", () => {
	it("should parse simple link", () => {
		const result = tryParseLink("[text](url)", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.LINK,
				content: [{ type: NODE_TYPES.TEXT, content: "text" }],
				url: "url",
			},
			start: 0,
			end: 11,
		});
	});

	it("should parse link with complex URL", () => {
		const result = tryParseLink(
			"[link](https://example.com/path?param=value)",
			0,
		);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.LINK,
				content: [{ type: NODE_TYPES.TEXT, content: "link" }],
				url: "https://example.com/path?param=value",
			},
			start: 0,
			end: 44,
		});
	});

	it("should not parse incomplete link", () => {
		const result = tryParseLink("[incomplete", 0);
		assert.equal(result, null);
	});

	it("should not parse link without URL", () => {
		const result = tryParseLink("[text]()", 0);
		assert.equal(result, null);
	});

	it("should not parse link without text", () => {
		const result = tryParseLink("[](url)", 0);
		assert.equal(result, null);
	});

	it("should not parse when not at start", () => {
		const result = tryParseLink("text [link](url)", 5);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.LINK,
				content: [{ type: NODE_TYPES.TEXT, content: "link" }],
				url: "url",
			},
			start: 5,
			end: 16,
		});
	});

	it("should not parse when not starting with [", () => {
		const result = tryParseLink("text", 0);
		assert.equal(result, null);
	});

	it("should not parse when missing closing bracket", () => {
		const result = tryParseLink("[text(url)", 0);
		assert.equal(result, null);
	});

	it("should not parse when missing opening parenthesis", () => {
		const result = tryParseLink("[text]url)", 0);
		assert.equal(result, null);
	});

	it("should not parse when start is at end of text", () => {
		const result = tryParseLink("text", 4);
		assert.equal(result, null);
	});

	it("should not parse when bracket is at end of text", () => {
		const result = tryParseLink("[text]", 0);
		assert.equal(result, null);
	});

	it("should not parse when no opening parenthesis after bracket", () => {
		const result = tryParseLink("[text]url)", 0);
		assert.equal(result, null);
	});
});
