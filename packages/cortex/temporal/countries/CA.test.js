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
import { CA } from "./CA.js";

describe("Canadian holiday definitions (CA)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof CA === "object");
			assert.ok(Array.isArray(CA.national));
			assert.ok(typeof CA.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(CA.national.length > 0);

			for (const holiday of CA.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const provinces = Object.keys(CA.regional);

			for (const province of provinces) {
				assert.ok(Array.isArray(CA.regional[province]));

				for (const holiday of CA.regional[province]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 11 federal holidays", () => {
			// Canada has 11 federal holidays
			assert.strictEqual(CA.national.length, 11);
		});

		it("should have all provinces and territories", () => {
			const provinces = Object.keys(CA.regional);
			assert.ok(provinces.length >= 13); // 10 provinces + 3 territories
		});
	});

	describe("Holiday validation", () => {
		it("should have expected federal holidays", () => {
			const nationalNames = CA.national.map((h) => h.name);

			const expectedHolidays = [
				"New Year's Day",
				"Good Friday",
				"Easter Monday",
				"Victoria Day",
				"Canada Day",
				"Labour Day",
				"National Day for Truth and Reconciliation",
				"Thanksgiving",
				"Remembrance Day",
				"Christmas Day",
				"Boxing Day",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing federal holiday: ${expected}`,
				);
			}
		});

		it("should have Quebec provincial holidays", () => {
			assert.ok(CA.regional.QC);
			const quebecNames = CA.regional.QC.map((h) => h.name);

			assert.ok(quebecNames.includes("Saint-Jean-Baptiste Day"));
		});

		it("should have Newfoundland provincial holidays", () => {
			assert.ok(CA.regional.NL);
			const nfldNames = CA.regional.NL.map((h) => h.name);

			assert.ok(nfldNames.includes("St. Patrick's Day"));
			assert.ok(nfldNames.includes("St. George's Day"));
			assert.ok(nfldNames.includes("Discovery Day"));
			assert.ok(nfldNames.includes("Orangemen's Day"));
		});

		it("should have territorial holidays", () => {
			// Northwest Territories
			assert.ok(CA.regional.NT);
			const ntNames = CA.regional.NT.map((h) => h.name);
			assert.ok(ntNames.includes("National Indigenous Peoples Day"));

			// Nunavut
			assert.ok(CA.regional.NU);
			const nuNames = CA.regional.NU.map((h) => h.name);
			assert.ok(nuNames.includes("Nunavut Day"));

			// Yukon
			assert.ok(CA.regional.YT);
			const ytNames = CA.regional.YT.map((h) => h.name);
			assert.ok(ytNames.includes("Heritage Day"));
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = CA.national.find((h) => h.name === "New Year's Day");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Canada Day correctly", () => {
			const canadaDay = CA.national.find((h) => h.name === "Canada Day");
			assert.ok(canadaDay);

			const holiday2024 = canadaDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 6); // July
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Victoria Day correctly", () => {
			const victoriaDay = CA.national.find((h) => h.name === "Victoria Day");
			assert.ok(victoriaDay);
			assert.strictEqual(victoriaDay.type, "calculated");

			const holiday2024 = victoriaDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDay(), 1); // Monday
			assert.strictEqual(holiday2024.workFree, true);

			// Should be Monday before May 25
			assert.ok(holiday2024.date.getUTCDate() <= 24);
		});

		it("should calculate Thanksgiving correctly", () => {
			const thanksgiving = CA.national.find((h) => h.name === "Thanksgiving");
			assert.ok(thanksgiving);
			assert.strictEqual(thanksgiving.type, "calculated");

			const holiday2024 = thanksgiving.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 9); // October
			assert.strictEqual(holiday2024.date.getUTCDay(), 1); // Monday
			assert.strictEqual(holiday2024.workFree, true);

			// Should be second Monday in October
			assert.ok(holiday2024.date.getUTCDate() >= 8);
			assert.ok(holiday2024.date.getUTCDate() <= 14);
		});

		it("should handle Easter-relative holidays", () => {
			const easterHolidays = CA.national.filter(
				(h) => h.type === "easter_relative",
			);

			assert.strictEqual(easterHolidays.length, 2); // Good Friday and Easter Monday

			for (const holiday of easterHolidays) {
				const easterSunday = new Date(Date.UTC(2024, 2, 31)); // March 31, 2024
				const result = holiday.calculateHoliday(2024, easterSunday);
				assert.ok(result.date instanceof Date);
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...CA.national,
				...Object.values(CA.regional).flat(),
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

		it("should maintain Canadian institutional memory", () => {
			const allNames = [
				...CA.national.map((h) => h.name),
				...Object.values(CA.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core Canadian holidays that should always be present
			const coreHolidays = [
				"New Year's Day",
				"Canada Day",
				"Thanksgiving",
				"Christmas Day",
				"Boxing Day",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Canadian holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
