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
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("parses hashtags across forms and positions", () => {
			// single hashtag
			deepStrictEqual(extractHashtags("Love #coding every day"), ["#coding"]);
			// multiple hashtags
			deepStrictEqual(extractHashtags("Learning #javascript and #react"), [
				"#javascript",
				"#react",
			]);
			// underscores
			deepStrictEqual(extractHashtags("Great #web_development tutorial"), [
				"#web_development",
			]);
			// numbers
			deepStrictEqual(extractHashtags("Excited for #js2024 conference"), [
				"#js2024",
			]);
			// mixed
			deepStrictEqual(
				extractHashtags("Check out #react_18 and #vue3_tutorial"),
				["#react_18", "#vue3_tutorial"],
			);
			// start and end of text
			deepStrictEqual(extractHashtags("#coding is my passion"), ["#coding"]);
			deepStrictEqual(extractHashtags("Great tutorial about #javascript"), [
				"#javascript",
			]);
		});
	});

	describe("edge cases and errors", () => {
		it("handles punctuation, separators, invalids, and empties", () => {
			// punctuation
			deepStrictEqual(extractHashtags("Love (#coding) and enjoy #webdev!"), [
				"#coding",
				"#webdev",
			]);
			// separators
			deepStrictEqual(extractHashtags("Topics: #coding, #design; #testing."), [
				"#coding",
				"#design",
				"#testing",
			]);
			// no content after #
			deepStrictEqual(extractHashtags("Use # for comments or # at end"), []);
			// invalid chars (regex stops at hyphen/dot)
			deepStrictEqual(extractHashtags("Invalid #hash-tag or #hash.tag"), [
				"#hash",
				"#hash",
			]);
			// social contexts
			deepStrictEqual(
				extractHashtags(
					"Twitter #trending, Instagram #photooftheday, LinkedIn #networking",
				),
				["#trending", "#photooftheday", "#networking"],
			);
			// long tag
			deepStrictEqual(
				extractHashtags(
					"Event hashtag #internationalwebdevelopmentconference2024",
				),
				["#internationalwebdevelopmentconference2024"],
			);
			// consecutive tags
			deepStrictEqual(extractHashtags("#coding #javascript #webdev"), [
				"#coding",
				"#javascript",
				"#webdev",
			]);
			// case preserved
			deepStrictEqual(extractHashtags("Love #JavaScript and #WebDev"), [
				"#JavaScript",
				"#WebDev",
			]);
			// technical context
			deepStrictEqual(extractHashtags("git commit -m 'Fix bug #issue123'"), [
				"#issue123",
			]);
			// common abbreviations
			deepStrictEqual(extractHashtags("Learn #HTML5, #CSS3, and #ES6"), [
				"#HTML5",
				"#CSS3",
				"#ES6",
			]);
			// programming contexts
			deepStrictEqual(extractHashtags("Building with #nodejs and #mongodb"), [
				"#nodejs",
				"#mongodb",
			]);
			// no matches
			deepStrictEqual(extractHashtags("This text has no hash tags at all"), []);
			// empty input
			deepStrictEqual(extractHashtags(""), []);
			// placeholders
			strictEqual(
				extractHashtags("Love #coding and #javascript", true),
				"Love <HASHTAG> and <HASHTAG>",
			);
			strictEqual(
				extractHashtags("No hashtags in this text", true),
				"No hashtags in this text",
			);
		});
	});

	describe("integration scenarios", () => {
		it("extracts from multiline agenda", () => {
			const text = `
				Today's focus:
				#coding - 4 hours
				#learning - 2 hours
				#networking - 1 hour
			`;
			deepStrictEqual(extractHashtags(text), [
				"#coding",
				"#learning",
				"#networking",
			]);
		});
	});
});
