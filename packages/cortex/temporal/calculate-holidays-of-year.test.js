/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { calculateHolidaysOfYear } from "./calculate-holidays-of-year.js";
import { DE } from "./countries/DE.js";

describe("calculateHolidaysOfYear function", () => {
	describe("API validation", () => {
		it("should validate country definitions parameter", () => {
			assert.throws(() => calculateHolidaysOfYear(null, { year: 2024 }), {
				message: /Country definitions must be a valid object/,
			});

			assert.throws(() => calculateHolidaysOfYear("invalid", { year: 2024 }), {
				message: /Country definitions must be a valid object/,
			});

			assert.throws(() => calculateHolidaysOfYear({}, { year: 2024 }), {
				message: /Country definitions must have a 'national' array/,
			});

			assert.throws(
				() =>
					calculateHolidaysOfYear({ national: "not array" }, { year: 2024 }),
				{
					message: /Country definitions must have a 'national' array/,
				},
			);
		});

		it("should validate options parameter", () => {
			assert.throws(() => calculateHolidaysOfYear(DE, {}), {
				message: /Year must be an integer/,
			});

			assert.throws(() => calculateHolidaysOfYear(DE, { year: "2024" }), {
				message: /Year must be an integer/,
			});

			assert.throws(() => calculateHolidaysOfYear(DE, { year: 1582 }), {
				message: /Year must be >= 1583/,
			});
		});
	});

	describe("Holiday calculation", () => {
		it("should calculate German holidays for 2024", () => {
			const holidays = calculateHolidaysOfYear(DE, { year: 2024 });

			assert.ok(Array.isArray(holidays));
			assert.ok(holidays.length > 0);

			// Check structure of first holiday
			const firstHoliday = holidays[0];
			assert.strictEqual(typeof firstHoliday.name, "string");
			assert.ok(firstHoliday.date instanceof Date);
			assert.strictEqual(typeof firstHoliday.workFree, "boolean");
			assert.ok(["national", "regional"].includes(firstHoliday.scope));
			assert.ok(
				["fixed", "easter_relative", "calculated"].includes(firstHoliday.type),
			);
		});

		it("should include regional holidays when requested", () => {
			const nationalOnly = calculateHolidaysOfYear(DE, {
				year: 2024,
				includeRegional: false,
			});

			const withRegional = calculateHolidaysOfYear(DE, {
				year: 2024,
				region: "BY",
				includeRegional: true,
			});

			assert.ok(withRegional.length >= nationalOnly.length);
		});

		it("should filter work-free holidays correctly", () => {
			const workFreeOnly = calculateHolidaysOfYear(DE, {
				year: 2024,
				includeWorkdays: false,
			});

			const allHolidays = calculateHolidaysOfYear(DE, {
				year: 2024,
				includeWorkdays: true,
			});

			assert.ok(allHolidays.length >= workFreeOnly.length);

			// All in workFreeOnly should be work-free
			for (const holiday of workFreeOnly) {
				assert.strictEqual(holiday.workFree, true);
			}
		});

		it("should return holidays sorted by date", () => {
			const holidays = calculateHolidaysOfYear(DE, { year: 2024 });

			for (let i = 1; i < holidays.length; i++) {
				assert.ok(holidays[i - 1].date.getTime() <= holidays[i].date.getTime());
			}
		});
	});

	describe("Tree-shaking compatibility", () => {
		it("should work with imported country definitions", () => {
			// This test verifies that the function works with externally imported definitions
			const holidays = calculateHolidaysOfYear(DE, { year: 2024 });

			assert.ok(holidays.length > 0);
			assert.strictEqual(holidays[0].name, "Neujahr");
		});

		it("should handle custom country definitions", () => {
			const customCountry = {
				national: [
					DE.national[0], // Just New Year for testing
				],
				regional: {},
			};

			const holidays = calculateHolidaysOfYear(customCountry, { year: 2024 });

			assert.strictEqual(holidays.length, 1);
			assert.strictEqual(holidays[0].name, "Neujahr");
		});
	});

	describe("Multi-year consistency", () => {
		it("should calculate holidays for different years", () => {
			const holidays2023 = calculateHolidaysOfYear(DE, { year: 2023 });
			const holidays2024 = calculateHolidaysOfYear(DE, { year: 2024 });
			const holidays2025 = calculateHolidaysOfYear(DE, { year: 2025 });

			// Should have same number of national holidays each year
			assert.strictEqual(holidays2023.length, holidays2024.length);
			assert.strictEqual(holidays2024.length, holidays2025.length);

			// Should have same holiday names but different dates
			const names2023 = holidays2023.map((h) => h.name).sort();
			const names2024 = holidays2024.map((h) => h.name).sort();
			assert.deepStrictEqual(names2023, names2024);
		});

		it("should handle leap years correctly", () => {
			const leapYear = calculateHolidaysOfYear(DE, { year: 2024 }); // Leap year
			const normalYear = calculateHolidaysOfYear(DE, { year: 2023 }); // Normal year

			// Should work for both types of years
			assert.ok(leapYear.length > 0);
			assert.ok(normalYear.length > 0);
		});
	});

	describe("Performance and memory", () => {
		it("should handle large year ranges efficiently", () => {
			const years = [
				2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
			];

			const startTime = performance.now();

			for (const year of years) {
				const holidays = calculateHolidaysOfYear(DE, { year });
				assert.ok(holidays.length > 0);
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			// Should complete within reasonable time (generous limit for CI)
			assert.ok(
				duration < 1000,
				`Performance test took ${duration}ms, expected < 1000ms`,
			);
		});

		it("should return immutable holiday objects", () => {
			const holidays = calculateHolidaysOfYear(DE, { year: 2024 });
			const firstHoliday = holidays[0];

			assert.ok(Object.isFrozen(firstHoliday));

			// Attempt to modify should fail silently or throw
			const originalName = firstHoliday.name;
			try {
				firstHoliday.name = "Modified";
			} catch (_error) {
				// Expected in strict mode
			}
			assert.strictEqual(firstHoliday.name, originalName);
		});
	});
});
