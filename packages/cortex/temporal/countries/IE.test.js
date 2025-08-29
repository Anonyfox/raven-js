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
import { IE } from "./IE.js";

describe("Irish holiday definitions (IE)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof IE === "object");
			assert.ok(Array.isArray(IE.national));
			assert.ok(typeof IE.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(IE.national.length > 0);

			for (const holiday of IE.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 9 national holidays", () => {
			// Ireland has 9 official public holidays
			assert.strictEqual(IE.national.length, 9);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = IE.national.map((h) => h.name);

			const expectedHolidays = [
				"New Year's Day",
				"St. Patrick's Day",
				"Easter Monday",
				"May Day",
				"June Holiday",
				"August Holiday",
				"October Holiday",
				"Christmas Day",
				"St. Stephen's Day",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate St. Patrick's Day correctly", () => {
			const stPatrick = IE.national.find((h) => h.name === "St. Patrick's Day");
			assert.ok(stPatrick);

			const holiday2024 = stPatrick.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 2); // March
			assert.strictEqual(holiday2024.date.getUTCDate(), 17);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of IE.national) {
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
