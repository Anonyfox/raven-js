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
import { FI } from "./FI.js";

describe("Finnish holiday definitions (FI)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof FI === "object");
			assert.ok(Array.isArray(FI.national));
			assert.ok(typeof FI.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(FI.national.length > 0);

			for (const holiday of FI.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 14 national holidays", () => {
			// Finland has 14 official public holidays
			assert.strictEqual(FI.national.length, 14);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = FI.national.map((h) => h.name);

			const expectedHolidays = [
				"Uudenvuodenpäivä",
				"Loppiainen",
				"Pitkäperjantai",
				"Pääsiäispäivä",
				"2. pääsiäispäivä",
				"Vappupäivä",
				"Helatorstai",
				"Helluntaipäivä",
				"Juhannuspäivä",
				"Itsenäisyyspäivä",
				"Jouluaatto",
				"Joulupäivä",
				"Tapaninpäivä",
				"Pyhäinpäivä",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate Independence Day correctly", () => {
			const independenceDay = FI.national.find(
				(h) => h.name === "Itsenäisyyspäivä",
			);
			assert.ok(independenceDay);

			const holiday2024 = independenceDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 11); // December
			assert.strictEqual(holiday2024.date.getUTCDate(), 6);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of FI.national) {
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
