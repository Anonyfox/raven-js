/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { calculateHolidaysOfYear } from "./index.js";

describe("calculateHolidaysOfYear", () => {
	describe("Basic functionality", () => {
		it("should calculate German national holidays for 2024", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
			});

			// Should have 9 national holidays
			assert.strictEqual(holidays.length, 9);

			// All should be work-free national holidays
			holidays.forEach((holiday) => {
				assert.strictEqual(holiday.workFree, true);
				assert.strictEqual(holiday.scope, "national");
			});

			// Check specific dates for 2024
			const expectedDates = [
				{ name: "Neujahr", month: 1, day: 1 },
				{ name: "Karfreitag", month: 3, day: 29 },
				{ name: "Ostermontag", month: 4, day: 1 },
				{ name: "Tag der Arbeit", month: 5, day: 1 },
				{ name: "Christi Himmelfahrt", month: 5, day: 9 },
				{ name: "Pfingstmontag", month: 5, day: 20 },
				{ name: "Tag der Deutschen Einheit", month: 10, day: 3 },
				{ name: "Erster Weihnachtstag", month: 12, day: 25 },
				{ name: "Zweiter Weihnachtstag", month: 12, day: 26 },
			];

			expectedDates.forEach(({ name, month, day }) => {
				const holiday = holidays.find((h) => h.name === name);
				assert.ok(holiday, `Missing holiday: ${name}`);
				assert.strictEqual(holiday.date.getUTCMonth() + 1, month);
				assert.strictEqual(holiday.date.getUTCDate(), day);
			});
		});

		it("should be sorted by date", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
			});

			for (let i = 1; i < holidays.length; i++) {
				assert.ok(
					holidays[i - 1].date <= holidays[i].date,
					`Holidays should be sorted by date: ${holidays[i - 1].name} vs ${holidays[i].name}`,
				);
			}
		});
	});

	describe("Regional holidays", () => {
		it("should include Bavaria regional holidays", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				region: "BY",
				includeRegional: true,
			});

			// Should have 9 national + 4 Bavaria regional = 13 total
			assert.strictEqual(holidays.length, 13);

			// Check for Bavaria-specific holidays
			const expectedRegional = [
				"Heilige Drei Könige",
				"Fronleichnam",
				"Mariä Himmelfahrt",
				"Allerheiligen",
			];

			expectedRegional.forEach((name) => {
				const holiday = holidays.find((h) => h.name === name);
				assert.ok(holiday, `Missing Bavaria holiday: ${name}`);
				assert.strictEqual(holiday.scope, "regional");
			});
		});

		it("should exclude regional holidays when includeRegional is false", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				region: "BY",
				includeRegional: false,
			});

			// Should only have 9 national holidays
			assert.strictEqual(holidays.length, 9);
			holidays.forEach((holiday) => {
				assert.strictEqual(holiday.scope, "national");
			});
		});

		it("should work without region parameter", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				includeRegional: true, // Should be ignored when no region specified
			});

			// Should only have 9 national holidays
			assert.strictEqual(holidays.length, 9);
		});

		it("should handle Saxony calculated holiday", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				region: "SN",
				includeRegional: true,
			});

			const bussUndBettag = holidays.find((h) => h.name === "Buß- und Bettag");
			assert.ok(bussUndBettag, "Saxony should have Buß- und Bettag");
			assert.strictEqual(bussUndBettag.type, "calculated");
			assert.strictEqual(bussUndBettag.scope, "regional");

			// Should be November 20, 2024 (Wednesday)
			assert.strictEqual(bussUndBettag.date.getUTCMonth() + 1, 11);
			assert.strictEqual(bussUndBettag.date.getUTCDate(), 20);
			assert.strictEqual(bussUndBettag.date.getUTCDay(), 3); // Wednesday
		});
	});

	describe("Options validation", () => {
		it("should reject invalid options structure", () => {
			assert.throws(() => calculateHolidaysOfYear({}), {
				message: /Invalid holiday calculation options/,
			});

			assert.throws(
				() => calculateHolidaysOfYear({ year: "2024", country: "DE" }),
				{ message: /Invalid holiday calculation options/ },
			);
		});

		it("should reject invalid year", () => {
			assert.throws(
				() => calculateHolidaysOfYear({ year: 1582, country: "DE" }),
				{ message: /Year must be an integer >= 1583/ },
			);

			assert.throws(
				() => calculateHolidaysOfYear({ year: 2024.5, country: "DE" }),
				{ message: /Year must be an integer >= 1583/ },
			);
		});

		it("should reject invalid country", () => {
			assert.throws(
				() => calculateHolidaysOfYear({ year: 2024, country: "" }),
				{ message: /Country must be a non-empty string/ },
			);

			assert.throws(
				() => calculateHolidaysOfYear({ year: 2024, country: 123 }),
				{ message: /Invalid holiday calculation options/ },
			);
		});

		it("should reject unsupported country", () => {
			assert.throws(
				() => calculateHolidaysOfYear({ year: 2024, country: "XX" }),
				{ message: /Unsupported country: XX/ },
			);
		});

		it("should reject unsupported region", () => {
			assert.throws(
				() =>
					calculateHolidaysOfYear({
						year: 2024,
						country: "DE",
						region: "XX",
					}),
				{ message: /Unsupported region: XX for country DE/ },
			);
		});

		it("should accept supported regions", () => {
			const validRegions = [
				"BW",
				"BY",
				"BE",
				"BB",
				"HB",
				"HH",
				"HE",
				"MV",
				"NI",
				"NW",
				"RP",
				"SL",
				"SN",
				"ST",
				"SH",
				"TH",
			];

			validRegions.forEach((region) => {
				assert.doesNotThrow(() => {
					const holidays = calculateHolidaysOfYear({
						year: 2024,
						country: "DE",
						region,
					});
					assert.ok(Array.isArray(holidays));
				});
			});
		});
	});

	describe("Options defaults", () => {
		it("should apply correct defaults", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
			});

			// Should only include work-free holidays (default includeWorkdays = false)
			holidays.forEach((holiday) => {
				assert.strictEqual(holiday.workFree, true);
			});

			// Should only include national holidays (no region specified)
			holidays.forEach((holiday) => {
				assert.strictEqual(holiday.scope, "national");
			});
		});

		it("should handle explicit defaults", () => {
			const holidays1 = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				region: "",
				includeWorkdays: false,
				includeRegional: true,
			});

			const holidays2 = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
			});

			assert.deepStrictEqual(
				holidays1.map((h) => h.name),
				holidays2.map((h) => h.name),
			);
		});
	});

	describe("includeWorkdays option", () => {
		it("should include work-free holidays when includeWorkdays is false", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				includeWorkdays: false,
			});

			holidays.forEach((holiday) => {
				assert.strictEqual(
					holiday.workFree,
					true,
					`${holiday.name} should be work-free`,
				);
			});
		});

		it("should include all holidays when includeWorkdays is true", () => {
			// Note: Currently all German holidays are work-free,
			// so this test is mainly for API coverage
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				includeWorkdays: true,
			});

			// Should still have same count since all German holidays are work-free
			assert.strictEqual(holidays.length, 9);
		});
	});

	describe("Date properties", () => {
		it("should return proper Date objects", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
			});

			holidays.forEach((holiday) => {
				assert.ok(holiday.date instanceof Date);
				assert.strictEqual(holiday.date.getUTCFullYear(), 2024);
			});
		});

		it("should maintain midnight UTC time", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
			});

			holidays.forEach((holiday) => {
				assert.strictEqual(holiday.date.getUTCHours(), 0);
				assert.strictEqual(holiday.date.getUTCMinutes(), 0);
				assert.strictEqual(holiday.date.getUTCSeconds(), 0);
				assert.strictEqual(holiday.date.getUTCMilliseconds(), 0);
			});
		});

		it("should have consistent date format", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
			});

			holidays.forEach((holiday) => {
				// Date should be in 2024
				assert.strictEqual(holiday.date.getUTCFullYear(), 2024);

				// Should be valid month/day
				const month = holiday.date.getUTCMonth() + 1;
				const day = holiday.date.getUTCDate();
				assert.ok(month >= 1 && month <= 12, `Invalid month: ${month}`);
				assert.ok(day >= 1 && day <= 31, `Invalid day: ${day}`);
			});
		});
	});

	describe("Holiday object structure", () => {
		it("should return correct holiday object structure", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
			});

			holidays.forEach((holiday) => {
				// Required properties
				assert.ok(typeof holiday.name === "string");
				assert.ok(holiday.date instanceof Date);
				assert.ok(typeof holiday.workFree === "boolean");
				assert.ok(["national", "regional"].includes(holiday.scope));
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);

				// Name should not be empty
				assert.ok(holiday.name.length > 0);
			});
		});

		it("should have proper metadata for different holiday types", () => {
			const holidays = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				region: "BY",
				includeRegional: true,
			});

			// Find examples of each type
			const fixedHoliday = holidays.find((h) => h.type === "fixed");
			const easterHoliday = holidays.find((h) => h.type === "easter_relative");

			assert.ok(fixedHoliday, "Should have fixed holiday");
			assert.ok(easterHoliday, "Should have easter relative holiday");

			assert.strictEqual(fixedHoliday.type, "fixed");
			assert.strictEqual(easterHoliday.type, "easter_relative");
		});
	});

	describe("Performance and edge cases", () => {
		it("should handle multiple years efficiently", () => {
			const years = [2020, 2021, 2022, 2023, 2024, 2025];

			years.forEach((year) => {
				const holidays = calculateHolidaysOfYear({
					year,
					country: "DE",
				});

				assert.strictEqual(holidays.length, 9);
				holidays.forEach((holiday) => {
					assert.strictEqual(holiday.date.getUTCFullYear(), year);
				});
			});
		});

		it("should handle leap years correctly", () => {
			// 2024 is a leap year
			const holidays2024 = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
			});

			// 2023 is not a leap year
			const holidays2023 = calculateHolidaysOfYear({
				year: 2023,
				country: "DE",
			});

			// Both should have same number of holidays
			assert.strictEqual(holidays2024.length, holidays2023.length);

			// Easter dates should be different
			const easter2024 = holidays2024.find((h) => h.name === "Ostermontag");
			const easter2023 = holidays2023.find((h) => h.name === "Ostermontag");

			assert.notStrictEqual(
				easter2024.date.getTime(),
				easter2023.date.getTime(),
			);
		});

		it("should be deterministic", () => {
			const holidays1 = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				region: "BY",
			});

			const holidays2 = calculateHolidaysOfYear({
				year: 2024,
				country: "DE",
				region: "BY",
			});

			assert.strictEqual(holidays1.length, holidays2.length);

			holidays1.forEach((holiday1, index) => {
				const holiday2 = holidays2[index];
				assert.strictEqual(holiday1.name, holiday2.name);
				assert.strictEqual(holiday1.date.getTime(), holiday2.date.getTime());
				assert.strictEqual(holiday1.workFree, holiday2.workFree);
				assert.strictEqual(holiday1.scope, holiday2.scope);
				assert.strictEqual(holiday1.type, holiday2.type);
			});
		});

		it("should handle extreme years", () => {
			const extremeYears = [1583, 1600, 1900, 2000, 3000];

			extremeYears.forEach((year) => {
				assert.doesNotThrow(() => {
					const holidays = calculateHolidaysOfYear({
						year,
						country: "DE",
					});
					assert.ok(Array.isArray(holidays));
					assert.strictEqual(holidays.length, 9);
				});
			});
		});
	});

	describe("Export validation", () => {
		it("should export calculateHolidaysOfYear function", () => {
			assert.strictEqual(typeof calculateHolidaysOfYear, "function");
		});
	});
});
