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
import { VN } from "./VN.js";

describe("Vietnamese holiday definitions (VN)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof VN === "object");
			assert.ok(Array.isArray(VN.national));
			assert.ok(typeof VN.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(VN.national.length > 0);

			for (const holiday of VN.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 11 national holidays", () => {
			// Vietnam has 11 official national holidays
			assert.strictEqual(VN.national.length, 11);
		});

		it("should have no regional variations", () => {
			// Vietnam has unified national holiday system
			const regions = Object.keys(VN.regional);
			assert.strictEqual(regions.length, 0);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = VN.national.map((h) => h.name);

			const _expectedHolidays = [
				"Tết Dương lịch", // New Year's Day
				"Tết Nguyên đán", // Tet (5 days)
				"Giỗ tổ Hùng Vương", // Hung Kings' Commemoration Day
				"Ngày Giải phóng miền Nam", // Liberation Day
				"Ngày Quốc tế Lao động", // International Labor Day
				"Quốc khánh", // National Day (2 days)
			];

			// Check some key holidays
			assert.ok(nationalNames.includes("Tết Dương lịch"));
			assert.ok(nationalNames.includes("Tết Nguyên đán"));
			assert.ok(nationalNames.includes("Giỗ tổ Hùng Vương"));
			assert.ok(nationalNames.includes("Ngày Giải phóng miền Nam"));
			assert.ok(nationalNames.includes("Ngày Quốc tế Lao động"));
			assert.ok(nationalNames.includes("Quốc khánh"));
		});

		it("should have Tet celebration (5 days)", () => {
			const tetHolidays = VN.national.filter(
				(h) => h.name === "Tết Nguyên đán",
			);

			assert.strictEqual(tetHolidays.length, 5); // 5 days of Tet
		});

		it("should have National Day celebration (2 days)", () => {
			const nationalDayHolidays = VN.national.filter(
				(h) => h.name === "Quốc khánh",
			);

			assert.strictEqual(nationalDayHolidays.length, 2); // 2 days
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = VN.national.find((h) => h.name === "Tết Dương lịch");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Liberation Day correctly", () => {
			const liberationDay = VN.national.find(
				(h) => h.name === "Ngày Giải phóng miền Nam",
			);
			assert.ok(liberationDay);

			const holiday2024 = liberationDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 3); // April
			assert.strictEqual(holiday2024.date.getUTCDate(), 30);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Labor Day correctly", () => {
			const laborDay = VN.national.find(
				(h) => h.name === "Ngày Quốc tế Lao động",
			);
			assert.ok(laborDay);

			const holiday2024 = laborDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate National Day correctly", () => {
			const nationalDays = VN.national.filter((h) => h.name === "Quốc khánh");
			assert.strictEqual(nationalDays.length, 2);

			// September 2
			const nationalDay1 = nationalDays.find((h) => {
				const result = h.calculateHoliday(2024);
				return result.date.getUTCDate() === 2;
			});
			assert.ok(nationalDay1);

			const holiday1 = nationalDay1.calculateHoliday(2024);
			assert.strictEqual(holiday1.date.getUTCMonth(), 8); // September
			assert.strictEqual(holiday1.date.getUTCDate(), 2);

			// September 3
			const nationalDay2 = nationalDays.find((h) => {
				const result = h.calculateHoliday(2024);
				return result.date.getUTCDate() === 3;
			});
			assert.ok(nationalDay2);

			const holiday2 = nationalDay2.calculateHoliday(2024);
			assert.strictEqual(holiday2.date.getUTCMonth(), 8); // September
			assert.strictEqual(holiday2.date.getUTCDate(), 3);
		});

		it("should handle calculated holidays", () => {
			const calculatedHolidays = VN.national.filter(
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
			for (const holiday of VN.national) {
				// Name should be non-empty string
				assert.strictEqual(typeof holiday.name, "string");
				assert.ok(holiday.name.length > 0);

				// WorkFree should be boolean
				assert.strictEqual(typeof holiday.workFree, "boolean");
				assert.strictEqual(holiday.workFree, true); // All Vietnamese holidays are work-free

				// Type should be valid
				assert.ok(
					["fixed", "easter_relative", "calculated"].includes(holiday.type),
				);
			}
		});

		it("should maintain Vietnamese institutional memory", () => {
			const allNames = VN.national.map((h) => h.name);

			// Core Vietnamese holidays that should always be present
			const coreHolidays = [
				"Tết Dương lịch", // New Year
				"Tết Nguyên đán", // Tet
				"Ngày Giải phóng miền Nam", // Liberation Day
				"Quốc khánh", // National Day
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Vietnamese holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
