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
import { NO } from "./NO.js";

describe("Norwegian holiday definitions (NO)", () => {
	describe("Structure validation", () => {
		it("should have proper structure", () => {
			assert.ok(typeof NO === "object");
			assert.ok(Array.isArray(NO.national));
			assert.ok(typeof NO.regional === "object");
		});

		it("should have national holidays as HolidayDefinition instances", () => {
			assert.ok(NO.national.length > 0);

			for (const holiday of NO.national) {
				assert.ok(holiday instanceof HolidayDefinition);
			}
		});

		it("should have 13 national holidays", () => {
			// Norway has 13 official public holidays
			assert.strictEqual(NO.national.length, 13);
		});
	});

	describe("Holiday validation", () => {
		it("should have expected national holidays", () => {
			const nationalNames = NO.national.map((h) => h.name);

			const expectedHolidays = [
				"Nyttårsdag",
				"Skjærtorsdag",
				"Langfredag",
				"Påskedag",
				"Andre påskedag",
				"Arbeidernes dag",
				"Grunnlovsdag",
				"Kristi himmelfartsdag",
				"Pinsedag",
				"Andre pinsedag",
				"Julaften",
				"Juledag",
				"Andre juledag",
			];

			for (const expected of expectedHolidays) {
				assert.ok(
					nationalNames.includes(expected),
					`Missing national holiday: ${expected}`,
				);
			}
		});

		it("should calculate Constitution Day correctly", () => {
			const constitutionDay = NO.national.find(
				(h) => h.name === "Grunnlovsdag",
			);
			assert.ok(constitutionDay);

			const holiday2024 = constitutionDay.calculateHoliday(2024);
			assert.strictEqual(holiday2024.date.getUTCMonth(), 4); // May
			assert.strictEqual(holiday2024.date.getUTCDate(), 17);
			assert.strictEqual(holiday2024.workFree, true);
		});
	});

	describe("Data consistency", () => {
		it("should have consistent holiday definitions", () => {
			for (const holiday of NO.national) {
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
