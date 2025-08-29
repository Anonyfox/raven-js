/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { HolidayDefinition } from "../holiday-definition.js";
import { DK } from "./DK.js";

describe("Danish holiday definitions (DK)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof DK === "object");
			assert.ok(Array.isArray(DK.national));
			assert.ok(typeof DK.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(DK.national.length > 0);

			for (const holiday of DK.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have Danish holidays", () => {
			assert.ok(DK.national.length >= 10);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = DK.national.map((h) => h.name);

			const expectedHolidays = [
				"Nytårsdag",
				"Skærtorsdag",
				"Langfredag",
				"Påskedag",
				"2. påskedag",
				"Store bededag",
				"Kristi himmelfartsdag",
				"Pinsedag",
				"2. pinsedag",
				"Juledag",
				"2. juledag",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate New Year correctly", () => {
			const newYear = DK.national.find((h) => h.name === "Nytårsdag");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of DK.national) {
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});
	});
});
