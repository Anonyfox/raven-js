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
import { NL } from "./NL.js";

describe("Dutch holiday definitions (NL)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof NL === "object");
			assert.ok(Array.isArray(NL.national));
			assert.ok(typeof NL.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(NL.national.length > 0);

			for (const holiday of NL.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 11 national holidays", () => {
			// Netherlands has 11 official public holidays
			assert.strictEqual(NL.national.length, 11);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = NL.national.map((h) => h.name);

			const expectedHolidays = [
				"Nieuwjaar",
				"Goede Vrijdag",
				"Pasen",
				"Tweede Paasdag",
				"Koningsdag",
				"Bevrijdingsdag",
				"Hemelvaartsdag",
				"Pinksteren",
				"Tweede Pinksterdag",
				"Eerste Kerstdag",
				"Tweede Kerstdag",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should handle King's Day calculation", () => {
			const kingsDay = NL.national.find((h) => h.name === "Koningsdag");
			assert.ok(kingsDay);
			assert.strictEqual(kingsDay.type, "calculated");

			const holiday2024 = kingsDay.calculateHoliday(2024);
			// Should be April 27 in 2024 (not a Sunday)
			assert.strictEqual(holiday2024.date.getUTCMonth(), 3); // April
			assert.strictEqual(holiday2024.date.getUTCDate(), 27);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of NL.national) {
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
