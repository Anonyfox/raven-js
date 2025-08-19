import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { bold, dim, italic, underline } from "./format.js";

describe("bold", () => {
	it("should be a function", () => {
		assert.equal(typeof bold, "function");
	});

	it("should throw TypeError for non-string text", () => {
		assert.throws(() => bold(null), {
			name: "TypeError",
			message: "Text must be a string",
		});

		assert.throws(() => bold(123), {
			name: "TypeError",
			message: "Text must be a string",
		});
	});

	it("should wrap text with bold formatting", () => {
		const result = bold("test");
		assert.ok(result.includes("test"));
		assert.ok(result.includes("\x1b[1m")); // Bold code
		assert.ok(result.includes("\x1b[0m")); // Reset code
	});

	it("should handle empty string", () => {
		const result = bold("");
		assert.equal(typeof result, "string");
		assert.ok(result.includes("\x1b[1m"));
		assert.ok(result.includes("\x1b[0m"));
	});
});

describe("italic", () => {
	it("should be a function", () => {
		assert.equal(typeof italic, "function");
	});

	it("should throw TypeError for non-string text", () => {
		assert.throws(() => italic(null), {
			name: "TypeError",
			message: "Text must be a string",
		});

		assert.throws(() => italic(123), {
			name: "TypeError",
			message: "Text must be a string",
		});
	});

	it("should wrap text with italic formatting", () => {
		const result = italic("test");
		assert.ok(result.includes("test"));
		assert.ok(result.includes("\x1b[3m")); // Italic code
		assert.ok(result.includes("\x1b[0m")); // Reset code
	});
});

describe("dim", () => {
	it("should be a function", () => {
		assert.equal(typeof dim, "function");
	});

	it("should throw TypeError for non-string text", () => {
		assert.throws(() => dim(null), {
			name: "TypeError",
			message: "Text must be a string",
		});

		assert.throws(() => dim(123), {
			name: "TypeError",
			message: "Text must be a string",
		});
	});

	it("should wrap text with dim formatting", () => {
		const result = dim("test");
		assert.ok(result.includes("test"));
		assert.ok(result.includes("\x1b[2m")); // Dim code
		assert.ok(result.includes("\x1b[0m")); // Reset code
	});
});

describe("underline", () => {
	it("should be a function", () => {
		assert.equal(typeof underline, "function");
	});

	it("should throw TypeError for non-string text", () => {
		assert.throws(() => underline(null), {
			name: "TypeError",
			message: "Text must be a string",
		});

		assert.throws(() => underline(123), {
			name: "TypeError",
			message: "Text must be a string",
		});
	});

	it("should wrap text with underline formatting", () => {
		const result = underline("test");
		assert.ok(result.includes("test"));
		assert.ok(result.includes("\x1b[4m")); // Underline code
		assert.ok(result.includes("\x1b[0m")); // Reset code
	});
});
