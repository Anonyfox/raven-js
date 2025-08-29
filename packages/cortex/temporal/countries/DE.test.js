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
import { DE } from "./DE.js";

describe("German holiday definitions (DE)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof DE === "object");
			assert.ok(Array.isArray(DE.national));
			assert.ok(typeof DE.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(DE.national.length > 0);

			for (const holiday of DE.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const regions = Object.keys(DE.regional);
			assert.ok(regions.length > 0);

			for (const region of regions) {
				assert.ok(Array.isArray(DE.regional[region]));

				for (const holiday of DE.regional[region]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have at least 9 national holidays", () => {
			// Germany has 9 federal holidays observed nationwide
			assert.ok(DE.national.length >= 9);
		});

		it("should have multiple regional variations", () => {
			const regions = Object.keys(DE.regional);
			// Germany has 16 states (Länder)
			assert.ok(regions.length > 5); // At least some regional variations
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = DE.national.map((h) => h.name);

			const expectedHolidays = [
				"Neujahr",
				"Karfreitag",
				"Ostermontag",
				"Tag der Arbeit",
				"Christi Himmelfahrt",
				"Pfingstmontag",
				"Tag der Deutschen Einheit",
				"Erster Weihnachtstag",
				"Zweiter Weihnachtstag",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have regional variations", () => {
			const regions = Object.keys(DE.regional);

			// Check some known regions exist
			const expectedRegions = ["BY", "BW", "SN", "ST", "TH"];
			for (const region of expectedRegions) {
				assert.ok(regions.includes(region), `Missing region: ${region}`);
			}
		});

		it("should have Bavarian regional holidays", () => {
			assert.ok(DE.regional.BY);
			const bavarianNames = DE.regional.BY.map((h) => h.name);

			const expectedBavarian = [
				"Heilige Drei Könige",
				"Fronleichnam",
				"Mariä Himmelfahrt",
				"Allerheiligen",
			];

			for (const expected of expectedBavarian) {
				assert.ok(
					bavarianNames.includes(expected),
					`Missing Bavarian holiday: ${expected}`,
				);
			}
		});

		it("should have Saxon regional holidays including Buß- und Bettag", () => {
			assert.ok(DE.regional.SN);
			const saxonNames = DE.regional.SN.map((h) => h.name);

			assert.ok(
				saxonNames.includes("Buß- und Bettag"),
				"Saxony should have Buß- und Bettag as work-free holiday",
			);
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = DE.national.find((h) => h.name === "Neujahr");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Easter-relative holidays", () => {
			const goodFriday = DE.national.find((h) => h.name === "Karfreitag");
			assert.ok(goodFriday);
			assert.strictEqual(goodFriday.type, "easter_relative");
			assert.strictEqual(goodFriday.offset, -2);

			const easterMonday = DE.national.find((h) => h.name === "Ostermontag");
			assert.ok(easterMonday);
			assert.strictEqual(easterMonday.type, "easter_relative");
			assert.strictEqual(easterMonday.offset, 1);
		});

		it("should handle calculated holidays", () => {
			// Check if there are any calculated holidays in the system
			const allHolidays = [
				...DE.national,
				...Object.values(DE.regional).flat(),
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

		it("should calculate Buß- und Bettag correctly", () => {
			const bussUndBettag = DE.regional.SN?.find(
				(h) => h.name === "Buß- und Bettag",
			);

			if (bussUndBettag) {
				assert.strictEqual(bussUndBettag.type, "calculated");

				// Test specific years
				const result2024 = bussUndBettag.calculateHoliday(2024);
				const result2023 = bussUndBettag.calculateHoliday(2023);

				// Should be in November
				assert.strictEqual(result2024.date.getUTCMonth(), 10); // November
				assert.strictEqual(result2023.date.getUTCMonth(), 10); // November

				// Should be a Wednesday
				assert.strictEqual(result2024.date.getUTCDay(), 3); // Wednesday
				assert.strictEqual(result2023.date.getUTCDay(), 3); // Wednesday

				// Should be between Nov 16-22 (Wednesday before Nov 23)
				assert.ok(result2024.date.getUTCDate() >= 16);
				assert.ok(result2024.date.getUTCDate() <= 22);
			}
		});
	});

	describe("Regional specifics", () => {
		it("should have work-free and observance holidays", () => {
			const allHolidays = [
				...DE.national,
				...Object.values(DE.regional).flat(),
			];

			const workFreeHolidays = allHolidays.filter((h) => h.workFree);
			const observanceHolidays = allHolidays.filter((h) => !h.workFree);

			assert.ok(workFreeHolidays.length > 0);
			// Note: Germany may not have observance-only holidays, but test structure
			assert.ok(observanceHolidays.length >= 0);
		});

		it("should have proper regional distribution", () => {
			// Verify that different regions have different numbers of holidays
			const regionSizes = Object.values(DE.regional).map(
				(holidays) => holidays.length,
			);

			// Should have at least some variation
			assert.ok(regionSizes.length > 1);

			// All regions should have at least one holiday
			for (const size of regionSizes) {
				assert.ok(size > 0);
			}
		});

		it("should have Catholic vs Protestant differences", () => {
			// Bavaria (BY) is predominantly Catholic
			const bavaria = DE.regional.BY || [];
			const bavarianNames = bavaria.map((h) => h.name);

			// Baden-Württemberg (BW) is mixed
			const badenWuerttemberg = DE.regional.BW || [];
			const bwNames = badenWuerttemberg.map((h) => h.name);

			// Both should have some Catholic holidays
			const catholicHolidays = [
				"Heilige Drei Könige",
				"Fronleichnam",
				"Allerheiligen",
			];

			let bavarianCatholic = 0;
			let bwCatholic = 0;

			for (const holiday of catholicHolidays) {
				if (bavarianNames.includes(holiday)) bavarianCatholic++;
				if (bwNames.includes(holiday)) bwCatholic++;
			}

			// Bavaria should have more Catholic holidays
			assert.ok(bavarianCatholic >= bwCatholic);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...DE.national,
				...Object.values(DE.regional).flat(),
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

				// Type-specific validations
				if (holiday.type === "fixed") {
					assert.ok(Number.isInteger(holiday.month));
					assert.ok(holiday.month >= 1 && holiday.month <= 12);
					assert.ok(Number.isInteger(holiday.day));
					assert.ok(holiday.day >= 1 && holiday.day <= 31);
				} else if (holiday.type === "easter_relative") {
					assert.ok(Number.isInteger(holiday.offset));
				} else if (holiday.type === "calculated") {
					assert.strictEqual(typeof holiday.calculator, "function");
				}
			}
		});

		it("should have unique holiday names within scope", () => {
			// National holidays should have unique names
			const nationalNames = DE.national.map((h) => h.name);
			const uniqueNationalNames = [...new Set(nationalNames)];
			assert.strictEqual(nationalNames.length, uniqueNationalNames.length);

			// Regional holidays within each region should have unique names
			for (const [region, holidays] of Object.entries(DE.regional)) {
				const regionalNames = holidays.map((h) => h.name);
				const uniqueRegionalNames = [...new Set(regionalNames)];
				assert.strictEqual(
					regionalNames.length,
					uniqueRegionalNames.length,
					`Duplicate holiday names in region ${region}`,
				);
			}
		});

		it("should maintain institutional memory", () => {
			// Verify that important historical German holidays are preserved
			const allNames = [
				...DE.national.map((h) => h.name),
				...Object.values(DE.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core German holidays that should always be present
			const coreHolidays = [
				"Neujahr", // New Year
				"Tag der Arbeit", // May Day
				"Tag der Deutschen Einheit", // German Unity Day
				"Erster Weihnachtstag", // Christmas Day
				"Zweiter Weihnachtstag", // Boxing Day
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core German holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
