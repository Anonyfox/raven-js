/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { tryParseReferenceImage } from "./reference-image-parser.js";

describe("Reference Image Parser", () => {
	const references = {
		logo: { url: "https://example.com/logo.png", title: "Company Logo" },
		avatar: { url: "https://github.com/avatar.jpg", title: undefined },
		icon: { url: "https://example.com/icon.svg", title: "Site Icon" },
	};

	describe("Regular image syntax", () => {
		it("should parse regular images without references", () => {
			const result = tryParseReferenceImage(
				"See ![test image](https://test.com/img.png)",
				4,
			);

			assert.ok(result);
			assert.equal(result.node.type, NODE_TYPES.IMAGE);
			assert.equal(result.node.url, "https://test.com/img.png");
			assert.equal(result.node.alt, "test image");
			assert.equal(result.start, 4);
			assert.equal(result.end, 43);
		});

		it("should prioritize regular syntax over reference syntax", () => {
			const result = tryParseReferenceImage(
				"See ![logo](https://direct.com/img.png)",
				4,
				references,
			);

			assert.ok(result);
			assert.equal(result.node.url, "https://direct.com/img.png"); // Direct URL, not reference
		});
	});

	describe("Reference image syntax", () => {
		it("should parse reference image ![alt][ref]", () => {
			const result = tryParseReferenceImage(
				"See ![Company Logo][logo]",
				4,
				references,
			);

			assert.ok(result);
			assert.equal(result.node.type, NODE_TYPES.IMAGE);
			assert.equal(result.node.url, "https://example.com/logo.png");
			assert.equal(result.node.alt, "Company Logo");
			assert.equal(result.node.title, "Company Logo");
			assert.equal(result.start, 4);
			assert.equal(result.end, 25);
		});

		it("should parse collapsed reference image ![alt][]", () => {
			const result = tryParseReferenceImage("See ![logo][]", 4, references);

			assert.ok(result);
			assert.equal(result.node.url, "https://example.com/logo.png");
			assert.equal(result.node.alt, "logo");
			assert.equal(result.node.title, "Company Logo");
			assert.equal(result.end, 13);
		});

		it("should parse shorthand reference image ![ref]", () => {
			const result = tryParseReferenceImage("See ![avatar]", 4, references);

			assert.ok(result);
			assert.equal(result.node.url, "https://github.com/avatar.jpg");
			assert.equal(result.node.alt, "avatar");
			assert.equal(result.node.title, undefined);
			assert.equal(result.end, 13);
		});

		it("should handle case-insensitive reference matching", () => {
			const result = tryParseReferenceImage("See ![LOGO][]", 4, references);

			assert.ok(result);
			assert.equal(result.node.url, "https://example.com/logo.png");
		});

		it("should return null for unknown reference", () => {
			const result = tryParseReferenceImage(
				"See ![unknown][ref]",
				4,
				references,
			);
			assert.equal(result, null);
		});

		it("should return null for unknown shorthand reference", () => {
			const result = tryParseReferenceImage("See ![unknown]", 4, references);
			assert.equal(result, null);
		});

		it("should handle references without title", () => {
			const result = tryParseReferenceImage(
				"See ![Avatar][avatar]",
				4,
				references,
			);

			assert.ok(result);
			assert.equal(result.node.url, "https://github.com/avatar.jpg");
			assert.equal(result.node.title, undefined);
		});

		it("should handle empty alt text with reference", () => {
			const result = tryParseReferenceImage("See ![][logo]", 4, references);
			assert.equal(result, null); // Alt text cannot be empty
		});
	});

	describe("Edge cases", () => {
		it("should return null for malformed reference syntax", () => {
			const tests = [
				"![alt][", // Unclosed reference
				"![alt][ref", // Unclosed reference
				"![][]", // Empty alt text
				"![alt][ ]", // Reference with only space
			];

			for (const test of tests) {
				const result = tryParseReferenceImage(test, 0, references);
				assert.equal(result, null, `Should reject: ${test}`);
			}
		});

		it("should return null when not starting with ![", () => {
			const result = tryParseReferenceImage("text![logo][]", 0, references);
			assert.equal(result, null);
		});

		it("should work with empty references object", () => {
			const result = tryParseReferenceImage("![alt](url)", 0, {});

			assert.ok(result);
			assert.equal(result.node.url, "url");
		});

		it("should handle reference at end of string", () => {
			const result = tryParseReferenceImage("See ![avatar]", 4, references);

			assert.ok(result);
			assert.equal(result.end, 13);
		});

		it("should handle multiple image formats in sequence", () => {
			const text = "Images: ![direct](url.png) ![ref][logo] ![avatar]";

			// Test direct image
			let result = tryParseReferenceImage(text, 8, references);
			assert.ok(result);
			assert.equal(result.node.url, "url.png");

			// Test reference image
			result = tryParseReferenceImage(text, 27, references);
			assert.ok(result);
			assert.equal(result.node.url, "https://example.com/logo.png");

			// Test shorthand reference
			result = tryParseReferenceImage(text, 40, references);
			assert.ok(result);
			assert.equal(result.node.url, "https://github.com/avatar.jpg");
		});

		it("should require minimum length for image syntax", () => {
			const result = tryParseReferenceImage("!", 0, references);
			assert.equal(result, null);
		});

		it("should handle special characters in alt text", () => {
			const specialRefs = {
				"special-chars": {
					url: "https://example.com/special.png",
					title: undefined,
				},
			};

			const result = tryParseReferenceImage(
				"![special-chars][]",
				0,
				specialRefs,
			);

			assert.ok(result);
			assert.equal(result.node.url, "https://example.com/special.png");
			assert.equal(result.node.alt, "special-chars");
		});
	});
});
