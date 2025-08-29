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
import { BE } from "./BE.js";

describe("Belgian holiday definitions (BE)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof BE === "object");
			assert.ok(Array.isArray(BE.national));
			assert.ok(typeof BE.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(BE.national.length > 0);

			for (const holiday of BE.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 10 national holidays", () => {
			// Belgium has 10 official national holidays
			assert.strictEqual(BE.national.length, 10);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = BE.national.map((h) => h.name);

			const expectedHolidays = [
				"Nieuwjaar",
				"Paasmaandag",
				"Dag van de Arbeid",
				"Hemelvaart",
				"Pinkstermaandag",
				"Nationale Feestdag",
				"Onze-Lieve-Vrouw-Hemelvaart",
				"Allerheiligen",
				"Wapenstilstand",
				"Kerstmis",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate National Day correctly", () => {
			const nationalDay = BE.national.find(
				(h) => h.name === "Nationale Feestdag",
			);
			assert.ok(nationalDay);

			const holiday2024 = nationalDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 6); // July
			assert.strictEqual(holiday2024.date.getUTCDate(), 21);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...BE.national,
				...Object.values(BE.regional).flat(),
			];

			for (const holiday of allHolidays) {
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
