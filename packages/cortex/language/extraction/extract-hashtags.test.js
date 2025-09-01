/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for hashtag extraction functionality.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { extractHashtags } from "./extract-hashtags.js";

describe("extractHashtags", () => {
	it("extracts basic hashtags", () => {
		const text = "Love #coding every day";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#coding"]);
	});

	it("extracts multiple hashtags", () => {
		const text = "Learning #javascript and #react";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#javascript", "#react"]);
	});

	it("extracts hashtags with underscores", () => {
		const text = "Great #web_development tutorial";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#web_development"]);
	});

	it("extracts hashtags with numbers", () => {
		const text = "Excited for #js2024 conference";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#js2024"]);
	});

	it("extracts hashtags with mixed alphanumeric and underscores", () => {
		const text = "Check out #react_18 and #vue3_tutorial";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#react_18", "#vue3_tutorial"]);
	});

	it("handles hashtags at start of text", () => {
		const text = "#coding is my passion";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#coding"]);
	});

	it("handles hashtags at end of text", () => {
		const text = "Great tutorial about #javascript";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#javascript"]);
	});

	it("handles hashtags surrounded by punctuation", () => {
		const text = "Love (#coding) and enjoy #webdev!";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#coding", "#webdev"]);
	});

	it("handles hashtags with various separators", () => {
		const text = "Topics: #coding, #design; #testing.";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#coding", "#design", "#testing"]);
	});

	it("ignores # symbols without content", () => {
		const text = "Use # for comments or # at end";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, []);
	});

	it("ignores # symbols with special characters", () => {
		const text = "Invalid #hash-tag or #hash.tag";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#hash", "#hash"]);
	});

	it("handles hashtags in different social media contexts", () => {
		const text =
			"Twitter #trending, Instagram #photooftheday, LinkedIn #networking";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#trending", "#photooftheday", "#networking"]);
	});

	it("extracts long hashtags", () => {
		const text = "Event hashtag #internationalwebdevelopmentconference2024";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#internationalwebdevelopmentconference2024"]);
	});

	it("handles consecutive hashtags", () => {
		const text = "#coding #javascript #webdev";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#coding", "#javascript", "#webdev"]);
	});

	it("preserves case in hashtags", () => {
		const text = "Love #JavaScript and #WebDev";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#JavaScript", "#WebDev"]);
	});

	it("handles hashtags in technical contexts", () => {
		const text = "git commit -m 'Fix bug #issue123'";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#issue123"]);
	});

	it("handles hashtags with common abbreviations", () => {
		const text = "Learn #HTML5, #CSS3, and #ES6";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#HTML5", "#CSS3", "#ES6"]);
	});

	it("handles hashtags in programming contexts", () => {
		const text = "Building with #nodejs and #mongodb";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#nodejs", "#mongodb"]);
	});

	it("returns empty array for text without hashtags", () => {
		const text = "This text has no hash tags at all";
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, []);
	});

	it("handles empty string", () => {
		const hashtags = extractHashtags("");
		deepStrictEqual(hashtags, []);
	});

	it("replaces hashtags with placeholders when requested", () => {
		const text = "Love #coding and #javascript";
		const result = extractHashtags(text, true);
		strictEqual(result, "Love <HASHTAG> and <HASHTAG>");
	});

	it("handles placeholder replacement with no hashtags", () => {
		const text = "No hashtags in this text";
		const result = extractHashtags(text, true);
		strictEqual(result, text);
	});

	it("handles hashtags in multiline content", () => {
		const text = `
			Today's focus:
			#coding - 4 hours
			#learning - 2 hours
			#networking - 1 hour
		`;
		const hashtags = extractHashtags(text);
		deepStrictEqual(hashtags, ["#coding", "#learning", "#networking"]);
	});
});
