/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { HolidayDefinition } from "./holiday-definition.js";

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
			assert.ok(Object.isFrozen(holidayDef));
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
			assert.ok(Object.isFrozen(holidayDef));
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
			assert.ok(Object.isFrozen(holidayDef));
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
				/Holiday name must be a non-empty string/,
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
				/Holiday name must be a non-empty string/,
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
				/Holiday type must be/,
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
				/Holiday workFree must be a boolean/,
			);
		});

		it("should reject invalid fixed holiday parameters", () => {
			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "fixed",
						month: 0,
						day: 1,
						workFree: true,
					}),
				/Fixed holiday month must be integer 1-12/,
			);

			assert.throws(
				() =>
					new HolidayDefinition({
						name: "Test",
						type: "fixed",
						month: 1,
						day: 0,
						workFree: true,
					}),
				/Fixed holiday day must be integer 1-31/,
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
				/Easter relative holiday offset must be an integer/,
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
				/Calculated holiday must have a calculator function/,
			);
		});
	});

	describe("calculateHoliday method", () => {
		it("should calculate fixed date holidays", () => {
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
			assert.strictEqual(result.date.getUTCMonth(), 0);
			assert.strictEqual(result.date.getUTCDate(), 1);
			assert.strictEqual(result.workFree, true);
			assert.strictEqual(result.scope, "national");
			assert.strictEqual(result.type, "fixed");
		});

		it("should calculate easter relative holidays", () => {
			const goodFridayDef = new HolidayDefinition({
				name: "Good Friday",
				type: "easter_relative",
				offset: -2,
				workFree: true,
			});

			const easter = new Date(Date.UTC(2024, 2, 31, 0, 0, 0, 0));
			const result = goodFridayDef.calculateHoliday(2024, easter, "regional");

			assert.strictEqual(result.name, "Good Friday");
			assert.strictEqual(result.scope, "regional");
			assert.strictEqual(result.type, "easter_relative");
			assert.strictEqual(result.date.getUTCDate(), 29); // March 29, 2024
		});

		it("should calculate calculated holidays", () => {
			const calculator = (year) => new Date(Date.UTC(year, 5, 15, 0, 0, 0, 0));
			const customDef = new HolidayDefinition({
				name: "Custom Day",
				type: "calculated",
				workFree: false,
				calculator,
			});

			const result = customDef.calculateHoliday(2024);

			assert.strictEqual(result.name, "Custom Day");
			assert.strictEqual(result.date.getUTCMonth(), 5); // June
			assert.strictEqual(result.date.getUTCDate(), 15);
			assert.strictEqual(result.workFree, false);
		});

		it("should validate year parameter", () => {
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

		it("should validate scope parameter", () => {
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
			const easterDef = new HolidayDefinition({
				name: "Easter Monday",
				type: "easter_relative",
				offset: 1,
				workFree: true,
			});

			assert.throws(() => easterDef.calculateHoliday(2024), {
				message: /Easter Sunday date required for easter_relative holidays/,
			});

			assert.throws(() => easterDef.calculateHoliday(2024, "not a date"), {
				message: /Easter Sunday date required for easter_relative holidays/,
			});
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

		it("should format easter relative with positive offset to hit line 205 branch", () => {
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
	});

	describe("Static methods", () => {
		it("should create from plain object", () => {
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
		});

		it("should validate definitions", () => {
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
				{ name: "Test" },
				{ name: "Test", type: "invalid" },
				{ name: "Test", type: "fixed" },
				{ name: "Test", type: "easter_relative" },
				{ name: "Test", type: "calculated" },
			];

			for (const def of invalidDefinitions) {
				assert.strictEqual(
					HolidayDefinition.isValidDefinition(def),
					false,
					`Should reject definition: ${JSON.stringify(def)}`,
				);
			}
		});
	});

	describe("Edge cases", () => {
		it("should handle leap day correctly", () => {
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

			// Non-leap year behavior (JavaScript creates March 1)
			const result2023 = leapDayDef.calculateHoliday(2023);
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

			const easter = new Date(Date.UTC(2024, 2, 31, 0, 0, 0, 0));
			const result = farEasterDef.calculateHoliday(2024, easter);

			assert.ok(result.date < easter);
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
