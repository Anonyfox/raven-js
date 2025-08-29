/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { NaiveDateTime } from "./naive-date-time.js";

describe("NaiveDateTime class", () => {
	describe("Constructor with string input", () => {
		it("should handle ISO string with timezone offset", () => {
			const naive = new NaiveDateTime("2024-01-01T00:00:00+02:00");

			// Should strip timezone and treat as Z
			assert.strictEqual(naive.toISOString(), "2024-01-01T00:00:00.000Z");
		});

		it("should handle ISO string with negative timezone offset", () => {
			const naive = new NaiveDateTime("2024-01-01T12:30:00-05:00");

			// Should strip timezone and treat as Z
			assert.strictEqual(naive.toISOString(), "2024-01-01T12:30:00.000Z");
		});

		it("should handle ISO string already with Z", () => {
			const naive = new NaiveDateTime("2024-01-01T00:00:00Z");

			assert.strictEqual(naive.toISOString(), "2024-01-01T00:00:00.000Z");
		});

		it("should handle ISO string without timezone", () => {
			const naive = new NaiveDateTime("2024-01-01T00:00:00");

			// Should treat as local time, but this depends on system timezone
			// We just verify it creates a valid date
			assert.ok(naive instanceof Date);
			assert.ok(!Number.isNaN(naive.getTime()));
		});

		it("should handle date-only string", () => {
			const naive = new NaiveDateTime("2024-01-01");

			assert.ok(naive instanceof Date);
			assert.ok(!Number.isNaN(naive.getTime()));
		});
	});

	describe("Constructor with number input", () => {
		it("should treat number as Unix timestamp in seconds", () => {
			const unixSeconds = 1704067200; // 2024-01-01T00:00:00Z
			const naive = new NaiveDateTime(unixSeconds);

			assert.strictEqual(naive.toISOString(), "2024-01-01T00:00:00.000Z");
			assert.strictEqual(naive.toUnix(), unixSeconds);
		});

		it("should handle zero timestamp", () => {
			const naive = new NaiveDateTime(0);

			assert.strictEqual(naive.toISOString(), "1970-01-01T00:00:00.000Z");
			assert.strictEqual(naive.toUnix(), 0);
		});

		it("should handle negative timestamps", () => {
			const unixSeconds = -86400; // 1969-12-31T00:00:00Z
			const naive = new NaiveDateTime(unixSeconds);

			assert.strictEqual(naive.toUnix(), unixSeconds);
		});

		it("should handle large timestamps", () => {
			const unixSeconds = 2147483647; // 2038-01-19T03:14:07Z (32-bit limit)
			const naive = new NaiveDateTime(unixSeconds);

			assert.strictEqual(naive.toUnix(), unixSeconds);
		});
	});

	describe("Constructor with Date input", () => {
		it("should accept Date object directly", () => {
			const originalDate = new Date("2024-01-01T00:00:00Z");
			const naive = new NaiveDateTime(originalDate);

			assert.strictEqual(naive.toISOString(), originalDate.toISOString());
		});

		it("should preserve Date object timestamp", () => {
			const originalDate = new Date("2024-06-15T12:30:45.123Z");
			const naive = new NaiveDateTime(originalDate);

			// Should preserve the original milliseconds
			assert.strictEqual(naive.valueOf(), originalDate.valueOf());
		});
	});

	describe("toUnix method", () => {
		it("should return Unix timestamp in seconds", () => {
			const unixSeconds = 1704067200;
			const naive = new NaiveDateTime(unixSeconds);

			assert.strictEqual(naive.toUnix(), unixSeconds);
			assert.strictEqual(typeof naive.toUnix(), "number");
		});

		it("should return fractional seconds for millisecond precision", () => {
			const date = new Date("2024-01-01T00:00:00.500Z");
			const naive = new NaiveDateTime(date);

			const unixTime = naive.toUnix();
			assert.strictEqual(unixTime, 1704067200.5);
		});

		it("should handle various timestamps correctly", () => {
			const testCases = [
				{ unix: 0, expected: 0 },
				{ unix: 86400, expected: 86400 },
				{ unix: -86400, expected: -86400 },
				{ unix: 1234567890, expected: 1234567890 },
			];

			for (const { unix, expected } of testCases) {
				const naive = new NaiveDateTime(unix);
				assert.strictEqual(naive.toUnix(), expected);
			}
		});
	});

	describe("getTime override", () => {
		it("should return Unix timestamp in seconds like toUnix", () => {
			const unixSeconds = 1704067200;
			const naive = new NaiveDateTime(unixSeconds);

			assert.strictEqual(naive.getTime(), unixSeconds);
			assert.strictEqual(naive.getTime(), naive.toUnix());
		});

		it("should be different from native Date getTime", () => {
			const date = new Date("2024-01-01T00:00:00Z");
			const naive = new NaiveDateTime(date);

			// Native Date returns milliseconds, NaiveDateTime returns seconds
			assert.strictEqual(naive.getTime(), date.getTime() / 1000);
		});

		it("should maintain consistency across method calls", () => {
			const naive = new NaiveDateTime("2024-01-01T00:00:00Z");

			const time1 = naive.getTime();
			const time2 = naive.getTime();
			const time3 = naive.toUnix();

			assert.strictEqual(time1, time2);
			assert.strictEqual(time1, time3);
		});
	});

	describe("Date inheritance", () => {
		it("should be instance of Date", () => {
			const naive = new NaiveDateTime("2024-01-01T00:00:00Z");

			assert.ok(naive instanceof Date);
			assert.ok(naive instanceof NaiveDateTime);
		});

		it("should preserve native Date methods", () => {
			const naive = new NaiveDateTime("2024-01-01T00:00:00Z");

			// Should have all native Date methods
			assert.strictEqual(typeof naive.toISOString, "function");
			assert.strictEqual(typeof naive.getFullYear, "function");
			assert.strictEqual(typeof naive.getMonth, "function");
			assert.strictEqual(typeof naive.getDate, "function");
		});

		it("should work with native Date methods", () => {
			const naive = new NaiveDateTime("2024-06-15T12:30:45Z");

			assert.strictEqual(naive.getUTCFullYear(), 2024);
			assert.strictEqual(naive.getUTCMonth(), 5); // June is month 5
			assert.strictEqual(naive.getUTCDate(), 15);
			assert.strictEqual(naive.getUTCHours(), 12);
			assert.strictEqual(naive.getUTCMinutes(), 30);
			assert.strictEqual(naive.getUTCSeconds(), 45);
		});
	});

	describe("Timezone handling edge cases", () => {
		it("should handle various timezone offset formats", () => {
			const testCases = [
				{
					input: "2024-01-01T00:00:00+01:00",
					expected: "2024-01-01T00:00:00.000Z",
				},
				{
					input: "2024-01-01T00:00:00+12:00",
					expected: "2024-01-01T00:00:00.000Z",
				},
				{
					input: "2024-01-01T00:00:00-08:00",
					expected: "2024-01-01T00:00:00.000Z",
				},
				{
					input: "2024-01-01T00:00:00+05:30",
					expected: "2024-01-01T00:00:00.000Z",
				},
				{
					input: "2024-01-01T00:00:00-03:30",
					expected: "2024-01-01T00:00:00.000Z",
				},
			];

			for (const { input, expected } of testCases) {
				const naive = new NaiveDateTime(input);
				assert.strictEqual(naive.toISOString(), expected);
			}
		});

		it("should handle string without timezone offset", () => {
			const naive = new NaiveDateTime("2024-01-01T00:00:00");

			// Should not crash and should create valid date
			assert.ok(naive instanceof Date);
			assert.ok(!Number.isNaN(naive.getTime()));
		});

		it("should not modify strings without + sign", () => {
			const testCases = [
				"2024-01-01T00:00:00Z",
				"2024-01-01T00:00:00",
				"2024-01-01",
			];

			for (const isoString of testCases) {
				const naive = new NaiveDateTime(isoString);
				const regular = new Date(isoString);

				// Should produce same result as regular Date for these cases
				assert.strictEqual(naive.toISOString(), regular.toISOString());
			}
		});
	});

	describe("Data integrity and edge cases", () => {
		it("should handle invalid input gracefully", () => {
			const invalidInputs = [
				"invalid-date-string",
				"not-a-date",
				"2024-13-45T25:61:61Z",
			];

			for (const input of invalidInputs) {
				const naive = new NaiveDateTime(input);

				// Should create invalid date, not crash
				assert.ok(Number.isNaN(naive.getTime()));
			}
		});

		it("should handle undefined and null inputs", () => {
			const undefinedNaive = new NaiveDateTime(undefined);
			const nullNaive = new NaiveDateTime(null);

			// undefined creates invalid date (same as native Date), null creates epoch time
			assert.ok(Number.isNaN(undefinedNaive.valueOf()));
			assert.strictEqual(nullNaive.toUnix(), 0);
		});

		it("should handle empty string input", () => {
			const naive = new NaiveDateTime("");

			// Empty string should create invalid date
			assert.ok(Number.isNaN(naive.getTime()));
		});

		it("should handle fractional timestamps", () => {
			const fractionalSeconds = 1704067200.123;
			const naive = new NaiveDateTime(fractionalSeconds);

			assert.strictEqual(naive.toUnix(), fractionalSeconds);
		});
	});

	describe("Performance and precision", () => {
		it("should maintain millisecond precision from Date objects", () => {
			const originalDate = new Date("2024-01-01T00:00:00.999Z");
			const naive = new NaiveDateTime(originalDate);

			// Should preserve milliseconds in fractional seconds
			const expectedUnix = originalDate.getTime() / 1000;
			assert.strictEqual(naive.toUnix(), expectedUnix);
		});

		it("should handle rapid successive calls consistently", () => {
			const naive = new NaiveDateTime("2024-01-01T00:00:00Z");

			const results = [];
			for (let i = 0; i < 100; i++) {
				results.push(naive.getTime());
			}

			// All results should be identical
			assert.ok(results.every((result) => result === results[0]));
		});

		it("should be efficient for common operations", () => {
			const startTime = process.hrtime.bigint();

			for (let i = 0; i < 1000; i++) {
				const naive = new NaiveDateTime(1704067200 + i);
				naive.getTime();
				naive.toUnix();
			}

			const endTime = process.hrtime.bigint();
			const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

			// Should complete 1000 operations in reasonable time (less than 100ms)
			assert.ok(duration < 100);
		});
	});

	describe("Cross-platform compatibility", () => {
		it("should produce consistent results across different inputs", () => {
			const unixTimestamp = 1704067200;
			const isoString = "2024-01-01T00:00:00Z";
			const dateObject = new Date(isoString);

			const fromUnix = new NaiveDateTime(unixTimestamp);
			const fromISO = new NaiveDateTime(isoString);
			const fromDate = new NaiveDateTime(dateObject);

			// All should produce identical results
			assert.strictEqual(fromUnix.toISOString(), fromISO.toISOString());
			assert.strictEqual(fromISO.toISOString(), fromDate.toISOString());
			assert.strictEqual(fromUnix.toUnix(), fromISO.toUnix());
			assert.strictEqual(fromISO.toUnix(), fromDate.toUnix());
		});

		it("should handle leap year calculations correctly", () => {
			const leapYearTimestamp = 1582934400; // 2020-02-29T00:00:00Z
			const naive = new NaiveDateTime(leapYearTimestamp);

			assert.strictEqual(naive.getUTCFullYear(), 2020);
			assert.strictEqual(naive.getUTCMonth(), 1); // February
			assert.strictEqual(naive.getUTCDate(), 29);
		});

		it("should handle century boundaries correctly", () => {
			const testCases = [
				{ unix: 946684800, year: 2000 }, // Y2K
				{ unix: 4102444800, year: 2100 }, // Next century
			];

			for (const { unix, year } of testCases) {
				const naive = new NaiveDateTime(unix);
				assert.strictEqual(naive.getUTCFullYear(), year);
			}
		});
	});
});
