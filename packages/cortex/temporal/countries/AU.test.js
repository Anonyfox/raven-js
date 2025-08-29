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
import { AU } from "./AU.js";

describe("Australian holiday definitions (AU)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof AU === "object");
			assert.ok(Array.isArray(AU.national));
			assert.ok(typeof AU.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(AU.national.length > 0);

			for (const holiday of AU.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const states = Object.keys(AU.regional);

			for (const state of states) {
				assert.ok(Array.isArray(AU.regional[state]));

				for (const holiday of AU.regional[state]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 9 national holidays", () => {
			// Australia has 9 national public holidays
			assert.strictEqual(AU.national.length, 9);
		});

		it("should have all states and territories", () => {
			const states = Object.keys(AU.regional);
			assert.ok(states.length >= 8); // 6 states + 2 territories
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = AU.national.map((h) => h.name);

			const expectedHolidays = [
				"New Year's Day",
				"Australia Day",
				"Good Friday",
				"Easter Saturday",
				"Easter Monday",
				"ANZAC Day",
				"Queen's Birthday",
				"Christmas Day",
				"Boxing Day",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have Victoria state holidays", () => {
			assert.ok(AU.regional.VIC);
			const victoriaNames = AU.regional.VIC.map((h) => h.name);

			assert.ok(victoriaNames.includes("Labour Day"));
			assert.ok(victoriaNames.includes("Melbourne Cup Day"));
		});

		it("should have Western Australia state holidays", () => {
			assert.ok(AU.regional.WA);
			const waNames = AU.regional.WA.map((h) => h.name);

			assert.ok(waNames.includes("Labour Day"));
			assert.ok(waNames.includes("Western Australia Day"));
			assert.ok(waNames.includes("Queen's Birthday")); // Different date than national
		});

		it("should have Queensland state holidays", () => {
			assert.ok(AU.regional.QLD);
			const qldNames = AU.regional.QLD.map((h) => h.name);

			assert.ok(qldNames.includes("Labour Day"));
			assert.ok(qldNames.includes("RNA Show Day"));
		});

		it("should have different Labour Day dates by state", () => {
			// Victoria: Second Monday in March
			const vicLabour = AU.regional.VIC.find((h) => h.name === "Labour Day");
			assert.ok(vicLabour);

			// Queensland: First Monday in May
			const qldLabour = AU.regional.QLD.find((h) => h.name === "Labour Day");
			assert.ok(qldLabour);

			// Western Australia: First Monday in March
			const waLabour = AU.regional.WA.find((h) => h.name === "Labour Day");
			assert.ok(waLabour);

			// Calculate 2024 dates to verify they're different
			const vicDate = vicLabour.calculateHoliday(2024);
			const qldDate = qldLabour.calculateHoliday(2024);
			const waDate = waLabour.calculateHoliday(2024);

			// All should be Mondays but on different dates
			assert.strictEqual(vicDate.date.getUTCDay(), 1);
			assert.strictEqual(qldDate.date.getUTCDay(), 1);
			assert.strictEqual(waDate.date.getUTCDay(), 1);

			// They should be in different months
			assert.notStrictEqual(
				vicDate.date.getUTCMonth(),
				qldDate.date.getUTCMonth(),
			);
			assert.notStrictEqual(
				waDate.date.getUTCMonth(),
				qldDate.date.getUTCMonth(),
			);
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = AU.national.find((h) => h.name === "New Year's Day");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Australia Day correctly", () => {
			const australiaDay = AU.national.find((h) => h.name === "Australia Day");
			assert.ok(australiaDay);

			const holiday2024 = australiaDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 26);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate ANZAC Day correctly", () => {
			const anzacDay = AU.national.find((h) => h.name === "ANZAC Day");
			assert.ok(anzacDay);

			const holiday2024 = anzacDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 3); // April
			assert.strictEqual(holiday2024.date.getUTCDate(), 25);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Queen's Birthday correctly", () => {
			const queensBirthday = AU.national.find(
				(h) => h.name === "Queen's Birthday",
			);
			assert.ok(queensBirthday);
			assert.strictEqual(queensBirthday.type, "calculated");

			const holiday2024 = queensBirthday.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 5); // June
			assert.strictEqual(holiday2024.date.getUTCDay(), 1); // Monday
			assert.strictEqual(holiday2024.workFree, true);

			// Should be second Monday in June
			assert.ok(holiday2024.date.getUTCDate() >= 8);
			assert.ok(holiday2024.date.getUTCDate() <= 14);
		});

		it("should calculate Melbourne Cup Day correctly", () => {
			const melbourneCup = AU.regional.VIC.find(
				(h) => h.name === "Melbourne Cup Day",
			);
			assert.ok(melbourneCup);
			assert.strictEqual(melbourneCup.type, "calculated");

			const holiday2024 = melbourneCup.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 10); // November
			assert.strictEqual(holiday2024.date.getUTCDay(), 2); // Tuesday
			assert.strictEqual(holiday2024.workFree, true);

			// Should be first Tuesday in November
			assert.ok(holiday2024.date.getUTCDate() <= 7);
		});

		it("should handle Easter-relative holidays", () => {
			const easterHolidays = AU.national.filter(
				(h) => h.type === "easter_relative",
			);

			assert.strictEqual(easterHolidays.length, 3); // Good Friday, Easter Saturday, Easter Monday

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
			const allHolidays = [
				...AU.national,
				...Object.values(AU.regional).flat(),
			];

			for (const holiday of allHolidays) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.strictEqual(holiday.workFree, true); // All Australian holidays are work-free

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain Australian institutional memory", () => {
			const allNames = [
				...AU.national.map((h) => h.name),
				...Object.values(AU.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core Australian holidays that should always be present
			const coreHolidays = [
				"New Year's Day",
				"Australia Day",
				"ANZAC Day",
				"Christmas Day",
				"Boxing Day",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Australian holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
