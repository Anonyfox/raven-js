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
import { IT } from "./IT.js";

describe("Italian holiday definitions (IT)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof IT === "object");
			assert.ok(Array.isArray(IT.national));
			assert.ok(typeof IT.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(IT.national.length > 0);

			for (const holiday of IT.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 11 national holidays", () => {
			// Italy has 11 official national holidays
			assert.strictEqual(IT.national.length, 11);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = IT.national.map((h) => h.name);

			const expectedHolidays = [
				"Capodanno",
				"Epifania del Signore",
				"Festa della Liberazione",
				"Lunedì dell'Angelo",
				"Festa dei Lavoratori",
				"Festa della Repubblica",
				"Assunzione di Maria Vergine",
				"Ognissanti",
				"Immacolata Concezione",
				"Natale del Signore",
				"Santo Stefano",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate Republic Day correctly", () => {
			const republicDay = IT.national.find(
				(h) => h.name === "Festa della Repubblica",
			);
			assert.ok(republicDay);

			const holiday2024 = republicDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 5); // June
			assert.strictEqual(holiday2024.date.getUTCDate(), 2);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			const allHolidays = [
				...IT.national,
				...Object.values(IT.regional).flat(),
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
