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
import { MY } from "./MY.js";

describe("Malaysian holiday definitions (MY)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof MY === "object");
			assert.ok(Array.isArray(MY.national));
			assert.ok(typeof MY.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(MY.national.length > 0);

			for (const holiday of MY.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const states = Object.keys(MY.regional);

			for (const state of states) {
				assert.ok(Array.isArray(MY.regional[state]));

				for (const holiday of MY.regional[state]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 14 national holidays", () => {
			// Malaysia has 14 official national holidays
			assert.strictEqual(MY.national.length, 14);
		});

		it("should have multiple state variations", () => {
			const states = Object.keys(MY.regional);
			assert.ok(states.length >= 10); // Should have major states
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = MY.national.map((h) => h.name);

			const expectedHolidays = [
				"New Year's Day",
				"Federal Territory Day",
				"Chinese New Year",
				"Chinese New Year (Day 2)",
				"Labour Day",
				"Wesak Day",
				"Yang di-Pertuan Agong's Birthday",
				"Hari Raya Aidilfitri",
				"Hari Raya Aidilfitri (Day 2)",
				"Hari Raya Aidiladha",
				"National Day",
				"Malaysia Day",
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
			const nationalNames = MY.national.map((h) => h.name);

			// Chinese holidays
			assert.ok(nationalNames.includes("Chinese New Year"));
			assert.ok(nationalNames.includes("Chinese New Year (Day 2)"));

			// Islamic holidays
			assert.ok(nationalNames.includes("Hari Raya Aidilfitri"));
			assert.ok(nationalNames.includes("Hari Raya Aidiladha"));

			// Hindu holiday
			assert.ok(nationalNames.includes("Deepavali"));

			// Buddhist holiday
			assert.ok(nationalNames.includes("Wesak Day"));

			// Christian holiday
			assert.ok(nationalNames.includes("Christmas Day"));
		});

		it("should have Johor state holidays", () => {
			assert.ok(MY.regional.JHR);
			const johorNames = MY.regional.JHR.map((h) => h.name);

			assert.ok(johorNames.includes("Sultan of Johor's Birthday"));
			assert.ok(johorNames.includes("Thaipusam"));
		});

		it("should have Sabah state holidays", () => {
			assert.ok(MY.regional.SBH);
			const sabahNames = MY.regional.SBH.map((h) => h.name);

			assert.ok(sabahNames.includes("Head of State of Sabah's Birthday"));
			assert.ok(sabahNames.includes("Good Friday"));
		});

		it("should have Sarawak state holidays", () => {
			assert.ok(MY.regional.SWK);
			const sarawakNames = MY.regional.SWK.map((h) => h.name);

			assert.ok(sarawakNames.includes("Sarawak Day"));
			assert.ok(sarawakNames.includes("Good Friday"));
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = MY.national.find((h) => h.name === "New Year's Day");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate National Day correctly", () => {
			const nationalDay = MY.national.find((h) => h.name === "National Day");
			assert.ok(nationalDay);

			const holiday2024 = nationalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 7); // August
			assert.strictEqual(holiday2024.date.getUTCDate(), 31);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Malaysia Day correctly", () => {
			const malaysiaDay = MY.national.find((h) => h.name === "Malaysia Day");
			assert.ok(malaysiaDay);

			const holiday2024 = malaysiaDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 8); // September
			assert.strictEqual(holiday2024.date.getUTCDate(), 16);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle calculated holidays", () => {
			const allHolidays = [
				...MY.national,
				...Object.values(MY.regional).flat(),
			];

			const calculatedHolidays = allHolidays.filter(
				(h) => h.type === "calculated",
			);

			for (const holiday of calculatedHolidays) {
				assert.strictEqual(typeof holiday.calculator, "function");

				// Test the calculation
				const result = holiday.calculateHoliday(2024);
				assert.ok(result.date instanceof Date);
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...MY.national,
				...Object.values(MY.regional).flat(),
			];

			for (const holiday of allHolidays) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain Malaysian institutional memory", () => {
			const allNames = [
				...MY.national.map((h) => h.name),
				...Object.values(MY.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core Malaysian holidays that should always be present
			const coreHolidays = [
				"New Year's Day",
				"National Day",
				"Malaysia Day",
				"Hari Raya Aidilfitri",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Malaysian holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
