/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { calculateEasterSunday } from "./calculate-easter-sunday.js";

describe("calculateEasterSunday", () => {
	describe("Historical accuracy", () => {
		it("should calculate known 21st century Easter dates", () => {
			// Verified Easter dates from astronomical sources
			const knownEasters = [
				{ year: 2000, month: 4, day: 23 }, // April 23, 2000
				{ year: 2001, month: 4, day: 15 }, // April 15, 2001
				{ year: 2010, month: 4, day: 4 }, // April 4, 2010
				{ year: 2020, month: 4, day: 12 }, // April 12, 2020
				{ year: 2024, month: 3, day: 31 }, // March 31, 2024
				{ year: 2025, month: 4, day: 20 }, // April 20, 2025
				{ year: 2030, month: 4, day: 21 }, // April 21, 2030
			];

			knownEasters.forEach(({ year, month, day }) => {
				const easter = calculateEasterSunday(year);
				assert.strictEqual(
					easter.getUTCFullYear(),
					year,
					`Year mismatch for ${year}`,
				);
				assert.strictEqual(
					easter.getUTCMonth() + 1,
					month,
					`Month mismatch for ${year}: expected ${month}, got ${easter.getUTCMonth() + 1}`,
				);
				assert.strictEqual(
					easter.getUTCDate(),
					day,
					`Day mismatch for ${year}: expected ${day}, got ${easter.getUTCDate()}`,
				);
			});
		});

		it("should calculate known 20th century Easter dates", () => {
			// Historical Easter dates for algorithm verification
			const historicalEasters = [
				{ year: 1900, month: 4, day: 15 }, // April 15, 1900
				{ year: 1920, month: 4, day: 4 }, // April 4, 1920
				{ year: 1950, month: 4, day: 9 }, // April 9, 1950
				{ year: 1970, month: 3, day: 29 }, // March 29, 1970
				{ year: 1980, month: 4, day: 6 }, // April 6, 1980
				{ year: 1990, month: 4, day: 15 }, // April 15, 1990
			];

			historicalEasters.forEach(({ year, month, day }) => {
				const easter = calculateEasterSunday(year);
				assert.strictEqual(easter.getUTCFullYear(), year);
				assert.strictEqual(easter.getUTCMonth() + 1, month);
				assert.strictEqual(easter.getUTCDate(), day);
			});
		});

		it("should handle century boundary years correctly", () => {
			// Century boundaries test Gregorian leap year rules
			const centuryBoundaries = [
				{ year: 1600, month: 4, day: 2 }, // April 2, 1600 (leap year)
				{ year: 1700, month: 4, day: 11 }, // April 11, 1700 (not leap)
				{ year: 1800, month: 4, day: 13 }, // April 13, 1800 (not leap)
				{ year: 1900, month: 4, day: 15 }, // April 15, 1900 (not leap)
				{ year: 2000, month: 4, day: 23 }, // April 23, 2000 (leap year)
			];

			centuryBoundaries.forEach(({ year, month, day }) => {
				const easter = calculateEasterSunday(year);
				assert.strictEqual(easter.getUTCFullYear(), year);
				assert.strictEqual(easter.getUTCMonth() + 1, month);
				assert.strictEqual(easter.getUTCDate(), day);
			});
		});

		it("should calculate earliest possible Easter dates", () => {
			// Easter can fall as early as March 22
			const earlyEasters = [
				{ year: 1818, month: 3, day: 22 }, // March 22, 1818 (earliest possible)
				{ year: 2285, month: 3, day: 22 }, // March 22, 2285 (next occurrence)
			];

			earlyEasters.forEach(({ year, month, day }) => {
				const easter = calculateEasterSunday(year);
				assert.strictEqual(easter.getUTCMonth() + 1, month);
				assert.strictEqual(easter.getUTCDate(), day);
			});
		});

		it("should calculate latest possible Easter dates", () => {
			// Easter can fall as late as April 25
			const lateEasters = [
				{ year: 1943, month: 4, day: 25 }, // April 25, 1943 (latest possible)
				{ year: 2038, month: 4, day: 25 }, // April 25, 2038 (next occurrence)
			];

			lateEasters.forEach(({ year, month, day }) => {
				const easter = calculateEasterSunday(year);
				assert.strictEqual(easter.getUTCMonth() + 1, month);
				assert.strictEqual(easter.getUTCDate(), day);
			});
		});
	});

	describe("Date properties", () => {
		it("should always return a Sunday", () => {
			// Test multiple years to ensure Easter always falls on Sunday
			const testYears = [2020, 2021, 2022, 2023, 2024, 2025, 2030, 2040];

			testYears.forEach((year) => {
				const easter = calculateEasterSunday(year);
				const dayOfWeek = easter.getUTCDay();
				assert.strictEqual(
					dayOfWeek,
					0,
					`Easter ${year} should be Sunday (0), got ${dayOfWeek}`,
				);
			});
		});

		it("should return dates in March or April only", () => {
			// Easter can only fall in March (month 3) or April (month 4)
			const testYears = Array.from({ length: 50 }, (_, i) => 2000 + i);

			testYears.forEach((year) => {
				const easter = calculateEasterSunday(year);
				const month = easter.getUTCMonth() + 1;
				assert.ok(
					month === 3 || month === 4,
					`Easter ${year} should be in March or April, got month ${month}`,
				);
			});
		});

		it("should return valid date range (March 22 - April 25)", () => {
			// Easter can only fall between March 22 and April 25
			const testYears = Array.from({ length: 100 }, (_, i) => 1950 + i);

			testYears.forEach((year) => {
				const easter = calculateEasterSunday(year);
				const month = easter.getUTCMonth() + 1;
				const day = easter.getUTCDate();

				if (month === 3) {
					assert.ok(
						day >= 22,
						`March Easter should be >= 22, got March ${day} in ${year}`,
					);
				} else if (month === 4) {
					assert.ok(
						day <= 25,
						`April Easter should be <= 25, got April ${day} in ${year}`,
					);
				}
			});
		});

		it("should return midnight UTC dates", () => {
			const easter = calculateEasterSunday(2024);

			assert.strictEqual(easter.getUTCHours(), 0);
			assert.strictEqual(easter.getUTCMinutes(), 0);
			assert.strictEqual(easter.getUTCSeconds(), 0);
			assert.strictEqual(easter.getUTCMilliseconds(), 0);
		});
	});

	describe("Input validation", () => {
		it("should throw error for years before 1583", () => {
			const invalidYears = [1582, 1500, 1000, 500];

			invalidYears.forEach((year) => {
				assert.throws(
					() => calculateEasterSunday(year),
					{
						message: /Year must be >= 1583.*Gregorian calendar/,
					},
					`Should reject year ${year}`,
				);
			});
		});

		it("should throw error for non-integer years", () => {
			const invalidInputs = [2024.5, "2024", null, undefined, NaN, Infinity];

			invalidInputs.forEach((input) => {
				assert.throws(
					() => calculateEasterSunday(input),
					{ message: /Year must be an integer/ },
					`Should reject input: ${input}`,
				);
			});
		});

		it("should accept minimum valid year 1583", () => {
			// 1583 is the first year after Gregorian calendar adoption
			assert.doesNotThrow(() => {
				const easter = calculateEasterSunday(1583);
				assert.ok(easter instanceof Date);
				assert.strictEqual(easter.getUTCFullYear(), 1583);
			});
		});

		it("should handle large future years", () => {
			// Test algorithm stability with large years
			const futureYears = [3000, 5000, 10000];

			futureYears.forEach((year) => {
				assert.doesNotThrow(() => {
					const easter = calculateEasterSunday(year);
					assert.ok(easter instanceof Date);
					assert.strictEqual(easter.getUTCFullYear(), year);
					// Should still be Sunday in March or April
					assert.strictEqual(easter.getUTCDay(), 0);
					const month = easter.getUTCMonth() + 1;
					assert.ok(month === 3 || month === 4);
				});
			});
		});
	});

	describe("Algorithm edge cases", () => {
		it("should handle Metonic cycle boundaries", () => {
			// Test 19-year Metonic cycle pattern
			// Years 19 apart should have related Easter dates
			const baseYear = 2000;
			const easter2000 = calculateEasterSunday(baseYear);
			const easter2019 = calculateEasterSunday(baseYear + 19);

			// Both should be valid Sundays in March/April
			assert.strictEqual(easter2000.getUTCDay(), 0);
			assert.strictEqual(easter2019.getUTCDay(), 0);

			const month2000 = easter2000.getUTCMonth() + 1;
			const month2019 = easter2019.getUTCMonth() + 1;
			assert.ok(month2000 === 3 || month2000 === 4);
			assert.ok(month2019 === 3 || month2019 === 4);
		});

		it("should handle leap year effects consistently", () => {
			// Test leap years vs non-leap years
			const leapYear = 2020; // Leap year
			const nonLeapYear = 2021; // Non-leap year

			const easterLeap = calculateEasterSunday(leapYear);
			const easterNonLeap = calculateEasterSunday(nonLeapYear);

			// Both should be valid Sundays
			assert.strictEqual(easterLeap.getUTCDay(), 0);
			assert.strictEqual(easterNonLeap.getUTCDay(), 0);

			// Verify specific known dates
			assert.strictEqual(easterLeap.getUTCMonth() + 1, 4); // April
			assert.strictEqual(easterLeap.getUTCDate(), 12); // 12th
			assert.strictEqual(easterNonLeap.getUTCMonth() + 1, 4); // April
			assert.strictEqual(easterNonLeap.getUTCDate(), 4); // 4th
		});

		it("should be deterministic and repeatable", () => {
			// Same year should always produce same result
			const year = 2024;
			const easter1 = calculateEasterSunday(year);
			const easter2 = calculateEasterSunday(year);

			assert.strictEqual(easter1.getTime(), easter2.getTime());
			assert.strictEqual(easter1.getUTCFullYear(), easter2.getUTCFullYear());
			assert.strictEqual(easter1.getUTCMonth(), easter2.getUTCMonth());
			assert.strictEqual(easter1.getUTCDate(), easter2.getUTCDate());
		});
	});

	describe("Performance characteristics", () => {
		it("should execute in constant time O(1)", () => {
			// Test that large years don't significantly impact performance
			const startTime = performance.now();

			// Calculate Easter for a range of years
			for (let year = 2000; year < 2100; year++) {
				calculateEasterSunday(year);
			}

			const duration = performance.now() - startTime;

			// Should complete 100 calculations in reasonable time
			// (This is more of a smoke test than precise performance measurement)
			assert.ok(
				duration < 100,
				`100 calculations took ${duration}ms, expected < 100ms`,
			);
		});

		it("should handle consecutive years efficiently", () => {
			// Verify no state leakage between calls
			const results = [];
			for (let year = 2020; year <= 2025; year++) {
				results.push(calculateEasterSunday(year));
			}

			// Verify all results are different and valid
			results.forEach((easter, index) => {
				const year = 2020 + index;
				assert.strictEqual(easter.getUTCFullYear(), year);
				assert.strictEqual(easter.getUTCDay(), 0); // Sunday
			});

			// Verify no duplicate dates (highly unlikely for consecutive years)
			const uniqueTimes = new Set(results.map((date) => date.getTime()));
			assert.strictEqual(uniqueTimes.size, results.length);
		});
	});
});
