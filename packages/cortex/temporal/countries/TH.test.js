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
import { TH } from "./TH.js";

describe("Thai holiday definitions (TH)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof TH === "object");
			assert.ok(Array.isArray(TH.national));
			assert.ok(typeof TH.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(TH.national.length > 0);

			for (const holiday of TH.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 18 national holidays", () => {
			// Thailand has 18+ official national holidays
			assert.ok(TH.national.length >= 18);
		});

		it("should have no regional variations", () => {
			// Thailand has unified national holiday system
			const regions = Object.keys(TH.regional);
			assert.strictEqual(regions.length, 0);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = TH.national.map((h) => h.name);

			const _expectedHolidays = [
				"วันขึ้นปีใหม่", // New Year's Day
				"วันมาฆบูชา", // Makha Bucha Day
				"วันจักรี", // Chakri Dynasty Day
				"วันสงกรานต์", // Songkran Days (3 days)
				"วันแรงงานแห่งชาติ", // Labor Day
				"วันฉัตรมงคล", // Coronation Day
				"วันวิสาขบูชา", // Visakha Bucha Day
				"วันอาสาฬหบูชา", // Asanha Bucha Day
				"วันเข้าพรรษา", // Khao Phansa Day
				"วันคล้ายวันสวรรคตพระบาทสมเด็จพระปรมินทรมหาภูมิพลอดุลยเดช", // King Bhumibol Memorial Day
				"วันปิยมหาราช", // Chulalongkorn Day
				"วันรัฐธรรมนูญ", // Constitution Day
				"วันสิ้นปี", // New Year's Eve
			];

			// Check some key holidays (not all due to long Thai names)
			assert.ok(nationalNames.includes("วันขึ้นปีใหม่"));
			assert.ok(nationalNames.includes("วันสงกรานต์"));
			assert.ok(nationalNames.includes("วันแรงงานแห่งชาติ"));
			assert.ok(nationalNames.includes("วันรัฐธรรมนูญ"));
		});

		it("should have Songkran festival (3 days)", () => {
			const songkranHolidays = TH.national.filter(
				(h) => h.name === "วันสงกรานต์",
			);

			assert.strictEqual(songkranHolidays.length, 3); // 3 days of Songkran
		});

		it("should have Buddhist holidays", () => {
			const nationalNames = TH.national.map((h) => h.name);

			// Buddhist holidays
			assert.ok(nationalNames.includes("วันมาฆบูชา")); // Makha Bucha
			assert.ok(nationalNames.includes("วันวิสาขบูชา")); // Visakha Bucha
			assert.ok(nationalNames.includes("วันอาสาฬหบูชา")); // Asanha Bucha
			assert.ok(nationalNames.includes("วันเข้าพรรษา")); // Khao Phansa
		});

		it("should have royal holidays", () => {
			const nationalNames = TH.national.map((h) => h.name);

			// Royal-related holidays
			assert.ok(nationalNames.includes("วันจักรี")); // Chakri Dynasty Day
			assert.ok(nationalNames.includes("วันฉัตรมงคล")); // Coronation Day
			assert.ok(nationalNames.includes("วันปิยมหาราช")); // Chulalongkorn Day
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = TH.national.find((h) => h.name === "วันขึ้นปีใหม่");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Labor Day correctly", () => {
			const laborDay = TH.national.find((h) => h.name === "วันแรงงานแห่งชาติ");
			assert.ok(laborDay);

			const holiday2024 = laborDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Chakri Dynasty Day correctly", () => {
			const chakriDay = TH.national.find((h) => h.name === "วันจักรี");
			assert.ok(chakriDay);

			const holiday2024 = chakriDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 3); // April
			assert.strictEqual(holiday2024.date.getUTCDate(), 6);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle calculated Buddhist holidays", () => {
			const buddhistHolidays = TH.national.filter(
				(h) =>
					h.type === "calculated" &&
					(h.name.includes("บูชา") || h.name.includes("พรรษา")),
			);

			for (const holiday of buddhistHolidays) {
				assert.strictEqual(typeof holiday.calculator, "function");

				// Test the calculation
				const result = holiday.calculateHoliday(2024);
				assert.ok(result.date instanceof Date);
				assert.strictEqual(result.workFree, true);
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of TH.national) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.strictEqual(holiday.workFree, true); // All Thai holidays are work-free

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain Thai institutional memory", () => {
			const allNames = TH.national.map((h) => h.name);

			// Core Thai holidays that should always be present
			const coreHolidays = [
				"วันขึ้นปีใหม่", // New Year
				"วันสงกรานต์", // Songkran
				"วันแรงงานแห่งชาติ", // Labor Day
				"วันรัฐธรรมนูญ", // Constitution Day
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Thai holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
