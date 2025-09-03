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
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("extracts words, punctuation-safe, contractions, and hyphens", () => {
			// basic English
			deepStrictEqual(tokenizeWords("Hello world"), ["Hello", "world"]);
			deepStrictEqual(tokenizeWords("The quick brown fox"), [
				"The",
				"quick",
				"brown",
				"fox",
			]);
			// punctuation stripping
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
			// contractions and hyphenated words
			deepStrictEqual(tokenizeWords("Don't split contractions"), [
				"Don't",
				"split",
				"contractions",
			]);
			deepStrictEqual(tokenizeWords("state-of-the-art technology"), [
				"state-of-the-art",
				"technology",
			]);
		});
	});

	describe("edge cases and errors", () => {
		it("handles numbers, whitespace, unicode, CJK, emoji, and quotes", () => {
			// numbers and mixed
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
			// invalid inputs and whitespace-only
			deepStrictEqual(tokenizeWords(null), []);
			deepStrictEqual(tokenizeWords(undefined), []);
			deepStrictEqual(tokenizeWords(""), []);
			deepStrictEqual(tokenizeWords("   "), []);
			deepStrictEqual(tokenizeWords("\t\n\r"), []);
			// multiple spaces/newlines
			deepStrictEqual(tokenizeWords("Hello    world"), ["Hello", "world"]);
			deepStrictEqual(tokenizeWords("First\nSecond\tThird"), [
				"First",
				"Second",
				"Third",
			]);
			// unicode accents, German, Cyrillic
			deepStrictEqual(tokenizeWords("café naïve résumé"), [
				"café",
				"naïve",
				"résumé",
			]);
			deepStrictEqual(tokenizeWords("Schöne Grüße"), ["Schöne", "Grüße"]);
			deepStrictEqual(tokenizeWords("Привет мир"), ["Привет", "мир"]);
			// CJK segments (count may vary)
			const japanese = tokenizeWords("こんにちは世界");
			strictEqual(Array.isArray(japanese), true);
			strictEqual(japanese.length > 0, true);
			const chinese = tokenizeWords("你好世界");
			strictEqual(Array.isArray(chinese), true);
			strictEqual(chinese.length > 0, true);
			// emoji
			const result = tokenizeWords("Hello 👋 world 🌍");
			strictEqual(result.includes("Hello"), true);
			strictEqual(result.includes("world"), true);
			// apostrophes and hyphens edges
			deepStrictEqual(tokenizeWords("'quoted' text"), ["quoted", "text"]);
			deepStrictEqual(tokenizeWords("text 'inside' quotes"), [
				"text",
				"inside",
				"quotes",
			]);
			deepStrictEqual(tokenizeWords("-dash at start"), ["dash", "at", "start"]);
			deepStrictEqual(tokenizeWords("end with dash-"), ["end", "with", "dash"]);
		});
	});

	describe("integration scenarios", () => {
		it("handles mixed scripts in a single pass", () => {
			const result = tokenizeWords("English 日本語 русский");
			strictEqual(Array.isArray(result), true);
			strictEqual(result.includes("English"), true);
		});
	});
});
