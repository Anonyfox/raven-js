import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { tryParseImage } from "./image-parser.js";

describe("Image Parser", () => {
	it("should parse simple image", () => {
		const result = tryParseImage("![alt](url)", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.IMAGE,
				alt: "alt",
				url: "url",
			},
			start: 0,
			end: 11,
		});
	});

	it("should parse image with empty alt text", () => {
		const result = tryParseImage("![](url)", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.IMAGE,
				alt: "",
				url: "url",
			},
			start: 0,
			end: 8,
		});
	});

	it("should parse image with complex URL", () => {
		const result = tryParseImage("![image](https://example.com/img.png)", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.IMAGE,
				alt: "image",
				url: "https://example.com/img.png",
			},
			start: 0,
			end: 37,
		});
	});

	it("should not parse incomplete image", () => {
		const result = tryParseImage("![incomplete", 0);
		assert.equal(result, null);
	});

	it("should not parse image without URL", () => {
		const result = tryParseImage("![alt]()", 0);
		assert.equal(result, null);
	});

	it("should not parse when not at start", () => {
		const result = tryParseImage("text ![image](url)", 5);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.IMAGE,
				alt: "image",
				url: "url",
			},
			start: 5,
			end: 18,
		});
	});

	it("should not parse when not starting with ![", () => {
		const result = tryParseImage("text", 0);
		assert.equal(result, null);
	});

	it("should not parse when missing closing bracket", () => {
		const result = tryParseImage("![alt(url)", 0);
		assert.equal(result, null);
	});

	it("should not parse when missing opening parenthesis", () => {
		const result = tryParseImage("![alt]url)", 0);
		assert.equal(result, null);
	});

	it("should not parse when too close to end", () => {
		const result = tryParseImage("![", 0);
		assert.equal(result, null);
	});

	it("should not parse when start is at end of text", () => {
		const result = tryParseImage("text", 4);
		assert.equal(result, null);
	});

	it("should not parse when bracket is at end of text", () => {
		const result = tryParseImage("![alt]", 0);
		assert.equal(result, null);
	});

	it("should not parse when no opening parenthesis after bracket", () => {
		const result = tryParseImage("![alt]url)", 0);
		assert.equal(result, null);
	});
});
