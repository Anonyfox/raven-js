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
import { SG } from "./SG.js";

describe("Singaporean holiday definitions (SG)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof SG === "object");
			assert.ok(Array.isArray(SG.national));
			assert.ok(typeof SG.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(SG.national.length > 0);

			for (const holiday of SG.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 11 national holidays", () => {
			// Singapore has 11 official public holidays
			assert.strictEqual(SG.national.length, 11);
		});

		it("should have no regional variations", () => {
			// Singapore is a city-state with no regional variations
			const regions = Object.keys(SG.regional);
			assert.strictEqual(regions.length, 0);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = SG.national.map((h) => h.name);

			const expectedHolidays = [
				"New Year's Day",
				"Chinese New Year",
				"Chinese New Year (Day 2)",
				"Good Friday",
				"Hari Raya Puasa", // Eid al-Fitr
				"Labour Day",
				"Vesak Day",
				"Hari Raya Haji", // Eid al-Adha
				"National Day",
				"Deepavali",
				"Christmas Day",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have multicultural religious holidays", () => {
			const nationalNames = SG.national.map((h) => h.name);

			// Chinese holidays
			assert.ok(nationalNames.includes("Chinese New Year"));
			assert.ok(nationalNames.includes("Chinese New Year (Day 2)"));

			// Islamic holidays
			assert.ok(nationalNames.includes("Hari Raya Puasa"));
			assert.ok(nationalNames.includes("Hari Raya Haji"));

			// Hindu holiday
			assert.ok(nationalNames.includes("Deepavali"));

			// Buddhist holiday
			assert.ok(nationalNames.includes("Vesak Day"));

			// Christian holidays
			assert.ok(nationalNames.includes("Good Friday"));
			assert.ok(nationalNames.includes("Christmas Day"));
		});

		it("should have two-day Chinese New Year celebration", () => {
			const cnyHolidays = SG.national.filter((h) =>
				h.name.includes("Chinese New Year"),
			);

			assert.strictEqual(cnyHolidays.length, 2);
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = SG.national.find((h) => h.name === "New Year's Day");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate National Day correctly", () => {
			const nationalDay = SG.national.find((h) => h.name === "National Day");
			assert.ok(nationalDay);

			const holiday2024 = nationalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 7); // August
			assert.strictEqual(holiday2024.date.getUTCDate(), 9);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Labour Day correctly", () => {
			const labourDay = SG.national.find((h) => h.name === "Labour Day");
			assert.ok(labourDay);

			const holiday2024 = labourDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle calculated holidays", () => {
			const calculatedHolidays = SG.national.filter(
				(h) => h.type === "calculated",
			);

			for (const holiday of calculatedHolidays) {
				assert.strictEqual(typeof holiday.calculator, "function");

				// Test the calculation
				const result = holiday.calculateHoliday(2024);
				assert.ok(result.date instanceof Date);
			}
		});

		it("should handle Easter-relative holidays", () => {
			const easterHolidays = SG.national.filter(
				(h) => h.type === "easter_relative",
			);

			assert.strictEqual(easterHolidays.length, 1); // Only Good Friday

			for (const holiday of easterHolidays) {
				const easterSunday = new Date(Date.UTC(2024, 2, 31)); // March 31, 2024
				const result = holiday.calculateHoliday(2024, easterSunday);
				assert.ok(result.date instanceof Date);
				assert.strictEqual(result.workFree, true);
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of SG.national) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.strictEqual(holiday.workFree, true); // All Singaporean holidays are work-free

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain Singaporean institutional memory", () => {
			const allNames = SG.national.map((h) => h.name);

			// Core Singaporean holidays that should always be present
			const coreHolidays = [
				"New Year's Day",
				"Chinese New Year",
				"National Day",
				"Christmas Day",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Singaporean holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
