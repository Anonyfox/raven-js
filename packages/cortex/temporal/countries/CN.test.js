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
import { CN } from "./CN.js";

describe("Chinese holiday definitions (CN)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof CN === "object");
			assert.ok(Array.isArray(CN.national));
			assert.ok(typeof CN.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(CN.national.length > 0);

			for (const holiday of CN.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have regional holidays as HolidayDefinition instances", () => {
			const regions = Object.keys(CN.regional);

			for (const region of regions) {
				assert.ok(Array.isArray(CN.regional[region]));

				for (const holiday of CN.regional[region]) {
					assert.ok(holiday instanceof HolidayDefinition);
				}
			}
		});

		it("should have 7 national holidays", () => {
			// China has 7 main national holidays
			assert.strictEqual(CN.national.length, 7);
		});

		it("should have regional variations", () => {
			const regions = Object.keys(CN.regional);
			assert.ok(regions.length >= 3); // Should have several autonomous regions
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = CN.national.map((h) => h.name);

			const expectedHolidays = [
				"元旦", // New Year's Day
				"春节", // Spring Festival
				"清明节", // Qingming Festival
				"劳动节", // Labor Day
				"端午节", // Dragon Boat Festival
				"中秋节", // Mid-Autumn Festival
				"国庆节", // National Day
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have Tibet Autonomous Region holidays", () => {
			assert.ok(CN.regional.XZ);
			const tibetNames = CN.regional.XZ.map((h) => h.name);

			assert.ok(tibetNames.includes("藏历新年")); // Tibetan New Year
		});

		it("should have Xinjiang Uyghur Autonomous Region holidays", () => {
			assert.ok(CN.regional.XJ);
			const xinjiangNames = CN.regional.XJ.map((h) => h.name);

			assert.ok(xinjiangNames.includes("古尔邦节")); // Eid al-Adha
			assert.ok(xinjiangNames.includes("开斋节")); // Eid al-Fitr
		});

		it("should have Hong Kong SAR holidays", () => {
			assert.ok(CN.regional.HK);
			const hkNames = CN.regional.HK.map((h) => h.name);

			assert.ok(hkNames.includes("Good Friday"));
			assert.ok(hkNames.includes("HKSAR Establishment Day"));
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = CN.national.find((h) => h.name === "元旦");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Spring Festival correctly", () => {
			const springFestival = CN.national.find((h) => h.name === "春节");
			assert.ok(springFestival);
			assert.strictEqual(springFestival.type, "calculated");

			const holiday2024 = springFestival.calculateHoliday(2024);
			assert.ok(holiday2024.date instanceof Date);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate National Day correctly", () => {
			const nationalDay = CN.national.find((h) => h.name === "国庆节");
			assert.ok(nationalDay);

			const holiday2024 = nationalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 9); // October
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle calculated holidays", () => {
			const calculatedHolidays = CN.national.filter(
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
			const allHolidays = [
				...CN.national,
				...Object.values(CN.regional).flat(),
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

		it("should maintain Chinese institutional memory", () => {
			const allNames = [
				...CN.national.map((h) => h.name),
				...Object.values(CN.regional)
					.flat()
					.map((h) => h.name),
			];

			// Core Chinese holidays that should always be present
			const coreHolidays = [
				"元旦", // New Year
				"春节", // Spring Festival
				"国庆节", // National Day
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Chinese holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
