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
import { NZ } from "./NZ.js";

describe("New Zealand holiday definitions (NZ)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof NZ === "object");
			assert.ok(Array.isArray(NZ.national));
			assert.ok(typeof NZ.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(NZ.national.length > 0);

			for (const holiday of NZ.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const regions = Object.keys(NZ.regional);

			for (const region of regions) {
				assert.ok(Array.isArray(NZ.regional[region]));

				for (const holiday of NZ.regional[region]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 11 national holidays", () => {
			// New Zealand has 11 national public holidays
			assert.strictEqual(NZ.national.length, 11);
		});

		it("should have provincial anniversary days", () => {
			const regions = Object.keys(NZ.regional);
			assert.ok(regions.length >= 11); // Multiple provincial regions
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = NZ.national.map((h) => h.name);

			const expectedHolidays = [
				"New Year's Day",
				"Day after New Year's Day",
				"Waitangi Day",
				"Good Friday",
				"Easter Monday",
				"ANZAC Day",
				"Queen's Birthday",
				"Matariki",
				"Labour Day",
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

		it("should have Auckland anniversary day", () => {
			assert.ok(NZ.regional.AUK);
			const aucklandNames = NZ.regional.AUK.map((h) => h.name);

			assert.ok(aucklandNames.includes("Auckland Anniversary Day"));
		});

		it("should have Wellington anniversary day", () => {
			assert.ok(NZ.regional.WGN);
			const wellingtonNames = NZ.regional.WGN.map((h) => h.name);

			assert.ok(wellingtonNames.includes("Wellington Anniversary Day"));
		});

		it("should have Canterbury anniversary day", () => {
			assert.ok(NZ.regional.CAN);
			const canterburyNames = NZ.regional.CAN.map((h) => h.name);

			assert.ok(canterburyNames.includes("Canterbury Anniversary Day"));
		});

		it("should have unique anniversary days", () => {
			const anniversaryDays = [
				"Auckland Anniversary Day",
				"Wellington Anniversary Day",
				"Canterbury Anniversary Day",
				"Otago Anniversary Day",
				"Southland Anniversary Day",
				"Taranaki Anniversary Day",
				"Hawke's Bay Anniversary Day",
				"Marlborough Anniversary Day",
				"Nelson Anniversary Day",
				"Westland Anniversary Day",
				"Chatham Islands Anniversary Day",
			];

			const allRegionalNames = Object.values(NZ.regional)
				.flat()
				.map((h) => h.name);

			for (const anniversary of anniversaryDays) {
				assert.ok(
					allRegionalNames.includes(anniversary),
					`Missing anniversary day: ${anniversary}`,
				);
			}
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = NZ.national.find((h) => h.name === "New Year's Day");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Waitangi Day correctly", () => {
			const waitangiDay = NZ.national.find((h) => h.name === "Waitangi Day");
			assert.ok(waitangiDay);

			const holiday2024 = waitangiDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 1); // February
			assert.strictEqual(holiday2024.date.getUTCDate(), 6);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate ANZAC Day correctly", () => {
			const anzacDay = NZ.national.find((h) => h.name === "ANZAC Day");
			assert.ok(anzacDay);

			const holiday2024 = anzacDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 3); // April
			assert.strictEqual(holiday2024.date.getUTCDate(), 25);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Queen's Birthday correctly", () => {
			const queensBirthday = NZ.national.find(
				(h) => h.name === "Queen's Birthday",
			);
			assert.ok(queensBirthday);
			assert.strictEqual(queensBirthday.type, "calculated");

			const holiday2024 = queensBirthday.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 5); // June
			assert.strictEqual(holiday2024.date.getUTCDay(), 1); // Monday
			assert.strictEqual(holiday2024.workFree, true);

			// Should be first Monday in June
			assert.ok(holiday2024.date.getUTCDate() <= 7);
		});

		it("should calculate Labour Day correctly", () => {
			const labourDay = NZ.national.find((h) => h.name === "Labour Day");
			assert.ok(labourDay);
			assert.strictEqual(labourDay.type, "calculated");

			const holiday2024 = labourDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 9); // October
			assert.strictEqual(holiday2024.date.getUTCDay(), 1); // Monday
			assert.strictEqual(holiday2024.workFree, true);

			// Should be fourth Monday in October
			assert.ok(holiday2024.date.getUTCDate() >= 22);
		});

		it("should calculate anniversary days correctly", () => {
			// Auckland Anniversary Day - Monday closest to January 29
			const aucklandAnniversary = NZ.regional.AUK.find(
				(h) => h.name === "Auckland Anniversary Day",
			);
			assert.ok(aucklandAnniversary);

			const aucklandDate = aucklandAnniversary.calculateHoliday(2024);
			assert.strictEqual(aucklandDate.date.getUTCMonth(), 0); // January
			assert.strictEqual(aucklandDate.date.getUTCDay(), 1); // Monday

			// Wellington Anniversary Day - Monday closest to January 22
			const wellingtonAnniversary = NZ.regional.WGN.find(
				(h) => h.name === "Wellington Anniversary Day",
			);
			assert.ok(wellingtonAnniversary);

			const wellingtonDate = wellingtonAnniversary.calculateHoliday(2024);
			assert.strictEqual(wellingtonDate.date.getUTCMonth(), 0); // January
			assert.strictEqual(wellingtonDate.date.getUTCDay(), 1); // Monday
		});

		it("should handle Easter-relative holidays", () => {
			const easterHolidays = [
				...NZ.national.filter((h) => h.type === "easter_relative"),
				...Object.values(NZ.regional)
					.flat()
					.filter((h) => h.type === "easter_relative"),
			];

			assert.ok(easterHolidays.length >= 3); // Good Friday, Easter Monday, Southland Anniversary

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
				...NZ.national,
				...Object.values(NZ.regional).flat(),
			];

			for (const holiday of allHolidays) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.strictEqual(holiday.workFree, true); // All NZ holidays are work-free

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain New Zealand institutional memory", () => {
			const allNames = [
				...NZ.national.map((h) => h.name),
				...Object.values(NZ.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core New Zealand holidays that should always be present
			const coreHolidays = [
				"New Year's Day",
				"Waitangi Day",
				"ANZAC Day",
				"Queen's Birthday",
				"Christmas Day",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core New Zealand holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
