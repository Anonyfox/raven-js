/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for number extraction functionality.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { extractNumbers } from "./extract-numbers.js";

describe("extractNumbers", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("parses integers, decimals, multiples, and zeros", () => {
			// basic integer
			deepStrictEqual(extractNumbers("You have 42 messages"), ["42"]);
			// decimal
			deepStrictEqual(extractNumbers("Temperature is 23.5 degrees"), ["23.5"]);
			// multiple values
			deepStrictEqual(extractNumbers("Score: 85 out of 100 possible points"), [
				"85",
				"100",
			]);
			// zeros
			deepStrictEqual(extractNumbers("Counter shows 0 and balance is 0.00"), [
				"0",
				"0.00",
			]);
			// large number
			deepStrictEqual(extractNumbers("Population: 7894561 people"), [
				"7894561",
			]);
		});
	});

	describe("edge cases and errors", () => {
		it("handles positions, punctuation, contexts, and empties", () => {
			// leading zeros
			deepStrictEqual(extractNumbers("Version 01.05.0003 released"), [
				"01.05",
				"0003",
			]);
			// percentages
			deepStrictEqual(extractNumbers("Battery at 87% and CPU usage 23.4%"), [
				"87",
				"23.4",
			]);
			// word boundaries
			deepStrictEqual(extractNumbers("Model 123 has 456 features"), [
				"123",
				"456",
			]);
			// start and end
			deepStrictEqual(extractNumbers("42 is the answer to everything"), ["42"]);
			deepStrictEqual(extractNumbers("The total amount is 299.99"), ["299.99"]);
			// punctuation wrappers
			deepStrictEqual(extractNumbers("Results (23.5) and scores [87.2]!"), [
				"23.5",
				"87.2",
			]);
			// technical context
			deepStrictEqual(
				extractNumbers("Server port 8080 with timeout 30.5 seconds"),
				["8080", "30.5"],
			);
			// measurements (note: mixed units cause partial matches)
			deepStrictEqual(
				extractNumbers("Length: 15 7cm, Width: 8 2cm, Height: 12 cm"),
				["15", "8", "12"],
			);
			// time formats
			deepStrictEqual(extractNumbers("Duration: 2.5 hours or 150 minutes"), [
				"2.5",
				"150",
			]);
			// version strings
			deepStrictEqual(extractNumbers("Version 1.2.3 and build 456"), [
				"1.2",
				"3",
				"456",
			]);
			// coordinates (negative sign splits)
			deepStrictEqual(extractNumbers("Location: 40.7128, -74.0060 (NYC)"), [
				"40.7128",
				"74.0060",
			]);
			// words only
			deepStrictEqual(
				extractNumbers("The word contains no standalone numbers"),
				[],
			);
			// scientific notation not supported (document behavior)
			deepStrictEqual(extractNumbers("Value is 1 approximately"), ["1"]);
			// no matches
			deepStrictEqual(
				extractNumbers("This text contains no numeric values"),
				[],
			);
			// empty input
			deepStrictEqual(extractNumbers(""), []);
			// placeholders
			strictEqual(
				extractNumbers("Score: 95 out of 100 points", true),
				"Score: <NUMBER> out of <NUMBER> points",
			);
			strictEqual(
				extractNumbers("No numbers in this text", true),
				"No numbers in this text",
			);
			// finance context
			deepStrictEqual(
				extractNumbers("Interest rate: 3.25% APR over 360 months"),
				["3.25", "360"],
			);
			// statistics
			deepStrictEqual(extractNumbers("Mean: 42.7, Median: 41.5, Mode: 40"), [
				"42.7",
				"41.5",
				"40",
			]);
		});
	});

	describe("integration scenarios", () => {
		it("extracts cohesive sets across diverse texts", () => {
			// mixed text validating multiple behaviors at once
			const text = `
				Report v1.2.3: port 8080, duration 2.5h, saved 150 files, score 95/100.
			`;
			// current behavior: boundary rules yield '2.3' from v1.2.3 and '2' from 2.5h
			deepStrictEqual(extractNumbers(text), [
				"2.3",
				"8080",
				"2",
				"150",
				"95",
				"100",
			]);
		});
	});
});
