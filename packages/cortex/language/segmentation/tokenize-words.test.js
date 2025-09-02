/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for word tokenization functionality.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { tokenizeWords } from "./tokenize-words.js";

describe("tokenizeWords", () => {
	it("tokenizes basic English text", () => {
		deepStrictEqual(tokenizeWords("Hello world"), ["Hello", "world"]);
		deepStrictEqual(tokenizeWords("The quick brown fox"), [
			"The",
			"quick",
			"brown",
			"fox",
		]);
	});

	it("handles punctuation correctly", () => {
		deepStrictEqual(tokenizeWords("Hello, world!"), ["Hello", "world"]);
		deepStrictEqual(tokenizeWords("Test... more text."), [
			"Test",
			"more",
			"text",
		]);
		deepStrictEqual(tokenizeWords("(Parentheses) and [brackets]"), [
			"Parentheses",
			"and",
			"brackets",
		]);
	});

	it("preserves contractions", () => {
		deepStrictEqual(tokenizeWords("Don't split contractions"), [
			"Don't",
			"split",
			"contractions",
		]);
		deepStrictEqual(tokenizeWords("I'm here"), ["I'm", "here"]);
		deepStrictEqual(tokenizeWords("You're amazing"), ["You're", "amazing"]);
	});

	it("preserves hyphenated words", () => {
		deepStrictEqual(tokenizeWords("state-of-the-art technology"), [
			"state-of-the-art",
			"technology",
		]);
		deepStrictEqual(tokenizeWords("twenty-one years old"), [
			"twenty-one",
			"years",
			"old",
		]);
		deepStrictEqual(tokenizeWords("self-driving car"), ["self-driving", "car"]);
	});

	it("handles numbers and mixed content", () => {
		deepStrictEqual(tokenizeWords("Test 123 more"), ["Test", "123", "more"]);
		deepStrictEqual(tokenizeWords("Version 2.0 released"), [
			"Version",
			"2.0",
			"released",
		]);
		deepStrictEqual(tokenizeWords("Model-T car from 1920s"), [
			"Model-T",
			"car",
			"from",
			"1920s",
		]);
	});

	it("handles invalid and edge case inputs gracefully", () => {
		// Null/undefined inputs
		deepStrictEqual(tokenizeWords(null), []);
		deepStrictEqual(tokenizeWords(undefined), []);

		// Empty and whitespace-only strings
		deepStrictEqual(tokenizeWords(""), []);
		deepStrictEqual(tokenizeWords("   "), []);
		deepStrictEqual(tokenizeWords("\t\n\r"), []);

		// Clean single-parameter API
		deepStrictEqual(tokenizeWords("Hello world"), ["Hello", "world"]);
	});

	it("handles multiple spaces and newlines", () => {
		deepStrictEqual(tokenizeWords("Hello    world"), ["Hello", "world"]);
		deepStrictEqual(tokenizeWords("First\nSecond\tThird"), [
			"First",
			"Second",
			"Third",
		]);
	});

	it("handles Unicode characters", () => {
		// Accented characters
		deepStrictEqual(tokenizeWords("café naïve résumé"), [
			"café",
			"naïve",
			"résumé",
		]);

		// German
		deepStrictEqual(tokenizeWords("Schöne Grüße"), ["Schöne", "Grüße"]);

		// Cyrillic
		deepStrictEqual(tokenizeWords("Привет мир"), ["Привет", "мир"]);
	});

	it("handles CJK text", () => {
		// Note: CJK tokenization might vary between Intl.Segmenter and regex fallback
		// Both are considered valid as long as they produce reasonable segments
		const japanese = tokenizeWords("こんにちは世界");
		strictEqual(Array.isArray(japanese), true);
		strictEqual(japanese.length > 0, true);

		const chinese = tokenizeWords("你好世界");
		strictEqual(Array.isArray(chinese), true);
		strictEqual(chinese.length > 0, true);
	});

	it("handles emoji and special characters", () => {
		const result = tokenizeWords("Hello 👋 world 🌍");
		// Should extract the word parts, emoji handling may vary
		strictEqual(result.includes("Hello"), true);
		strictEqual(result.includes("world"), true);
	});

	it("handles apostrophe edge cases", () => {
		// Leading/trailing apostrophes should not be preserved
		deepStrictEqual(tokenizeWords("'quoted' text"), ["quoted", "text"]);
		deepStrictEqual(tokenizeWords("text 'inside' quotes"), [
			"text",
			"inside",
			"quotes",
		]);
	});

	it("handles hyphen edge cases", () => {
		// Leading/trailing hyphens should not be preserved
		deepStrictEqual(tokenizeWords("-dash at start"), ["dash", "at", "start"]);
		deepStrictEqual(tokenizeWords("end with dash-"), ["end", "with", "dash"]);
	});

	it("handles mixed scripts", () => {
		const result = tokenizeWords("English 日本語 русский");
		strictEqual(Array.isArray(result), true);
		strictEqual(result.includes("English"), true);
	});
});
