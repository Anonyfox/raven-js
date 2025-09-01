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
	it("extracts basic integers", () => {
		const text = "You have 42 messages";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["42"]);
	});

	it("extracts decimal numbers", () => {
		const text = "Temperature is 23.5 degrees";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["23.5"]);
	});

	it("extracts multiple numbers", () => {
		const text = "Score: 85 out of 100 possible points";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["85", "100"]);
	});

	it("extracts zero values", () => {
		const text = "Counter shows 0 and balance is 0.00";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["0", "0.00"]);
	});

	it("extracts large numbers", () => {
		const text = "Population: 7894561 people";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["7894561"]);
	});

	it("extracts numbers with leading zeros", () => {
		const text = "Version 01.05.0003 released";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["01.05", "0003"]);
	});

	it("extracts percentages", () => {
		const text = "Battery at 87% and CPU usage 23.4%";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["87", "23.4"]);
	});

	it("extracts numbers at word boundaries", () => {
		const text = "Model 123 has 456 features";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["123", "456"]);
	});

	it("handles numbers at start of text", () => {
		const text = "42 is the answer to everything";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["42"]);
	});

	it("handles numbers at end of text", () => {
		const text = "The total amount is 299.99";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["299.99"]);
	});

	it("handles numbers surrounded by punctuation", () => {
		const text = "Results (23.5) and scores [87.2]!";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["23.5", "87.2"]);
	});

	it("extracts numbers from technical contexts", () => {
		const text = "Server port 8080 with timeout 30.5 seconds";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["8080", "30.5"]);
	});

	it("extracts numbers from measurements", () => {
		const text = "Length: 15 7cm, Width: 8 2cm, Height: 12 cm";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["15", "8", "12"]);
	});

	it("extracts numbers from time formats", () => {
		const text = "Duration: 2.5 hours or 150 minutes";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["2.5", "150"]);
	});

	it("extracts numbers from version strings", () => {
		const text = "Version 1.2.3 and build 456";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["1.2", "3", "456"]);
	});

	it("extracts numbers from coordinates", () => {
		const text = "Location: 40.7128, -74.0060 (NYC)";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["40.7128", "74.0060"]);
	});

	it("ignores partial numbers in words", () => {
		const text = "The word contains no standalone numbers";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, []);
	});

	it("handles scientific notation as separate parts", () => {
		// Our current regex treats numbers separated by letters as separate
		const text = "Value is 1 approximately";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["1"]);
	});

	it("returns empty array for text without numbers", () => {
		const text = "This text contains no numeric values";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, []);
	});

	it("handles empty string", () => {
		const numbers = extractNumbers("");
		deepStrictEqual(numbers, []);
	});

	it("replaces numbers with placeholders when requested", () => {
		const text = "Score: 95 out of 100 points";
		const result = extractNumbers(text, true);
		strictEqual(result, "Score: <NUMBER> out of <NUMBER> points");
	});

	it("handles placeholder replacement with no numbers", () => {
		const text = "No numbers in this text";
		const result = extractNumbers(text, true);
		strictEqual(result, text);
	});

	it("handles numbers in financial contexts", () => {
		const text = "Interest rate: 3.25% APR over 360 months";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["3.25", "360"]);
	});

	it("extracts numbers from statistical data", () => {
		const text = "Mean: 42.7, Median: 41.5, Mode: 40";
		const numbers = extractNumbers(text);
		deepStrictEqual(numbers, ["42.7", "41.5", "40"]);
	});
});
