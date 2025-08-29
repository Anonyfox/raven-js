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
import { JP } from "./JP.js";

describe("Japanese holiday definitions (JP)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof JP === "object");
			assert.ok(Array.isArray(JP.national));
			assert.ok(typeof JP.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(JP.national.length > 0);

			for (const holiday of JP.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 16 national holidays", () => {
			// Japan has 16 national holidays
			assert.strictEqual(JP.national.length, 16);
		});

		it("should have no regional variations", () => {
			// Japan has unified national holiday system
			const regions = Object.keys(JP.regional);
			assert.strictEqual(regions.length, 0);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = JP.national.map((h) => h.name);

			const expectedHolidays = [
				"元日", // New Year's Day
				"成人の日", // Coming of Age Day
				"建国記念の日", // National Foundation Day
				"天皇誕生日", // Emperor's Birthday
				"春分の日", // Vernal Equinox Day
				"昭和の日", // Showa Day
				"憲法記念日", // Constitution Memorial Day
				"みどりの日", // Greenery Day
				"こどもの日", // Children's Day
				"海の日", // Marine Day
				"山の日", // Mountain Day
				"敬老の日", // Respect for the Aged Day
				"秋分の日", // Autumnal Equinox Day
				"スポーツの日", // Health and Sports Day
				"文化の日", // Culture Day
				"勤労感謝の日", // Labor Thanksgiving Day
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have Golden Week holidays", () => {
			const nationalNames = JP.national.map((h) => h.name);

			// Golden Week holidays
			const goldenWeekHolidays = [
				"昭和の日", // Showa Day (Apr 29)
				"憲法記念日", // Constitution Memorial Day (May 3)
				"みどりの日", // Greenery Day (May 4)
				"こどもの日", // Children's Day (May 5)
			];

			for (const holiday of goldenWeekHolidays) {
				assert.ok(
					nationalNames.includes(holiday),
					`Missing Golden Week holiday: ${holiday}`,
				);
			}
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = JP.national.find((h) => h.name === "元日");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Mountain Day correctly", () => {
			const mountainDay = JP.national.find((h) => h.name === "山の日");
			assert.ok(mountainDay);

			const holiday2024 = mountainDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 7); // August
			assert.strictEqual(holiday2024.date.getUTCDate(), 11);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Constitution Memorial Day correctly", () => {
			const constitutionDay = JP.national.find((h) => h.name === "憲法記念日");
			assert.ok(constitutionDay);

			const holiday2024 = constitutionDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 3);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle Monday holidays correctly", () => {
			const mondayHolidays = JP.national.filter((h) => h.type === "calculated");

			for (const holiday of mondayHolidays) {
				assert.strictEqual(typeof holiday.calculator, "function");

				// Test the calculation
				const result = holiday.calculateHoliday(2024);
				assert.ok(result.date instanceof Date);

				// Should be a Monday (unless it's equinox days)
				if (!holiday.name.includes("分の日")) {
					assert.strictEqual(result.date.getUTCDay(), 1); // Monday
				}
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of JP.national) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.strictEqual(holiday.workFree, true); // All Japanese holidays are work-free

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain Japanese institutional memory", () => {
			const allNames = JP.national.map((h) => h.name);

			// Core Japanese holidays that should always be present
			const coreHolidays = [
				"元日", // New Year
				"憲法記念日", // Constitution Memorial Day
				"天皇誕生日", // Emperor's Birthday
				"こどもの日", // Children's Day
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Japanese holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
