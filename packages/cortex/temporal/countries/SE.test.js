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
import { SE } from "./SE.js";

describe("Swedish holiday definitions (SE)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof SE === "object");
			assert.ok(Array.isArray(SE.national));
			assert.ok(typeof SE.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(SE.national.length > 0);

			for (const holiday of SE.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 13 national holidays", () => {
			// Sweden has 13 official public holidays
			assert.strictEqual(SE.national.length, 13);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = SE.national.map((h) => h.name);

			const expectedHolidays = [
				"Nyårsdagen",
				"Trettondedag jul",
				"Långfredagen",
				"Påskdagen",
				"Annandag påsk",
				"Första maj",
				"Kristi himmelsfärds dag",
				"Pingstdagen",
				"Sveriges nationaldag",
				"Midsommardagen",
				"Alla helgons dag",
				"Juldagen",
				"Annandag jul",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate Sweden's National Day correctly", () => {
			const nationalDay = SE.national.find(
				(h) => h.name === "Sveriges nationaldag",
			);
			assert.ok(nationalDay);

			const holiday2024 = nationalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 5); // June
			assert.strictEqual(holiday2024.date.getUTCDate(), 6);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle calculated holidays", () => {
			const calculatedHolidays = SE.national.filter(
				(h) => h.type === "calculated",
			);

			for (const holiday of calculatedHolidays) {
				assert.strictEqual(typeof holiday.calculator, "function");

				// Test the calculation
				const result = holiday.calculateHoliday(2024);
				assert.ok(result.date instanceof Date);
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of SE.national) {
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});
	});
});
