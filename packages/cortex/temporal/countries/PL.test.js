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
import { PL } from "./PL.js";

describe("Polish holiday definitions (PL)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof PL === "object");
			assert.ok(Array.isArray(PL.national));
			assert.ok(typeof PL.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(PL.national.length > 0);

			for (const holiday of PL.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 13 national holidays", () => {
			// Poland has 13 official public holidays
			assert.strictEqual(PL.national.length, 13);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = PL.national.map((h) => h.name);

			const expectedHolidays = [
				"Nowy Rok",
				"Święto Trzech Króli",
				"Wielkanoc",
				"Poniedziałek Wielkanocny",
				"Święto Pracy",
				"Święto Konstytucji 3 Maja",
				"Zielone Świątki",
				"Boże Ciało",
				"Wniebowzięcie Najświętszej Maryi Panny",
				"Wszystkich Świętych",
				"Święto Niepodległości",
				"Boże Narodzenie",
				"Święty Szczepan",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate Independence Day correctly", () => {
			const independenceDay = PL.national.find(
				(h) => h.name === "Święto Niepodległości",
			);
			assert.ok(independenceDay);

			const holiday2024 = independenceDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 10); // November
			assert.strictEqual(holiday2024.date.getUTCDate(), 11);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate Constitution Day correctly", () => {
			const constitutionDay = PL.national.find(
				(h) => h.name === "Święto Konstytucji 3 Maja",
			);
			assert.ok(constitutionDay);

			const holiday2024 = constitutionDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 3);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of PL.national) {
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
