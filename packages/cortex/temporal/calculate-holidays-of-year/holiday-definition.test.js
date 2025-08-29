/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { HolidayDefinition } from "./holiday.js";

describe("HolidayDefinition class", () => {
	describe("Constructor validation", () => {
		it("should create fixed date holiday definition", () => {
			const holidayDef = new HolidayDefinition({
				name: "New Year",
				type: "fixed",
				month: 1,
				day: 1,
				workFree: true,
			});

			assert.strictEqual(holidayDef.name, "New Year");
			assert.strictEqual(holidayDef.type, "fixed");
			assert.strictEqual(holidayDef.month, 1);
			assert.strictEqual(holidayDef.day, 1);
			assert.strictEqual(holidayDef.workFree, true);
		});

		it("should create easter relative holiday definition", () => {
			const holidayDef = new HolidayDefinition({
				name: "Good Friday",
				type: "easter_relative",
				offset: -2,
				workFree: true,
			});

			assert.strictEqual(holidayDef.name, "Good Friday");
			assert.strictEqual(holidayDef.type, "easter_relative");
			assert.strictEqual(holidayDef.offset, -2);
			assert.strictEqual(holidayDef.workFree, true);
		});

		it("should create calculated holiday definition", () => {
			const calculator = (year) => new Date(Date.UTC(year, 10, 15, 0, 0, 0, 0));

			const holidayDef = new HolidayDefinition({
				name: "Custom Holiday",
				type: "calculated",
				workFree: false,
				calculator,
			});

			assert.strictEqual(holidayDef.name, "Custom Holiday");
			assert.strictEqual(holidayDef.type, "calculated");
			assert.strictEqual(holidayDef.workFree, false);
			assert.strictEqual(holidayDef.calculator, calculator);
		});

		it("should freeze holiday definition object after construction", () => {
			const holidayDef = new HolidayDefinition({
				name: "Test",
				type: "fixed",
				month: 1,
				day: 1,
				workFree: true,
			});

			assert.ok(Object.isFrozen(holidayDef));

			// Attempt to modify should fail - check that it throws or stays unchanged
			try {
				holidayDef.name = "Modified";
				// In non-strict mode, should remain unchanged
				assert.strictEqual(holidayDef.name, "Test");
			} catch (error) {
				// In strict mode, should throw TypeError
				assert.ok(error instanceof TypeError);
			}
		});

		it("should reject invalid name", () => {
			assert.throws(
				() =>
					new HolidayDefinition({
						name: "",
						type: "fixed",
						month: 1,
						day: 1,
						workFree: true,
					}),
				{ message: /Holiday name must be a non-empty string/ },
			);

			assert.throws(
				() =>
					new HolidayDefinition({
						name: 123,
						type: "fixed",
						month: 1,
						day: 1,
						workFree: true,
					}),
				{ message: /Holiday name must be a non-empty string/ },
			);
		});

		it("should reject invalid type", () => {
			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "invalid",
						month: 1,
						day: 1,
						workFree: true,
					}),
				{
					message:
						/Holiday type must be 'fixed', 'easter_relative', or 'calculated'/,
				},
			);
		});

		it("should reject invalid workFree", () => {
			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "fixed",
						month: 1,
						day: 1,
						workFree: "true",
					}),
				{ message: /Holiday workFree must be a boolean/ },
			);
		});

		it("should reject invalid fixed holiday parameters", () => {
			// Invalid month
			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "fixed",
						month: 0,
						day: 1,
						workFree: true,
					}),
				{ message: /Fixed holiday month must be integer 1-12/ },
			);

			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "fixed",
						month: 13,
						day: 1,
						workFree: true,
					}),
				{ message: /Fixed holiday month must be integer 1-12/ },
			);

			// Invalid day
			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "fixed",
						month: 1,
						day: 0,
						workFree: true,
					}),
				{ message: /Fixed holiday day must be integer 1-31/ },
			);

			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "fixed",
						month: 1,
						day: 32,
						workFree: true,
					}),
				{ message: /Fixed holiday day must be integer 1-31/ },
			);
		});

		it("should reject invalid easter relative parameters", () => {
			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "easter_relative",
						offset: "invalid",
						workFree: true,
					}),
				{ message: /Easter relative holiday offset must be an integer/ },
			);

			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "easter_relative",
						offset: 1.5,
						workFree: true,
					}),
				{ message: /Easter relative holiday offset must be an integer/ },
			);
		});

		it("should reject calculated holiday without calculator", () => {
			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "calculated",
						workFree: true,
					}),
				{ message: /Calculated holiday must have a calculator function/ },
			);

			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "calculated",
						calculator: "not a function",
						workFree: true,
					}),
				{ message: /Calculated holiday must have a calculator function/ },
			);
		});
	});

	describe("calculateHoliday method", () => {
		it("should calculate fixed date holiday", () => {
			const newYearDef = new HolidayDefinition({
				name: "New Year",
				type: "fixed",
				month: 1,
				day: 1,
				workFree: true,
			});

			const result = newYearDef.calculateHoliday(2024);

			assert.strictEqual(result.name, "New Year");
			assert.strictEqual(result.date.getUTCFullYear(), 2024);
			assert.strictEqual(result.date.getUTCMonth(), 0); // January = 0
			assert.strictEqual(result.date.getUTCDate(), 1);
			assert.strictEqual(result.workFree, true);
			assert.strictEqual(result.scope, "national");
			assert.strictEqual(result.type, "fixed");
		});

		it("should calculate easter relative holiday", () => {
			const goodFridayDef = new HolidayDefinition({
				name: "Good Friday",
				type: "easter_relative",
				offset: -2,
				workFree: true,
			});

			const easter = new Date(Date.UTC(2024, 2, 31, 0, 0, 0, 0)); // March 31, 2024
			const result = goodFridayDef.calculateHoliday(2024, easter, "regional");

			assert.strictEqual(result.name, "Good Friday");
			assert.strictEqual(result.date.getUTCFullYear(), 2024);
			assert.strictEqual(result.date.getUTCMonth(), 2); // March = 2
			assert.strictEqual(result.date.getUTCDate(), 29); // March 29, 2024
			assert.strictEqual(result.workFree, true);
			assert.strictEqual(result.scope, "regional");
			assert.strictEqual(result.type, "easter_relative");
		});

		it("should calculate calculated holiday", () => {
			const customCalculator = (year) =>
				new Date(Date.UTC(year, 5, 15, 0, 0, 0, 0)); // June 15

			const customHolidayDef = new HolidayDefinition({
				name: "Custom Day",
				type: "calculated",
				workFree: false,
				calculator: customCalculator,
			});

			const result = customHolidayDef.calculateHoliday(2024);

			assert.strictEqual(result.name, "Custom Day");
			assert.strictEqual(result.date.getUTCFullYear(), 2024);
			assert.strictEqual(result.date.getUTCMonth(), 5); // June = 5
			assert.strictEqual(result.date.getUTCDate(), 15);
			assert.strictEqual(result.workFree, false);
			assert.strictEqual(result.scope, "national");
			assert.strictEqual(result.type, "calculated");
		});

		it("should reject invalid year", () => {
			const holidayDef = new HolidayDefinition({
				name: "Test",
				type: "fixed",
				month: 1,
				day: 1,
				workFree: true,
			});

			assert.throws(() => holidayDef.calculateHoliday(1582), {
				message: /Year must be an integer >= 1583/,
			});

			assert.throws(() => holidayDef.calculateHoliday("2024"), {
				message: /Year must be an integer >= 1583/,
			});
		});

		it("should reject invalid scope", () => {
			const holidayDef = new HolidayDefinition({
				name: "Test",
				type: "fixed",
				month: 1,
				day: 1,
				workFree: true,
			});

			assert.throws(() => holidayDef.calculateHoliday(2024, null, "invalid"), {
				message: /Scope must be 'national' or 'regional'/,
			});
		});

		it("should require easter date for easter relative holidays", () => {
			const easterHolidayDef = new HolidayDefinition({
				name: "Easter Monday",
				type: "easter_relative",
				offset: 1,
				workFree: true,
			});

			assert.throws(() => easterHolidayDef.calculateHoliday(2024), {
				message: /Easter Sunday date required for easter_relative holidays/,
			});

			assert.throws(
				() => easterHolidayDef.calculateHoliday(2024, "not a date"),
				{
					message: /Easter Sunday date required for easter_relative holidays/,
				},
			);
		});

		it("should validate calculator return value", () => {
			const badCalculator = () => "not a date";

			const holidayDef = new HolidayDefinition({
				name: "Bad Holiday",
				type: "calculated",
				workFree: true,
				calculator: badCalculator,
			});

			assert.throws(() => holidayDef.calculateHoliday(2024), {
				message:
					/Calculator function for Bad Holiday must return a Date object/,
			});
		});

		it("should handle unsupported holiday type", () => {
			// This test verifies defensive programming by creating a holiday
			// with an invalid type that bypasses constructor validation
			const holidayDef = Object.create(HolidayDefinition.prototype);
			holidayDef.name = "Test";
			holidayDef.type = "unsupported";
			holidayDef.workFree = true;

			assert.throws(() => holidayDef.calculateHoliday(2024), {
				message: /Unsupported holiday type: unsupported/,
			});
		});
	});

	describe("toString method", () => {
		it("should format fixed holiday definition", () => {
			const holidayDef = new HolidayDefinition({
				name: "Christmas",
				type: "fixed",
				month: 12,
				day: 25,
				workFree: true,
			});

			const result = holidayDef.toString();
			assert.strictEqual(result, "Christmas (fixed) - 12/25 [work-free]");
		});

		it("should format easter relative holiday definition", () => {
			const holidayDef = new HolidayDefinition({
				name: "Good Friday",
				type: "easter_relative",
				offset: -2,
				workFree: true,
			});

			const result = holidayDef.toString();
			assert.strictEqual(
				result,
				"Good Friday (easter_relative) - Easter-2 [work-free]",
			);
		});

		it("should format positive easter offset", () => {
			const holidayDef = new HolidayDefinition({
				name: "Easter Monday",
				type: "easter_relative",
				offset: 1,
				workFree: true,
			});

			const result = holidayDef.toString();
			assert.strictEqual(
				result,
				"Easter Monday (easter_relative) - Easter+1 [work-free]",
			);
		});

		it("should format calculated holiday definition", () => {
			const holidayDef = new HolidayDefinition({
				name: "Custom Day",
				type: "calculated",
				workFree: false,
				calculator: () => new Date(),
			});

			const result = holidayDef.toString();
			assert.strictEqual(result, "Custom Day (calculated) [observance]");
		});

		it("should indicate observance vs work-free", () => {
			const workFreeDef = new HolidayDefinition({
				name: "Work Free",
				type: "fixed",
				month: 1,
				day: 1,
				workFree: true,
			});

			const observanceDef = new HolidayDefinition({
				name: "Observance",
				type: "fixed",
				month: 1,
				day: 2,
				workFree: false,
			});

			assert.ok(workFreeDef.toString().includes("[work-free]"));
			assert.ok(observanceDef.toString().includes("[observance]"));
		});
	});

	describe("Static methods", () => {
		it("should create holiday definition from definition", () => {
			const definition = {
				name: "Test Holiday",
				type: "fixed",
				month: 6,
				day: 15,
				workFree: true,
			};

			const holidayDef = HolidayDefinition.from(definition);

			assert.ok(holidayDef instanceof HolidayDefinition);
			assert.strictEqual(holidayDef.name, "Test Holiday");
			assert.strictEqual(holidayDef.type, "fixed");
			assert.strictEqual(holidayDef.month, 6);
			assert.strictEqual(holidayDef.day, 15);
			assert.strictEqual(holidayDef.workFree, true);
		});

		it("should validate definition without creating instance", () => {
			const validDefinition = {
				name: "Valid",
				type: "fixed",
				month: 1,
				day: 1,
				workFree: true,
			};

			const invalidDefinition = {
				name: "",
				type: "fixed",
				month: 1,
				day: 1,
				workFree: true,
			};

			assert.strictEqual(
				HolidayDefinition.isValidDefinition(validDefinition),
				true,
			);
			assert.strictEqual(
				HolidayDefinition.isValidDefinition(invalidDefinition),
				false,
			);
		});

		it("should handle various invalid definitions", () => {
			const invalidDefinitions = [
				null,
				undefined,
				{},
				{ name: "Test" }, // missing type
				{ name: "Test", type: "invalid" }, // invalid type
				{ name: "Test", type: "fixed" }, // missing month/day
				{ name: "Test", type: "easter_relative" }, // missing offset
				{ name: "Test", type: "calculated" }, // missing calculator
			];

			invalidDefinitions.forEach((def) => {
				assert.strictEqual(
					HolidayDefinition.isValidDefinition(def),
					false,
					`Should reject definition: ${JSON.stringify(def)}`,
				);
			});
		});
	});

	describe("Edge cases and constraints", () => {
		it("should handle extreme date values for fixed holidays", () => {
			// February 29 (leap year test)
			const leapDayDef = new HolidayDefinition({
				name: "Leap Day",
				type: "fixed",
				month: 2,
				day: 29,
				workFree: false,
			});

			const result2024 = leapDayDef.calculateHoliday(2024); // Leap year
			assert.strictEqual(result2024.date.getUTCMonth(), 1); // February
			assert.strictEqual(result2024.date.getUTCDate(), 29);

			// Note: February 29 in non-leap years will create March 1
			// This is JavaScript Date behavior, not our bug
			const result2023 = leapDayDef.calculateHoliday(2023); // Non-leap year
			assert.strictEqual(result2023.date.getUTCMonth(), 2); // March
			assert.strictEqual(result2023.date.getUTCDate(), 1);
		});

		it("should handle extreme easter offsets", () => {
			const farEasterDef = new HolidayDefinition({
				name: "Far from Easter",
				type: "easter_relative",
				offset: -100,
				workFree: true,
			});

			const easter = new Date(Date.UTC(2024, 2, 31, 0, 0, 0, 0)); // March 31
			const result = farEasterDef.calculateHoliday(2024, easter);

			// Should calculate correctly even with large negative offset
			assert.ok(result.date < easter);
			assert.strictEqual(result.date.getUTCDate(), 22); // December 22, 2023
			assert.strictEqual(result.date.getUTCMonth(), 11); // December
			assert.strictEqual(result.date.getUTCFullYear(), 2023); // Previous year
		});

		it("should maintain midnight UTC time", () => {
			const holidayDef = new HolidayDefinition({
				name: "Test",
				type: "fixed",
				month: 6,
				day: 15,
				workFree: true,
			});

			const result = holidayDef.calculateHoliday(2024);

			assert.strictEqual(result.date.getUTCHours(), 0);
			assert.strictEqual(result.date.getUTCMinutes(), 0);
			assert.strictEqual(result.date.getUTCSeconds(), 0);
			assert.strictEqual(result.date.getUTCMilliseconds(), 0);
		});
	});
});
