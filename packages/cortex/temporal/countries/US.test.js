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
import { US } from "./US.js";

describe("United States holiday definitions (US)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof US === "object");
			assert.ok(Array.isArray(US.national));
			assert.ok(typeof US.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(US.national.length > 0);

			for (const holiday of US.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const states = Object.keys(US.regional);

			for (const state of states) {
				assert.ok(Array.isArray(US.regional[state]));

				for (const holiday of US.regional[state]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 11 federal holidays", () => {
			// US has 11 federal holidays
			assert.strictEqual(US.national.length, 11);
		});

		it("should have multiple state variations", () => {
			const states = Object.keys(US.regional);
			assert.ok(states.length >= 8); // Should have major states
		});
	});

	describe("Holiday validation", () => {
		it("should have expected federal holidays", () => {
			const nationalNames = US.national.map((h) => h.name);

			const expectedHolidays = [
				"New Year's Day",
				"Martin Luther King Jr. Day",
				"Presidents' Day",
				"Memorial Day",
				"Juneteenth",
				"Independence Day",
				"Labor Day",
				"Columbus Day",
				"Veterans Day",
				"Thanksgiving Day",
				"Christmas Day",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing federal holiday: ${expected}`,
				);
			}
		});

		it("should have Monday holidays", () => {
			const mondayHolidays = [
				"Martin Luther King Jr. Day", // Third Monday in January
				"Presidents' Day", // Third Monday in February
				"Memorial Day", // Last Monday in May
				"Labor Day", // First Monday in September
				"Columbus Day", // Second Monday in October
			];

			for (const holidayName of mondayHolidays) {
				const holiday = US.national.find((h) => h.name === holidayName);
				assert.ok(holiday);
				assert.strictEqual(holiday.type, "calculated");

				// Test that it falls on Monday
				const result = holiday.calculateHoliday(2024);
				assert.strictEqual(result.date.getUTCDay(), 1); // Monday
			}
		});

		it("should have Alabama state holidays", () => {
			assert.ok(US.regional.AL);
			const alabamaNames = US.regional.AL.map((h) => h.name);

			assert.ok(
				alabamaNames.includes("Robert E. Lee/Martin Luther King Jr. Birthday"),
			);
			assert.ok(alabamaNames.includes("Confederate Memorial Day"));
		});

		it("should have Hawaii state holidays", () => {
			assert.ok(US.regional.HI);
			const hawaiiNames = US.regional.HI.map((h) => h.name);

			assert.ok(hawaiiNames.includes("Prince Jonah Kuhio Kalanianaole Day"));
			assert.ok(hawaiiNames.includes("Kamehameha Day"));
			assert.ok(hawaiiNames.includes("Statehood Day"));
		});

		it("should have Alaska state holidays", () => {
			assert.ok(US.regional.AK);
			const alaskaNames = US.regional.AK.map((h) => h.name);

			assert.ok(alaskaNames.includes("Alaska Day"));
			assert.ok(alaskaNames.includes("Seward's Day"));
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = US.national.find((h) => h.name === "New Year's Day");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Independence Day correctly", () => {
			const independenceDay = US.national.find(
				(h) => h.name === "Independence Day",
			);
			assert.ok(independenceDay);

			const holiday2024 = independenceDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 6); // July
			assert.strictEqual(holiday2024.date.getUTCDate(), 4);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Thanksgiving correctly", () => {
			const thanksgiving = US.national.find(
				(h) => h.name === "Thanksgiving Day",
			);
			assert.ok(thanksgiving);
			assert.strictEqual(thanksgiving.type, "calculated");

			const holiday2024 = thanksgiving.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 10); // November
			assert.strictEqual(holiday2024.date.getUTCDay(), 4); // Thursday
			assert.strictEqual(holiday2024.workFree, true);

			// Should be fourth Thursday in November
			const nov1 = new Date(Date.UTC(2024, 10, 1));
			const firstThursday =
				nov1.getUTCDay() <= 4 ? 5 - nov1.getUTCDay() : 12 - nov1.getUTCDay();
			const expectedDate = firstThursday + 21; // Fourth Thursday
			assert.strictEqual(holiday2024.date.getUTCDate(), expectedDate);
		});

		it("should calculate Memorial Day correctly", () => {
			const memorialDay = US.national.find((h) => h.name === "Memorial Day");
			assert.ok(memorialDay);

			const holiday2024 = memorialDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDay(), 1); // Monday
			assert.strictEqual(holiday2024.workFree, true);

			// Should be last Monday in May
			assert.ok(holiday2024.date.getUTCDate() >= 25); // Last week of May
		});

		it("should handle calculated holidays", () => {
			const calculatedHolidays = US.national.filter(
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
				...US.national,
				...Object.values(US.regional).flat(),
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

		it("should maintain American institutional memory", () => {
			const allNames = [
				...US.national.map((h) => h.name),
				...Object.values(US.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core American holidays that should always be present
			const coreHolidays = [
				"New Year's Day",
				"Independence Day",
				"Thanksgiving Day",
				"Christmas Day",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core American holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
