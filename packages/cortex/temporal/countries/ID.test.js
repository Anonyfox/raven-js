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
import { ID } from "./ID.js";

describe("Indonesian holiday definitions (ID)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof ID === "object");
			assert.ok(Array.isArray(ID.national));
			assert.ok(typeof ID.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(ID.national.length > 0);

			for (const holiday of ID.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 13 national holidays", () => {
			// Indonesia has 13 official national holidays
			assert.strictEqual(ID.national.length, 13);
		});

		it("should have no regional variations", () => {
			// Indonesia has unified national holiday system
			const regions = Object.keys(ID.regional);
			assert.strictEqual(regions.length, 0);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = ID.national.map((h) => h.name);

			const expectedHolidays = [
				"Tahun Baru Masehi", // New Year's Day
				"Tahun Baru Imlek", // Chinese New Year
				"Hari Raya Nyepi", // Nyepi (Balinese New Year)
				"Wafat Isa Al-Masih", // Good Friday
				"Hari Raya Idul Fitri", // Eid al-Fitr
				"Hari Buruh", // Labor Day
				"Hari Raya Waisak", // Vesak Day
				"Kenaikan Isa Al-Masih", // Ascension of Jesus Christ
				"Hari Raya Idul Adha", // Eid al-Adha
				"Hari Kemerdekaan", // Independence Day
				"Tahun Baru Islam", // Islamic New Year
				"Maulid Nabi Muhammad", // Prophet Muhammad's Birthday
				"Hari Raya Natal", // Christmas Day
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have multicultural religious holidays", () => {
			const nationalNames = ID.national.map((h) => h.name);

			// Islamic holidays
			assert.ok(nationalNames.includes("Hari Raya Idul Fitri"));
			assert.ok(nationalNames.includes("Hari Raya Idul Adha"));

			// Christian holidays
			assert.ok(nationalNames.includes("Wafat Isa Al-Masih"));
			assert.ok(nationalNames.includes("Hari Raya Natal"));

			// Hindu holiday
			assert.ok(nationalNames.includes("Hari Raya Nyepi"));

			// Buddhist holiday
			assert.ok(nationalNames.includes("Hari Raya Waisak"));

			// Chinese holiday
			assert.ok(nationalNames.includes("Tahun Baru Imlek"));
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = ID.national.find((h) => h.name === "Tahun Baru Masehi");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Independence Day correctly", () => {
			const independenceDay = ID.national.find(
				(h) => h.name === "Hari Kemerdekaan",
			);
			assert.ok(independenceDay);

			const holiday2024 = independenceDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 7); // August
			assert.strictEqual(holiday2024.date.getUTCDate(), 17);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Labor Day correctly", () => {
			const laborDay = ID.national.find((h) => h.name === "Hari Buruh");
			assert.ok(laborDay);

			const holiday2024 = laborDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle calculated holidays", () => {
			const calculatedHolidays = ID.national.filter(
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
			const easterHolidays = ID.national.filter(
				(h) => h.type === "easter_relative",
			);

			for (const holiday of easterHolidays) {
				// Test the calculation
				const easterSunday = new Date(Date.UTC(2024, 2, 31)); // March 31, 2024
				const result = holiday.calculateHoliday(2024, easterSunday);
				assert.ok(result.date instanceof Date);
				assert.strictEqual(holiday.workFree, true);
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of ID.national) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.strictEqual(holiday.workFree, true); // All Indonesian holidays are work-free

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain Indonesian institutional memory", () => {
			const allNames = ID.national.map((h) => h.name);

			// Core Indonesian holidays that should always be present
			const coreHolidays = [
				"Tahun Baru Masehi", // New Year
				"Hari Kemerdekaan", // Independence Day
				"Hari Raya Idul Fitri", // Eid al-Fitr
				"Hari Raya Natal", // Christmas
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Indonesian holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
