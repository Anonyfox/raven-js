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
import { LU } from "./LU.js";

describe("Luxembourg holiday definitions (LU)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof LU === "object");
			assert.ok(Array.isArray(LU.national));
			assert.ok(typeof LU.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(LU.national.length > 0);

			for (const holiday of LU.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 11 national holidays", () => {
			// Luxembourg has 11 official public holidays
			assert.strictEqual(LU.national.length, 11);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = LU.national.map((h) => h.name);

			const expectedHolidays = [
				"Neijohrsdag",
				"Ouschtermëndeg",
				"Dag vun der Aarbecht",
				"Europadag",
				"Christi Himmelfaart",
				"Péngschtmëndeg",
				"Nationalfeierdag",
				"Léiffrawëschdag",
				"Allerhellgen",
				"Chrëschtdag",
				"Stiefesdag",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate Europe Day correctly", () => {
			const europeDay = LU.national.find((h) => h.name === "Europadag");
			assert.ok(europeDay);

			const holiday2024 = europeDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 9);
			assert.strictEqual(holiday2024.workFree, true);
		});

		it("should calculate National Day correctly", () => {
			const nationalDay = LU.national.find(
				(h) => h.name === "Nationalfeierdag",
			);
			assert.ok(nationalDay);

			const holiday2024 = nationalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 5); // June
			assert.strictEqual(holiday2024.date.getUTCDate(), 23);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of LU.national) {
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
