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
import { KR } from "./KR.js";

describe("South Korean holiday definitions (KR)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof KR === "object");
			assert.ok(Array.isArray(KR.national));
			assert.ok(typeof KR.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(KR.national.length > 0);

			for (const holiday of KR.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 16 national holidays", () => {
			// South Korea has 16 official holidays
			assert.strictEqual(KR.national.length, 16);
		});

		it("should have no regional variations", () => {
			// South Korea has unified national holiday system
			const regions = Object.keys(KR.regional);
			assert.strictEqual(regions.length, 0);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = KR.national.map((h) => h.name);

			const expectedHolidays = [
				"신정", // New Year's Day
				"설날 전날", // Lunar New Year Eve
				"설날", // Lunar New Year
				"설날 다음날", // Lunar New Year Day 2
				"삼일절", // Independence Movement Day
				"부처님 오신 날", // Buddha's Birthday
				"어린이날", // Children's Day
				"현충일", // Memorial Day
				"제헌절", // Constitution Day
				"광복절", // Liberation Day
				"추석 전날", // Chuseok Eve
				"추석", // Chuseok
				"추석 다음날", // Chuseok Day 2
				"개천절", // National Foundation Day
				"한글날", // Hangul Day
				"크리스마스", // Christmas Day
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should have Seollal (Lunar New Year) cluster", () => {
			const nationalNames = KR.national.map((h) => h.name);

			const seollalHolidays = ["설날 전날", "설날", "설날 다음날"];

			for (const holiday of seollalHolidays) {
				assert.ok(
					nationalNames.includes(holiday),
					`Missing Seollal holiday: ${holiday}`,
				);
			}
		});

		it("should have Chuseok cluster", () => {
			const nationalNames = KR.national.map((h) => h.name);

			const chuseokHolidays = ["추석 전날", "추석", "추석 다음날"];

			for (const holiday of chuseokHolidays) {
				assert.ok(
					nationalNames.includes(holiday),
					`Missing Chuseok holiday: ${holiday}`,
				);
			}
		});
	});

	describe("Holiday calculations", () => {
		it("should calculate New Year correctly", () => {
			const newYear = KR.national.find((h) => h.name === "신정");
			assert.ok(newYear);

			const holiday2024 = newYear.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 0); // January
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Independence Movement Day correctly", () => {
			const march1st = KR.national.find((h) => h.name === "삼일절");
			assert.ok(march1st);

			const holiday2024 = march1st.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 2); // March
			assert.strictEqual(holiday2024.date.getUTCDate(), 1);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Children's Day correctly", () => {
			const childrensDay = KR.national.find((h) => h.name === "어린이날");
			assert.ok(childrensDay);

			const holiday2024 = childrensDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 5);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Liberation Day correctly", () => {
			const liberationDay = KR.national.find((h) => h.name === "광복절");
			assert.ok(liberationDay);

			const holiday2024 = liberationDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 7); // August
			assert.strictEqual(holiday2024.date.getUTCDate(), 15);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should handle lunar calendar holidays", () => {
			const lunarHolidays = KR.national.filter((h) => h.type === "calculated");

			for (const holiday of lunarHolidays) {
				assert.strictEqual(typeof holiday.calculator, "function");

				// Test the calculation
				const result = holiday.calculateHoliday(2024);
				assert.ok(result.date instanceof Date);
			}
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of KR.national) {
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

		it("should maintain Korean institutional memory", () => {
			const allNames = KR.national.map((h) => h.name);

			// Core Korean holidays that should always be present
			const coreHolidays = [
				"신정", // New Year
				"설날", // Lunar New Year
				"삼일절", // Independence Movement Day
				"추석", // Chuseok
				"광복절", // Liberation Day
			];

			for (const coreHoliday of coreHolidays) {
				assert.ok(
					allNames.includes(coreHoliday),
					`Core Korean holiday missing: ${coreHoliday}`,
				);
			}
		});
	});
});
