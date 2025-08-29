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
import { GB } from "./GB.js";

describe("United Kingdom holiday definitions (GB)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof GB === "object");
			assert.ok(Array.isArray(GB.national));
			assert.ok(typeof GB.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(GB.national.length > 0);

			for (const holiday of GB.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const regions = Object.keys(GB.regional);
			assert.ok(regions.length > 0);

			for (const region of regions) {
				assert.ok(Array.isArray(GB.regional[region]));

				for (const holiday of GB.regional[region]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have UK-wide bank holidays", () => {
			assert.ok(GB.national.length >= 5);
		});

		it("should have regional variations", () => {
			const regions = Object.keys(GB.regional);
			// Should have England/Wales, Scotland, Northern Ireland
			assert.ok(regions.length >= 3);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = GB.national.map((h) => h.name);

			const expectedHolidays = [
				"New Year's Day",
				"Good Friday",
				"Easter Monday",
				"Christmas Day",
				"Boxing Day",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have England and Wales holidays", () => {
			assert.ok(GB.regional.EW);
			const ewNames = GB.regional.EW.map((h) => h.name);

			const expectedEW = [
				"Early May Bank Holiday",
				"Spring Bank Holiday",
				"Summer Bank Holiday",
			];

			for (const expected of expectedEW) {
				assert.ok(
					ewNames.includes(expected),
					`Missing England/Wales holiday: ${expected}`,
				);
			}
		});

		it("should have Scottish holidays", () => {
			assert.ok(GB.regional.SC);
			const scotlandNames = GB.regional.SC.map((h) => h.name);

			assert.ok(scotlandNames.includes("2nd January"));
			assert.ok(scotlandNames.includes("St. Andrew's Day"));
		});

		it("should have Northern Ireland holidays", () => {
			assert.ok(GB.regional.NI);
			const niNames = GB.regional.NI.map((h) => h.name);

			assert.ok(niNames.includes("St. Patrick's Day"));
			assert.ok(niNames.includes("Battle of the Boyne"));
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year's Day correctly", () => {
			const newYear = GB.national.find((h) => h.name === "New Year's Day");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle calculated bank holidays", () => {
			const allHolidays = [
				...GB.national,
				...Object.values(GB.regional).flat(),
			];

			const calculatedHolidays = allHolidays.filter(
				(h) => h.type === "calculated",
			);

			for (const holiday of calculatedHolidays) {
				assert.strictEqual(typeof holiday.calculator, "function");

				// Test the calculation
				const result = holiday.calculateHoliday(2024);
				assert.ok(result.date instanceof Date);
			}
		});

		it("should calculate Easter-relative holidays", () => {
			const goodFriday = GB.national.find((h) => h.name === "Good Friday");
			assert.ok(goodFriday);
			assert.strictEqual(goodFriday.type, "easter_relative");
			assert.strictEqual(goodFriday.offset, -2);

			const easterMonday = GB.national.find((h) => h.name === "Easter Monday");
			assert.ok(easterMonday);
			assert.strictEqual(easterMonday.type, "easter_relative");
			assert.strictEqual(easterMonday.offset, 1);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...GB.national,
				...Object.values(GB.regional).flat(),
			];

			for (const holiday of allHolidays) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain UK institutional memory", () => {
			const allNames = [
				...GB.national.map((h) => h.name),
				...Object.values(GB.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core UK holidays that should always be present
			const coreHolidays = [
				"New Year's Day",
				"Christmas Day",
				"Boxing Day",
				"Good Friday",
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core UK holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
